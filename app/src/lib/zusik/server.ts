import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres";
import { cookies } from "next/headers";
import { Pool } from "pg";
import { CHECKPOINT_SCHEMA, ConfigError, DEFAULT_EMBED_MODEL, requireEnv } from "./config";
import { SESSION_COOKIE } from "./constants";
import { PgCaseStore } from "./case-store";
import { queryQdrant } from "./qdrant";
import { ProbeService } from "./service";
import { decodeSession } from "./session";
import { askSherlock } from "./sherlock";

/**
 * Runtime wiring for route handlers. One small pool per function instance;
 * DATABASE_URL is Neon's pooled (-pooler) URL for the zusik_runtime role.
 */
let pool: Pool | null = null;
let checkpointer: PostgresSaver | null = null;

function runtime() {
  if (!pool || !checkpointer) {
    pool = new Pool({ connectionString: requireEnv("DATABASE_URL"), max: 3, connectionTimeoutMillis: 5_000 });
    checkpointer = new PostgresSaver(pool, undefined, { schema: CHECKPOINT_SCHEMA });
  }
  return { pool, checkpointer };
}

function qdrantSettings() {
  return {
    url: requireEnv("QDRANT_URL"),
    apiKey: requireEnv("QDRANT_READ_KEY"),
    collection: requireEnv("QDRANT_COLLECTION"),
    model: process.env.QDRANT_EMBED_MODEL?.trim() || DEFAULT_EMBED_MODEL,
  };
}

function sherlockSettings() {
  return {
    baseURL: requireEnv("SHERLOCK_BASE_URL"),
    apiKey: requireEnv("SHERLOCK_API_KEY"),
    model: requireEnv("SHERLOCK_MODEL"),
  };
}

/** Start calls this first, so a missing provider variable is reported by name. */
export function assertProviderConfig(): void {
  qdrantSettings();
  sherlockSettings();
}

/** Reading state and resuming need only Neon; provider settings resolve on call. */
export function probeService(): ProbeService {
  const { pool: db, checkpointer: saver } = runtime();
  return new ProbeService({
    store: new PgCaseStore(db),
    checkpointer: saver,
    providers: {
      retrieve: (query) => queryQdrant(qdrantSettings(), query),
      askQuestion: (text) => askSherlock(sherlockSettings(), text),
    },
  });
}

export function signingSecret(): string {
  return requireEnv("SESSION_SIGNING_SECRET");
}

/** Verified session id from the HttpOnly cookie, or null. */
export async function currentSessionId(): Promise<string | null> {
  const store = await cookies();
  return decodeSession(store.get(SESSION_COOKIE)?.value, signingSecret());
}

export const NO_STORE = { "Cache-Control": "private, no-store" } as const;

/** Maps failures to responses without leaking DSNs, keys or case content. */
export function errorResponse(error: unknown, opId: string): Response {
  if (error instanceof ConfigError) {
    console.error(JSON.stringify({ event: "config_error", opId, variable: error.variable }));
    return Response.json({ error: "config_missing", variable: error.variable }, { status: 500, headers: NO_STORE });
  }
  console.error(JSON.stringify({ event: "storage_error", opId, error: (error as Error)?.name }));
  return Response.json({ error: "storage_unavailable", retry: true }, { status: 503, headers: NO_STORE });
}
