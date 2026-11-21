/**
 * npm run zusik:migrate
 * Needs MIGRATION_DATABASE_URL (direct, non-pooled owner URL on Neon branch stage1-step1).
 * Optional DATABASE_URL (pooled runtime URL) to prove the runtime role can write and read a checkpoint.
 * Safe to run repeatedly: existing data is kept.
 */
import { randomBytes } from "node:crypto";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { Pool } from "pg";
import { CHECKPOINT_SCHEMA } from "../src/lib/zusik/config";

const OP = "zusik:migrate";
const S = `"${CHECKPOINT_SCHEMA}"`;

function env(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`${OP}: FAILED — missing ${name}`);
    process.exit(1);
  }
  return value;
}

async function migrate(ownerPool: Pool, runtimeRole: string) {
  await new PostgresSaver(ownerPool, undefined, { schema: CHECKPOINT_SCHEMA }).setup();
  await ownerPool.query(`
    CREATE TABLE IF NOT EXISTS ${S}.demo_cases (
      thread_id     text PRIMARY KEY,
      owner_session text NOT NULL UNIQUE,
      created_at    timestamptz NOT NULL DEFAULT now(),
      op_token      text,
      lease_until   timestamptz
    )`);
  // Ask turns (step 2): one row per (thread, requestId); response holds the verified answer and citations.
  await ownerPool.query(`
    CREATE TABLE IF NOT EXISTS ${S}.ask_turns (
      id             bigserial PRIMARY KEY,
      thread_id      text NOT NULL REFERENCES ${S}.demo_cases(thread_id) ON DELETE CASCADE,
      request_id     text NOT NULL,
      question_hash  text NOT NULL,
      question       text NOT NULL,
      status         text NOT NULL,
      response       jsonb,
      corpus_version text,
      op_token       text,
      lease_until    timestamptz,
      created_at     timestamptz NOT NULL DEFAULT now(),
      completed_at   timestamptz,
      UNIQUE (thread_id, request_id)
    )`);
  const role = await ownerPool.query("SELECT 1 FROM pg_roles WHERE rolname = $1", [runtimeRole]);
  if (role.rowCount !== 1) throw new Error(`runtime role ${runtimeRole} does not exist on this branch`);
  const r = `"${runtimeRole}"`;
  await ownerPool.query(`GRANT USAGE ON SCHEMA ${S} TO ${r}`);
  await ownerPool.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${S} TO ${r}`);
  await ownerPool.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ${S} TO ${r}`);
  await ownerPool.query(
    `ALTER DEFAULT PRIVILEGES IN SCHEMA ${S} GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${r}`,
  );
}

/** Writes and reads one checkpoint through the pooled runtime URL, then removes only that test thread. */
async function runtimeRoundTrip(runtimeUrl: string) {
  const pool = new Pool({ connectionString: runtimeUrl, max: 1 });
  const saver = new PostgresSaver(pool, undefined, { schema: CHECKPOINT_SCHEMA });
  const threadId = `migrate-check-${randomBytes(6).toString("hex")}`;
  try {
    await pool.query(`INSERT INTO ${S}.demo_cases (thread_id, owner_session) VALUES ($1, $1)`, [threadId]);
    const State = Annotation.Root({ ok: Annotation<boolean> });
    const graph = new StateGraph(State)
      .addNode("mark", () => ({ ok: true }))
      .addEdge(START, "mark")
      .addEdge("mark", END)
      .compile({ checkpointer: saver });
    await graph.invoke({ ok: false }, { configurable: { thread_id: threadId }, durability: "sync" });
    const tuple = await saver.getTuple({ configurable: { thread_id: threadId } });
    if (!tuple || (tuple.checkpoint.channel_values as { ok?: boolean }).ok !== true) {
      throw new Error("checkpoint written by runtime role could not be read back");
    }
    return tuple.checkpoint.id;
  } finally {
    await saver.deleteThread(threadId).catch(() => undefined);
    await pool.query(`DELETE FROM ${S}.demo_cases WHERE thread_id = $1`, [threadId]).catch(() => undefined);
    await pool.end();
  }
}

async function main() {
  const ownerPool = new Pool({ connectionString: env("MIGRATION_DATABASE_URL"), max: 1 });
  const runtimeRole = process.env.ZUSIK_RUNTIME_ROLE?.trim() || "zusik_runtime";
  if (!/^[a-z_][a-z0-9_]*$/.test(runtimeRole)) throw new Error("ZUSIK_RUNTIME_ROLE must be a plain identifier");
  try {
    const before = await ownerPool
      .query(`SELECT count(*)::int AS n FROM ${S}.demo_cases`)
      .then((r) => r.rows[0].n as number)
      .catch(() => null);
    await migrate(ownerPool, runtimeRole);
    const after = await ownerPool
      .query(`SELECT count(*)::int AS n FROM ${S}.demo_cases`)
      .then((r) => r.rows[0].n as number);
    const checkpoints = await ownerPool
      .query(`SELECT count(*)::int AS n FROM ${S}.checkpoints`)
      .then((r) => r.rows[0].n as number);
    console.log(
      `${OP}: schema ${CHECKPOINT_SCHEMA} ready · demo_cases ${before ?? "new"} → ${after} · checkpoints ${checkpoints}`,
    );
    if (before !== null && after < before) throw new Error("rows disappeared during migration");
    const runtimeUrl = process.env.DATABASE_URL?.trim();
    if (runtimeUrl) {
      const id = await runtimeRoundTrip(runtimeUrl);
      console.log(`${OP}: runtime role write+read OK (checkpoint …${id.slice(-8)}, test thread removed)`);
    } else {
      console.log(`${OP}: DATABASE_URL not set — runtime round-trip skipped`);
    }
    console.log(`${OP}: OK`);
  } finally {
    await ownerPool.end();
  }
}

main().catch((error: Error) => {
  console.error(`${OP}: FAILED — ${error.message}`);
  process.exit(1);
});
