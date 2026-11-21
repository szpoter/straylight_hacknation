/** Public fixture only. Exercises the deployed queue, the local model and the production validator. */
import assert from "node:assert/strict";
import { Pool } from "pg";
import { generateAnswer, validateAnswer } from "../src/lib/rag/answer";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { publicQuestion } from "../src/lib/rag/public-query";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000, max: 1 });
const corpus = loadCorpus("marta");
const question = publicQuestion("Kiedy złożyć wniosek o urlop rodzicielski?")?.question;
const fragment = corpus.fragments.get("kp-art182-1d-par1");
assert(question && fragment);
try {
  // In this isolated transaction the real worker cannot see the job or its notification.
  const outage = process.argv.includes("--outage");
  if (outage) await pool.query("BEGIN");
  for (const model of outage ? ["bielik"] : ["bielik", "pllum"]) {
    process.env.ZUSIK_RAG_MODEL = model;
    const result = await generateAnswer({ queue: pool, baseURL: outage ? process.env.SHERLOCK_BASE_URL ?? "" : "http://127.0.0.1:1",
      apiKey: outage ? process.env.SHERLOCK_API_KEY ?? "" : "disabled", model: outage ? process.env.SHERLOCK_MODEL ?? "" : "disabled" },
      corpus, question, [fragment]);
    assert.equal(result.backend, outage ? "hosted" : "local-" + model);
    assert(result.output && result.attemptId);
    const checked = validateAnswer(corpus, [fragment], result.output);
    console.log(JSON.stringify({ backend: result.backend, attemptId: result.attemptId, ms: result.ms, verdict: checked.answer.status,
      citations: checked.answer.citations.map(c => c.fragmentId), rejected: checked.report.rejectedEvidence.length }));
  }
} finally { await pool.end(); }
