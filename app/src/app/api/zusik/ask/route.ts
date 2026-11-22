import { chatModelOptions } from "@/lib/zusik/chat-model";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { MAX_QUESTION_LENGTH } from "@/lib/rag/query";
import { NO_STORE, askService, currentSessionId, errorResponse } from "@/lib/zusik/server";
import type { AskTurn } from "@/lib/zusik/types";
import { ASK_STREAM } from "@/lib/zusik/ask-stream";
import { familyScopeSchema } from "@/lib/zusik/family-chat";
import { caseNames } from "@/lib/zusik/conversation";
import { isSameOrigin } from "@/lib/zusik/session";

export const runtime = "nodejs";
// Bielik needs up to ~40 s for a cited answer (see ASK_TIMEOUT_MS).
export const maxDuration = 60;

// Unknown fields (e.g. a threadId sent by the browser) are stripped and ignored.
const bodySchema = z.object({
  modelOptions: chatModelOptions.optional(),
  scenario: z.enum(caseNames).default("marta"),
  family: familyScopeSchema.optional(),
  question: z.string().trim().min(2).max(MAX_QUESTION_LENGTH),
  requestId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/),
});

/**
 * POST {question, requestId} → {turn}
 * 200 saved answer (also on retry), 202 the same request is still running,
 * 409 the requestId was used with different text, 503 {turn.status:"unavailable"} nothing saved.
 */
export async function POST(request: Request) {
  const started = Date.now();
  const opId = randomUUID().slice(0, 8);
  if (!isSameOrigin(request.headers)) {
    return Response.json({ error: "forbidden_origin" }, { status: 403, headers: NO_STORE });
  }
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (parsed.data.family && parsed.data.scenario !== "ogolna")) {
    return Response.json({ error: "invalid_request" }, { status: 400, headers: NO_STORE });
  }
  try {
    const sessionId = await currentSessionId();
    if (!sessionId) return Response.json({ error: "no_session" }, { status: 401, headers: NO_STORE });
    // Keep five seconds of the function budget for committing the turn and returning the stream.
    const service = askService(started + (maxDuration - 5) * 1000, parsed.data.modelOptions);
    const { question, requestId } = parsed.data;
    const run = async (progress?: (value: string) => void, verified?: (turn: AskTurn) => void) => {
      const result = await service.ask(sessionId, question, requestId, progress, verified, parsed.data.scenario, parsed.data.family);
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
          quoteReason: trace?.quoteReason,
          calls: trace?.calls ?? { qdrant: 0, sherlock: 0 },
          advisory: trace?.advisory,
          officialFetches: trace?.officialFetches ?? 0,
          ms: Date.now() - started,
        }),
      );
      if (result.status === 409) {
        return Response.json({ error: "request_id_conflict" }, { status: 409, headers: NO_STORE });
      }
      if (result.status === 202) {
        return Response.json({ pending: true, retry: true }, { status: 202, headers: NO_STORE });
      }
      // Only public source IDs and provider metadata belong in the browser's retrieval receipt.
      const retrieval = trace && (trace.search === "ok" || trace.officialFetches ||
        result.turn?.citations.some(c => c.origin === "official_live")) ? {
        query: trace.sanitized,
        contextRequestId: trace.contextRequestId,
        officialFetches: trace.officialFetches ?? 0,
        top: trace.vectorIds,
        rankings: trace.rankings,
        advisory: trace.advisory,
        evidence: trace.evidenceIds,
        backend: trace.backend ?? null,
        model: trace.modelId === "qwen-27b" ? null : trace.modelId ?? null,
        attemptId: trace.attemptId ?? null,
        quoteReason: trace.quoteReason,
      } : null;
      return Response.json({ turn: result.turn, retrieval }, { status: result.status, headers: NO_STORE });
    };
    if (!request.headers.get("accept")?.includes(ASK_STREAM)) return await run();

    const encoder = new TextEncoder();
    let disconnected = false;
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const write = (frame: object) => {
          if (!disconnected) controller.enqueue(encoder.encode(JSON.stringify(frame) + "\n"));
        };
        const status = (text: string) => write({ type: "activity", text });
        const verified = (turn: AskTurn) => {
          const blocks = [...turn.claims.map((claim) => claim.text), turn.message].filter(Boolean);
          blocks.forEach((text, i) => write({ type: "delta", text: (i ? "\n\n" : "") + text }));
        };
        try {
          status("Otwieram rozmowę…");
          const response = await run(status, verified);
          write({ type: "result", status: response.status, body: await response.json() });
        } catch (error) {
          const response = errorResponse(error, opId);
          write({ type: "result", status: response.status, body: await response.json() });
        } finally {
          if (!disconnected) controller.close();
        }
      },
      cancel() { disconnected = true; },
    });
    return new Response(stream, { headers: { "Content-Type": ASK_STREAM, "Cache-Control": "private, no-store, no-transform" } });
  } catch (error) {
    return errorResponse(error, opId);
  }
}
