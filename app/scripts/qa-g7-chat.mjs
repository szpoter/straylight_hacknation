// The 68 public G7 prompts through the ordinary composer. Rank receipts are measured by zusik-eval-g7.ts.
// --memory-manifest-only checks the eight memory scenarios against all versioned public source links.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { chromium } from "playwright-core";
import { previewCookies } from "./qa-preview-access.mjs";

const url = new URL("/app/rozmowa",process.argv[2]);
const local = ["localhost","127.0.0.1"].includes(url.hostname);
const access = local ? [] : await previewCookies(process.argv[2], process.argv[3]);
const dir = "tests/fixtures/zusik-acceptance/";
const raw = readFileSync(dir+"g7.jsonl","utf8");
assert.equal(createHash("sha256").update(raw).digest("hex"),"51ca95e212e91b7541369e327e70d467ed14ab6e02e590f2cadc9387e6b63781");
const rows = raw.trim().split("\n").map(s=>JSON.parse(s));
const cardAudit = process.argv.includes("--cards-only");
const memoryAudit = process.argv.includes("--memory-manifest-only");
const gold = JSON.parse(readFileSync(dir+"gold-evidence.json","utf8"));
const alts = JSON.parse(readFileSync(dir+"equivalent-evidence.json","utf8"));
const manifestSources = new Map();
if (cardAudit || memoryAudit) for (const pack of ["oferta","publiczne","marta"]) {
  const base = "corpus/" + pack + "/";
  const manifest = JSON.parse(readFileSync(base+"manifest.json","utf8"));
  const urls = new Map(manifest.documents.map(doc => [doc.id,doc.url]));
  for (const line of readFileSync(base+(manifest.fragmentsFile ?? "fragments.jsonl"),"utf8").trim().split("\n")) {
    const f = JSON.parse(line);
    manifestSources.set(f.corpusVersion+"/"+f.logicalId,urls.get(f.documentId)?.split("#")[0]);
  }
}
const browser = await chromium.launch({channel:"chrome"});
async function freshContext() {
  const ctx = await browser.newContext();
  if (access.length) await ctx.addCookies(access);
  return ctx;
}
const tally = {};
const failures = {};
const safeAnswer = s => !/przyznaję (?:ci|wam)|na pewno (?:dostaniesz|otrzymasz)/iu.test(s);
async function submit(page, question) {
  const chat = page.getByRole("region",{name:"Czat z Zusikiem"});
  await chat.getByRole("textbox",{name:"Wiadomość do Zusika"}).fill(question);
  const response = page.waitForResponse(r => r.request().method()==="POST" && new URL(r.url()).pathname.endsWith("/messages"),{timeout:65000});
  const notice = chat.getByRole("status");
  const result = Promise.race([response.then(r=>({response:r})),
    notice.waitFor({timeout:65000}).then(async()=>({notice:await notice.innerText()}))]);
  // Consume the wait if click fails before submission.
  result.catch(()=>{});
  await chat.getByRole("button",{name:"Wyślij",exact:true}).click();
  const outcome = await result;
  if (!outcome.response) return {answer:outcome.notice,visibleRefs:[],clarify:true};
  if (outcome.response.status() >= 400) throw Error("http");
  const msg = await outcome.response.json();
  const turn = chat.locator("[data-knowledge-turn]").last();
  await turn.getByText(msg.answer,{exact:true}).first().waitFor({timeout:8000});
  const links = await turn.getByRole("link").evaluateAll(nodes=>nodes.map(n=>n.href));
  const visible = msg.citations.filter(c=>c.kind==="public_source" && links.includes(c.publicUrl) &&
    (memoryAudit ? manifestSources.get(c.version+"/"+c.ref) : gold[c.ref]?.url.split("#")[0]) === c.publicUrl.split("#")[0]);
  return {answer:msg.answer,visibleRefs:visible.map(c=>c.ref),visible,turn,msg,clarify:!msg.citations.length && /\?|podaj|doprecyzuj|potrzeb|brak|zakres/iu.test(msg.answer)};
}
async function inspectCards(sample, required) {
  if (!sample.turn) return "no_cards";
  const articles = sample.turn.getByRole("article");
  const titles = await articles.getByRole("heading").allTextContents();
  if (!required.every(name => titles.slice(0,3).some(title => title.toLocaleLowerCase("pl").includes(name)))) return "required_card_missing";
  for (const title of titles) {
    const card = sample.msg.opportunities?.find(c => c.title === title);
    if (!card?.citationIds.length) return "card_source_missing";
    const links = await articles.filter({hasText:title}).getByRole("link").evaluateAll(nodes=>nodes.map(n=>n.href));
    for (const ref of card.citationIds) {
      const c = sample.msg.citations.find(c => c.kind === "public_source" && c.ref === ref);
      if (!c || !links.includes(c.publicUrl) || manifestSources.get(c.version+"/"+ref) !== c.publicUrl.split("#")[0]) return "card_source_unverified";
    }
  }
  return "pass";
}
async function measure(row) {
  let ctx = await freshContext();
  try {
    let page = await ctx.newPage();
    page.setDefaultTimeout(12000);
    await page.goto(url.href);
    let sample, priorAnswered=false, priorText="";
    for (const [index,q] of row.questions.entries()) {
      if (index) {
        if (row.id==="memory-separate" && index===2) {
          await ctx.close();
          ctx = await freshContext();
          page = await ctx.newPage();
          await page.goto(url.href);
          assert.equal(await page.locator("[data-knowledge-turn]").count(),0);
        } else {
          await page.reload();
          if (priorText) await page.getByText(priorText,{exact:true}).first().waitFor({timeout:8000});
        }
      }
      sample = await submit(page,q);
      priorText = sample.clarify ? "" : sample.answer;
      if (row.id==="memory-separate" && index===1) priorAnswered=sample.visibleRefs.includes("zlobek-odbiorca");
    }
    const refs = id=>[id,...(alts[row.id]?.[id]??[])].some(v=>sample.visibleRefs.includes(v));
    const facts=(row.facts??[]).every(f=>new RegExp(f,"iu").test(sample.answer));
    if (!safeAnswer(sample.answer)) return "unsupported_award";
    if (row.group==="rag") return facts && row.requiredEvidence.every(refs) ? "pass" : "fact_or_visible_source";
    if (row.group==="clarification") return sample.clarify && facts ? "pass" : "clarification";
    if (row.group==="opportunity") {
      if (cardAudit) return await inspectCards(sample,row.requiredCards);
      const cards=await page.getByRole("log").getByRole("heading").allTextContents();
      return row.requiredCards.every(s=>cards.slice(-3).some(t=>t.toLowerCase().includes(s))) && sample.visibleRefs.length ? "pass" : "opportunity_cards";
    }
    if (row.id==="memory-separate") return priorAnswered && sample.clarify && !sample.visibleRefs.length ? "pass" : "new_context";
    if (row.id==="memory-correction") return /\b15\b|piętnaście/iu.test(sample.answer) ? "pass" : "correction";
    if (memoryAudit) console.log(JSON.stringify({id:row.id,expected:[row.expected,...(alts[row.id]?.[row.expected]??[])],
      visible:(sample.visible??[]).map(({ref,version,publicUrl})=>({ref,version,publicUrl}))}));
    return refs(row.expected) ? "pass" : "previous_source";
  } finally { await ctx.close(); }
}
async function lane(pending) {
  for (const row of pending) {
    let code;
    try { code = await measure(row); } catch (e) { code = e.message==="http" ? "http" : "incomplete_turn"; }
    console.log(JSON.stringify({ id: row.id, group: row.group, outcome: code }));
    const group = tally[row.group]??={passed:0,total:0};
    group.total++;
    if (code==="pass") group.passed++;
    else failures[code]=(failures[code]??0)+1;
  }
}
try {
  const selectedGroup = memoryAudit ? "memory" : cardAudit ? "opportunity" : null;
  const pending=(selectedGroup ? rows.filter(row=>row.group===selectedGroup) : rows).values();
  await Promise.all([lane(pending),lane(pending)]);
  console.log(JSON.stringify({groups:tally,errors:failures}));
  if(Object.values(tally).some(g=>g.passed!==g.total)) process.exitCode=1;
} finally { await browser.close(); }
