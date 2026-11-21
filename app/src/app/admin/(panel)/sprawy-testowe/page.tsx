import type { Metadata } from "next";
import { CasesView } from "@/features/admin/cases-view";
import { paternityTestCases } from "@/lib/admin/catalog";
import { publishedSchedule } from "@/lib/admin/rule-store";
import { requireAdmin } from "@/lib/admin/server";

export const metadata: Metadata = { title: "Sprawy testowe" };

export default async function Page() {
  await requireAdmin();
  // Evaluated with the rule values published in this demo session.
  return <CasesView cases={paternityTestCases(await publishedSchedule())} />;
}
