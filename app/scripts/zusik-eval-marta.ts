/**
 * npm run zusik:eval-marta [-- --set calibration] [-- --retrieval-only]
 * Real calls: Qdrant (QDRANT_URL + QDRANT_KNOWLEDGE_READ_KEY, or QDRANT_WRITE_KEY) and,
 * unless --retrieval-only, Bielik via Sherlock (SHERLOCK_BASE_URL, SHERLOCK_API_KEY, SHERLOCK_MODEL).
 * The graph never sees expected ids. Writes corpus/marta/<set>-report.md and <set>-report.json.
 *
 * Metrics: raw Hit@5 (all needed units among the first five vector hits),
 * completeness after explicitly attached exceptions/primary law, automatic answer checks.
 * Final content review is manual: every published claim is read against its quote.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { generateAnswer } from "../src/lib/rag/answer";
import { withoutFragments, type Corpus } from "../src/lib/rag/corpus";
import { corpusDir, loadCorpus } from "../src/lib/rag/corpus-fs";
import { qdrantKnowledgeSearch } from "../src/lib/rag/retrieve";
import { answerQuestion, type AnswerDeps } from "../src/lib/zusik/ask-service";
import { DEFAULT_EMBED_MODEL } from "../src/lib/zusik/config";
import type { AskAnswer } from "../src/lib/zusik/types";

const OP = "zusik:eval-marta";

interface Case {
  id: string;
  main?: boolean;
  question: string;
  expected: string[][];
  status: AskAnswer["status"][];
  required: string[];
  forbidden: string[];
  forbiddenCitations: string[];
}
interface Negative {
  id: string;
  question: string;
  status: AskAnswer["status"][];
  forbidden: string[];
}

function env(name: string, fallback?: string): string {
  const value = process.env[name]?.trim() || fallback;
  if (!value) {
    console.error(`${OP}: FAILED — missing ${name}`);
    process.exit(1);
  }
  return value;
}

const args = process.argv.slice(2);
const setName = args.includes("--set") ? args[args.indexOf("--set") + 1] : "eval";
const retrievalOnly = args.includes("--retrieval-only");
/** Sherlock rate-limits bursts; the harness paces calls and repeats a case after a 429. */
const PAUSE_MS = retrievalOnly ? 0 : 4_000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function paced(deps: AnswerDeps, question: string) {
  for (let attempt = 1; ; attempt += 1) {
    await sleep(PAUSE_MS);
    const result = await answerQuestion(deps, question);
    if (result.trace.model !== "rate_limited" || attempt === 4) return result;
    console.log(`${OP}: 429 from Sherlock, waiting 30 s (attempt ${attempt})`);
    await sleep(30_000);
  }
}

const covered = (groups: string[][], ids: string[]) => groups.every((g) => g.some((id) => ids.includes(id)));
const answerText = (a: AskAnswer) => [a.message, ...a.claims.map((c) => c.text)].join(" ");
const matches = (pattern: string, text: string) => new RegExp(pattern, "iu").test(text);

function depsFor(corpus: Corpus): AnswerDeps {
  const search = qdrantKnowledgeSearch({
    url: env("QDRANT_URL"),
    apiKey: process.env.QDRANT_KNOWLEDGE_COLLECTION && process.env.QDRANT_KNOWLEDGE_READ_KEY?.trim() || env("QDRANT_READ_KEY"),
    collection: process.env.QDRANT_KNOWLEDGE_READ_KEY && process.env.QDRANT_KNOWLEDGE_COLLECTION?.trim() || env("QDRANT_COLLECTION"),
    model: process.env.QDRANT_EMBED_MODEL?.trim() || DEFAULT_EMBED_MODEL,
  });
  const generate: AnswerDeps["generate"] = retrievalOnly
    ? async () => ({ status: "ok", output: { status: "insufficient_evidence", message: "(retrieval only)", claims: [] }, model: "none", ms: 0 })
    : (question, evidence) =>
        generateAnswer(
          { baseURL: env("SHERLOCK_BASE_URL"), apiKey: env("SHERLOCK_API_KEY"), model: env("SHERLOCK_MODEL") },
          corpus,
          question,
          evidence,
        );
  return { corpus, search, generate };
}

