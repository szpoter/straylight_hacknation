"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertIcon, ButtonLink, FileIcon, Page, PageTitle, PillTabs, SectionTitle } from "@/components/ui";
import { usePlan } from "@/features/family/PlanProvider";
import { formatLong } from "@/lib/demo/dates";
import { GOAL_LABEL, GOAL_ORDER, countByGroup, docCases } from "@/lib/plan/docs";
import { DOC_GROUP_LABEL, docStatus, type DocGroup } from "@/lib/plan/status";
import { CaseRow } from "./CaseRow";
import { childFiles, sortCases, type DocCase } from "./model";

type View = "sprawy" | "pliki";
const GROUPS: DocGroup[] = ["do-zalatwienia", "wyslane", "na-pozniej", "zakonczone"];

export function DocumentsList() {
  const { plan } = usePlan();
  const [view, setView] = useState<View>("sprawy");
  const [filter, setFilter] = useState<DocGroup | undefined>();

  const cases = sortCases(docCases(plan.stops) as DocCase[]);
  const counts = countByGroup(plan.stops);
  const summons = cases.find((c) => c.state === "wezwanie" && c.doc.summons);
  const visible = filter ? cases.filter((c) => docStatus(c.state).group === filter) : cases;
  const files = childFiles(cases);

  return (
    <Page>
      <p className="text-meta text-on-surface-variant">{plan.name}</p>
      <PageTitle>Dokumenty i wnioski</PageTitle>
      <p className="mt-3 max-w-prose text-lead text-on-surface-variant">
        Wszystkie wnioski i pisma z planu w jednym miejscu: co trzeba złożyć, co już wysłane i jak urząd odpowiedział. Kliknij sprawę, żeby zobaczyć jej przebieg, pliki i następny krok.
      </p>

      {summons?.doc.summons && (
        // Brak tokenu koloru ostrzeżenia: akcent bursztynowy — do weryfikacji.
        <div role="region" aria-label="Pilne pismo" className="mt-stack flex flex-col gap-3 rounded-lg bg-tertiary p-gutter-mobile md:flex-row md:items-center md:justify-between md:p-card">
          <p className="flex items-start gap-2">
            <AlertIcon className="mt-0.5 shrink-0" />
            <span>
              <span className="font-medium">Nowe pismo z {summons.doc.summons.from}</span> · termin do {formatLong(summons.doc.summons.due, false)}
              <span className="block text-meta">{summons.title}</span>
            </span>
          </p>
          <ButtonLink href={`/dokumenty/${summons.id}`} className="self-start md:self-auto">
            Otwórz wezwanie
          </ButtonLink>
        </div>
      )}

      <div className="mt-stack flex flex-col gap-4">
        <PillTabs<View>
          label="Widok"
          items={[
            { value: "sprawy", label: "Sprawy" },
            { value: "pliki", label: "Pliki dziecka", count: files.length },
          ]}
          value={view}
          onChange={setView}
        />
        {view === "sprawy" && (
          <PillTabs<DocGroup>
            label="Filtruj według statusu"
            scroll
            items={GROUPS.map((g) => ({ value: g, label: DOC_GROUP_LABEL[g], count: counts[g] }))}
            value={filter}
            onChange={(g) => setFilter((cur) => (cur === g ? undefined : g))}
          />
        )}
      </div>

      {view === "sprawy" ? (
        <div className="mt-stack flex flex-col gap-stack pb-section-mobile md:mt-section-mobile md:gap-section-mobile md:pb-section">
          {filter === "do-zalatwienia" && visible.length === 0 && <EmptyState text="Na dziś masz wszystko załatwione" />}
          {filter !== "do-zalatwienia" && visible.length === 0 && <EmptyState text="Brak spraw w tej grupie" />}
          {!filter && counts["do-zalatwienia"] === 0 && cases.length > 0 && (
            <EmptyState text={counts["na-pozniej"] > 0 && counts.wyslane === 0 ? "Na teraz nic nie musisz składać" : "Na dziś masz wszystko załatwione"} />
          )}
          {GOAL_ORDER.map((goal) => {
            const inGoal = visible.filter((c) => c.doc.goal === goal);
            if (inGoal.length === 0) return null;
            return (
              <section key={goal} aria-labelledby={`cel-${goal}`}>
                <SectionTitle id={`cel-${goal}`} className="mb-4 md:mb-6">
                  {GOAL_LABEL[goal]}
                </SectionTitle>
                <ul className="flex flex-col gap-3 md:gap-0 md:border-t md:border-outline">
                  {inGoal.map((c) => (
                    <CaseRow key={c.id} c={c} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="mt-stack flex flex-col gap-stack pb-section-mobile md:mt-section-mobile md:gap-section-mobile md:pb-section">
          {files.length === 0 && <EmptyState text="Nie ma jeszcze plików dziecka. Pojawią się po wysłaniu pierwszego wniosku." />}
          {GOAL_ORDER.map((goal) => {
            const inGoal = files.filter((f) => f.goal === goal);
            if (inGoal.length === 0) return null;
            return (
              <section key={goal} aria-labelledby={`pliki-${goal}`}>
                <SectionTitle id={`pliki-${goal}`} className="mb-4 md:mb-6">
                  {GOAL_LABEL[goal]}
                </SectionTitle>
                <ul className="divide-y divide-outline border-y border-outline">
                  {inGoal.map((f) => (
                    <li key={f.id} className="flex items-start gap-3 py-4">
                      <FileIcon className="mt-0.5 shrink-0 text-on-surface-variant" />
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5 md:flex-row md:items-baseline md:gap-6">
                        <span className="font-medium md:flex-1">{f.name}</span>
                        <span className="text-meta text-on-surface-variant">
                          {f.type} · {formatLong(f.date)}
                        </span>
                        <Link href={`/dokumenty/${f.caseId}`} className="text-meta underline decoration-outline underline-offset-4 hover:decoration-on-surface">
                          Sprawa: {f.caseTitle}
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </Page>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="rounded-lg border border-outline bg-background p-card font-serif text-title">{text}</p>;
}
