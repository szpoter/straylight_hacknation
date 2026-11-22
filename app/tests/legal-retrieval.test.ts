import { expect, it } from "vitest";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { searchCorpus } from "../src/lib/rag/corpus-search";
import { answerQuestion, type AnswerDeps } from "../src/lib/zusik/ask-service";

const deps: AnswerDeps = {
  corpus: loadCorpus(), selectCorpus: loadCorpus, searchCorpus,
  search: { search: async ({lexical = []}) => ({
    status: "ok", ms: 0, hits: lexical.slice(0, 5).map(f => ({...f, score: 1})),
    rankings: {lexical: lexical.map(f => f.logicalId), dense: []},
  }) },
  generate: async () => ({status: "error", model: "offline", output: null, ms: 0}),
};

it.each([
  ["W jakim czasie przedawnia się roszczenie o wypłatę zasiłku?", "uz-67-1"],
  ["Komu lekarz może udzielić upoważnienia do wystawiania zaświadczeń lekarskich?", "uz-54a-1"],
  ["Czy składniki wynagrodzenia wypłacane za czas pobierania zasiłku uwzględnia się w podstawie wymiaru?", "uz-41-1"],
])("retrieves and quotes the provision for %s", async (question, id) => {
  const {answer, trace} = await answerQuestion(deps, question);
  expect(trace.vectorIds).toContain(id);
  expect(answer.citations.map(c => c.fragmentId)).toEqual([id]);
  expect(answer.citations[0].quote).toBe(loadCorpus("publiczne").fragments.get(id)?.sourceText);
});
