import { describe, expect, it, vi } from "vitest";
import { searchCorpus } from "../src/lib/rag/corpus-search";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { publicQueueEvidence } from "../src/lib/rag/local-queue";
import { publicQuestion } from "../src/lib/rag/public-query";
import { AskService, answerQuestion, type AskServiceDeps } from "../src/lib/zusik/ask-service";
import { MemoryCaseStore, MemoryTurnStore } from "./helpers";

const corpus = loadCorpus("publiczne");
const makeDeps = (): AskServiceDeps => ({
  corpus, selectCorpus: loadCorpus, searchCorpus, store: new MemoryCaseStore(), turns: new MemoryTurnStore(),
  search: { search: vi.fn<AskServiceDeps["search"]["search"]>(async ({query}) => {
    const id = query.includes("alkoholu") ? "uz-16-1" : "uz-15-1";
    return {status:"ok", ms:1,hits:[{logicalId:id, score:0.85, fragmentSha256:corpus.fragments.get(id)!.fragmentSha256}]};
  }) },
  generate: vi.fn<AskServiceDeps["generate"]>(async (question, evidence) => {
    expect(publicQueueEvidence(corpus, question, evidence)).toEqual(evidence);
    const f = evidence[0], quote = f.sourceText;
    return {model:"test", status:"ok", ms:1, output:{status:"answered",message:"",claims:[{text:quote, evidence:[{id:f.logicalId,quote}]}]}};
  }),
});

describe("whole public corpus", () => {
  it("finds a specific provision beyond the presets and sends only official vocabulary to both providers", async () => {
    const deps = makeDeps();
    const result = await answerQuestion(deps, "Czy nadużycie alkoholu wpływa na chorobowe? Alicja Prywatna, 01020345678.");
    expect(result.answer.citations.map(c => c.fragmentId)).toEqual(["uz-16-1"]);
    expect(result.answer.claims[0].text).toContain("5 dni");
    expect(result.trace.sanitized).toContain("alkoholu");
    expect(JSON.stringify(vi.mocked(deps.search.search).mock.calls)).not.toMatch(/Alicja|Prywatna|01020345678/i);
    expect(JSON.stringify(vi.mocked(deps.generate).mock.calls.map(call => call[0]))).not.toMatch(/Alicja|Prywatna|01020345678/i);
  });

  it("restores a non-preset subject from stored evidence and answers the next facet", async () => {
    const deps = makeDeps();
    const first = await new AskService(deps).ask("owner", "Czy są skutki popełnienia umyślnego przestępstwa dla wypłaty zasiłku?", "first");
    expect(first.turn?.citations[0]?.fragmentId).toBe("uz-15-1");
    const next = await new AskService(deps).ask("owner", "A kto to poświadcza?", "next");
    expect(next.trace?.contextRequestId).toBe("first");
    expect(next.turn?.publicQuery).toContain("potwierdza");
    expect(next.turn?.citations[0]?.fragmentId).toBe("uz-15-1");
    const other = await new AskService(deps).ask("stranger", "A kto to poświadcza?", "next");
    expect(other.turn?.status).not.toBe("answered");
  });

  it("switches from the rule for the percentage to the provision on proof", async () => {
    const deps = makeDeps();
    deps.search.search = async ({query}) => {
      const id = query.includes("chorobowy") ? "uz-11-1" : "uz-53-2";
      return {status:"ok",ms:1,hits:[{logicalId:id,score:0.8,fragmentSha256:corpus.fragments.get(id)!.fragmentSha256}]};
    };
    const subject = "Czy badania kandydata na dawcę tkanek zmieniają procent zasiłku chorobowego?";
    const first = await new AskService(deps).ask("owner", subject, "first");
    expect(first.turn?.citations[0]?.fragmentId).toBe("uz-11-1");
    const follow = await new AskService(deps).ask("owner", "A jak lekarz ma to poświadczyć?", "next");
    expect(follow.trace?.contextRequestId).toBe("first");
    expect(follow.turn?.citations[0]?.fragmentId).toBe("uz-53-2");
  });

  it("requires a corroborating Qdrant hit with the same hash and rejects unrelated questions", async () => {
    const deps = makeDeps();
    const q = "Czy nadużycie alkoholu wpływa na chorobowe?";
    const plan = searchCorpus(q, publicQuestion(q));
    expect(plan?.fragmentId).toBe("uz-16-1");
    const f = corpus.fragments.get("uz-16-1")!;
    expect(publicQueueEvidence(corpus, plan!.question + " Prywatne", [f])).toBeNull();
    expect(publicQueueEvidence(corpus, plan!.question, [{...f}])).toBeNull();
    deps.search.search = vi.fn<AskServiceDeps["search"]["search"]>(async () => ({status:"ok",ms:1,hits:[{logicalId:f.logicalId,fragmentSha256:"stale",score:1}]}));
    expect((await answerQuestion(deps,q)).answer.status).toBe("insufficient_evidence");
    expect((await answerQuestion(deps,"Czy możecie naprawić przebitą dętkę hulajnogi?")).answer.status).toBe("insufficient_evidence");
    const unsupported = await answerQuestion(deps, "Czy zwolnienie chorobowe obejmuje awarię hulajnogi po pęknięciu opony?");
    expect(unsupported.answer.status).toBe("needs_clarification");
    expect(unsupported.trace.calls.qdrant).toBe(0);
    expect(deps.generate).not.toHaveBeenCalled();
  });
});
