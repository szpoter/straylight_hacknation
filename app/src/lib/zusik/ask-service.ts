import { citationUrl, isValidOn, normalizeSpaces, sha256, type Corpus, type Fragment } from "../rag/corpus";
import { listOpportunities } from "../plan/opportunities";
import type { PublicTaskInput } from "../rag/model-tasks";
import type { runPublicModelTask } from "../rag/local-queue";
import { NO_BASIS_MESSAGE, validateAnswer, type GenerationResult, type ValidationReport } from "../rag/answer";
import { corpusFollowUp } from "../rag/corpus-search";
import { fetchOfficialEvidence, type discoverOfficialEvidence } from "../rag/official-fetch";
import { nurseryIntent, runSectionTurn, schoolRecipientIntent } from "./turn-graph";
import { relevantFragment } from "../rag/relevance";
import { extractiveAnswer, needsStatutoryText, reviewedSourceIds, withSourceException } from "../rag/excerpt";
import { publicQuestion, type PublicQuestion } from "../rag/public-query";
import { excludedTopics, expandQuery, explicitLocatorKeys, scopeGate } from "../rag/query";
import { assembleEvidence, TOP_K, type KnowledgeSearch, type VectorHit } from "../rag/retrieve";
import type { CaseStore } from "./case-store";
import type { TurnStore } from "./turn-store";
import type { AskAnswer, AskTurn } from "./types";
import type { MartaView } from "../marta/types";
import { caseSources, previousSources, sourceIntent } from "./context-answer";

import { familyTopic } from "./family-chat";
import { resolveFollowUp } from "./retrieval-context";
import { conversationInput, conversationOwner, type CaseName, type FamilyChatScope } from "./conversation";

type Progress = (status: string) => void;

export const UNAVAILABLE_MESSAGE = "Nie mogę teraz sprawdzić źródeł. Spróbuj ponownie za chwilę.";

export interface AnswerDeps {
  deadlineMs?: number;
  publicTask?(input: PublicTaskInput, deadline: number): ReturnType<typeof runPublicModelTask>;
  readOfficial?: typeof fetchOfficialEvidence;
  discoverOfficial?: typeof discoverOfficialEvidence;
  corpus: Corpus;
  search: KnowledgeSearch;
  /** Local-only fallback mapping the current utterance onto a reviewed public query. */
  suggestTopic?(text: string): PublicQuestion | null;
  searchCorpus?(text: string, direct?: PublicQuestion | null): PublicQuestion | null;
  selectCorpus?(name: PublicQuestion["corpus"]): Corpus;
  /** Bielik via Sherlock. Receives only the sanitised question and public fragments. */
  generate(question: string, evidence: Fragment[], corpus: Corpus): Promise<GenerationResult>;
  /** Case date for validity checks (YYYY-MM-DD). */
  asOf?: () => string;
}

