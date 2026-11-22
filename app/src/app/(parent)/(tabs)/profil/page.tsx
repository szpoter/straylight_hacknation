import type { Metadata } from "next";
import { ButtonLink, Page, PageTitle, Panel, SectionTitle } from "@/components/ui";
import { MyData } from "@/features/family/profile/MyData";
import { PlansSection } from "@/features/family/profile/PlansSection";
import { ResetDemo } from "@/features/family/profile/ResetDemo";
import { ZusAccount } from "@/features/family/profile/ZusAccount";

export const metadata: Metadata = { title: "Profil rodziny · Zusik" };

export default function ProfilePage() {
  return (
    <Page>
      <PageTitle className="mb-stack">Profil rodziny</PageTitle>
      <div className="flex flex-col gap-stack pb-section-mobile md:pb-section">
        <div data-tour="profile-data"><MyData /></div>
        <div data-tour="profile-plans"><PlansSection /></div>
        <div data-tour="profile-zus"><ZusAccount /></div>
        <Panel aria-labelledby="sprawa-testowa" data-tour="profile-test">
          <SectionTitle id="sprawa-testowa" className="mb-2">
            Przetestuj przykładową sprawę
          </SectionTitle>
          <p className="mb-4 max-w-prose text-on-surface-variant">
            Przejdź przez fikcyjny przykład Alicji albo wybierz sprawę, w której Zusik odczyta Twój plik PDF.
          </p>
          <ButtonLink href="/profil/sprawa-testowa" variant="secondary">
            Wybierz sprawę
          </ButtonLink>
        </Panel>
        <div data-tour="profile-reset"><ResetDemo /></div>
      </div>
    </Page>
  );
}
