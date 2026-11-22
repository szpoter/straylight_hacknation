import type { Metadata } from "next";
import { LoginGate } from "@/features/family/LoginGate";
import { Onboarding } from "@/features/onboarding/Onboarding";

export const metadata: Metadata = { title: "Ułóżmy plan · Zusik" };

export default function StartPage() {
  return (
    <LoginGate>
      <Onboarding />
    </LoginGate>
  );
}
