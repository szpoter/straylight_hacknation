// Run a frozen extension trial against an isolated staging app with official HTTP disabled.
// node scripts/zusik-extension-check.mjs full http://127.0.0.1:3294
// node scripts/zusik-extension-check.mjs withdrawn http://127.0.0.1:3295
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

const [mode, target] = process.argv.slice(2);
if (!["full", "withdrawn"].includes(mode) || !target) throw Error("Expected full|withdrawn and a local app origin");
const root = new URL(target);
if (!["localhost", "127.0.0.1"].includes(root.hostname)) throw Error("This trial needs an isolated local app");
const fixture = new URL("../tests/fixtures/zusik-acceptance/g3-extension.json", import.meta.url);
const trial = JSON.parse(await readFile(fixture, "utf8"));
if (createHash("sha256").update(trial.officialText).digest("hex") !== trial.hash) throw Error("Source text changed");

async function newSession() {
  const response = await fetch(new URL("/api/zusik/session", root), {
    method: "POST", headers: { origin: root.origin },
  });
  if (!response.ok) throw Error("Session HTTP " + response.status);
  const cookie = response.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
  if (!cookie) throw Error("Missing synthetic session");
  return { origin: root.origin, cookie, "content-type": "application/json" };
}

async function ask(index, headers, refreshed = false) {
  const question = trial.questions[index];
  const started = performance.now();
  const response = await fetch(new URL("/api/zusik/ask", root), {
    method: "POST", headers, signal: AbortSignal.timeout(70_000),
    body: JSON.stringify({ scenario: "ogolna", question, requestId: randomUUID() }),
  });
  const { turn, retrieval } = await response.json();
  const claims = turn.claims.map(claim => claim.text).join(" ");
  const citation = turn.citations.find(entry =>
    entry.fragmentId === trial.logicalId && entry.url === trial.url && entry.locator === trial.heading);
  const quotesSource = Boolean(citation && trial.officialText.includes(citation.quote));
  // Frozen before the trial. The ordering question also requires finality in this strict metric.
  const statesFact = index === 3
    ? /bez rozpatrzenia/iu.test(claims)
    : /ostateczn/iu.test(claims) && /WZON|wojewódzk/iu.test(claims);
  const top = retrieval?.top ?? [];
  const rank = top.indexOf(trial.logicalId) + 1;
  const contextRequestId = retrieval?.contextRequestId ?? null;
  const pass = mode === "full"
    ? rank > 0 && quotesSource && statesFact && response.ok && turn.status === "answered" && (!refreshed || Boolean(contextRequestId))
    : !citation && !statesFact && rank === 0 && ["needs_clarification", "insufficient_evidence"].includes(turn.status);
  console.log(JSON.stringify({
    mode, index: index + 1, question, refreshed, pass, http: response.status, status: turn.status,
    ms: Math.round(performance.now() - started), rank, top, evidence: retrieval?.evidence ?? [],
    citations: turn.citations, claims, contextRequestId, backend: retrieval?.backend ?? null,
    attemptId: retrieval?.attemptId ?? null,
  }));
  if (!pass) process.exitCode = 1;
  return response.ok;
}

const shared = await newSession();
const saved = await ask(0, shared);
const reload = await fetch(new URL("/api/zusik/state?scenario=ogolna", root), { headers: shared });
const { view } = await reload.json();
if (!reload.ok || (saved && view.turns[0]?.question !== trial.questions[0])) throw Error("Saved turn missing at refresh");
await ask(3, shared, true);
await ask(1, await newSession());
await ask(2, await newSession());
