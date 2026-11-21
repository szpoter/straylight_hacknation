import { MemorySaver } from "@langchain/langgraph";
import type { RunnableConfig } from "@langchain/core/runnables";
import type { Checkpoint, CheckpointMetadata } from "@langchain/langgraph";
import { newThreadId, type CaseStore, type DemoCase } from "@/lib/zusik/case-store";
import { newTurnToken, type ClaimResult, type TurnStore } from "@/lib/zusik/turn-store";
import type { AskAnswer, AskTurn, ProbeProviders, QuestionResult, RetrievalResult } from "@/lib/zusik/types";

/** Same contract as PgCaseStore: unique session binding + conditional lease. */
export class MemoryCaseStore implements CaseStore {
  private cases = new Map<string, DemoCase>();
  private leases = new Map<string, { token: string; until: number }>();

  async findBySession(sessionId: string) {
    const found = this.cases.get(sessionId);
    return found ? { ...found, leaseActive: this.leaseActive(found.threadId) } : null;
  }
  async findOrCreate(sessionId: string) {
    if (!this.cases.has(sessionId)) {
      this.cases.set(sessionId, { threadId: newThreadId(), ownerSession: sessionId, createdAt: new Date(), leaseActive: false });
    }
    return (await this.findBySession(sessionId))!;
  }
  async acquireLease(threadId: string, token: string) {
    if (this.leaseActive(threadId)) return false;
    this.leases.set(threadId, { token, until: Date.now() + 90_000 });
    return true;
  }
  async releaseLease(threadId: string, token: string) {
    if (this.leases.get(threadId)?.token === token) this.leases.delete(threadId);
  }
  private leaseActive(threadId: string) {
    const lease = this.leases.get(threadId);
    return !!lease && lease.until > Date.now();
  }
}

/** MemorySaver that can simulate a Neon write failure. */
export class FlakySaver extends MemorySaver {
  failWrites = false;
  async put(config: RunnableConfig, checkpoint: Checkpoint, metadata: CheckpointMetadata) {
    if (this.failWrites) throw Object.assign(new Error("connection terminated"), { name: "NeonWriteError" });
    return super.put(config, checkpoint, metadata);
  }
  async putWrites(config: RunnableConfig, writes: Parameters<MemorySaver["putWrites"]>[1], taskId: string) {
    if (this.failWrites) throw Object.assign(new Error("connection terminated"), { name: "NeonWriteError" });
    return super.putWrites(config, writes, taskId);
  }
}

export const HIT: RetrievalResult = {
  status: "ok",
  fragment: {
    sourceId: "probe-opieka",
    text: "W tej demonstracji rodzice wybierają, czy chcą opiekować się dzieckiem razem, czy kolejno.",
    score: 0.91,
  },
  ms: 12,
};

export const MODEL_QUESTION = "Marto, czy chcesz opiekować się dzieckiem razem z Pawłem, czy kolejno?";

export function fakeProviders(overrides: Partial<{ retrieval: RetrievalResult; question: QuestionResult }> = {}) {
  const calls = { qdrant: 0, sherlock: 0 };
  const providers: ProbeProviders = {
    async retrieve() {
      calls.qdrant += 1;
      return overrides.retrieval ?? HIT;
    },
    async askQuestion() {
      calls.sherlock += 1;
      return overrides.question ?? { status: "ok", question: MODEL_QUESTION, model: "bielik-test", ms: 40 };
    },
  };
  return { providers, calls };
}

/** Same contract as PgTurnStore: unique (thread, requestId), claim token, ordered list. */
export class MemoryTurnStore implements TurnStore {
  private rows: Array<{
    threadId: string;
    requestId: string;
    hash: string;
    question: string;
    token: string | null;
    answer: AskAnswer | null;
    createdAt: Date;
  }> = [];
  failComplete = false;

  async claim(threadId: string, requestId: string, hash: string, question: string): Promise<ClaimResult> {
    const row = this.rows.find((r) => r.threadId === threadId && r.requestId === requestId);
    if (!row) {
      const token = newTurnToken();
      this.rows.push({ threadId, requestId, hash, question, token, answer: null, createdAt: new Date() });
      return { kind: "claimed", token };
    }
    if (row.hash !== hash) return { kind: "conflict" };
    if (row.answer) return { kind: "done", turn: this.toTurn(row) };
    return { kind: "pending" };
  }
  async complete(threadId: string, requestId: string, token: string, answer: AskAnswer) {
    if (this.failComplete) throw Object.assign(new Error("connection terminated"), { name: "NeonWriteError" });
    const row = this.rows.find((r) => r.threadId === threadId && r.requestId === requestId && r.token === token);
    if (!row || row.answer) return null;
    row.answer = answer;
    row.token = null;
    return this.toTurn(row);
  }
  async release(threadId: string, requestId: string, token: string) {
    this.rows = this.rows.filter((r) => !(r.threadId === threadId && r.requestId === requestId && r.token === token && !r.answer));
  }
  async list(threadId: string) {
    return this.rows.filter((r) => r.threadId === threadId && r.answer).map((r) => this.toTurn(r));
  }
  private toTurn(row: MemoryTurnStore["rows"][number]): AskTurn {
    return { ...row.answer!, requestId: row.requestId, question: row.question, createdAt: row.createdAt.toISOString() };
  }
}
