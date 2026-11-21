import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin/server";
import { HistoryView } from "@/features/admin/history-view";

export const metadata: Metadata = { title: "Historia zmian" };

export default async function Page() {
  await requireAdmin();
  return <HistoryView />;
}
