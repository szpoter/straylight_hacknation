"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePlan } from "@/features/family/PlanProvider";
import { Button, ButtonLink, TextButton } from "@/components/ui/AppButton";
import { cn } from "@/components/ui/cn";
import { Disclosure } from "@/components/ui/Disclosure";
import { FieldError, TextField } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { Tag } from "@/components/ui/Tag";
import { DEMO_TODAY, daysBetween, formatLong, formatShort } from "@/lib/demo/dates";
import type { Plan } from "@/lib/demo/types";
import type { MartaView, Period } from "@/lib/marta/types";
import {
  MAX_WEEKS_EACH,
  NOTICE_DAYS,
  PARENTAL_SOURCE,
  VARIANT_LABEL,
  canSplit,
  computeSplit,
  deadlinePassed,
  defaultInput,
  differenceSentence,
  formatPln,
  parentalStop,
  suggestedStart,
  type LeaveSplit,
  type SplitInput,
  type SplitVariant,
} from "@/lib/plan/leave-split";

/** Wpisy formularza jako tekst — stawka może być w trakcie pisania („140,”). */
type Draft = { start: string; weeks: number; rates: [string, string] };

const VARIANTS: SplitVariant[] = ["together", "sequential"];
const VARIANT_HINT: Record<SplitVariant, string> = {
  together: "Oboje od tego samego dnia",
  sequential: "Najpierw Ty, potem drugi rodzic",
};
// Kolory rodziców jak na osi w poprzednim kalkulatorze: secondary — Ty, tertiary — drugi rodzic.
const BAR = { first: "bg-secondary", second: "bg-tertiary" } as const;

const toText = (rate: number | null) => (rate === null ? "" : String(rate).replace(".", ","));

function toDraft(input: SplitInput): Draft {
  return { start: input.start, weeks: input.weeks, rates: [toText(input.rates[0]), toText(input.rates[1])] };
}

/** „140”, „140,5”, „140,50” → liczba; puste → „nie wiem” (null); reszta → błąd. */
function parseRate(text: string): { value: number | null; error?: string } {
  const t = text.trim().replace(/\s/g, "").replace(",", ".");
  if (!t) return { value: null };
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(t)) return { value: null, error: "Wpisz kwotę, np. 140 albo 140,50." };
  return { value: Number(t) };
}

/** Kalkulator „Jak podzielić urlop rodzicielski?” — liczy reguła Juliana (`lib/marta`). */
export function Calculator() {
  const { plan, leaveSplit } = usePlan();
  const stop = parentalStop(plan);
  if (!stop || stop.state === "minelo") return null;

  return (
    <section id="kalkulator" aria-labelledby="calc-title" className="scroll-mt-24">
      <div className="mb-6 max-w-prose">
        <h2 id="calc-title" className="font-serif text-headline-mobile md:text-headline">
          Jak podzielić urlop rodzicielski?
        </h2>
        <p className="mt-2 text-lead text-on-surface-variant">
          Porównaj dwa warianty: razem albo po kolei. Zobaczysz daty, termin wniosku do pracodawcy i kwotę zasiłku przy podanej stawce.
        </p>
      </div>
      {canSplit(plan) ? (
        <SplitCalculator plan={plan} saved={leaveSplit} />
      ) : (
        <Panel className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <p>
            {stop.state === "nie-korzystam"
              ? "Zaznaczono, że nie korzystasz z urlopu rodzicielskiego w tym planie."
              : "Kalkulator potrzebuje daty porodu, urodzenia albo przyjęcia dziecka."}
          </p>
          {stop.state !== "nie-korzystam" && (
            <ButtonLink href="/start" variant="secondary" size="sm">
              Dodaj dziecko albo ciążę
            </ButtonLink>
          )}
        </Panel>
      )}
    </section>
  );
}

