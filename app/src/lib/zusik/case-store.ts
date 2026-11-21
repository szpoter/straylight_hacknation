import { randomBytes } from "node:crypto";
import type { Pool } from "pg";
import { CHECKPOINT_SCHEMA, LEASE_SECONDS } from "./config";

export interface DemoCase {
  threadId: string;
  ownerSession: string;
  createdAt: Date;
  /** True while a start/resume holds the operation lease. */
  leaseActive: boolean;
}

/**
 * Binding session → thread plus a per-thread operation lease, so only one
 * request at a time runs start/resume for a given thread.
 */
export interface CaseStore {
  findBySession(sessionId: string): Promise<DemoCase | null>;
  findOrCreate(sessionId: string): Promise<DemoCase>;
  acquireLease(threadId: string, token: string): Promise<boolean>;
  releaseLease(threadId: string, token: string): Promise<void>;
}

export function newThreadId(): string {
  return `t_${randomBytes(18).toString("base64url")}`;
}

const T = `"${CHECKPOINT_SCHEMA}".demo_cases`;

export class PgCaseStore implements CaseStore {
  constructor(private readonly pool: Pool) {}

  async findBySession(sessionId: string): Promise<DemoCase | null> {
    const { rows } = await this.pool.query(
      `SELECT thread_id, owner_session, created_at,
              (op_token IS NOT NULL AND lease_until > now()) AS lease_active FROM ${T} WHERE owner_session = $1`,
      [sessionId],
    );
    return rows[0] ? toCase(rows[0]) : null;
  }

  async findOrCreate(sessionId: string): Promise<DemoCase> {
    // Unique owner_session makes concurrent first starts converge on one row.
    const { rows } = await this.pool.query(
      `INSERT INTO ${T} (thread_id, owner_session) VALUES ($1, $2)
       ON CONFLICT (owner_session) DO UPDATE SET owner_session = EXCLUDED.owner_session
       RETURNING thread_id, owner_session, created_at,
                 (op_token IS NOT NULL AND lease_until > now()) AS lease_active`,
      [newThreadId(), sessionId],
    );
    return toCase(rows[0]);
  }

  async acquireLease(threadId: string, token: string): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      `UPDATE ${T} SET op_token = $2, lease_until = now() + make_interval(secs => $3)
       WHERE thread_id = $1 AND (op_token IS NULL OR lease_until < now())`,
      [threadId, token, LEASE_SECONDS],
    );
    return rowCount === 1;
  }

  async releaseLease(threadId: string, token: string): Promise<void> {
    await this.pool.query(
      `UPDATE ${T} SET op_token = NULL, lease_until = NULL WHERE thread_id = $1 AND op_token = $2`,
      [threadId, token],
    );
  }
}

function toCase(row: {
  thread_id: string;
  owner_session: string;
  created_at: Date;
  lease_active: boolean;
}): DemoCase {
  return {
    threadId: row.thread_id,
    ownerSession: row.owner_session,
    createdAt: row.created_at,
    leaseActive: row.lease_active,
  };
}
