import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/server";
import { CasesView } from "@/features/admin/cases-view";

export const metadata: Metadata = { title: "Sprawy testowe" };

export default async function Page() {
  await requireAdmin();
  return <CasesView />;
}
