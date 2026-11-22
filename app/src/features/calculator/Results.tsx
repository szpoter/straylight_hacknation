"use client";

import Link from "next/link";
import { cn } from "@/components/ui/cn";
import { Disclosure } from "@/components/ui/Disclosure";
import { AlertIcon, CheckIcon, InfoIcon } from "@/components/ui/icons";
import { Panel } from "@/components/ui/Panel";
import { Tag } from "@/components/ui/Tag";
import type { BenefitPreset } from "@/lib/plan/benefit-presets";
import { todayInPoland, formatLong, formatShort } from "@/lib/demo/dates";
import { daysBetween } from "@/lib/rules/dates";
import { estimateNet, monthlyPayments, round2, SOURCES, type Message, type ParentId, type Period, type ScenarioResult, type SourceId } from "@/lib/rules/maternity";
import type { CalcForm } from "@/lib/plan/benefit-form";
import { KIND_STYLE, monthLabel, pct, pln } from "./ui";

const WHO: Record<ParentId, string> = { A: "Ty", B: "Drugi rodzic" };

function SourceLink({ id }: { id: SourceId }) {
  const s = SOURCES[id];
  if (!s.url) return <span>{s.label}</span>;
  return (
    <Link href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 decoration-outline hover:decoration-on-surface">
      {s.label}
      <span className="sr-only"> (otwiera się w nowej karcie)</span>
    </Link>
  );
}

