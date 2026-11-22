/** From app/: node --import tsx scripts/zusik-eval-g7.ts <origin> <corpus|official_live|baseline|g7> */
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { locateQuote } from "../src/lib/rag/answer";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import type { AskCitation, AskTurn, CaseView } from "../src/lib/zusik/types";

type Trial = {
  id: string; group: string; questions: string[]; facts?: string[]; requiredEvidence?: string[];
  expected?: string; requiredCards?: string[];
};
type Citation = AskCitation & { origin?: string; hash?: string; retrievedAt?: string };
type Receipt = {
  top?: string[]; evidence?: string[]; officialFetches?: number; contextRequestId?: string;
  backend?: string; model?: string; attemptId?: string; quoteReason?: string;
};
type Sample = { turn: AskTurn; retrieval: Receipt | null };
const designated = "zlobek-odbiorca";
const pagePath = "/aktywnyrodzic/wiadczenie-aktywnie-w-zlobku";
const digest = "51ca95e212e91b7541369e327e70d467ed14ab6e02e590f2cadc9387e6b63781";

function goldCatalogue(): Map<string, { url: string; sha256: string; locator: string }> {
  const raw = readFileSync("tests/fixtures/zusik-acceptance/gold-evidence.json", "utf8");
  assert.equal(createHash("sha256").update(raw).digest("hex"), "3c37e429c43094e834ae9f0016a6701cdb12010c2c4da31a9fe629c7e65d36af", "Golden sources changed");
  return new Map(Object.entries(JSON.parse(raw)));
}

const gold = goldCatalogue();

function trials(): Trial[] {
  const body = readFileSync("tests/fixtures/zusik-acceptance/g7.jsonl", "utf8");
  assert.equal(createHash("sha256").update(body).digest("hex"), digest, "Frozen input and evidence IDs changed");
  return body.trim().split("\n").map(line => JSON.parse(line));
}

async function session(origin: string) {
  const response = await fetch(origin + "/api/zusik/session", {
    method: "POST", headers: { Origin: origin }, redirect: "error", signal: AbortSignal.timeout(20000),
  });
  assert.equal(response.status, 200, "Synthetic session");
  const cookie = response.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
  assert.ok(cookie, "Missing signed cookie");
  const headers = { Origin: origin, Cookie: cookie, "Content-Type": "application/json" };
  return {
    async ask(question: string, planId?: string): Promise<Sample> {
      const started = performance.now();
      const response = await fetch(origin + "/api/zusik/ask", {
        method: "POST", headers, redirect: "error", signal: AbortSignal.timeout(75000),
        body: JSON.stringify({ question, scenario: "ogolna", requestId: randomUUID(), family: planId ? { planId } : undefined }),
      });
      const sample = await response.json() as Sample;
      console.log(JSON.stringify({ question, http: response.status, ms: Math.round(performance.now() - started),
        cost: null, status: sample.turn?.status, message: sample.turn?.message, claims: sample.turn?.claims,
        citations: sample.turn?.citations, retrieval: sample.retrieval }));
      assert.equal(response.status, 200, "Answer HTTP status");
      assert.ok(sample.turn, "Missing saved answer");
      return sample;
    },
    async reload(planId?: string): Promise<AskTurn[]> {
      const params = new URLSearchParams({ scenario: "ogolna" });
      if (planId) params.set("planId", planId);
      const r = await fetch(origin + "/api/zusik/state?" + params, { headers, redirect: "error", signal: AbortSignal.timeout(20000) });
      assert.equal(r.status, 200, "History HTTP status");
      const { view } = await r.json() as { view: CaseView };
      return view.turns;
    },
  };
}

function verified(c: AskCitation) {
  for (const name of ["oferta", "publiczne", "marta"]) {
    const pack = loadCorpus(name);
    const f = pack.fragments.get(c.fragmentId);
    if (!f || pack.manifest.corpusVersion !== c.corpusVersion) continue;
    if (c.url.split("#")[0] !== pack.documents.get(f.documentId)?.url.split("#")[0]) continue;
    const reference = gold.get(c.fragmentId);
    if (reference && (reference.sha256 !== f.fragmentSha256 || reference.url !== c.url.split("#")[0] || reference.locator !== c.locator)) continue;
    if (locateQuote(f.sourceText, c.quote)) return true;
  }
  return false;
}

