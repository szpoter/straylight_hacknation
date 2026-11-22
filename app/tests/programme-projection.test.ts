import { expect, it } from "vitest";
import { offerDetail, publicQuestion } from "../src/lib/rag/public-query";
import { routeCaseQuestion } from "../src/lib/zusik/v1/intent";
import { answerPublicTurn } from "../src/lib/zusik/ask-service";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { searchCorpus } from "../src/lib/rag/corpus-search";
import type { KnowledgeSearch } from "../src/lib/rag/retrieve";

const corpus = loadCorpus("oferta");
const search: KnowledgeSearch = { search: async ({ lexical = [] }) => ({
  status: "ok", ms: 0, hits: lexical.slice(0, 5).map(hit => ({ ...hit, score: 1 })),
  rankings: { lexical: lexical.map(hit => hit.logicalId), dense: [] },
}) };
const deps = { corpus, selectCorpus: loadCorpus, searchCorpus, search,
  generate: async () => ({ status: "error" as const, model: "offline", output: null, ms: 0 }) };

it.each([
  ["Czy na dziecko w schronisku dla nieletnich może przysługiwać 800+?", "of-800-3-1"],
  ["Czy komornik może zająć środki z programu Dobry Start?", "of-dobry-1-3"],
  ["Czy w ramach Dobrego Startu może wnioskować dyrektor regionalnej placówki opiekuńczo-terapeutycznej?", "of-dobry-2-2"],
])("preserves publication-specific terminology in a cited v1 response: %s", async (raw, target) => {
  const route = routeCaseQuestion(raw + " Alina Syntetyczna.", { facts: [] });
  if (!("input" in route) || route.input.intent !== "public_question") throw new Error("Expected public question");
  const text = route.input.publicQuestion;
  expect(text).not.toMatch(/alina|syntetycz/iu);
  const plan = publicQuestion(text);
  if (!plan || plan.clarify) throw new Error("Expected a replayable public programme query");
  expect(offerDetail(text, plan).question).toBe(text);
  const {answer} = await answerPublicTurn(deps, text, []);
  expect(answer.citations.some(c => c.fragmentId === target && c.quote === corpus.fragments.get(target)?.sourceText)).toBe(true);
});

it("keeps the electronic submission guidance and the personal eligibility boundary", () => {
  const direct = publicQuestion("Jak złożyć wniosek przez internet o Dobry Start?");
  expect(publicQuestion("Jak złożyć wniosek przez internet o Dobry Start?", true)).toEqual(direct);
  expect(routeCaseQuestion("Ile netto dostanę z programu Dobry Start?", { facts: [] })).toHaveProperty("clarify");
  expect(routeCaseQuestion("Czy mam prawo do Aktywnie w domu, jeżeli przebywam na urlopie?", { facts: [] })).toHaveProperty("clarify");
});
