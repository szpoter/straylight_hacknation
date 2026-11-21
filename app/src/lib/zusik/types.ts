import type { Choice } from "./constants";

export type QdrantStatus = "ok" | "no_hit" | "error";
export type SherlockStatus =
  | "ok"
  | "invalid_json"
  | "rate_limited"
  | "timeout"
  | "error"
  | "skipped";

export interface RetrievedFragment {
  sourceId: string;
  text: string;
  score: number;
}

export interface RetrievalResult {
  status: QdrantStatus;
  fragment: RetrievedFragment | null;
  ms: number;
}

export interface QuestionResult {
  status: SherlockStatus;
  question: string | null;
  model: string;
  ms: number;
}

/** External calls the graph needs. Injected, so tests can control them. */
export interface ProbeProviders {
  retrieve(query: string): Promise<RetrievalResult>;
  askQuestion(fragmentText: string): Promise<QuestionResult>;
}

export type CaseState = "empty" | "starting" | "awaiting_choice" | "completed";

/** Minimal view returned to the browser. Never contains secrets. */
export interface CaseView {
  state: CaseState;
  threadId: string | null;
  probeId: string | null;
  sourceId: string | null;
  model: string | null;
  question: string | null;
  choices: Choice[];
  choice: Choice | null;
  providers: { qdrant: QdrantStatus | null; sherlock: SherlockStatus | null };
  checkpointId: string | null;
  interruptId: string | null;
  /** Saved answers with citations, oldest first. An older case has an empty list. */
  turns: AskTurn[];
}

/**
 * Contract of POST /api/zusik/ask and view.turns (shared with the /zusik screen).
 * Legal content lives only in `claims`; `message` carries questions and notices.
 */
export type AskStatus = "conversation" | "answered" | "needs_clarification" | "insufficient_evidence" | "unavailable";

export interface AskClaim {
  text: string;
  /** Ids from `citations` of the same turn. Every published claim has at least one. */
  citationIds: string[];
}

export interface AskCitation {
  /** Unique within the turn, e.g. "c1". */
  id: string;
  /** Corpus unit, e.g. "rozp-2025-322-par22". */
  fragmentId: string;
  title: string;
  locator: string;
  /** PDF: opens the page via #page=N. HTML: the official page. */
  url: string;
  /** Verbatim excerpt of the official text (whitespace normalised). */
  quote: string;
  /** HTML sources: heading path the parent looks for on the page. */
  headingPath: string[];
  page: number | null;
  authority: "statute" | "regulation" | "ministry_guidance" | "zus_guidance";
  corpusVersion: string;
}

export interface AskAnswer {
  /** Reviewed public search used for resolving later follow-ups in the same thread. */
  publicQuery?: string;
  status: AskStatus;
  message: string;
  claims: AskClaim[];
  citations: AskCitation[];
  corpusVersion: string;
}

export interface AskTurn extends AskAnswer {
  requestId: string;
  question: string;
  createdAt: string;
  completedAt?: string;
}
