import type { Metadata } from "next";
import { BenefitCalculator } from "@/features/calculator/BenefitCalculator";

import { publishedSchedule } from "@/lib/admin/rule-store";

export const metadata: Metadata = { title: "Kalkulator zasiłku macierzyńskiego · Zusik" };

export default async function CalculatorPage() {
  return <BenefitCalculator schedule={await publishedSchedule()} />;
}
