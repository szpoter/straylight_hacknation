import { describe, expect, it, vi } from "vitest";
import { loadCorpus } from "@/lib/rag/corpus-fs";
import { citationUrl } from "@/lib/rag/corpus";
import { validateAnswer } from "@/lib/rag/answer";
import { publicQuestion } from "@/lib/rag/public-query";
import { assembleEvidence } from "@/lib/rag/retrieve";
import { answerQuestion } from "@/lib/zusik/ask-service";

const corpus = loadCorpus("publiczne");

describe("public knowledge partitions", () => {
  it("loads primary law for both the current and earlier title and distinguishes the pregnancy rate", () => {
    for (const [id, page, phrase] of [
      ["uz-art6-ust1", 4, "w czasie trwania ubezpieczenia"],
      ["uz-art7", 4, "po ustaniu tytułu"],
      ["uz-art11-ust2-pkt1", 5, "przypada w okresie ciąży"],
      ["uz-art13-ust1", 6, "nie przysługuje za okres po ustaniu"],
    ] as const) {
      const fragment = corpus.fragments.get(id)!;
      expect(citationUrl(corpus, fragment)).toBe(`https://eli.gov.pl/api/acts/DU/2026/854/text.pdf#page=${page}`);
      expect(fragment.sourceText).toContain(phrase);
    }
    expect(corpus.fragments.get("rz-par33-ust1")?.sourceText).toContain("przed terminem rozpoczęcia");
    expect(corpus.fragments.has("rz-39-1")).toBe(false);
    expect(loadCorpus("oferta").fragments.size).toBe(3);
  });

  it("does not send personal input to either hosted service and selects evidence for the correct title", async () => {
    const seen: string[] = [];
    const fragment = corpus.fragments.get("rz-par33-ust1")!;
    const result = await answerQuestion({
      corpus: loadCorpus("marta"), selectCorpus: loadCorpus,
      search: { search: async ({ query, corpusVersion }) => {
        seen.push(query);
        expect(corpusVersion).toBe(corpus.manifest.corpusVersion);
        return { status: "ok", ms: 0, hits: [{ logicalId: fragment.logicalId, fragmentSha256: fragment.fragmentSha256, score: 0.9 }] };
      } },
      generate: async (query, evidence, activeCorpus) => {
        seen.push(query, ...evidence.map((f) => f.sourceText));
        expect(activeCorpus).toBe(corpus);
        return { status: "ok", ms: 0, model: "test", output: { status: "insufficient_evidence", message: "", claims: [] } };
      },
    }, "Prowadzę firmę Testowe Miasteczko, Alicja Przykład, 01020345678. Kiedy złożyć wniosek za okres ojcowskiego?");
    expect(seen.join(" ")).not.toMatch(/Alicja|Miasteczko|Przykład|01020345678/);
    expect(result.trace.evidenceIds).toContain("rz-par33-ust1");
    expect(result.trace.calls).toEqual({ qdrant: 1, sherlock: 1 });
  });

  it("requires a title before giving a paternity deadline and abstains outside public knowledge", async () => {
    const fail = vi.fn((): never => { throw new Error("unexpected call"); });
    const deps = { corpus, selectCorpus: loadCorpus, search: { search: fail }, generate: fail };
    expect((await answerQuestion(deps, "Kiedy złożyć wniosek o ojcowski?")).answer.status).toBe("needs_clarification");
    expect((await answerQuestion(deps, "Gdzie kupić opony?")).answer.status).toBe("insufficient_evidence");
    expect(fail).not.toHaveBeenCalled();
    expect(publicQuestion("Kadry nie mają odpisu. Czy złożyć?")?.question).toContain("brakuje");
    expect(publicQuestion("Do kiedy mam złożyć na etacie wniosek o urlop ojcowski?")?.locators).toEqual(["kp:1823"]);
  });

  it("abstains before generation when the only remotely retrieved evidence concerns a birth certificate", async () => {
    const wrong = corpus.fragments.get("rz-par33-ust1")!;
    const generate = vi.fn((): never => { throw new Error("Off-topic source reached the model"); });
    const { answer, trace } = await answerQuestion({
      corpus, selectCorpus: loadCorpus, generate,
      search: { search: async () => ({ status: "ok", ms: 0, hits: [{ logicalId: wrong.logicalId, fragmentSha256: wrong.fragmentSha256, score: 0.99 }] }) },
    }, "Czy samo zwolnienie lekarskie wystarcza do zasiłku chorobowego?");
    expect(answer).toMatchObject({ status: "insufficient_evidence", citations: [] });
    expect(trace.vectorIds).toEqual([wrong.logicalId]);
    expect(trace.evidenceIds).toEqual([]);
    expect(generate).not.toHaveBeenCalled();
  });

  it("rejects the model's authentic but irrelevant quote even when relevant law was also retrieved", async () => {
    const wrong = corpus.fragments.get("rz-par33-ust1")!;
    const right = corpus.fragments.get("uz-art6-ust1")!;
    const { answer, trace } = await answerQuestion({
      corpus, selectCorpus: loadCorpus,
      search: { search: async () => ({ status: "ok", ms: 0, hits: [right, wrong].map(f => ({ logicalId:f.logicalId, fragmentSha256:f.fragmentSha256,score:0.98 })) }) },
      generate: async (_q, evidence) => {
        expect(evidence.map(f => f.logicalId)).not.toContain(wrong.logicalId);
        return { status:"ok", ms:0, model:"off-topic", output:{ status:"answered", message:"", claims:[{
          text:"Odpis aktu potwierdza prawo do zasiłku chorobowego.", evidence:[{id:wrong.logicalId, quote:"odpis skrócony aktu urodzenia dziecka"}],
        }] } };
      },
    }, "Czy samo zwolnienie lekarskie wystarcza do zasiłku chorobowego?");
    expect(trace.report?.rejectedEvidence).toContainEqual({ id:wrong.logicalId, reason:"unknown_id" });
    expect(answer.claims.map(c=>c.text).join(" ")).not.toContain("Odpis aktu");
    expect(answer.citations.some(c=>c.fragmentId===wrong.logicalId)).toBe(false);
  });

  it("quotes the retrieved law when the model is unavailable without inventing a personal decision", async () => {
    const f = corpus.fragments.get("uz-art6-ust1")!;
    const result = await answerQuestion({
      corpus, selectCorpus: loadCorpus,
      search: { search: async () => ({ status: "ok", ms: 0, hits: [{ logicalId: f.logicalId, fragmentSha256: f.fragmentSha256, score: 1 }] }) },
      generate: async () => ({ status: "timeout", output: null, ms: 0, model: "timeout" }),
    }, "Czy samo zwolnienie lekarskie wystarcza do zasiłku chorobowego?");
    expect(result.answer.status).toBe("answered");
    expect(result.answer.message).toContain("Cytuję");
    expect(result.answer.claims[0].text).toBe(f.sourceText);
  });

  it("replaces a paraphrase turning the post-coverage exception into a universal condition", async () => {
    const ordinary = corpus.fragments.get("uz-art6-ust1")!;
    const later = corpus.fragments.get("uz-art7")!;
    const result = await answerQuestion({
      corpus, selectCorpus: loadCorpus,
      search: { search: async () => ({ status: "ok", ms: 0, hits: [ordinary,later].map(f => ({logicalId:f.logicalId,fragmentSha256:f.fragmentSha256,score:0.9})) }) },
      generate: async () => ({ status:"ok", ms:0, model:"test", output:{ status:"answered", message:"", claims:[{
        text:"Niezdolność do pracy musi powstać po ustaniu ubezpieczenia.",
        evidence:[{id:later.logicalId,quote:"po ustaniu tytułu ubezpieczenia chorobowego"}],
      }] } }),
    }, "Czy samo zwolnienie lekarskie wystarcza do zasiłku chorobowego?");
    expect(result.trace.proposedStatus).toBe("answered");
    expect(result.trace.quoteReason).toBe("statutory_conditions");
    expect(result.answer.claims.map(c=>c.text)).toEqual([ordinary.sourceText, later.sourceText]);
    expect(result.answer.message).toContain("Cytuję");
  });

  it("drops an invented number and a verdict hidden in an uncited abstention message", () => {
    const fragment = corpus.fragments.get("uz-art6-ust1")!;
    const model = validateAnswer(corpus, [fragment], {
      status: "answered", message: "", claims: [{ text: "Masz 999 dni ochrony.",
        evidence: [{ id: fragment.logicalId, quote: "w czasie trwania ubezpieczenia chorobowego" }] }],
    });
    expect(model.answer.status).toBe("insufficient_evidence");
    const no = validateAnswer(corpus, [], { status: "insufficient_evidence", message: "Zasiłek za ten okres Ci nie przysługuje.", claims: [] });
    expect(no.answer.message).not.toContain("nie przysługuje");
  });

  it("preserves conditions or asks for a case when a date or a second title matters", () => {
    expect(publicQuestion("Czy miało to zastosowanie w styczniu 2024 roku?")?.clarify).toBeTruthy();
    expect(publicQuestion("Czy po podjęciu drugiej pracy zmienia się podstawa wymiaru chorobowego?")?.question).toMatch(/kilka tytułów/);
    expect(publicQuestion("Jak oblicza się zasiłek wyrównawczy?")?.question).toContain("zasiłek wyrównawczy");
  });

  it("requires at least one verified remote hit before expanding a known local locator", () => {
    const ev = assembleEvidence(corpus, [{ logicalId: "uz-art7", fragmentSha256: "0".repeat(64), score: 1 }],
      { asOf: "2026-11-21", locatorKeys: ["uz:7"] });
    expect(ev.items).toEqual([]);
  });
});
