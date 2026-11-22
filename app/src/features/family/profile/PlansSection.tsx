import { ButtonLink, Panel, SectionTitle } from "@/components/ui";
import { formatLong } from "@/lib/demo/dates";
import { OLA } from "@/lib/family/ola";

export function PlansSection() {
  return (
    <Panel aria-labelledby="dziecko">
      <SectionTitle id="dziecko">{OLA.child}</SectionTitle>
      <p className="my-3">Data urodzenia: <time dateTime={OLA.birthDate}>{formatLong(OLA.birthDate)}</time></p>
      <ButtonLink href="/plan" variant="secondary">Otwórz plan Oli</ButtonLink>
    </Panel>
  );
}
