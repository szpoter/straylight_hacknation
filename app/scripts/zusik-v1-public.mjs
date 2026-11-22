// Live synthetic public-source check using the server's normal runtime reader.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const origin = new URL(process.argv[2] || "http://127.0.0.1:36433").origin;
assert.ok(["localhost","127.0.0.1"].includes(new URL(origin).hostname));
let cookie;
async function post(path,input) {
  const r = await fetch(origin+"/api/v1/"+path,{method:"POST",headers:{
    Origin:origin,"Content-Type":"application/json","Idempotency-Key":randomUUID(),...(cookie ? {Cookie:cookie} : {})},body:JSON.stringify(input)});
  if (!r.ok) throw new Error(path + " HTTP " + r.status + " " + (await r.json()).code);
  if (!cookie) cookie = r.headers.getSetCookie()[0].split(";")[0];
  return r.json();
}
await post("sessions");
const profile = await post("profiles",{mode:"case_import"});
const file = await post("cases",{profileId:profile.id});
let previous;
for (const [question,fragment,word] of [
  ["Komu ZUS wypłaca świadczenie aktywnie w żłobku?","zlobek-odbiorca",/rachunek.*podmiotu/iu],
  ["Chodzi mi o Dobry Start.","of-dobry-1-2",/rachunek|konto/iu],
  ["Na czyje konto?","of-dobry-1-2",/rachunek|konto/iu],
  ["Skąd to wiesz?","of-dobry-1-2",/rachunek|konto/iu],
]) {
  const message = await post("cases/"+file.id+"/messages",{intent:"public_question",publicQuestion:question,...(previous ? {replyTo:previous.id} : {})});
  assert.match(message.answer,word);
  assert.ok(message.citations.some(c=>c.kind==="public_source" && c.ref.includes(fragment) && new URL(c.publicUrl).hostname==="www.zus.pl"));
  const recovered = await fetch(origin+"/api/v1/cases/"+file.id+"/messages/"+message.id,{headers:{Cookie:cookie}});
  assert.deepEqual(await recovered.json(),message);
  previous = message;
  console.log("PASS public turn and resume:",question,message.citations.map(c=>c.ref).join(","));
}
