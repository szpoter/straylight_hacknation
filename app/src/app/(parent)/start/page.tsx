import type { Metadata } from "next";
import { Onboarding } from "@/features/onboarding/Onboarding";

export const metadata: Metadata = { title: "Ułóżmy plan · Zusik" };

export default function StartPage() {
  return <Onboarding />;
}
