import type { Metadata } from "next";
import { Page } from "@/components/ui";
import { TestCaseWizard } from "@/features/family/profile/TestCaseWizard";

export const metadata: Metadata = { title: "Przykładowa sprawa · Zusik" };

export default function TestCasePage() {
  return (
    <Page>
      <TestCaseWizard />
    </Page>
  );
}
