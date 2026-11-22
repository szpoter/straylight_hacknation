"use server";

import { requireAdmin } from "@/lib/admin/server";
import {
  revertOrganization as revertEntry,
  saveOrganization as saveEntry,
  setWithdrawn,
  type OrganizationForm,
  type SupportOutcome,
} from "@/lib/admin/support-edits";
import { readSupportEdits, writeSupportEdits } from "@/lib/admin/support-store";
import { SUPPORT_ORGANIZATIONS } from "@/lib/support/organizations";

/**
 * Editing the support organisations from the admin panel (SPEC-PANEL §5). Every action checks the
 * admin session on the server, re-reads the stored state and validates the form again.
 */

export interface SupportActionResult {
  ok: boolean;
  error?: string;
  revision: number;
}

const nowIso = () => new Date().toISOString();

function toForm(form: OrganizationForm): OrganizationForm {
  const text = (v: unknown) => (typeof v === "string" ? v : "");
  return {
    id: typeof form.id === "string" && form.id ? form.id : null,
    name: text(form.name),
    legalForm: text(form.legalForm),
    krs: text(form.krs),
    helps: text(form.helps),
    situations: Array.isArray(form.situations) ? form.situations.map(String) : [],
    freeOfCharge: text(form.freeOfCharge),
    phone: text(form.phone),
    email: text(form.email),
    url: text(form.url),
    area: text(form.area),
    verifiedAt: text(form.verifiedAt),
  };
}

async function finish(outcome: SupportOutcome, revision: number): Promise<SupportActionResult> {
  if (!outcome.ok) return { ok: false, error: outcome.error, revision };
  await writeSupportEdits(outcome.state);
  return { ok: true, revision: outcome.state.revision };
}

export async function saveSupportOrganization(form: OrganizationForm, expectedRevision: number): Promise<SupportActionResult> {
  const author = await requireAdmin();
  const state = await readSupportEdits();
  const now = nowIso();
  const outcome = saveEntry(SUPPORT_ORGANIZATIONS, state, toForm(form), {
    expectedRevision: Number(expectedRevision),
    today: now.slice(0, 10),
    now,
    author,
  });
  return finish(outcome, state.revision);
}

export async function withdrawSupportOrganization(id: string, withdrawn: boolean, expectedRevision: number): Promise<SupportActionResult> {
  const author = await requireAdmin();
  const state = await readSupportEdits();
  const outcome = setWithdrawn(SUPPORT_ORGANIZATIONS, state, String(id), Boolean(withdrawn), {
    expectedRevision: Number(expectedRevision),
    now: nowIso(),
    author,
  });
  return finish(outcome, state.revision);
}

export async function revertSupportOrganization(id: string, expectedRevision: number): Promise<SupportActionResult> {
  await requireAdmin();
  const state = await readSupportEdits();
  return finish(revertEntry(state, String(id), Number(expectedRevision)), state.revision);
}
