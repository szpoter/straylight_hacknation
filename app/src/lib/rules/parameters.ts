/**
 * Rule parameters that the admin panel may change without a code change (ZUS task, p. 13).
 * A schedule lists values with the day they apply from; a rule picks the value valid on the day of
 * the event its legal basis names. Without a schedule every rule uses its built-in default, so
 * behaviour is unchanged until an administrator publishes something.
 */

export const RULE_PARAMETERS = {
  /** Total length of the maternity benefit for the paternity-leave period, insured non-employee. */
  "paternity.totalDays": {
    label: "Zasiłek za okres urlopu ojcowskiego: łączny wymiar",
    unit: "days",
    /** Event that decides which value applies: the first day of the requested period. */
    event: "Pierwszy dzień okresu, za który rodzic wnioskuje o zasiłek",
    /** Paternity leave is counted in whole weeks (ZUS: parts of at least one week). */
    stepDays: 7,
    minDays: 7,
    /** The app takes parts of one or two weeks, at most two parts: four weeks is the most it can use. */
    maxDays: 28,
  },
} as const;

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

/** Problems with a proposed value, in Polish, empty when valid (SPEC-PANEL §3: unit and range). */
export function validateValue(id: RuleParameterId, value: number): string[] {
  const def = RULE_PARAMETERS[id];
  const problems: string[] = [];
  if (!Number.isInteger(value)) problems.push("Wartość musi być liczbą całkowitą.");
  else {
    if (value < def.minDays || value > def.maxDays) {
      problems.push(`Dopuszczalny zakres to ${def.minDays / 7}–${def.maxDays / 7} tygodni.`);
    }
    if (value % def.stepDays !== 0) problems.push("Wymiar podaje się w pełnych tygodniach.");
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
