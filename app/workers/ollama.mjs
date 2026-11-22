import pg from 'pg';
import { hasPreviewModel, lmStudioCompletion } from './lmstudio.ts';
import { readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

import { localModelIds as models, taskSpecs, taskInstructions, checkedTaskOutput, parseModelAnswer, taskGrammar, TYPED_CONTEXT_TOKENS } from '../src/lib/rag/model-tasks.ts';

const settings = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const preview = process.argv[3] === '--lmstudio-qwen-27b';
if (process.argv.length > (preview ? 4 : 3)) throw Error('Unknown worker option');
const db = new pg.Client({ connectionString: settings.url, connectionTimeoutMillis: 5000, query_timeout: 5000 });
let wake;
let generation = 0;
db.on('notification', () => { generation++; wake?.(); });
db.on('error', () => process.exit(1)); // launchd reconnects with a fresh LISTEN connection.

async function infer(job) {
  const kind = job.task_kind ?? "answer_evidence";
  const spec = taskSpecs[kind];
  const abort = new AbortController();
  const signal = preview ? abort.signal : AbortSignal.any([abort.signal, AbortSignal.timeout(Math.max(1, Math.min(job.left_ms, spec.timeout)))]);
  const heartbeat = setInterval(async () => {
    try {
      const { rows } = await db.query('select zusik_model.renew($1,$2) as owned', [job.id, job.lease]);
      if (!rows[0].owned) abort.abort();
    } catch { abort.abort(); }
  }, 3000);
  let output = null;
  let reason = "unavailable";
  let verifiedModel;
  try {
    const input = kind === "answer_evidence" ? undefined : JSON.parse(job.prompt);
    let raw;
    if (preview) {
      const reply = await lmStudioCompletion(kind, input, job.prompt, signal, settings.lmStudioToken, job.left_ms);
      reason = reply.reason;
      // finish('') reports worker_error to the caller without leasing the timed-out prompt again.
      if (reply.terminal) output = '';
      raw = reply.content;
      verifiedModel = reply.model;
    } else {
      const response = await fetch('http://127.0.0.1:11434/api/chat', { method: 'POST', redirect: 'error', signal,
        headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: models[job.model], stream: false,
          ...(input ? {format: taskGrammar(kind, input)} : {}), options: { temperature: 0.1, num_predict: spec.tokens, ...(input ? {num_ctx:TYPED_CONTEXT_TOKENS} : {}) },
          messages: [{ role: 'system', content: taskInstructions[kind] ?? settings.system }, { role: 'user', content: job.prompt }] }) });
      if (response.ok) {
        const result = await response.json();
        reason = result.done_reason === 'length' ? 'token_limit' : 'invalid_output';
        if (result.done && result.model === models[job.model]) raw = result.message?.content;
      } else reason = 'http_' + response.status;
    }
    if (typeof raw === 'string' && Buffer.byteLength(raw) <= 32768) {
      if (kind === 'answer_evidence') {
        const answer = parseModelAnswer(raw);
        if (answer) output = JSON.stringify(answer);
      } else {
        const ids = input.candidates.map(candidate => candidate.id);
        output = checkedTaskOutput({ ...input, kind, candidates: ids }, raw) ? raw : null;
      }
    }
  } catch (error) { reason = signal.aborted ? 'timeout' : error.name; } finally {
    clearInterval(heartbeat);
    const { rows } = await db.query('select zusik_model.finish($1,$2,$3) as owned', [job.id, job.lease, output]);
    console.log(JSON.stringify({ event: preview ? 'lmstudio_attempt' : 'ollama_attempt', model: verifiedModel, kind, attemptId: job.id, backend: 'local-' + job.model,
      state: !rows[0].owned ? 'expired' : output ? 'generated' : 'failed', reason: output ? undefined : reason }));
  }
}

async function run() {
  await db.connect();
  await db.query('LISTEN zusik_model_ready');
  // A newly installed worker can still consume answer-only jobs before the additive migration.
  const { rows: [capabilities] } = await db.query("select to_regprocedure('zusik_model.claim_task()') is not null as typed");
  const claim = preview ? "select * from zusik_model.claim_task(ARRAY['qwen-27b'])" : capabilities.typed ? 'select * from zusik_model.claim_task()' : 'select * from zusik_model.claim()';
  for (;;) {
    if (preview && !await hasPreviewModel(settings.lmStudioToken)) { await sleep(5000); continue; }
    const before = generation;
    const { rows: [job] } = await db.query(claim);
    if (job) { await infer(job).catch(() => undefined); continue; }
    if (before === generation) {
      const stop = new AbortController();
      await Promise.race([new Promise(resolve => { wake = resolve; }), sleep(5000, null, { signal: stop.signal })]);
      wake = undefined;
      stop.abort();
    }
  }
}
run().catch(() => { console.error('worker_connection_failed'); process.exit(1); });
