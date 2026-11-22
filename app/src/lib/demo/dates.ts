/** Dzień demo ze wspólnego przykładu (ui/MACIEJ.md). */
export const DEMO_TODAY = "2026-11-21";

const MONTHS_GEN = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];

export function todayInPoland(date = new Date()): string {
  return date.toLocaleDateString("sv-SE", { timeZone: "Europe/Warsaw" });
}

function parse(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = parse(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toIso(d);
}

export function daysBetween(fromIso: string, toIsoDate: string): number {
  return Math.round((parse(toIsoDate).getTime() - parse(fromIso).getTime()) / 86_400_000);
}

/** „1 grudnia 2026”, z `withYear: false` — „1 grudnia”. */
export function formatLong(iso: string, withYear = true): string {
  const d = parse(iso);
  const base = `${d.getUTCDate()} ${MONTHS_GEN[d.getUTCMonth()]}`;
  return withYear ? `${base} ${d.getUTCFullYear()}` : base;
}

/** „2.03” albo „2.03.2027”. */
export function formatShort(iso: string, withYear = false): string {
  const d = parse(iso);
  const base = `${d.getUTCDate()}.${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  return withYear ? `${base}.${d.getUTCFullYear()}` : base;
}

/** „zostało 10 dni”, „zostało 1 dzień”, „termin minął”. */
export function daysLeftLabel(dueIso: string, today = todayInPoland()): string {
  const n = daysBetween(today, dueIso);
  if (n < 0) return "termin minął";
  if (n === 0) return "termin dziś";
  if (n === 1) return "został 1 dzień";
  return `zostało ${n} ${plDays(n)}`;
}

function plDays(n: number): string {
  return n === 1 ? "dzień" : "dni";
}

export function formatMoney(value: number): string {
  const digits = Math.round(value).toString();
  // Twarde spacje: kwota nie łamie się między cyframi ani przed „zł”.
  return `${digits.replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0")}\u00a0zł`;
}
