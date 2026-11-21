import pg from 'pg';
import { readFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';

const models = {
  bielik: 'SpeakLeash/bielik-11b-v3.1-instruct:Q4_K_M',
  pllum: 'hf.co/mradermacher/PLLuM-12B-chat-2512-GGUF:Q4_K_M',
};
const settings = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const db = new pg.Client({ connectionString: settings.url, connectionTimeoutMillis: 5000, query_timeout: 5000 });
let wake;
let generation = 0;
db.on('notification', () => { generation++; wake?.(); });
db.on('error', () => process.exit(1)); // launchd reconnects with a fresh LISTEN connection.

async function infer(job) {
  const abort = new AbortController();
  const signal = AbortSignal.any([abort.signal, AbortSignal.timeout(Math.max(1, job.left_ms))]);
  const heartbeat = setInterval(async () => {
    try {
      const { rows } = await db.query('select zusik_model.renew($1,$2) as owned', [job.id, job.lease]);
      if (!rows[0].owned) abort.abort();
    } catch { abort.abort(); }
  }, 3000);
  let output = null;
  try {
    const response = await fetch('http://127.0.0.1:11434/api/chat', { method: 'POST', redirect: 'error', signal,
      headers: { 'content-type': 'application/json' }, body: JSON.stringify({ model: models[job.model], stream: false,
        options: { temperature: 0.1, num_predict: settings.tokens },
        messages: [{ role: 'system', content: settings.system }, { role: 'user', content: job.prompt }] }) });
    if (response.ok) {
      const result = await response.json();
      if (result.done && result.model === models[job.model] && typeof result.message?.content === 'string' &&
          Buffer.byteLength(result.message.content) <= 32768) output = result.message.content || null;
    }
  } finally {
    clearInterval(heartbeat);
    const { rows } = await db.query('select zusik_model.finish($1,$2,$3) as owned', [job.id, job.lease, output]);
    console.log(JSON.stringify({ event: 'ollama_attempt', attemptId: job.id, backend: 'local-' + job.model,
      state: !rows[0].owned ? 'expired' : output ? 'generated' : 'failed' }));
  }
}

async function run() {
  await db.connect();
  await db.query('LISTEN zusik_model_ready');
  for (;;) {
    const before = generation;
    const { rows: [job] } = await db.query('select * from zusik_model.claim()');
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
