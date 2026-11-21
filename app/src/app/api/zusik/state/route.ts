import { randomUUID } from "node:crypto";
import { NO_STORE, currentSessionId, errorResponse, probeService } from "@/lib/zusik/server";
import { z } from "zod";
import { caseNames, conversationOwner } from "@/lib/zusik/conversation";
import { emptyView } from "@/lib/zusik/view";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Reads the case for the verified session only. Creates nothing. */
export async function GET(request: Request) {
  const opId = randomUUID().slice(0, 8);
  try {
    const sessionId = await currentSessionId();
    if (!sessionId) return Response.json({ view: emptyView() }, { headers: NO_STORE });
    const scope = z.enum(caseNames).safeParse(new URL(request.url).searchParams.get("scenario") ?? "marta");
    if (!scope.success) return Response.json({ error: "invalid_scenario" }, { status: 400, headers: NO_STORE });
    const view = await probeService().getView(conversationOwner(sessionId, scope.data));
    console.log(JSON.stringify({ event: "zusik_state", opId, state: view.state, thread: view.threadId?.slice(0, 10) }));
    return Response.json({ view }, { headers: NO_STORE });
  } catch (error) {
    return errorResponse(error, opId);
  }
}
