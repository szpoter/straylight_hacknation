/**
 * Formularz kalkulatora zasiłku macierzyńskiego (strona /kalkulator i karta w „Moim planie”):
 * wartości wpisane przez rodzica, ich zamiana na scenariusz reguły (`lib/rules/maternity.ts`)
 * i nałożenie wyniku na przystanki planu (terminy wniosków).
 */
import { maternityParametersOn } from "@/lib/rules/maternity-schedule";
import { parameterOn, type RuleSchedule } from "@/lib/rules/parameters";
import { basisMonthLabels, computeScenario, limitsFor, supplementaryWeeksFor, type BasisInput, type EventKind, type InsuranceTitle, type ParentInput, type PayVariant, type ScenarioInput, type ScenarioResult } from "@/lib/rules/maternity";
import { todayInPoland, formatLong } from "@/lib/demo/dates";
import { addDays } from "@/lib/rules/dates";
import type { Plan, Stop } from "@/lib/demo/types";

export type BasisMode = "average" | "months" | "known";

export type ParentForm = {
  title: InsuranceTitle;
  fullTime: boolean;
  mode: BasisMode;
  /** Tekst z pola (przecinek dziesiętny dozwolony). */
  average: string;
  known: string;
  months: Array<{ amount: string; underHalf: boolean }>;
};

export type CalcForm = {
  event: EventKind;
  date: string;
  children: number;
  zaZyciem: boolean;
  /** Urodzenie martwego dziecka. */
  stillbirth: boolean;
  childBirthDate: string;
  schoolDeferred: boolean;
  variant: PayVariant;
  A: ParentForm;
  hasB: boolean;
  B: ParentForm;
  weeksBeforeBirth: number;
  transferWeeks: number;
  hospital: boolean;
  hospitalDays: number;
  extremePreterm: boolean;
  supplementaryParent: "A" | "B";
  parentalWeeksA: number;
  parentalWeeksB: number;
  parentalOrder: "sequential" | "together";
  workA: number;
  workB: number;
  paternityDays: number;
  paternityStart: string;
  pit2: boolean;
  pitExempt: boolean;
};

const emptyMonths = () => Array.from({ length: 12 }, () => ({ amount: "", underHalf: false }));

export function parentForm(title: InsuranceTitle = "pracownik", average = ""): ParentForm {
  return { title, fullTime: title === "pracownik", mode: "average", average, known: "", months: emptyMonths() };
}

/** Kwota z pola: „6 500,50” → 6500.5; puste albo błędne → null. */
export function parseAmount(text: string): number | null {
  const t = text.replace(/\s| /g, "").replace(",", ".");
  if (!t) return null;
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(t)) return null;
  return Number(t);
}

export type FormProblem = { field: string; text: string };

function basisOf(form: ParentForm, who: string, problems: FormProblem[]): BasisInput {
  if (form.mode === "known") {
    const v = parseAmount(form.known);
    if (v === null || v <= 0) problems.push({ field: `${who}.known`, text: "Wpisz podstawę wymiaru, np. 5608,85." });
    return { kind: "known", amount: v ?? 0 };
  }
  if (form.mode === "average") {
    const v = parseAmount(form.average);
    if (v === null || v <= 0) problems.push({ field: `${who}.average`, text: "Wpisz kwotę, np. 6500 albo 6500,50." });
    return { kind: "average", amount: v ?? 0 };
  }
  const months = form.months
    .map((m, i) => ({ v: parseAmount(m.amount), raw: m.amount.trim(), underHalf: m.underHalf, i }))
    .filter((m) => m.raw !== "");
  if (months.some((m) => m.v === null)) problems.push({ field: `${who}.months`, text: "Popraw kwoty w tabeli. Wpisz tylko cyfry i przecinek, najwyżej 2 miejsca po przecinku." });
  if (months.length === 0) problems.push({ field: `${who}.months`, text: "Wpisz kwotę co najmniej jednego miesiąca." });
  return { kind: "months", months: months.filter((m) => m.v !== null).map((m) => ({ amount: m.v!, underHalf: m.underHalf })) };
}

function parentInput(form: ParentForm, who: string, problems: FormProblem[]): ParentInput {
  return { title: form.title, fullTime: form.title === "pracownik" && form.fullTime, basis: basisOf(form, who, problems) };
}

export function supplementaryWeeks(form: CalcForm): number {
  return form.hospital ? supplementaryWeeksFor(form.hospitalDays, form.extremePreterm) : 0;
}

