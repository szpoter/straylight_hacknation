import { randomUUID } from "node:crypto";
import { z } from "zod";
import { CHOICES } from "@/lib/zusik/constants";
import { NO_STORE, assertProviderConfig, currentSessionId, errorResponse, probeService } from "@/lib/zusik/server";
import { isSameOrigin } from "@/lib/zusik/session";

export const runtime = "nodejs";
export const maxDuration = 30;

// Unknown fields (e.g. a threadId sent by the browser) are stripped and ignored.
const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start") }),
  z.object({
    action: z.literal("resume"),
    choice: z.enum(CHOICES),
    expectedCheckpointId: z.string().min(1).max(200),
  }),
]);

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
    const body = parsed.data;
    if (body.action === "start") assertProviderConfig();
    const service = probeService();
    const result =
      body.action === "start"
        ? await service.start(sessionId)
        : await service.resume(sessionId, body.choice, body.expectedCheckpointId);
    console.log(
      JSON.stringify({
        event: `zusik_${body.action}`,
        opId,
        status: result.status,
        state: result.view.state,
        thread: result.view.threadId?.slice(0, 10),
        checkpoint: result.view.checkpointId?.slice(-8),
        providerCalls: result.providerCalls,
        ms: Date.now() - started,
      }),
    );
    return Response.json(
      { view: result.view, providerCalls: result.providerCalls },
      { status: result.status, headers: NO_STORE },
    );
  } catch (error) {
    return errorResponse(error, opId);
  }
}
