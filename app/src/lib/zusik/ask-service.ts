import { normalizeSpaces, sha256, type Corpus, type Fragment } from "../rag/corpus";
import { NO_BASIS_MESSAGE, validateAnswer, type GenerationResult, type ValidationReport } from "../rag/answer";
import { relevantFragment } from "../rag/relevance";
import { extractiveAnswer, needsStatutoryText } from "../rag/excerpt";
import { publicQuestion, type PublicQuestion } from "../rag/public-query";
import { excludedTopics, expandQuery, explicitLocatorKeys, scopeGate } from "../rag/query";
import { assembleEvidence, TOP_K, type KnowledgeSearch, type VectorHit } from "../rag/retrieve";
import type { CaseStore } from "./case-store";
import type { TurnStore } from "./turn-store";
import type { AskAnswer, AskTurn } from "./types";

export const UNAVAILABLE_MESSAGE = "Nie mogę teraz sprawdzić źródeł. Spróbuj ponownie za chwilę.";

export interface AnswerDeps {
  corpus: Corpus;
  search: KnowledgeSearch;
  selectCorpus?(name: PublicQuestion["corpus"]): Corpus;
  /** Bielik via Sherlock. Receives only the sanitised question and public fragments. */
  generate(question: string, evidence: Fragment[], corpus: Corpus): Promise<GenerationResult>;
  /** Case date for validity checks (YYYY-MM-DD). */
  asOf?: () => string;
}

/** Ids, statuses and timings; logs keep only the id fields, never question text. */
export interface AnswerTrace {
  gate: "amount" | "clarify" | null;
  sanitized: string;
  expanded: string | null;
  vectorHits: VectorHit[];
  vectorIds: string[];
  evidenceIds: string[];
  search: "ok" | "error" | "skipped";
  model: GenerationResult["status"] | "skipped";
  modelMs: number | null;
  finishReason: string | null;
  report: ValidationReport | null;
  calls: { qdrant: number; sherlock: number };
}

const today = () => new Date().toISOString().slice(0, 10);

/** Question → scope gate → privacy rewrite → search → evidence → Bielik → validation. */
export async function answerQuestion(deps: AnswerDeps, question: string): Promise<{ answer: AskAnswer; trace: AnswerTrace }> {
  const projected = publicQuestion(question);
  const corpus = projected && deps.selectCorpus ? deps.selectCorpus(projected.corpus) : deps.corpus;
  const version = corpus.manifest.corpusVersion;
  const sanitized = projected?.question ?? "";
  const trace: AnswerTrace = {
    gate: null,
    sanitized,
    expanded: null,
    vectorHits: [],
    vectorIds: [],
    evidenceIds: [],
    search: "skipped",
    model: "skipped",
    modelMs: null,
    finishReason: null,
    report: null,
    calls: { qdrant: 0, sherlock: 0 },
  };
  const plain = (status: AskAnswer["status"], message: string): AskAnswer => ({
    status,
    message,
    claims: [],
    citations: [],
    corpusVersion: version,
  });

  // The family-program catalogue supports general 800+ information.
  const gate = projected?.corpus === "oferta" && deps.selectCorpus ? null : scopeGate(question);
  if (gate) {
    trace.gate = gate.kind;
    return { answer: plain(gate.kind === "amount" ? "insufficient_evidence" : "needs_clarification", gate.message), trace };
  }

  if (projected?.clarify) {
    trace.gate = "clarify";
    return { answer: plain("needs_clarification", projected.clarify), trace };
  }
  if (!projected) return { answer: plain("insufficient_evidence", NO_BASIS_MESSAGE), trace };
  trace.expanded = projected.corpus === "marta" ? expandQuery(sanitized) : null;
  trace.calls.qdrant += 1;
  const found = await deps.search.search({ query: sanitized, expanded: trace.expanded, corpusVersion: version, limit: TOP_K });
  trace.search = found.status;
  if (found.status !== "ok") return { answer: plain("unavailable", UNAVAILABLE_MESSAGE), trace };
  trace.vectorHits = found.hits;

  const evidence = assembleEvidence(corpus, found.hits, {
    locatorKeys: projected.locators ?? explicitLocatorKeys(question),
    excludeTopics: excludedTopics(question),
    asOf: (deps.asOf ?? today)(),
  });
  trace.vectorIds = evidence.vectorIds;
  const relevant = relevantFragment(projected, corpus);
  const rawSubjectHit = evidence.vectorIds.some((id) => {
    const fragment = corpus.fragments.get(id);
    return fragment && relevant(fragment);
  });
  const fragments = rawSubjectHit ? evidence.items.map((i) => i.fragment).filter(relevant) : [];
  trace.evidenceIds = fragments.map((f) => f.logicalId);
  if (fragments.length === 0) {
    const { answer } = validateAnswer(corpus, [], { status: "insufficient_evidence", message: "", claims: [] });
    return { answer, trace };
  }

  trace.calls.sherlock += 1;
  const generated = await deps.generate(sanitized, fragments, corpus);
  trace.model = generated.status;
  trace.modelMs = generated.ms;
  trace.finishReason = generated.finishReason ?? null;
  if (generated.status !== "ok" || !generated.output) {
    // An unusable generation can still leave an exact, reviewed statute already retrieved.
    const quote = extractiveAnswer(corpus, projected, fragments, trace.vectorIds);
    return { answer: quote ?? plain("unavailable", UNAVAILABLE_MESSAGE), trace };
  }

  const { answer, report } = validateAnswer(corpus, fragments, generated.output);
  trace.report = report;
  if (answer.status === "insufficient_evidence" || (answer.status === "answered" && needsStatutoryText(projected, answer))) {
    const quote = extractiveAnswer(corpus, projected, fragments, trace.vectorIds);
    if (quote) return { answer: quote, trace };
    if (answer.status === "answered") return { answer: plain("insufficient_evidence", NO_BASIS_MESSAGE), trace };
  }
  return { answer, trace };
}

