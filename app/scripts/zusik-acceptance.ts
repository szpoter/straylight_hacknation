import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { chromium, type Page } from "playwright-core";
import { PDFDocument } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { makeCertificatePdf, makeCertificateScan } from "./kamil-demo-docs";
import { kamilCertificate } from "../src/lib/kamil/profile";
import type { KamilView } from "../src/lib/kamil/contract";
import type { MartaView } from "../src/lib/marta/types";
import type { SicknessView } from "../src/lib/sickness/types";

const origin = new URL(process.argv[2] ?? "http://127.0.0.1:3129").origin;
const martaPath = "/api/zusik/marta", kamilPath = "/api/kamil", sickPath = "/api/zusik/sickness";
async function browserHeaders(page: Page) {
  // Playwright's API client omits Secure cookies on loopback HTTP, while Chrome permits them there.
  const cookies = await page.context().cookies();
  return {Origin: origin, Cookie: cookies.filter(c => c.domain === new URL(origin).hostname).map(c => c.name + "=" + c.value).join("; ")};
}
async function read<T>(page: Page, route: string): Promise<T> {
  const r = await page.request.get(origin + route, {headers:await browserHeaders(page)});
  assert.equal(r.status(), 200, route);
  return (await r.json()).view;
}
async function update<T>(page: Page, route: string, data: object): Promise<T> {
  const r = await page.request.post(origin + route, { data, headers: await browserHeaders(page) });
  assert.equal(r.status(), 200, route + " " + JSON.stringify(await r.json()).slice(0,140));
  return (await r.json()).view;
}
async function pdfText(bytes: Uint8Array) {
  const pdf = await getDocument({data: Uint8Array.from(bytes), isEvalSupported:false}).promise;
  const lines = [];
  try {
    for (let i=1; i<=pdf.numPages; i++) {
      const content = await (await pdf.getPage(i)).getTextContent();
      lines.push(content.items.flatMap(t => "str" in t ? [t.str] : []).join(" "));
    }
    return lines.join("\n");
  } finally { await pdf.destroy(); }
}
async function testMarta(page: Page, missingRate: boolean) {
  await page.goto(origin + "/app");
  await page.getByRole("button",{name:"Porównaj warianty"}).waitFor();
  await page.waitForFunction(()=>!!Array.from(document.querySelectorAll("button")).find(b=>b.textContent==="Porównaj warianty" && !b.disabled));
  const firstName = missingRate ? "Łucja Paprotka" : "Lidia Brzoza";
  let v = await update<MartaView>(page,martaPath,{type:"compare",firstName, secondName:"Olaf Brzoza",childName:"Ewa Brzoza",
    firstStart:"2027-01-18",days:28,firstDaily:150,secondDaily:missingRate ? null : 110});
  assert.equal(v.variants.sequential.total,missingRate ? null : 7280);
  assert.equal(v.variants.together.calendarDays,28);
  assert.equal(v.variants.sequential.calendarDays,56);
  assert.deepEqual([v.variants.sequential.first.to,v.variants.sequential.second.from,v.variants.sequential.second.to,
    v.variants.sequential.first.deadline,v.variants.sequential.second.deadline],["2027-02-14","2027-02-15","2027-03-14","2026-12-28","2027-01-25"]);
  v = await update(page,martaPath,{type:"choose",version:v.version,variant:"sequential"});
  await page.reload();
  assert.equal((await read<MartaView>(page,martaPath)).selected,"sequential");
  assert.equal((await page.request.get(origin+martaPath+"/pdf",{headers:await browserHeaders(page)})).status(),404);
  v = await update(page,martaPath,{type:"confirm",version:v.version,otherParentConfirmed:true,employerHasCopy:missingRate,
    previousDays:0,previousParts:0,attachmentName:missingRate ? null : "kopia-fikcyjna.pdf"});
  const pdf = await page.request.get(origin+martaPath+"/pdf",{headers:await browserHeaders(page)});
  assert.equal(pdf.status(),200);
  const text = await pdfText(await pdf.body());
  assert.ok(text.includes(firstName) && text.includes("15.02.2027") && text.includes(missingRate ? "aktach osobowych" : "kopia-fikcyjna.pdf"));
  const previousVersion=v.version;
  v=await update(page,martaPath,{type:"submit",version:previousVersion});
  assert.ok(v.submittedAt);
  const repeat=await page.request.post(origin+martaPath,{data:{type:"submit",version:previousVersion},headers:await browserHeaders(page)});
  assert.equal(repeat.status(),409);
  await page.reload();
  assert.equal((await read<MartaView>(page,martaPath)).submittedAt,v.submittedAt);
  const other=await page.context().browser()!.newContext();
  try {assert.equal((await other.request.get(origin+martaPath+"/pdf")).status(),404);} finally {await other.close();}
}
async function testKamil(page: Page, correction: boolean) {
  await page.goto(origin+"/app/kamil");
  const data = {...kamilCertificate("2026-05-23"), childFirstName:correction ? "JAN" : "ADAM",childLastName:"ŻUREK"};
  const file = correction ? {name:"formularz-02.pdf",mimeType:"application/pdf",buffer:Buffer.from(await makeCertificatePdf(data))}
    : {name:"kartka-01.jpg",mimeType:"image/jpeg",buffer:makeCertificateScan(data)};
  await page.locator('input[type=file]').first().waitFor();
  await page.waitForFunction(async () => (await (await fetch("/api/kamil")).json()).view?.version > 0);
  const saved = page.waitForResponse(async r=> r.url().endsWith(kamilPath) && r.request().method()==="POST" &&
    r.request().postDataJSON()?.command?.type==="set_candidates",{timeout:90000});
  await page.locator('input[type=file]').first().setInputFiles(file);
  const response=await saved;
  assert.equal(response.status(),200);
  let v:KamilView=(await response.json()).view;
  const surname=v.candidates.find(c=>c.key==="child_last_name");
  assert.ok(surname && surname.origin.kind==="document" && surname.origin.method===(correction ? "pdf_text" : "ocr"));
  assert.equal(surname.value,"ŻUREK");
  async function command(c:Record<string,unknown>){v=await update(page,kamilPath,{expectedVersion:v.version,command:{...c,opKey:randomUUID()}});}
  for (const c of v.candidates) await command({type:"confirm",key:c.key,value:c.value,origin:c.origin});
  await command({type:"chat",text:"Od 15 grudnia 2026. Jeden tydzień, drugi zostawię na później"});
  await command({type:"chat",text:"Nie"});
  await command({type:"create_draft"});
  if(correction) {
    await command({type:"chat",text:"Jednak od 16 grudnia 2026, jeden tydzień"});
    assert.ok(v.draft?.stale);
    await command({type:"create_draft"});
  }
  const start=correction ? "2026-12-16" : "2026-12-15", end=correction ? "2026-12-22" : "2026-12-21";
  assert.equal(v.result.status,"eligible");
  assert.equal(v.result.period?.start,start);assert.equal(v.result.period?.end,end);
  assert.equal(v.result.deadline,correction ? "2026-12-15" : "2026-12-14");
  await page.reload();
  const download=page.getByRole("link",{name:"Pobierz PDF do wydruku"});
  await download.waitFor({timeout:40000});
  const fileBytes=await download.evaluate(async node=>Array.from(new Uint8Array(await (await fetch((node as HTMLAnchorElement).href)).arrayBuffer())));
  const text=await pdfText(new Uint8Array(fileBytes));
  assert.ok(text.includes(correction ? "16.12.2026" : "15.12.2026") && text.includes(correction ? "22.12.2026" : "21.12.2026"));
  await command({type:"simulate_submit"});
  const cacheKey = () => page.evaluate(async () => (await (await fetch("/api/zusik/session",{method:"POST"})).json()).documentCache);
  const firstCache=await cacheKey();
  assert.ok(firstCache);
  await page.context().clearCookies();
  await page.reload();
  await page.locator('input[type=file]').first().waitFor();
  assert.notEqual(await cacheKey(),firstCache);
  const fresh=await read<KamilView>(page,kamilPath);
  assert.ok(!fresh.draft && !fresh.candidates.length);
}
async function evidencePdf(partial:boolean) {
  const common=["Osoba: DEMO-F","Płatnik: F","Tytuł: pracownik"];
  const history=["Dokument: historia ubezpieczenia","Osoba: DEMO-F","Płatnik: wszystkie","Tytuł: wszystkie","Okres: 2026-11-03 / 2026-11-16","Ustalenie: nigdy wcześniej nie podlegała ubezpieczeniu chorobowemu"];
  const pages=[history,["Dokument: e-ZLA",...common,"Okres: 2026-11-03 / 2026-11-16","Początek ciągłej niezdolności: 2026-11-03","Ustalenie: niezdolność do pracy","Kod: B"],
    ["Dokument: ustalenie tytułu",...common,"Okres: 2026-11-01 / "+(partial ? "2026-11-06":"2026-11-30"),"Ustalenie: brak ubezpieczenia z tego tytułu"]];
  const pdf=await PDFDocument.create();pdf.registerFontkit(fontkit);
  const font=await pdf.embedFont(await readFile("public/forms/fonts/DejaVuSans.ttf"),{subset:true});
  for(const lines of pages) {
    const p=pdf.addPage();
    ["ZUSIK DEMO / 1",...lines].forEach((line,i)=>p.drawText(line,{x:30,y:750-i*25,font,size:11}));
  }
  return Buffer.from(await pdf.save());
}
async function testSickness(page:Page,partial:boolean) {
  await page.goto(origin+"/app/chorobowe");
  await page.getByRole("button",{name:/Czy za dni zwolnienia/}).click();
  const file=page.locator('input[type=file]');
  await file.setInputFiles({name:"strony.pdf",mimeType:"application/pdf",buffer:await evidencePdf(partial)});
  const confirm=page.getByRole("button",{name:/Potwierdzam odczyt/});
  await confirm.click({timeout:35000});
  await page.waitForFunction(()=>document.body.innerText.includes("Zapisano"),{},{timeout:25000});
  let v=await read<SicknessView>(page,sickPath);
  assert.equal(v.assessment.period.from,"2026-11-03");
  if(!partial) {
    v=await update(page,sickPath,{type:"confirm",version:v.version,answer:"no"});
    assert.equal(v.assessment.status,"not_entitled_for_period");
    assert.ok(v.assessment.law.length>=2);
    assert.equal(v.evidence.find(e=>e.title.includes("e-ZLA"))?.page,2);
    const receipt=await page.request.get(origin+v.evidence[0].url,{headers:await browserHeaders(page)});
    assert.equal(receipt.status(),200);
    const other=await page.context().browser()!.newContext();
    try {assert.ok([401,404].includes((await other.request.get(origin+v.evidence[0].url)).status()));} finally {await other.close();}
  } else assert.ok(["needs_fact","requires_review"].includes(v.assessment.status));
  await page.reload();assert.equal((await read<SicknessView>(page,sickPath)).assessment.status,v.assessment.status);
}
async function testCitations(page:Page) {
  await page.goto(origin+"/app");
  await page.waitForFunction(()=>Array.from(document.querySelectorAll("button")).some(b=>b.textContent==="Porównaj warianty" && !b.disabled));
  const result=await page.request.post(origin+"/api/zusik/ask",{headers:await browserHeaders(page),
    data:{question:"Czy oboje możemy w tym samym czasie korzystać z urlopu rodzicielskiego?",requestId:randomUUID()},timeout:65000});
  assert.equal(result.status(),200);
  const {turn}=await result.json();
  assert.equal(turn.status,"answered");
  assert.ok(turn.citations.some((c:{url:string;quote:string;fragmentId:string})=>
    ["kp-art182-1a-par6","mrpips-dzielenie-jednoczesnie"].includes(c.fragmentId) && c.quote.length>15 && c.url.startsWith("https://")));
  await page.reload();
  await page.getByText(turn.question,{exact:true}).first().waitFor();
}
async function run() {
  const browser=await chromium.launch({channel:"chrome", headless:true});
  const cases=[["M1",testMarta,false],["M2",testMarta,true],["K1",testKamil,false],["K2",testKamil,true],["D1",testSickness,false],["D2",testSickness,true],["RAG",testCitations,false]] as const;
  let failures=0;
  try {
    for (const [id,test,variation] of cases) {
      if(process.argv[3] && !process.argv[3].split(",").includes(id)) continue;
      const context=await browser.newContext();
      const started=Date.now();
      try {await test(await context.newPage(),variation);console.log(id,"PASS",Date.now()-started,"ms");}
      catch(error){failures++; console.error(id,"FAIL",String(error).slice(0,550));}
      finally {await context.close();}
    }
  } finally {await browser.close();}
  if(failures)process.exitCode=1;
}
run().catch(e=>{console.error(String(e));process.exitCode=1;});
