import { expect, it } from "vitest";
import { routeCaseQuestion } from "../src/lib/zusik/v1/intent";
import { sourceIntent } from "../src/lib/zusik/context-answer";

const previous = (publicQuery: string) => ({id:"prior", publicQuery, input:{intent:"public_question"}, citations:[]});
it.each([
  ["Dobry Start", "Kiedy kończy się przyjmowanie wniosków?", /Dobry Start.*termin|termin.*Dobry Start/iu],
  ["Dobry Start", "Na którym portalu po tym terminie?", /Dobry Start.*po terminie/iu],
  ["Urlop rodzicielski jednocześnie", "A co ze wspólnym limitem?", /jednocze.*rodzicielsk|rodzicielsk.*jednocze/iu],
  ["Świadczenie aktywnie w żłobku", "Kto odbiera przelew?", /konto/iu],
  ["Wypłata zasiłku w razie śmierci ubezpieczonego", "A jeżeli mieszka za granicą?", /wypłac.*granicą/iu],
])("retains the public subject and qualification of %s / %s", (prior, question, match) => {
  const result = routeCaseQuestion(question,{facts:[],lastMessage:previous(prior)});
  expect(result).toMatchObject({input:{intent:"public_question", replyTo:"prior",publicQuestion:expect.stringMatching(match)}});
});

it.each(["Podaj źródło tej zasady.", "Proszę o podstawę tej informacji.", "Skąd wiadomo o tym przelewie?"])("recognises a request for evidence: %s", question => {
  expect(sourceIntent(question)).toBeTruthy();
  expect(routeCaseQuestion(question,{facts:[],lastMessage:previous("Dobry Start")})).toMatchObject({input:{publicQuestion:"Skąd to wiesz?",replyTo:"prior"}});
});

it("does not inherit another case or discard a newly specified financial period", () => {
  expect(routeCaseQuestion("Kto odbiera przelew?",{facts:[]})).toHaveProperty("clarify");
  expect(routeCaseQuestion("Kiedy kończy się przyjmowanie wniosków w 2018 roku?",{facts:[],lastMessage:previous("Dobry Start")})).toHaveProperty("clarify");
});

it("keeps the last reported age as a dated conversation note, without changing the profile", async () => {
  const {conversationAge} = await import("../src/lib/zusik/conversation-age");
  const {messageInput} = await import("../src/lib/zusik/v1/conversation");
  const {AskService} = await import("../src/lib/zusik/ask-service");
  const {loadCorpus} = await import("../src/lib/rag/corpus-fs");
  const {MemoryCaseStore, MemoryTurnStore} = await import("./helpers");
  const ask = new AskService({store:new MemoryCaseStore(),turns:new MemoryTurnStore(),corpus:loadCorpus(),
    search:{search:async () => {throw new Error("private note searched");}},
    generate:async () => {throw new Error("private note sent to model");}});
  const a = {planId:"first"}, b = {planId:"other"};
  const tell = (question:string,id:string,scope = a) => ask.ask("example",question,id,undefined,undefined,"ogolna",scope);
  for (const [i,q] of ["Mój syn ma 2 lata.","Korekta, syn ma 23 miesiące."].entries()) {
    expect(await tell(q,String(i))).toMatchObject({status:200,turn:{status:"conversation",citations:[]}});
    expect(routeCaseQuestion(q,{facts:[]})).toMatchObject({input:{intent:"note_age",months:24-i}});
  }
  expect((await tell("Jaki wiek podałem ostatnio?", "recall")).turn?.message).toMatch(/23/);
  expect((await tell("Jaki wiek podałem ostatnio?", "also-recall", b)).turn?.message).not.toMatch(/23|24/);
  expect(conversationAge("W grudniu 2022 mój syn miał 2 lata.")).toBeNull();
  expect(conversationAge("Mój syn ma 21 miesięcy, córka ma 36 miesięcy.")).toBeNull();
  expect(messageInput.safeParse({intent:"note_age",child:"child",months:999}).success).toBe(false);
  expect(messageInput.safeParse({intent:"note_age",child:"child",months:23,subjectId:"someone"}).success).toBe(false);
});

it.each([
  "Moja pensja w grudniu 2024?",
  "Moja pensja na dzień 2023-02-29?",
  "Moja pensja na 2024-02-29 i 2025-03-01?",
])("asks which day to use before a dated case read: %s", text => {
  expect(routeCaseQuestion(text,{facts:[],hasDocuments:true})).toHaveProperty("clarify");
});

it("opens the case calculation when the speaker asks about their own amount after a public answer", () => {
  const ctx = {facts:[], hasDocuments:true, assessmentId:"own-result",lastMessage:previous("Dobry Start")};
  expect(routeCaseQuestion("Skąd są moje kwoty?",ctx)).toEqual({input:{intent:"explain_result",assessmentId:"own-result"}});
  expect(routeCaseQuestion("Skąd są moje kwoty?",{facts:[],lastMessage:ctx.lastMessage})).toHaveProperty("clarify");
});
