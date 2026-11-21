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
import type { MartaView } from "../marta/types";
import { caseSources, previousSources, sourceIntent } from "./context-answer";

import { resolveFollowUp } from "./retrieval-context";
import { conversationInput, conversationOwner, type CaseName } from "./conversation";

type Progress = (status: string) => void;

export const UNAVAILABLE_MESSAGE = "Nie mogę teraz sprawdzić źródeł. Spróbuj ponownie za chwilę.";

export interface AnswerDeps {
  corpus: Corpus;
  search: KnowledgeSearch;
  /** Local-only fallback mapping the current utterance onto a reviewed public query. */
  suggestTopic?(text: string): PublicQuestion | null;
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
  contextRequestId: string | null;
  expanded: string | null;
  vectorHits: VectorHit[];
  vectorIds: string[];
  evidenceIds: string[];
  search: "ok" | "error" | "skipped";
  model: GenerationResult["status"] | "skipped";
  backend?: string;
  modelId?: string;
  attemptId?: string;
  modelMs: number | null;
  /** Machine-readable distinction between a model proposal and the public application's answer. */
  proposedStatus: AskAnswer["status"] | null;
  quoteReason: "model_unavailable" | "claim_validation" | "statutory_conditions" | "model_abstained" | null;
  finishReason: string | null;
  report: ValidationReport | null;
  calls: { qdrant: number; sherlock: number };
}

const today = () => new Date().toISOString().slice(0, 10);

function projectQuestion(deps: AnswerDeps, text: string): PublicQuestion | null {
  const direct = publicQuestion(text);
  const genericForm = direct?.question.startsWith("Jakie informacje należy zawrzeć") &&
    !/rodzicielsk/iu.test(text);
  if ((direct && !genericForm) || scopeGate(text) || /podat|\bPIT\b|pogrzebow|aliment|kredyt/iu.test(text)) return direct;
  return deps.suggestTopic?.(text) ?? direct;
}