function fmtAnswer(a: AskAnswer): string {
  if (a.claims.length === 0) return `**${a.status}** · ${a.message}`;
  const byId = new Map(a.citations.map((c) => [c.id, c]));
  const claims = a.claims
    .map((c) => `${c.text} [${c.citationIds.map((id) => `${byId.get(id)?.locator}: „${byId.get(id)?.quote}”`).join("; ")}]`)
    .join("<br>");
  return `**${a.status}**${a.message ? ` · ${a.message}` : ""}<br>${claims}`;
}

async function main() {
  const corpus = loadCorpus("marta");
  const set = JSON.parse(readFileSync(path.join(corpusDir("marta"), `${setName}.json`), "utf8")) as { cases: Case[]; negatives: Negative[] };
  const deps = depsFor(corpus);
  const rows: string[] = [];
  const raw: unknown[] = [];
  let hit5 = 0;
  let complete = 0;
  let answerOk = 0;
  let mainOk = 0;
  let mainTotal = 0;
  let uncited = 0;

  for (const c of set.cases) {
    const { answer, trace } = await paced(deps, c.question);
    const top = trace.vectorHits.slice(0, 5).map((h) => `${h.logicalId} (${h.score.toFixed(3)})`);
    const isHit = covered(c.expected, trace.vectorIds);
    const isComplete = covered(c.expected, trace.evidenceIds);
    const text = answerText(answer);
    const cited = answer.citations.map((x) => x.fragmentId);
    const problems: string[] = [];
    if (!c.status.includes(answer.status)) problems.push(`status ${answer.status}`);
    if (answer.status === "answered") {
      for (const r of c.required) if (!matches(r, text)) problems.push(`brak /${r}/`);
    }
    for (const f of c.forbidden) if (matches(f, text)) problems.push(`zakazane /${f}/`);
    for (const f of c.forbiddenCitations) if (cited.includes(f)) problems.push(`cytuje ${f}`);
    if (answer.claims.some((cl) => cl.citationIds.length === 0)) uncited += 1;
    const auto = retrievalOnly ? "—" : problems.length ? `✗ ${problems.join(", ")}` : "✓";
    hit5 += isHit ? 1 : 0;
    complete += isComplete ? 1 : 0;
    answerOk += !retrievalOnly && problems.length === 0 ? 1 : 0;
    if (c.main) {
      mainTotal += 1;
      mainOk += !retrievalOnly && problems.length === 0 && isComplete ? 1 : 0;
    }
    rows.push(
      `| ${c.id}${c.main ? "★" : ""} | ${c.question} | ${c.expected.map((g) => g.join(" / ")).join(" + ")} | ${top.join("<br>")} | ${isHit ? "✓" : "✗"} | ${isComplete ? "✓" : "✗"} | ${retrievalOnly ? "—" : fmtAnswer(answer)} | ${auto} |`,
    );
    raw.push({ id: c.id, question: c.question, sanitized: trace.sanitized, top: trace.vectorHits, evidence: trace.evidenceIds, answer, report: trace.report, model: trace.model, modelMs: trace.modelMs, finishReason: trace.finishReason });
    console.log(`${OP}: ${c.id} hit5=${isHit ? 1 : 0} complete=${isComplete ? 1 : 0} ${answer.status} ${auto} · model ${trace.model} ${trace.modelMs ?? "-"} ms ${trace.finishReason ?? ""}`);
  }

  const negRows: string[] = [];
  let negOk = 0;
  for (const n of set.negatives) {
    const { answer, trace } = await paced(deps, n.question);
    const problems: string[] = [];
    if (!n.status.includes(answer.status)) problems.push(`status ${answer.status}`);
    for (const f of n.forbidden) if (matches(f, answerText(answer))) problems.push(`zakazane /${f}/`);
    const ok = retrievalOnly && trace.gate === null ? null : problems.length === 0;
    negOk += ok ? 1 : 0;
    negRows.push(`| ${n.id} | ${n.question} | ${n.status.join(" / ")} | ${trace.gate ?? "—"} | ${fmtAnswer(answer)} | ${ok === null ? "—" : ok ? "✓" : `✗ ${problems.join(", ")}`} |`);
    raw.push({ id: n.id, question: n.question, top: trace.vectorHits, evidence: trace.evidenceIds, answer, gate: trace.gate });
    console.log(`${OP}: ${n.id} ${answer.status} ${ok === null ? "—" : ok ? "✓" : "✗"}`);
  }

  // Ablation: a test copy of the corpus without § 22, same Qdrant (its § 22 hit is dropped locally).
  const ablRows: string[] = [];
  let ablationFailures = 0;
  if (setName === "eval" && !retrievalOnly) {
    const ablated = withoutFragments(corpus, ["rozp-2025-322-par22"]);
    const ablDeps = depsFor(ablated);
    for (const c of set.cases.filter((x) => x.expected.some((g) => g.includes("rozp-2025-322-par22")))) {
      const full = (raw.find((r) => (r as { id: string }).id === c.id) as { answer: AskAnswer }).answer;
      const { answer } = await paced(ablDeps, c.question);
      const citesPar22 = answer.citations.some((x) => x.fragmentId === "rozp-2025-322-par22");
      const confident = answer.status === "answered" && matches("nie (dołącza|musisz|trzeba)", answerText(answer));
      if (citesPar22 || confident || answer.status === "unavailable") ablationFailures += 1;
      ablRows.push(`| ${c.id} | ${c.question} | ${fmtAnswer(full)} | ${fmtAnswer(answer)} | ${!citesPar22 && !confident ? "✓ zmiana" : "✗ ta sama pewna odpowiedź"} |`);
      raw.push({ id: `${c.id}-without-par22`, answer });
    }
  }

  const n = set.cases.length;
  const summary = [
    `Korpus ${corpus.manifest.corpusVersion}, ${corpus.fragments.size} jednostek. Zestaw ${setName}: ${n} pytań, ${set.negatives.length} prób negatywnych. ${new Date().toISOString()}.`,
    `Tryb: ${retrievalOnly ? "tylko wyszukiwanie (Qdrant)" : "Qdrant + Bielik (Sherlock), rzeczywiste wywołania"}.`,
    "",
    `- Surowy Hit@5: **${hit5}/${n}**`,
    `- Kompletność po dołączeniu wyjątków i przepisów pierwotnych: **${complete}/${n}** (próg ≥ 18/20)`,
    retrievalOnly ? "" : `- Automatyczna poprawność odpowiedzi: **${answerOk}/${n}** · główne pytania Marty: **${mainOk}/${mainTotal}**`,
    retrievalOnly ? "" : `- Próby negatywne z oczekiwanym statusem: **${negOk}/${set.negatives.length}**`,
    retrievalOnly ? "" : `- Twierdzenia bez przypisu: **${uncited}**`,
  ].filter((l) => l !== "");
  const md = [
    `# Ocena RAG Marty · ${setName}`,
    "",
    ...summary,
    "",
    "| ID | Pytanie | Oczekiwane | Faktyczne top 5 (score) | Hit@5 | Komplet | Odpowiedź pokazana rodzinie | Automat |",
    "|---|---|---|---|---|---|---|---|",
    ...rows,
    "",
    "## Próby negatywne",
    "",
    "| ID | Pytanie | Oczekiwany status | Bramka | Odpowiedź | Wynik |",
    "|---|---|---|---|---|---|",
    ...negRows,
    ...(ablRows.length
      ? ["", "## Usunięcie § 22 z kopii korpusu", "", "| ID | Pytanie | Pełny korpus | Bez § 22 | Wynik |", "|---|---|---|---|---|", ...ablRows]
      : []),
    "",
  ].join("\n");
  const outBase = path.join(corpusDir("marta"), `${setName}-report${retrievalOnly ? "-retrieval" : ""}`);
  writeFileSync(`${outBase}.md`, md);
  writeFileSync(`${outBase}.json`, JSON.stringify(raw, null, 2));
  console.log(summary.join("\n"));
  console.log(`${OP}: report ${path.relative(process.cwd(), outBase)}.md`);
  if (setName === "eval") {
    const retrievalPassed = hit5 >= 18 && complete >= 18;
    const responsesPassed = mainOk === mainTotal && mainTotal === 4 && negOk === set.negatives.length && uncited === 0 && ablationFailures === 0;
    if (!retrievalPassed || (!retrievalOnly && !responsesPassed)) process.exitCode = 1;
  }
}

main().catch((error: Error) => {
  console.error(`${OP}: FAILED — ${error.message}`);
  process.exit(1);
});
