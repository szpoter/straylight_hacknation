/** Isolated G7 runner with WWW disabled. Both external calls use only projected public inputs. */
import { readFileSync } from "node:fs";
import { generateAnswer } from "../src/lib/rag/answer";
import { answerQuestion } from "../src/lib/zusik/ask-service";
import { requireEnv } from "../src/lib/zusik/config";
import { suggestTopic } from "../src/lib/zusik/topic-ranker";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { searchCorpus } from "../src/lib/rag/corpus-search";
import { qdrantKnowledgeSearch } from "../src/lib/rag/retrieve";
import { ragAssertions } from "./zusik-eval-g7";

type Trial = { id: string; group: string; questions: string[]; requiredEvidence: string[]; facts: string[] };
async function main() {
  const hosted = process.argv.includes("--hosted");
  const collection = requireEnv("QDRANT_KNOWLEDGE_COLLECTION");
  const search = qdrantKnowledgeSearch({url: requireEnv("QDRANT_URL"), collection,
    apiKey: requireEnv("QDRANT_KNOWLEDGE_READ_KEY"), model:process.env.QDRANT_EMBED_MODEL });
  const trials: Trial[] = readFileSync("tests/fixtures/zusik-acceptance/g7.jsonl","utf8").trim().split("\n").map(line => JSON.parse(line));
  const rows: Array<{ lexical:boolean | null; dense:boolean | null; top5:boolean; evidence:boolean; answer:boolean; search:string; ms:number }> = [];
  for (const trial of trials.filter(t => t.group === "rag")) {
    const question = trial.questions[0];
    const start = performance.now();
    const { answer, trace } = await answerQuestion({
      corpus: loadCorpus("marta"), selectCorpus: loadCorpus, searchCorpus, suggestTopic, search,
      generate: async (projected, evidence, corpus) => hosted
        ? generateAnswer({ model:requireEnv("SHERLOCK_MODEL"), apiKey:requireEnv("SHERLOCK_API_KEY"),
          baseURL:requireEnv("SHERLOCK_BASE_URL") }, corpus, projected, evidence)
        : { model:"source-only", status:"error", output:null, ms:0 },
    }, question);
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