/** Ids, statuses and timings; logs keep only the id fields, never question text. */
export interface AnswerTrace {
  advisory?: { kind: PublicTaskInput["kind"]; status: string; attemptId: string | null; backend: string | null; ms: number };
  officialFetches?: number;
  gate: "amount" | "clarify" | null;
  sanitized: string;
  contextRequestId: string | null;
  expanded: string | null;
  vectorHits: VectorHit[];
  rankings?: { dense: string[]; lexical: string[] };
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

function newTrace(sanitized: string, contextRequestId: string | null): AnswerTrace {
  return {
    gate: null, contextRequestId, sanitized, expanded: null, vectorHits: [], vectorIds: [],
    evidenceIds: [], search: "skipped", model: "skipped", modelMs: null, proposedStatus: null,
    quoteReason: null, finishReason: null, report: null, calls: { qdrant: 0, sherlock: 0 },
  };
}

function projectQuestion(deps: AnswerDeps, text: string): PublicQuestion | null {
  const direct = publicQuestion(text);
  const genericForm = direct?.question.startsWith("Jakie informacje należy zawrzeć") &&
    !/rodzicielsk/iu.test(text);
  if (direct?.clarify || scopeGate(text) || /podat|\bPIT\b|pogrzebow|aliment|kredyt/iu.test(text)) return direct;
  const preset = (!direct || genericForm) ? deps.suggestTopic?.(text) : null;
  // Preserve reviewed compound rules whose exceptions must travel with the main article.
  if (preset || direct?.corpus === "oferta" || (direct?.corpus === "marta" && !genericForm) ||
      ((direct?.locators?.length ?? 0) > 1 && !direct?.broad) || explicitLocatorKeys(text).length) return preset ?? direct;
  return deps.searchCorpus?.(text, direct) ?? direct;
}

async function discoverOpportunities(deps: AnswerDeps, text: string, progress?: Progress) {
  const fullCatalog = /(?:cał[ayąe]|pełn[yąae]|wszystki[e])\s+(?:katalog|list|ofert|program|możliwoś|świadczeni)/iu.test(text);
  if (!deps.selectCorpus || /(?<!\d)(?:19|20)\d{2}(?!\d)|kiedyś|dawniej|zeszł|ubiegł/iu.test(text)) return null;
  const describesCare = !/[?]|(?:kiedy|ile|czy |jaki|komu|kwot|wniosek|załącznik)/iu.test(text)
    && /babci|dziadk|inkubator|zamknęli.{0,20}żłob|zaczyna.{0,20}(?:szkoł|podstawówk)/iu.test(text);
  if (!fullCatalog && !describesCare && !/co (?:warto|mogę|możemy|można)|co (?:mi|nam) (?:przysługuje|się należy)|(?:jakie|jaką|jakiego) (?:są |mam |mamy )?(?:możliwoś|opcje|wsparci|pomoc|świadczeni)|z czego|porównaj|jakie programy|nie wiem.{0,20}zapytać|jednak.{0,25}(?:babci|w domu)/iu.test(text)) return null;
  const asOf = (deps.asOf ?? today)();
  const catalog = listOpportunities({ text, asOf, fullCatalog });
  const corpus = deps.selectCorpus("oferta");
  const version = corpus.manifest.corpusVersion;
  const candidates = catalog.candidates.flatMap(card => {
    const fragment = corpus.fragments.get(card.evidence.fragmentId);
    const doc = fragment && corpus.documents.get(fragment.documentId);
    return fragment && doc && isValidOn(corpus, fragment, asOf) ? [{ card, fragment, doc }] : [];
  });
  if (!candidates.length) return null;
  const query = candidates.map(({ card }) => card.title).join(". ");
  const trace = newTrace(query, null);
  const answer: AskAnswer = { status: "insufficient_evidence", publicQuery: query, corpusVersion: version,
    message: "Nie udało się potwierdzić podstawy proponowanych świadczeń.", claims: [], citations: [], opportunities: [] };
  progress?.("Sprawdzam podstawy proponowanych świadczeń…");
  const found = await deps.search.search({ query, expanded: null, corpusVersion: version, limit: candidates.length + TOP_K,
    lexical: candidates.map(({ fragment }) => ({ logicalId: fragment.logicalId, fragmentSha256: fragment.fragmentSha256, corpusVersion: version })),
    asOf, deadlineMs: deps.deadlineMs });
  trace.calls.qdrant = 1;
  trace.search = found.status;
  trace.vectorHits = found.hits;
  trace.rankings = found.rankings;
  trace.vectorIds = found.hits.map(hit => hit.logicalId);
  if (found.status === "error") return { answer: { ...answer, status: "unavailable" as const, message: UNAVAILABLE_MESSAGE }, trace };
  const matching = candidates.filter(({ fragment }) => found.hits.some(h =>
    h.corpusVersion === version && h.logicalId === fragment.logicalId && h.fragmentSha256 === fragment.fragmentSha256));
  if (!fullCatalog && matching.length > 1 && deps.publicTask && deps.deadlineMs && deps.deadlineMs - Date.now() >= 9_000) {
    const input: PublicTaskInput = { kind: "plan_public", aspect: /porówna/iu.test(text) ? "comparison" : "overview",
      candidates: matching.map(c => c.fragment.logicalId), missing: [] };
    const plan = await deps.publicTask(input, deps.deadlineMs);
    const { status, attemptId, backend, ms } = plan;
    trace.advisory = { kind: input.kind, status, attemptId, backend, ms };
    if (plan.output && "nextTool" in plan.output && plan.output.nextTool === "listOpportunities") {
      const preferred = plan.output.evidenceIds;
      const rank = (id: string) => preferred.includes(id) ? preferred.indexOf(id) : preferred.length;
      matching.sort((a, b) => rank(a.fragment.logicalId) - rank(b.fragment.logicalId));
    }
  }
  for (const { card, fragment, doc } of matching) {
    const id = "c" + (answer.citations.length + 1);
    answer.citations.push({ id, fragmentId: fragment.logicalId, sourceId: doc.id, hash: fragment.fragmentSha256,
      origin: "corpus", retrievedAt: doc.retrievedAt, title: doc.title, locator: fragment.locator, url: citationUrl(corpus, fragment),
      quote: fragment.sourceText, page: fragment.page, headingPath: fragment.headingPath, authority: doc.authority, corpusVersion: version });
    answer.claims.push({ text: card.title + ". " + card.reason, citationIds: [id] });
    answer.opportunities?.push({ id: card.id, title: card.title, citationIds: [id], missingFacts: card.missingFacts, exclusiveGroup: card.exclusiveGroup });
  }
  if (answer.claims.length) {
    answer.status = "answered";
    const group = answer.opportunities?.filter(c => c.exclusiveGroup);
    const alternatives = group?.some((c, i) => group.slice(i + 1).some(other => other.exclusiveGroup === c.exclusiveGroup));
    answer.message = [alternatives ? "Warianty programu Aktywny Rodzic można rozważyć jako alternatywy." : "",
      matching.some(c => c.card.id === candidates[0].card.id) ? catalog.nextQuestion : ""].filter(Boolean).join(" ");
  }
  trace.evidenceIds = answer.citations.map(c => c.fragmentId);
  return { answer, trace };
}

/** Resolve the public query locally before either provider receives it. */
export async function answerQuestion(
  deps: AnswerDeps, question: string, onProgress?: Progress,
  projected = projectQuestion(deps, question), contextRequestId: string | null = null,
): Promise<{ answer: AskAnswer; trace: AnswerTrace }> {
  const corpus = projected && deps.selectCorpus ? deps.selectCorpus(projected.corpus) : deps.corpus;
  const version = corpus.manifest.corpusVersion;
  const sanitized = projected?.question ?? "";
  const trace = newTrace(projected?.searchText ?? sanitized, contextRequestId);
  const plain = (status: AskAnswer["status"], message: string): AskAnswer => ({
    status,
    message,
    claims: [],
    citations: [],
    corpusVersion: version,
  });
  const asOf = (deps.asOf ?? today)();
  async function missingEvidence(fallback: AskAnswer) {
    if (!deps.discoverOfficial || !/program|świadczeni|dofinansowan|wsparci|dopłat/iu.test(question) ||
        /(?<!\d)(?:19|20)\d{2}(?!\d)|zeszł|dawn|kiedyś|ubiegł|przed lat|wtedy/iu.test(question)) return { answer: fallback, trace };
    onProgress?.("Sprawdzam katalog świadczeń na stronie ZUS…");
    const live = await deps.discoverOfficial(question, asOf, deps.deadlineMs);
    trace.officialFetches = live.fetches;
    const c = live.citation;
    if (!c) return { answer: live.unavailable ? plain("unavailable", UNAVAILABLE_MESSAGE) : fallback, trace };
    trace.evidenceIds = [c.fragmentId];
    return { answer: { ...plain("answered", "Podaję treść aktualnej instrukcji ZUS."), publicQuery: c.title, corpusVersion: c.corpusVersion,
      citations: [c], claims: [{ text: c.quote, citationIds: [c.id] }] }, trace };
  }

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

  if (projected?.uncovered) return missingEvidence(plain("insufficient_evidence", projected.uncovered));
  if (projected?.clarify) {
    trace.gate = "clarify";
    return { answer: plain("needs_clarification", projected.clarify), trace };
  }
  if (!projected) return missingEvidence(plain("insufficient_evidence",
    "Nie rozpoznałem tematu w bazie Zusika. O jakie świadczenie, dokument albo sytuację chcesz zapytać?"));
  trace.expanded = projected.corpus === "marta" && !projected.fragmentId ? expandQuery(sanitized) : null;
  trace.calls.qdrant += 1;
  onProgress?.("Szukam w źródłach urzędowych…");
  const exact = projected.fragmentId ? [projected.fragmentId] : reviewedSourceIds(projected);
  const lexical = projected.lexical ?? exact.flatMap(id => {
    const f = corpus.fragments.get(id);
    return f && isValidOn(corpus, f, asOf)
      ? [{ logicalId:id, fragmentSha256:f.fragmentSha256, corpusVersion:version }] : [];
  });
  const found = await deps.search.search({ query: trace.sanitized, expanded: trace.expanded, corpusVersion: version,
    limit: TOP_K, deadlineMs: deps.deadlineMs, ...(lexical.length ? { lexical, asOf } : {}) });
  trace.search = found.status;
  if (found.status !== "ok") return missingEvidence(plain("unavailable", UNAVAILABLE_MESSAGE));
  trace.vectorHits = found.hits;

  const evidence = assembleEvidence(corpus, found.hits, {
    locatorKeys: projected.locators ?? explicitLocatorKeys(question),
    excludeTopics: excludedTopics(question),
    asOf,
  });
  trace.rankings = found.rankings;
  trace.vectorIds = found.rankings ? found.hits.map(hit => hit.logicalId) : evidence.vectorIds;
  const relevant = relevantFragment(projected, corpus);
  const rawSubjectHit = evidence.vectorIds.some((id) => {
    const fragment = corpus.fragments.get(id);
    return fragment && relevant(fragment);
  });
  const confirmed = new Set([...(found.rankings?.lexical ?? []), ...evidence.vectorIds]);
  const missingReviewedUnit = found.rankings && exact.some(id => !confirmed.has(id));
  const fragments = rawSubjectHit && !missingReviewedUnit ? evidence.items.map((i) => i.fragment).filter(relevant) : [];
  trace.evidenceIds = fragments.map((f) => f.logicalId);
  if (fragments.length === 0) {
    const { answer } = validateAnswer(corpus, [], { status: "insufficient_evidence", message: "", claims: [] });
    return missingEvidence(answer);
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
  // An optional second opinion checks different public units only while the turn still has time.
  const target = projected.fragmentId;
  if (deps.publicTask && deps.deadlineMs && deps.deadlineMs - Date.now() >= 9_000 && target &&
      answer.status === "answered" && answer.citations.length && !answer.citations.some(c => c.fragmentId === target)) {
    const check = await deps.publicTask({ kind: "verify_claim", aspect: "overview", claimUnit: target,
      candidates: [...new Set(answer.citations.map(c => c.fragmentId))].slice(0, 5) }, deps.deadlineMs);
    const { status, attemptId, backend, ms } = check;
    trace.advisory = { kind: "verify_claim", status, attemptId, backend, ms };
    if (check.output && "verdict" in check.output && check.output.verdict !== "supported")
      return { answer: plain("insufficient_evidence", NO_BASIS_MESSAGE), trace };
  }
  const complete = withSourceException(projected, answer, fragments);
  if (complete) {
    trace.quoteReason = "statutory_conditions";
    return { answer: complete, trace };
  }
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

export async function answerPublicTurn(deps: AnswerDeps, text: string, history: AskTurn[], onProgress?: Progress, family?: FamilyChatScope) {
  const previous = history.findLast(turn => turn.status !== "conversation" && !sourceIntent(turn.question));
  const section = schoolRecipientIntent(text, previous) ? "schoolRecipient" : nurseryIntent(text, previous);
  if (section && deps.selectCorpus) {
    const { answer, result: resolved, query } = await runSectionTurn(section, deps.selectCorpus("oferta"),
      deps.search, (deps.asOf ?? today)(), deps.readOfficial ?? fetchOfficialEvidence, onProgress, deps.deadlineMs);
    const trace = newTrace(query, section !== "care" && !nurseryIntent(text) && !schoolRecipientIntent(text) ? previous?.requestId ?? null : null);
    trace.calls.qdrant = 1;
    trace.vectorHits = resolved.hits;
    trace.vectorIds = resolved.hits.map(hit => hit.logicalId);
    trace.search = resolved.searchError ? "error" : "ok";
    trace.officialFetches = resolved.fetches;
    trace.evidenceIds = answer.citations.map(c => c.fragmentId);
    if (section === "care" && answer.citations.length) {
      const card = listOpportunities({ text, asOf: (deps.asOf ?? today)() }).candidates
        .find(c => c.evidence.fragmentId === "zlobek-opieka");
      if (card) answer.opportunities = [{ id: card.id, title: card.title, citationIds: [answer.citations[0].id],
        missingFacts: card.missingFacts, exclusiveGroup: card.exclusiveGroup }];
    }
    return { answer, trace };
  } else {
    const opportunities = await discoverOpportunities(deps, text, onProgress);
    if (opportunities) return opportunities;
    else {
      const fromCorpus = deps.searchCorpus && corpusFollowUp(text, previous);
      const topic = familyTopic(family?.stopId);
      const context = fromCorpus && previous ? { plan: fromCorpus, requestId: previous.requestId }
        : resolveFollowUp(text, history, deps.suggestTopic, Boolean(topic));
      const usePageTopic = !previous && topic && (context?.needsTopic || scopeGate(text)?.kind === "clarify");
      const retrievalText = usePageTopic ? topic + ". " + text : text;
      const projected = !usePageTopic && context ? context.plan : projectQuestion(deps, retrievalText);
      const result = await answerQuestion(deps, retrievalText, onProgress, projected, context?.requestId);
      if (projected?.question && result.answer.status !== "unavailable")
        result.answer.publicQuery = projected.question;
      return result;
    }
  }
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

  async ask(sessionId: string, question: string, requestId: string, onProgress?: Progress, onVerified?: (turn: AskTurn) => void, scenario: CaseName = "marta", family?: FamilyChatScope): Promise<AskResult> {
    const demoCase = await this.deps.store.findOrCreate(conversationOwner(sessionId, scenario, family));
    const threadId = demoCase.threadId;
    const hash = questionHash(question);
    const deadline = Math.min(Date.now() + (this.deps.pendingWaitMs ?? 45_000), this.deps.deadlineMs ?? Infinity);

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
        result = await answerPublicTurn(this.deps, text, history, onProgress, family);
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
      const saved = await this.deps.turns.complete(threadId, requestId, token, result.answer);
      if (!saved) return { status: 409, turn: null, trace: result.trace };
      onVerified?.(saved);
      return { status: 200, turn: saved, trace: result.trace };
    } catch (error) {
      await this.deps.turns.release(threadId, requestId, token).catch(() => undefined);
      throw error;
    }
  }
}
