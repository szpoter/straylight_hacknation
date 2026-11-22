/** Isolated G7 runner with WWW disabled. Both external calls use only projected public inputs. */
import { readFileSync } from "node:fs";
import { generateAnswer } from "../src/lib/rag/answer";
import { answerPublicTurn, answerQuestion, type AnswerDeps } from "../src/lib/zusik/ask-service";
import { routeCaseQuestion } from "../src/lib/zusik/v1/intent";
import { requireEnv } from "../src/lib/zusik/config";
import { suggestTopic } from "../src/lib/zusik/topic-ranker";
import { corpusNames, loadCorpus } from "../src/lib/rag/corpus-fs";
import { extractiveAnswer } from "../src/lib/rag/excerpt";
import { searchCorpus } from "../src/lib/rag/corpus-search";
import { qdrantKnowledgeSearch } from "../src/lib/rag/retrieve";
import { ragAssertions } from "./zusik-eval-g7";

type Trial = { id: string; group: string; questions: string[]; requiredEvidence: string[]; facts: string[] };

/** Offline diagnostic: how often does quoting the first verified passage answer the entire question? */
function scoreFirstPassage(path: string, trials: Trial[]) {
  const byId = new Map(trials.map(trial => [trial.id, trial]));
  const results = new Map<string, {total:number; answered:number}>();
  for (const line of readFileSync(path, "utf8").trim().split("\n")) {
    const {id, ranker, ranking}: {id:string; ranker:string; ranking:string[]} = JSON.parse(line);
    const trial = byId.get(id);
    if (!trial) throw new Error("Unknown trial");
    const count = results.get(ranker) ?? {total:0, answered:0};
    results.set(ranker, count);
    count.total++;
    if (!ranking.length) continue;
    const ref = ranking[0];
    const name = corpusNames.find(key => loadCorpus(key).fragments.has(ref));
    if (!name) throw new Error("Unknown public passage");
    const corpus = loadCorpus(name);
    const fragment = corpus.fragments.get(ref)!;
    const answer = extractiveAnswer(corpus, {corpus:name, question:"", requiredFragmentIds:[ref]}, [fragment], [ref]);
    if (!answer) throw new Error("Missing verified public quote");
    const turn = {...answer, question:trial.questions[0], requestId:id, createdAt:""};
    const checks = ragAssertions(trial, {turn, retrieval:{top:ranking, evidence:[ref]}});
    count.answered += Number(Object.values(checks).every(Boolean));
  }
  console.log(JSON.stringify(Object.fromEntries(results)));
}

/** Score the same public turn before and after the browser's privacy projection. */
async function compareConversation(deps: AnswerDeps, trials: Trial[]) {
  const probes: Trial[] = JSON.parse(readFileSync("tests/fixtures/public-rag-probes.json","utf8"));
  for (const entry of ["full", "v1"]) {
    const groups: Record<string, {total:number; top5:number; evidence:number; passed:number}> = {};
    for (const trial of [...trials.filter(t => t.group === "rag"), ...probes]) {
      const group = groups[trial.group] ??= {total:0, top5:0, evidence:0, passed:0};
      group.total++;
      const question = trial.questions[0];
      const route = routeCaseQuestion(question, {facts:[]});
      const text = entry === "full" ? question :
        "input" in route && route.input.intent === "public_question" ? route.input.publicQuestion : null;
      let passed = false;
      let topIds: string[] = [];
      if (text) {
        const publicLookup = entry === "v1" && "input" in route && route.input.intent === "public_question" ? route.input.publicLookup : undefined;
        const {answer, trace} = await answerPublicTurn({...deps, publicLookup}, text, []);
        topIds = trace.vectorIds.slice(0, 5);
        if (trial.group === "unsupported") {
          passed = ["needs_clarification","insufficient_evidence"].includes(answer.status) && !answer.citations.length;
        } else {
          const turn = {...answer, question, createdAt:"", requestId:trial.id};
          const checks = ragAssertions(trial, {turn, retrieval:{top:trace.vectorIds, evidence:trace.evidenceIds}});
          group.top5 += Number(checks.raw);
          group.evidence += Number(checks.evidence);
          passed = checks.fact && checks.quoteAspect && checks.action && checks.authentic && checks.citation && checks.noAward;
        }
      } else {
        passed = trial.group === "unsupported" && "clarify" in route;
      }
      group.passed += Number(passed);
      console.log(JSON.stringify({entry, group:trial.group, id:trial.id, passed,
        ...(process.argv.includes("--receipts") ? {topIds} : {})}));
    }
    console.log(JSON.stringify({entry, groups}));
    if (groups.rag.top5 < 36 || groups.rag.passed < 36 || groups.covered.passed < groups.covered.total ||
        groups.unsupported.passed < groups.unsupported.total) process.exitCode = 1;
  }
}

