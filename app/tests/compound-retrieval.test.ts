import { expect, it, vi } from "vitest";
import type { Pool } from "pg";
import { generateAnswer } from "../src/lib/rag/answer";
import { publicQueueEvidence } from "../src/lib/rag/local-queue";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { projectPublicPair } from "../src/lib/rag/public-query";
import { searchCorpus } from "../src/lib/rag/corpus-search";
import { compoundQuestion } from "../src/lib/rag/compound";
import { answerPublicTurn, answerQuestion } from "../src/lib/zusik/ask-service";

it.each([
  ["Do kiedy można wysłać wniosek o 300 plus i jakimi kanałami można go złożyć?", ["dobry-start-termin","dobry-start-kanaly"]],
  ["W jakim terminie składa się wniosek o Dobry Start i jakimi kanałami można go złożyć?", ["dobry-start-termin","dobry-start-kanaly"]],
  ["Kiedy przysługuje świadczenie rehabilitacyjne i jaki procent podstawy stosuje się w pierwszych trzech miesiącach?", ["uz-18-1","uz-19-1"]],
  ["Jaki jest termin na złożenie wniosku o urlop rodzicielski i czy można go złożyć papierowo?", ["kp-art182-1d-par1"]],
  ["Jak długo trwa urlop ojcowski i na ile części można go podzielić?", ["kp-ojcowski"]],
  ["Jakiego dokumentu wymaga wypłata zasiłku chorobowego z więcej niż jednego tytułu po wypadku w drodze do pracy i jaki procent podstawy wymiaru przysługuje?", ["rz-10-1"]],
  ["W jakim terminie składa się wniosek o urlop rodzicielski i w jakiej formie można go złożyć?", ["kp-art182-1d-par1"]],
  ["Czy przysługuje zasiłek chorobowy po umyślnym wykroczeniu ubezpieczonego oraz jak to udowodnić?", ["uz-15-1"]],
])("plans only the sources needed to answer both parts of %s", (question, ids) => {
  const plan = compoundQuestion(question, searchCorpus);
  expect(plan?.requiredFragmentIds).toEqual(ids);
  expect(plan?.lexical?.map(f => f.logicalId)).toEqual(ids);
  for (const point of plan?.lexical ?? []) {
    if (!plan) throw new Error("Missing public plan");
    const pack = loadCorpus(plan.corpus);
    expect(point.corpusVersion).toBe(pack.manifest.corpusVersion);
    expect(point.fragmentSha256).toBe(pack.fragments.get(point.logicalId)?.fragmentSha256);
  }
});

it.each([
  "Jak ZUS opisuje program 800+ i kiedy można złożyć wniosek na nowy okres?",
  "Kiedy przysługuje zasiłek chorobowy lub jakie dokumenty są potrzebne?",
  "Czy wniosek o Dobry Start można złożyć w lipcu i sierpniu?",
  "Kiedy przysługuje zasiłek chorobowy i kto to potwierdza w moim załączniku?",
  "Czy przysługuje świadczenie i kto potwierdza tę okoliczność i jakie dokumenty są potrzebne?",
])("keeps alternatives, private material and unsupported compositions outside this route", question => {
  expect(compoundQuestion(question, searchCorpus)).toBeNull();
});

it.each([
  "Czy przysługuje zasiłek chorobowy po umyślnym wykroczeniu ubezpieczonego i kto potwierdza rejestrację hulajnogi?",
  "Czy przysługuje zasiłek chorobowy po umyślnym wykroczeniu ubezpieczonego i jaki kolor ma rejestracja hulajnogi?",
  "W jakim terminie składa się wniosek o Dobry Start i jakie dokumenty są potrzebne do Aktywnie w żłobku?",
])("abstains before retrieval for a changed or unsupported second subject", question => {
  const plan = compoundQuestion(question, searchCorpus);
  expect(plan?.clarify ?? plan?.uncovered).toBeTruthy();
  expect(plan?.lexical).toBeUndefined();
  expect(JSON.stringify(plan)).not.toMatch(/hulajnog/iu);
});

it("preserves source-specific programme terms before and after the public browser projection", () => {
  const text = "Czy komornik może zająć środki z Dobrego Startu oraz jak złożyć wniosek przez internet?";
  const wire = projectPublicPair(text)?.question;
  expect(wire).toBeTruthy();
  for (const question of [text, wire ?? ""]) {
    expect(compoundQuestion(question, searchCorpus)?.requiredFragmentIds).toEqual(["of-dobry-1-3", "dobry-start-kanaly"]);
  }
});

it("rejects a forged pair before any search", () => {
  const forged = "Pytania publiczne: Jan Nowak składa wniosek o świadczenie Dobry Start? oraz Jakimi kanałami rodzic może złożyć elektroniczny wniosek o Dobry Start?";
  const result = compoundQuestion(forged, () => { throw new Error("Unexpected search"); });
  expect(result?.clarify).toBeTruthy();
  expect(JSON.stringify(result)).not.toContain("Nowak");
});

it("requires both channel passages in addition to the period when the programme catalogue links to its guide", () => {
  const text = "Od kiedy do kiedy trwa okres świadczeniowy 800+ i jakimi kanałami składamy wniosek?";
  const wire = projectPublicPair(text)?.question;
  expect(wire).toBeTruthy();
  for (const question of [text, wire ?? "", "Jak długo trwa okres świadczeniowy 800+ oraz jakimi kanałami można składać wnioski?"]) {
    expect(compoundQuestion(question, searchCorpus)?.requiredFragmentIds).toEqual(["800-plus", "of-800-6-2", "of-800-6-3"]);
  }
});

