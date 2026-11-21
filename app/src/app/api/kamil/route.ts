import { randomUUID } from "node:crypto";
import { requestSchema } from "@/lib/kamil/contract";
import { newCase, toView } from "@/lib/kamil/case";
import { kamilService } from "@/lib/kamil/server";
import { NO_STORE, currentSessionId, errorResponse } from "@/lib/zusik/server";
import { isSameOrigin } from "@/lib/zusik/session";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Reads Kamil's case for the verified session only. Creates nothing. */
export async function GET() {
  const opId = randomUUID().slice(0, 8);
  try {
    const sessionId = await currentSessionId();
    if (!sessionId) {
      return Response.json({ view: toView(newCase(), new Date().toISOString().slice(0, 10)) }, { headers: NO_STORE });
    }
    const view = await kamilService().getView(sessionId);
    return Response.json({ view }, { headers: NO_STORE });
  } catch (error) {
    return errorResponse(error, opId);
  }
}

/**
 * One command per request. The body never carries a thread id or a document: only field values,
 * their positions and Kamil's messages. Unknown fields are stripped by Zod.
 */
export async function POST(request: Request) {
  const opId = randomUUID().slice(0, 8);
  if (!isSameOrigin(request.headers)) {
    return Response.json({ error: "forbidden_origin" }, { status: 403, headers: NO_STORE });
  }
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "invalid_request" }, { status: 400, headers: NO_STORE });
  const started = Date.now();
  try {
    const sessionId = await currentSessionId();
    if (!sessionId) return Response.json({ error: "no_session" }, { status: 401, headers: NO_STORE });
    const { expectedVersion, command } = parsed.data;
    const result = await kamilService().apply(sessionId, expectedVersion, command);
    // Logs: ids, status and timing only, never case content.
    console.log(
      JSON.stringify({
        event: "kamil_command",
        opId,
        type: command.type,
        status: result.status,
        version: result.view.version,
        ms: Date.now() - started,
      }),
    );
    return Response.json({ view: result.view, error: result.error ?? null }, { status: result.status, headers: NO_STORE });
  } catch (error) {
    return errorResponse(error, opId);
  }
}
