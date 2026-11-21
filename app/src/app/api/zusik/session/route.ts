import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/zusik/constants";
import { NO_STORE, errorResponse, signingSecret } from "@/lib/zusik/server";
import { decodeSession, encodeSession, isSameOrigin, newSessionId, sessionCookieOptions } from "@/lib/zusik/session";

/** Idempotent: keeps a valid session, issues a new signed one otherwise. */
export async function POST(request: Request) {
  if (!isSameOrigin(request.headers)) {
    return Response.json({ error: "forbidden_origin" }, { status: 403, headers: NO_STORE });
  }
  try {
    const secret = signingSecret();
    const store = await cookies();
    const existing = decodeSession(store.get(SESSION_COOKIE)?.value, secret);
    const session = existing ?? newSessionId();
    if (!existing) store.set(SESSION_COOKIE, encodeSession(session, secret), sessionCookieOptions());
    const documentCache = createHash("sha256").update("kamil-documents:" + session).digest("hex");
    return Response.json({ session: existing ? "existing" : "created", documentCache }, { headers: NO_STORE });
  } catch (error) {
    return errorResponse(error, "session");
  }
}