it("retains the second facet even when one confirmed provision answers both questions", () => {
  const plan = compoundQuestion("W jakim terminie składa się wniosek o urlop rodzicielski i w jakiej formie można go złożyć?", searchCorpus);
  expect(plan?.searchText).toMatch(/formie/iu);
});

it("queues both facets for the selected PLLuM and cites their shared source from either input", async () => {
  const text = "Kiedy można złożyć wniosek na kolejny okres 800+ oraz które miesiące obejmuje ten okres?";
  const wire = projectPublicPair(text)?.question ?? "";
  const corpus = loadCorpus("oferta");
  const source = corpus.fragments.get("800-plus");
  if (!source) throw new Error("Missing published programme period");
  for (const question of [text, wire]) {
    const output = JSON.stringify({status:"answered", message:"",
      claims:[{text:source.sourceText, evidence:[{id:source.logicalId, quote:source.sourceText}]}]});
    const client = {query:vi.fn(async () => ({rows:[{done:true, output}]})), release:vi.fn()};
    const queue = {connect: async () => client} as unknown as Pool;
    const {answer, trace} = await answerQuestion({
      corpus, selectCorpus:loadCorpus, searchCorpus,
      search:{search:async () => ({status:"ok",ms:0,hits:[{...source,score:1}]})},
      generate:(q, evidence, pack) => generateAnswer({selectedModel:"pllum", queue,
        hosted:() => { throw Error("Unexpected hosted model"); }}, pack, q, evidence),
    }, question);
    expect(client.query.mock.calls[0]).toEqual(["select zusik_model.submit($1,$2,$3)",
      [expect.any(String), "pllum", expect.stringContaining(wire)]]);
    expect(trace).toMatchObject({backend:"local-pllum", modelId:"pllum", attemptId:expect.any(String)});
    expect(trace.calls).toEqual({qdrant:1,sherlock:1});
    expect(trace.model).toBe("ok");
    expect(trace.report?.removedClaims).toBe(0);
    expect(answer.citations).toHaveLength(1);
    expect(answer.citations[0].url).toBe(corpus.documents.get(source.documentId)?.url);
    for (const date of ["1 lutego", "1 czerwca", "31 maja"]) {
      expect(answer.claims[0].text).toContain(date);
      expect(answer.citations[0].quote).toContain(date);
    }
  }
});

it("grounds both donor facets in the statute and rejects a different medical certificate provision", async () => {
  const question = "Jaki procent podstawy wymiaru zasiłku chorobowego stosuje się u dawców komórek i jakie dokumenty są wymagane?";
  const corpus = loadCorpus("publiczne");
  const expected = ["uz-11-1", "uz-53-2"];
  expect(compoundQuestion(question, searchCorpus)?.requiredFragmentIds).toEqual(expected);
  for (const ids of [expected, ["uz-11-1", "uz-54a-1"]]) {
    const hits = ids.map(id => {
      const f = corpus.fragments.get(id);
      if (!f) throw new Error("Missing statute provision");
      return {...f, score:1};
    });
    const {answer} = await answerQuestion({
      corpus, selectCorpus:loadCorpus, searchCorpus,
      search:{search:async () => ({status:"ok",ms:0,hits,rankings:{dense:[],lexical:ids}})},
      generate:async () => ({status:"error",ms:0,model:"fixture",output:null}),
    }, question);
    if (ids === expected) {
      expect(answer.citations.map(c => c.fragmentId)).toEqual(expected);
      expect(answer.claims[0].text).toMatch(/100\s*%/u);
      expect(answer.claims[1].text).toMatch(/zaświadczen/iu);
    } else {
      expect(answer.status).toBe("insufficient_evidence");
      expect(answer.citations).toHaveLength(0);
    }
  }
});

it("requires the exact two public projections and the complete matching evidence at the queue", async () => {
  const wire = projectPublicPair("W jakim terminie składa się wniosek o Dobry Start i jakimi kanałami można go złożyć?")?.question;
  const corpus = loadCorpus("oferta");
  const deadline = corpus.fragments.get("dobry-start-termin");
  const channels = corpus.fragments.get("dobry-start-kanaly");
  const foreign = corpus.fragments.get("800-plus");
  if (!wire || !deadline || !channels || !foreign) throw Error("Missing public pair fixture");
  expect(publicQueueEvidence(corpus, wire, [channels, deadline])).toEqual([channels, deadline]);
  for (const evidence of [[foreign], [channels], [channels, channels], [channels, deadline, foreign],
    [channels, {...deadline, corpusVersion:"old"}]]) {
    expect(publicQueueEvidence(corpus, wire, evidence)).toBeNull();
  }
  const search = vi.fn((): never => { throw Error("Unexpected retrieval"); });
  const generate = vi.fn((): never => { throw Error("Unexpected model call"); });
  for (const text of [wire + " Dodatek", wire.replace("? oraz", " osoba@example.test? oraz"),
    wire.replace("? oraz", "? oraz Obcy identyfikator ABC123? oraz")]) {
    expect(publicQueueEvidence(corpus, text, [channels, deadline])).toBeNull();
    const {answer} = await answerPublicTurn({corpus, selectCorpus:loadCorpus, searchCorpus,
      search:{search}, generate}, text, []);
    expect(["needs_clarification", "insufficient_evidence"]).toContain(answer.status);
    expect(answer.citations).toEqual([]);
  }
  expect(search).not.toHaveBeenCalled();
  expect(generate).not.toHaveBeenCalled();
});
