import { randomUUID } from "node:crypto";

import type { Pool, PoolClient } from "pg";
import type { Corpus, Fragment } from "./corpus";
import { corpusNames, loadCorpus } from "./corpus-fs";
import { compoundQuestion } from "./compound";
import { corpusKeywords, searchCorpus } from "./corpus-search";
import { statutoryListIds } from "./relevance";
import { publicPairPrefix, publicQuestion } from "./public-query";
import { checkedTaskOutput, publicTaskInput, taskInstructions, taskSpecs, QWEN_QUEUE_TIMEOUT_MS, TYPED_CONTEXT_TOKENS, type localModelIds, type ModelTaskKind, type PublicTaskInput } from "./model-tasks";
import { modelForTask } from "../zusik/model-provider";

/** Verify against shipped public material at the last boundary before persistence. */
export function publicQueueEvidence(corpus: Corpus, question: string, evidence: Fragment[]) {
  if (!evidence.length || !corpusNames.some(name => loadCorpus(name) === corpus) ||
      !evidence.every(f => corpus.fragments.get(f.logicalId) === f)) return null;
  if (question.startsWith(publicPairPrefix)) {
    const plan = compoundQuestion(question, searchCorpus);
    const units = plan?.lexical;
    if (plan?.question !== question || loadCorpus(plan.corpus) !== corpus || units?.length !== evidence.length) return null;
    return units.every(unit => evidence.some(f => f.logicalId === unit.logicalId && f.corpusVersion === unit.corpusVersion &&
      f.fragmentSha256 === unit.fragmentSha256)) ? evidence : null;
  }
  const fromShippedWords = evidence.some(anchor => {
    if (!corpusKeywords(question, anchor)) return false;
    const allowed = new Set([...statutoryListIds(corpus, anchor), ...anchor.primaryIds, ...anchor.relatedIds]);
    return evidence.every(f => allowed.has(f.logicalId));
  });
  if (fromShippedWords) return evidence;
  const plan = publicQuestion(question);
  return plan && !plan.clarify && plan.question === question && !/\d{4}/u.test(question) && loadCorpus(plan.corpus) === corpus
    ? evidence : null;
}

export type LocalModel = keyof typeof localModelIds;
export async function localCompletion(db: Pool, model: LocalModel, prompt: string, id = randomUUID(), kind: ModelTaskKind = "answer_evidence",
  budgetMs?: number) {
  const started = Date.now();
  let client: PoolClient | undefined;
  let expired = false;
  const timeout = { id, status: "timeout" as const };
  const maximum = model === "qwen-27b" && kind === "answer_evidence" ? QWEN_QUEUE_TIMEOUT_MS : taskSpecs[kind].timeout;
  const budget = budgetMs ?? maximum;
  if (!Number.isFinite(budget) || budget <= 0) return timeout;
  const cap = Math.min(maximum, budget);
  const timer = Promise.withResolvers<typeof timeout>();
  const deadline = setTimeout(() => {
    expired = true;
    client?.release(true);
    client = undefined;
    timer.resolve(timeout);
  }, cap);
  async function run() {
    try {
      client = await db.connect();
      if (expired) return timeout;
      if (kind === "answer_evidence") await client.query("select zusik_model.submit($1,$2,$3)", [id, model, prompt]);
      else await client.query("select zusik_model.submit_task($1,$2,$3,$4)", [id, model, prompt, kind]);
      while (!expired && client) {
        const { rows: [job] } = await client.query("select * from zusik_model.result($1)", [id]);
        if (Date.now() - started >= cap) return timeout;
        if (!job) return { id, status: "expired" as const };
        if (job.done) return job.output ? { id, status: "ok" as const, text: String(job.output) } : { id, status: "worker_error" as const };
        if (!job.started && Date.now() - started > 3500) return { id, status: "unclaimed" as const };
        await new Promise(resolve => setTimeout(resolve, 400));
      }
      return timeout;
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
  return Promise.race([run(), timer.promise]);
}

/** Resolve every model-visible string through the server's active public material. */
export function publicTaskPrompt(raw: PublicTaskInput) {
  const valid = publicTaskInput.safeParse(raw);
  if (!valid.success) return null;
  const input = valid.data;
  const references = input.kind === "plan_public"
    ? [...input.candidates, ...(input.previousUnit ? [input.previousUnit] : [])]
    : [...input.candidates, input.claimUnit];
  const material = new Map<string, Fragment>();
  for (const id of new Set(references)) {
    const found = corpusNames.flatMap(name => {
      const f = loadCorpus(name).fragments.get(id);
      return f ? [f] : [];
    });
    if (found.length !== 1) return null;
    material.set(id, found[0]);
  }
  const candidates = input.candidates.map(id => ({ id, text: material.get(id)?.sourceText }));
  const prompt = input.kind === "plan_public" ? JSON.stringify({ aspect: input.aspect, missing: input.missing, previousUnit: input.previousUnit, candidates })
    : JSON.stringify({ aspect: input.aspect, claim: material.get(input.claimUnit)?.sourceText, candidates });
  // UTF-8 bytes conservatively bound byte-level tokens. Reserve space for template and output.
  const bytes = Buffer.byteLength(taskInstructions[input.kind]) + Buffer.byteLength(prompt);
  return bytes + taskSpecs[input.kind].tokens + 256 <= TYPED_CONTEXT_TOKENS ? prompt : null;
}

/** A supplementary call spends only the caller's remaining budget; all failures return control to the graph. */
export async function runPublicModelTask(db: Pool, input: PublicTaskInput, deadlineMs: number) {
  const started = Date.now();
  const attemptId = randomUUID();
  const prompt = publicTaskPrompt(input);
  const model = prompt && modelForTask(input.kind);
  const kind = input.kind;
  const remaining = deadlineMs - started;
  const skipped = (status: string) => ({ status, attemptId: null, backend: null, output: null, ms: 0 });
  if (!prompt) return skipped("invalid_input");
  if (!model) return skipped("disabled");
  if (!Number.isFinite(remaining) || remaining < taskSpecs[kind].timeout) return skipped("budget_exhausted");
  const result = await localCompletion(db, model, prompt, attemptId, kind);
  const output = result.status === "ok" && Date.now() < deadlineMs && result.text ? checkedTaskOutput(input, result.text) : null;
  const status = result.status === "ok" && !output ? "invalid_output" : result.status;
  const backend = "local-" + model;
  const ms = Date.now() - started;
  console.info(JSON.stringify({ event: "rag_model_attempt", kind, attemptId, backend, status, ms }));
  return { status, attemptId, backend, output, ms };
}
