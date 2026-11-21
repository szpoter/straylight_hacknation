import type { Metadata } from "next";
import { SourcesView } from "@/features/admin/sources-view";
import { knowledgeSources } from "@/lib/admin/catalog";
import { requireAdmin } from "@/lib/admin/server";

export const metadata: Metadata = { title: "Treści i źródła" };

export default async function Page() {
  await requireAdmin();
  const { packages, sources } = knowledgeSources();
  return <SourcesView packages={packages} sources={sources} />;
}
