import { createHash, createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Admin sign-in without registration: the operator assigns one login and a scrypt password hash
 * through environment variables. The session is a signed, expiring token in an HttpOnly cookie.
 */

export const ADMIN_COOKIE = "zusik_admin";
export const ADMIN_SESSION_SECONDS = 8 * 60 * 60;

const SCRYPT = { N: 16384, r: 8, p: 1, keyLength: 32 } as const;

/**
 * Format: scrypt:<N>:<salt base64url>:<hash base64url>. Colons, not dollar signs: Next.js expands
 * $NAME inside .env files, which would corrupt a $-separated hash.
 */
export function hashPassword(password: string, salt: Buffer = randomBytes(16)): string {
  const hash = scryptSync(password, salt, SCRYPT.keyLength, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt:${SCRYPT.N}:${salt.toString("base64url")}:${hash.toString("base64url")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;
  const n = Number(parts[1]);
  if (!Number.isInteger(n) || n < 2 || (n & (n - 1)) !== 0) return false;
  const salt = Buffer.from(parts[2], "base64url");
  const expected = Buffer.from(parts[3], "base64url");
  if (salt.length === 0 || expected.length === 0) return false;
  const actual = scryptSync(password, salt, expected.length, { N: n, r: SCRYPT.r, p: SCRYPT.p, maxmem: 256 * n * SCRYPT.r });
  return timingSafeEqual(actual, expected);
}

/** Constant-time string comparison that does not leak the length of the expected value. */
function sameText(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export interface AdminCredentials {
  login: string;
  passwordHash: string;
}

export function checkCredentials(login: string, password: string, expected: AdminCredentials): boolean {
  // Always run the password check, so a wrong login takes as long as a wrong password.
  const passwordOk = verifyPassword(password, expected.passwordHash);
  return sameText(login.trim(), expected.login) && passwordOk;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(`zusik-admin:${payload}`).digest("base64url");
}

/** Token: <login base64url>.<expiry unix seconds>.<signature>. */
export function encodeAdminSession(login: string, expiresAt: number, secret: string): string {
  const payload = `${Buffer.from(login).toString("base64url")}.${expiresAt}`;
  return `${payload}.${sign(payload, secret)}`;
}

/** Returns the login, or null for a missing, tampered or expired token. */
export function decodeAdminSession(raw: string | undefined, secret: string, now: number): string | null {
  if (!raw) return null;
  const parts = raw.split(".");
  if (parts.length !== 3) return null;
  const [loginPart, expiryPart, signature] = parts;
  const payload = `${loginPart}.${expiryPart}`;
  const given = Buffer.from(signature);
  const expected = Buffer.from(sign(payload, secret));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  const expiresAt = Number(expiryPart);
  if (!Number.isInteger(expiresAt) || expiresAt <= now) return null;
  return Buffer.from(loginPart, "base64url").toString();
}
