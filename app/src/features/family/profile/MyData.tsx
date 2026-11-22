import { Panel, SectionTitle } from "@/components/ui";
import { PARENT_PROFILE } from "@/lib/demo/fixtures";

export function MyData() {
  return (
    <Panel aria-labelledby="rodzice">
      <SectionTitle id="rodzice">Rodzice Oli</SectionTitle>
      <dl className="mt-4 divide-y divide-outline border-y border-outline">
        {PARENT_PROFILE.map((row) => (
          <div key={row.label} className="grid gap-1 py-3 md:grid-cols-[14rem_1fr]">
            <dt className="text-on-surface-variant">{row.label === "Imię i nazwisko" ? "Mama" : row.label === "Pracodawca" ? "Pracodawca mamy" : row.label}</dt>
            <dd className="font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-meta text-on-surface-variant">Źródło danych rodziców i dziecka: profil rodziny Lisów.</p>
    </Panel>
  );
}
