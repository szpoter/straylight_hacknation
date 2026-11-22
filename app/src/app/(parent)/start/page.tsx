import type { Metadata } from "next";
import { LoginGate } from "@/features/family/LoginGate";
import { Onboarding } from "@/features/onboarding/Onboarding";

export const metadata: Metadata = { title: "Ułóżmy plan · Zusik" };

// Logowanie demo kończy się tutaj: wybór gotowego scenariusza (Ola i dwa kolejne) albo pytania,
// z których powstaje nowa rodzina. Potem plan z otwartym przewodnikiem „Jak to działa?”.
// `?rodzina=<id>` („Dodaj dziecko albo ciążę” w selektorze): pytania dodają dziecko do tej rodziny.
export default async function StartPage({ searchParams }: { searchParams: Promise<{ rodzina?: string | string[] }> }) {
  const { rodzina } = await searchParams;
  return (
    <LoginGate>
      <Onboarding family={typeof rodzina === "string" ? rodzina : undefined} />
    </LoginGate>
  );
}
