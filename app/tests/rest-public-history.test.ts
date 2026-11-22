import { expect, it, vi } from "vitest";
import type { Message } from "../src/lib/zusik/v1/conversation";
import { publicReply } from "../src/lib/zusik/v1/public";
import { answerPublicTurn } from "../src/lib/zusik/ask-service";

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
