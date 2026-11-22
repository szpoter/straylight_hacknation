/**
 * Rule parameters that the admin panel may change without a code change (ZUS task, p. 14:
 * "zmian w jego parametrach np. stopy procentowej zasiłku macierzyńskiego, maksymalnego wymiaru").
 * A schedule lists values with the day they apply from; a rule picks the value valid on the day of
 * the event its legal basis names. Values written in the code (DEFAULTS) apply until an
 * administrator publishes something, so behaviour is unchanged without a schedule.
 */

export type ParameterUnit =
  /** Whole days; with step 7 the panel edits them in weeks. */
  | "days"
  | "count"
  | "pln"
  /** Tenths of a percent: 700 = 70,0%. Integers keep money maths exact. */
  | "percent10"
  /** 1 = the form is in use, 0 = withdrawn. */
  | "flag";

export interface ParameterDefinition {
  label: string;
  unit: ParameterUnit;
  /** Event whose date decides which value applies (SPEC-PANEL §9). */
  event: string;
  min: number;
  max: number;
  step: number;
}

const FORM_EVENT = "Dzień złożenia wniosku";
const form = (symbol: string, label: string): ParameterDefinition => ({
  label: `Formularz ${symbol}: ${label}`,
  unit: "flag",
  event: FORM_EVENT,
  min: 0,
  max: 1,
  step: 1,
});

export const RULE_PARAMETERS = {
  /** Total length of the maternity benefit for the paternity-leave period, insured non-employee. */
  "paternity.totalDays": {
    label: "Zasiłek za okres urlopu ojcowskiego: łączny wymiar",
    unit: "days",
    event: "Pierwszy dzień okresu, za który rodzic wnioskuje o zasiłek",
    /** Counted in whole weeks (ZUS: parts of at least one week). The app takes parts of one or two
     * weeks, at most two parts: four weeks is the most it can use. */
    min: 7,
    max: 28,
    step: 7,
  },
  /** ZUS task p. 9: 100% for maternity leave and leave on maternity terms. */
  "rate.maternity": {
    label: "Zasiłek macierzyński za okres urlopu macierzyńskiego: stawka",
    unit: "percent10",
    event: "Dzień, za który przysługuje zasiłek",
    min: 0,
    max: 1000,
    step: 1,
  },
  /** ZUS task p. 9: 70% for parental leave. */
  "rate.parental": {
    label: "Zasiłek macierzyński za okres urlopu rodzicielskiego: stawka",
    unit: "percent10",
    event: "Dzień, za który przysługuje zasiłek",
    min: 0,
    max: 1000,
    step: 1,
  },
  /** ZUS task p. 9: 81,5% for the whole period when the mother applies within 21 days of birth. */
  "rate.averaged": {
    label: "Stawka uśredniona za urlop macierzyński i rodzicielski (wniosek do 21 dni po porodzie)",
    unit: "percent10",
    event: "Dzień, za który przysługuje zasiłek",
    min: 0,
    max: 1000,
    step: 1,
  },
  /** Art. 61 ust. 1 ustawy zasiłkowej: above this number of insured the payer pays benefits itself. */
  "payer.insuredThreshold": {
    label: "Próg płatnika wypłacającego zasiłki: liczba ubezpieczonych",
    unit: "count",
    event: "Dzień, za który przysługuje zasiłek (liczbę ubezpieczonych ustala się na 30 listopada poprzedniego roku)",
    min: 1,
    max: 1000,
    step: 1,
  },
  /** Minimum wage; 1% of it is the contribution-arrears threshold of art. 2a ustawy zasiłkowej. */
  "wage.minimum": {
    label: "Minimalne wynagrodzenie za pracę",
    unit: "pln",
    event: "Dzień powstania prawa do świadczenia",
    min: 1000,
    max: 20000,
    step: 1,
  },
  /** Forms catalogue (ZUS task pp. 3–4, 7, 12; SPEC-PANEL §4.1). Descriptions follow the task text. */
  "form.ZAM": form("ZAM", "wniosek o zasiłek macierzyński"),
  "form.ZUR": form("ZUR", "wniosek o zasiłek za okres urlopu rodzicielskiego"),
  "form.ZAO": form("ZAO", "wniosek o zasiłek za okres urlopu ojcowskiego"),
  "form.Z3": form("Z-3", "zaświadczenie płatnika składek (pracownik)"),
  "form.Z3a": form("Z-3a", "zaświadczenie płatnika składek (niebędący pracownikami, np. umowa zlecenia)"),
  "form.Z3b": form("Z-3b", "zaświadczenie płatnika składek"),
  "form.ZAS12": form("ZAS-12", "zaświadczenie płatnika składek na dalszy okres"),
  "form.ZAS53": form("ZAS-53", "wniosek o zasiłek chorobowy (niebędący pracownikami, np. działalność)"),
} as const satisfies Record<string, ParameterDefinition>;

export type RuleParameterId = keyof typeof RULE_PARAMETERS;

export interface ScheduledValue {
  value: number;
  /** ISO day the value applies from, inclusive. */
  validFrom: string;
}

export type RuleSchedule = Partial<Record<RuleParameterId, ScheduledValue[]>>;

/** Start of time for values that have always applied in this application. */
export const ALWAYS = "1900-01-01";

/**
 * Values written in the code, with the day each applies from. Sources: ZUS task pp. 7–9 and 12,
 * art. 61 ustawy zasiłkowej, minimum wage regulations (2027: Dz.U. 2026 poz. 1213).
 */
