import { expect, it } from "vitest";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { extractiveAnswer } from "../src/lib/rag/excerpt";
import { publicQueueEvidence } from "../src/lib/rag/local-queue";
import type { PublicQuestion } from "../src/lib/rag/public-query";
import { relevantFragment } from "../src/lib/rag/relevance";
import { answerQuestion } from "../src/lib/zusik/ask-service";
import type { ModelAnswer } from "../src/lib/rag/answer";

const publicLaw = loadCorpus("publiczne");
const leave = loadCorpus("marta");
const pregnancyPlan: PublicQuestion = {corpus:"publiczne", question:"Jaki procent podstawy wymiaru wynosi zasiłek chorobowy w okresie ciąży i od czego zależy samo prawo?", locators:["uz:11:2","uz:6:1"]};
const rate = "uz-art11-ust2-pkt1";
const entitlement = "uz-art6-ust1";
const rateQuote = "Miesięczny zasiłek chorobowy wynosi 100 % podstawy wymiaru zasiłku";
const coverageQuote = "w czasie trwania ubezpieczenia chorobowego";
const rateOnly = {text:"W okresie ciąży stawka wynosi 100% podstawy wymiaru.", evidence:[{id:rate,quote:rateQuote}]};

async function run(plan: PublicQuestion, question: string, hits: string[], output: ModelAnswer | null) {
  const corpus = loadCorpus(plan.corpus);
  return answerQuestion({corpus, selectCorpus:loadCorpus, search:{search:async () => ({status:"ok", ms:0,
    hits:hits.map(id => ({logicalId:id, fragmentSha256:corpus.fragments.get(id)!.fragmentSha256, score:1})),
  })}, generate:async () => ({status:output ? "ok" : "timeout", output, ms:0, model:"fixture"})}, question, undefined, plan);
}

it.each([false,true])("retains entitlement and rate when the model describes only the rate (extra citation=%s)", async extra => {
  const claim = extra ? {...rateOnly, evidence:[...rateOnly.evidence, {id:entitlement,quote:coverageQuote}]} : rateOnly;
  const {answer, trace} = await run(pregnancyPlan, "Jaka stawka obowiązuje w ciąży i kiedy musi powstać choroba?", [rate,entitlement],
    {status:"answered", message:"", claims:[claim]});
  expect(trace.vectorIds).toEqual([rate,entitlement]);
  expect(answer.claims.map(c => c.text)).toEqual([rate,entitlement].map(id => publicLaw.fragments.get(id)!.sourceText));
  expect(answer.citations.map(c => c.fragmentId)).toEqual([rate,entitlement]);
});

it("rejects separate claims that both describe only the rate despite two different citations", async () => {
  const secondRate = {text:"Ten procent określa wysokość miesięcznej wypłaty.", evidence:[{id:entitlement,quote:coverageQuote}]};
  const {answer} = await run(pregnancyPlan, "Od czego zależy prawo i procent chorobowego w czasie ciąży?", [rate,entitlement],
    {status:"answered", message:"", claims:[rateOnly,secondRate]});
  expect(answer.claims.map(c => c.text)).toEqual([rate,entitlement].map(id => publicLaw.fragments.get(id)!.sourceText));
});

it("preserves two separately supported explanations", async () => {
  const condition = {text:"Choroba musi spowodować niezdolność do pracy w czasie trwania ubezpieczenia chorobowego.", evidence:[{id:entitlement,quote:coverageQuote}]};
  const {answer} = await run(pregnancyPlan, "Jakie są warunki chorobowego i jego stawka w ciąży?", [rate,entitlement],
    {status:"answered", message:"", claims:[rateOnly,condition]});
  expect(answer.claims.map(c => c.text)).toEqual([rateOnly.text,condition.text]);
});

const attachment = "rozp-2025-322-par15-ust2-pkt1";
const exception = "rozp-2025-322-par22";
const documentPlan: PublicQuestion = {corpus:"marta", fragmentId:attachment,
  question:"Jakie dokumenty są wymagane? Hasła ze źródła: odpis, skrócony", searchText:"odpis skrócony"};

it.each([false,true])("quotes the separately retrieved linked exception (generator unavailable=%s)", async down => {
  const {answer} = await run(documentPlan, "Jak udokumentować urodzenie dziecka przy wniosku o urlop rodzicielski?", [attachment,exception,"kp-art182-1e-par2"],
    down ? null : {status:"answered", message:"", claims:[{text:"Dołącz dokument potwierdzający urodzenie dziecka.",
      evidence:[{id:attachment,quote:"odpis skrócony aktu urodzenia dziecka"}]}]});
  expect(answer.claims.map(c => c.text)).toEqual([attachment,exception].map(id => leave.fragments.get(id)!.sourceText));
  expect(answer.citations.map(c => c.fragmentId)).toEqual([attachment,exception]);
});

