import type { Metadata } from "next";
import { BenefitCalculator } from "@/features/calculator/BenefitCalculator";

export const metadata: Metadata = { title: "Kalkulator zasiłku macierzyńskiego · Zusik" };

export default function CalculatorPage() {
  return <BenefitCalculator />;
}
