import { randomUUID } from "node:crypto";
import { z } from "zod";
import { MAX_QUESTION_LENGTH } from "@/lib/rag/query";
import { NO_STORE, askService, assertAskConfig, currentSessionId, errorResponse } from "@/lib/zusik/server";
import { isSameOrigin } from "@/lib/zusik/session";

export const runtime = "nodejs";
// Bielik needs up to ~40 s for a cited answer (see ASK_TIMEOUT_MS).
export const maxDuration = 60;

// Unknown fields (e.g. a threadId sent by the browser) are stripped and ignored.
const bodySchema = z.object({
  question: z.string().trim().min(2).max(MAX_QUESTION_LENGTH),
  requestId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
});

/**
 * POST {question, requestId} → {turn}
 * 200 saved answer (also on retry), 202 the same request is still running,
 * 409 the requestId was used with different text, 503 {turn.status:"unavailable"} nothing saved.
 */
export async function POST(request: Request) {
  const opId = randomUUID().slice(0, 8);
  if (!isSameOrigin(request.headers)) {
    return Response.json({ error: "forbidden_origin" }, { status: 403, headers: NO_STORE });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "invalid_request" }, { status: 400, headers: NO_STORE });
  }
  const started = Date.now();
  try {
    const sessionId = await currentSessionId();
    if (!sessionId) return Response.json({ error: "no_session" }, { status: 401, headers: NO_STORE });
    assertAskConfig();
    const result = await askService().ask(sessionId, parsed.data.question, parsed.data.requestId);
    const trace = result.trace;
    // Ids, statuses and timings only: never the question or the answer text.
    console.log(
      JSON.stringify({
        event: "zusik_ask",
        opId,
        status: result.status,
        answer: result.turn?.status,
        gate: trace?.gate,
        search: trace?.search,
        model: trace?.model,
        top: trace?.vectorIds,
        evidence: trace?.evidenceIds,
        removedClaims: trace?.report?.removedClaims,
        citations: result.turn?.citations.map((c) => c.fragmentId),
        calls: trace?.calls ?? { qdrant: 0, sherlock: 0 },
        ms: Date.now() - started,
      }),
    );
    if (result.status === 409) {
      return Response.json({ error: "request_id_conflict" }, { status: 409, headers: NO_STORE });
    }
    if (result.status === 202) {
      return Response.json({ pending: true, retry: true }, { status: 202, headers: NO_STORE });
    }
    return Response.json({ turn: result.turn }, { status: result.status, headers: NO_STORE });
  } catch (error) {
    return errorResponse(error, opId);
  }
}
