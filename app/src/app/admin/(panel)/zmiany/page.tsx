import type { Metadata } from "next";
import { ChangeView } from "@/features/admin/change-view";
import { LimitChangeView } from "@/features/admin/limit-change-view";
import { SPEC_PARAMETERS } from "@/features/admin/mock-data";
import { appParameters } from "@/lib/admin/catalog";
import { draftFor, scheduleOf } from "@/lib/admin/rule-versions";
import { readRuleState } from "@/lib/admin/rule-store";
import { requireAdmin } from "@/lib/admin/server";
import { addDays } from "@/lib/rules/dates";
import { RULE_PARAMETERS, valueOn } from "@/lib/rules/parameters";
import { TOTAL_DAYS } from "@/lib/rules/paternity";
import { checkLimitChange, discardLimitDraft, publishLimit, saveLimitDraft } from "./actions";
import { startDraftPreview } from "./preview-actions";

export const metadata: Metadata = { title: "Przygotuj zmianę" };

export default async function Page({ searchParams }: { searchParams: Promise<{ parametr?: string | string[] }> }) {
  await requireAdmin();
  const { parametr } = await searchParams;
  const parameterId = Array.isArray(parametr) ? parametr[0] : parametr;
  const state = await readRuleState();
  const today = new Date().toISOString().slice(0, 10);
  const parameters = [...appParameters(state, today), ...SPEC_PARAMETERS];

  // The paternity total changes for real; other parameters keep the preview flow until they get a store.
  if (parameterId === "app-paternity-total") {
    const parameter = parameters.find((p) => p.id === parameterId)!;
    const schedule = scheduleOf(state);
    const draft = draftFor(state, "paternity.totalDays");
    return (
      <LimitChangeView
        name={parameter.name}
        appSource={parameter.appSource}
        event={RULE_PARAMETERS["paternity.totalDays"].event}
        currentDays={valueOn(schedule, "paternity.totalDays", today, TOTAL_DAYS).value}
        published={schedule}
        revision={state.revision}
        tomorrow={addDays(today, 1)}
        draft={
          draft
            ? { id: draft.id, weeks: draft.value / 7, validFrom: draft.validFrom, reason: draft.reason, source: draft.source }
            : null
        }
        actions={{
          save: saveLimitDraft,
          check: checkLimitChange,
          publish: publishLimit,
          discard: discardLimitDraft,
          preview: startDraftPreview,
        }}
      />
    );
  }

  // key resets the form state when switching parameters.
  return <ChangeView key={parameterId ?? "default"} parameters={parameters} parameterId={parameterId} />;
}
