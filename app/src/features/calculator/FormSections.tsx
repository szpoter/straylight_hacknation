"use client";

import { useRuleSchedule } from "@/features/family/RuleScheduleContext";
import { maternityParametersOn } from "@/lib/rules/maternity-schedule";
import Link from "next/link";
import { cn } from "@/components/ui/cn";
import { FieldError, TextField } from "@/components/ui/Field";
import { Panel } from "@/components/ui/Panel";
import { Segmented } from "@/components/ui/Segmented";
import { formatLong } from "@/lib/demo/dates";
import { addDays } from "@/lib/rules/dates";
import { basisMonthLabels, basisOn, limitsFor, type BasisResult, type EventKind, type InsuranceTitle } from "@/lib/rules/maternity";
import { supplementaryWeeks, type BasisMode, type CalcForm, type FormProblem, type ParentForm } from "@/lib/plan/benefit-form";
import { Check, monthLabel, pln, Stepper, weeksUnit } from "./ui";

type Update = (patch: Partial<CalcForm>) => void;

function SectionHead({ n, title, lead }: { n: number; title: string; lead?: string }) {
  return (
    <div className="flex items-start gap-3">
      <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-on-surface text-meta font-medium text-on-primary">
        {n}
      </span>
      <div>
        <h2 className="font-serif text-title">{title}</h2>
        {lead && <p className="mt-1 text-meta text-on-surface-variant">{lead}</p>}
      </div>
    </div>
  );
}

const problemFor = (problems: FormProblem[], field: string) => problems.find((p) => p.field === field)?.text;

// ---------- 1. Sytuacja ----------