/** Resolve the public query locally before either provider receives it. */
export async function answerQuestion(
  deps: AnswerDeps, question: string, onProgress?: Progress,
  projected = projectQuestion(deps, question), contextRequestId: string | null = null,
): Promise<{ answer: AskAnswer; trace: AnswerTrace }> {
  const corpus = projected && deps.selectCorpus ? deps.selectCorpus(projected.corpus) : deps.corpus;
  const version = corpus.manifest.corpusVersion;
  const sanitized = projected?.question ?? "";
  const trace: AnswerTrace = {
    gate: null,
    contextRequestId,
    sanitized,
    expanded: null,
    vectorHits: [],
    vectorIds: [],
    evidenceIds: [],
    search: "skipped",
    model: "skipped",
    modelMs: null,
    proposedStatus: null,
    quoteReason: null,
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
  // Article 19 states a public percentage; a personalised monetary calculation still requires case data.
  const publicRate = projected?.locators?.includes("uz:19") &&
    !/netto|brutto|na konto|(?<!\p{L})(?:mi|mnie|mój|moja|moje|dostanę|dostaniemy|pln|zł)(?!\p{L})|złotych|\d/iu.test(question);
  if (gate && !(gate.kind === "amount" && publicRate) &&
      !(gate.kind === "clarify" && contextRequestId && !projected?.clarify)) {
    trace.gate = gate.kind;
    return { answer: plain(gate.kind === "amount" ? "insufficient_evidence" : "needs_clarification", gate.message), trace };
  }

  if (projected?.uncovered) return { answer: plain("insufficient_evidence", projected.uncovered), trace };
  if (projected?.clarify) {
    trace.gate = "clarify";
    return { answer: plain("needs_clarification", projected.clarify), trace };
  }
  if (!projected) return { answer: plain("insufficient_evidence",
    "Nie rozpoznałem tematu w bazie Zusika. O jakie świadczenie, dokument albo sytuację chcesz zapytać?"), trace };
  trace.expanded = projected.corpus === "marta" ? expandQuery(sanitized) : null;
  trace.calls.qdrant += 1;
  onProgress?.("Szukam w źródłach urzędowych…");
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
  onProgress?.("Przygotowuję odpowiedź na podstawie źródeł…");
  const generated = await deps.generate(sanitized, fragments, corpus);
  onProgress?.("Sprawdzam cytaty i podstawę odpowiedzi…");
  trace.model = generated.status;
  trace.backend = generated.backend;
  trace.attemptId = generated.attemptId;
  trace.modelId = generated.model;
  trace.modelMs = generated.ms;
  trace.proposedStatus = generated.output?.status ?? null;
  trace.finishReason = generated.finishReason ?? null;
  if (generated.status !== "ok" || !generated.output) {
    // An unusable generation can still leave an exact, reviewed statute already retrieved.
    const quote = extractiveAnswer(corpus, projected, fragments, trace.vectorIds);
    if (quote) trace.quoteReason = "model_unavailable";
    return { answer: quote ?? plain("unavailable", UNAVAILABLE_MESSAGE), trace };
  }

  const { answer, report } = validateAnswer(corpus, fragments, generated.output);
  trace.report = report;
  if (answer.status === "insufficient_evidence" || (answer.status === "answered" && needsStatutoryText(projected, answer))) {
    const quote = extractiveAnswer(corpus, projected, fragments, trace.vectorIds);
    if (quote) {
      if (answer.status === "answered") trace.quoteReason = "statutory_conditions";
      else trace.quoteReason = generated.output.status === "insufficient_evidence" ? "model_abstained" : "claim_validation";
      return { answer: quote, trace };
    }
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
  readMarta?(sessionId: string): Promise<{ view?: MartaView | null; savedAt?: string }>;
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

  async ask(sessionId: string, question: string, requestId: string, onProgress?: Progress, onVerified?: (turn: AskTurn) => void, scenario: CaseName = "marta"): Promise<AskResult> {
    const demoCase = await this.deps.store.findOrCreate(conversationOwner(sessionId, scenario));
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

    let result: { answer: AskAnswer; trace: AnswerTrace | null };
    try {
      onProgress?.("Sprawdzam kontekst pytania…");
      const { text, reply } = conversationInput(question, scenario);
      const intent = sourceIntent(text);
      if (reply) {
        result = { answer: { status: "conversation", message: reply, claims: [], citations: [],
          corpusVersion: this.deps.corpus.manifest.corpusVersion }, trace: null };
      } else if (intent) {
        const previous = intent === "case" ? undefined : (await this.deps.turns.list(threadId, requestId)).filter(turn => turn.status !== "conversation").at(-1);
        const snapshot = scenario !== "marta" || intent === "previous" ? undefined : await this.deps.readMarta?.(sessionId);
        const newerCase = snapshot?.view && snapshot.savedAt && previous &&
          Date.parse(snapshot.savedAt) > Date.parse(previous.completedAt ?? previous.createdAt);
        const answer = scenario !== "marta" || intent === "previous" || (previous && !newerCase)
          ? previousSources(previous, this.deps.corpus.manifest.corpusVersion)
          : caseSources(snapshot?.view ?? null, this.deps.corpus);
        result = { answer, trace: null };
      } else {
        const history = await this.deps.turns.list(threadId, requestId, 24);
        const context = resolveFollowUp(text, history, this.deps.suggestTopic);
        const projected = context?.plan ?? projectQuestion(this.deps, text);
        result = await answerQuestion(this.deps, text, onProgress, projected, context?.requestId);
        if (projected?.question && result.answer.status !== "unavailable")
          result.answer.publicQuery = projected.question;
      }
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
      onProgress?.("Zapisuję odpowiedź w rozmowie…");
      onVerified?.({ ...result.answer, requestId, question, createdAt: (this.deps.now?.() ?? new Date()).toISOString() });
      const saved = await this.deps.turns.complete(threadId, requestId, token, result.answer);
      if (!saved) return { status: 409, turn: null, trace: result.trace };
      return { status: 200, turn: saved, trace: result.trace };
    } catch (error) {
      await this.deps.turns.release(threadId, requestId, token).catch(() => undefined);
      throw error;
    }
  }
}
