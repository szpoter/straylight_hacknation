import type { Message, MessageInput as WireMessageInput } from "@/lib/zusik/v1/conversation";
import type { CaseDocument, CaseFile, DocInput, EvidenceFact, Patch, Profile, Proposal } from "@/lib/zusik/memory/contract";
import { etag } from "@/lib/zusik/v1/etag";

export type MessageInput = WireMessageInput;

export type Citation = Message["citations"][number];
export type CaseMessage = Omit<Message, "state"> & { state: "completed" | "processing" | "failed"; errorCode?: string };
export type AssessmentInput = { subjectId: string; benefit: string; asOf: string; caseRevision: number; profileRevision: number };
type DecisionTrace = Pick<import("@/lib/rules/case-assessment").DecisionResult, "segments" | "titleRef" | "payerRef" | "payer" | "paymentStatus">;
export type Decision = DecisionTrace & { status: "eligible" | "ineligible" | "needs_information" | "needs_review" | "unsupported"; subjectId: string; benefit: string;
  from?: string; to?: string; reasonCode: string; amountStatus: "calculated" | "needs_information" | "needs_review" | "not_applicable" | "unsupported";
  grossAmountGrosze?: number; amountPeriod?: "total" | "monthly" | "daily"; citations: Citation[]; needed?: { field: string; request: string }[] };
export type Assessment = { id: string; stale: boolean; ruleVersion: string; input: AssessmentInput; decisions: Decision[] };

export class ApiError extends Error {
  constructor(readonly status: number, readonly code?: string) { super("HTTP " + status); }
}
async function request<T>(path: string, method = "GET", body?: unknown, key?: string, etag?: string) {
  const headers = new Headers();
  if (body !== undefined) headers.set("Content-Type", "application/json");
  if (key) headers.set("Idempotency-Key", key);
  if (etag) headers.set("If-Match", etag);
  const res = await fetch("/api/v1/" + path, { method, headers, body: JSON.stringify(body), credentials: "same-origin", cache: "no-store", signal: AbortSignal.timeout(70000) });
  if (!res.ok) {
    const problem = await res.json().catch(() => null);
    throw new ApiError(res.status, typeof problem?.code === "string" ? problem.code : undefined);
  }
  return { data: (res.status === 204 ? undefined : await res.json()) as T };
}
function versioned<T extends Profile | CaseFile>({data}: {data:T}) {
  // A CDN may weaken the representation ETag during compression.
  return {data, etag:etag(data.id,data.revision)};
}
async function list<T>(path: string) {
  const items: T[] = [];
  let cursor: string | null = null;
  do {
    const page: {data: {items: T[]; nextCursor: string | null}} = await request(path + (cursor ? "?cursor=" + encodeURIComponent(cursor) : ""));
    items.push(...page.data.items);
    cursor = page.data.nextCursor;
  } while (cursor);
  return items;
}
const c = (id: string) => "cases/" + encodeURIComponent(id);
const p = (id: string) => "profiles/" + encodeURIComponent(id);

export const caseApi = {
  open: () => request<{ state: "created" | "existing" }>("sessions", "POST"),
  cases: () => list<CaseFile>("cases"),
  create: async (key: string) => {
    const profile = await request<Profile>("profiles", "POST", { mode: "case_import" }, key);
    return (await request<CaseFile>("cases", "POST", { profileId: profile.data.id }, key)).data;
  },
  file: (id: string) => request<CaseFile>(c(id)).then(versioned),
  profile: (id: string) => request<Profile>(p(id)).then(versioned),
  facts: (id: string) => list<EvidenceFact>(p(id) + "/facts"),
  proposals: (id: string) => list<Proposal>(p(id) + "/proposals"),
  patch: (id: string, patch: Patch, etag: string, key: string) => request<Profile>(p(id), "PATCH", patch, key, etag).then(versioned),
  documents: (id: string) => list<CaseDocument>(c(id) + "/documents"),
  register: (id: string, metadata: DocInput, key: string) => request<CaseDocument>(c(id) + "/documents", "POST", metadata, key),
  messages: (id: string) => list<CaseMessage>(c(id) + "/messages"),
  message: (id: string, input: MessageInput, key: string) => request<CaseMessage>(c(id) + "/messages", "POST", input, key),
  erase: (id: string, etag: string) => request<void>(c(id), "DELETE", undefined, undefined, etag),
  assess: (id: string, input: AssessmentInput, key: string) => request<Assessment>(c(id) + "/assessments", "POST", input, key),
  assessment: (id: string, aid: string) => request<Assessment>(c(id) + "/assessments/" + encodeURIComponent(aid)),
};

export async function loadCase(id: string) {
  const { data: file, etag: caseEtag } = await caseApi.file(id);
  const [profile, facts, documents, proposals, messages] = await Promise.all([
    caseApi.profile(file.profileId), caseApi.facts(file.profileId), caseApi.documents(id), caseApi.proposals(file.profileId), caseApi.messages(id),
  ]);
  const ids = new Set(messages.flatMap(m => [
    ...(m.input.intent === "explain_result" ? [m.input.assessmentId] : []),
    ...m.citations.filter(citation => citation.kind === "assessment").map(citation => citation.ref),
  ]));
  const assessments = await Promise.all(Array.from(ids, async aid => (await caseApi.assessment(id, aid)).data));
  return { file, caseEtag, profile: profile.data, etag: profile.etag, facts, documents, proposals, messages, assessments };
}
export type CaseView = Awaited<ReturnType<typeof loadCase>>;
