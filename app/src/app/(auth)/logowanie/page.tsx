import type { Metadata } from "next";
import { AuthScreen } from "@/features/auth/auth-shell";
import { OpenFamilyPlan } from "@/features/auth/open-family-plan";
import { OLA } from "@/lib/family/ola";

export const metadata: Metadata = { title: "Profil rodziny Oli · Przewodnik Rodzica" };

export default function FamilyEntryPage() {
  return (
    <AuthScreen
      service="Przewodnik Rodzica"
      title="Import danych rodziny Oli"
      lead={`${OLA.mother} i ${OLA.father}`}
      back={{ href: "/", label: "Wróć do strony głównej" }}
    >
      <p className="mb-5 text-on-surface-variant">Zaimportuj dane rodziny z mObywatela i mZUS, aby otworzyć wspólny plan Oli.</p>
      <OpenFamilyPlan />
    </AuthScreen>
  );
}
