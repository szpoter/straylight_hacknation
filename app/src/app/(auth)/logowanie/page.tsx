import type { Metadata } from "next";
import { AuthScreen } from "@/features/auth/auth-shell";
import { OpenFamilyPlan } from "@/features/auth/open-family-plan";
import { OLA } from "@/lib/family/ola";

export const metadata: Metadata = { title: "Profil rodziny Oli · Przewodnik Rodzica" };

export default function FamilyEntryPage() {
  return (
    <AuthScreen
      service="Przewodnik Rodzica"
      title="Profil rodziny Oli"
      lead={`${OLA.mother} i ${OLA.father}`}
      back={{ href: "/", label: "Wróć do strony głównej" }}
    >
      <OpenFamilyPlan />
      <p className="mt-4 text-meta text-on-surface-variant">Profil rodziny Lisów zapisany w aplikacji. Brak połączenia z eZUS.</p>
    </AuthScreen>
  );
}
