import { expect, it, vi } from "vitest";
import type { Message } from "../src/lib/zusik/v1/conversation";
import { publicReply } from "../src/lib/zusik/v1/public";
import { answerPublicTurn } from "../src/lib/zusik/ask-service";
import { publicLookupTitle, type PublicLookup } from "../src/lib/rag/ranked-lookup";

vi.mock("../src/lib/zusik/server", () => ({ publicAnswerDeps: () => ({}) }));
vi.mock("../src/lib/zusik/ask-service", () => ({ answerPublicTurn: vi.fn(async () => ({
  answer: {status:"answered",claims:[],message:"ok",citations:[{id:"source:1",fragmentId:"f1",
    url:"https://www.zus.pl/",corpusVersion:"test"}],publicQuery:"Publiczny temat z korpusu",
    opportunities:[{id:"card",title:"Karta",citationIds:["source:1"],missingFacts:["wiek"],exclusiveGroup:null},
      {id:"no-evidence",title:"Bez dowodu",citationIds:["absent"],missingFacts:[],exclusiveGroup:null}]}
})) }));

it("reprojects old REST messages and resumes new ones from server-generated public vocabulary", async () => {
  const old: Message = {id:"prev",input:{intent:"public_question",publicQuestion:"Dobry Start SYNTETYCZNY-MARKER"},
    answer:"Odpowiedź publiczna",citations:[],state:"completed",caseRevision:1,profileRevision:1};
  const reply = await publicReply("Jakie dokumenty?",old);
  expect(reply.opportunities).toEqual([{id:"card",title:"Karta",citationIds:["f1"],missingFacts:["wiek"],exclusiveGroup:null}]);
  const history = vi.mocked(answerPublicTurn).mock.lastCall?.[2];
  expect(history?.[0].publicQuery).toContain("Dobry Start");
  expect(JSON.stringify(history)).not.toContain("SYNTETYCZNY-MARKER");
  await publicReply("Do kiedy?",{...old,...reply});
  expect(vi.mocked(answerPublicTurn).mock.lastCall?.[2][0].publicQuery).toBe("Publiczny temat z korpusu");
});

it("keeps only a scoped public turn pointer after small talk", async () => {
  const previous: Message = {id:"previous-topic",input:{intent:"public_question",publicQuestion:"Dobry Start"},
    answer:"Odpowiedź",citations:[],state:"completed",caseRevision:1,profileRevision:1};
  expect(await publicReply("Co umiesz?",previous)).toMatchObject({contextMessageId:previous.id,citations:[]});
  expect(await publicReply("Co umiesz?",{...previous,input:{intent:"ask_case"}})).not.toHaveProperty("contextMessageId");
});

it("validates the public source and the fallback question before dispatching a ranked message", async () => {
  const lookup: PublicLookup = {ids:["uz-16-1"], facet:"duration", terms:["nadużyciem","alkoholu"]};
  const question = publicLookupTitle(lookup);
  vi.mocked(answerPublicTurn).mockClear();
  await expect(publicReply(question + " prywatny dopisek", undefined, undefined, lookup)).rejects.toMatchObject({status:422});
  await expect(publicReply(question, undefined, undefined, {...lookup, ids:["foreign-edition"]})).rejects.toMatchObject({status:422});
  expect(answerPublicTurn).not.toHaveBeenCalled();
  await publicReply(question, undefined, undefined, lookup);
  expect(vi.mocked(answerPublicTurn).mock.lastCall?.[0].publicLookup).toEqual(lookup);
});
