/** Calendar dates as ISO strings (YYYY-MM-DD). Arithmetic in UTC, so no time zone can shift a day. */

export function parseIso(iso: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) throw new Error(`not an ISO date: ${iso}`);
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (toIso(date) !== iso) throw new Error(`not a calendar date: ${iso}`);
  return date;
}

export function isValidIso(iso: string): boolean {
  try {
    parseIso(iso);
    return true;
  } catch {
    return false;
  }
}

export function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const date = parseIso(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIso(date);
}

/** Same day n months later; a missing day (31 → 30 Apr) falls back to the month's last day. */
export function addMonths(iso: string, months: number): string {
  const date = parseIso(iso);
  const day = date.getUTCDate();
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1));
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(day, last));
  return toIso(target);
}

export function monthEnd(iso: string): string {
  return addDays(addMonths(`${iso.slice(0, 7)}-01`, 1), -1);
}

/** Whole days from a to b (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parseIso(b).getTime() - parseIso(a).getTime()) / 86_400_000);
}

export const MONTHS_GEN = [
  "stycznia",
  "lutego",
  "marca",
  "kwietnia",
  "maja",
  "czerwca",
  "lipca",
  "sierpnia",
  "września",
  "października",
  "listopada",
  "grudnia",
];
const WEEKDAYS = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"];

/** "8 grudnia 2026 r." */
export function formatLong(iso: string): string {
  const d = parseIso(iso);
  return `${d.getUTCDate()} ${MONTHS_GEN[d.getUTCMonth()]} ${d.getUTCFullYear()} r.`;
}

/** "08.12.2026" */
export function formatShort(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

/** "poniedziałek" */
export function weekday(iso: string): string {
  return WEEKDAYS[parseIso(iso).getUTCDay()];
}

/** "8–14 grudnia 2026 r." or "28 grudnia 2026 r. – 3 stycznia 2027 r." */
export function formatRange(start: string, end: string): string {
  const a = parseIso(start);
  const b = parseIso(end);
  if (a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth()) {
    return `${a.getUTCDate()}–${formatLong(end)}`;
  }
  return `${formatLong(start)} – ${formatLong(end)}`;
}
