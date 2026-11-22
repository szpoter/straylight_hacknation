import { addDays, daysBetween, isValidIso } from "./dates";

export interface ParentalWork {
  leaveEmployer: string;
  /** Employer-confirmed intervals within the original leave. Include non-working days at fraction 0. */
  intervals: { from: string; to: string; fraction: number; employer: string }[];
  extension: { fraction: number; employer: string };
}

/** KP 182¹e §1 and 182¹f §2–7, reviewed 22.11.2026. The extension is for this part of leave. */
export function parentalWorkPeriods(start: string, days: number, limitDays: number, plan: ParentalWork) {
  const result: { from: string; days: number; work: number }[] = [];
  let cursor = start;
  let credit = 0;
  function fractionOf(part: { fraction: number; employer: string }) {
    if (!part.employer || !Number.isFinite(part.fraction) || part.fraction < 0 || part.fraction > 1) throw new RangeError("invalid_work_fraction");
    if (part.employer !== plan.leaveEmployer) return 0;
    if (part.fraction > 0.5) throw new RangeError("work_above_half_time");
    return part.fraction;
  }
  for (const row of [...plan.intervals].sort((a, b) => a.from.localeCompare(b.from))) {
    if (!isValidIso(row.to) || row.from !== cursor || row.to < row.from) throw new RangeError("work_history_not_contiguous");
    const length = daysBetween(row.from, row.to) + 1;
    const work = fractionOf(row);
    result.push({ from: row.from, days: length, work });
    credit += length * work;
    cursor = addDays(row.to, 1);
  }
  if (!plan.leaveEmployer || cursor !== addDays(start, days)) throw new RangeError("incomplete_work_history");
  const work = fractionOf(plan.extension);
  const extra = Math.floor(credit / (1 - work));
  if (days + extra > limitDays) throw new RangeError("parental_limit_exceeded");
  if (extra) result.push({ from: cursor, days: extra, work });
  return result;
}