async function main() {
  const trials: Trial[] = readFileSync("tests/fixtures/zusik-acceptance/g7.jsonl","utf8").trim().split("\n").map(line => JSON.parse(line));
  if (process.argv.includes("--public-projections")) {
    for (const trial of trials.filter(t => t.group === "rag")) {
      const route = routeCaseQuestion(trial.questions[0], {facts:[]});
      const question = "input" in route && route.input.intent === "public_question" ? route.input.publicQuestion : null;
      console.log(JSON.stringify({id:trial.id, question}));
    }
    return;
  }
  const quotes = process.argv.indexOf("--quote-first");
  if (quotes >= 0) return scoreFirstPassage(process.argv[quotes + 1], trials);
  const hosted = process.argv.includes("--hosted");
  const collection = requireEnv("QDRANT_KNOWLEDGE_COLLECTION");
  const search = qdrantKnowledgeSearch({url: requireEnv("QDRANT_URL"), collection,
    apiKey: requireEnv("QDRANT_KNOWLEDGE_READ_KEY"), model:process.env.QDRANT_EMBED_MODEL });
  const deps: AnswerDeps = {
    corpus: loadCorpus("marta"), selectCorpus: loadCorpus, searchCorpus, suggestTopic, search,
    readOfficial: async () => ({citation:null, fetches:0, unavailable:true}),
    generate: async (projected, evidence, corpus) => hosted
      ? generateAnswer({ model:requireEnv("SHERLOCK_MODEL"), apiKey:requireEnv("SHERLOCK_API_KEY"),
        baseURL:requireEnv("SHERLOCK_BASE_URL") }, corpus, projected, evidence)
      : { model:"source-only", status:"error", output:null, ms:0 },
  };
  if (process.argv.includes("--conversation")) return compareConversation(deps, trials);
  const rows: Array<{ lexical:boolean | null; dense:boolean | null; top5:boolean; evidence:boolean; answer:boolean; search:string; ms:number }> = [];
  for (const trial of trials.filter(t => t.group === "rag")) {
    const question = trial.questions[0];
    const start = performance.now();
    const { answer, trace } = await answerQuestion(deps, question);
    const turn = { ...answer, question, createdAt:"", requestId:trial.id };
    const assertions = ragAssertions(trial, { turn, retrieval:{ top:trace.vectorIds, evidence:trace.evidenceIds } });
    const ranked = (top: string[]) => ragAssertions(trial, { turn, retrieval:{top} }).raw;
    const row = { id:trial.id, search:trace.search, generation:trace.model, quoteReason:trace.quoteReason, ms:Math.round(performance.now()-start),
      lexical:trace.rankings ? ranked(trace.rankings.lexical) : null,
      dense:trace.rankings ? ranked(trace.rankings.dense) : trace.expanded || trace.search !== "ok" ? null : assertions.raw,
      top5:assertions.raw, evidence:assertions.evidence, answer:assertions.fact && assertions.action && assertions.quoteAspect
        && assertions.authentic && assertions.citation && assertions.noAward };
    rows.push(row);
    console.log(JSON.stringify(row));
  }
  const summary = Object.fromEntries((["lexical","dense","top5","evidence","answer"] as const).map(field => [
    field, {hits:rows.filter(r => r[field]).length, evaluated:rows.filter(r => r[field] !== null).length}]));
  const times = rows.map(r => r.ms).sort((a,b) => a-b);
  const passed = rows.length === 40 && summary.top5.hits >= 36 && summary.answer.hits >= 36;
  console.log(JSON.stringify({collection, reader:"runtime", generator:hosted ? requireEnv("SHERLOCK_MODEL") : "source-only", summary, passed,
    p50:times[Math.ceil(times.length*0.5)-1], p95:times[Math.ceil(times.length*0.95)-1], errors:rows.filter(r=>r.search==="error").length}));
  if (!passed) process.exitCode = 1;
}
main().catch((error:Error) => { console.error(error.message); process.exitCode = 1; });
