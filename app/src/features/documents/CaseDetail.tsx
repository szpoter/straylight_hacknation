"use client";

import Link from "next/link";
import { AlertIcon, ArrowLeftIcon, Button, ButtonLink, CheckIcon, Page, PageTitle, Panel, SectionTitle, Tag } from "@/components/ui";
import { usePlan } from "@/features/family/PlanProvider";
import { daysLeftLabel, formatLong } from "@/lib/demo/dates";
import { docStatus } from "@/lib/plan/status";
import type { DocCase } from "./model";
import { GROUP_TONE } from "./model";
import { Timeline } from "./CaseTimeline";
import { buildTimeline } from "./timeline";

function BackLink() {
  return (
    <Link href="/dokumenty" className="inline-flex items-center gap-2 text-label underline decoration-outline underline-offset-4 hover:decoration-on-surface">
      <ArrowLeftIcon size={18} /> Wróć do listy
    </Link>
  );
}

export function CaseDetail({ id }: { id: string }) {
  const { plan, openZusik } = usePlan();
  const stop = plan.stops.find((s) => s.id === id);

  if (!stop || !stop.doc || !stop.state) {
    return (
      <Page>
        <BackLink />
        <PageTitle className="mt-stack">Nie znaleźliśmy tej sprawy</PageTitle>
        <p className="mt-4 max-w-prose text-on-surface-variant">Ta sprawa nie należy do planu „{plan.name}”. Mogła dotyczyć innego dziecka — zmień plan w pasku u góry albo wróć do listy.</p>
      </Page>
    );
  }

  const c = stop as DocCase;
  const status = docStatus(c.state);
  const stages = buildTimeline(c);
  const sentOrLater = stages[0].status === "done";
  const zusik = (field?: string) => openZusik({ planId: plan.id, place: "Dokumenty", stopId: c.id, field, returnTo: `/dokumenty/${c.id}` });

  return (
    <Page className="pb-section-mobile md:pb-section">
      <BackLink />
      <header className="mt-stack flex flex-col gap-2">
        <p className="text-meta text-on-surface-variant">{plan.name}</p>
        <PageTitle>{c.title}</PageTitle>
        <div className="flex flex-wrap items-center gap-2">
          <span>{c.doc.recipient}</span>
          <Tag tone={c.state === "wezwanie" ? "accent" : GROUP_TONE[status.group]}>{status.label}</Tag>
          <Tag>Symulacja</Tag>
          {c.doc.optional && <span className="text-meta text-on-surface-variant">Jeśli chcesz skorzystać</span>}
        </div>
      </header>

      <Panel className="mt-stack max-w-prose" aria-labelledby="teraz">
        <SectionTitle id="teraz">Czy mam teraz coś zrobić?</SectionTitle>
        <NowCard c={c} onZusik={zusik} />
      </Panel>

      {c.howTo && (
        <section aria-labelledby="jak-zlozyc" className="mt-stack max-w-prose">
          <SectionTitle id="jak-zlozyc" className="mb-4 md:mb-6">
            Jak złożyć
          </SectionTitle>
          <dl className="divide-y divide-outline border-y border-outline">
            {(
              [
                ["Co", c.howTo.co],
                ["Do kogo", c.howTo.doKogo],
                ["Do kiedy", c.howTo.doKiedy],
                ["Załączniki", c.howTo.zalaczniki],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="grid gap-1 py-3 md:grid-cols-[10rem_1fr] md:gap-4">
                <dt className="text-meta text-on-surface-variant md:text-body">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {sentOrLater && (
        <section aria-labelledby="przebieg" className="mt-section-mobile md:mt-stack">
          <SectionTitle id="przebieg" className="mb-card">
            Przebieg sprawy
          </SectionTitle>
          <Timeline stages={stages} recipient={c.doc.recipient} />
        </section>
      )}

      <p className="mt-stack text-meta text-on-surface-variant">
        Źródło:{" "}
        <a href={c.source.url} target="_blank" rel="noreferrer" className="underline decoration-outline underline-offset-4 hover:decoration-on-surface">
          {c.source.label}
        </a>
      </p>
    </Page>
  );
}

function NowCard({ c, onZusik }: { c: DocCase; onZusik: (field?: string) => void }) {
  const summons = c.doc.summons;
  if (c.state === "wezwanie" && summons) {
    return (
      <div className="mt-4 flex flex-col gap-4">
        {/* Brak tokenu koloru ostrzeżenia: akcent bursztynowy — do weryfikacji. */}
        <p className="flex items-start gap-2 rounded-sm bg-tertiary p-3">
          <AlertIcon className="mt-0.5 shrink-0" />
          <span>
            <span className="font-medium">Twój krok — uzupełnij dokumenty.</span> Pismo od {summons.from}, termin do {formatLong(summons.due)} ({daysLeftLabel(summons.due)}).
          </span>
        </p>
        <p className="text-on-surface-variant">{summons.text}</p>
        <ul className="flex flex-col gap-2">
          {summons.tasks.map((t) => (
            <li key={t} className="flex items-start gap-2">
              <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-on-surface" />
              {t}
            </li>
          ))}
        </ul>
        <Button className="self-start" onClick={() => onZusik("Uzupełnienie po wezwaniu")}>
          Uzupełnij z Zusikiem
        </Button>
      </div>
    );
  }

  switch (c.state) {
    case "szkic":
    case "aktualna":
    case "wypelniony":
    case "zatwierdzony":
      return (
        <div className="mt-4 flex flex-col gap-4">
          <p>
            {c.state === "aktualna" ? "Tak — ta sprawa czeka na rozpoczęcie." : c.state === "szkic" ? "Tak — szkic jest zapisany, ale niepełny." : c.state === "wypelniony" ? "Tak — sprawdź i zatwierdź wypełniony wniosek." : "Tak — przekaż zatwierdzony wniosek odbiorcy."}
            {c.doc.note && <span className="block text-on-surface-variant">{c.doc.note}</span>}
            {c.due && (
              <span className="block text-on-surface-variant">
                Termin: {formatLong(c.due)} · {daysLeftLabel(c.due)}
              </span>
            )}
          </p>
          {c.doc.hasDraft ? (
            <Button className="self-start" onClick={() => onZusik(c.doc.note)}>
              Dokończ z Zusikiem
            </Button>
          ) : (
            // TODO(backend): utworzenie szkicu sprawy.
            <Button className="self-start">{c.state === "aktualna" ? "Rozpocznij" : c.state === "zatwierdzony" ? "Przekaż" : "Sprawdź i zatwierdź"}</Button>
          )}
        </div>
      );
    case "wyslano": {
      const received = c.doc.events?.some((e) => e.title === "Potwierdzenie wpływu");
      return (
        <div className="mt-4 flex flex-col gap-4">
          <p className="flex items-start gap-2">
            <CheckIcon className="mt-0.5 shrink-0 text-primary" />
            {received ? `Wniosek dotarł do odbiorcy (${c.doc.recipient.replace(/^Do /, "")}). Na razie nic nie musisz robić.` : "Wniosek został przekazany. Czekamy na potwierdzenie wpływu, na razie nic nie musisz robić."}
          </p>
          {received ? (
            <ButtonLink href="#etap-wplyw" variant="secondary" className="self-start">
              Zobacz potwierdzenie
            </ButtonLink>
          ) : (
            <ButtonLink href="#przebieg" variant="secondary" className="self-start">
              Zobacz przebieg sprawy
            </ButtonLink>
          )}
        </div>
      );
    }
    case "warunek":
      return (
        <div className="mt-4 flex flex-col gap-4">
          <p>
            Jeszcze nie. Ta sprawa stanie się aktualna: <span className="font-medium">{(c.condition ?? c.doc.note ?? "po zdarzeniu w planie").toLowerCase()}</span>.
          </p>
          {c.prepare && c.prepare.length > 0 ? (
            <div>
              <p className="mb-2 font-medium">Co przygotować</p>
              <ul className="flex flex-col gap-2">
                {c.prepare.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-on-surface" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            c.dueBasis && <p className="text-on-surface-variant">Termin: {c.dueBasis}.</p>
          )}
        </div>
      );
    default:
      return (
        <div className="mt-4 flex flex-col gap-2">
          <p>Nie, sprawa jest zakończona.</p>
          {(c.doc.result || c.doc.lastEvent) && <p className="text-on-surface-variant">{[c.doc.result, c.doc.lastEvent].filter(Boolean).join(" · ")}</p>}
          {c.state === "nie-korzystam" && <p className="text-on-surface-variant">Oznaczone „Nie korzystam”. Możesz to cofnąć w karcie przystanku na ścieżce.</p>}
        </div>
      );
  }
}