it("keeps an unranked related passage out of an exact extract", async () => {
  const {answer} = await run(documentPlan, "Jak udokumentować urodzenie dziecka przy wniosku o urlop rodzicielski?", [attachment], null);
  expect(answer.citations.map(c => c.fragmentId)).toEqual([attachment]);
});

it("joins the two halves of a ranked statutory list and excludes the next paragraph about paperwork", async () => {
  const first = "uz-61-1", continuation = "uz-61-2", other = "uz-61-3";
  const plan: PublicQuestion = {corpus:"publiczne", fragmentId:first, question:"Kto dokonuje wypłaty? Hasła ze źródła: zasiłków, wypłacają"};
  const {trace, answer} = await run(plan, "Kto jest płatnikiem zasiłku chorobowego w wymienionych przypadkach?", [first,continuation,other], null);
  expect(trace.evidenceIds).toEqual([first,continuation]);
  expect(answer.citations.map(c => c.fragmentId)).toEqual([first,continuation]);
  const fragments = [first,continuation].map(id => publicLaw.fragments.get(id)!);
  expect(publicQueueEvidence(publicLaw, plan.question, fragments)).toEqual(fragments);
  expect(publicQueueEvidence(publicLaw, plan.question, [...fragments, publicLaw.fragments.get(other)!])).toBeNull();
  const midList = { ...plan, fragmentId:continuation, question:"Kto dokonuje wypłaty? Hasła ze źródła: duchownymi, uprawnionym" };
  expect(extractiveAnswer(publicLaw, midList, fragments, [continuation,first])?.citations.map(c => c.fragmentId)).toEqual([first,continuation]);
  expect(extractiveAnswer(publicLaw, midList, fragments, [first,continuation], [continuation])).toBeNull();
});

it("uses the provision for the benefit rate and the separate provision for proof when both were requested", () => {
  const ids = ["uz-11-1","uz-53-2"];
  const fragments = ids.map(id => publicLaw.fragments.get(id)!);
  const plan = {corpus:"publiczne" as const, fragmentId:ids[0], requiredFragmentIds:ids,
    question:"Jaki procent podstawy wymiaru stosuje się w tej sytuacji? Hasła ze źródła: dawców, komórek"};
  expect(fragments.filter(relevantFragment(plan,publicLaw))).toEqual(fragments);
  const answer = extractiveAnswer(publicLaw, plan, fragments, ids);
  expect(answer?.claims.map(c => c.text)).toEqual(fragments.map(f => f.sourceText));
  expect(extractiveAnswer(publicLaw, plan, fragments, [ids[0]])).toBeNull();
  expect(extractiveAnswer(publicLaw, plan, [fragments[0]], ids)).toBeNull();
  expect(publicQueueEvidence(publicLaw, plan.question, fragments)).toBeNull();
});

it.each([
  ["Okres świadczeniowy zaczyna się 1 czerwca.", "od 1 czerwca do 31 maja kolejnego roku", false],
  ["Okres świadczeniowy trwa do 31 maja.", "od 1 czerwca do 31 maja kolejnego roku", false],
  ["Okres trwa od 31 maja do 1 czerwca.", "od 1 czerwca do 31 maja kolejnego roku", false],
  ["Okres trwa od 1 czerwca do 31 maja kolejnego roku.", "od 1 czerwca do 31 maja kolejnego roku", true],
])("shows both boundaries of a requested benefit period: %s", async (text, quote, complete) => {
  const id = "800-plus", plan: PublicQuestion = {corpus:"oferta", locators:["program:800-plus"], question:"Od kiedy do kiedy trwa okres świadczeniowy 800+?"};
  const {answer} = await run(plan, "W jakich datach zaczyna się i kończy rok świadczeniowy 800+?", [id],
    {status:"answered", message:"", claims:[{text,evidence:[{id,quote}]}]});
  expect(answer.claims[0].text).toBe(complete ? text : loadCorpus("oferta").fragments.get(id)!.sourceText);
  expect(answer.citations[0].fragmentId).toBe(id);
});

it("checks a published date span with explicit years in another programme", async () => {
  const id = "zlobek-limit-2026-2027", fragment = loadCorpus("oferta").fragments.get(id)!;
  const plan: PublicQuestion = {corpus:"oferta", fragmentId:id, question:"Przez jaki okres obowiązuje ta zasada? Hasła ze źródła: wysokość, kosztu"};
  const {answer} = await run(plan, "Przez jaki okres obowiązuje wskazany limit dla żłobka?", [id],
    {status:"answered", message:"", claims:[{text:"Limit obowiązuje od 1 kwietnia 2026 r.",
      evidence:[{id,quote:"na okres od dnia 1 kwietnia 2026 r. do dnia 31 marca 2027 r."}]}]});
  expect(answer.claims[0].text).toBe(fragment.sourceText);
  expect(answer.citations[0].fragmentId).toBe(id);
});
