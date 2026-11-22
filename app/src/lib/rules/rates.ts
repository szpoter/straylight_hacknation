import { addDays, daysBetween } from "./dates";
import { parameterOn, type RuleParameterId, type RuleSchedule } from "./parameters";

/**
 * Maternity benefit rates and the amount for a period (ZUS task p. 9): 100% for maternity leave,
 * 70% for parental leave, 81,5% for the whole period when the mother applies within 21 days of birth.
 * The rate valid on each benefit day applies, so a period that crosses a published change is paid in
 * two parts (SPEC-PANEL §9). Money is counted in grosze; the daily benefit is rounded to the grosz.
 * A benefit below the parental benefit amount is raised to it (art. 31 ust. 3a, parentalMinimumTopUp).
 * Ready for the parent calculator; the calculator's owner decides when to use it.
 */

export const RATES_RULES_VERSION = "rates-2026-11-22";

export type RateKind = "maternity" | "parental" | "averaged";

const PARAMETER: Record<RateKind, RuleParameterId> = {
  maternity: "rate.maternity",
  parental: "rate.parental",
  averaged: "rate.averaged",
};

export const RATE_LABEL: Record<RateKind, string> = {
  maternity: "urlop macierzyński",
  parental: "urlop rodzicielski",
  averaged: "stawka uśredniona",
};

/** Rate in tenths of a percent valid on `day` (700 = 70%). */
export function rateOn(kind: RateKind, day: string, schedule?: RuleSchedule): number {
  return parameterOn(schedule, PARAMETER[kind], day).value;
}

/** Daily benefit in grosze: daily base × rate, rounded to the grosz. */
export function dailyBenefitGrosze(dailyBaseGrosze: number, rate10: number): number {
  return Math.round((dailyBaseGrosze * rate10) / 1000);
}

export interface PeriodPart {
  from: string;
  to: string;
  days: number;
  rate10: number;
  dailyGrosze: number;
  amountGrosze: number;
}

export interface PeriodBenefit {
  parts: PeriodPart[];
  totalGrosze: number;
  rulesVersion: string;
}

/** Benefit for `days` days from `start`, split where the rate changes. */
export function benefitForPeriod(input: {
  kind: RateKind;
  dailyBase: number;
  start: string;
  days: number;
  schedule?: RuleSchedule;
}): PeriodBenefit {
  const base = Math.round(input.dailyBase * 100);
  const parts: PeriodPart[] = [];
  for (let i = 0; i < input.days; i++) {
    const day = addDays(input.start, i);
    const rate10 = rateOn(input.kind, day, input.schedule);
    const last = parts.at(-1);
    if (last && last.rate10 === rate10) {
      last.to = day;
      last.days += 1;
      last.amountGrosze += last.dailyGrosze;
    } else {
      const dailyGrosze = dailyBenefitGrosze(base, rate10);
      parts.push({ from: day, to: day, days: 1, rate10, dailyGrosze, amountGrosze: dailyGrosze });
    }
  }
  return { parts, totalGrosze: parts.reduce((sum, p) => sum + p.amountGrosze, 0), rulesVersion: RATES_RULES_VERSION };
}

/* ---------- raise to the parental benefit amount (art. 31 ust. 3a–3c) ---------- */

export interface ParentalMinimumTopUp {
  /** Parental benefit amount for the period: monthly, or 1/30 a day for part of a month. */
  minimumGrosze: number;
  topUpGrosze: number;
  /** Benefit after the income-tax advance, plus the top-up. */
  paidGrosze: number;
  rulesVersion: string;
}

/**
 * Art. 31 ust. 3a: a monthly maternity benefit lower than the parental benefit is raised to it.
 * ZUS compares the benefit after the income-tax advance (poradnik ZUS, s. 20), so the caller passes
 * that net amount; this rule does not work out the tax. Ust. 3c: for part of a month the raise is
 * proportional, 1/30 of the monthly amount a day (art. 31 ust. 5 with art. 11 ust. 4). The amount
 * valid on the first benefit day of the month applies.
 */
export function parentalMinimumTopUp(input: {
  netGrosze: number;
  firstDay: string;
  /** Benefit days in the month; "whole" = the whole calendar month. */
  days: number | "whole";
  schedule?: RuleSchedule;
}): ParentalMinimumTopUp {
  const monthly = parameterOn(input.schedule, "benefit.parentalMinimum", input.firstDay).value * 100;
  const minimumGrosze = input.days === "whole" ? monthly : Math.round((monthly * input.days) / 30);
  const topUpGrosze = Math.max(0, minimumGrosze - input.netGrosze);
  return { minimumGrosze, topUpGrosze, paidGrosze: input.netGrosze + topUpGrosze, rulesVersion: RATES_RULES_VERSION };
}

/** "3 920,00 zł" */
export function formatGrosze(grosze: number): string {
  return `${(grosze / 100).toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: "always" })} zł`;
}

/** Days from `from` to `to` inclusive, for building periods in checks and tests. */
export function inclusiveDays(from: string, to: string): number {
  return daysBetween(from, to) + 1;
}
