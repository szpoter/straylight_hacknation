import type { Metadata } from "next";
import { ParentChat } from "@/features/chat/parent-chat";
import { LoginGate } from "@/features/family/LoginGate";
import { Onboarding } from "@/features/onboarding/Onboarding";

export const metadata: Metadata = { title: "Ułóżmy plan · Zusik" };

export default function StartPage() {
  return (
    <LoginGate>
      <ParentChat topLauncher><Onboarding /></ParentChat>
    </LoginGate>
  );
}
