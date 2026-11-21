import { Page, PageTitle, Panel, SectionTitle } from "@/components/ui";
import { ORGANIZATIONS, SITUATIONS } from "./organizations";

/** Spokojny widok „Wsparcie”, bez animacji: najpierw organizacje, potem sprawy formalne. */
export function SupportView() {
  return (
    <Page>
      <PageTitle>Wsparcie</PageTitle>
      <p className="mt-4 max-w-prose text-lead text-on-surface-variant">
        Organizacje charytatywne, które pomagają rodzicom w trudnych sytuacjach. Wybierz to, co Cię dotyczy. Sprawy formalne możesz odłożyć na później.
      </p>
      <nav aria-label="Sytuacje" className="mt-stack">
        <ul className="flex flex-wrap gap-2">
          {SITUATIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="inline-flex h-10 items-center rounded-full border border-outline bg-surface px-4 text-meta font-medium hover:border-on-surface">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-stack flex flex-col gap-stack pb-section-mobile md:pb-section">
        {SITUATIONS.map((s) => (
          <Panel key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="scroll-mt-20">
            <SectionTitle id={`${s.id}-title`} className="mb-4 md:mb-6">
              {s.title}
            </SectionTitle>
            {s.orgs.length > 0 ? (
              <ul className="divide-y divide-outline border-y border-outline">
                {s.orgs.map((id) => {
                  const o = ORGANIZATIONS[id];
                  return (
                    <li key={id} className="flex flex-col gap-1 py-4">
                      <h3 className="font-sans text-label font-medium">{o.name}</h3>
                      <p>{o.help}</p>
                      <p className="text-meta text-on-surface-variant">
                        Dla kogo: {o.forWhom}
                        {o.free && " · bezpłatnie"}
                      </p>
                      <a href={o.url} target="_blank" rel="noopener noreferrer" className="self-start underline underline-offset-4 decoration-outline hover:decoration-on-surface">
                        Strona organizacji<span className="sr-only"> {o.name} (otwiera się w nowej karcie)</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-on-surface-variant">Lista organizacji jest w przygotowaniu. Dodamy tylko te, których pomoc potwierdziliśmy na ich stronach.</p>
            )}
            <h3 className="mb-2 mt-6 font-sans text-label font-medium">Sprawy formalne</h3>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-on-surface-variant">
              {s.formal.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </Page>
  );
}
