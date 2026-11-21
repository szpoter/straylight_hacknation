import { describe, expect, it } from "vitest";
import type { GenerationResult, ModelAnswer } from "@/lib/rag/answer";
import { loadCorpus } from "@/lib/rag/corpus-fs";
import type { Fragment } from "@/lib/rag/corpus";
import type { KnowledgeSearch, VectorSearchResult } from "@/lib/rag/retrieve";
import { AskService, UNAVAILABLE_MESSAGE, type AskServiceDeps } from "@/lib/zusik/ask-service";
import { applyMarta } from "@/lib/marta/case";
import { ProbeService } from "@/lib/zusik/service";
import { FlakySaver, MemoryCaseStore, MemoryTurnStore, fakeProviders } from "./helpers";

/**
 * Section 4 of PLAN-ETAP-1-KROK-2.md with controlled providers.
 * Shared store + turns + saver = "Neon"; a new service = a new process.
 */
const corpus = loadCorpus("marta");
const hit = (id: string, score = 0.88) => ({ logicalId: id, fragmentSha256: corpus.fragments.get(id)!.fragmentSha256, score });

const ODPIS_MODEL: ModelAnswer = {
  status: "answered",
  message: "",
  claims: [
    {
      text: "Jeśli odpis jest już w Twoich aktach osobowych, nie dołączasz go ponownie.",
      evidence: [{ id: "rozp-2025-322-par22", quote: "nie dołącza się dokumentów wymienionych w rozporządzeniu, jeżeli dokumenty te znajdują się w aktach osobowych pracownika" }],
    },
    {
      text: "Odpis lub jego kopia jest przewidzianym załącznikiem.",
      evidence: [{ id: "rozp-2025-322-par15-ust2-pkt1", quote: "odpis skrócony aktu urodzenia dziecka (dzieci)" }],
    },
  ],
};

function world(options: { search?: VectorSearchResult; model?: GenerationResult; slowModelMs?: number; readMarta?: AskServiceDeps["readMarta"] } = {}) {
  const store = new MemoryCaseStore();
  const turns = new MemoryTurnStore();
  const saver = new FlakySaver();
  const calls = { qdrant: 0, sherlock: 0 };
  const seen: { queries: string[]; prompts: string[] } = { queries: [], prompts: [] };
  const search: KnowledgeSearch = {
    async search({ query, expanded }) {
      calls.qdrant += 1;
      seen.queries.push(query, expanded ?? "");
      return options.search ?? { status: "ok", hits: [hit("rozp-2025-322-par15-ust2-pkt1")], ms: 9 };
    },
  };
  const generate = async (question: string, evidence: Fragment[]): Promise<GenerationResult> => {
    calls.sherlock += 1;
    seen.prompts.push(question, ...evidence.map((f) => f.logicalId));
    if (options.slowModelMs) await new Promise((r) => setTimeout(r, options.slowModelMs));
    return options.model ?? { status: "ok", output: ODPIS_MODEL, model: "bielik-test", ms: 30 };
  };
  const ask = () => new AskService({ store, turns, corpus, search, generate, readMarta: options.readMarta, asOf: () => "2026-11-21", pendingWaitMs: 2_000 });
  const probe = () => {
    const fake = fakeProviders();
    return new ProbeService({ store, turns, checkpointer: saver, providers: fake.providers, leaseWaitMs: 2_000 });
  };
  return { store, turns, calls, seen, ask, probe };
}

const Q_ODPIS = "Kadry mają już odpis aktu Oli w moich aktach. Mam dać drugi?";

