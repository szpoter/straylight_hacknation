import type { Metadata } from "next";
import { ChangeView } from "@/features/admin/change-view";
import { SPEC_PARAMETERS } from "@/features/admin/mock-data";
import { ParameterChangeView } from "@/features/admin/parameter-change-view";
import { appParameters, citeStatutes } from "@/lib/admin/catalog";
import { changeSpecFor } from "@/lib/admin/parameter-changes";
import { draftFor, scheduleOf } from "@/lib/admin/rule-versions";
import { readRuleState } from "@/lib/admin/rule-store";
import { requireAdmin } from "@/lib/admin/server";
import { addDays } from "@/lib/rules/dates";
import { parameterOn } from "@/lib/rules/parameters";
import { checkParameterChange, discardParameterDraft, publishParameter, saveParameterDraft } from "./actions";
import { startDraftPreview } from "./preview-actions";

export const metadata: Metadata = { title: "Przygotuj zmianę" };

export default async function Page({ searchParams }: { searchParams: Promise<{ parametr?: string | string[] }> }) {
  await requireAdmin();
  const { parametr } = await searchParams;
  const parameterId = Array.isArray(parametr) ? parametr[0] : parametr;
  const state = await readRuleState();
  const today = new Date().toISOString().slice(0, 10);
  const parameters = [...appParameters(state, today), ...citeStatutes(SPEC_PARAMETERS)];

  // Parameters in the change registry change for real; the rest keep the preview flow.
  const spec = parameterId ? changeSpecFor(parameterId) : null;
  if (spec) {
    const schedule = scheduleOf(state);
    const draft = draftFor(state, spec.parameter);
    return (
      <ParameterChangeView
        key={spec.catalogId}
        catalogId={spec.catalogId}
        appSource={parameters.find((p) => p.id === spec.catalogId)?.appSource}
        current={parameterOn(schedule, spec.parameter, today).value}
        published={schedule}
        revision={state.revision}
        tomorrow={addDays(today, 1)}
        draft={
          draft
            ? { id: draft.id, value: draft.value, validFrom: draft.validFrom, reason: draft.reason, source: draft.source }
            : null
        }
        actions={{
          save: saveParameterDraft,
          check: checkParameterChange,
          publish: publishParameter,
          discard: discardParameterDraft,
          preview: startDraftPreview,
        }}
      />
    );
  }

  // key resets the form state when switching parameters.
  return <ChangeView key={parameterId ?? "default"} parameters={parameters} parameterId={parameterId} />;
}
