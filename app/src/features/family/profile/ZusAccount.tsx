import { ButtonLink, Panel, SectionTitle } from "@/components/ui";

export function ZusAccount() {
  return (
    <Panel aria-labelledby="dokumenty-oli">
      <SectionTitle id="dokumenty-oli">Wnioski rodziny</SectionTitle>
      <p className="my-3">W dokumentach możesz uzupełnić wniosek, zapisać szkic i oznaczyć samodzielne przekazanie.</p>
      <ButtonLink href="/dokumenty" variant="secondary">Otwórz dokumenty i wnioski</ButtonLink>
      <p className="mt-3 text-meta text-on-surface-variant">Źródło statusów: zapisy w planie Oli w tej przeglądarce. Urzędowe potwierdzenia sprawdzisz na swoim koncie eZUS.</p>
    </Panel>
  );
}
