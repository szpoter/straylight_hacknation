import type { ChatModelOptions } from "../chat-model";
import sources from "../../../../corpus/official-sources.json";
import { publicQuestion } from "../../rag/public-query";
import { answerPublicTurn } from "../ask-service";
import { publicAnswerDeps } from "../server";
import { chatStarters, conversationInput } from "../conversation";
import type { AskTurn } from "../types";
import { sourceIntent } from "../context-answer";
import { ApiProblem } from "./http";
import type { Message } from "./conversation";

export async function publicReply(question: string, previous?: Message, options?: ChatModelOptions) {
  if (sourceIntent(question)) {
    if (previous?.input.intent !== "public_question") return {answer:"W tej rozmowie nie ma wcześniejszej publicznej odpowiedzi.",citations:[]};
    return {answer:previous.citations.length ? previous.answer : "Poprzednia odpowiedź nie zawierała cytatu ze źródła urzędowego.",
      citations:previous.citations,publicQuery:previous.publicQuery,opportunities:previous.opportunities};
  }
  const {text,reply} = conversationInput(question,"ogolna");
  if (reply) return {answer:reply,citations:[], ...(previous?.input.intent === "public_question" && !chatStarters.some(s => s.prompt === text)
    ? {contextMessageId:previous.id} : {})};
  const deps = publicAnswerDeps(Date.now()+48_000, options);
  const history: AskTurn[] = [];
  if (previous?.input.intent === "public_question") {
    const citations = previous.citations.flatMap(c => {
      if (c.kind !== "public_source" || !c.publicUrl) return [];
      return [{id:c.ref,fragmentId:c.ref,sourceId:sources.find(source=>source.url===c.publicUrl?.split("#")[0])?.sourceId,
        url:c.publicUrl,corpusVersion:c.version,title:"",locator:"",quote:"",headingPath:[],page:c.page ?? null,authority:"zus_guidance" as const}];
    });
    const projected = previous.publicQuery ?? publicQuestion(previous.input.publicQuestion)?.question;
    history.push({requestId:previous.id,question:projected ?? "",publicQuery:projected,status:citations.length ? "answered":"needs_clarification",
      message:"",citations,claims:[],createdAt:"",corpusVersion:citations[0]?.corpusVersion ?? ""});
  }
  const {answer, trace} = await answerPublicTurn(deps,text,history);
  if (answer.status === "unavailable")
    throw new ApiProblem(503, trace.modelId === "qwen-27b" ? "selected_model_unavailable" : "public_source_unavailable");
  const opportunities = answer.opportunities?.flatMap(card => {
    const citationIds = answer.citations.filter(c=>card.citationIds.includes(c.id)).map(c=>c.fragmentId);
    return citationIds.length ? [{...card,citationIds}] : [];
  });
  return {answer:[...answer.claims.map(c=>c.text),answer.message].filter(Boolean).join(" "),publicQuery:answer.publicQuery,opportunities,citations:answer.citations.map(c=>({
    kind:"public_source" as const,ref:c.fragmentId,version:c.corpusVersion,publicUrl:c.url,...(c.page ? {page:c.page} : {})}))};
}