const matches = (patterns: string[], value: string) => patterns.every(p => new RegExp(p, "iu").test(value));

function supportsClaim(id: string, text: string) {
  if (id === "quarantine") {
    const equivalence = /na równi|równoznaczn|równoważn|trakt(?:uje|owane|owana).{0,45}(?:jak|jako)|zrównan/iu;
    const denial = /nie (?:są |jest |bywają )?(?:na równi|równoznaczn|równoważn|trakt|zrównan)|nie traktuje|nie przysługuje/iu;
    return equivalence.test(text) && !denial.test(text);
  }
  if (id === "detention") {
    return /(?:wyjąt|chyba że|jednak|jeżeli|jeśli)/iu.test(text)
      && !/bez (?:żadnych )?wyjątków|nawet (?:gdy|jeśli).{0,50}odpłat/iu.test(text);
  }
  return true;
}

export function ragAssertions(trial: Trial, { turn, retrieval }: Sample) {
  const required = trial.requiredEvidence ?? [];
  const facts = trial.facts ?? [];
  const claims = turn.claims.map(c => c.text).join(" ");
  const citations = turn.citations.filter(c => required.includes(c.fragmentId));
  const quotes = citations.map(c => c.quote).join(" ");
  const linked = turn.claims.every(c => c.citationIds.length > 0 && c.citationIds.every(id => turn.citations.some(x => x.id === id)));
  return {
    raw: required.every(id => retrieval?.top?.slice(0, 5).includes(id)),
    evidence: required.every(id => retrieval?.evidence?.includes(id)),
    citation: required.every(id => citations.some(c => c.fragmentId === id)) && turn.citations.every(verified),
    quoteAspect: matches(facts, quotes),
    fact: matches(facts, claims) && supportsClaim(trial.id, claims),
    action: turn.status === "answered" && linked && turn.claims.length > 0,
  };
}

