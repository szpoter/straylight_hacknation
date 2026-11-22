import type { Metadata } from "next";
import { BenefitCalculatorForm } from "@/features/calculator/BenefitCalculator";

export const metadata: Metadata = { title: "Symulacja zasiłku · Zusik" };

export default function ManualCalculatorPage() {
  return <BenefitCalculatorForm />;
}
