import { expect, it } from "vitest";
import { routeCaseQuestion } from "../src/lib/zusik/v1/intent";
import { answerPublicTurn } from "../src/lib/zusik/ask-service";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { searchCorpus } from "../src/lib/rag/corpus-search";
import type { KnowledgeSearch } from "../src/lib/rag/retrieve";

const corpus = loadCorpus("publiczne");
const search: KnowledgeSearch = { search: async ({lexical = []}) => ({
  status: "ok", ms: 0, hits: lexical.slice(0, 5).map(hit => ({...hit, score: 1})),
  rankings: {lexical: lexical.map(hit => hit.logicalId), dense: []},
}) };
const deps = {corpus, selectCorpus: loadCorpus, searchCorpus, search,
  generate: async () => ({status: "error" as const, model: "offline", output: null, ms: 0})};

it.each([
  ["Jak przedawnia się roszczenie o wypłatę zasiłku po błędzie płatnika?", "uz-67-2"],
  ["Kto poświadcza umyślne przestępstwo dla zasiłku?", "uz-15-1"],
  ["Co się dzieje z chorobowym podczas tymczasowego aresztowania?", "uz-12-1"],
  ["Jaki wpływ na zasiłek chorobowy ma sfałszowane zaświadczenie lekarskie?", "uz-17-3"],
  ["Jak na chorobowe wpływa umyślne wykroczenie?", "uz-15-1"],
  ["Kandydat na dawcę tkanek jest na badaniach. Jaki procent chorobowego obowiązuje?", "uz-11-1"],
  ["Kto poświadcza badania kandydata na dawcę tkanek przy zasiłku chorobowym?", "uz-53-2"],
])("preserves a public legal condition and the requested facet: %s", async (text, id) => {
  const route = routeCaseQuestion(text + " Imię Testowe, test@example.invalid.", {facts: []});
  if (!("input" in route) || route.input.intent !== "public_question") throw new Error("Expected a public question");
  expect(route.input.publicQuestion).not.toMatch(/Testowe|example/iu);
  const {answer, trace} = await answerPublicTurn(deps, route.input.publicQuestion, []);
  expect(trace.vectorIds).toContain(id);
  expect(answer.citations.map(c => c.fragmentId)).toContain(id);
  expect(answer.citations.some(c => c.fragmentId === id && corpus.fragments.get(id)?.sourceText.includes(c.quote))).toBe(true);
});

it.each([
  "Dobry Start: jaki jest termin przeglądu motocykla?",
  "Czy można odwołać się do związku wędkarskiego w Aktywnie w żłobku?",
  "Czy z Aktywnie w domu można opłacić serwis grzejnika?",
])("keeps an unsupported programme condition out of a generic cited answer: %s", async text => {
  expect(routeCaseQuestion(text, {facts: []})).toHaveProperty("clarify");
  const {answer, trace} = await answerPublicTurn(deps, text, []);
  expect(answer.citations).toHaveLength(0);
  expect(trace.calls.qdrant).toBe(0);
});

it.each([
  "Czy art. 16 ustawy zasiłkowej pozwala sfinansować wymianę baterii?",
  "Co wspólnego z Dobrym Startem ma art 20 ustawy zasiłkowej?",
  "Czym się różnią art. 18 i art. 19 ustawy zasiłkowej?",
])("asks for the actual condition when an article is incidental: %s", async text => {
  expect(routeCaseQuestion(text, {facts: []})).toHaveProperty("clarify");
  const {answer, trace} = await answerPublicTurn(deps, text, []);
  expect(answer.status).toBe("needs_clarification");
  expect(trace.calls.qdrant).toBe(0);
});

it.each([
  "Czy wymiana kół w deskorolce coś zmienia na chorobowym?",
  "Jak zmienia się chorobowe bez tymczasowego aresztowania?",
  "Czy to moja kwota brutto przy sfałszowanym zaświadczeniu o chorobowym?",
])("keeps missing or negated qualifiers out of a public legal projection: %s", text => {
  expect(routeCaseQuestion(text, {facts: []})).toHaveProperty("clarify");
});

it("keeps the general sick-note rule and preserves the personal-amount gate", () => {
  const general = routeCaseQuestion("Czy samo zwolnienie lekarskie wystarcza do zasiłku chorobowego?", {facts: []});
  expect(general).toHaveProperty("input.publicQuestion", "Czy samo zwolnienie lekarskie wystarcza do zasiłku chorobowego i kiedy musi powstać niezdolność do pracy?");
  expect(routeCaseQuestion("Czy samo zwolnienie lekarskie wystarcza do wyliczenia kwoty netto?", {facts: []})).toHaveProperty("clarify");
});
