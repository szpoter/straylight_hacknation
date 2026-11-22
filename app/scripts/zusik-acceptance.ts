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
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import type { AskTurn } from "../src/lib/zusik/types";
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
  const firstName = "Marta Lis";
  let v = await update<MartaView>(page,martaPath,{type:"compare",firstName, secondName:"Paweł Lis",childName:"Ola Lis",
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
  await page.locator('input[name="statement"]').check();
  await page.getByLabel("Czy pracodawca ma już odpis aktu urodzenia?").selectOption(missingRate ? "yes" : "no");
  const certificate=await makeCertificatePdf({...kamilCertificate(), childFirstName:"OLA", childLastName:"LIS"});
  if(!missingRate) await page.locator('input[name="attachment"]').setInputFiles({
    name:"kopia-fikcyjna.pdf",mimeType:"application/pdf",buffer:Buffer.from(certificate)});
  const confirmation=page.waitForResponse(r=>r.url().endsWith(martaPath) && r.request().method()==="POST" &&
    r.request().postDataJSON()?.type==="confirm");
  await page.getByRole("button",{name:"Zatwierdź wniosek",exact:true}).click();
  assert.equal((await confirmation).status(),200,"Server confirms the application");
  await page.getByRole("link",{name:"Pobierz wniosek PDF",exact:true}).first().waitFor();
  if(!missingRate) {
    const attachment=page.getByRole("link",{name:"Pobierz kopię odpisu"}).first();
    await attachment.waitFor();
    await page.reload();
    await attachment.waitFor();
    const length=await attachment.evaluate(async node=>(await (await fetch((node as HTMLAnchorElement).href)).arrayBuffer()).byteLength);
    assert.equal(length,certificate.byteLength);
  }
  v=await read<MartaView>(page,martaPath);
  const pdf = await page.request.get(origin+martaPath+"/pdf",{headers:await browserHeaders(page)});
  assert.ok(v.confirmed,"Confirmed state was persisted before PDF download");
  assert.equal(pdf.status(),200,"Confirmed PDF returns HTTP 200");
  const text = await pdfText(await pdf.body());
  assert.ok(text.includes(firstName) && text.includes("10.11.2026") && text.includes("15.02.2027") && text.includes(missingRate ? "aktach osobowych" : "kopia-fikcyjna.pdf"));
  const preview = page.locator('iframe[title*="Wniosek"]');
  await preview.first().waitFor();
  const previewBlob = await preview.first().getAttribute("src");
  const downloadedBlob = await page.getByRole("link",{name:"Pobierz wniosek PDF",exact:true}).first().getAttribute("href");
  assert.equal(previewBlob?.split("#")[0], downloadedBlob);
  const previousVersion=v.version;
  const handoff = page.waitForResponse(response => response.url().endsWith(martaPath) && response.request().method() === "POST"
    && response.request().postDataJSON()?.type === "record_handoff");
  await page.getByRole("button", {name: "Potwierdzam samodzielne przekazanie pracodawcy"}).click();
  assert.equal((await handoff).status(),200);
  v=await read<MartaView>(page,martaPath);
  assert.ok(v.submittedAt && v.handoffRecordedByParent);
  const repeat=await page.request.post(origin+martaPath,{data:{type:"record_handoff",version:previousVersion},headers:await browserHeaders(page)});
  assert.equal(repeat.status(),409);
  await page.reload();
  assert.equal((await read<MartaView>(page,martaPath)).submittedAt,v.submittedAt);
  const other=await page.context().browser()!.newContext();
  try {assert.equal((await other.request.get(origin+martaPath+"/pdf")).status(),404);} finally {await other.close();}
}
async function sendCaseMessage<T>(page: Page, path: string, text: string): Promise<T> {
  const chat = page.getByRole("region", { name: "Czat z Zusikiem" });
  await chat.getByRole("textbox", { name: "Wiadomość do Zusika" }).fill(text);
  const [response] = await Promise.all([
    page.waitForResponse(r => r.url().endsWith(path) && r.request().method() === "POST"),
    chat.getByRole("button", { name: "Wyślij", exact: true }).click(),
  ]);
  assert.equal(response.status(), 200, path);
  return (await response.json()).view;
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
  // Restore the version just confirmed by the OCR fixture before using the chat.
  await page.reload();
  await sendCaseMessage<KamilView>(page, kamilPath, "Od 15 grudnia 2026. Jeden tydzień, drugi zostawię na później");
  v = await sendCaseMessage<KamilView>(page, kamilPath, "Nie");
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
  const previewUrl = await page.locator('iframe[title*="ZAM"]').first().getAttribute("src");
  assert.equal(previewUrl?.split("#")[0], await download.getAttribute("href"));
  assert.equal((await PDFDocument.load(new Uint8Array(fileBytes))).getPageCount(), 7);
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
  await page.goto(origin + "/app");
  const chat = page.getByRole("region", { name: "Czat z Zusikiem" });
  await chat.getByText("Zmień sprawę", { exact: true }).click();
  await chat.getByRole("link", { name: /Chorobowe w ciąży/ }).click();
  await page.waitForURL("**/app/chorobowe");
  await chat.getByText("Chorobowe w ciąży · Ocena prawa do zasiłku", {exact:true}).waitFor();
  await sendCaseMessage<SicknessView>(page, sickPath, "Czy za dni zwolnienia dostanę zasiłek?");

  const file=page.locator('input[type=file]');
  await file.setInputFiles({name:"strony.pdf",mimeType:"application/pdf",buffer:await evidencePdf(partial)});
  const confirm=page.getByRole("button",{name:/Potwierdzam odczyt/});
  await confirm.click({timeout:35000});
  await page.waitForFunction(()=>document.body.innerText.includes("Zapisano"),{},{timeout:25000});
  let v=await read<SicknessView>(page,sickPath);
  assert.equal(v.assessment.period.from,"2026-11-03");
  if(!partial) {
    v = await sendCaseMessage<SicknessView>(page, sickPath, "Nie");
    assert.equal(v.assessment.status,"not_entitled_for_period");
    assert.ok(v.assessment.law.length>=2);
    v = await sendCaseMessage<SicknessView>(page, sickPath, "Zakończ ocenę");
    assert.equal(v.closed, true);
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
  const citation=turn.citations.find((c:{url:string;quote:string;fragmentId:string})=>
    ["kp-art182-1a-par6","mrpips-dzielenie-jednoczesnie"].includes(c.fragmentId) && c.quote.length>15);
  assert.ok(citation);
  const source=new URL(citation.url);
  assert.ok(source.protocol==="https:" && ["eli.gov.pl","www.gov.pl","gov.pl"].includes(source.hostname));
  const officialPage=await page.request.get(source.href,{timeout:25000});
  assert.ok(officialPage.ok(),"Official citation HTTP "+officialPage.status());
  await page.reload();
  await page.getByText(turn.question,{exact:true}).first().waitFor();
}
async function askInChat(page: Page, question: string) {
  const input = page.getByRole("textbox", {name: "Wiadomość do Zusika"});
  await input.fill(question);
  const received = page.waitForResponse(r => r.url().endsWith("/api/zusik/ask") && r.request().method() === "POST", {timeout: 70000});
  await page.getByRole("button", {name:"Wyślij", exact:true}).click();
  const response = await received;
  assert.match(response.headers()["content-type"], /application\/x-ndjson/);
  const frames = (await response.text()).trim().split("\n").map(line => JSON.parse(line));
  assert.equal(frames[0].type, "activity");
  assert.ok(frames.some(frame => frame.type === "delta"));
  const last = frames.at(-1);
  assert.equal(last.type, "result");
  assert.equal(last.status, 200);
  const turn = last.body.turn as AskTurn;
  assert.equal(turn.status, "answered");
  await page.getByRole("button", {name: /^Źródło /}).last().waitFor();
  return { turn, retrieval: last.body.retrieval };
}

async function testNewQuestion(page: Page) {
  await page.goto(origin + "/app");
  await page.waitForFunction(() => Array.from(document.querySelectorAll("button")).some(b => b.textContent === "Porównaj warianty" && !b.disabled));
  const ask = (question: string) => askInChat(page, question);
  await page.evaluate(() => {
    const seen = new Set<string>();
    new MutationObserver(() => {
      const text = document.querySelector('p[aria-live="off"]')?.textContent;
      if (text) seen.add(text);
      document.body.dataset.partialSteps = String(seen.size);
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  });
  const { turn, retrieval } = await ask("Wyczerpałam zasiłek chorobowy, nadal nie mogę pracować, a lekarz przewiduje powrót po leczeniu. Czy jest świadczenie na dalszy okres i na jak długo?");
  assert.ok(Number(await page.locator("body").getAttribute("data-partial-steps")) > 1, "Progressive text visible in the browser");
  const citation = turn.citations.find(c => c.fragmentId === "uz-18-1");
  assert.ok(retrieval?.top.includes("uz-18-1") && retrieval.evidence.includes("uz-18-1"));
  if (retrieval.backend?.startsWith("local-")) assert.match(retrieval.attemptId, /^[a-f0-9-]{36}$/i);
  const article = loadCorpus("publiczne").fragments.get("uz-18-1");
  assert.ok(citation && citation.page === 7 && citation.quote.length > 15 && article?.sourceText.includes(citation.quote),
    "The displayed quotation must be verbatim from Article 18, page 7");
  assert.match(turn.claims.map(c => c.text).join(" "), /12|dwunast/i);
  await page.reload();
  await page.getByText(turn.question, {exact:true}).waitFor();
  const { turn: followUp, retrieval: followUpRetrieval } = await ask("Skąd są te dane?");
  assert.equal(followUpRetrieval, null);
  assert.ok(followUp.citations.some(c => c.fragmentId === citation.fragmentId && c.url === citation.url));
  await page.getByText(followUp.message, {exact:true}).last().waitFor();
  const index = followUp.citations.findIndex(c => c.fragmentId === "uz-18-1");
  await page.getByRole("button", {name: new RegExp("^Źródło " + (index + 1) + ":")}).last().click();
  await page.getByRole("link", {name: /Otwórz dokument na s. 7/}).last().waitFor();
}
async function testFollowUps(page: Page) {
  await page.goto(origin + "/app");
  await page.getByRole("textbox", { name: "Wiadomość do Zusika" }).waitFor();
  const cases = [
    { question: "Moja córka zaczęła liceum. Wydałam sporo na szkolną wyprawkę. Czy jest jakieś dofinansowanie?", id: "dobry-start", text: /300/ },
    { question: "A do kiedy mogę to załatwić?", id: "dobry-start-termin", text: /30 listopada/i },
    { question: "A którędy mogę to wysłać?", id: "dobry-start-kanaly", text: /(?:mZUS|eZUS|Emp@tia|bankowoś)/i },
  ];
  const history = new Set<string>();
  for (const item of cases) {
    if (history.size === 1) {
      await page.reload();
      await page.getByText(cases[0].question, {exact:true}).waitFor();
    }
    const {turn, retrieval} = await askInChat(page, item.question);
    const cited = turn.citations.find(c => c.fragmentId === item.id);
    assert.ok(cited && retrieval?.top.includes(item.id) && retrieval.evidence.includes(item.id),
      "Missing matching raw hit, evidence or citation: " + item.id);
    const original = loadCorpus("oferta").fragments.get(item.id);
    assert.ok(original?.sourceText.includes(cited.quote), "Citation must match the official source");
    assert.match(turn.claims.map(c => c.text).join(" "), item.text);
    if (history.size) {
      assert.ok(history.has(retrieval.contextRequestId), "Follow-up must resolve against this case");
      assert.equal(retrieval.top[0], item.id, "The requested detail should be the first Qdrant match");
      assert.match(retrieval.query, /Dobry Start/i);
    }
    history.add(turn.requestId);
  }
  const control = await page.request.post(origin + "/api/zusik/ask", {
    headers: await browserHeaders(page),
    data: { scenario: "chorobowe", requestId: randomUUID(), question: cases[1].question },
  });
  assert.equal(control.status(), 200);
  const result = await control.json();
  assert.equal(result.turn.status, "needs_clarification", "The same follow-up in an empty case needs a subject");
  assert.equal(result.turn.citations.length, 0);
  assert.equal(result.retrieval, null);
}
async function testLoginToChat(page: Page) {
  await page.goto(origin);
  await page.locator('header a[href="/logowanie"]').click();
  await page.getByRole("link", {name: /^login\.gov\.pl/i}).click();
  await page.getByRole("link", {name: /^Aplikacja mObywatel/i}).click();
  await page.getByRole("button", {name: "Symuluj zeskanowanie kodu"}).click();
  await page.waitForURL("**/plan");
  await page.goto(origin + "/app/sprawy");
  const open = page.getByRole("button", {name: "Otwórz czat z Zusikiem"});
  await open.click();
  assert.equal(new URL(page.url()).pathname, "/app/sprawy");
  const chat = page.getByRole("region", {name: "Czat z Zusikiem"});
  const draft = chat.getByRole("textbox", {name: "Wiadomość do Zusika"});
  const question = "Czy wniosek o Dobry Start mogę wysłać przez mZUS?";
  await draft.fill(question);
  await chat.getByRole("button", {name: "Pełny ekran"}).click();
  await chat.getByRole("button", {name: "Podziel ekran"}).click();
  await chat.getByRole("button", {name: "Zwiń czat"}).click();
  await page.waitForFunction(() => document.activeElement?.getAttribute("aria-label") === "Otwórz czat z Zusikiem");
  await page.setViewportSize({width: 390, height: 844});
  await open.click();
  assert.equal(await draft.inputValue(), question);
  assert.ok(await draft.evaluate(el => el === document.activeElement));
  const sent = page.waitForRequest(r => r.url().endsWith("/api/zusik/ask") && r.method() === "POST");
  const response = page.waitForResponse(r => r.url().endsWith("/api/zusik/ask") && r.request().method() === "POST");
  const answer = askInChat(page, question);
  await sent;
  await chat.getByRole("button", {name: "Zwiń czat"}).click();
  await (await response).finished();
  await open.click();
  const {turn, retrieval} = await answer;
  assert.ok(turn.citations.some(c => c.fragmentId === "dobry-start-kanaly"));
  assert.ok(retrieval.evidence.includes("dobry-start-kanaly"));
  await page.reload();
  await open.click();
  await chat.getByText(question, {exact: true}).waitFor();
  const general = await read<{turns: AskTurn[]}>(page, "/api/zusik/state?scenario=ogolna");
  assert.ok(general.turns.some(saved => saved.requestId === turn.requestId));
  await chat.getByRole("button", {name: "Zwiń czat"}).click();
  await page.goto(origin + "/plan");
  await page.waitForURL("**/plan");
  const pawn = page.getByRole("button", {name: /Otwórz czat z Zusikiem$/});
  assert.equal(await pawn.count(), 1, "One visible launcher on the map");
  await pawn.click();
  await chat.getByText(/^Ola · /).waitFor();
  assert.equal(await chat.getByText(question, {exact: true}).count(), 0);
  await chat.getByRole("button", {name: "Zwiń czat"}).click();

  await page.getByRole("link", {name: "Zobacz wsparcie"}).click();
  await page.waitForURL("**/wsparcie");
  await open.click();
  await chat.getByText("Ola · Wsparcie", {exact: true}).waitFor();
  await chat.getByRole("button", {name: "Zwiń czat"}).click();
  const profileTab = page.locator('a[href="/profil"]:visible').first();
  await profileTab.click();
  await page.waitForURL("**/profil");
  await page.locator('nav a[href="/profil"][aria-current="page"]:visible').waitFor();
  await open.click();
  await chat.getByText("Ola · Profil", {exact: true}).waitFor();
  await chat.getByRole("button", {name: "Zwiń czat"}).click();
  await page.locator('a[href="/dokumenty"]:visible').first().click();
  await page.waitForURL("**/dokumenty");
  await page.locator('nav a[href="/dokumenty"][aria-current="page"]:visible').waitFor();
  await open.click();
  await chat.getByText("Ola · Dokumenty", {exact: true}).waitFor();
  await chat.getByRole("button", {name: "Zwiń czat"}).click();

  await page.getByRole("link", {name: "Urlop ojcowski", exact: true}).click();
  await page.getByRole("button", {name: "Zapytaj o ten wniosek", exact: true}).click();
  await chat.getByText("Ola · Urlop ojcowski", {exact: true}).waitFor();
  const contextualQuestion = "Ile wcześniej pracownik musi złożyć wniosek?";
  const request = page.waitForRequest(r => r.url().endsWith("/api/zusik/ask") && r.method() === "POST");
  const contextual = await askInChat(page, contextualQuestion);
  const payload = (await request).postDataJSON();
  assert.deepEqual(payload.family, {planId: "ola", stopId: "urlop-ojcowski"});
  assert.ok(contextual.turn.citations.some(c => c.fragmentId === "kp-1823-2"));
  await page.reload();
  await open.click();
  await chat.getByText(contextualQuestion, {exact: true}).waitFor();
  await chat.getByRole("button", {name: "Zwiń czat"}).click();
  for (const other of ["planId=oczekiwane&stopId=urlop-ojcowski", "planId=ola", "planId=ola&stopId=rodzicielski"]) {
    const isolated = await read<{turns: AskTurn[]}>(page, "/api/zusik/state?scenario=ogolna&" + other);
    assert.ok(!isolated.turns.some(saved => saved.requestId === contextual.turn.requestId), "Conversation isolated: " + other);
  }
  await page.goto(origin + "/app/sprawy");
  await open.click();
  await chat.getByText(question, {exact: true}).waitFor();
  await chat.getByText("Zmień sprawę", {exact: true}).click();
  await chat.getByRole("link", {name: /Marta i Paweł/}).click();
  await page.waitForURL("**/app");
  const view = await read<{turns: AskTurn[]}>(page, "/api/zusik/state?scenario=marta");
  assert.ok(!view.turns.some(turn => turn.question === question), "General conversation stays outside Marta's case");
}
async function testGreetings(page: Page) {
  // Reproduce a cold session while the parent is already typing the first message.
  let releaseSession!: () => void;
  const holdSession = new Promise<void>(resolve => { releaseSession = resolve; });
  await page.route("**/api/zusik/session", async route => { await holdSession; await route.continue(); }, { times: 1 });
  for (const [route, question, expected] of [
    ["/app", "Siema, Zusik!", "porównać terminy"],
    ["/app/kamil", "Dzień dobry, Zusiku!", "wnioskiem ZAM"],
    ["/app/chorobowe", "Hejka 👋", "dokumenty ubezpieczenia"],
  ]) {
    await page.goto(origin + route);
    const chat = page.getByRole("region", {name:"Czat z Zusikiem"});
    const input = chat.getByRole("textbox", {name:"Wiadomość do Zusika"});
    if (route !== "/app") {
      const log = chat.getByRole("log", {name:"Przebieg rozmowy"});
      await log.waitFor();
      assert.equal(await log.locator('[role="log"]').count(), 0, "A case has one conversation log");
    }
    await input.fill(question);
    const send = chat.getByRole("button", {name:/Wyślij/});
    if (route === "/app") {
      const waiting = await send.isDisabled();
      releaseSession();
      assert.ok(waiting, "First message waits for the signed session");
    }
    const response = page.waitForResponse(r => r.url().endsWith("/api/zusik/ask") && r.request().method() === "POST");
    await send.click();
    const frames = (await (await response).text()).trim().split("\n");
    const {body} = JSON.parse(frames.at(-1)!);
    assert.equal(body.turn.status, "conversation");
    assert.equal(body.retrieval, null);
    assert.ok(body.turn.message.includes(expected));
    await chat.getByText(body.turn.message, {exact:true}).waitFor();
    await page.reload();
    await chat.getByText(question, {exact:true}).waitFor();
    if (route !== "/app") assert.equal(await chat.getByText("Siema, Zusik!", {exact:true}).count(), 0);
  }
}
async function run() {
  const browser=await chromium.launch({channel:"chrome", headless:true});
  const cases=[["M1",testMarta,false],["M2",testMarta,true],["K1",testKamil,false],["K2",testKamil,true],["D1",testSickness,false],["D2",testSickness,true],["RAG",testCitations,false],["NOWA",testNewQuestion,false],["CZAT",testGreetings,false],["KONTEKST",testFollowUps,false],["START",testLoginToChat,false]] as const;
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