/** Formularz → scenariusz reguły. Problemy z polami wracają osobno (scenariusz liczy się mimo to). */
export function toScenario(form: CalcForm): { scenario: ScenarioInput; problems: FormProblem[] } {
  const problems: FormProblem[] = [];
  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) problems.push({ field: "date", text: "Podaj datę." });
  if (form.event !== "birth" && form.childBirthDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.childBirthDate)) problems.push({ field: "childBirthDate", text: "Podaj datę urodzenia dziecka." });
  const scenario: ScenarioInput = {
    event: form.event,
    date: form.date,
    children: form.children,
    zaZyciem: form.zaZyciem,
    stillbirth: form.event === "birth" && form.stillbirth,
    childBirthDate: form.event === "birth" ? undefined : form.childBirthDate || undefined,
    schoolDeferred: form.schoolDeferred,
    variant: form.variant,
    parentA: parentInput(form.A, "A", problems),
    parentB: form.hasB ? parentInput(form.B, "B", problems) : null,
    weeksBeforeBirth: form.event === "birth" ? form.weeksBeforeBirth : 0,
    transferWeeks: form.hasB ? form.transferWeeks : 0,
    supplementaryWeeks: supplementaryWeeks(form),
    supplementaryParent: form.hasB ? form.supplementaryParent : "A",
    parentalWeeksA: form.parentalWeeksA,
    parentalWeeksB: form.hasB ? form.parentalWeeksB : 0,
    parentalOrder: form.parentalOrder,
    workA: form.workA,
    workB: form.hasB ? form.workB : 0,
    paternityDays: form.hasB ? form.paternityDays : 0,
    paternityStart: form.paternityStart || undefined,
  };
  return { scenario, problems };
}

/** Wynik albo null, gdy formularz nie ma jeszcze daty. */
export function computeForm(form: CalcForm, { requireComplete = false, schedule }: { requireComplete?: boolean; schedule?: RuleSchedule } = {}): { result: ScenarioResult | null; problems: FormProblem[] } {
  const { scenario, problems } = toScenario(form);
  if (schedule?.["contributions.employeePct"]?.length && /^\d{4}-\d{2}-\d{2}$/.test(form.date)) {
    const months = basisMonthLabels(form.date);
    const deductions = months.map(month => parameterOn(schedule, "contributions.employeePct", month + "-01").value / 100);
    for (const [who, parent, input] of [["A", form.A, scenario.parentA], ["B", form.B, scenario.parentB]] as const) {
      if (!input) continue;
      if (input.basis.kind === "average") {
        if (new Set(deductions).size > 1) problems.push({ field: who + ".average", text: "Stawka składek zmieniła się w okresie podstawy. Podaj kwoty miesiąc po miesiącu albo podstawę z decyzji." });
        else input.basis = { kind: "months", months: [{ amount: input.basis.amount, deductionPct: deductions[0] }] };
      } else if (input.basis.kind === "months") {
        input.basis.months = parent.months.flatMap((m, i) => {
          const amount = parseAmount(m.amount);
          return amount === null ? [] : [{ amount, underHalf: m.underHalf, deductionPct: deductions[i] }];
        });
      }
    }
  }
  if (requireComplete) {
    if (form.event !== "birth" && !form.childBirthDate) problems.push({ field: "childBirthDate", text: "Podaj datę urodzenia dziecka." });
    if (form.hospital && !form.hospitalDays) problems.push({ field: "hospitalDays", text: "Podaj liczbę dni pobytu w szpitalu." });
    if (form.hasB && form.paternityDays > 0 && !form.paternityStart) problems.push({ field: "paternityStart", text: "Podaj datę rozpoczęcia urlopu ojcowskiego." });
    if (problems.length) return { result: null, problems };
  }
  if (problems.some((p) => p.field === "date" || p.field === "childBirthDate")) return { result: null, problems };
  try {
    const result = computeScenario({ ...scenario, schedule });
    if (requireComplete && !result.ok) return { result: null, problems: result.errors.map(({ text }) => ({ field: "scenario", text })) };
    return { result, problems };
  } catch {
    return { result: null, problems: [...problems, { field: "date", text: "Sprawdź daty." }] };
  }
}

/** Ten sam formularz w drugim wariancie wypłaty — do porównania 81,5% z 100%/70%. */
export function otherVariant(form: CalcForm): CalcForm {
  return { ...form, variant: form.variant === "815" ? "100-70" : "815" };
}

// ---------- Formularz z planu ----------

function childCount(plan: Plan): number {
  if (plan.family) return plan.family.names.length;
  const c = plan.origin?.answers?.childCount;
  return c === "2" ? 2 : c === "3" ? 3 : 1;
}

