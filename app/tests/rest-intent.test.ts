import { expect, it } from "vitest";
import { routeCaseQuestion } from "../src/lib/zusik/v1/intent";
import { messageInput } from "../src/lib/zusik/v1/conversation";
import type { EvidenceFact } from "../src/lib/zusik/memory/contract";
const fact: EvidenceFact = {factId:"a",version:1,recordedAt:"2026-03-01T01:00:00Z",verification:"confirmed",
  fact:{field:"monthlyGrossPay",subjectId:"parent",value:{kind:"money",currency:"PLN",grosze:600000},
    validFrom:"2026-02-01",validTo:"2026-02-28",source:{kind:"document",referenceId:"doc",page:2}}};
it("projects a hypothetical raise into one payroll period without mutating its source",()=>{
  const routed = routeCaseQuestion("Ile bym dostała, gdybym miała podwyżkę o 500 zł za luty 2026?",{facts:[fact]});
  expect(routed).toMatchObject({input:{intent:"hypothetical",variant:[{value:{grosze:650000},source:{kind:"declaration"}}]}});
  expect(fact.fact.value).toMatchObject({grosze:600000});
});
it("routes a mixed question without sending a child's name to a public provider",()=>{
  const result = routeCaseQuestion("Kiedy urodziła się Joanna i komu ZUS wypłaca świadczenie za żłobek?",{facts:[]});
  expect(result).toMatchObject({input:{intent:"read_context",topic:"birthDate",publicTopic:"nursery_recipient"}});
  expect(messageInput.safeParse("input" in result && result.input).success).toBe(true);
  expect(JSON.stringify(result)).not.toContain("Joanna");
});
it("preserves a public follow-up and the source of a private answer",()=>{
  const lastMessage = {id:"m",input:{intent:"public_question"},citations:[]};
  expect(routeCaseQuestion("Na czyje konto?",{facts:[],lastMessage})).toMatchObject({input:{intent:"public_question",replyTo:"m"}});
  expect(routeCaseQuestion("Dlaczego?",{facts:[],lastMessage:{...lastMessage,input:{intent:"read_context"}}})).toMatchObject({input:{intent:"ask_case",topic:"previous_sources",replyTo:"m"}});
});

it("retains the change of public programme across the browser and HTTP boundary",()=>{
  const lastMessage = {id:"prior",input:{intent:"public_question"},citations:[]};
  expect(routeCaseQuestion("Nie, chodzi mi o Dobry Start.",{facts:[],lastMessage})).toEqual({
    input:{intent:"public_question",publicQuestion:"Chodzi mi o Dobry Start.",replyTo:"prior"}});
});

const privateHistory = {id:"private",input:{intent:"ask_case"},citations:[]};
it.each([
  ["Jakie świadczenie wynika z załączonych dokumentów?", {facts:[],hasDocuments:true}],
  ["Czy zasiłek macierzyński przysługuje?", {facts:[],lastMessage:privateHistory}],
  ["Na czyje konto pójdzie przelew za żłobek w tej sprawie?", {facts:[fact]}],
])("keeps ambiguous case questions local: %s",(question,context)=>{
  expect(routeCaseQuestion(question as string,context as Parameters<typeof routeCaseQuestion>[1])).toMatchObject({input:{intent:"ask_case"}});
});
it("can explicitly ask about public rules in an open private case",()=>{
  const ctx = {facts:[fact],hasDocuments:true,lastMessage:privateHistory};
  for (const question of ["Komu ZUS wypłaca świadczenie aktywnie w żłobku?", "Ogólnie, jak długo trwa urlop ojcowski?"]) {
    const result = routeCaseQuestion(question,ctx);
    expect(result).toMatchObject({input:{intent:"public_question"}});
    expect(JSON.stringify(result)).not.toContain(privateHistory.id);
  }
});
