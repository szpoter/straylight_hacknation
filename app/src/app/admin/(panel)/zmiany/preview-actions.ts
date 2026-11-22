"use server";

import { changeSpecFor } from "@/lib/admin/parameter-changes";
import { draftFor } from "@/lib/admin/rule-versions";
import { clearDraftPreview, readRuleState, writeDraftPreview } from "@/lib/admin/rule-store";
import { requireAdmin } from "@/lib/admin/server";

/** "Pokaż oczami rodzica" for the saved draft: the parent views of this browser apply it for 30 minutes. */
export async function startDraftPreview(catalogId: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();
  const spec = changeSpecFor(String(catalogId));
  if (!spec?.parentView) return { ok: false, error: "Ten parametr nie ma jeszcze widoku rodzica." };
  const draft = draftFor(await readRuleState(), spec.parameter);
  if (!draft) return { ok: false, error: "Najpierw zapisz szkic." };
  await writeDraftPreview(draft);
  return { ok: true };
}

/** Ends the preview. Needs no admin session: it only removes this browser's own preview cookie. */
export async function endDraftPreview(): Promise<void> {
  await clearDraftPreview();
}
