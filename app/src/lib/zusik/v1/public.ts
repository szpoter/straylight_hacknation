import sources from "../../../../corpus/official-sources.json";
import { publicQuestion } from "../../rag/public-query";
import { answerPublicTurn } from "../ask-service";
import { publicAnswerDeps } from "../server";
import { conversationInput } from "../conversation";
import type { AskTurn } from "../types";
import { sourceIntent } from "../context-answer";
import { ApiProblem } from "./http";
import type { Message } from "./conversation";

export async function publicReply(question: string, previous?: Message) {
  if (sourceIntent(question) && previous) return {answer:previous.answer,citations:previous.citations,publicQuery:previous.publicQuery};
  const {text,reply} = conversationInput(question,"ogolna");
  if (reply) return {answer:reply,citations:[]};
  const deps = publicAnswerDeps(Date.now()+48_000);
  const history: AskTurn[] = [];
  if (previous?.input.intent === "public_question") {
    const citations = previous.citations.flatMap(c => {
      if (c.kind !== "public_source" || !c.publicUrl) return [];
      return [{id:c.ref,fragmentId:c.ref,sourceId:sources.find(source=>source.url===c.publicUrl)?.sourceId,
        url:c.publicUrl,corpusVersion:c.version,title:"",locator:"",quote:"",headingPath:[],page:c.page ?? null,authority:"zus_guidance" as const}];
    });
    const projected = previous.publicQuery ?? publicQuestion(previous.input.publicQuestion)?.question;
    history.push({requestId:previous.id,question:projected ?? "",publicQuery:projected,status:citations.length ? "answered":"needs_clarification",
      message:previous.answer,citations,claims:[],createdAt:"",corpusVersion:citations[0]?.corpusVersion ?? ""});
  }
  const {answer} = await answerPublicTurn(deps,text,history);
  if (answer.status === "unavailable") throw new ApiProblem(503,"public_source_unavailable");
  return {answer:[...answer.claims.map(c=>c.text),answer.message].filter(Boolean).join(" "),publicQuery:answer.publicQuery,citations:answer.citations.map(c=>({
    kind:"public_source" as const,ref:c.fragmentId,version:c.corpusVersion,publicUrl:c.url,...(c.page ? {page:c.page} : {})}))};
}
