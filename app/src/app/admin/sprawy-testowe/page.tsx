import type { Metadata } from "next";
import { CasesView } from "@/features/admin/cases-view";

export const metadata: Metadata = { title: "Sprawy testowe" };

export default function Page() {
  return <CasesView />;
}
