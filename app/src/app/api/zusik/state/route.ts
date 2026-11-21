import { randomUUID } from "node:crypto";
import { NO_STORE, currentSessionId, errorResponse, probeService } from "@/lib/zusik/server";
import { emptyView } from "@/lib/zusik/view";

export const runtime = "nodejs";
export const maxDuration = 30;

/** Reads the case for the verified session only. Creates nothing. */
export async function GET() {
  const opId = randomUUID().slice(0, 8);
  try {
    const sessionId = await currentSessionId();
    if (!sessionId) return Response.json({ view: emptyView() }, { headers: NO_STORE });
    const view = await probeService().getView(sessionId);
    console.log(JSON.stringify({ event: "zusik_state", opId, state: view.state, thread: view.threadId?.slice(0, 10) }));
    return Response.json({ view }, { headers: NO_STORE });
  } catch (error) {
    return errorResponse(error, opId);
  }
}
