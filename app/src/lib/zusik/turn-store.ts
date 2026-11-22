import { randomBytes } from "node:crypto";
import type { Pool } from "pg";
import { CHECKPOINT_SCHEMA } from "./config";
import type { AskAnswer, AskTurn } from "./types";

/** How long a request may hold a pending turn before another request may take it over. */
export const TURN_LEASE_SECONDS = 60;

export type ClaimResult =
  | { kind: "claimed"; token: string }
  | { kind: "done"; turn: AskTurn }
  | { kind: "pending" }
  | { kind: "conflict" };

/**
 * Saved question/answer turns of one thread. (threadId, requestId) is unique:
 * a retry returns the saved answer, the same id with different text is a conflict,
 * and only the request holding the claim may write the answer.
 */
export interface TurnStore {
  claim(threadId: string, requestId: string, questionHash: string, question: string): Promise<ClaimResult>;
  complete(threadId: string, requestId: string, token: string, answer: AskAnswer): Promise<AskTurn | null>;
  /** Drops a pending claim (e.g. provider outage) so the same request can be retried. */
  release(threadId: string, requestId: string, token: string): Promise<void>;
  list(threadId: string, beforeRequestId?: string, limit?: number): Promise<AskTurn[]>;
}

export function newTurnToken(): string {
  return randomBytes(12).toString("base64url");
}

const T = `"${CHECKPOINT_SCHEMA}".ask_turns`;

interface TurnRow {
  request_id: string;
  question_hash: string;
  question: string;
  status: string;
  response: AskAnswer | null;
  created_at: Date;
  completed_at: Date | null;
  lease_expired: boolean;
}

function toTurn(row: TurnRow): AskTurn {
  const response = row.response as AskAnswer;
  return {
    requestId: row.request_id,
    question: row.question,
    createdAt: row.created_at.toISOString(),
    completedAt: row.completed_at?.toISOString(),
    status: response.status,
    message: response.message,
    claims: response.claims,
    citations: response.citations,
    corpusVersion: response.corpusVersion,
    ...(response.opportunities ? { opportunities: response.opportunities } : {}),
    ...(response.publicQuery ? { publicQuery: response.publicQuery } : {}),
  };
}

export class PgTurnStore implements TurnStore {
  constructor(private readonly pool: Pool) {}

  async claim(threadId: string, requestId: string, questionHash: string, question: string): Promise<ClaimResult> {
    const token = newTurnToken();
    const inserted = await this.pool.query(
      `INSERT INTO ${T} (thread_id, request_id, question_hash, question, status, op_token, lease_until)
       VALUES ($1, $2, $3, $4, 'pending', $5, now() + make_interval(secs => $6))
       ON CONFLICT (thread_id, request_id) DO NOTHING RETURNING id`,
      [threadId, requestId, questionHash, question, token, TURN_LEASE_SECONDS],
    );
    if (inserted.rowCount === 1) return { kind: "claimed", token };

    const { rows } = await this.pool.query<TurnRow>(
      `SELECT request_id, question_hash, question, status, response, created_at, completed_at,
              (lease_until IS NULL OR lease_until < now()) AS lease_expired
       FROM ${T} WHERE thread_id = $1 AND request_id = $2`,
      [threadId, requestId],
    );
    const row = rows[0];
    if (!row) return { kind: "pending" }; // released between our insert and select; the caller retries
    if (row.question_hash !== questionHash) return { kind: "conflict" };
    if (row.status !== "pending") return { kind: "done", turn: toTurn(row) };
    if (!row.lease_expired) return { kind: "pending" };
    const taken = await this.pool.query(
      `UPDATE ${T} SET op_token = $3, lease_until = now() + make_interval(secs => $4)
       WHERE thread_id = $1 AND request_id = $2 AND status = 'pending' AND lease_until < now()`,
      [threadId, requestId, token, TURN_LEASE_SECONDS],
    );
    return taken.rowCount === 1 ? { kind: "claimed", token } : { kind: "pending" };
  }

  async complete(threadId: string, requestId: string, token: string, answer: AskAnswer): Promise<AskTurn | null> {
    const { rows } = await this.pool.query<TurnRow>(
      `UPDATE ${T} SET status = $4, response = $5::jsonb, corpus_version = $6, completed_at = now(),
              op_token = NULL, lease_until = NULL
       WHERE thread_id = $1 AND request_id = $2 AND op_token = $3 AND status = 'pending'
       RETURNING request_id, question_hash, question, status, response, created_at, completed_at, false AS lease_expired`,
      [threadId, requestId, token, answer.status, JSON.stringify(answer), answer.corpusVersion],
    );
    return rows[0] ? toTurn(rows[0]) : null;
  }

  async release(threadId: string, requestId: string, token: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM ${T} WHERE thread_id = $1 AND request_id = $2 AND op_token = $3 AND status = 'pending'`,
      [threadId, requestId, token],
    );
  }

  async list(threadId: string, beforeRequestId?: string, limit?: number): Promise<AskTurn[]> {
    try {
      const { rows } = await this.pool.query<TurnRow>(
        `SELECT request_id, question_hash, question, status, response, created_at, completed_at, false AS lease_expired
         FROM ${T} WHERE thread_id = $1 AND status <> 'pending'
         AND ($2::text IS NULL OR id < (SELECT id FROM ${T} WHERE thread_id = $1 AND request_id = $2)) ORDER BY id DESC LIMIT $3`,
        [threadId, beforeRequestId ?? null, limit ?? null],
      );
      return rows.reverse().map(toTurn);
    } catch (error) {
      // Before `npm run zusik:migrate` adds ask_turns, step 1 keeps working with no turns.
      if ((error as { code?: string }).code === "42P01") return [];
      throw error;
    }
  }
}
