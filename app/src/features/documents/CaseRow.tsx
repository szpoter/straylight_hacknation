"use client";

import { ButtonLink, Button, Tag } from "@/components/ui";
import { usePlan } from "@/features/family/PlanProvider";
import { docStatus } from "@/lib/plan/status";
import { GROUP_TONE, rowAction, rowDetail, type DocCase } from "./model";

/** Wiersz sprawy: tytuł → status → odbiorca → termin/zdarzenie → jedno działanie (drugorzędne). */
export function CaseRow({ c }: { c: DocCase }) {
  const { plan, openZusik } = usePlan();
  const status = docStatus(c.state);
  const action = rowAction(c);
  const detail = rowDetail(c);

  return (
    <li className="flex flex-col gap-3 rounded-lg border border-outline bg-surface p-gutter-mobile md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)_16rem] md:items-center md:gap-6 md:rounded-none md:border-x-0 md:border-t-0 md:bg-transparent md:px-0 md:py-5">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-medium">{c.title}</span>
        <span className="flex flex-wrap items-center gap-2">
          <Tag tone={c.state === "wezwanie" ? "accent" : GROUP_TONE[status.group]}>{status.label}</Tag>
          {c.doc.optional && <span className="text-meta text-on-surface-variant">Jeśli chcesz skorzystać</span>}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-0.5 text-meta">
        <span>{c.doc.recipient}</span>
        {detail && <span className="text-on-surface-variant">{detail}</span>}
      </div>
      <div className="md:justify-self-end">
        {action.kind === "zusik" ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openZusik({ planId: plan.id, place: "Dokumenty", stopId: c.id, field: c.doc.note, returnTo: "/dokumenty" })}
          >
            {action.label}
            <span className="sr-only">: {c.title}</span>
          </Button>
        ) : (
          <ButtonLink variant="secondary" size="sm" href={`/dokumenty/${c.id}`}>
            {action.label}
            <span className="sr-only">: {c.title}</span>
          </ButtonLink>
        )}
      </div>
    </li>
  );
}