export const DEFAULTS: Record<RuleParameterId, readonly ScheduledValue[]> = {
  "paternity.totalDays": [{ value: 14, validFrom: ALWAYS }],
  "rate.maternity": [{ value: 1000, validFrom: ALWAYS }],
  "rate.parental": [{ value: 700, validFrom: ALWAYS }],
  "rate.averaged": [{ value: 815, validFrom: ALWAYS }],
  "payer.insuredThreshold": [{ value: 20, validFrom: ALWAYS }],
  "wage.minimum": [
    { value: 4666, validFrom: "2025-01-01" },
    { value: 4806, validFrom: "2026-01-01" },
    { value: 4950, validFrom: "2027-01-01" },
  ],
  "form.ZAM": [{ value: 1, validFrom: ALWAYS }],
  // ZUS task p. 12, footnotes 3–5: merged into ZAM / withdrawn from 24 October 2026.
  "form.ZUR": [{ value: 1, validFrom: ALWAYS }, { value: 0, validFrom: "2026-10-24" }],
  "form.ZAO": [{ value: 1, validFrom: ALWAYS }, { value: 0, validFrom: "2026-10-24" }],
  "form.Z3": [{ value: 1, validFrom: ALWAYS }],
  "form.Z3a": [{ value: 1, validFrom: ALWAYS }],
  "form.Z3b": [{ value: 1, validFrom: ALWAYS }, { value: 0, validFrom: "2026-10-24" }],
  "form.ZAS12": [{ value: 1, validFrom: ALWAYS }],
  "form.ZAS53": [{ value: 1, validFrom: ALWAYS }],
};

/** Value valid on `isoDay`: the latest scheduled value that has started, else the fallback. */
export function valueOn(
  schedule: RuleSchedule | undefined,
  id: RuleParameterId,
  isoDay: string,
  fallback: number,
): { value: number; validFrom: string | null } {
  const started = (schedule?.[id] ?? []).filter((v) => v.validFrom <= isoDay);
  if (started.length === 0) return { value: fallback, validFrom: null };
  const latest = started.reduce((a, b) => (b.validFrom >= a.validFrom ? b : a));
  return { value: latest.value, validFrom: latest.validFrom };
}

/** Code values plus a published schedule; published values win over a default with the same start. */
export function valueWithDefaults(
  schedule: RuleSchedule | undefined,
  id: RuleParameterId,
  isoDay: string,
  defaults: readonly ScheduledValue[],
): { value: number; validFrom: string | null } {
  return valueOn({ [id]: [...defaults, ...(schedule?.[id] ?? [])] }, id, isoDay, Number.NaN);
}

/** The value a rule applies on `isoDay`: published schedule over the code DEFAULTS. */
export function parameterOn(schedule: RuleSchedule | undefined, id: RuleParameterId, isoDay: string) {
  return valueWithDefaults(schedule, id, isoDay, DEFAULTS[id]);
}

/* ---------- display ---------- */

const plain = (n: number, digits = 0) =>
  n.toLocaleString("pl-PL", { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: "always" });

/** Human form of a stored value, e.g. "14 dni", "70%", "81,5%", "4 806 zł", "20", "obowiązuje". */
export function formatValue(id: RuleParameterId, value: number): string {
  const def: ParameterDefinition = RULE_PARAMETERS[id];
  switch (def.unit) {
    case "days":
      return `${value} dni`;
    case "percent10":
      return `${plain(value / 10, value % 10 === 0 ? 0 : 1)}%`;
    case "pln":
      return `${plain(value)} zł`;
    case "flag":
      return value === 1 ? "obowiązuje" : "wycofany";
    default:
      return plain(value);
  }
}

const UNIT_LABEL = { days: "dni", count: "", pln: "zł", percent10: "%", flag: "" } as const;

/** Problems with a proposed value, in Polish, empty when valid (SPEC-PANEL §3: unit and range). */
export function validateValue(id: RuleParameterId, value: number): string[] {
  const def: ParameterDefinition = RULE_PARAMETERS[id];
  if (!Number.isInteger(value)) {
    return [def.unit === "percent10" ? "Stawkę podaje się z dokładnością do 0,1%." : "Wartość musi być liczbą całkowitą."];
  }
  const problems: string[] = [];
  const weeks = def.unit === "days" && def.step === 7;
  if (value < def.min || value > def.max) {
    if (weeks) problems.push(`Dopuszczalny zakres to ${def.min / 7}–${def.max / 7} tygodni.`);
    else if (def.unit === "percent10") problems.push(`Dopuszczalny zakres to ${def.min / 10}–${def.max / 10}%.`);
    else problems.push(`Dopuszczalny zakres to ${def.min}–${def.max} ${UNIT_LABEL[def.unit]}`.trim() + ".");
  }
  if (value % def.step !== 0) {
    problems.push(weeks ? "Wymiar podaje się w pełnych tygodniach." : `Wartość musi być wielokrotnością ${def.step}.`);
  }
  return problems;
}

/** "2 tygodnie", "1 tydzień", "5 tygodni" for a number of days that is a multiple of 7. */
export function weeksLabel(days: number): string {
  const weeks = days / 7;
  if (!Number.isInteger(weeks)) return `${days} dni`;
  if (weeks === 1) return "1 tydzień";
  const lastTwo = weeks % 100;
  const last = weeks % 10;
  const few = last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14);
  return `${weeks} ${few ? "tygodnie" : "tygodni"}`;
}
