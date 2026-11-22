"use server";

import { randomBytes } from "node:crypto";
import type { ParameterActionResult, ParameterForm } from "@/features/admin/parameter-change-view";
import { checksPassed, checksSummary } from "@/lib/admin/change-checks";
import { changeSpecFor, type ChangeSpec } from "@/lib/admin/parameter-changes";
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
import { clearSupportEdits } from "@/lib/admin/support-store";

/**
 * Changing a rule parameter from the admin panel (ZUS task p. 14, SPEC-PANEL §7). Works for every
 * parameter in the change registry. Every action checks the admin session on the server and
 * re-reads the stored state; nothing the browser sends is trusted beyond the form values, and the
 * checks run again on the stored draft before publication.
 */

const nowIso = () => new Date().toISOString();

function specOrError(catalogId: string): ChangeSpec {
  const spec = changeSpecFor(String(catalogId));
  if (!spec) throw new Error("unknown_parameter");
  return spec;
}

function toInput(spec: ChangeSpec, form: ParameterForm) {
  return {
    parameter: spec.parameter,
    value: typeof form.value === "number" && Number.isFinite(form.value) ? form.value : Number.NaN,
    validFrom: String(form.validFrom ?? ""),
    reason: String(form.reason ?? ""),
    source: String(form.source ?? ""),
  };
}

export async function saveParameterDraft(catalogId: string, form: ParameterForm): Promise<ParameterActionResult> {
  const author = await requireAdmin();
  const spec = specOrError(catalogId);
  const state = await readRuleState();
  const outcome = saveDraft(state, toInput(spec, form), { id: randomBytes(9).toString("base64url"), now: nowIso(), author });
  if (!outcome.ok) return { ok: false, error: outcome.error, revision: state.revision };
  await writeRuleState(outcome.state);
  return { ok: true, revision: outcome.state.revision, draftId: outcome.version.id };
}

export async function checkParameterChange(catalogId: string, form: ParameterForm): Promise<ParameterActionResult> {
  await requireAdmin();
  const spec = specOrError(catalogId);
  const state = await readRuleState();
  const input = toInput(spec, form);
  const problems = draftProblems(input, nowIso().slice(0, 10));
  if (problems.length) return { ok: false, error: problems.join(" "), revision: state.revision };
  const checks = spec.checks(scheduleOf(state), input);
  return { ok: true, revision: state.revision, checks, summary: checksSummary(checks), passed: checksPassed(checks) };
}

/** Publishes the saved draft of this parameter; the checks run again here, on the stored draft. */
export async function publishParameter(
  catalogId: string,
  request: { draftId: string; expectedRevision: number },
): Promise<ParameterActionResult> {
  await requireAdmin();
  const spec = specOrError(catalogId);
  const state = await readRuleState();
  const draft = state.versions.find((v) => v.id === request.draftId && v.parameter === spec.parameter);
  if (draft?.status === "published") return { ok: true, revision: state.revision, draftId: null };
  if (!draft || draft.status !== "draft") return { ok: false, error: "Najpierw zapisz szkic.", revision: state.revision };
  const checks = spec.checks(scheduleOf(state), draft);
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

export async function discardParameterDraft(catalogId: string): Promise<ParameterActionResult> {
  await requireAdmin();
  const spec = specOrError(catalogId);
  const state = await readRuleState();
  if (!draftFor(state, spec.parameter)) return { ok: true, revision: state.revision, draftId: null };
  const next = discardDraft(state, spec.parameter);
  await writeRuleState(next);
  await clearDraftPreview();
  return { ok: true, revision: next.revision, draftId: null };
}

export async function withdrawVersion(versionId: string): Promise<ParameterActionResult> {
  await requireAdmin();
  const state = await readRuleState();
  const outcome = withdrawScheduled(state, String(versionId), nowIso().slice(0, 10));
  if (!outcome.ok) return { ok: false, error: outcome.error, revision: state.revision };
  await writeRuleState(outcome.state);
  return { ok: true, revision: outcome.state.revision };
}

/** Back to the values in the code: what the next demo session starts with (SPEC-PANEL §10). */
export async function resetRules(): Promise<ParameterActionResult> {
  await requireAdmin();
  await clearRuleState();
  await clearSupportEdits();
  return { ok: true, revision: 0 };
}