describe("stage 1 step 2 — POST /api/zusik/ask contract", () => {
  it("explains the saved calculator inputs, separates the legal deadline and preserves missing rates", async () => {
    const view = applyMarta(null, { type: "compare", version: 0, firstStart: "2027-02-10", days: 3,
      firstDaily: 123.45, secondDaily: null, firstName: "Anna", secondName: "Jan", childName: "Iga" }).view;
    const w = world({ readMarta: async session => ({ view: session === "calculator" ? view : null }) });
    const result = await w.ask().ask("calculator", "Skąd są te dane?", "req-case-context");
    const message = result.turn?.message.replace(/\s/g, " ");
    expect(message).toContain("Anna — 3 dni × 123,45 zł dziennie = 370,35 zł brutto");
    expect(message).toContain("Jan — brakuje stawki");
    expect(message).toContain("2027-02-10");
    expect(result.turn?.citations.map(c => c.fragmentId)).toEqual(["kp-art182-1d-par1"]);
    expect(result.turn?.claims.map(c => c.text).join(" ")).not.toMatch(/123|370|brutto/u);
    const fresh = await w.ask().ask("fresh", "Skąd te kwoty?", "req-case-context");
    expect(fresh.turn?.message).toMatch(/przykładowe dane rodziny/u);
    expect(fresh.turn?.message).not.toContain("Anna");
    expect(w.calls).toEqual({ sherlock: 0, qdrant: 0 });
  });

  it("reuses only the immediately preceding turn's saved citations, including after a restart", async () => {
    const w = world();
    const first = await w.ask().ask("m", Q_ODPIS, "req-original");
    const follow = await w.ask().ask("m", "Skąd są te dane?", "req-followup");
    expect(follow.turn?.citations).toEqual(first.turn?.citations);
    expect(follow.turn?.claims).toEqual(first.turn?.citations.map(c => ({ text: c.quote, citationIds: [c.id] })));
    await w.ask().ask("m", "Co trzeba wysłać?", "req-no-citation");
    const absent = await w.ask().ask("m", "Pokaż źródła", "req-followup-empty");
    expect(absent.turn).toMatchObject({ status: "insufficient_evidence", citations: [], message: expect.stringContaining("nie było cytatu") });
    const other = await w.ask().ask("other", "Pokaż źródła", "req-followup");
    expect(other.turn?.citations).toEqual([]);
    expect(w.calls).toEqual({ sherlock: 1, qdrant: 1 });
  });

  it("explains a calculator total requested explicitly after a legal answer, including a zero rate", async () => {
    const view = applyMarta(null, { type: "compare", version: 0, firstStart: "2027-01-11", days: 4,
      firstDaily: 0, secondDaily: 51.25, firstName: "Anna", secondName: "Jan", childName: "Iga" }).view;
    const w = world({ readMarta: async () => ({ view }) });
    await w.ask().ask("m", Q_ODPIS, "req-law");
    const { turn } = await w.ask().ask("m", "Skąd są te kwoty?", "req-total");
    expect(turn?.message.replace(/\s/g, " ")).toContain("Łączna kwota z kalkulatora wynosi 205,00 zł brutto");
    expect(turn?.message).not.toContain("brakuje");
    expect(w.calls).toEqual({ sherlock: 1, qdrant: 1 });
  });

  it.each([
    ["Skąd są te dane?", 1, "case"],
    ["Skąd są te dane?", -1, "previous"],
    ["Pokaż źródła z poprzedniej odpowiedzi", 1, "previous"],
  ] as const)("resolves %s with a checkpoint offset of %d ms to %s", async (question, offset, expected) => {
    const view = applyMarta(null, { type: "compare", version: 0, firstStart: "2027-02-01", days: 2,
      firstDaily: 101, secondDaily: 99, firstName: "Anna", secondName: "Jan", childName: "Iga" }).view;
    let savedAt: string | undefined;
    const w = world({ readMarta: async () => ({ view, savedAt }) });
    const law = await w.ask().ask("m", Q_ODPIS, "req-law");
    savedAt = new Date(Date.parse(law.turn!.completedAt!) + offset).toISOString();
    const { turn } = await w.ask().ask("m", question, "req-after-change");
    if (expected === "case") {
      expect(turn?.message.replace(/\s/g, " ")).toContain("400,00 zł brutto");
      expect(turn?.citations.map(c => c.fragmentId)).toEqual(["kp-art182-1d-par1"]);
    } else {
      expect(turn?.citations).toEqual(law.turn?.citations);
    }
    expect(w.calls).toEqual({ sherlock: 1, qdrant: 1 });
  });

  it("emits progress for work performed and publishes the checked turn before saving", async () => {
    const w = world();
    const events: string[] = [];
    const res = await w.ask().ask("m", Q_ODPIS, "req-progress", s => events.push(s), turn => {
      expect(turn.citations[0].fragmentId).toBe("rozp-2025-322-par22");
      events.push("verified");
    });
    expect(events).toEqual(["Sprawdzam kontekst pytania…", "Szukam w źródłach urzędowych…",
      "Przygotowuję odpowiedź na podstawie źródeł…", "Sprawdzam cytaty i podstawę odpowiedzi…",
      "Zapisuję odpowiedź w rozmowie…", "verified"]);
    const onRetry = () => { throw new Error("cached answer ran the pipeline again"); };
    expect((await w.ask().ask("m", Q_ODPIS, "req-progress", onRetry, onRetry)).turn).toEqual(res.turn);
  });
  it("answers with verified citations, saves the turn, and F5 reads it without providers", async () => {
    const w = world();
    const res = await w.ask().ask("session-marta", Q_ODPIS, "req-odpis-0001");
    expect(res.status).toBe(200);
    const turn = res.turn!;
    expect(turn).toMatchObject({ status: "answered", requestId: "req-odpis-0001", question: Q_ODPIS, corpusVersion: "marta-v1" });
    expect(turn.claims.map((c) => c.citationIds)).toEqual([["c1"], ["c2"]]);
    expect(turn.citations.map((c) => c.locator)).toEqual(["§ 22", "§ 15 ust. 2 pkt 1"]);
    expect(w.calls).toEqual({ qdrant: 1, sherlock: 1 });

    // F5 on a new process: GET state returns the saved turn, no provider calls.
    const view = await w.probe().getView("session-marta");
    expect(view.turns).toEqual([turn]);
    expect(w.calls).toEqual({ qdrant: 1, sherlock: 1 });
  });

  it("sends no names to providers and hands the model the § 22 exception", async () => {
    const w = world();
    await w.ask().ask("s", "Co wpisać o Pawle, skoro też bierze urlop? Ola ma PESEL 26050412345", "req-pawel-0001");
    const outbound = [...w.seen.queries, ...w.seen.prompts].join("\n");
    expect(outbound).not.toMatch(/Paw|Ola|Oli|26050412345/);
    expect(w.seen.prompts).toContain("rozp-2025-322-par22");
  });

  it("retry with the same requestId returns the saved answer; different text → 409", async () => {
    const w = world();
    const first = await w.ask().ask("s", Q_ODPIS, "req-same-0001");
    const retry = await w.ask().ask("s", Q_ODPIS, "req-same-0001");
    expect(retry).toMatchObject({ status: 200, turn: first.turn });
    expect(w.calls.sherlock).toBe(1);
    const conflict = await w.ask().ask("s", "Czy mogę oddać Pawłowi moje 9 tygodni?", "req-same-0001");
    expect(conflict.status).toBe(409);
    expect((await w.turns.list((await w.store.findBySession("s"))!.threadId)).length).toBe(1);
  });

  it("two simultaneous identical requests produce one model call and one saved turn", async () => {
    const w = world({ slowModelMs: 150 });
    const service = w.ask();
    const [a, b] = await Promise.all([service.ask("s", Q_ODPIS, "req-dbl-00001"), service.ask("s", Q_ODPIS, "req-dbl-00001")]);
    expect([a.status, b.status]).toEqual([200, 200]);
    expect(a.turn).toEqual(b.turn);
    expect(w.calls.sherlock).toBe(1);
  });

  it("keeps turns in conversation order and isolates sessions", async () => {
    const w = world();
    await w.ask().ask("marta", "Pierwsze pytanie o odpis?", "req-order-001");
    await w.ask().ask("marta", "Drugie pytanie o odpis?", "req-order-002");
    await w.ask().ask("other", "Pytanie innej osoby o odpis?", "req-order-001");
    const marta = await w.probe().getView("marta");
    expect(marta.turns.map((t) => t.question)).toEqual(["Pierwsze pytanie o odpis?", "Drugie pytanie o odpis?"]);
    const other = await w.probe().getView("other");
    expect(other.turns.map((t) => t.question)).toEqual(["Pytanie innej osoby o odpis?"]);
    expect((await w.probe().getView("nobody")).turns).toEqual([]);
  });

  it("does not move the choice interrupt of step 1", async () => {
    const w = world();
    const before = (await w.probe().start("marta")).view;
    expect(before.state).toBe("awaiting_choice");
    await w.ask().ask("marta", Q_ODPIS, "req-graph-001");
    const after = await w.probe().getView("marta");
    expect(after).toMatchObject({ state: "awaiting_choice", checkpointId: before.checkpointId, interruptId: before.interruptId });
    expect(after.turns).toHaveLength(1);
    const resumed = await w.probe().resume("marta", "razem", before.checkpointId!);
    expect(resumed.view).toMatchObject({ state: "completed", choice: "razem" });
    expect(resumed.view.turns).toHaveLength(1);
  });

  it("an old case without turns reads as an empty list", async () => {
    const w = world();
    const view = (await w.probe().start("old-case")).view;
    expect(view.turns).toEqual([]);
  });

  describe("statuses and failures", () => {
    it("amount question → insufficient_evidence without calling providers", async () => {
      const w = world();
      const res = await w.ask().ask("s", "Ile dostaniemy na konto?", "req-amount-01");
      expect(res.turn).toMatchObject({ status: "insufficient_evidence", claims: [], citations: [] });
      expect(res.turn!.message).toMatch(/nie wystarczają/);
      expect(w.calls).toEqual({ qdrant: 0, sherlock: 0 });
    });

    it("context-free 'Co trzeba wysłać?' → one clarifying question", async () => {
      const w = world();
      const res = await w.ask().ask("s", "Co trzeba wysłać?", "req-clarify-1");
      expect(res.turn).toMatchObject({ status: "needs_clarification", message: "Pytasz o wniosek o urlop do pracodawcy czy o wypłatę zasiłku?" });
    });

    it.each([
      ["Qdrant error", { search: { status: "error", hits: [], ms: 5 } as VectorSearchResult }],
      ["Bielik timeout without an applicable reviewed excerpt", { model: { status: "timeout", output: null, model: "bielik-test", ms: 18000 } as GenerationResult }],
      ["Bielik invalid JSON without an applicable reviewed excerpt", { model: { status: "invalid_json", output: null, model: "bielik-test", ms: 900 } as GenerationResult }],
    ])("%s → 503 unavailable, nothing saved, retry with same id works", async (_name, failure) => {
      const w = world(failure);
      const question = _name.includes("without an applicable") ? "Czy mogę wysłać to elektronicznie?" : Q_ODPIS;
      const res = await w.ask().ask("s", question, "req-outage-01");
      expect(res.status).toBe(503);
      expect(res.turn).toMatchObject({ status: "unavailable", message: UNAVAILABLE_MESSAGE, claims: [] });
      const threadId = (await w.store.findBySession("s"))!.threadId;
      expect(await w.turns.list(threadId)).toEqual([]);

      const retry = await new AskService({
        store: w.store,
        turns: w.turns,
        corpus,
        search: { search: async () => ({ status: "ok", hits: [hit("rozp-2025-322-par15-ust2-pkt1")], ms: 3 }) },
        generate: async () => ({ status: "ok", output: ODPIS_MODEL, model: "bielik-test", ms: 3 }),
        asOf: () => "2026-11-21",
      }).ask("s", question, "req-outage-01");
      expect(retry.status).toBe(200);
      expect(retry.turn!.status).toBe("answered");
    });

    it("no vector hit → insufficient_evidence without asking the model", async () => {
      const w = world({ search: { status: "ok", hits: [], ms: 4 } });
      const res = await w.ask().ask("s", "Jak złożyć wniosek o zasiłek pogrzebowy?", "req-nohit-001");
      expect(res.turn!.status).toBe("insufficient_evidence");
      expect(w.calls.sherlock).toBe(0);
    });

    it("Neon write failure surfaces as an error and the claim is released", async () => {
      const w = world();
      w.turns.failComplete = true;
      await expect(w.ask().ask("s", Q_ODPIS, "req-neon-0001")).rejects.toThrow();
      w.turns.failComplete = false;
      const retry = await w.ask().ask("s", Q_ODPIS, "req-neon-0001");
      expect(retry.status).toBe(200);
    });
  });
});
