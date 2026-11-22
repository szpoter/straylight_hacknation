"use client";

import Link from "next/link";
import { ButtonLink, Button, ChevronRightIcon, Tag } from "@/components/ui";
import { usePlan } from "@/features/family/PlanProvider";
import { docStatus } from "@/lib/plan/status";
import { GROUP_TONE, rowAction, rowDetail, type DocCase } from "./model";

/**
 * Wiersz sprawy: tytuł → status → odbiorca → termin/zdarzenie → jedno działanie (drugorzędne).
 * Cały wiersz prowadzi do szczegółów sprawy (link na tytule rozciągnięty na wiersz); przycisk
 * działania leży nad nim. Przyciski mają jedną szerokość, żeby kolumna była równa.
 */
export function CaseRow({ c }: { c: DocCase }) {
  const { plan, openZusik } = usePlan();
  const status = docStatus(c.state);
  const action = rowAction(c);
  const detail = rowDetail(c);

  return (
    <li className="group relative flex flex-col gap-3 rounded-lg transition-colors hover:bg-surface border border-outline bg-background p-gutter-mobile md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_16rem] md:items-center md:gap-6 md:rounded-none md:border-x-0 md:border-t-0 md:bg-transparent md:px-3 md:py-5 md:hover:bg-surface">
      <div className="flex min-w-0 flex-col gap-1">
        <Link href={`/dokumenty/${c.id}`} className="font-medium after:absolute after:inset-0 after:rounded-lg after:content-[''] group-hover:underline group-hover:underline-offset-4 md:after:rounded-none">
          {c.title}
        </Link>
        <span className="flex flex-wrap items-center gap-2">
          <Tag tone={c.state === "wezwanie" ? "accent" : GROUP_TONE[status.group]}>{status.label}</Tag>
          {c.doc.optional && <span className="text-meta text-on-surface-variant">Jeśli chcesz skorzystać</span>}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5 text-meta">
        <span>{c.doc.recipient}</span>
        {detail && <span className="text-on-surface-variant">{detail}</span>}
      </div>
      <div className="relative z-10 flex items-center gap-3 md:justify-self-stretch">
        {action.kind === "zusik" ? (
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-center bg-background"
            onClick={() => openZusik({ planId: plan.id, place: "Dokumenty", stopId: c.id, field: c.doc.note, returnTo: "/dokumenty" })}
          >
            {action.label}
            <span className="sr-only">: {c.title}</span>
          </Button>
        ) : (
          <ButtonLink variant="secondary" size="sm" className="w-full justify-center bg-background" href={`/dokumenty/${c.id}${action.step ? `?krok=${action.step}` : ""}`}>
            {action.label}
            <span className="sr-only">: {c.title}</span>
          </ButtonLink>
        )}
        <ChevronRightIcon aria-hidden className="hidden shrink-0 text-on-surface-variant md:block" />
      </div>
    </li>
  );
}
