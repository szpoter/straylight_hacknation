import { readMarta } from "@/lib/marta/server";
import { commandSchema } from "@/lib/marta/types";
import { NO_STORE, currentSessionId, errorResponse } from "@/lib/zusik/server";
import { isSameOrigin } from "@/lib/zusik/session";

export async function GET() {
  try {
    const session = await currentSessionId();
    return Response.json({ view: session ? (await readMarta(session)).view : null }, { headers: NO_STORE });
  } catch (e) { return errorResponse(e, "marta-read"); }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request.headers)) return Response.json({ error: "origin" }, { status: 403 });
  try {
    const session = await currentSessionId();
    if (!session) return Response.json({ error: "session_required" }, { status: 401 });
    const data = commandSchema.safeParse(await request.json().catch(() => null));
    if (!data.success) return Response.json({ error: "invalid_input" }, { status: 400 });
    const { status, ...body } = await readMarta(session, data.data);
    return Response.json(body, { status, headers: NO_STORE });
  } catch (e) { return errorResponse(e, "marta-save"); }
}
