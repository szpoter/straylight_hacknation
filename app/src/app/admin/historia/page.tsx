import type { Metadata } from "next";
import { HistoryView } from "@/features/admin/history-view";

export const metadata: Metadata = { title: "Historia zmian" };

export default function Page() {
  return <HistoryView />;
}