export function SituationSection({ form, update, problems }: { form: CalcForm; update: Update; problems: FormProblem[] }) {
  const schedule = useRuleSchedule();
  const dateLabel = form.event === "birth" ? "Data porodu (albo przewidywana)" : form.event === "adoption" ? "Data przyjęcia dziecka i wniosku do sądu" : "Data przyjęcia dziecka do rodziny zastępczej";
  const sup = supplementaryWeeks(form);
  return (
    <Panel className="flex flex-col gap-8">
      <SectionHead n={1} title="Sytuacja" lead="Od niej zależy długość urlopów." />
      <Segmented<EventKind>
        fill
        label="Sytuacja"
        value={form.event}
        onChange={(event) => update({ event, weeksBeforeBirth: 0 })}
        options={[
          { value: "birth", label: "Urodzenie" },
          { value: "adoption", label: "Adopcja" },
          { value: "foster", label: "Rodzina zastępcza" },
        ]}
      />
      <div className="grid items-start gap-6 md:grid-cols-2">
        <TextField label={dateLabel} type="date" value={form.date} onChange={(e) => update({ date: e.target.value })} error={problemFor(problems, "date")} />
        {form.event !== "birth" && (
          <TextField
            label="Data urodzenia dziecka"
            hint={form.event === "adoption" ? "Urlop przysługuje do 14. roku życia dziecka." : "Urlop przysługuje do 7. roku życia (10. przy odroczonym obowiązku szkolnym)."}
            type="date"
            value={form.childBirthDate}
            onChange={(e) => update({ childBirthDate: e.target.value })}
            error={problemFor(problems, "childBirthDate")}
          />
        )}
      </div>
      {form.event === "foster" && <Check label="Odroczony obowiązek szkolny" checked={form.schoolDeferred} onChange={(schoolDeferred) => update({ schoolDeferred })} />}
      <div className="flex flex-col gap-3">
        <p className="text-label font-medium">{form.event === "birth" ? "Liczba dzieci z jednego porodu" : "Liczba dzieci przyjętych jednocześnie"}</p>
        <Segmented
          fill
          label="Liczba dzieci"
          value={String(form.children)}
          onChange={(v) => {
            const children = Number(v);
            const l = limitsFor({ ...form, children }, schedule);
            update({ children, parentalWeeksA: Math.min(form.parentalWeeksA, l.maxParentalOneParent) });
          }}
          options={["1", "2", "3", "4", "5"].map((v) => ({ value: v, label: v === "5" ? "5+" : v }))}
        />
        <p className="text-meta text-on-surface-variant">
          Urlop {form.event === "birth" ? "macierzyński" : "na warunkach macierzyńskiego"}: {limitsFor(form, schedule).maternityWeeks} tyg. · rodzicielski: {limitsFor(form, schedule).parentalPoolWeeks} tyg. dla Was obojga.
        </p>
      </div>
      <div className="flex flex-col gap-5 border-t border-outline pt-8">
        <p className="text-label font-medium">Szczególne sytuacje</p>
        {form.event === "birth" && (
          <Check
            label="Dziecko urodziło się martwe"
            hint="Zasiłek macierzyński przysługuje za 8 tygodni po porodzie, według stawki macierzyńskiej. Bez urlopu rodzicielskiego."
            checked={form.stillbirth}
            onChange={(stillbirth) => update({ stillbirth })}
          />
        )}
        {form.event === "birth" && form.stillbirth && (
          <p className="ml-8 rounded-sm bg-surface p-4 text-meta">
            Bardzo nam przykro. Jeśli potrzebujesz wsparcia, organizacje pomagające rodzicom po stracie znajdziesz w{" "}
            <Link href="/wsparcie" className="font-medium underline underline-offset-4 decoration-outline hover:decoration-on-surface">
              „Wsparciu”
            </Link>
            .
          </p>
        )}
        <Check
          label="Zaświadczenie „Za życiem”"
          hint="Ciężkie i nieodwracalne upośledzenie albo nieuleczalna choroba dziecka. Urlop rodzicielski: 65 tyg. (67 przy więcej niż jednym dziecku)."
          checked={form.zaZyciem}
          onChange={(zaZyciem) => update({ zaZyciem })}
        />
        <div className="flex flex-col gap-4">
          <Check
            label="Wcześniak albo pobyt dziecka w szpitalu po porodzie"
            hint="Uzupełniający urlop macierzyński: tydzień za każdy tydzień w szpitalu, po urlopie macierzyńskim, płatny według stawki macierzyńskiej."
            checked={form.hospital}
            onChange={(hospital) => update({ hospital })}
          />
          {form.hospital && (
            <div className="ml-2.5 grid items-start gap-6 border-l-2 border-outline pl-6 md:grid-cols-2">
              <TextField
                label="Dni w szpitalu (łącznie)"
                hint={form.extremePreterm ? "Liczone do 15. tygodnia po porodzie." : "Liczone do 8. tygodnia po porodzie."}
                inputMode="numeric"
                value={form.hospitalDays ? String(form.hospitalDays) : ""}
                onChange={(e) => update({ hospitalDays: Math.max(0, Math.min(365, Number(e.target.value.replace(/\D/g, "")) || 0)) })}
              />
              <div className="flex flex-col gap-4">
                <Check label="Przed 28. tygodniem ciąży lub masa ≤ 1000 g" checked={form.extremePreterm} onChange={(extremePreterm) => update({ extremePreterm })} />
                <p className="text-meta">
                  Uzupełniający urlop: <strong>{sup} tyg.</strong> (niepełny tydzień w górę, najwyżej {form.extremePreterm ? 15 : 8})
                </p>
                {form.hasB && (
                  <Segmented
                    fill
                    label="Kto korzysta"
                    value={form.supplementaryParent}
                    onChange={(supplementaryParent) => update({ supplementaryParent })}
                    options={[
                      { value: "A", label: "Ty" },
                      { value: "B", label: "Drugi rodzic" },
                    ]}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

// ---------- 2. Podstawa ----------

const TITLES: Array<{ value: InsuranceTitle; label: string }> = [
  { value: "pracownik", label: "Umowa o pracę" },
  { value: "zleceniobiorca", label: "Umowa zlecenia" },
  { value: "dzialalnosc", label: "Działalność" },
];

function ParentBasis({
  who,
  label,
  form,
  date,
  onChange,
  basis,
  problems,
}: {
  who: "A" | "B";
  label: string;
  form: ParentForm;
  date: string;
  onChange: (form: ParentForm) => void;
  basis: BasisResult | null;
  problems: FormProblem[];
}) {
  const schedule = useRuleSchedule();
  const employee = form.title === "pracownik";
  const amountLabel = employee ? "Wynagrodzenie brutto" : "Podstawa składki chorobowej";
  const months = date ? basisMonthLabels(date) : [];
  const set = (patch: Partial<ParentForm>) => onChange({ ...form, ...patch });
  return (
    <div className="flex flex-col gap-6">
      <h3 className="font-serif text-lead">{label}</h3>
      <Segmented<InsuranceTitle> fill label={`${label}: tytuł ubezpieczenia`} value={form.title} onChange={(title) => set({ title, fullTime: title === "pracownik" })} options={TITLES} />
      {employee && (
        <Check
          label="Pełny etat"
          hint="Podstawa nie może być niższa niż płaca minimalna po odjęciu składek społecznych."
          checked={form.fullTime}
          onChange={(fullTime) => set({ fullTime })}
        />
      )}
      <Segmented<BasisMode>
        fill
        label={`${label}: jak podasz dane`}
        value={form.mode}
        onChange={(mode) => set({ mode })}
        options={[
          { value: "average", label: "Średnia miesięczna" },
          { value: "months", label: "12 miesięcy" },
          { value: "known", label: "Znam podstawę" },
        ]}
      />
      {form.mode === "average" && (
        <TextField
          label={`${amountLabel}, średnio miesięcznie (zł)`}
          hint={employee ? "Z 12 miesięcy przed miesiącem porodu. Premie kwartalne i roczne: 1/12 kwoty." : "Zadeklarowana podstawa, od której płacisz składkę chorobową, z 12 miesięcy."}
          inputMode="decimal"
          autoComplete="off"
          value={form.average}
          onChange={(e) => set({ average: e.target.value })}
          error={problemFor(problems, `${who}.average`)}
        />
      )}
      {form.mode === "known" && (
        <TextField
          label="Podstawa wymiaru zasiłku (zł)"
          hint="Z decyzji ZUS, zaświadczenia płatnika Z-3 albo z wcześniejszego zasiłku. Jeśli między zasiłkami nie było przerwy dłuższej niż miesiąc, podstawa się nie zmienia."
          inputMode="decimal"
          autoComplete="off"
          value={form.known}
          onChange={(e) => set({ known: e.target.value })}
          error={problemFor(problems, `${who}.known`)}
        />
      )}
      {form.mode === "months" && (
        <fieldset className="flex flex-col gap-3">
          <legend className="mb-3 text-meta text-on-surface-variant">
            {amountLabel} za 12 miesięcy przed miesiącem porodu albo przyjęcia dziecka. Puste pole oznacza brak ubezpieczenia w tym miesiącu. Zaznacz miesiące przepracowane w mniej niż połowie, bo nie liczą się do średniej.
          </legend>
          {problemFor(problems, `${who}.months`) && <FieldError>{problemFor(problems, `${who}.months`)}</FieldError>}
          <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {form.months.map((m, i) => (
              <div key={i} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2">
                <span className="text-meta text-on-surface-variant">{months[i] ? monthLabel(months[i]) : `${i + 1}.`}</span>
                <input
                  aria-label={`${amountLabel}, ${months[i] ? monthLabel(months[i]) : `miesiąc ${i + 1}`}`}
                  inputMode="decimal"
                  autoComplete="off"
                  value={m.amount}
                  onChange={(e) => set({ months: form.months.map((x, j) => (j === i ? { ...x, amount: e.target.value } : x)) })}
                  className="h-11 w-full rounded-sm border border-outline bg-background px-3 text-on-surface focus:border-on-surface focus:outline-none"
                />
                <label className="flex items-center gap-1.5 text-meta" title="Mniej niż połowa miesiąca">
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={m.underHalf}
                    onChange={(e) => set({ months: form.months.map((x, j) => (j === i ? { ...x, underHalf: e.target.checked } : x)) })}
                  />
                  &lt; ½
                </label>
              </div>
            ))}
          </div>
        </fieldset>
      )}
      {basis && basis.basis > 0 && (
        <div className="rounded-sm bg-surface p-4 md:p-5">
          <dl className="flex flex-col gap-2 text-meta">
            {basis.steps.map((s, i) => (
              <div key={i} className="flex justify-between gap-3">
                <dt className="text-on-surface-variant">{s.text}</dt>
                {s.value !== undefined && <dd className="shrink-0">{pln(s.value)}</dd>}
              </div>
            ))}
          </dl>
          <p className="mt-3 flex items-baseline justify-between gap-3 border-t border-outline pt-3">
            <span>Podstawa wymiaru zasiłku</span>
            <strong>{pln(basisOn(basis, date || "2026-01-01", schedule))}</strong>
          </p>
        </div>
      )}
    </div>
  );
}

export function BasisSection({ form, update, problems, basisA, basisB }: { form: CalcForm; update: Update; problems: FormProblem[]; basisA: BasisResult | null; basisB: BasisResult | null }) {
  return (
    <Panel className="flex flex-col gap-8">
      <SectionHead n={2} title="Podstawa zasiłku" lead="Średnie wynagrodzenie (albo podstawa składek) z 12 miesięcy, po odjęciu składek społecznych. Każdy rodzic ma własną." />
      <ParentBasis who="A" label="Ty" form={form.A} date={form.date} onChange={(A) => update({ A })} basis={basisA} problems={problems} />
      <div className="border-t border-outline pt-8">
        <Check
          label="Drugi rodzic podlega ubezpieczeniu chorobowemu"
          hint="Wtedy może przejąć część urlopu macierzyńskiego, wziąć urlop rodzicielski i ojcowski z zasiłkiem."
          checked={form.hasB}
          onChange={(hasB) => update({ hasB })}
        />
      </div>
      {form.hasB && <ParentBasis who="B" label="Drugi rodzic" form={form.B} date={form.date} onChange={(B) => update({ B })} basis={basisB} problems={problems} />}
    </Panel>
  );
}

// ---------- 3. Podział urlopu ----------

const WORK = [
  { value: "0", label: "Nie pracuje" },
  { value: "0.25", label: "¼ etatu" },
  { value: "0.5", label: "½ etatu" },
];

export function SplitSection({ form, update }: { form: CalcForm; update: Update }) {
  const schedule = useRuleSchedule();
  const P = maternityParametersOn(schedule, form.date);
  const l = limitsFor(form, schedule);
  const birth = form.event === "birth";
  const maxTransfer = Math.max(l.maternityWeeks - form.weeksBeforeBirth - P.motherMinWeeksAfterBirth, 0);
  const used = form.parentalWeeksA + (form.hasB ? form.parentalWeeksB : 0);
  const free = l.parentalPoolWeeks - used;
  const deadline = form.date ? addDays(form.date, P.averagedRequestDays) : null;
  if (birth && form.stillbirth) {
    return (
      <Panel className="flex flex-col gap-8">
        <SectionHead n={3} title="Urlop" lead="Urlop macierzyński 8 tygodni po porodzie, zasiłek według stawki macierzyńskiej." />
        <Stepper
          label="Urlop macierzyński wykorzystany przed porodem"
          hint="Tygodnie przed porodem liczą się osobno, a 8 tygodni przysługuje po porodzie."
          value={form.weeksBeforeBirth}
          min={0}
          max={P.maxWeeksBeforeBirth}
          unit={weeksUnit}
          onChange={(weeksBeforeBirth) => update({ weeksBeforeBirth })}
        />
      </Panel>
    );
  }
  return (
    <Panel className="flex flex-col gap-8">
      <SectionHead n={3} title="Jak dzielicie urlop" lead="Zmieniaj tygodnie. Wynik i oś czasu przeliczają się od razu." />

      <div className="flex flex-col gap-3">
        <p className="text-label font-medium">Sposób wypłaty</p>
        <Segmented
          fill
          label="Sposób wypłaty"
          value={form.variant}
          onChange={(variant) => update({ variant })}
          options={[
            { value: "815", label: `${P.rateAveraged.toLocaleString("pl-PL")}% przez cały okres` },
            { value: "100-70", label: `${P.rateMaternity.toLocaleString("pl-PL")}%, potem ${P.rateParental.toLocaleString("pl-PL")}%` },
          ]}
        />
        <p className="text-meta text-on-surface-variant">
          {form.variant === "815"
            ? `Wniosek o stawkę uśrednioną złóż najpóźniej ${P.averagedRequestDays} dni po ${birth ? "porodzie" : "przyjęciu dziecka"}${deadline ? `, czyli do ${formatLong(deadline)}` : ""}. Wyłączna część drugiego rodzica jest płatna według stawki rodzicielskiej.`
            : "Przy tym wariancie każdy okres jest płatny według swojej stawki."}
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {birth && (
          <Stepper
            label="Urlop macierzyński przed porodem"
            hint="Najwyżej 6 tygodni przed przewidywaną datą porodu. Skraca to część po porodzie."
            value={form.weeksBeforeBirth}
            min={0}
            max={P.maxWeeksBeforeBirth}
            unit={weeksUnit}
            onChange={(weeksBeforeBirth) => update({ weeksBeforeBirth, transferWeeks: Math.min(form.transferWeeks, Math.max(l.maternityWeeks - weeksBeforeBirth - P.motherMinWeeksAfterBirth, 0)) })}
          />
        )}
        {form.hasB && (
          <Stepper
            label="Drugi rodzic przejmuje część urlopu macierzyńskiego"
            hint={`Najwyżej ${maxTransfer} tyg., po co najmniej 14 tygodniach matki po porodzie.`}
            value={form.transferWeeks}
            min={0}
            max={maxTransfer}
            unit={weeksUnit}
            onChange={(transferWeeks) => update({ transferWeeks })}
          />
        )}
      </div>

      <div className="flex flex-col gap-5 border-t border-outline pt-8">
        <div className="flex flex-col gap-1">
          <p className="text-label font-medium">Urlop rodzicielski: {l.parentalPoolWeeks} tyg. dla Was obojga</p>
          <p className="text-meta text-on-surface-variant">Każde z Was ma {l.exclusiveWeeks} tygodni wyłącznie dla siebie. Tych tygodni nie można przenieść. Jedno może wziąć najwyżej {l.maxParentalOneParent} tyg.</p>
        </div>
        <PoolBar pool={l.parentalPoolWeeks} a={form.parentalWeeksA} b={form.hasB ? form.parentalWeeksB : 0} exclusive={l.exclusiveWeeks} hasB={form.hasB} />
        <div className="grid gap-8 md:grid-cols-2">
          <Stepper label="Ty" value={form.parentalWeeksA} min={0} max={l.maxParentalOneParent} unit={weeksUnit} onChange={(parentalWeeksA) => update({ parentalWeeksA })} />
          {form.hasB && <Stepper label="Drugi rodzic" value={form.parentalWeeksB} min={0} max={l.maxParentalOneParent} unit={weeksUnit} onChange={(parentalWeeksB) => update({ parentalWeeksB })} />}
        </div>
        <p className={cn("text-meta", free < 0 ? "font-medium" : "text-on-surface-variant")}>
          {free >= 0 ? `Wolne z puli: ${free} tyg.` : `Przekraczacie pulę o ${-free} tyg.`}
        </p>
        {form.hasB && (
          <Segmented
            fill
            label="Kolejność"
            value={form.parentalOrder}
            onChange={(parentalOrder) => update({ parentalOrder })}
            options={[
              { value: "sequential", label: "Po kolei: najpierw Ty" },
              { value: "together", label: "Razem, od tego samego dnia" },
            ]}
          />
        )}
      </div>

      <div className="flex flex-col gap-5 border-t border-outline pt-8">
        <div className="flex flex-col gap-1">
          <p className="text-label font-medium">Praca w czasie urlopu rodzicielskiego</p>
          <p className="text-meta text-on-surface-variant">Najwyżej pół etatu. Urlop wydłuża się proporcjonalnie, a zasiłek maleje o część etatu, którą pracujesz.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <p className="text-meta font-medium">Ty</p>
            <Segmented fill label="Twoja praca" value={String(form.workA)} onChange={(v) => update({ workA: Number(v) })} options={WORK} />
          </div>
          {form.hasB && (
            <div className="flex flex-col gap-2">
              <p className="text-meta font-medium">Drugi rodzic</p>
              <Segmented fill label="Praca drugiego rodzica" value={String(form.workB)} onChange={(v) => update({ workB: Number(v) })} options={WORK} />
            </div>
          )}
        </div>
      </div>

      {form.hasB && (
        <div className="flex flex-col gap-5 border-t border-outline pt-8">
          <div className="flex flex-col gap-1">
            <p className="text-label font-medium">Urlop ojcowski</p>
            <p className="text-meta text-on-surface-variant">Odrębny okres wypłaty poza urlopem rodzicielskim. Do ukończenia przez dziecko 12 miesięcy, w jednej albo dwóch częściach.</p>
          </div>
          <div className="grid items-end gap-6 md:grid-cols-2">
            <Segmented
              fill
              label="Urlop ojcowski"
              value={String(form.paternityDays)}
              onChange={(v) => update({ paternityDays: Number(v) })}
              options={[
                { value: "0", label: "Nie" },
                { value: "7", label: "1 tydzień" },
                { value: "14", label: "2 tygodnie" },
              ]}
            />
            {form.paternityDays > 0 && <TextField label="Od kiedy" type="date" value={form.paternityStart} onChange={(e) => update({ paternityStart: e.target.value })} />}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5 border-t border-outline pt-8">
        <p className="text-label font-medium">Kwota na rękę (szacunek)</p>
        <Check label="Złożono PIT-2" hint="Zaliczka na podatek 12% pomniejszona o 300 zł miesięcznie." checked={form.pit2} onChange={(pit2) => update({ pit2 })} />
        <Check label="Ulga zwalniająca z podatku" hint="Ulga dla młodych, na powrót, dla rodzin 4+ albo dla pracujących seniorów. Zasiłek jest zwolniony z podatku do 85 528 zł rocznie." checked={form.pitExempt} onChange={(pitExempt) => update({ pitExempt })} />
      </div>
    </Panel>
  );
}

function PoolBar({ pool, a, b, exclusive, hasB }: { pool: number; a: number; b: number; exclusive: number; hasB: boolean }) {
  const w = (n: number) => `${(Math.max(0, n) / pool) * 100}%`;
  const over = a + b > pool;
  return (
    <div aria-hidden className="flex flex-col gap-2">
      <div className="relative flex h-4 overflow-hidden rounded-full bg-surface">
        <div className="h-full bg-secondary" style={{ width: w(Math.min(a, pool)) }} />
        {hasB && <div className="h-full bg-tertiary" style={{ width: w(Math.min(b, pool - Math.min(a, pool))) }} />}
        <div className="absolute inset-y-0 border-l-2 border-dashed border-on-surface" style={{ left: w(pool - exclusive) }} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-meta text-on-surface-variant">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full bg-secondary" />
            Ty {a} tyg.
          </span>
          {hasB && (
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-full bg-tertiary" />
              Drugi rodzic {b} tyg.
            </span>
          )}
        </span>
        <span className={cn(over && "font-medium text-on-surface")}>{pool} tyg.</span>
      </div>
    </div>
  );
}
