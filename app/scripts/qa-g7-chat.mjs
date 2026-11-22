// The 68 public G7 prompts through the ordinary composer. Rank receipts are measured by zusik-eval-g7.ts.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { chromium } from "playwright-core";

const url = new URL("/app/rozmowa",process.argv[2]);
assert.ok(["localhost","127.0.0.1"].includes(url.hostname));
const dir = "tests/fixtures/zusik-acceptance/";
const raw = readFileSync(dir+"g7.jsonl","utf8");
assert.equal(createHash("sha256").update(raw).digest("hex"),"51ca95e212e91b7541369e327e70d467ed14ab6e02e590f2cadc9387e6b63781");
const rows = raw.trim().split("\n").map(s=>JSON.parse(s));
const gold = JSON.parse(readFileSync(dir+"gold-evidence.json","utf8"));
const alts = JSON.parse(readFileSync(dir+"equivalent-evidence.json","utf8"));
const browser = await chromium.launch({channel:"chrome"});
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
  const visibleRefs = msg.citations.filter(c=>c.kind==="public_source" && links.includes(c.publicUrl) &&
    gold[c.ref]?.url.split("#")[0] === c.publicUrl.split("#")[0]).map(c=>c.ref);
  return {answer:msg.answer,visibleRefs,clarify:!msg.citations.length && /\?|podaj|doprecyzuj|potrzeb|brak|zakres/iu.test(msg.answer)};
}
async function measure(row) {
  let ctx = await browser.newContext();
  try {
    let page = await ctx.newPage();
    page.setDefaultTimeout(12000);
    await page.goto(url.href);
    let sample, priorAnswered=false, priorText="";
    for (const [index,q] of row.questions.entries()) {
      if (index) {
        if (row.id==="memory-separate" && index===2) {
          await ctx.close();
          ctx = await browser.newContext();
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
      const cards=await page.getByRole("log").getByRole("heading").allTextContents();
      return row.requiredCards.every(s=>cards.slice(-3).some(t=>t.toLowerCase().includes(s))) && sample.visibleRefs.length ? "pass" : "opportunity_cards";
    }
    if (row.id==="memory-separate") return priorAnswered && sample.clarify && !sample.visibleRefs.length ? "pass" : "new_context";
    if (row.id==="memory-correction") return /\b15\b|piętnaście/iu.test(sample.answer) ? "pass" : "correction";
    return refs(row.expected) ? "pass" : "previous_source";
  } finally { await ctx.close(); }
}
async function lane(pending) {
  for (const row of pending) {
    let code;
    try { code = await measure(row); } catch (e) { code = e.message==="http" ? "http" : "incomplete_turn"; }
    const group = tally[row.group]??={passed:0,total:0};
    group.total++;
    if (code==="pass") group.passed++;
    else failures[code]=(failures[code]??0)+1;
  }
}
try {
  const pending=rows.values();
  await Promise.all([lane(pending),lane(pending)]);
  console.log(JSON.stringify({groups:tally,errors:failures}));
  if(Object.values(tally).some(g=>g.passed!==g.total)) process.exitCode=1;
} finally { await browser.close(); }
