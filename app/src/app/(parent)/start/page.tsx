import type { Metadata } from "next";
import { LoginGate } from "@/features/family/LoginGate";
import { Onboarding } from "@/features/onboarding/Onboarding";

export const metadata: Metadata = { title: "Ułóżmy plan · Zusik" };

// Logowanie demo kończy się tutaj. Onboarding jest pokazem: na końcu rodzic trafia na plan
// rodziny Oli z otwartym przewodnikiem „Jak to działa?” (patrz Onboarding.tsx).
export default function StartPage() {
  return (
    <LoginGate>
      <Onboarding />
    </LoginGate>
  );
}
