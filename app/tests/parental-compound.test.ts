import { expect, it, vi } from "vitest";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { publicQuestion } from "../src/lib/rag/public-query";
import { answerPublicTurn, type AnswerDeps } from "../src/lib/zusik/ask-service";
import { routeCaseQuestion } from "../src/lib/zusik/v1/intent";
import type { AskTurn } from "../src/lib/zusik/types";

const corpus = loadCorpus("marta");
const cases = [
  { opening:"Jak późno i w ilu kawałkach można wykorzystać rodzicielski?",
    question:"Do jakiego wieku dziecka przysługuje urlop rodzicielski i na ile części wolno go podzielić?",
    id:"kp-art182-1c", facets:[/części/iu,/do kiedy|wiek/iu], facts:[/5 częściach/u,/zakończenia roku kalendarzowego/u,/6 rok życia/u] },
  { opening:"Ile wcześniej składam wniosek o rodzicielski do pracodawcy i czy papier jest konieczny?",
    question:"Czy wniosek o urlop rodzicielski mogę przesłać elektronicznie i z jakim wyprzedzeniem muszę to zrobić?",
    id:"kp-art182-1d-par1", facets:[/elektroniczn/iu,/termin|wcześniej|wyprzedzeni/iu], facts:[/papierowej lub elektronicznej/u,/nie krótszym niż 21 dni przed/u] },
];

it.each(cases)("preserves both questions and their verified provision on first asking and on replay: $id", async ({opening,question,id,facets,facts}) => {
  const fragment = corpus.fragments.get(id);
  if (!fragment) throw new Error("Missing public provision");
  const generate = vi.fn((): never => {throw new Error("A complete, verified provision already answers both aspects");});
  const deps:AnswerDeps = {corpus,selectCorpus:loadCorpus,generate,search:{search:async ({lexical=[]}) =>
    ({status:"ok",ms:0,hits:lexical.map(f=>({...f,score:1}))})}};
  const history: AskTurn[] = [];
  for (const [index,prompt] of [opening,question,question].entries()) {
    const last = history.at(-1);
    const routed = routeCaseQuestion(prompt,{facts:[],lastMessage:last && {
      id:last.requestId,input:{intent:"public_question",publicQuestion:last.question},publicQuery:last.publicQuery,
      citations:last.citations.map(c=>({kind:"public_source",ref:c.fragmentId}))}});
    if (!("input" in routed) || routed.input.intent !== "public_question") throw new Error("Expected a public projection");
    const wire = routed.input.publicQuestion;
    for (const facet of facets) expect(wire).toMatch(facet);
    expect(publicQuestion(wire)?.question).toBe(wire);
    const {answer,trace} = await answerPublicTurn(deps,wire,history);
    expect(trace.vectorIds).toContain(id);
    expect(trace.evidenceIds).toContain(id);
    const cited = answer.citations.find(c => c.fragmentId === id);
    expect(cited?.url).toMatch(/^https:\/\/eli\.gov\.pl\/.+#page=\d+$/u);
    expect(cited?.corpusVersion).toBe(fragment.corpusVersion);
    expect(cited?.quote).toBe(fragment.sourceText);
    const linked = answer.claims.filter(c => cited && c.citationIds.includes(cited.id)).map(c => c.text).join(" ");
    for (const fact of facts) expect(linked).toMatch(fact);
    history.push({...answer,question:wire,requestId:String(index),createdAt:""});
  }
  const absent = await answerPublicTurn({...deps,search:{search:async()=>({status:"ok",ms:0,hits:[]})}},question,[]);
  expect(absent.answer.citations).toHaveLength(0);
  expect(generate).not.toHaveBeenCalled();
  expect(routeCaseQuestion(question,{facts:[],hasDocuments:true})).toMatchObject({input:{intent:"ask_case"}});
});

it.each([
  "Od kiedy można elektronicznie składać wniosek o rodzicielski?",
  "Czy papierowy wniosek po terminie daje prawo do rodzicielskiego?",
  "Czy w 2020 roku pracownik mógł złożyć wniosek o rodzicielski elektronicznie i w jakim terminie?",
  "Ile wcześniej i w jakiej formie mam jako pracownik złożyć wniosek o urlop ojcowski?",
])("keeps a different benefit or period out of the two-aspect route: %s", text => {
  expect(publicQuestion(text, true)?.quoteProvision).toBeUndefined();
});
