import type { Metadata } from "next";
import { ButtonLink, Page, Panel, SectionTitle } from "@/components/ui";
import { FamilyTitle } from "@/features/family/profile/FamilyTitle";
import { MyData } from "@/features/family/profile/MyData";
import { PlansSection } from "@/features/family/profile/PlansSection";
import { ZusAccount } from "@/features/family/profile/ZusAccount";

import { EzusDemo } from "@/features/family/profile/EzusDemo";
import { publishedSchedule } from "@/lib/admin/rule-store";

export const metadata: Metadata = { title: "Profil rodziny · Zusik" };

export default async function ProfilePage() {
  return (
    <Page>
      <FamilyTitle className="mb-stack" />
      <div className="flex flex-col gap-stack pb-section-mobile md:pb-section">
        <div data-tour="profile-data"><MyData /></div>
        <div data-tour="profile-plans"><PlansSection /></div>
        <div data-tour="profile-zus"><ZusAccount /></div>
        <div data-tour="profile-ezus"><EzusDemo schedule={await publishedSchedule()} /></div>
        <Panel aria-labelledby="sprawa-testowa" data-tour="profile-test">
          <SectionTitle id="sprawa-testowa" className="mb-2">
            Sprawdź swoją sprawę
          </SectionTitle>
          <p className="mb-4 max-w-prose text-on-surface-variant">
            Dołącz dokumenty sprawy w PDF lub zadaj Zusikowi własne pytanie. Prawo do zasiłku możesz też sprawdzić na sprawach z zestawu ZUS.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/app/rozmowa" variant="secondary">
              Otwórz rozmowę z Zusikiem
            </ButtonLink>
            <ButtonLink href="/sprawdz" variant="secondary">
              Sprawdź sprawę z zestawu ZUS
            </ButtonLink>
            <ButtonLink href="/profil/sprawa-testowa" variant="secondary">
              Wybierz przykładową sprawę
            </ButtonLink>
          </div>
        </Panel>
      </div>
    </Page>
  );
}
