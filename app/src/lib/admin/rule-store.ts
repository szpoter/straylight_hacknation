import { cookies } from "next/headers";
import type { RuleSchedule } from "../rules/parameters";
import { EMPTY_STATE, decodeState, encodeState, scheduleOf, type RuleVersion, type RuleVersionsState } from "./rule-versions";

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
  await clearDraftPreview();
}

/* ---------- "Pokaż oczami rodzica" for an unpublished draft (SPEC-PANEL §7 step 2) ---------- */

export const PREVIEW_COOKIE = "zusik_rules_preview";
const PREVIEW_SECONDS = 30 * 60;

/** The draft shown to the parent views of this browser, or null. Expires after 30 minutes. */
export async function readDraftPreview(): Promise<RuleVersion | null> {
  const key = secret();
  if (!key) return null;
  const state = decodeState((await cookies()).get(PREVIEW_COOKIE)?.value, key);
  return state.versions[0] ?? null;
}

export async function writeDraftPreview(draft: RuleVersion): Promise<void> {
  const key = secret();
  if (!key) throw new Error("SESSION_SIGNING_SECRET missing");
  (await cookies()).set(PREVIEW_COOKIE, encodeState({ revision: 0, versions: [draft] }, key), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PREVIEW_SECONDS,
  });
}

export async function clearDraftPreview(): Promise<void> {
  (await cookies()).delete(PREVIEW_COOKIE);
}

/** Schedule the parent views apply: published values, plus the previewed draft if there is one. */
export async function effectiveSchedule(): Promise<{ schedule: RuleSchedule; preview: RuleVersion | null }> {
  const schedule = await publishedSchedule();
  const preview = await readDraftPreview();
  if (!preview) return { schedule, preview: null };
  const others = (schedule[preview.parameter] ?? []).filter((v) => v.validFrom !== preview.validFrom);
  return {
    schedule: { ...schedule, [preview.parameter]: [...others, { value: preview.value, validFrom: preview.validFrom }] },
    preview,
  };
}
