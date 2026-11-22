import { MATERNITY_PARAMETERS } from "./maternity";
import { parameterOn, type RuleParameterId, type RuleSchedule } from "./parameters";

/**
 * The parent calculator's numbers (MATERNITY_PARAMETERS in lib/rules/maternity.ts) as published in
 * the admin panel, in the calculator's own units (rates and the deduction in percent, weeks, days,
 * PLN). Without a schedule it returns exactly MATERNITY_PARAMETERS (tests/rules-maternity-schedule).
 * Numbers the panel does not change yet are passed through unchanged.
 */

type Widen<T> = T extends number
  ? number
  : T extends readonly (infer U)[]
    ? readonly Widen<U>[]
    : T extends object
      ? { readonly [K in keyof T]: Widen<T[K]> }
      : T;

export type MaternityParameters = Widen<typeof MATERNITY_PARAMETERS>;

/** Calculator parameters valid on `day` (ISO), e.g. the day of birth or the benefit day. */
export function maternityParametersOn(schedule: RuleSchedule | undefined, day: string): MaternityParameters {
  if (!schedule || !day || day < "1900-01-01") return MATERNITY_PARAMETERS;
  const v = (id: RuleParameterId) => parameterOn(schedule, id, day).value;
  return {
    ...MATERNITY_PARAMETERS,
    deductionPct: v("contributions.employeePct") / 100,
    rateMaternity: v("rate.maternity") / 10,
    rateParental: v("rate.parental") / 10,
    rateAveraged: v("rate.averaged") / 10,
    maternityWeeks: [v("maternity.weeks1"), v("maternity.weeks2"), v("maternity.weeks3"), v("maternity.weeks4"), v("maternity.weeks5")],
    parentalWeeks: {
      one: v("parental.weeksOne"),
      many: v("parental.weeksMany"),
      oneZaZyciem: v("parental.weeksOneZaZyciem"),
      manyZaZyciem: v("parental.weeksManyZaZyciem"),
    },
    exclusiveWeeks: v("parental.exclusiveWeeks"),
    averagedRequestDays: v("averaged.requestDays"),
    parentalAllowance: v("benefit.parentalMinimum"),
  };
}
