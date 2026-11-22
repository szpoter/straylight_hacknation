import { describe, expect, it, vi } from "vitest";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { corpusKeywords } from "../src/lib/rag/corpus-search";
import { publicQueueEvidence } from "../src/lib/rag/local-queue";
import { publicRankedPlan, knownPublicLookup, publicRankedCandidates } from "../src/lib/rag/public-ranked-plan";
import { answerQuestion } from "../src/lib/zusik/ask-service";

const law = loadCorpus("publiczne");
const correct = law.fragments.get("uz-16-1")!;
const other = loadCorpus("oferta").fragments.get("of-opieka-kwota-1-1")!;
const ids = [correct.logicalId, other.logicalId];
const words = ["alkoholu", "niezdolności", "nadużyciem"];

describe("server verification of public candidate ids and source words", () => {
  it("keeps the mixed ranking but grounds the question and hash in the matching release", async () => {
    const plan = publicRankedPlan(ids, "duration", words);
    expect(plan).toMatchObject({corpus:"publiczne", fragmentId:correct.logicalId});
    if (!plan) throw Error("Expected the qualified provision");
    expect(plan.lexical).toEqual([correct,other].map(({logicalId, corpusVersion, fragmentSha256}) => ({logicalId, corpusVersion, fragmentSha256})));
    expect(corpusKeywords(plan.question, correct)).toEqual(["niezdolność","nadużyciem","alkoholu"]);
    expect(publicQueueEvidence(law, plan.question, [correct])).toEqual([correct]);
    expect(publicRankedPlan(ids, "duration", words.toReversed())).toEqual(plan);
    const search = vi.fn(async () => ({status:"ok" as const, ms:0, hits:[correct,other].map(f => ({...f,score:1})),
      rankings:{lexical:ids, dense:[]}}));
    const {answer, trace} = await answerQuestion({corpus:law, selectCorpus:loadCorpus, search:{search},
      generate:async () => ({status:"timeout", ms:0, model:"offline", output:null})}, plan.question, undefined, plan);
    expect(trace.vectorIds).toEqual(ids);
    expect(answer.citations.map(c => c.fragmentId)).toEqual([correct.logicalId]);
    expect(answer.citations[0].quote).toBe(correct.sourceText);
  });
  it.each([
    [["foreign-release-id",correct.logicalId],"duration", words],
    [[correct.logicalId,correct.logicalId],"duration", words],
    [[other.logicalId],"duration", words],
    [[correct.logicalId],"proof", words],
    [[correct.logicalId],"unverified facet", words],
    [[correct.logicalId],"duration", ["alkoholu","alkoholu"]],
    [[correct.logicalId],"duration", ["alkoholu","niezdolność dodatkowa"]],
    [[correct.logicalId],"duration", ["alkoholu","01020345678"]],
    [[correct.logicalId],"duration", ["zasiłek","chorobowy"]],
    [["uz-19-1"],"rate", ["waloryzacji","zasiłku","chorobowego"]],
  ] as const)("declines an unsupported combination: %j / %s / %j", (ids, facet, tokens) => {
    expect(publicRankedPlan([...ids], facet, [...tokens])).toBeNull();
  });
  it("can persist genuine words from the first public unit even if that unit does not support the requested facet", () => {
    expect(knownPublicLookup(ids, words)).toBe(true);
    expect(knownPublicLookup(ids, ["zasiłek","chorobowy"])).toBe(true);
    expect(publicRankedCandidates(ids, ["zasiłek","chorobowy"])).toEqual([correct,other].map(
      ({logicalId, fragmentSha256, corpusVersion}) => ({logicalId, fragmentSha256, corpusVersion})));
    expect(publicRankedCandidates(["foreign",...ids], words)).toEqual([]);
    expect(publicRankedPlan(ids, "duration", ["zasiłek","chorobowy"])).toBeNull();
    expect(knownPublicLookup(["foreign",...ids], words)).toBe(false);
    expect(knownPublicLookup(ids.toReversed(), words)).toBe(false);
    expect(publicRankedPlan(ids.toReversed(), "duration", words)).toBeNull();
    expect(knownPublicLookup(ids, ["alkoholu","niezaufane"])).toBe(false);
  });
  it("recognises a beneficiary adjective separated from the exhausted benefit in source words", () => {
    const id = "uz-18-1";
    const words = ["rehabilitacyjne","wyczerpaniu","chorobowego","dalsze","leczenie","rokują","orzeka"];
    expect(publicRankedPlan([id], "info", words)?.fragmentId).toBe(id);
    expect(publicRankedPlan([id], "info", ["wyczerpaniu","zasiłku","chorobowego"])).toBeNull();
  });
  it("requires the introductory part of a physically split statutory enumeration", () => {
    const id = "uz-61-2", tokens = ["duchownymi","uprawnionym"];
    expect(knownPublicLookup([id], tokens)).toBe(true);
    expect(publicRankedPlan([id], "info", tokens)).toBeNull();
    expect(publicRankedPlan([id,"uz-61-1"], "info", tokens)?.fragmentId).toBe(id);
  });
  it("requires a valid publication date even when an authentic fragment id and hash exist", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("1900-01-01T12:00:00Z"));
      expect(publicRankedPlan([correct.logicalId,"rw-17-1"], "duration", words)).toBeNull();
    } finally { vi.useRealTimers(); }
  });
});
