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
}
