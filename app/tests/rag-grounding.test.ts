import { expect, it, vi } from "vitest";
import { validateAnswer } from "../src/lib/rag/answer";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { extractiveAnswer, needsStatutoryText, reviewedSourceIds, withSourceException } from "../src/lib/rag/excerpt";
import { publicQueueEvidence } from "../src/lib/rag/local-queue";
import { publicQuestion, type PublicQuestion } from "../src/lib/rag/public-query";
import { relevantFragment } from "../src/lib/rag/relevance";
import { checkCitedSources } from "../src/lib/rag/source-check";
import { answerQuestion } from "../src/lib/zusik/ask-service";
import { assembleEvidence } from "../src/lib/rag/retrieve";

const corpus = loadCorpus("marta");
const guidance = corpus.fragments.get("mrpips-korzystanie-czesci")!;
const law = corpus.fragments.get("kp-art182-1c")!;
const keywords = "Jakie ogólne zasady wynikają ze źródła? Hasła ze źródła: udzielany, jednorazowo";
const plan: PublicQuestion = { corpus: "marta", fragmentId: guidance.logicalId, question: keywords };

it("keeps a verified target and its primary law together without adding an unrelated statute to the prompt", () => {
  const other = corpus.fragments.get("kp-art182-1e-par2")!;
  const hits = [guidance, other].map(f => ({ logicalId: f.logicalId, fragmentSha256: f.fragmentSha256, score: 1 }));
  const options = { asOf: "2026-11-21", targetId: guidance.logicalId };
  const { items } = assembleEvidence(corpus, hits, options);
  const evidence = items.map(i => i.fragment).filter(relevantFragment(plan, corpus));
  expect(evidence).toEqual([guidance, law]);
  expect(publicQueueEvidence(corpus, keywords, evidence)).toEqual(evidence);
  expect(publicQueueEvidence(corpus, keywords, [law, guidance])).toEqual([law, guidance]);
  expect(publicQueueEvidence(corpus, keywords, [guidance, other])).toBeNull();
  expect(publicQueueEvidence(corpus, keywords, [guidance, { ...law }])).toBeNull();
  expect(publicQueueEvidence(corpus, keywords + " dodatkowa treść", evidence)).toBeNull();
});

it("keeps the exception in another cited provision when restoring the full attachment rule", () => {
  const required = corpus.fragments.get("rozp-2025-322-par15-ust2-pkt1")!;
  const exception = corpus.fragments.get("rozp-2025-322-par22")!;
  const evidence = [required, exception];
  const answer = validateAnswer(corpus, evidence, { status:"answered", message:"", claims: [
    {text:"Dołącz odpis aktu urodzenia.", evidence:[{id:required.logicalId, quote:"odpis skrócony aktu urodzenia dziecka"}]},
    {text:"Jeśli dokument jest już w aktach, nie musisz go dołączać.", evidence:[{id:exception.logicalId, quote:"nie dołącza się dokumentów wymienionych w rozporządzeniu"}]},
  ] }).answer;
  const completed = withSourceException({ ...plan, fragmentId:required.logicalId, searchText:"zagraniczny" }, answer, evidence);
  expect(completed?.claims.map(claim => claim.text)).toEqual([required.sourceText, answer.claims[1].text]);
  expect(completed?.citations.map(c => c.fragmentId)).toEqual([required.logicalId, exception.logicalId]);
});

const deadline = corpus.fragments.get("kp-art182-1d-par1")!;
it.each([
  ["Wniosek składasz 182 dni przed urlopem.", "Pracodawca jest obowiązany uwzględnić wniosek pracownika.", "insufficient_evidence"],
  ["Wniosek składasz 21 tygodni przed urlopem.", "w terminie nie krótszym niż 21 dni", "insufficient_evidence"],
  ["Do rozpoczęcia urlopu musi pozostać co najmniej 21 dni.", "w terminie nie krótszym niż 21 dni", "answered"],
])("checks the value and unit against the cited words: %s", (text, quote, status) => {
  const result = validateAnswer(corpus, [deadline], {status:"answered",message:"",claims:[{text,evidence:[{id:deadline.logicalId,quote}]}]});
  expect(result.answer.status).toBe(status);
});

const publicCorpus = loadCorpus("publiczne");

it.each([
  ["Co stanowi art. 19 ustawy zasiłkowej?", ["uz-19-1", "uz-19-2", "uz-19-3"]],
  ["Co stanowi art. 7 ustawy zasiłkowej?", ["uz-7-1"]],
  ["Co stanowi art. 13 ust. 1 ustawy zasiłkowej?", ["uz-art13-ust1"]],
])("quotes all units of the requested provision in publication order: %s", (question, ids) => {
  const plan: PublicQuestion = {corpus: "publiczne", question};
  const evidence = ids.map(id => publicCorpus.fragments.get(id)!);
  expect(reviewedSourceIds(plan, publicCorpus)).toEqual(ids);
  const answer = extractiveAnswer(publicCorpus, plan, evidence, ids);
  expect(answer?.claims.map(c => c.text)).toEqual(evidence.map(f => f.sourceText));
  expect(answer?.citations.map(c => c.fragmentId)).toEqual(ids);
  expect(extractiveAnswer(publicCorpus, plan, evidence.slice(1), ids)).toBeNull();
  expect(extractiveAnswer(publicCorpus, plan, evidence, [])).toBeNull();
});

