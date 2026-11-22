import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { Pool } from "pg";
import { CHECKPOINT_SCHEMA, requireEnv } from "../zusik/config";
import { MemorySaver } from "@langchain/langgraph";
import { PgCaseStore, newThreadId, type CaseStore, type DemoCase } from "../zusik/case-store";
import { KamilService } from "./service";

/**
 * Runtime wiring for /api/kamil. Same Neon database, schema and demo_cases table as Marta's flow;
 * a separate small pool so this module does not depend on lib/zusik/server.ts internals.
 */
let pool: Pool | null = null;
let checkpointer: PostgresSaver | null = null;

function runtime() {
  if (!pool || !checkpointer) {
    pool = new Pool({ connectionString: requireEnv("DATABASE_URL"), max: 2, connectionTimeoutMillis: 5_000 });
    checkpointer = new PostgresSaver(pool, undefined, { schema: CHECKPOINT_SCHEMA });
  }
  return { pool, checkpointer };
}

/**
 * Local development without Neon: KAMIL_MEMORY_STORE=1 keeps cases in this process only.
 * Ignored in production builds, so a deployment can never silently lose cases.
 */
class DevMemoryStore implements CaseStore {
  private cases = new Map<string, DemoCase>();
  async findBySession(sessionId: string) {
    return this.cases.get(sessionId) ?? null;
  }
  async findOrCreate(sessionId: string) {
    const found = this.cases.get(sessionId);
    if (found) return found;
    const created = { threadId: newThreadId(), ownerSession: sessionId, createdAt: new Date(), leaseActive: false };
    this.cases.set(sessionId, created);
    return created;
  }
  async acquireLease() {
    return true;
  }
  async releaseLease() {}
}
let devService: KamilService | null = null;

/** Case messages and document fields stay within the session-bound rules service. */
export function kamilService(): KamilService {
  if (process.env.KAMIL_MEMORY_STORE === "1" && process.env.NODE_ENV !== "production") {
    devService ??= new KamilService({ store: new DevMemoryStore(), checkpointer: new MemorySaver() });
    return devService;
  }
  const { pool: db, checkpointer: saver } = runtime();
  return new KamilService({ store: new PgCaseStore(db), checkpointer: saver });
}
