import { expect, it, vi } from "vitest";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { searchCorpus } from "../src/lib/rag/corpus-search";
import { answerPublicTurn, answerQuestion, type AnswerDeps } from "../src/lib/zusik/ask-service";
import { routeCaseQuestion } from "../src/lib/zusik/v1/intent";
import { benefitFilter, matchesPublishedBenefit } from "../src/lib/rag/benefit-scope";
import { publicBenefitFocus } from "../src/lib/rag/public-query";
import { validateAnswer } from "../src/lib/rag/answer";

const deps: AnswerDeps = { corpus:loadCorpus(), selectCorpus:loadCorpus, searchCorpus,
  search:{search:async ({lexical=[]}) => ({status:"ok", ms:0,
    hits:lexical.slice(0,5).map(f=>({...f,score:1})), rankings:{lexical:lexical.map(f=>f.logicalId),dense:[]}})},
  generate:async () => ({status:"error",ms:0,model:"offline",output:null}) };

it.each([
  ["Czy tymczasowe aresztowanie podczas zwolnienia lekarskiego wyłącza prawo do wypłaty?", "uz-12-1"],
  ["Czy wyjątek dotyczący pracy incydentalnej obowiązuje na zwolnieniu lekarskim?", "uz-17-1"],
])("keeps the type of benefit when guidance for another benefit shares the condition: %s", async (text, id) => {
  const {answer} = await answerQuestion(deps,text);
  expect(answer.citations.map(c=>c.fragmentId)).toContain(id);
  expect(answer.citations.every(c=>!c.fragmentId.startsWith("of-opieka") && !c.fragmentId.startsWith("zam-"))).toBe(true);
});

it("does not publish a confirmed caregiver passage in response to an employee's own sick leave", async () => {
  const corpus = loadCorpus("oferta");
  const wrong = corpus.fragments.get("of-opieka-3-1")!;
  const generate = vi.fn(():never=>{throw new Error("Wrong benefit reached the model");});
  const {answer} = await answerQuestion({...deps, generate}, "Jak areszt tymczasowy wpływa na moje zwolnienie lekarskie?", undefined,
    {corpus:"oferta",question:"Jakie ogólne zasady wynikają ze źródła?",fragmentId:wrong.logicalId});
  expect(answer.citations).toHaveLength(0);
  expect(generate).not.toHaveBeenCalled();
});

it.each([
  ["Czy wyjątek dotyczący pracy incydentalnej obowiązuje na zwolnieniu lekarskim?", ["uz-17-1"], ["istotne okoliczności", "polecenie pracodawcy"]],
  ["Jak długo trwa okres świadczeniowy 800+ oraz jakimi kanałami można składać wnioski?", ["800-plus", "of-800-6-2", "of-800-6-3"], ["1 czerwca", "31 maja", "eZUS", "numer PESEL"]],
] as const)("carries the same qualifications into the cited answer on both public paths: %s", async (text, ids, conditions) => {
  const route = routeCaseQuestion(text, {facts:[]});
  if (!("input" in route) || route.input.intent !== "public_question") throw new Error("Expected a public question");
  for (const question of [text, route.input.publicQuestion]) {
    const {answer, trace} = await answerPublicTurn(deps, question, []);
    expect(trace.vectorIds).toEqual(expect.arrayContaining([...ids]));
    expect(answer.citations.map(c => c.fragmentId)).toEqual([...ids]);
    for (const condition of conditions) {
      expect(answer.claims.map(c => c.text).join(" ")).toContain(condition);
      expect(answer.citations.map(c => c.quote).join(" ")).toContain(condition);
    }
  }
});

it("does not present a single verified clause as a complete answer to two questions", async () => {
  const search: AnswerDeps["search"] = {search: async ({lexical = []}) => ({
    status:"ok", ms:0, hits:lexical.slice(0, 1).map(f => ({...f, score:1})),
    rankings:{dense:[], lexical:lexical.map(f => f.logicalId)},
  })};
  const generate = vi.fn(():never => {throw new Error("Incomplete evidence reached the model");});
  const result = await answerPublicTurn({...deps, search, generate}, "W jakim terminie składa się wniosek o Dobry Start i jakimi kanałami można go złożyć?", []);
  expect(result.answer.status).toBe("insufficient_evidence");
  expect(result.answer.citations).toEqual([]);
  expect(generate).not.toHaveBeenCalled();
});

it.each([
  ["Zasiłek opiekuńczy nie przysługuje za okresy niezdolności do pracy.", false],
  ["Zasiłek chorobowy przysługuje za okresy niezdolności do pracy.", false],
  ["Zasiłek chorobowy nie przysługuje za okresy niezdolności do pracy.", true],
])("checks a generated benefit and entitlement against its own cited source: %s", (text, supported) => {
  const corpus = loadCorpus("publiczne");
  const source = corpus.fragments.get("uz-12-1");
  if (!source) throw new Error("Missing benefit statute");
  const quote = "Zasiłek chorobowy nie przysługuje za okresy niezdolności do pracy, w których ubezpieczony na podstawie przepisów o wynagradzaniu zachowuje prawo do wynagrodzenia.";
  const {answer} = validateAnswer(corpus, [source], {status:"answered",message:"",claims:[{
    text, evidence:[{id:source.logicalId, quote}],
  }]});
  expect(answer.status === "answered").toBe(supported);
});