it("declines a missing paragraph even when the parent article and an excerpt from one point exist", () => {
  const plan: PublicQuestion = {corpus: "publiczne", question:"Co stanowi art. 11 ust. 88 ustawy zasiłkowej?", locators:["uz:11:88", "uz:11"]};
  const evidence = [publicCorpus.fragments.get("uz-11-1")!, publicCorpus.fragments.get("uz-art11-ust2-pkt1")!];
  const ids = evidence.map(f => f.logicalId);
  expect(reviewedSourceIds(plan, publicCorpus)).toEqual([]);
  expect(extractiveAnswer(publicCorpus, plan, evidence, ids)).toBeNull();
  const answer = validateAnswer(publicCorpus, evidence, {status:"answered", message:"", claims:[{
    text:"Przepis określa wysokość zasiłku.", evidence:[{id:ids[0], quote:"Miesięczny zasiłek chorobowy"}],
  }]}).answer;
  expect(needsStatutoryText(plan, answer)).toBe(true);
});

it("verifies a shortened quotation in the official publication only while both pieces remain in order", async () => {
  const first = "Urlop rodzicielski jest udzielany jednorazowo";
  const last = "w którym dziecko kończy 6 rok życia";
  const { answer } = validateAnswer(corpus, [guidance], {status:"answered", message:"", claims:[{
    text:"Przepis określa sposób korzystania z urlopu.", evidence:[{id:guidance.logicalId, quote:first + " […] " + last}],
  }]});
  const check = (page: string) => checkCitedSources(answer.citations, [corpus], Date.now() + 1000,
    async () => new Response("<p>" + page + "</p>", {headers:{"Content-Type":"text/html"}}));
  expect(await check(guidance.sourceText)).toBe(1);
  expect(await check(last + ". " + first)).toBe(0);
});

it("requires confirmation of every part of a provision selected by the public plan", () => {
  const plan = publicQuestion("Jaki okres wyczekiwania obowiązuje przy ubezpieczeniu chorobowym?");
  if (!plan) throw new Error("Expected a public plan");
  const ids = ["uz-4-1", "uz-4-2"];
  const evidence = ids.map(id => publicCorpus.fragments.get(id)!);
  expect(reviewedSourceIds(plan, publicCorpus)).toEqual(ids);
  expect(extractiveAnswer(publicCorpus, plan, evidence, ids)?.claims.map(c => c.text)).toEqual(evidence.map(f => f.sourceText));
  expect(extractiveAnswer(publicCorpus, plan, evidence, ids.slice(0, 1))).toBeNull();
});

it("keeps all verified top-five hits available when their cross-references exceed the prompt budget", () => {
  const offer = loadCorpus("oferta");
  const ids = ["of-800-4-1", "of-800-5-1", "of-zerowka-1-2", "dobry-start-kanaly", "dobry-start"];
  const hits = ids.map(id => ({ logicalId: id, fragmentSha256: offer.fragments.get(id)!.fragmentSha256, score: 1 }));
  const evidence = assembleEvidence(offer, hits, {asOf:"2026-11-21"});
  expect(evidence.items.map(i => i.fragment.logicalId)).toEqual(expect.arrayContaining(ids));
  expect(evidence.items.length).toBeLessThanOrEqual(8);
});

it("requires the selected guidance itself before generating from a linked law", async () => {
  const generate = vi.fn(async () => ({status:"error" as const, output:null, ms:0, model:"offline"}));
  const lookup = (selected: typeof guidance) => answerQuestion({corpus, generate, search:{search:async () => ({
    status:"ok", hits:[{logicalId:selected.logicalId, fragmentSha256:selected.fragmentSha256, score:1}], ms:0,
  })}}, "W ilu turach udzielany jest urlop rodzicielski?", undefined, plan);
  const wrong = await lookup(law);
  expect(wrong.answer.status).toBe("insufficient_evidence");
  expect(generate).not.toHaveBeenCalled();
  const supported = await lookup(guidance);
  expect(supported.trace.evidenceIds).toEqual([guidance.logicalId, law.logicalId]);
  expect(supported.answer.citations.map(c => c.fragmentId)).toEqual([guidance.logicalId]);
});

it.each([
  ["zasiłek chorobowy […] przysługuje za okres pierwszych 5 dni", "insufficient_evidence"],
  ["przysługuje za okres pierwszych 5 dni", "insufficient_evidence"],
  ["zdolność do pracy spowodowana została", "insufficient_evidence"],
  ["zasiłek chorobowy nie przysługuje za okres pierwszych 5 dni", "answered"],
])("retains legal negation at the start and inside a quotation: %s", (quote, status) => {
  const pack = loadCorpus("publiczne");
  const f = pack.fragments.get("uz-16-1")!;
  const {answer} = validateAnswer(pack, [f], {status:"answered", message:"", claims:[
    {text:quote.replace(" […] ", " "), evidence:[{id:f.logicalId, quote}]},
  ]});
  expect(answer.status).toBe(status);
});
