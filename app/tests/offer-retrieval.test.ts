import { expect, it, vi } from "vitest";
import cases from "./fixtures/offer-retrieval.json";
import { routeCaseQuestion } from "../src/lib/zusik/v1/intent";
import { answerPublicTurn, answerQuestion } from "../src/lib/zusik/ask-service";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { searchCorpus } from "../src/lib/rag/corpus-search";
import { suggestTopic } from "../src/lib/zusik/topic-ranker";
import type { KnowledgeSearch } from "../src/lib/rag/retrieve";

const corpus = loadCorpus("oferta");
const confirmedPoints: KnowledgeSearch = { search:async ({lexical}) => {
  const current = (lexical ?? []).filter(f => f.corpusVersion === corpus.manifest.corpusVersion &&
    corpus.fragments.get(f.logicalId)?.fragmentSha256 === f.fragmentSha256);
  return { status:"ok", ms:0, hits:current.slice(0,5).map(f=>({...f,score:1})),
    rankings:{lexical:current.map(f=>f.logicalId),dense:[]} };
} };
const deps = {corpus, selectCorpus:loadCorpus, searchCorpus, suggestTopic, search:confirmedPoints,
  generate:async () => ({status:"error" as const,ms:0,model:"offline",output:null})};

it.each([
  ["Czy Aktywnie w domu może podlegać egzekucji administracyjnej lub komorniczej? Joanna Szafran.", "of-dom-4-6"],
  ["Czy przy programie Aktywni rodzice w pracy dołączamy orzeczenie z systemu EKSMOoN? Joanna Szafran, 111222333.", "of-praca-4-2"],
])("keeps programme detail from browser to cited answer: %s", async (question, expected) => {
  const route = routeCaseQuestion(question,{facts:[]});
  if (!("input" in route) || route.input.intent !== "public_question") throw new Error("Expected a public projection");
  expect(route.input.publicQuestion).not.toMatch(/Joanna|Szafran|111222333/iu);
  const {answer} = await answerPublicTurn(deps, route.input.publicQuestion, []);
  expect(answer.citations.map(c=>c.fragmentId)).toEqual([expected]);
  expect(answer.claims[0].text).toBe(corpus.fragments.get(expected)?.sourceText);
});

it("recovers specific programme conditions from independently confirmed lexical points", async () => {
  let cited = 0;
  for (const [question, ...alternatives] of cases.regression) {
    const {answer} = await answerQuestion(deps, question);
    if (answer.citations.some(c => alternatives.includes(c.fragmentId) &&
      c.quote === corpus.fragments.get(c.fragmentId)?.sourceText)) cited++;
  }
  expect(cited).toBeGreaterThanOrEqual(7);
});

it("keeps a named-program question with a private date outside external search", async () => {
  const search: KnowledgeSearch = {search:vi.fn(() => { throw new Error("Unexpected public search"); })};
  const {answer} = await answerQuestion({corpus:loadCorpus(), selectCorpus:loadCorpus, searchCorpus, suggestTopic,
    search, generate:vi.fn()}, "Czy świadczenie 800+ należało mi się w styczniu 2024 roku?");
  expect(answer.status).toBe("needs_clarification");
  expect(search.search).not.toHaveBeenCalled();
});
