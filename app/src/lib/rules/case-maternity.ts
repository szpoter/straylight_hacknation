import { daysBetween, isValidIso } from './dates';
import { computeScenario, type LeaveKind, type ParentId, type ScenarioInput } from './maternity';

export interface RequestedPeriod {
  parent: ParentId;
  kind: LeaveKind;
  from: string;
  to: string;
}

/** The caller establishes entitlement and validates evidence before pricing the requested days. */
export function priceMaternityPeriod(input: ScenarioInput, period: RequestedPeriod) {
  if (!isValidIso(period.from) || !isValidIso(period.to) || period.from > period.to) {
    return { status: 'needs_review', reason: 'invalid_requested_period' } as const;
  }
  const result = computeScenario(input);
  if (!result.ok || result.assumptions.length) {
    return { status: 'needs_review', reason: 'scenario_requires_review', issues: [...result.errors, ...result.assumptions] } as const;
  }
  const segments = result.segments.filter(s => s.parent === period.parent && s.kind === period.kind && s.to >= period.from && s.from <= period.to).map(s => {
    const from = s.from < period.from ? period.from : s.from;
    const to = s.to > period.to ? period.to : s.to;
    const days = daysBetween(from, to) + 1;
    const dailyGrosze = Math.round(s.daily * 100);
    return { from, to, days, ratePct: s.ratePct, basisGrosze: Math.round(s.basis * 100), dailyGrosze, grossAmountGrosze: days * dailyGrosze };
  });
  if (segments.reduce((total, s) => total + s.days, 0) !== daysBetween(period.from, period.to) + 1) {
    return { status: 'needs_review', reason: 'period_outside_scenario' } as const;
  }
  return { status: 'calculated', segments, grossAmountGrosze: segments.reduce((total, s) => total + s.grossAmountGrosze, 0) } as const;
}
