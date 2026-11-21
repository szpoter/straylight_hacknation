import { randomUUID } from "node:crypto";

import type { Pool, PoolClient } from "pg";
import type { Corpus, Fragment } from "./corpus";
import { loadCorpus } from "./corpus-fs";
import { publicQuestion } from "./public-query";

/** Verify against shipped public material at the last boundary before persistence. */
export function publicQueueEvidence(corpus: Corpus, question: string, evidence: Fragment[]) {
  const plan = publicQuestion(question);
  if (!plan || plan.clarify || plan.question !== question || /\d{4}/u.test(question) || !evidence.length) return null;
  const official = loadCorpus(plan.corpus);
  if (official !== corpus || !evidence.every(f => official.fragments.get(f.logicalId) === f)) return null;
  return evidence;
}

export type LocalModel = "bielik" | "pllum";
export async function localCompletion(db: Pool, model: LocalModel, prompt: string, id = randomUUID()) {
  const started = Date.now();
  let client: PoolClient | undefined;
  let expired = false;
  // The runtime pool bounds connection acquisition to 5 s. Destroy a stuck queue
  // connection even during cleanup so a claimed but silent worker cannot consume the route budget.
  const deadline = setTimeout(() => {
    expired = true;
    client?.release(true);
    client = undefined;
  }, 38_000);
  try {
    client = await db.connect();
    if (expired) return { id, status: "timeout" as const };
    await client.query("select zusik_model.submit($1,$2,$3)", [id, model, prompt]);
    while (!expired && client) {
      const { rows: [job] } = await client.query("select * from zusik_model.result($1)", [id]);
      if (!job) return { id, status: "expired" as const };
      if (job.done) return job.output ? { id, status: "ok" as const, text: String(job.output) } : { id, status: "worker_error" as const };
      if (!job.started && Date.now() - started > 3500) return { id, status: "unclaimed" as const };
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    return { id, status: "timeout" as const };
  } catch {
    return { id, status: expired ? "timeout" as const : "queue_error" as const };
  } finally {
    try {
      if (client && !expired) await client.query("select zusik_model.discard($1)", [id]);
    } catch { /* An orphan expires in Neon. */ }
    clearTimeout(deadline);
    client?.release();
  }
}
