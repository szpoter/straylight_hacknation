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
    if (decodeSession(store.get(SESSION_COOKIE)?.value, secret)) {
      return Response.json({ session: "existing" }, { headers: NO_STORE });
    }
    store.set(SESSION_COOKIE, encodeSession(newSessionId(), secret), sessionCookieOptions());
    return Response.json({ session: "created" }, { headers: NO_STORE });
  } catch (error) {
    return errorResponse(error, "session");
  }
}
