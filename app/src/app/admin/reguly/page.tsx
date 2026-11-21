import type { Metadata } from "next";
import { RulesView } from "@/features/admin/rules-view";

export const metadata: Metadata = { title: "Reguły świadczeń" };

export default function Page() {
  return <RulesView />;
}
