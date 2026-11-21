import type { Metadata } from "next";
import { PlanView } from "@/features/journey-map/PlanView";

export const metadata: Metadata = { title: "Mój plan · Zusik" };

export default function PlanPage() {
  return <PlanView />;
}
