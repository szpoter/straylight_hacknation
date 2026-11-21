import type { Metadata } from "next";
import { RulesView } from "@/features/admin/rules-view";
import { SPEC_PARAMETERS } from "@/features/admin/mock-data";
import { appParameters, paternityTestCases } from "@/lib/admin/catalog";
import { requireAdmin } from "@/lib/admin/server";

export const metadata: Metadata = { title: "Reguły świadczeń" };

export default async function Page() {
  await requireAdmin();
  // Values the app applies first, then values only written down in the specification.
  return <RulesView parameters={[...appParameters(), ...SPEC_PARAMETERS]} cases={paternityTestCases()} />;
}