function MessageList({ items, tone }: { items: Message[]; tone: "error" | "warning" | "info" }) {
  if (!items.length) return null;
  const Icon = tone === "info" ? InfoIcon : AlertIcon;
  return (
    <ul className={cn("flex flex-col gap-3 rounded-sm p-4 text-meta", tone === "info" ? "bg-surface" : "bg-tertiary")} role={tone === "error" ? "alert" : undefined}>
      {items.map((m, i) => (
        <li key={i} className="flex gap-2">
          <Icon size={18} className="mt-0.5 shrink-0" />
          <span>
            {tone === "info" && <span className="font-medium">Do weryfikacji: </span>}
            {m.text}
            {m.source && (
              <span className="text-on-surface-variant">
                {" "}
                · <SourceLink id={m.source} />
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function Summary({ result, other, form, onSwitchVariant, children }: { result: ScenarioResult; other: ScenarioResult | null; form: CalcForm; onSwitchVariant: () => void; children?: React.ReactNode }) {
  const weeks = result.span ? Math.round(result.span.days / 7) : 0;
  const diff = other && other.ok ? round2(result.totals.all - other.totals.all) : null;
  const net = (gross: number) => estimateNet(gross, { pit2: form.pit2, exempt: form.pitExempt });
  const months = monthlyPayments(result);
  // Szacunek „na rękę” liczony miesiąc po miesiącu (zaliczka od każdej wypłaty).
  const netTotal = round2(months.reduce((acc, m) => acc + net(m.A).net + net(m.B).net, 0));
  return (
    <Panel className="flex flex-col gap-6" aria-live="polite">
      <div className="flex flex-col gap-1">
        <p className="text-meta text-on-surface-variant">Zasiłek macierzyński łącznie, brutto</p>
        <p className="font-serif text-headline-mobile leading-tight">{pln(result.totals.all)}</p>
        <p className="text-meta text-on-surface-variant">Na rękę ok. {pln(netTotal, false)} (szacunek zaliczki na podatek)</p>
      </div>
      {/* Zapis w planie tuż pod kwotą — nad bąbelkiem Zusika w prawym dolnym rogu. */}
      {children}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-5 border-y border-outline py-5">
        <div>
          <dt className="mb-0.5 text-meta text-on-surface-variant">Ty</dt>
          <dd className="font-medium">{pln(result.totals.A)}</dd>
        </div>
        {result.basis.B && (
          <div>
            <dt className="mb-0.5 text-meta text-on-surface-variant">Drugi rodzic</dt>
            <dd className="font-medium">{pln(result.totals.B)}</dd>
          </div>
        )}
        {result.span && (
          <div className="col-span-2">
            <dt className="mb-0.5 text-meta text-on-surface-variant">Z dzieckiem w domu (z zasiłkiem)</dt>
            <dd className="font-medium">
              {weeks} tyg. · {formatLong(result.span.from)} – {formatLong(result.span.to)}
            </dd>
          </div>
        )}
      </dl>
      {diff !== null && (
        <div className="flex flex-col gap-2">
          <p className="text-meta">
            {form.variant === "815" ? "Wariant według rodzaju urlopu" : "Wariant uśredniony"}: <strong>{pln(other!.totals.all)}</strong>{" "}
            <span className="text-on-surface-variant">
              ({diff === 0 ? "tyle samo" : diff > 0 ? `o ${pln(diff)} mniej` : `o ${pln(-diff)} więcej`})
            </span>
          </p>
          <button type="button" onClick={onSwitchVariant} className="self-start text-meta font-medium underline underline-offset-4 decoration-outline hover:decoration-on-surface">
            Pokaż ten wariant
          </button>
        </div>
      )}
    </Panel>
  );
}

export function Problems({ result }: { result: ScenarioResult }) {
  return (
    <>
      <MessageList items={result.errors} tone="error" />
      <MessageList items={result.warnings} tone="warning" />
    </>
  );
}

/** Oś czasu obojga rodziców: okresy w kolorach rodzaju urlopu, wspólna skala. */
export function Timeline({ result }: { result: ScenarioResult }) {
  if (!result.periods.length) return null;
  const from = result.periods.reduce((a, p) => (p.from < a ? p.from : a), result.periods[0].from);
  const to = result.periods.reduce((a, p) => (p.to > a ? p.to : a), result.periods[0].to);
  const total = daysBetween(from, to) + 1;
  const rows: ParentId[] = result.basis.B ? ["A", "B"] : ["A"];
  const kinds = [...new Set(result.periods.map((p) => p.kind))];
  return (
    <Panel className="flex flex-col gap-5">
      <h2 className="font-serif text-title">Oś czasu</h2>
      <div className="flex flex-col gap-4">
        {rows.map((who) => (
          <div key={who} className="grid grid-cols-[6.5rem_1fr] items-center gap-3">
            <span className="text-meta text-on-surface-variant">{WHO[who]}</span>
            <div className="relative h-6 rounded-full bg-surface">
              {result.periods
                .filter((p) => p.parent === who)
                .map((p) => (
                  <div
                    key={p.id}
                    title={`${p.label}: ${formatLong(p.from)} – ${formatLong(p.to)}`}
                    className={cn("absolute inset-y-0 rounded-full border-2 border-background", KIND_STYLE[p.kind].bar, p.work > 0 && "opacity-60")}
                    style={{ left: `${(daysBetween(from, p.from) / total) * 100}%`, width: `${((p.days) / total) * 100}%` }}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-meta text-on-surface-variant">
        <span>{formatShort(from, true)}</span>
        <span>{formatShort(to, true)}</span>
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-2 border-t border-outline pt-4 text-meta">
        {kinds.map((k) => (
          <li key={k} className="flex items-center gap-1.5">
            <span className={cn("inline-block size-3 rounded-full", KIND_STYLE[k].bar)} />
            {KIND_STYLE[k].label}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function PeriodRow({ p, variable }: { p: Period; variable: boolean }) {
  return (
    <li className="flex flex-col gap-1.5 py-4 first:pt-0 last:pb-0">
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-center gap-2 font-medium">
          <span className={cn("inline-block size-3 shrink-0 rounded-full", KIND_STYLE[p.kind].bar)} aria-hidden />
          {p.label}
        </span>
        <span className="shrink-0 font-medium">{pln(p.amount)}</span>
      </div>
      <p className="text-meta text-on-surface-variant">
        {WHO[p.parent]} · {formatShort(p.from, true)}–{formatShort(p.to, true)} · {p.days} dni · {variable ? "stawka zmienna" : pct(p.ratePct)}
        {p.work > 0 && ` · praca ${p.work === 0.5 ? "½" : "¼"} etatu`}{!variable && ` · ${pln(p.daily)} dziennie`}
        {p.topUp > 0 && ` · w tym dopłata: ${pln(p.topUp)}`}
        {p.note && ` · ${p.note}`}
      </p>
    </li>
  );
}

export function Periods({ result }: { result: ScenarioResult }) {
  return (
    <Panel className="flex flex-col gap-5">
      <h2 className="font-serif text-title">Okresy i kwoty</h2>
      <ul className="divide-y divide-outline">
        {result.periods.map((p) => (
          <PeriodRow key={p.id} p={p} variable={result.segments.some(s => s.periodId === p.id && (s.daily !== p.daily || s.ratePct !== p.ratePct))} />
        ))}
      </ul>
    </Panel>
  );
}

export function MonthlyTable({ result, form }: { result: ScenarioResult; form: CalcForm }) {
  const rows = monthlyPayments(result);
  const hasB = Boolean(result.basis.B);
  const net = (g: number) => estimateNet(g, { pit2: form.pit2, exempt: form.pitExempt }).net;
  return (
    <Disclosure summary="Wypłaty miesiąc po miesiącu" summaryClassName="py-4" className="rounded-lg border border-outline px-gutter-mobile pb-2 md:px-card">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[22rem] text-left text-meta">
          <thead className="text-on-surface-variant">
            <tr>
              <th className="pb-2 font-normal">Miesiąc</th>
              <th className="pb-2 pl-3 text-right font-normal">Ty</th>
              {hasB && <th className="pb-2 pl-3 text-right font-normal">Drugi rodzic</th>}
              <th className="pb-2 pl-3 text-right font-normal">Na rękę (szac.)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.month} className="border-t border-outline">
                <td className="py-2.5">{monthLabel(r.month)}</td>
                <td className="py-2.5 pl-3 text-right tabular-nums">{r.A ? pln(r.A) : "—"}</td>
                {hasB && <td className="py-2.5 pl-3 text-right tabular-nums">{r.B ? pln(r.B) : "—"}</td>}
                <td className="py-2.5 pl-3 text-right tabular-nums">{pln(net(r.A) + net(r.B), false)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-meta text-on-surface-variant">
        Wypłata za każdy dzień kalendarzowy: stawka dzienna × liczba dni w miesiącu. Na rękę: zaliczka na podatek 12% zaokrąglona do złotych{form.pit2 ? ", minus 300 zł (PIT-2)" : ""}; składki zdrowotnej od zasiłku się nie pobiera.
      </p>
    </Disclosure>
  );
}

export function Deadlines({ result }: { result: ScenarioResult }) {
  const today = todayInPoland();
  if (!result.deadlines.length) return null;
  return (
    <Panel className="flex flex-col gap-5">
      <h2 className="font-serif text-title">Terminy wniosków</h2>
      <ul className="flex flex-col divide-y divide-outline">
        {result.deadlines.map((d, i) => (
          <li key={i} className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0">
            <span className="flex flex-wrap items-center gap-2 font-medium">
              {formatLong(d.date)}
              {d.date < today && <span className="rounded-full bg-tertiary px-2 text-meta">termin minął</span>}
            </span>
            <span className="text-meta">
              {d.who === "both" ? "Oboje" : WHO[d.who]} · {d.label}
            </span>
            <span className="text-meta text-on-surface-variant">
              <SourceLink id={d.source} />
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** Wzór na przykładzie pierwszego okresu + założenia i źródła (każdy krok z przepisem). */
export function HowCalculated({ result }: { result: ScenarioResult }) {
  const first = result.segments[0];
  const sources: SourceId[] = ["uz36", "uz38", "uz45", "uz48", "uz31", "uz30a", "kp180", "kp182-1a", "kp182-1f", "kp182-3", "kp183", "zalacznik"];
  return (
    <Disclosure summary="Jak to policzyliśmy" summaryClassName="py-4" className="rounded-lg border border-outline px-gutter-mobile pb-2 md:px-card">
      <ol className="flex list-decimal flex-col gap-3 pl-5">
        <li>Podstawa wymiaru: przeciętne miesięczne wynagrodzenie (albo podstawa składki chorobowej) z 12 miesięcy przed miesiącem porodu, po odjęciu składek społecznych. Miesiące przepracowane w mniej niż połowie pomija się.</li>
        <li>Przy umowie o pracę na pełny etat podstawa nie może być niższa niż płaca minimalna po odjęciu składek — i rośnie razem z płacą minimalną.</li>
        <li>
          Stawka dzienna = podstawa × procent ÷ 30, zaokrąglona do grosza.
          {first && (
            <span className="text-on-surface-variant">
              {" "}
              Np. {pln(first.basis)} × {pct(first.ratePct)}
              {first.work > 0 ? ` × ${1 - first.work}` : ""} ÷ 30 = {pln(first.daily)}.
            </span>
          )}
        </li>
        <li>
          Wypłata = stawka dzienna × liczba dni kalendarzowych.
          {first && (
            <span className="text-on-surface-variant">
              {" "}
              Np. {pln(first.daily)} × {first.days} dni ({monthLabel(first.month)}) = {pln(first.amount)}.
            </span>
          )}
        </li>
        <li>Stawka zależy od rodzaju urlopu, wariantu wypłaty i dnia, za który przysługuje zasiłek.</li>
        <li>Gdy zasiłek wychodzi poniżej kwoty świadczenia rodzicielskiego, kalkulator uwzględnia dopłatę (nie dotyczy urlopu ojcowskiego).</li>
        <li>Praca do pół etatu w czasie rodzicielskiego: urlop wydłuża się (np. ½ etatu — dwa razy dłużej), zasiłek maleje o tę część.</li>
      </ol>
      <p className="my-5 text-meta text-on-surface-variant">
        Kalkulator pokazuje kwoty brutto i szacunkowy podatek. O wypłacie rozstrzyga płatnik albo ZUS.
      </p>
      <MessageList items={result.assumptions} tone="info" />
      <ul className="mt-5 flex flex-col gap-2 border-t border-outline pt-5 text-meta">
        {sources.map((id) => (
          <li key={id}>
            <SourceLink id={id} />
          </li>
        ))}
      </ul>
    </Disclosure>
  );
}

export function PresetCheckList({ preset, result }: { preset: BenefitPreset; result: ScenarioResult }) {
  return (
    <Panel className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Tag tone="brand">Sprawa z zestawu ZUS</Tag>
      </div>
      <p className="text-meta">{preset.description}</p>
      <ul className="flex flex-col divide-y divide-outline">
        {preset.checks.map((c) => {
          const ours = c.pick(result);
          const match = ours !== undefined && Math.abs(ours - c.zus) < 0.005;
          return (
            <li key={c.label} className="flex flex-col gap-1 py-3 text-meta first:pt-0 last:pb-0">
              <span className="font-medium">{c.label}</span>
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                ZUS: {pln(c.zus)} · kalkulator: {ours === undefined ? "—" : pln(ours)}
                {match ? (
                  <span className="inline-flex items-center gap-1 font-medium text-primary">
                    <CheckIcon size={16} /> zgodne
                  </span>
                ) : (
                  <span className="font-medium">różnica — zmieniono dane</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
