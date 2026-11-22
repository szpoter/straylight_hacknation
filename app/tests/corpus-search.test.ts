import { describe, expect, it, vi } from "vitest";
import { searchCorpus } from "../src/lib/rag/corpus-search";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { publicQueueEvidence } from "../src/lib/rag/local-queue";
import { publicQuestion } from "../src/lib/rag/public-query";
import { qdrantKnowledgeSearch } from "../src/lib/rag/retrieve";
import { pointId } from "../src/lib/rag/corpus";
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
  it("fuses an actual lexical point with dense hits from active releases and drops stale or missing points", async () => {
    const q = "Czy podczas tymczasowego aresztowania można otrzymywać chorobowe?";
    const plan = searchCorpus(q, publicQuestion(q));
    const wanted = plan?.lexical?.[0];
    expect(wanted?.logicalId).toBe("uz-12-1");
    if (!wanted || !plan?.lexical) throw new Error("Missing ranked public evidence");
    const other = loadCorpus("oferta").fragments.get("dobry-start");
    if (!other) throw new Error("Missing fixture");
    const remote = (f: typeof wanted) => ({ id: pointId(f.corpusVersion, f.logicalId), score: 0.8,
      payload: { corpusVersion: f.corpusVersion, logicalId: f.logicalId, fragmentSha256: f.fragmentSha256 } });
    let found = [remote(wanted)];
    let denseAvailable = true;
    let pointsAvailable = true;
    const request: typeof fetch = async (input, init) => {
      const body = JSON.parse(String(init?.body));
      if (String(input).endsWith("/query")) {
        if (!denseAvailable) return new Response(null, {status:503});
        expect(body.query.text).toBe(plan.searchText);
        expect(body.filter.must[0].match.any).toHaveLength(3);
        return Response.json({ result: { points: [remote(other)] } });
      }
      if (!pointsAvailable) return new Response(null, {status:503});
      expect(body.ids).toContain(pointId(wanted.corpusVersion, wanted.logicalId));
      return Response.json({ result: found });
    };
    const reader = qdrantKnowledgeSearch({ url: "https://fixture.invalid", collection: "test", apiKey: "test", fetchImpl: request });
    const input = { query: plan.searchText ?? "", corpusVersion: corpus.manifest.corpusVersion, expanded: null, limit: 5, lexical: plan.lexical };
    expect((await reader.search(input)).hits.map(hit => hit.logicalId)).toEqual([wanted.logicalId, other.logicalId]);
    denseAvailable = false;
    expect((await reader.search(input)).hits.map(hit => hit.logicalId)).toEqual([wanted.logicalId]);
    pointsAvailable = false;
    expect((await reader.search(input)).status).toBe("error");
    denseAvailable = true;
    expect((await reader.search(input)).hits.map(hit => hit.logicalId)).toEqual([other.logicalId]);
    pointsAvailable = true;
    found = [remote({ ...wanted, fragmentSha256: "0".repeat(64) }), remote({ ...wanted, corpusVersion: "obsolete" })];
    expect((await reader.search(input)).hits.map(hit => hit.logicalId)).toEqual([other.logicalId]);
    found = [];
    expect((await reader.search(input)).hits.map(hit => hit.logicalId)).toEqual([other.logicalId]);
  });
  it("preserves the version used by section lookup and rejects a point with an unrelated UUID", async () => {
    const corpusVersion = loadCorpus("oferta").manifest.corpusVersion;
    const f = loadCorpus("oferta").fragments.get("zlobek-odbiorca")!;
    const point = { id: pointId(corpusVersion, f.logicalId), payload: f };
    const reader = qdrantKnowledgeSearch({ url:"https://fixture.invalid", apiKey:"reader", collection:"test",
      fetchImpl:async () => Response.json({result:{points:[point, {...point, id:"wrong"}]}}) });
    const result = await reader.search({query:"Odbiorca świadczenia", corpusVersion, limit:5, expanded:null});
    expect(result.hits).toEqual([{corpusVersion,logicalId:f.logicalId,fragmentSha256:f.fragmentSha256,score:0}]);
  });
  it.each([false, true])("finds an unseen test document from its contents only when indexed (present=%s)", async present => {
    vi.resetModules();
    const { loadCorpus: loadIsolatedCorpus } = await import("../src/lib/rag/corpus-fs");
    const { fragmentHash } = await import("../src/lib/rag/corpus");
    const { searchCorpus: find } = await import("../src/lib/rag/corpus-search");
    const isolated = loadIsolatedCorpus("publiczne");
    const logicalId = "test-astronomia-fixture";
    const sourceText = "Wypożyczony zestaw astronomiczny należy oddać do obserwatorium w granatowym futerale.";
    if (present) {
      const template = isolated.fragments.values().next().value;
      if (!template) throw new Error("Expected a public corpus fixture");
      isolated.fragments.set(logicalId, {
        ...template, logicalId, sourceText, fragmentSha256: fragmentHash(sourceText),
      });
    }
    for (const question of [
      "W czym trzeba oddać pożyczony zestaw astronomiczny do obserwatorium?",
      "Czy wypożyczony sprzęt astronomiczny wraca do obserwatorium w futerale?",
    ]) expect(find(question)?.fragmentId).toBe(present ? logicalId : undefined);
  });

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

  it.each([
    "Czy przy chorobowym pobyt za kratami ma znaczenie?",
    "Czy niepełnosprawność marsjanina zmienia zasady wypłaty zasiłku?",
  ])("asks for the missing condition when the remaining rare matches are stem collisions: %s", async q => {
    const deps = makeDeps();
    const { answer, trace } = await answerQuestion(deps, q);
    expect(answer.status).toBe("needs_clarification");
    expect(trace.calls).toEqual({qdrant:0, sherlock:0});
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
