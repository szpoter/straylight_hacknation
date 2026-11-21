import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/server";
import { RulesView } from "@/features/admin/rules-view";

export const metadata: Metadata = { title: "Reguły świadczeń" };

export default async function Page() {
  await requireAdmin();
  return <RulesView />;
}
