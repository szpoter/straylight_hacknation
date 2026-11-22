import { expect, it, vi } from "vitest";
import type { Message } from "../src/lib/zusik/v1/conversation";
import { publicReply } from "../src/lib/zusik/v1/public";
import { answerPublicTurn } from "../src/lib/zusik/ask-service";

vi.mock("../src/lib/zusik/server", () => ({ publicAnswerDeps: () => ({}) }));
vi.mock("../src/lib/zusik/ask-service", () => ({ answerPublicTurn: vi.fn(async () => ({
  answer: {status:"answered",claims:[],message:"ok",citations:[],publicQuery:"Publiczny temat z korpusu"}
})) }));

it("reprojects old REST messages and resumes new ones from server-generated public vocabulary", async () => {
  const old: Message = {id:"prev",input:{intent:"public_question",publicQuestion:"Dobry Start SYNTETYCZNY-MARKER"},
    answer:"Odpowiedź publiczna",citations:[],state:"completed",caseRevision:1,profileRevision:1};
  const reply = await publicReply("Jakie dokumenty?",old);
  const history = vi.mocked(answerPublicTurn).mock.lastCall?.[2];
  expect(history?.[0].publicQuery).toContain("Dobry Start");
  expect(JSON.stringify(history)).not.toContain("SYNTETYCZNY-MARKER");
  await publicReply("Do kiedy?",{...old,...reply});
  expect(vi.mocked(answerPublicTurn).mock.lastCall?.[2][0].publicQuery).toBe("Publiczny temat z korpusu");
});
