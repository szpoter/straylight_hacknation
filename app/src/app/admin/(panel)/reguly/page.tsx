import type { Metadata } from "next";
import { RulesView } from "@/features/admin/rules-view";
import { HISTORY, SPEC_PARAMETERS } from "@/features/admin/mock-data";
import { appParameters, historyEntries, allTestCases } from "@/lib/admin/catalog";
import { scheduleOf } from "@/lib/admin/rule-versions";
import { readRuleState } from "@/lib/admin/rule-store";
import { requireAdmin } from "@/lib/admin/server";

export const metadata: Metadata = { title: "Reguły świadczeń" };

export default async function Page() {
  await requireAdmin();
  const state = await readRuleState();
  const today = new Date().toISOString().slice(0, 10);
  // Values the app applies first, then values only written down in the specification.
  return (
    <RulesView
      parameters={[...appParameters(state, today), ...SPEC_PARAMETERS]}
      cases={allTestCases(scheduleOf(state))}
      history={[...historyEntries(state, today), ...HISTORY]}
    />
  );
}
