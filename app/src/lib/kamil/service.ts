import { randomBytes } from "node:crypto";
import { Annotation, END, START, StateGraph, type BaseCheckpointSaver } from "@langchain/langgraph";
import type { CaseStore } from "../zusik/case-store";
import { applyCommand, newCase, toView, type Clock, type Prepared } from "./case";
import type { Command, KamilCase, KamilView } from "./contract";
import { mergeModelFacts, parseMessage, type ModelFacts } from "./interpret";

/**
 * Kamil's case on the existing demo session: the signed cookie → demo_cases row → thread id.
 * The case lives in the LangGraph checkpoint of `<thread>:kamil` (same Neon tables as Marta's
 * flow), so a refresh or another function instance reads the same state.
 */

export interface KamilModel {
  /** Facts from free text (JSON validated by Zod). null when the model is unavailable or unsure. */
  extract(text: string, today: string): Promise<ModelFacts | null>;
  /** Rephrases a reply in natural Polish. Must keep every number and date. */
  rephrase(text: string): Promise<string | null>;
}

export interface KamilServiceDeps {
  store: CaseStore;
  checkpointer: BaseCheckpointSaver;
  model?: KamilModel | null;
  clock?: () => { now: string; today: string };
  leaseWaitMs?: number;
}

export interface KamilResult {
  status: 200 | 202 | 409 | 422;
  view: KamilView;
  error?: string;
}

const KamilState = Annotation.Root({ kase: Annotation<KamilCase> });

function buildGraph(checkpointer: BaseCheckpointSaver) {
  // One node: the state is computed before invoke, so model calls never re-run on a replay.
  return new StateGraph(KamilState)
    .addNode("save", (state) => ({ kase: state.kase }))
    .addEdge(START, "save")
    .addEdge("save", END)
    .compile({ checkpointer });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Every digit group of the rephrased text must already be in the template, and none may be lost. */
export function keepsNumbers(template: string, candidate: string): boolean {
  const allowed = new Set(template.match(/\d+/g) ?? []);
  const used: string[] = candidate.match(/\d+/g) ?? [];
  return used.every((n) => allowed.has(n)) && [...allowed].every((n) => used.includes(n));
}

export class KamilService {
  private readonly graph;
  constructor(private readonly deps: KamilServiceDeps) {
    this.graph = buildGraph(deps.checkpointer);
  }

  private clock(): Clock {
    const now = new Date().toISOString();
    const base = this.deps.clock?.() ?? { now, today: now.slice(0, 10) };
    return { ...base, newId: () => randomBytes(9).toString("base64url") };
  }

  private config(threadId: string) {
    return { configurable: { thread_id: `${threadId}:kamil` }, durability: "sync" as const };
  }

  private async load(threadId: string): Promise<KamilCase> {
    const snapshot = await this.graph.getState(this.config(threadId));
    return (snapshot.values as { kase?: KamilCase }).kase ?? newCase();
  }

  /** GET: reads only. A session without a case sees an empty one. */
  async getView(sessionId: string): Promise<KamilView> {
    const clock = this.clock();
    const demoCase = await this.deps.store.findBySession(sessionId);
    if (!demoCase) return toView(newCase(), clock.today);
    return toView(await this.load(demoCase.threadId), clock.today);
  }

  async apply(sessionId: string, expectedVersion: number, command: Command): Promise<KamilResult> {
    const demoCase = await this.deps.store.findOrCreate(sessionId);
    const token = randomBytes(12).toString("base64url");
    const waitUntil = Date.now() + (this.deps.leaseWaitMs ?? 6_000);
    while (!(await this.deps.store.acquireLease(demoCase.threadId, token))) {
      if (Date.now() >= waitUntil) return { status: 202, view: await this.getView(sessionId) };
      await sleep(150);
    }
    try {
      const clock = this.clock();
      const current = await this.load(demoCase.threadId);
      // Same operation key again (double click, retry after a timeout): same result, nothing new.
      if (current.ops.includes(command.opKey)) return { status: 200, view: toView(current, clock.today) };
      if (expectedVersion !== current.version) {
        return { status: 409, view: toView(current, clock.today), error: "stale_version" };
      }
      const prepared = await this.prepare(command, current, clock.today);
      const outcome = applyCommand(current, prepared, clock);
      if (outcome.rejected) return { status: 422, view: toView(current, clock.today), error: outcome.rejected };
      const next = prepared.type === "chat" ? await this.rephraseLast(outcome.kase, current) : outcome.kase;
      await this.graph.invoke({ kase: next }, this.config(demoCase.threadId));
      return { status: 200, view: toView(next, clock.today) };
    } finally {
      await this.deps.store.releaseLease(demoCase.threadId, token);
    }
  }

  private async prepare(command: Command, current: KamilCase, today: string): Promise<Prepared> {
    if (command.type !== "chat") return command;
    const rules = parseMessage(command.text, today, current.asked);
    const nothingFound =
      !rules.startDate && !rules.days && !rules.birthDate && !rules.reminderDate && !rules.yesNo && !rules.priorPart;
    let interpretation = rules;
    if (nothingFound && this.deps.model) {
      const facts = await this.deps.model.extract(command.text, today).catch(() => null);
      interpretation = mergeModelFacts(rules, facts, today);
    }
    return { ...command, interpretation };
  }

  /** The model may rephrase Zusik's last reply; dates and numbers stay exactly as computed. */
  private async rephraseLast(next: KamilCase, before: KamilCase): Promise<KamilCase> {
    const model = this.deps.model;
    const last = next.chat[next.chat.length - 1];
    if (!model || !last || last.role !== "zusik" || next.chat.length === before.chat.length) return next;
    const text = await model.rephrase(last.text).catch(() => null);
    if (!text || text.length > 700 || !keepsNumbers(last.text, text)) return next;
    const chat = [...next.chat.slice(0, -1), { ...last, text, author: "model" as const }];
    return { ...next, chat };
  }
}
