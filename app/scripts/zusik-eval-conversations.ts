/** Run from app/ with tsx. Creates only synthetic, independent conversations in the chosen deployment. */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { locateQuote } from "../src/lib/rag/answer";
import type { AskTurn } from "../src/lib/zusik/types";

type Trial = { question: string; fragment?: string; facts?: RegExp[]; contextual?: boolean };
const cases: Trial[][] = [
  [{ question: "Zwolnienie jest skutkiem nadużycia alkoholu. Czy pieniądze przepadają za cały okres, czy tylko za początek?",
    fragment: "uz-16-1", facts: [/pierwsz/i, /5|pię[ćc]/iu] }],
  [{ question: "Ubezpieczony zmarł, zanim zdążył odebrać należny zasiłek. Komu można go teraz wypłacić?",
    fragment: "uz-65-1", facts: [/uprawnion/iu, /wynagrodze|dochod/iu] },
   { question: "Czy odbiorca mieszkający za granicą może wskazać rachunek prowadzony w Polsce?",
     fragment: "uz-65-2", facts: [/rachun/iu, /kraj|Polsce/iu] }],
  [{ question: "Czy badania kandydata na dawcę tkanek zmieniają procent zasiłku chorobowego?",
    fragment: "uz-11-1", facts: [/100\s*%|sto procent/iu, /dawc/iu] },
   { question: "A jak lekarz ma to poświadczyć?", fragment: "uz-53-2",
     facts: [/zaświadczen/iu, /zwykł/iu], contextual: true }],
  [{ question: "W którym terminie ZUS odpowiada na reklamację hulajnogi?" }],
];
type Receipt = { top: string[]; evidence: string[]; contextRequestId?: string; backend?: string; quoteReason?: string };

async function main() {
  const origin = new URL(process.argv[2] ?? "http://127.0.0.1:3000").origin;
  const corpus = loadCorpus("publiczne");
  let passed = 0;
  let total = 0;
  for (const conversation of cases) {
    const session = await fetch(origin + "/api/zusik/session", { method: "POST", headers: { Origin: origin } });
    assert.equal(session.status, 200, "Could not open a synthetic session");
    const cookie = session.headers.getSetCookie().map(value => value.split(";")[0]).join("; ");
    assert.ok(cookie, "The session must have a signed cookie");
    let previousId: string | undefined;
    for (const trial of conversation) {
      total++;
      const res = await fetch(origin + "/api/zusik/ask", {
        method: "POST", headers: { Origin: origin, Cookie: cookie, "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: randomUUID(), question: trial.question, scenario: "ogolna" }),
        signal: AbortSignal.timeout(75000),
      });
      const { turn, retrieval } = await res.json() as { turn?: AskTurn; retrieval?: Receipt };
      const id = trial.fragment;
      const fragment = id && corpus.fragments.get(id);
      const text = turn?.claims.map(c => c.text).join(" ") ?? "";
      const ok = res.ok && !!turn && (fragment
        ? turn.status === "answered" && retrieval?.top.includes(fragment.logicalId)
          && retrieval.evidence.includes(fragment.logicalId)
          && turn.citations.some(c => c.fragmentId === id && locateQuote(fragment.sourceText, c.quote))
          && trial.facts?.every(pattern => pattern.test(text))
          && (!trial.contextual || (!!previousId && retrieval.contextRequestId === previousId))
        : !id && ["needs_clarification", "insufficient_evidence"].includes(turn.status) && !turn.citations.length);
      if (ok) passed++;
      console.log(JSON.stringify({ expected: id ?? "no_basis", passed: Boolean(ok), status: turn?.status, code: res.status,
        top: retrieval?.top, cited: turn?.citations.map(c => c.fragmentId), backend: retrieval?.backend, quoteReason: retrieval?.quoteReason }));
      previousId = turn?.requestId;
    }
  }
  console.log(`Corpus conversations: ${passed}/${total} turns passed`);
  if (passed !== total) process.exitCode = 1;
}
main().catch(error => { console.error(String(error)); process.exitCode = 1; });
