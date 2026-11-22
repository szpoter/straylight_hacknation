"use client";

import { ButtonLink, Panel, SectionTitle } from "@/components/ui";
import { formatLong } from "@/lib/demo/dates";
import { useDemoSession } from "@/features/auth/demo-session";

export function PlansSection() {
  const family = useDemoSession()?.family;
  if (!family) return null;
  return (
    <Panel aria-labelledby="dziecko">
      <SectionTitle id="dziecko">{family.child}</SectionTitle>
      <p className="my-3">Data urodzenia: <time dateTime={family.birthDate}>{formatLong(family.birthDate)}</time></p>
      <ButtonLink href="/plan" variant="secondary">Otwórz plan Oli</ButtonLink>
    </Panel>
  );
}