function SplitCalculator({ plan, saved }: { plan: Plan; saved?: LeaveSplit }) {
  const { saveLeaveSplit, clearLeaveSplit } = usePlan();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  // Bez własnych zmian formularz pokazuje zapisany wybór albo podpowiedzi z planu (także po wczytaniu zapisu).
  const form = draft ?? toDraft(defaultInput(plan, saved));
  const update = (patch: Partial<Draft>) => {
    setDraft({ ...form, ...patch });
    setStatus(null);
  };

  const rate0 = parseRate(form.rates[0]);
  const rate1 = parseRate(form.rates[1]);
  const input: SplitInput = { start: form.start, weeks: form.weeks, rates: [rate0.value, rate1.value] };
  const result = useMemo(
    () => (rate0.error || rate1.error ? null : computeSplit(input, plan.name)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- liczymy z wartości, nie z tożsamości obiektu
    [form.start, form.weeks, rate0.value, rate1.value, rate0.error, rate1.error, plan.name],
  );
  const suggested = suggestedStart(plan);
  const showForm = editing || !saved;

  const choose = (variant: SplitVariant) => {
    if (!result?.ok) return;
    saveLeaveSplit({ ...input, variant });
    setEditing(false);
    setDraft(null);
    const v = result.view.variants[variant];
    setStatus(
      `Zapisano wariant „${VARIANT_LABEL[variant]}”. Termin wniosku (${formatLong(v.first.deadline <= v.second.deadline ? v.first.deadline : v.second.deadline)}) jest teraz na ścieżce przy sprawie „Urlop rodzicielski”.`,
    );
  };

  if (!showForm && saved) {
    return (
      <div className="flex flex-col gap-4">
        <SavedSplit plan={plan} saved={saved} onEdit={() => {
            setEditing(true);
            setStatus(null);
          }}
          onClear={() => {
            clearLeaveSplit();
            setStatus(null);
            setDraft(null);
          }} />
        {status && (
          <p role="status" className="rounded-sm bg-secondary p-4">
            {status}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Panel className="flex flex-col gap-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <TextField
              label="Od kiedy zaczynacie?"
              type="date"
              value={form.start}
              onChange={(e) => update({ start: e.target.value })}
              hint={suggested ? `Podpowiedź: ${formatLong(suggested)} — dzień po końcu urlopu macierzyńskiego w tym planie. Możesz wybrać inny dzień.` : undefined}
            />
            {suggested && form.start !== suggested && (
              <TextButton className="self-start" onClick={() => update({ start: suggested })}>
                Wróć do podpowiedzi
              </TextButton>
            )}
          </div>
          <WeeksStepper weeks={form.weeks} onChange={(weeks) => update({ weeks })} />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <TextField
            label="Twoja stawka dzienna (zł)"
            inputMode="decimal"
            autoComplete="off"
            value={form.rates[0]}
            onChange={(e) => update({ rates: [e.target.value, form.rates[1]] })}
            hint="Założenie z danych demo. Puste pole — policzymy same daty."
            error={rate0.error}
          />
          <TextField
            label="Stawka dzienna drugiego rodzica (zł)"
            inputMode="decimal"
            autoComplete="off"
            value={form.rates[1]}
            onChange={(e) => update({ rates: [form.rates[0], e.target.value] })}
            hint="Założenie z danych demo. Puste pole — policzymy same daty."
            error={rate1.error}
          />
        </div>
        {saved && (
          <TextButton className="self-start" onClick={() => {
              setEditing(false);
              setDraft(null);
            }}>
            Anuluj zmiany
          </TextButton>
        )}
      </Panel>

      {result && !result.ok && <FieldError id="calc-error">{result.error}</FieldError>}

      {result?.ok && (
        <div className="flex flex-col gap-4" aria-live="polite">
          <p className="max-w-prose">{differenceSentence(result.view)}</p>
          <div className="grid gap-4 md:grid-cols-2">
            {VARIANTS.map((variant) => (
              <VariantCard key={variant} view={result.view} variant={variant} selected={saved?.variant === variant && !draft} onChoose={() => choose(variant)} />
            ))}
          </div>
        </div>
      )}

      <HowCalculated />
    </div>
  );
}

function WeeksStepper({ weeks, onChange }: { weeks: number; onChange: (weeks: number) => void }) {
  const set = (n: number) => onChange(Math.min(MAX_WEEKS_EACH, Math.max(1, n)));
  return (
    <div className="flex flex-col gap-1.5">
      <p id="weeks-label" className="text-label font-medium">
        Ile tygodni bierze każde z Was?
      </p>
      <p id="weeks-hint" className="text-meta text-on-surface-variant">
        W kalkulatorze oboje bierzecie tyle samo, od 1 do {MAX_WEEKS_EACH} tygodni.
      </p>
      <div role="group" aria-labelledby="weeks-label" aria-describedby="weeks-hint" className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => set(weeks - 1)} disabled={weeks <= 1} aria-label="Mniej o tydzień" className="w-10 px-0!">
          −
        </Button>
        <p className="min-w-32 text-center" aria-live="polite">
          <span className="font-serif text-title">{weeks} tyg.</span> <span className="text-meta text-on-surface-variant">· {weeks * 7} dni</span>
        </p>
        <Button variant="secondary" size="sm" onClick={() => set(weeks + 1)} disabled={weeks >= MAX_WEEKS_EACH} aria-label="Więcej o tydzień" className="w-10 px-0!">
          +
        </Button>
      </div>
    </div>
  );
}

function VariantCard({ view, variant, selected, onChoose }: { view: MartaView; variant: SplitVariant; selected: boolean; onChoose: () => void }) {
  const v = view.variants[variant];
  // Wspólna skala dla obu kart: od startu do końca wariantu „Po kolei” (najdłuższego).
  const scaleStart = view.inputs.firstStart;
  const scaleDays = daysBetween(scaleStart, view.variants.sequential.second.to) + 1;
  const passed = [v.first, v.second].filter((p) => deadlinePassed(p.deadline, DEMO_TODAY));
  return (
    <article className={cn("flex flex-col gap-5 rounded-lg border p-gutter-mobile md:p-card", selected ? "border-2 border-on-surface" : "border-outline")}>
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-title">{VARIANT_LABEL[variant]}</h3>
          <p className="text-meta text-on-surface-variant">{VARIANT_HINT[variant]}</p>
        </div>
        {selected && <Tag tone="ink">Wybrany</Tag>}
      </header>

      <div className="flex flex-col gap-2" aria-hidden="true">
        <Bar label="Ty" period={v.first} start={scaleStart} total={scaleDays} tone={BAR.first} />
        <Bar label="Drugi rodzic" period={v.second} start={scaleStart} total={scaleDays} tone={BAR.second} />
      </div>

      <dl className="flex flex-col divide-y divide-outline border-y border-outline">
        <PeriodRow who="Ty" period={v.first} />
        <PeriodRow who="Drugi rodzic" period={v.second} />
        <div className="flex items-baseline justify-between gap-3 py-3">
          <dt className="text-on-surface-variant">Z dzieckiem w domu</dt>
          <dd className="font-medium">{v.calendarDays} dni</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 py-3">
          <dt className="text-on-surface-variant">Zasiłek łącznie</dt>
          <dd className="font-serif text-title">{v.total === null ? "—" : formatPln(v.total)}</dd>
        </div>
      </dl>
      {v.total === null && <p className="-mt-3 text-meta text-on-surface-variant">Bez stawki obojga nie liczymy kwoty łącznej.</p>}
      {passed.length > 0 && (
        <p className="rounded-sm bg-tertiary p-3 text-meta">
          Termin wniosku {passed.map((p) => formatLong(p.deadline)).filter((d, i, a) => a.indexOf(d) === i).join(" i ")} już minął. Wybierz późniejszą datę startu.
        </p>
      )}
      <Button className="mt-auto" variant={selected ? "secondary" : "primary"} onClick={onChoose}>
        {selected ? "Zostaw ten wariant" : "Wybieram ten wariant"}
      </Button>
    </article>
  );
}

function Bar({ label, period, start, total, tone }: { label: string; period: Period; start: string; total: number; tone: string }) {
  const left = (daysBetween(start, period.from) / total) * 100;
  const width = ((daysBetween(period.from, period.to) + 1) / total) * 100;
  return (
    <div className="grid grid-cols-[6.5rem_1fr] items-center gap-2 text-meta">
      <span className="text-on-surface-variant">{label}</span>
      <div className="relative h-3 rounded-full bg-surface">
        <div className={cn("absolute inset-y-0 rounded-full", tone)} style={{ left: `${left}%`, width: `${width}%` }} />
      </div>
    </div>
  );
}

function PeriodRow({ who, period }: { who: string; period: Period }) {
  return (
    <div className="flex flex-col gap-1 py-3">
      <dt className="flex items-baseline justify-between gap-3">
        <span className="font-medium">{who}</span>
        <span className="text-on-surface-variant">{period.amount === null ? "brak stawki" : formatPln(period.amount)}</span>
      </dt>
      <dd className="text-meta text-on-surface-variant">
        {formatShort(period.from, true)}–{formatShort(period.to, true)} · wniosek do {formatLong(period.deadline)}
      </dd>
    </div>
  );
}

function SavedSplit({ plan, saved, onEdit, onClear }: { plan: Plan; saved: LeaveSplit; onEdit: () => void; onClear: () => void }) {
  const result = computeSplit(saved, plan.name);
  const stop = parentalStop(plan);
  if (!result.ok) {
    return (
      <Panel className="flex flex-col gap-4">
        <p>Zapisany podział ma niepoprawne dane. Policz go jeszcze raz.</p>
        <Button className="self-start" variant="secondary" size="sm" onClick={onClear}>
          Policz od nowa
        </Button>
      </Panel>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <VariantCardStatic view={result.view} variant={saved.variant} />
        <Panel className="flex flex-col gap-4">
          <h3 className="text-label font-medium">Co dalej</h3>
          <ul className="flex flex-col gap-2">
            <li>Termin wniosku jest na ścieżce przy sprawie „Urlop rodzicielski”.</li>
            <li>Wniosek składa się pracodawcy co najmniej {NOTICE_DAYS} dni przed rozpoczęciem urlopu.</li>
          </ul>
          <div className="mt-auto flex flex-wrap gap-3">
            {stop?.doc && (
              <ButtonLink href={`/dokumenty/${stop.id}`} size="sm">
                Zobacz w Dokumentach
              </ButtonLink>
            )}
            <Button variant="secondary" size="sm" onClick={onEdit}>
              Zmień podział
            </Button>
            <TextButton onClick={onClear}>Usuń wybór</TextButton>
          </div>
        </Panel>
      </div>
      <HowCalculated />
    </div>
  );
}

/** Wybrany wariant bez przycisku wyboru (widok po zapisaniu). */
function VariantCardStatic({ view, variant }: { view: MartaView; variant: SplitVariant }) {
  const v = view.variants[variant];
  const scaleStart = view.inputs.firstStart;
  const scaleDays = daysBetween(scaleStart, v.second.to) + 1;
  return (
    <article className="flex flex-col gap-5 rounded-lg border-2 border-on-surface p-gutter-mobile md:p-card">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-title">{VARIANT_LABEL[variant]}</h3>
          <p className="text-meta text-on-surface-variant">
            {VARIANT_HINT[variant]} · {view.inputs.days / 7} tyg. każde
          </p>
        </div>
        <Tag tone="ink">Wybrany</Tag>
      </header>
      <div className="flex flex-col gap-2" aria-hidden="true">
        <Bar label="Ty" period={v.first} start={scaleStart} total={scaleDays} tone={BAR.first} />
        <Bar label="Drugi rodzic" period={v.second} start={scaleStart} total={scaleDays} tone={BAR.second} />
      </div>
      <dl className="flex flex-col divide-y divide-outline border-y border-outline">
        <PeriodRow who="Ty" period={v.first} />
        <PeriodRow who="Drugi rodzic" period={v.second} />
        <div className="flex items-baseline justify-between gap-3 py-3">
          <dt className="text-on-surface-variant">Zasiłek łącznie</dt>
          <dd className="font-serif text-title">{v.total === null ? "—" : formatPln(v.total)}</dd>
        </div>
      </dl>
    </article>
  );
}

function HowCalculated() {
  return (
    <Disclosure summary="Skąd te liczby?" className="border-y border-outline">
      <ul className="flex max-w-prose list-disc flex-col gap-2 pl-5">
        <li>Okres: od daty startu przez podaną liczbę dni. W wariancie „Po kolei” drugi rodzic zaczyna dzień po Twoim ostatnim dniu urlopu.</li>
        <li>Termin wniosku: {NOTICE_DAYS} dni przed startem. Wniosek składa się pracodawcy „w terminie nie krótszym niż 21 dni przed rozpoczęciem” urlopu.</li>
        <li>Oboje rodzice mogą korzystać z urlopu rodzicielskiego jednocześnie.</li>
        <li>Każdemu z rodziców przysługuje 9 tygodni urlopu rodzicielskiego, których nie można przenieść na drugiego rodzica.</li>
        <li>Kwota: stawka dzienna × liczba dni. Stawka to założenie — w wersji demo przykładowa, nie wyliczona z Twojego wynagrodzenia.</li>
        <li>Te same wyliczenia robi Zusik w rozmowie.</li>
      </ul>
      <p className="mt-3 text-meta text-on-surface-variant">
        Źródło:{" "}
        <Link href={PARENTAL_SOURCE.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 decoration-outline hover:decoration-on-surface">
          {PARENTAL_SOURCE.label}
          <span className="sr-only"> (otwiera się w nowej karcie)</span>
        </Link>
      </p>
    </Disclosure>
  );
}
