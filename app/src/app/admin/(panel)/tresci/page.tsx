import type { Metadata } from "next";
import { SourcesView } from "@/features/admin/sources-view";
import { knowledgeSources } from "@/lib/admin/catalog";
import { requireAdmin } from "@/lib/admin/server";
import { supportRows } from "@/lib/admin/support-edits";
import { readSupportEdits } from "@/lib/admin/support-store";
import { SUPPORT_ORGANIZATIONS } from "@/lib/support/organizations";
import { revertSupportOrganization, saveSupportOrganization, withdrawSupportOrganization } from "./actions";

export const metadata: Metadata = { title: "Treści i źródła" };

export default async function Page() {
  await requireAdmin();
  const { packages, sources } = knowledgeSources();
  const edits = await readSupportEdits();
  return (
    <SourcesView
      packages={packages}
      sources={sources}
      organizations={supportRows(SUPPORT_ORGANIZATIONS, edits)}
      revision={edits.revision}
      today={new Date().toISOString().slice(0, 10)}
      actions={{ save: saveSupportOrganization, withdraw: withdrawSupportOrganization, revert: revertSupportOrganization }}
    />
  );
}
