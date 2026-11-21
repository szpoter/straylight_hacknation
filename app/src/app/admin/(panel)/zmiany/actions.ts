"use server";

import { randomBytes } from "node:crypto";
import type { LimitActionResult, LimitForm } from "@/features/admin/limit-change-view";
import { checkPaternityLimit, checksPassed, checksSummary } from "@/lib/admin/change-checks";
import {
  discardDraft,
  draftFor,
  draftProblems,
  publishDraft,
  saveDraft,
  scheduleOf,
  withdrawScheduled,
} from "@/lib/admin/rule-versions";
import { clearDraftPreview, clearRuleState, readRuleState, writeRuleState } from "@/lib/admin/rule-store";
import { requireAdmin } from "@/lib/admin/server";
import { TOTAL_DAYS } from "@/lib/rules/paternity";

/**
 * Changing the paternity total from the admin panel (ZUS task p. 13, SPEC-PANEL §7).
 * Every action checks the admin session on the server and re-reads the stored state;
 * nothing the browser sends is trusted beyond the form values.
 */

const PARAM = "paternity.totalDays" as const;
const nowIso = () => new Date().toISOString();

function toInput(form: LimitForm) {
  return {
    parameter: PARAM,
    value: Math.round(Number(form.weeks) * 7),
    validFrom: String(form.validFrom ?? ""),
    reason: String(form.reason ?? ""),
    source: String(form.source ?? ""),
  };
}

export async function saveLimitDraft(form: LimitForm): Promise<LimitActionResult> {
  const author = await requireAdmin();
  const state = await readRuleState();
  const outcome = saveDraft(state, toInput(form), {
    id: randomBytes(9).toString("base64url"),
    now: nowIso(),
    author,
    fallback: TOTAL_DAYS,
  });
  if (!outcome.ok) return { ok: false, error: outcome.error, revision: state.revision };
  await writeRuleState(outcome.state);
  return { ok: true, revision: outcome.state.revision, draftId: outcome.version.id };
}

export async function checkLimitChange(form: LimitForm): Promise<LimitActionResult> {
  await requireAdmin();
  const state = await readRuleState();
  const input = toInput(form);
  const problems = draftProblems(input, nowIso().slice(0, 10));
  if (problems.length) return { ok: false, error: problems.join(" "), revision: state.revision };
  const checks = checkPaternityLimit(scheduleOf(state), input);
  return { ok: true, revision: state.revision, checks, summary: checksSummary(checks), passed: checksPassed(checks) };
}

/** Publishes the saved draft; the checks run again here, on the stored draft. */
export async function publishLimit(request: { draftId: string; expectedRevision: number }): Promise<LimitActionResult> {
  await requireAdmin();
  const state = await readRuleState();
  const draft = state.versions.find((v) => v.id === request.draftId);
  if (draft?.status === "published") return { ok: true, revision: state.revision, draftId: null };
  if (!draft || draft.status !== "draft") return { ok: false, error: "Najpierw zapisz szkic.", revision: state.revision };
  const checks = checkPaternityLimit(scheduleOf(state), draft);
  if (!checksPassed(checks)) {
    return { ok: false, error: "Sprawdzenie wykazało niezgodność. Popraw szkic.", revision: state.revision, checks, passed: false };
  }
  const outcome = publishDraft(
    state,
    { draftId: draft.id, expectedRevision: request.expectedRevision, checks: checksSummary(checks) },
    nowIso(),
  );
  if (!outcome.ok) return { ok: false, error: outcome.error, revision: state.revision, checks };
  await writeRuleState(outcome.state);
  await clearDraftPreview();
  return { ok: true, revision: outcome.state.revision, draftId: null, checks, summary: checksSummary(checks), passed: true };
}

export async function discardLimitDraft(): Promise<LimitActionResult> {
  await requireAdmin();
  const state = await readRuleState();
  if (!draftFor(state, PARAM)) return { ok: true, revision: state.revision, draftId: null };
  const next = discardDraft(state, PARAM);
  await writeRuleState(next);
  await clearDraftPreview();
  return { ok: true, revision: next.revision, draftId: null };
}

export async function withdrawVersion(versionId: string): Promise<LimitActionResult> {
  await requireAdmin();
  const state = await readRuleState();
  const outcome = withdrawScheduled(state, String(versionId), nowIso().slice(0, 10));
  if (!outcome.ok) return { ok: false, error: outcome.error, revision: state.revision };
  await writeRuleState(outcome.state);
  return { ok: true, revision: outcome.state.revision };
}

/** Back to the values in the code: what the next demo session starts with (SPEC-PANEL §10). */
export async function resetRules(): Promise<LimitActionResult> {
  await requireAdmin();
  await clearRuleState();
  return { ok: true, revision: 0 };
}
