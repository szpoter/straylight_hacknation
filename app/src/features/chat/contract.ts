import { z } from "zod";
import type { CaseView } from "@/lib/zusik/types";

/**
 * Client side of the proposed knowledge-base contract from PLAN-ETAP-1-KROK-2.md, section 4:
 * POST /api/zusik/ask { question, requestId } → status, message, claims[{text,citationIds}],
 * citations[{id,title,locator,url,quote,corpusVersion}]; GET /api/zusik/state → view.turns.
 *
 * The backend author owns this contract (AskTurn in lib/zusik/types.ts, POST → { turn }). Parsing is
 * tolerant: the answer may arrive as `{ turn }`, as `{ view: { turns } }` or as the bare answer object.
 * Anything that does not validate is treated as "unavailable", never rendered half-way.
 */

export const ANSWER_STATUSES = ["conversation", "answered", "needs_clarification", "insufficient_evidence", "unavailable"] as const;
export type AnswerStatus = (typeof ANSWER_STATUSES)[number];

export const citationSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  locator: z.string().default(""),
  url: z.string().default(""),
  quote: z.string().default(""),
  /** PDF page number (the URL also carries it as #page=N). */
  page: z.number().int().positive().nullish(),
  /** HTML sources: the heading path the parent looks for on the page. */
  headingPath: z.array(z.string()).optional(),
  corpusVersion: z.string().optional(),
});
export type Citation = z.infer<typeof citationSchema>;

export const claimSchema = z.object({
  text: z.string().min(1),
  citationIds: z.array(z.string()).default([]),
});
export type Claim = z.infer<typeof claimSchema>;

export const answerSchema = z.object({
  status: z.enum(ANSWER_STATUSES),
  message: z.string().nullish(),
  claims: z.array(claimSchema).default([]),
  citations: z.array(citationSchema).default([]),
});
export type Answer = z.infer<typeof answerSchema>;

/** One question and its saved answer, as returned in view.turns. */
export const turnSchema = answerSchema.extend({
  requestId: z.string().min(1),
  question: z.string().min(1),
  createdAt: z.string().optional(),
});
export type Turn = z.infer<typeof turnSchema>;

/** CaseView from step 1 plus the optional turns added in step 2. */
export type ClientView = CaseView & { turns?: Turn[] };

/** Saved turns of the active case. Old cases and the step-1 backend have none. */
export function turnsFromView(view: unknown): Turn[] {
  const raw = (view as { turns?: unknown } | null)?.turns;
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const parsed = turnSchema.safeParse(item);
    return parsed.success ? [parsed.data] : [];
  });
}

/** Reads the /ask response in any of the shapes the contract proposal allows. */
export function answerFromAskBody(body: unknown, requestId: string): Answer | null {
  if (!body || typeof body !== "object") return null;
  const record = body as { turn?: unknown; view?: unknown };
  if (record.turn) {
    const parsed = answerSchema.safeParse(record.turn);
    if (parsed.success) return parsed.data;
  }
  if (record.view) {
    const match = turnsFromView(record.view).find((turn) => turn.requestId === requestId);
    if (match) return match;
  }
  const bare = answerSchema.safeParse(body);
  return bare.success ? bare.data : null;
}

export type GroundedClaim = Claim & { numbers: number[] };

/**
 * Keeps only citations the answer actually points to, numbered in first-use order, and drops claims
 * whose citations are missing. A claim without a verified source is not shown as a legal statement.
 */
export function groundedClaims(answer: Answer): { claims: GroundedClaim[]; citations: Citation[] } {
  const byId = new Map(answer.citations.map((citation) => [citation.id, citation]));
  const order: Citation[] = [];
  const claims = answer.claims.flatMap((claim) => {
    const ids = claim.citationIds.filter((id) => byId.has(id));
    if (ids.length === 0) return [];
    const numbers = ids.map((id) => {
      const known = order.findIndex((citation) => citation.id === id);
      return known === -1 ? order.push(byId.get(id) as Citation) : known + 1;
    });
    return [{ ...claim, citationIds: ids, numbers }];
  });
  return { claims, citations: order };
}

/** "…/text.pdf#page=66" → 66. Used for the link label; the URL itself comes from the backend. */
export function pdfPage(url: string): number | null {
  const match = url.match(/#page=(\d+)/);
  return match ? Number(match[1]) : null;
}
