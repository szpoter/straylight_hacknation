"use client";

import Link from "next/link";
import { usePlan } from "@/features/family/PlanProvider";
import { Button, ButtonLink, TextButton } from "@/components/ui/AppButton";
import { cn } from "@/components/ui/cn";
import { Disclosure } from "@/components/ui/Disclosure";
import { AlertIcon, ArrowLeftIcon } from "@/components/ui/icons";
import { Tag } from "@/components/ui/Tag";
import { daysLeftLabel, formatLong } from "@/lib/demo/dates";
import { STOP_DETAILS } from "@/lib/demo/stop-details";
import type { Stop } from "@/lib/demo/types";
import { isResolved, pathStatus } from "@/lib/plan/status";
import { KIND_LABEL } from "./shared";

/** Blok „Jak złożyć”: Co / Do kogo / Do kiedy / Załączniki. */
export function HowToBlock({ howTo, hideTitle }: { howTo: NonNullable<Stop["howTo"]>; hideTitle?: boolean }) {
  const rows: Array<[string, string]> = [
    ["Co", howTo.co],
    ["Do kogo", howTo.doKogo],
    ["Do kiedy", howTo.doKiedy],
    ["Załączniki", howTo.zalaczniki],
  ];
  return (
    <div>
      {!hideTitle && <h3 className="mb-4 text-label font-medium">Jak złożyć</h3>}
      <dl className={cn("divide-y divide-outline", !hideTitle && "border-y border-outline")}>
        {rows.map(([label, value]) => (
          <div key={label} className="grid gap-1 py-3 md:grid-cols-[9rem_1fr] md:gap-4">
            <dt className="text-meta text-on-surface-variant">{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/**
 * Karta sprawy pod ścieżką: domyślnie „Najbliższa sprawa”, po kliknięciu przystanku jego treść
 * z „Wróć do najbliższej sprawy” (ui/MACIEJ.md, elementy 3 i 4).
 */
export function CaseCard({
  stop,
  isNearest,
  onBackToNearest,
  headingId,
  compact,
  headingLevel = "h2",
  onLeave,
}: {
  stop?: Stop;
  isNearest: boolean;
  onBackToNearest?: () => void;
  headingId?: string;
  /** W panelu od dołu na telefonie: bez nadtytułu sekcji. */
  compact?: boolean;
  /** „none” — tytuł jest już widoczny wyżej (np. w wierszu listy). */
  headingLevel?: "h2" | "none";
  /** Zamyka panel przystanku przed przejściem do sekcji na stronie (np. „#kalkulator”). */
  onLeave?: () => void;
}) {
  const { plan, patchStop, resetStop, isPatched, openZusik } = usePlan();

  if (!stop) {
    return (
      <div>
        <p className="text-meta text-on-surface-variant">Najbliższa sprawa</p>
        <h2 id={headingId} className="mt-1 font-serif text-title">
          Na dziś masz wszystko załatwione
        </h2>
        <p className="mt-2 text-on-surface-variant">Kolejne sprawy pojawią się na ścieżce, gdy nadejdzie ich czas.</p>
      </div>
    );
  }

  const status = pathStatus(stop);
  // Pełny opis z oficjalnych źródeł: w panelu przystanku i w widoku listy (nie w karcie „Najbliższa sprawa”).
  const details = compact ? STOP_DETAILS[stop.id.replace(/^e-/, "")] : undefined;
  // Etap, który rodzic miał za sobą przy zakładaniu planu: bez działań, tylko wyjaśnienie.
  const past = stop.state === "minelo";
  const checkable = !past && (stop.kind === "informacja" || stop.kind === "program-zdrowotny");
  // Sprawy urzędowe zmieniają stan zdarzeniami (wysyłka, decyzja). Rodzic może je jednak sam
  // oznaczyć jako załatwione albo zrezygnować ze sprawy dobrowolnej (SPEC „Jeden model statusów”).
  const official = stop.kind === "obowiazek" || stop.kind === "na-wniosek";
  // Wysyłka z formularza w Dokumentach to nie ręczne oznaczenie — wtedy bez „Cofnij oznaczenie”.
  const sentFromForm = stop.doc?.events?.some((e) => e.title.startsWith("Wysłano")) ?? false;
  const byParent = isPatched(stop.id) && !sentFromForm;
  const optional = stop.kind === "na-wniosek" || stop.doc?.optional;
  const open = official && !past && stop.state !== "zalatwione" && stop.state !== "nie-korzystam";
  const summons = stop.doc?.summons;

  // Przy sprawie za rodzicem główne działanie przestaje być zielone — nic już nie ponagla.
  const actionVariant = isResolved(stop) ? "secondary" : "primary";
  const action = () => {
    const { label, href } = stop.action;
    if (label.startsWith("Dokończ z Zusikiem") || stop.state === "wezwanie") {
      return (
        <Button variant={actionVariant} onClick={() => {
          onLeave?.();
          openZusik({ planId: plan.id, place: "Mój plan", stopId: stop.id, field: stop.doc?.note, returnTo: "/plan" });
        }}>
          {stop.state === "wezwanie" ? "Zapytaj o wezwanie" : "Zapytaj o ten wniosek"}
        </Button>
      );
    }
    if (href?.startsWith("#")) {
      // Kotwica na tej samej stronie: najpierw zamknij panel, potem przewiń do sekcji.
      const goTo = () => {
        onLeave?.();
        window.setTimeout(() => {
          document.getElementById(href.slice(1))?.scrollIntoView({ behavior: "smooth", block: "start" });
          window.history.replaceState(null, "", href);
        }, 50);
      };
      return (
        <Button variant={actionVariant} onClick={goTo}>
          {label}
        </Button>
      );
    }
    if (href?.startsWith("/")) return (
        <ButtonLink variant={actionVariant} href={href}>
          {label}
        </ButtonLink>
      );
    return (
      <ButtonLink variant={actionVariant} href={stop.source.url} target="_blank" rel="noopener noreferrer">
        {label}
        <span className="sr-only"> (otwiera się w nowej karcie)</span>
      </ButtonLink>
    );
  };

  const done = isResolved(stop);
  const due = stop.due && !done ? `${formatLong(stop.due)} · ${daysLeftLabel(stop.due)}` : stop.due ? formatLong(stop.due) : undefined;
  const basis = [stop.condition && stop.state === "warunek" ? stop.condition : undefined, stop.dueBasis].filter(Boolean).join(". ");
  const facts: Array<[string, string]> = [
    ...(due ? ([["Termin", due]] as Array<[string, string]>) : []),
    ...(basis ? ([[stop.due ? "Od czego liczymy" : "Kiedy", basis]] as Array<[string, string]>) : []),
    [stop.kind === "dzieje-sie-samo" ? "Kto to zrobi" : "Gdzie", stop.kind === "dzieje-sie-samo" ? (stop.whoDoesIt ?? stop.institution) : stop.institution],
    ["Dla kogo", stop.forWhom],
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className={cn(headingLevel === "none" && "hidden")}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          {!compact && <p className="text-meta text-on-surface-variant">{isNearest ? "Najbliższa sprawa" : "Wybrany przystanek"}</p>}
          {!isNearest && onBackToNearest && (
            <TextButton onClick={onBackToNearest} className="inline-flex items-center gap-1.5 text-meta">
              <ArrowLeftIcon size={16} /> Wróć do najbliższej sprawy
            </TextButton>
          )}
        </div>
        {headingLevel === "h2" && (
          <h2 id={headingId} className="mt-1 font-serif text-title">
            {stop.title}
          </h2>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Tag tone={done ? "brand" : stop.due ? "accent" : "neutral"}>{byParent && official ? `${status} · oznaczone przez Ciebie` : status}</Tag>
          <Tag>{KIND_LABEL[stop.kind]}</Tag>
          {stop.doc?.optional && <Tag>Jeśli chcesz skorzystać</Tag>}
        </div>
      </div>

      {/* Najpierw jedno zdanie „po co”, potem najważniejsze fakty w jednym miejscu. */}
      <p className="max-w-prose text-lead">{stop.why}</p>

      <dl className="grid gap-x-6 gap-y-3 rounded-sm bg-surface p-4 sm:grid-cols-2">
        {facts.map(([label, value]) => (
          <div key={label} className="flex min-w-0 flex-col gap-0.5">
            <dt className="text-meta text-on-surface-variant">{label}</dt>
            <dd className={cn(label === "Termin" && !done && "font-medium")}>{value}</dd>
          </div>
        ))}
      </dl>

      {stop.sharedGroup && plan.family && (
        <p className="rounded-sm bg-surface p-4">
          <span className="font-medium">Wspólna sprawa: {plan.family.names.join(" i ")}.</span> To jeden wniosek — gdy go oznaczysz, zmieni się we
          wszystkich planach.
        </p>
      )}

      {stop.notes?.map((note) => (
        <div key={note.text} className="flex flex-col gap-1 border-l-2 border-primary pl-4">
          <p>{note.text}</p>
          <p className="text-meta text-on-surface-variant">
            Źródło:{" "}
            {note.sources.map((src, i) => (
              <span key={src.url}>
                {i > 0 && " · "}
                <Link href={src.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 decoration-outline hover:decoration-on-surface">
                  {src.label}
                  <span className="sr-only"> (otwiera się w nowej karcie)</span>
                </Link>
              </span>
            ))}
          </p>
        </div>
      ))}

      {summons && (
        <div className="rounded-sm border border-on-surface bg-tertiary p-4">
          {/* Kolor ostrzeżenia bez tokenu — bursztyn, do weryfikacji. */}
          <p className="font-medium">Nowe pismo z {summons.from} · termin do {formatLong(summons.due)}</p>
          <p className="mt-1">{summons.text}</p>
        </div>
      )}

      {stop.risk && (
        <div className="flex gap-3 rounded-sm border border-on-surface bg-tertiary p-4">
          <AlertIcon className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">{stop.risk.title}</p>
            <p className="mt-1">{stop.risk.detail}</p>
            {stop.risk.sources?.[0] ? (
              <Link
                href={stop.risk.sources[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block font-medium underline underline-offset-4 decoration-on-surface-variant hover:decoration-on-surface"
              >
                {stop.risk.action}
                <span className="sr-only"> (otwiera się w nowej karcie)</span>
              </Link>
            ) : (
              <TextButton className="mt-2">{stop.risk.action}</TextButton>
            )}
            {stop.risk.sources?.[0] && <p className="mt-1 text-meta">Źródło: {stop.risk.sources[0].label}</p>}
          </div>
        </div>
      )}

      {past && (
        <p className="rounded-sm bg-surface p-4">
          <span className="font-medium">Ten etap masz już za sobą.</span> Pokazujemy go, żeby było widać całą drogę. Jeśli coś z niego wciąż Cię dotyczy, zapytaj Zusika.
        </p>
      )}

      {stop.kind === "dzieje-sie-samo" && !past && (
        <p>
          <span className="font-medium">Nic nie musisz robić.</span> Zrobi to: {stop.whoDoesIt ?? stop.institution}.
        </p>
      )}

      {/* Działania: wszystkie tej samej wielkości; na telefonie jeden pod drugim na całą szerokość. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap [&>*]:justify-center">
        {!past && action()}
        {checkable && (
          <Button variant="secondary" onClick={() => patchStop(stop.id, { checked: !stop.checked })}>
            {stop.checked ? "Cofnij odhaczenie" : "Odhacz"}
          </Button>
        )}
        {open && (
          <Button variant="secondary" onClick={() => patchStop(stop.id, { state: "zalatwione" })}>
            Oznacz jako załatwione
          </Button>
        )}
        {open && optional && (
          <Button variant="secondary" onClick={() => patchStop(stop.id, { state: "nie-korzystam" })}>
            Nie korzystam
          </Button>
        )}
        {official && byParent && (
          <Button variant="secondary" onClick={() => resetStop(stop.id)}>
            Cofnij oznaczenie
          </Button>
        )}
      </div>

      {details && (
        <section aria-label="O co chodzi" className="flex max-w-prose flex-col gap-3 border-t border-outline pt-6">
          <h3 className="font-serif text-title">O co chodzi</h3>
          <ul className="flex flex-col gap-3">
            {details.paragraphs.map((p) => (
              <li key={p} className="flex gap-3">
                <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {((stop.prepare && stop.prepare.length > 0) || stop.howTo) && (
        <div className="flex flex-col">
          {stop.prepare && stop.prepare.length > 0 && (
            <Disclosure summary="Co przygotować" className="border-t border-outline">
              <ul className="list-disc space-y-1 pl-5">
                {stop.prepare.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </Disclosure>
          )}
          {stop.howTo && (
            <Disclosure summary="Jak złożyć" className="border-y border-outline" defaultOpen={!compact}>
              <HowToBlock howTo={stop.howTo} hideTitle />
            </Disclosure>
          )}
        </div>
      )}

      <div className="text-meta text-on-surface-variant">
        {compact && (
          <p className="mb-3">
            Trudna sytuacja?{" "}
            <Link href="/wsparcie" className="underline underline-offset-4 decoration-outline hover:decoration-on-surface">
              Zobacz wsparcie
            </Link>
          </p>
        )}
        <p>{details ? `Podstawa (sprawdzone ${formatLong(details.checked)}):` : "Źródło:"}</p>
        <ul className="mt-1 flex flex-col gap-1">
          {(details?.sources ?? [stop.source]).map((src) => (
            <li key={src.url}>
              <Link href={src.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 decoration-outline hover:decoration-on-surface">
                {src.label}
                <span className="sr-only"> (otwiera się w nowej karcie)</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
