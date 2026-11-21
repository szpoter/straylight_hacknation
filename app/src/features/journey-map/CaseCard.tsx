"use client";

import Link from "next/link";
import { usePlan } from "@/features/family/PlanProvider";
import { Button, ButtonLink, TextButton } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { Disclosure } from "@/components/ui/Disclosure";
import { AlertIcon, ArrowLeftIcon } from "@/components/ui/icons";
import { Tag } from "@/components/ui/Tag";
import { daysLeftLabel, formatLong } from "@/lib/demo/dates";
import { STOP_DETAILS } from "@/lib/demo/stop-details";
import type { Stop } from "@/lib/demo/types";
import { pathStatus } from "@/lib/plan/status";
import { KIND_LABEL } from "./shared";

/** Blok „Jak złożyć”: Co / Do kogo / Do kiedy / Załączniki. */
export function HowToBlock({ howTo }: { howTo: NonNullable<Stop["howTo"]> }) {
  const rows: Array<[string, string]> = [
    ["Co", howTo.co],
    ["Do kogo", howTo.doKogo],
    ["Do kiedy", howTo.doKiedy],
    ["Załączniki", howTo.zalaczniki],
  ];
  return (
    <div>
      <h3 className="mb-4 text-label font-medium">Jak złożyć</h3>
      <dl className="divide-y divide-outline border-y border-outline">
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
}: {
  stop?: Stop;
  isNearest: boolean;
  onBackToNearest?: () => void;
  headingId?: string;
  /** W panelu od dołu na telefonie: bez nadtytułu sekcji. */
  compact?: boolean;
  /** „none” — tytuł jest już widoczny wyżej (np. w wierszu listy). */
  headingLevel?: "h2" | "none";
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
  const checkable = stop.kind === "informacja" || stop.kind === "program-zdrowotny";
  // Sprawy urzędowe zmieniają stan zdarzeniami (wysyłka, decyzja). Rodzic może je jednak sam
  // oznaczyć jako załatwione albo zrezygnować ze sprawy dobrowolnej (SPEC „Jeden model statusów”).
  const official = stop.kind === "obowiazek" || stop.kind === "na-wniosek";
  const byParent = isPatched(stop.id);
  const optional = stop.kind === "na-wniosek" || stop.doc?.optional;
  const open = official && stop.state !== "zalatwione" && stop.state !== "nie-korzystam";
  const summons = stop.doc?.summons;

  const action = () => {
    const { label, href } = stop.action;
    if (label.startsWith("Dokończ z Zusikiem") || stop.state === "wezwanie") {
      return (
        <Button onClick={() => openZusik({ planId: plan.id, place: "Mój plan", stopId: stop.id, field: stop.doc?.note, returnTo: "/plan" })}>
          {stop.state === "wezwanie" ? "Uzupełnij z Zusikiem" : label}
        </Button>
      );
    }
    if (href?.startsWith("#") || href?.startsWith("/")) return <ButtonLink href={href}>{label}</ButtonLink>;
    return (
      <ButtonLink href={stop.source.url} target="_blank" rel="noopener noreferrer">
        {label}
        <span className="sr-only"> (otwiera się w nowej karcie)</span>
      </ButtonLink>
    );
  };

  return (
    <div className="flex flex-col gap-5">
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
            {stop.due ? ` · do ${formatLong(stop.due)}` : ""}
          </h2>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {stop.due && stop.state !== "zalatwione" && stop.state !== "wyslano" && <Tag tone="accent">{daysLeftLabel(stop.due)}</Tag>}
          <Tag>{byParent && official ? `${status} · oznaczone przez Ciebie` : status}</Tag>
          <Tag>{KIND_LABEL[stop.kind]}</Tag>
          {stop.doc?.optional && <Tag>Jeśli chcesz skorzystać</Tag>}
        </div>
        <p className="mt-3 text-meta text-on-surface-variant">
          {stop.institution} · {stop.forWhom}
        </p>
      </div>

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
            <TextButton className="mt-2">{stop.risk.action}</TextButton>
          </div>
        </div>
      )}

      <p className="max-w-prose">{stop.why}</p>

      {details && (
        <section aria-label="O co chodzi" className="flex max-w-prose flex-col gap-3">
          <h3 className="text-label font-medium">O co chodzi</h3>
          {details.paragraphs.map((p) => (
            <p key={p} className="text-on-surface">
              {p}
            </p>
          ))}
        </section>
      )}

      {stop.kind === "dzieje-sie-samo" && (
        <p className="rounded-sm bg-background p-4">
          <span className="font-medium">Nic nie musisz robić.</span> Zrobi to: {stop.whoDoesIt ?? stop.institution}.
        </p>
      )}

      {(stop.due || stop.dueBasis || stop.condition) && (
        <p className="text-meta">
          <span className="text-on-surface-variant">Od czego liczymy: </span>
          {stop.condition && stop.state === "warunek" ? `${stop.condition}. ` : ""}
          {stop.dueBasis ?? ""}
        </p>
      )}

      {stop.prepare && stop.prepare.length > 0 && (
        <Disclosure summary="Przygotuj" className="border-y border-outline">
          <ul className="list-disc space-y-1 pl-5">
            {stop.prepare.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </Disclosure>
      )}

      {stop.howTo && <HowToBlock howTo={stop.howTo} />}

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
          {action()}
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
        <div className="text-meta text-on-surface-variant">
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
    </div>
  );
}
