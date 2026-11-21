import { cookies } from "next/headers";
import type { RuleSchedule } from "../rules/parameters";
import { EMPTY_STATE, decodeState, encodeState, scheduleOf, type RuleVersionsState } from "./rule-versions";

/**
 * Rule versions of one demo session (SPEC-PANEL §10: the jury session is isolated and the next one
 * starts from the initial values). Stored in a signed HttpOnly session cookie readable by the whole
 * app, so the parent views apply what the administrator published in the same browser.
 * A production deployment would keep the same RuleVersionsState in the database instead.
 */
export const RULES_COOKIE = "zusik_rules";

function secret(): string | null {
  return process.env.SESSION_SIGNING_SECRET?.trim() || null;
}

export async function readRuleState(): Promise<RuleVersionsState> {
  const key = secret();
  if (!key) return EMPTY_STATE;
  return decodeState((await cookies()).get(RULES_COOKIE)?.value, key);
}

/** Values published in this demo session, for the rules of the parent application. */
export async function publishedSchedule(): Promise<RuleSchedule> {
  return scheduleOf(await readRuleState());
}

export async function writeRuleState(state: RuleVersionsState): Promise<void> {
  const key = secret();
  if (!key) throw new Error("SESSION_SIGNING_SECRET missing");
  (await cookies()).set(RULES_COOKIE, encodeState(state, key), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // No maxAge: a session cookie, gone when the browser closes.
  });
}

export async function clearRuleState(): Promise<void> {
  (await cookies()).delete(RULES_COOKIE);
}
