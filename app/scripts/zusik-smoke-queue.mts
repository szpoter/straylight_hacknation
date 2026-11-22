/** Public fixture only. Exercises the deployed queue, the local model and the production validator. */
import assert from "node:assert/strict";
import { Pool } from "pg";
import { generateAnswer, validateAnswer } from "../src/lib/rag/answer";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { runPublicModelTask } from "../src/lib/rag/local-queue";
import type { PublicTaskInput } from "../src/lib/rag/model-tasks";
import { publicQuestion } from "../src/lib/rag/public-query";

const pool = new Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000, max: 1 });
const corpus = loadCorpus("marta");
const question = publicQuestion("Kiedy złożyć wniosek o urlop rodzicielski?")?.question;
const fragment = corpus.fragments.get("kp-art182-1d-par1");
assert(question && fragment);
try {
  if (process.argv.includes("--roles")) {
    const tasks: PublicTaskInput[] = [
      { kind: "plan_public", aspect: "evidence", previousUnit: "zlobek-odbiorca", candidates: ["zlobek-odbiorca"], missing: [] },
      { kind: "verify_claim", aspect: "eligibility", claimUnit: "kp-art182-1d-par1", candidates: ["rozp-2025-322-par22"] },
    ];
    const failures: string[] = [];
    for (const input of tasks) {
      const result = await runPublicModelTask(pool, input, Date.now() + 12000);
      const passed = result.status === "ok" && result.attemptId && result.output && (input.kind === "plan_public"
        ? "nextTool" in result.output && result.output.nextTool === "readPreviousEvidence" &&
          result.output.intent === "cite_previous" && result.output.evidenceIds.includes("zlobek-odbiorca")
        : "verdict" in result.output && result.output.verdict === "missing" && result.output.evidenceIds.length === 0);
      console.log(JSON.stringify({ kind: input.kind, ...result, passed: Boolean(passed) }));
      if (!passed) failures.push(input.kind);
    }
    assert.deepEqual(failures, [], "Supplementary tasks did not return the expected decisions");

  } else {
    const outage = process.argv.includes("--outage");
    // The isolated transaction hides the test job from a running worker.
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
  }
} finally { await pool.end(); }
