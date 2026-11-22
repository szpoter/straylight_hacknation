import type { Metadata } from "next";
import { SourcesView } from "@/features/admin/sources-view";
import { knowledgeSources } from "@/lib/admin/catalog";
import { requireAdmin } from "@/lib/admin/server";
import { SUPPORT_ORGANIZATIONS } from "@/lib/support/organizations";

export const metadata: Metadata = { title: "Treści i źródła" };

export default async function Page() {
  await requireAdmin();
  const { packages, sources } = knowledgeSources();
  return (
    <SourcesView
      packages={packages}
      sources={sources}
      organizations={SUPPORT_ORGANIZATIONS}
      today={new Date().toISOString().slice(0, 10)}
    />
  );
}
