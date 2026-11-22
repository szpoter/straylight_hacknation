import { expect, it, vi } from "vitest";
import { routeCaseQuestion } from "../src/lib/zusik/v1/intent";
import type { Message } from "../src/lib/zusik/v1/conversation";
import { publicReply } from "../src/lib/zusik/v1/public";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { searchCorpus } from "../src/lib/rag/corpus-search";
import { suggestTopic } from "../src/lib/zusik/topic-ranker";
import type { AnswerDeps } from "../src/lib/zusik/ask-service";

vi.mock("../src/lib/zusik/server", () => ({publicAnswerDeps: (): AnswerDeps => ({
  corpus:loadCorpus(), selectCorpus:loadCorpus, searchCorpus, suggestTopic,
  search:{search:async ({lexical = [],limit}) => ({status:"ok",ms:0,
    hits:lexical.slice(0,limit).map(hit => ({...hit,score:1}))})},
  generate:async () => ({status:"error",ms:0,model:"offline",output:null})
})}));

it("retains the subject across entitlement, rate, proof and evidence in a reloaded REST conversation", async () => {
  let lastMessage: Message | undefined;
  const examples = [
    ["Chodzi mi o badanie kandydata na dawcę komórek.","uz-6-1"],
    ["Jaka stawka?","uz-11-1"],
    ["Jak lekarz to potwierdza?","uz-53-2"],
    ["Podaj źródło tej informacji.","uz-53-2"],
  ];
  for (const [i,[text,ref]] of examples.entries()) {
    const turn = routeCaseQuestion(text,{facts:[],lastMessage});
    if (!("input" in turn) || turn.input.intent !== "public_question") throw new Error("Public projection required");
    const reply = await publicReply(turn.input.publicQuestion,lastMessage);
    expect(reply.citations.map(c => c.ref)).toContain(ref);
    lastMessage = JSON.parse(JSON.stringify({...reply,input:turn.input,id:String(i),state:"completed",caseRevision:1,profileRevision:1}));
  }
});