it("answers both the application opening and the covered period when they share a source", async () => {
  const text = "Kiedy można złożyć wniosek na kolejny okres 800+ oraz które miesiące obejmuje ten okres?";
  const quote = "od 1 czerwca do 31 maja kolejnego roku";
  const model: AnswerDeps["generate"] = async () => ({status:"ok", ms:0, model:"fixture", output:{
    status:"answered", message:"", claims:[{text:"Okres trwa " + quote + ".", evidence:[{id:"800-plus", quote}]}],
  }});
  const {answer} = await answerPublicTurn({...deps, generate:model}, text, []);
  const explanation = answer.claims.map(c => c.text).join(" ");
  expect(explanation).toContain("1 lutego");
  expect(explanation).toContain(quote);
  expect(answer.citations.map(c => c.fragmentId)).toEqual(["800-plus"]);
});

it.each(["uz-18-1","uz-19-1"])("keeps sickness benefit as a prerequisite or calculation basis of rehabilitation: %s", id => {
  const corpus = loadCorpus("publiczne");
  const fragment = corpus.fragments.get(id)!;
  const asksSickness = "Jaka jest zasada dotycząca samego zasiłku chorobowego?";
  const asksRehabilitation = "Chodzi o świadczenie rehabilitacyjne po wyczerpaniu zasiłku chorobowego.";
  expect(matchesPublishedBenefit(asksSickness, fragment.sourceText)).toBe(false);
  expect(benefitFilter(asksSickness)(corpus, fragment)).toBe(false);
  expect(matchesPublishedBenefit(asksRehabilitation, fragment.sourceText)).toBe(true);
  expect(benefitFilter(asksRehabilitation)(corpus, fragment)).toBe(true);
});

it("does not select parental leave when the parent explicitly excludes it", () => {
  const asks = "Chodzi o urlop ojcowski, a nie urlop rodzicielski.";
  const parental = loadCorpus("marta").fragments.get("kp-art182-1d-par1")!;
  const paternal = loadCorpus("publiczne").fragments.get("kp-1823-2")!;
  expect(matchesPublishedBenefit(asks, parental.sourceText)).toBe(false);
  expect(matchesPublishedBenefit(asks, paternal.sourceText)).toBe(true);
});

it.each([
  "Czy możliwa jest wypłata chorobowego po wyczerpaniu okresu zasiłkowego?",
  "Wyczerpałam zasiłek chorobowy i nadal nie mogę pracować. Czy jest świadczenie na dalszy okres?",
  "Wyczerpałam zasiłek chorobowy i nadal nie mogę pracować. Lekarz nie przewiduje powrotu po leczeniu. Czy jest świadczenie na dalszy okres?",
])("requires a positive prognosis before inferring rehabilitation from exhausted sick pay: %s", question => {
  expect(publicBenefitFocus(question)).toEqual(["sickness"]);
});

it("distinguishes the document being replaced from the benefit requested later in the sentence", () => {
  expect(publicBenefitFocus("Jaki dokument zamiast odpisu aktu urodzenia świadczy o prawie do urlopu ojcowskiego?")).toEqual(["paternity"]);
  expect(publicBenefitFocus("Kończy się okres zasiłkowy. Leczenie pozwoli odzyskać zdolność do pracy. Czy istnieje kolejne świadczenie?")).toEqual(["rehabilitation"]);
});

it("does not read the end of a Polish noun as a standalone negation of recovery", () => {
  const start = "Po wyczerpaniu chorobowego leczenie ";
  const end = " odzyskanie zdolności do pracy. Czy można otrzymać kolejne świadczenie?";
  expect(publicBenefitFocus(start + "rokuje" + end)).toEqual(["rehabilitation"]);
  expect(publicBenefitFocus(start + "nie rokuje" + end)).toEqual(["sickness"]);
});

it.each([
  "Czy pozwany może wnieść odpowiedź na pozew później, jeżeli jest na urlopie ojcowskim?",
  "Jak rozliczyć w zeznaniu podatkowym koszt prywatnego leczenia podczas pobierania zasiłku chorobowego?",
  "Czy prywatny ubezpieczyciel wypłaca pieniądze z polisy, jeżeli pracownik choruje?",
])("keeps the requested proceeding distinct from benefits mentioned in the background: %s", async text => {
  const search = vi.fn(deps.search.search);
  const {answer} = await answerPublicTurn({...deps, search:{search}}, text, []);
  expect(search).not.toHaveBeenCalled();
  expect(answer.citations).toHaveLength(0);
  expect(routeCaseQuestion(text,{facts:[]})).toHaveProperty("clarify");
});
