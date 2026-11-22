"use server";

import { draftFor } from "@/lib/admin/rule-versions";
import { clearDraftPreview, readRuleState, writeDraftPreview } from "@/lib/admin/rule-store";
import { requireAdmin } from "@/lib/admin/server";

/** "Pokaż oczami rodzica" for the saved draft: the parent views of this browser apply it for 30 minutes. */
export async function startDraftPreview(): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const draft = draftFor(await readRuleState(), "paternity.totalDays");
  if (!draft) return { ok: false, error: "Najpierw zapisz szkic." };
  await writeDraftPreview(draft);
  return { ok: true };
}

/** Ends the preview. Needs no admin session: it only removes this browser's own preview cookie. */
export async function endDraftPreview(): Promise<void> {
  await clearDraftPreview();
}
