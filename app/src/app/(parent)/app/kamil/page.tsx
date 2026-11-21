import { endDraftPreview } from "@/app/admin/(panel)/zmiany/preview-actions";
import { DraftPreviewBanner } from "@/features/admin/draft-preview-banner";
import { KamilWorkspace } from "@/features/kamil/workspace";
import { readDraftPreview } from "@/lib/admin/rule-store";
import { RULE_PARAMETERS, weeksLabel } from "@/lib/rules/parameters";

export default async function KamilPage() {
  // Admin "Pokaż oczami rodzica": an unpublished draft applied in this browser only, clearly marked.
  const preview = await readDraftPreview();
  return (
    <>
      {preview ? (
        <DraftPreviewBanner
          label={RULE_PARAMETERS[preview.parameter].label}
          value={weeksLabel(preview.value)}
          from={preview.validFrom.split("-").reverse().join(".")}
          endAction={endDraftPreview}
        />
      ) : null}
      <KamilWorkspace />
    </>
  );
}
