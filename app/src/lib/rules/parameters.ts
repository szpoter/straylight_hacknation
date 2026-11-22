/**
 * Rule parameters that the admin panel may change without a code change (ZUS task, p. 13).
 * A schedule lists values with the day they apply from; a rule picks the value valid on the day of
 * the event its legal basis names. Without a schedule every rule uses its built-in default, so
 * behaviour is unchanged until an administrator publishes something.
 */

interface ParameterDefinition {
  label: string;
  unit: "days" | "count" | "pln";
  /** Event whose date decides which value applies (SPEC-PANEL §9). */
  event: string;
  min: number;
  max: number;
  step: number;
}

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
} as const satisfies Record<string, ParameterDefinition>;

export type RuleParameterId = keyof typeof RULE_PARAMETERS;

export interface ScheduledValue {
  value: number;
  /** ISO day the value applies from, inclusive. */
  validFrom: string;
}

export type RuleSchedule = Partial<Record<RuleParameterId, ScheduledValue[]>>;

/** Value valid on `isoDay`: the latest scheduled value that has started, else the default. */
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

/** Values written in the code, for parameters that change on a calendar (e.g. the yearly minimum wage). */
export function valueWithDefaults(
  schedule: RuleSchedule | undefined,
  id: RuleParameterId,
  isoDay: string,
  defaults: readonly ScheduledValue[],
): { value: number; validFrom: string | null } {
  // Published values come last, so they win over a default with the same start day.
  return valueOn({ [id]: [...defaults, ...(schedule?.[id] ?? [])] }, id, isoDay, Number.NaN);
}

const UNIT_LABEL = { days: "dni", count: "", pln: "zł" } as const;

/** Problems with a proposed value, in Polish, empty when valid (SPEC-PANEL §3: unit and range). */
export function validateValue(id: RuleParameterId, value: number): string[] {
  const def: ParameterDefinition = RULE_PARAMETERS[id];
  if (!Number.isInteger(value)) return ["Wartość musi być liczbą całkowitą."];
  const problems: string[] = [];
  const weeks = def.unit === "days" && def.step === 7;
  if (value < def.min || value > def.max) {
    problems.push(
      weeks
        ? `Dopuszczalny zakres to ${def.min / 7}–${def.max / 7} tygodni.`
        : `Dopuszczalny zakres to ${def.min}–${def.max} ${UNIT_LABEL[def.unit]}`.trim() + ".",
    );
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