export interface AskResult {
  status: 200 | 202 | 409 | 503;
  turn: AskTurn | null;
  trace: AnswerTrace | null;
}

export interface AskServiceDeps extends AnswerDeps {
  store: CaseStore;
  turns: TurnStore;
  /** How long a duplicate request waits for the first one to finish. */
  pendingWaitMs?: number;
  now?: () => Date;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function questionHash(question: string): string {
  return sha256(normalizeSpaces(question));
}

/**
 * Informational question on the session's own thread. Does not touch the
 * choice graph or its interrupt. A saved answer is returned on retry and on F5
 * without calling any provider again.
 */
export class AskService {
  constructor(private readonly deps: AskServiceDeps) {}

  async ask(sessionId: string, question: string, requestId: string): Promise<AskResult> {
    const demoCase = await this.deps.store.findOrCreate(sessionId);
    const threadId = demoCase.threadId;
    const hash = questionHash(question);
    const deadline = Date.now() + (this.deps.pendingWaitMs ?? 45_000);

    let token: string | null = null;
    while (!token) {
      const claim = await this.deps.turns.claim(threadId, requestId, hash, question);
      if (claim.kind === "claimed") token = claim.token;
      else if (claim.kind === "done") return { status: 200, turn: claim.turn, trace: null };
      else if (claim.kind === "conflict") return { status: 409, turn: null, trace: null };
      else if (Date.now() >= deadline) return { status: 202, turn: null, trace: null };
      else await sleep(200);
    }

    let result: { answer: AskAnswer; trace: AnswerTrace };
    try {
      result = await answerQuestion(this.deps, question);
    } catch (error) {
      await this.deps.turns.release(threadId, requestId, token).catch(() => undefined);
      throw error;
    }

    if (result.answer.status === "unavailable") {
      // Outage: nothing is saved, the same requestId can be retried.
      await this.deps.turns.release(threadId, requestId, token);
      const turn: AskTurn = { ...result.answer, requestId, question, createdAt: (this.deps.now?.() ?? new Date()).toISOString() };
      return { status: 503, turn, trace: result.trace };
    }
    try {
      const saved = await this.deps.turns.complete(threadId, requestId, token, result.answer);
      if (!saved) return { status: 409, turn: null, trace: result.trace };
      return { status: 200, turn: saved, trace: result.trace };
    } catch (error) {
      await this.deps.turns.release(threadId, requestId, token).catch(() => undefined);
      throw error;
    }
  }
}
