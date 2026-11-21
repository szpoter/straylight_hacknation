import type { Metadata } from "next";
import { HistoryView } from "@/features/admin/history-view";
import { HISTORY } from "@/features/admin/mock-data";
import { historyEntries } from "@/lib/admin/catalog";
import { readRuleState } from "@/lib/admin/rule-store";
import { requireAdmin } from "@/lib/admin/server";
import { resetRules, withdrawVersion } from "../zmiany/actions";

export const metadata: Metadata = { title: "Historia zmian" };

export default async function Page() {
  await requireAdmin();
  const state = await readRuleState();
  const entries = historyEntries(state, new Date().toISOString().slice(0, 10));
  return (
    <HistoryView
      entries={[...entries, ...HISTORY]}
      hasSessionChanges={state.versions.length > 0}
      actions={{ withdraw: withdrawVersion, reset: resetRules }}
    />
  );
}
