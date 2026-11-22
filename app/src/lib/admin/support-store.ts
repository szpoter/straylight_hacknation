import { createHmac, timingSafeEqual } from "node:crypto";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import { cookies } from "next/headers";
import { SUPPORT_ORGANIZATIONS, type SupportOrganization } from "../support/organizations";
import { EMPTY_SUPPORT_EDITS, activeOrganizations, parseSupportEdits, type SupportEditsState } from "./support-edits";

/**
 * Support organisation changes of one demo session, in a signed HttpOnly session cookie, like the
 * rule versions (rule-store.ts): the jury session is isolated and the next one starts from the list
 * in the code. A production deployment would keep the same SupportEditsState in the database.
 */
export const SUPPORT_COOKIE = "zusik_support";

function secret(): string | null {
  return process.env.SESSION_SIGNING_SECRET?.trim() || null;
}

const sign = (payload: string, key: string) => createHmac("sha256", key).update(`zusik-support:${payload}`).digest("base64url");

export function encodeSupportEdits(state: SupportEditsState, key: string): string {
  const payload = deflateRawSync(Buffer.from(JSON.stringify(state))).toString("base64url");
  return `${payload}.${sign(payload, key)}`;
}

/** Any tampered, foreign or malformed value yields the initial state. */
export function decodeSupportEdits(raw: string | undefined, key: string): SupportEditsState {
  if (!raw) return EMPTY_SUPPORT_EDITS;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return EMPTY_SUPPORT_EDITS;
  const payload = raw.slice(0, dot);
  const given = Buffer.from(raw.slice(dot + 1));
  const expected = Buffer.from(sign(payload, key));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return EMPTY_SUPPORT_EDITS;
  try {
    return parseSupportEdits(JSON.parse(inflateRawSync(Buffer.from(payload, "base64url")).toString()));
  } catch {
    return EMPTY_SUPPORT_EDITS;
  }
}

export async function readSupportEdits(): Promise<SupportEditsState> {
  const key = secret();
  if (!key) return EMPTY_SUPPORT_EDITS;
  return decodeSupportEdits((await cookies()).get(SUPPORT_COOKIE)?.value, key);
}

/** Organisations for the parent views of this browser: the code list with this session's changes. */
export async function supportOrganizations(): Promise<SupportOrganization[]> {
  return activeOrganizations(SUPPORT_ORGANIZATIONS, await readSupportEdits());
}

export async function writeSupportEdits(state: SupportEditsState): Promise<void> {
  const key = secret();
  if (!key) throw new Error("SESSION_SIGNING_SECRET missing");
  (await cookies()).set(SUPPORT_COOKIE, encodeSupportEdits(state, key), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // No maxAge: a session cookie, gone when the browser closes.
  });
}

export async function clearSupportEdits(): Promise<void> {
  (await cookies()).delete(SUPPORT_COOKIE);
}
