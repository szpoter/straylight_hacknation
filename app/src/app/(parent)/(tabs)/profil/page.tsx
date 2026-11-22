import type { Metadata } from "next";
import { ButtonLink, Page, PageTitle, Panel, SectionTitle } from "@/components/ui";
import { MyData } from "@/features/family/profile/MyData";
import { PlansSection } from "@/features/family/profile/PlansSection";
import { ZusAccount } from "@/features/family/profile/ZusAccount";

import { EzusDemo } from "@/features/family/profile/EzusDemo";
import { publishedSchedule } from "@/lib/admin/rule-store";

export const metadata: Metadata = { title: "Profil rodziny · Zusik" };

export default async function ProfilePage() {
  return (
    <Page>
      <PageTitle className="mb-stack">Rodzina Oli Lis</PageTitle>
      <div className="flex flex-col gap-stack pb-section-mobile md:pb-section">
        <MyData />
        <PlansSection />
        <ZusAccount />
        <EzusDemo schedule={await publishedSchedule()} />
        <Panel aria-labelledby="sprawa-testowa">
          <SectionTitle id="sprawa-testowa" className="mb-2">
            Sprawdź swoją sprawę
          </SectionTitle>
          <p className="mb-4 max-w-prose text-on-surface-variant">
            Dołącz dokumenty sprawy w PDF lub zadaj Zusikowi własne pytanie. Prawo do zasiłku możesz też sprawdzić na fikcyjnych przykładach.
          </p>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href="/app/rozmowa" variant="secondary">
              Otwórz rozmowę z Zusikiem
            </ButtonLink>
            <ButtonLink href="/sprawdz" variant="secondary">
              Sprawdź fikcyjny przykład
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