export function blankCalculatorForm(): CalcForm {
  return {
    event: "birth",
    date: "",
    children: 1,
    zaZyciem: false,
    stillbirth: false,
    childBirthDate: "",
    schoolDeferred: false,
    variant: "100-70",
    A: parentForm(),
    hasB: false,
    B: parentForm(),
    weeksBeforeBirth: 0,
    transferWeeks: 0,
    hospital: false,
    hospitalDays: 0,
    extremePreterm: false,
    supplementaryParent: "A",
    parentalWeeksA: 0,
    parentalWeeksB: 0,
    parentalOrder: "sequential",
    workA: 0,
    workB: 0,
    paternityDays: 0,
    paternityStart: "",
    pit2: false,
    pitExempt: false,
  };
}

/**
 * Start z danych planu: data i sytuacja z planu, pełna pula rodzicielskiego dla Ciebie,
 * drugi rodzic z 9 tygodniami. Podstawy wynagrodzenia podają rodzice.
 */
export function formFromPlan(plan: Plan, today: string = todayInPoland(), schedule?: RuleSchedule): CalcForm {
  const event: EventKind = plan.situation === "adopcja" ? "adoption" : plan.situation === "piecza" ? "foster" : "birth";
  const children = childCount(plan);
  const limits = limitsFor({ children, zaZyciem: false, date: plan.keyDate ?? today }, schedule);
  return {
    ...blankCalculatorForm(),
    event,
    date: plan.keyDate ?? "",
    children,
    variant: "815",
    hasB: true,
    parentalWeeksA: limits.maxParentalOneParent,
    parentalWeeksB: limits.exclusiveWeeks,
    paternityDays: 14,
    paternityStart: plan.keyDate ? (plan.keyDate < today ? addDays(today, 7) : plan.keyDate) : "",
    pit2: true,
  };
}

// ---------- Wynik na przystankach planu ----------

const PARENTAL_SOURCE = { label: "gov.pl · Urlop rodzicielski", url: "https://www.gov.pl/web/rodzina/urlop-rodzicielski" };
const AMOUNT_SOURCE = { label: "zus.pl · Wysokość zasiłku macierzyńskiego", url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/wysokosc" };

const baseId = (s: Stop) => s.id.replace(/^e-/, "");

/**
 * Zapisany wynik kalkulatora na ścieżce: urlop rodzicielski dostaje termin wniosku i okresy,
 * zasiłek macierzyński — wybrany wariant i termin wniosku o 81,5%. Bez zapisu plan bez zmian.
 */
export function applyCalculatorToPlan(plan: Plan, form: CalcForm | undefined, schedule?: RuleSchedule): Plan {
  if (!form || !plan.keyDate) return plan;
  // Data z planu jest nadrzędna: zmiana daty w Profilu przelicza też terminy z kalkulatora.
  const { result } = computeForm({ ...form, date: plan.keyDate }, { requireComplete: true, schedule });
  if (!result || !result.ok) return plan;
  const parental = result.periods.filter((p) => p.kind === "rodzicielski");
  const parentalDeadline = result.deadlines.find((d) => d.label.startsWith("Wniosek o urlop rodzicielski"));
  const averaged = result.deadlines.find((d) => d.source === "uz30a");
  const who = (p: { parent: "A" | "B" }) => (p.parent === "A" ? "Ty" : "drugi rodzic");
  const stops = plan.stops.map((s) => {
    if (s.state === "minelo") return s;
    if (baseId(s) === "rodzicielski" && parental.length) {
      const text = `Z kalkulatora: ${parental.map((p) => `${who(p)} ${formatLong(p.from)} – ${formatLong(p.to)}`).join("; ")}.`;
      return {
        ...s,
        due: parentalDeadline?.date ?? s.due,
        dueBasis: parentalDeadline ? "Wniosek co najmniej 21 dni przed rozpoczęciem urlopu" : s.dueBasis,
        notes: [...(s.notes ?? []), { text, sources: [PARENTAL_SOURCE] }],
        doc: s.doc && parentalDeadline ? { ...s.doc, note: `Wniosek do ${formatLong(parentalDeadline.date)}` } : s.doc,
      };
    }
    if (baseId(s) === "zasilek-macierzynski") {
      const rates = maternityParametersOn(schedule, plan.keyDate ?? form.date);
      const averagedPct = rates.rateAveraged.toLocaleString("pl-PL") + "%";
      const variant = form.variant === "815" ? averagedPct + " przez cały okres" : "według rodzaju urlopu";
      const text = `Z kalkulatora: wariant ${variant}, łącznie ok. ${Math.round(result.totals.all).toLocaleString("pl-PL")} zł brutto.${averaged ? ` Wniosek o ${averagedPct} do ${formatLong(averaged.date)}.` : ""}`;
      return { ...s, notes: [...(s.notes ?? []), { text, sources: [AMOUNT_SOURCE] }] };
    }
    return s;
  });
  return { ...plan, stops };
}
