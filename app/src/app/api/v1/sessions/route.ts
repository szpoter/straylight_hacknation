import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/zusik/constants";
import { signingSecret } from "@/lib/zusik/server";
import { decodeSession, encodeSession, newSessionId, sessionCookieOptions } from "@/lib/zusik/session";
import { json, problem, requireOrigin } from "@/lib/zusik/v1/http";

export async function POST(request: Request) {
  try {
    requireOrigin(request);
    const store = await cookies();
    const secret = signingSecret();
    if (decodeSession(store.get(SESSION_COOKIE)?.value, secret)) return json({ state: "existing" });
    store.set(SESSION_COOKIE, encodeSession(newSessionId(), secret), sessionCookieOptions());
    return json({ state: "created" });
  } catch (error) { return problem(error); }
}
