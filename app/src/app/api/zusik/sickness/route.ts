import { randomUUID } from "node:crypto";
import { sicknessService } from "@/lib/sickness/server";
import { InvalidPacket, mutationSchema } from "@/lib/sickness/service";
import { currentSessionId, errorResponse, NO_STORE } from "@/lib/zusik/server";
import { isSameOrigin } from "@/lib/zusik/session";

export const runtime = "nodejs";
export const maxDuration = 30;

function json(data: unknown, status = 200) {
  return Response.json(data, { headers: NO_STORE, status });
}
export async function GET() {
  try {
    const session = await currentSessionId();
    return json({ view: session ? await sicknessService().get(session) : null });
  } catch (e) {
    return errorResponse(e, randomUUID().slice(0, 8));
  }
}
export async function POST(request: Request) {
  if (!isSameOrigin(request.headers)) return json({ error: "origin" }, 403);
  try {
    const session = await currentSessionId();
    if (!session) return json({ error: "session_required" }, 401);
    if (Number(request.headers.get("content-length")) > 24_000) return json({ error: "too_large" }, 413);
    const raw = await request.text();
    if (raw.length > 16_000) return json({ error: "too_large" }, 413);
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return json({ error: "invalid_json" }, 400);
    }
    const parsed = mutationSchema.safeParse(body);
    if (!parsed.success) return json({ error: "invalid_request" }, 400);
    const { status, view } = await sicknessService().change(session, parsed.data);
    return json({ view }, status);
  } catch (e) {
    if (e instanceof InvalidPacket) return json({ error: "invalid_demo_packet" }, 422);
    return errorResponse(e, randomUUID().slice(0, 8));
  }
}
