import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Demo session = random id + HMAC-SHA256 signature, stored in an HttpOnly
 * cookie. The signature is verified on every request; a tampered or
 * re-signed value yields `null` (no access).
 */
export function newSessionId(): string {
  return randomBytes(24).toString("base64url");
}

function sign(sessionId: string, secret: string): string {
  return createHmac("sha256", secret).update(`zusik-session:${sessionId}`).digest("base64url");
}

export function encodeSession(sessionId: string, secret: string): string {
  return `${sessionId}.${sign(sessionId, secret)}`;
}

export function decodeSession(raw: string | undefined, secret: string): string | null {
  if (!raw) return null;
  const dot = raw.indexOf(".");
  if (dot <= 0 || dot !== raw.lastIndexOf(".")) return null;
  const sessionId = raw.slice(0, dot);
  const given = Buffer.from(raw.slice(dot + 1));
  const expected = Buffer.from(sign(sessionId, secret));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return sessionId;
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    // Preview/production run on HTTPS. Browsers also accept Secure on http://localhost.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

/** Write requests are accepted only from our own origin. */
export function isSameOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  if (!origin) return false;
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