function recipient({ turn, retrieval }: Sample, mode: string) {
  const c = turn.citations.find(c => c.fragmentId === designated || (c as Citation).origin === "official_live") as Citation | undefined;
  assert.ok(c, "Missing recipient citation");
  const url = new URL(c.url);
  assert.equal(url.origin, "https://www.zus.pl");
  assert.equal(url.pathname.replace(/^\/pl\//, "/"), pagePath);
  assert.ok(/komu wypłacamy|jak będziemy wypłacać/iu.test(c.locator + " " + c.headingPath.join(" ")), "Wrong source section");
  const official = loadCorpus("oferta").fragments.get(designated);
  assert.ok(official && locateQuote(official.sourceText, c.quote), "Quote not present in the independently saved source");
  assert.match(c.quote, /rachunek bankowy podmiotu, który prowadzi żłobek/iu);
  assert.equal(c.origin, mode);
  assert.match(c.hash ?? "", /^[0-9a-f]{64}$/);
  assert.equal(official.fragmentSha256, gold.get(designated)?.sha256);
  if (mode === "corpus") assert.equal(c.hash, official.fragmentSha256);
  else assert.ok(c.retrievedAt && Number.isFinite(Date.parse(c.retrievedAt)), "Missing web retrieval timestamp");
  assert.equal(retrieval?.officialFetches, mode === "corpus" ? 0 : 1);
  assert.equal(retrieval?.top?.slice(0, 5).includes(designated), mode === "corpus");
  assert.equal(turn.status, "answered");
  const statement = turn.claims.filter(x => x.citationIds.includes(c.id)).map(x => x.text).join(" ");
  assert.match(statement, /(?:placówk|żłob|podmiot.{0,45}prowadz)/iu);
  assert.match(statement, /(?:na (?:rachunek|konto)|(?:dostaje|otrzymuje|trafia do|przekazuj).{0,45}(?:placówk|żłob|podmiot))/iu);
  assert.doesNotMatch(statement, /(?:przekazujemy|przelewa|trafia|wypłaca) (?:je |się )?(?:(?:na (?:konto|rachunek) )?rodzic(?:owi|a)|tobie)/iu);
}

async function nursery(origin: string, mode: string, cases: Trial[]) {
  const client = await session(origin);
  const trial = cases.find(c => c.id === "memory-nursery");
  assert.ok(trial);
  const [intro, followup] = trial.questions;
  const first = await client.ask(intro);
  assert.match([first.turn.message, ...first.turn.claims.map(c => c.text)].join(" "), /aktywnie w żłobku/iu);
  const history = await client.reload();
  assert.equal(history.length, 1);
  assert.deepEqual(history[0].citations, first.turn.citations);
  assert.equal(history[0].requestId, first.turn.requestId);
  const second = await client.ask(followup);
  recipient(second, mode);
  const restored = await client.reload();
  assert.equal(restored.length, 2);
  assert.equal(restored[1].requestId, second.turn.requestId);
  assert.deepEqual(restored[1].citations, second.turn.citations);
  console.log(JSON.stringify({ passed: true, mode, reload: "server state", turns: restored.length }));
}

async function score(origin: string, trial: Trial) {
  const client = await session(origin);
  let last: Sample | undefined;
  const split = trial.id === "memory-separate";
  for (const [i, question] of trial.questions.entries()) {
    const plan = split ? (i === 2 ? "plan-b" : "plan-a") : undefined;
    if (i > 0) {
      const restored = await client.reload(plan);
      if (split && i === 2) assert.equal(restored.length, 0);
      else {
        assert.equal(restored.at(-1)?.requestId, last?.turn.requestId);
        assert.deepEqual(restored.at(-1)?.citations, last?.turn.citations);
      }
    }
    last = await client.ask(question, plan);
  }
  assert.ok(last);
  const { turn } = last;
  const text = [turn.message, ...turn.claims.map(c => c.text)].join(" ");
  if (trial.group === "rag") return ragAssertions(trial, last);
  if (trial.group === "clarification" || split) return {
    action: ["needs_clarification", "insufficient_evidence", "conversation"].includes(turn.status),
    noAward: !/przyznaję|przyznaliśmy|na pewno (otrzymasz|dostaniesz)/iu.test(text),
    fact: matches(trial.facts ?? [], text),
  };
  if (trial.group === "opportunity") {
    const cards = (turn as AskTurn & { opportunities?: { title: string; citationIds: string[] }[] }).opportunities ?? [];
    assert.ok(trial.requiredCards?.length);
    return { requiredCards: trial.requiredCards.every(name => cards.slice(0, 3).some(card => card.title.toLocaleLowerCase("pl").includes(name))),
      citations: cards.length > 0 && cards.every(card => card.citationIds.length > 0 &&
        card.citationIds.every(id => turn.citations.some(c => c.id === id && verified(c)))) };
  }
  if (trial.id === "memory-correction") return { fact: /\b15\b|piętnaście/iu.test(text) };
  return { citation: turn.citations.some(c => c.fragmentId === trial.expected && verified(c)) };
}

async function main() {
  const [target, mode] = process.argv.slice(2);
  assert.ok(target && ["corpus", "official_live", "g7", "baseline"].includes(mode), "Usage: <origin> <corpus|official_live|g7|baseline>");
  const origin = new URL(target).origin;
  const cases = trials();
  console.log(JSON.stringify({ runnerSha: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    origin, mode, fixtureSha256: digest, evaluatorCorpusVersions: Object.fromEntries(
      ["oferta", "marta", "publiczne"].map(name => [name, loadCorpus(name).manifest.corpusVersion])),
  }));
  if (mode === "corpus" || mode === "official_live") return nursery(origin, mode, cases);
  const rows = mode === "baseline" ? cases.filter(c => ["detention", "quarantine"].includes(c.id)) : cases;
  let failures = 0;
  const groups: Record<string, { passed: number; total: number }> = {};
  for (const row of rows) {
    const group = groups[row.group] ??= { passed: 0, total: 0 };
    group.total++;
    try {
      const checks = await score(origin, row);
      const pass = Object.values(checks).every(Boolean);
      if (!pass) failures++;
      else group.passed++;
      console.log(JSON.stringify({ id: row.id, group: row.group, expected: row.requiredEvidence ?? row.requiredCards ?? row.expected,
        checks, pass }));
    } catch (error) {
      failures++;
      console.log(JSON.stringify({ id: row.id, group: row.group, error: String(error), pass: false }));
    }
  }
  console.log(JSON.stringify({ passed: rows.length - failures, total: rows.length, groups, fixtureSha256: digest }));
  if (failures) process.exitCode = 1;
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url)
  main().catch(error => { console.error(String(error)); process.exitCode = 1; });
