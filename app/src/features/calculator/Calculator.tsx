"use client";

import { useMemo, useState } from "react";
import { usePlan } from "@/features/family/PlanProvider";
import { Button, TextButton } from "@/components/ui/AppButton";
import { cn } from "@/components/ui/cn";
import { Disclosure } from "@/components/ui/Disclosure";
import { Panel } from "@/components/ui/Panel";
import { Segmented } from "@/components/ui/Segmented";
import { Tag } from "@/components/ui/Tag";
import { daysBetween, formatMoney, formatShort } from "@/lib/demo/dates";
import type { CalculatorPlan, Parent } from "@/lib/demo/types";
import { compareHeadline, poolState, summarize, type SegmentResult, type VariantSummary } from "./summary";

const KIND: Record<SegmentResult["kind"], string> = { macierzynski: "macierzyński", rodzicielski: "rodzicielski", ojcowski: "ojcowski" };
const PARENT_BAR: Record<Parent["id"], string> = { ty: "bg-secondary", partner: "bg-tertiary" };

/** Kalkulator „Ile czasu i jaki zasiłek?” (ui/MACIEJ.md, element 5). */
export function Calculator() {
  const { plan } = usePlan();
  const calc = plan.calculator;
  const [compare, setCompare] = useState(false);
  const [mobileVariant, setMobileVariant] = useState<"A" | "B">("A");
  const [payment, setPayment] = useState<"815" | "100-70">("815");
  const [saved, setSaved] = useState<string | null>(null);
  const [editNote, setEditNote] = useState(false);

  const summaries = useMemo(() => calc.variants.map((v) => ({ variant: v, summary: summarize(calc, v) })), [calc]);
  const a = summaries[0];
  const b = summaries[1];
  const canCompare = Boolean(b);
  const comparing = compare && canCompare;
  const active = comparing && mobileVariant === "B" ? b! : a;
  const pool = poolState(calc, a.summary);
  const diff = comparing ? compareHeadline(a.summary, b!.summary) : null;
  const scale = useMemo(() => timeScale(summaries.flatMap((s) => s.summary.segments)), [summaries]);

  return (
    <section id="kalkulator" aria-labelledby="calc-title" className="scroll-mt-24">
      <div className="mb-6">
        <h2 id="calc-title" className="font-serif text-headline-mobile md:text-headline">
          Ile czasu i jaki zasiłek?
        </h2>
        <p className="mt-2 text-on-surface-variant">
          {calc.scope}
          {calc.planned && " · daty planowane"}
        </p>
      </div>

      <Panel className="flex flex-col gap-6">
        {/* Podsumowanie (różnica przy porównaniu) */}
        {diff ? (
          <div className="flex flex-col gap-3" aria-live="polite">
            <p className="font-serif text-title">{diff.headline}</p>
            <p className="text-on-surface-variant">{diff.sentence}</p>
            <Segmented
              label="Pokazany wariant"
              className="md:hidden"
              value={mobileVariant}
              onChange={setMobileVariant}
              options={[
                { value: "A", label: "Wariant A" },
                { value: "B", label: "Wariant B" },
              ]}
            />
          </div>
        ) : (
          <SummaryNumbers summary={a.summary} />
        )}

        {/* Karta puli — na komputerze na górze, na telefonie pod odcinkami */}
        <PoolCard calc={calc} summary={a.summary} headline={pool.headline} kind={pool.kind} className="order-3 md:order-none" />

        <Disclosure
          summary={
            <span>
              <span className="text-on-surface-variant">Założenia: </span>
              {calc.assumptions} · <span className="underline underline-offset-4 decoration-outline">zmień</span>
            </span>
          }
          className="order-4 rounded-sm border border-outline px-4 md:order-none"
        >
          <ul className="flex flex-col gap-1 text-meta">
            <li>Liczba dzieci z jednego porodu: 1</li>
            <li>Zaświadczenie „Za życiem”: nie</li>
            <li>Hospitalizacja lub wcześniactwo: nie</li>
          </ul>
          <p className="mt-2 text-meta text-on-surface-variant">Zmiana założeń przeliczy wariant. {/* TODO(backend): lib/rules */}</p>
        </Disclosure>

        <div className="flex flex-col gap-2">
          <p className="text-label font-medium" id="payment-label">
            Sposób wypłaty
          </p>
          <Segmented
            label="Sposób wypłaty"
            value={payment}
            onChange={setPayment}
            options={[
              { value: "815", label: "81,5% przez cały okres" },
              { value: "100-70", label: "100%, potem 70%" },
            ]}
          />
          <p className="text-meta text-on-surface-variant">Wniosek o 81,5% składa się do 21 dni po porodzie. Stawki w przykładzie są już ustalone.</p>
        </div>

        {/* Osie rodziców: desktop wspólna skala, przy porównaniu dwie kolumny */}
        <div className={cn("hidden gap-6 md:grid", comparing && "lg:grid-cols-2")}>
          {(comparing ? summaries : [a]).map(({ variant, summary }) => (
            <div key={variant.id}>
              {comparing && (
                <p className="mb-2 font-medium">
                  Wariant {variant.id} · {variant.label}
                </p>
              )}
              <Tracks summary={summary} calc={calc} scale={scale} />
            </div>
          ))}
        </div>

        {/* Telefon: uproszczona jedna oś i karty odcinków */}
        <div className="flex flex-col gap-3 md:hidden">
          <MiniAxis summary={active.summary} scale={scale} />
          <ul className="flex flex-col gap-2">
            {active.summary.segments.map((s) => (
              <li key={s.id} className={cn("rounded-sm border p-4", s.draft ? "border-dashed border-on-surface-variant" : "border-outline")}>
                <SegmentText s={s} />
              </li>
            ))}
          </ul>
        </div>

        <Disclosure summary="Skąd ta kwota?" className="border-y border-outline">
          <table className="w-full text-left text-meta">
            <thead className="text-on-surface-variant">
              <tr>
                <th className="py-1 font-normal">Osoba</th>
                <th className="py-1 font-normal">Stawka dzienna</th>
                <th className="py-1 font-normal">Dni</th>
                <th className="py-1 text-right font-normal">Suma</th>
              </tr>
            </thead>
            <tbody>
              {active.summary.segments
                .filter((s) => s.kind === "rodzicielski")
                .map((s) => (
                  <tr key={s.id} className="border-t border-outline">
                    <td className="py-2">{s.parent.label}</td>
                    <td className="py-2">{s.parent.dailyRate ? formatMoney(s.parent.dailyRate) : "brak podstawy"}</td>
                    <td className="py-2">{s.days}</td>
                    <td className="py-2 text-right">{s.amount !== undefined ? formatMoney(s.amount) : "—"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <p className="mt-2 text-meta text-on-surface-variant">Źródło: przykładowe stawki brutto z danych demo. Kwota dzienna to 1/30 miesięcznego zasiłku.</p>
        </Disclosure>

        <div className="order-5 flex flex-col gap-3 md:order-none md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" size="sm" onClick={() => setEditNote((v) => !v)} aria-expanded={editNote}>
              Zmień wariant
            </Button>
            {canCompare && (
              <Button variant="secondary" size="sm" onClick={() => setCompare((v) => !v)} aria-pressed={comparing}>
                {comparing ? "Pokaż jeden wariant" : "Porównaj wariant"}
              </Button>
            )}
          </div>
          <Button
            onClick={() => setSaved(`Zapisano wariant ${active.variant.id} w planie ${plan.name}. Terminy na ścieżce zaktualizują się po podłączeniu reguł.`)}
            disabled={pool.kind === "over"}
          >
            Użyj tego wariantu w planie
          </Button>
        </div>
        {editNote && (
          <p className="order-5 rounded-sm bg-background p-4 text-meta md:order-none">
            Edycja odcinków (osoba, początek, długość, „Kolejno” / „W tym samym czasie”) pojawi się po podłączeniu kalkulatora reguł. {/* TODO(backend) */}
          </p>
        )}
        {saved && (
          <p role="status" className="order-5 rounded-sm bg-secondary p-4 md:order-none">
            {saved}
          </p>
        )}
      </Panel>
    </section>
  );
}

function SummaryNumbers({ summary }: { summary: VariantSummary }) {
  const weeks = Math.round(summary.calendarDays / 7);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <p className="text-meta text-on-surface-variant">Czas opieki w kalendarzu</p>
        <p className="font-serif text-headline-mobile">
          {weeks} tyg. <span className="text-title text-on-surface-variant">· {summary.calendarDays} dni</span>
        </p>
      </div>
      <div>
        <p className="text-meta text-on-surface-variant">Szacowany zasiłek łącznie · brutto</p>
        <p className="font-serif text-headline-mobile">{formatMoney(summary.total)}</p>
        {!summary.complete && <p className="text-meta text-on-surface-variant">Znana część. Suma rodziny czeka na komplet danych.</p>}
      </div>
    </div>
  );
}

function PoolCard({
  calc,
  summary,
  headline,
  kind,
  className,
}: {
  calc: CalculatorPlan;
  summary: VariantSummary;
  headline: string;
  kind: "left" | "full" | "over";
  className?: string;
}) {
  const total = calc.poolWeeks;
  const pct = (w: number) => `${Math.max(0, Math.min(100, (w / total) * 100))}%`;
  const shared = total - calc.reservedWeeksEach * 2;
  return (
    <div className={cn("rounded-sm border border-outline p-4", kind === "over" && "border-2 border-on-surface", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-medium">{headline}</p>
        {kind === "over" && <Tag tone="accent">Popraw odcinek</Tag>}
        <p className="text-meta text-on-surface-variant">Pula urlopu rodzicielskiego: {total} tyg.</p>
      </div>
      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-background" aria-hidden>
        <span className="bg-on-surface-variant" style={{ width: pct(calc.usedWeeks) }} />
        <span className="bg-secondary" style={{ width: pct(summary.plannedWeeksBy.ty) }} />
        <span className="bg-tertiary" style={{ width: pct(summary.plannedWeeksBy.partner) }} />
      </div>
      <Disclosure summary="Jak dzieli się pula" className="mt-1">
        <ul className="flex flex-col gap-1 text-meta">
          <li>Zarezerwowane dla Ciebie: {calc.reservedWeeksEach} tyg. · w wariancie {summary.plannedWeeksBy.ty} tyg.</li>
          <li>Zarezerwowane dla drugiego rodzica: {calc.reservedWeeksEach} tyg. · w wariancie {summary.plannedWeeksBy.partner} tyg.</li>
          <li>Wspólne: {shared} tyg.</li>
          <li>Wykorzystano wcześniej: {calc.usedWeeks} tyg.</li>
          <li>Urlop ojcowski ma osobny tor i nie zużywa puli.</li>
        </ul>
      </Disclosure>
    </div>
  );
}

type Scale = { start: string; days: number; months: Array<{ iso: string; label: string }> };

const MONTH_SHORT = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

function timeScale(segments: SegmentResult[]): Scale {
  const starts = segments.map((s) => s.start).sort();
  const ends = segments.map((s) => s.end).sort();
  const first = starts[0] ?? "2026-01-01";
  const start = `${first.slice(0, 7)}-01`;
  const lastEnd = ends[ends.length - 1] ?? first;
  const [ly, lm] = lastEnd.split("-").map(Number);
  const endIso = lm === 12 ? `${ly + 1}-01-01` : `${ly}-${String(lm + 1).padStart(2, "0")}-01`;
  const months: Scale["months"] = [];
  let [y, m] = start.split("-").map(Number);
  while (`${y}-${String(m).padStart(2, "0")}-01` < endIso) {
    months.push({ iso: `${y}-${String(m).padStart(2, "0")}-01`, label: MONTH_SHORT[m - 1] + (m === 1 ? ` ${y}` : "") });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return { start, days: daysBetween(start, endIso), months };
}

const pos = (scale: Scale, iso: string) => `${(daysBetween(scale.start, iso) / scale.days) * 100}%`;

/** Dwie osie rodziców na wspólnej skali miesięcy; ojcowski na osobnym torze. */
function Tracks({ summary, calc, scale }: { summary: VariantSummary; calc: CalculatorPlan; scale: Scale }) {
  const tracks = calc.parents.flatMap((p) => {
    const own = summary.segments.filter((s) => s.parentId === p.id);
    const main = own.filter((s) => s.kind !== "ojcowski");
    const paternal = own.filter((s) => s.kind === "ojcowski");
    return [
      ...(main.length ? [{ key: `${p.id}-main`, label: p.label, segments: main }] : []),
      ...(paternal.length ? [{ key: `${p.id}-ojc`, label: `${p.label} · ojcowski`, segments: paternal }] : []),
    ];
  });
  return (
    <div className="flex flex-col gap-1">
      <div className="relative ml-36 h-6 border-b border-outline text-meta text-on-surface-variant">
        {scale.months.map((m) => (
          <span key={m.iso} className="absolute top-0 border-l border-outline pl-1" style={{ left: pos(scale, m.iso) }}>
            {m.label}
          </span>
        ))}
      </div>
      {tracks.map((t) => (
        <div key={t.key} className="flex items-start gap-0 border-b border-outline py-4">
          <span className="w-36 shrink-0 pr-3 text-meta font-medium">{t.label}</span>
          <div className="relative min-h-20 flex-1">
            {t.segments.map((s) => {
              const startPct = daysBetween(scale.start, s.start) / scale.days;
              // Odcinek w prawej połowie osi: podpis wyrównany do jego prawego końca, żeby nie wychodził poza kartę.
              const alignRight = startPct > 0.5;
              return (
                <div key={s.id} className="absolute top-0" style={{ left: pos(scale, s.start), width: `max(${(s.days / scale.days) * 100}%, 8px)` }}>
                  <div className={cn("h-3 rounded-full", s.draft ? "border border-dashed border-on-surface-variant bg-surface" : PARENT_BAR[s.parentId])} />
                  <div className={cn("absolute top-full mt-2 w-max max-w-72", alignRight ? "right-0 text-right" : "left-0")}>
                    <SegmentText s={s} compact />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniAxis({ summary, scale }: { summary: VariantSummary; scale: Scale }) {
  return (
    <div>
      <div className="relative h-3 rounded-full bg-background" aria-hidden>
        {summary.segments.map((s) => (
          <span
            key={s.id}
            className={cn("absolute top-0 h-3 rounded-full", s.draft ? "border border-dashed border-on-surface-variant" : PARENT_BAR[s.parentId], s.parentId === "partner" && !s.draft && "opacity-90")}
            style={{ left: pos(scale, s.start), width: `${(s.days / scale.days) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-1 flex justify-between text-meta text-on-surface-variant">
        <span>{scale.months[0]?.label}</span>
        <span>{scale.months[scale.months.length - 1]?.label}</span>
      </div>
    </div>
  );
}

function SegmentText({ s, compact }: { s: SegmentResult; compact?: boolean }) {
  const weeks = s.days / 7;
  return (
    <p className={cn("text-meta", compact && "leading-snug")}>
      {!compact && <span className="font-medium">{s.parent.label} · </span>}
      <span className={cn(compact && "font-medium")}>{KIND[s.kind]}</span> · <span className="whitespace-nowrap">{formatShort(s.start)}–{formatShort(s.end)}</span> ·{" "}
      <span className="whitespace-nowrap">{weeks} tyg.</span>
      {compact ? <br /> : " · "}
      {s.draft ? (
        <span className="text-on-surface-variant">{s.note}</span>
      ) : s.amount !== undefined ? (
        formatMoney(s.amount)
      ) : (
        <TextButton className="text-meta">Uzupełnij podstawę</TextButton>
      )}
    </p>
  );
}
