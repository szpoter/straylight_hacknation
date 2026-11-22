import { Page, PageTitle, Panel, SectionTitle } from "@/components/ui";
import { supportOrganizations } from "@/lib/admin/support-store";
import { SITUATION_LABEL } from "@/lib/support/organizations";
import { ORGANIZATIONS, SITUATIONS } from "./organizations";

/** Spokojny widok „Wsparcie”, bez animacji: najpierw organizacje, potem sprawy formalne. */
export async function SupportView() {
  const published = await supportOrganizations();
  const groups = SITUATIONS.map(s => {
    const orgs = published.filter(o => o.situations.some(tag => s.categories.includes(tag))).map(o => ({
      id: o.id, name: o.name, help: o.helps, forWhom: o.situations.map(tag => SITUATION_LABEL[tag]).join(", "),
      url: o.url, free: o.freeOfCharge,
    }));
    // The preterm coalition is listed on the parent page outside the panel's catalogue.
    if (s.id === "wczesniak") orgs.push({ ...ORGANIZATIONS.koalicja, free: null });
    return { ...s, orgs };
  });
  return (
    <Page>
      <PageTitle>Wsparcie</PageTitle>
      <p className="mt-4 max-w-prose text-lead text-on-surface-variant">
        Organizacje charytatywne, które pomagają rodzicom w trudnych sytuacjach. Wybierz to, co Cię dotyczy. Sprawy formalne możesz odłożyć na później.
      </p>
      <nav aria-label="Sytuacje" data-tour="support-situations" className="mt-stack">
        <ul className="flex flex-wrap gap-2">
          {groups.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="inline-flex h-10 items-center rounded-full border border-outline bg-background px-4 text-meta font-medium hover:border-on-surface">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-stack flex flex-col gap-stack pb-section-mobile md:pb-section">
        {groups.map((s, i) => (
          <Panel key={s.id} id={s.id} data-tour={i === 0 ? "support-first" : undefined} aria-labelledby={`${s.id}-title`} className="scroll-mt-20">
            <SectionTitle id={`${s.id}-title`} className="mb-4 md:mb-6">
              {s.title}
            </SectionTitle>
            {s.orgs.length > 0 ? (
              <ul className="divide-y divide-outline border-y border-outline">
                {s.orgs.map((o) => {
                  return (
                    <li key={o.id} className="flex flex-col gap-1 py-4">
                      <h3 className="font-sans text-label font-medium">{o.name}</h3>
                      <p>{o.help}</p>
                      <p className="text-meta text-on-surface-variant">
                        Dla kogo: {o.forWhom}
                        {o.free && ` · ${o.free}`}
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
            <h3 data-tour={i === 0 ? "support-formal" : undefined} className="mb-2 mt-6 font-sans text-label font-medium">Sprawy formalne</h3>
            <ul className="flex list-disc flex-col gap-1 pl-5 text-on-surface-variant">
              {s.formal.map((f) => (
                <li key={f.text}>
                  {f.text}
                  {f.source && (
                    <>
                      {" "}
                      <a href={f.source.url} target="_blank" rel="noopener noreferrer" className="text-meta underline underline-offset-4 decoration-outline hover:decoration-on-surface">
                        Źródło: {f.source.label}
                        <span className="sr-only"> (otwiera się w nowej karcie)</span>
                      </a>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </Page>
  );
}
