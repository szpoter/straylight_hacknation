import { addDays, isValidIso, parseIso, toIso } from "../rules/dates";
import { MATERNITY_PARAMETERS } from "../rules/maternity";

export function maternityEnd(v: Record<string, string>): string {
  if (!isValidIso(v.od ?? "")) return "";
  const count = parseInt(v.liczba_dzieci, 10);
  const weeks = MATERNITY_PARAMETERS.maternityWeeks[Math.min(count, 5) - 1];
  return weeks ? addDays(v.od, weeks * 7 - 1) : "";
}

// Gregorian Easter, anonymous Gregorian algorithm (Meeus/Jones/Butcher).
function easterSunday(year: number): string {
  const cycle = year % 19;
  const century = Math.floor(year / 100);
  const yearInCentury = year % 100;
  const correction = Math.floor((century - Math.floor((century + 8) / 25) + 1) / 3);
  const epact = (19 * cycle + century - Math.floor(century / 4) - correction + 15) % 30;
  const weekday = (32 + 2 * (century % 4) + 2 * Math.floor(yearInCentury / 4) - epact - yearInCentury % 4) % 7;
  const offset = epact + weekday - 7 * Math.floor((cycle + 11 * epact + 22 * weekday) / 451) + 114;
  return toIso(new Date(Date.UTC(year, Math.floor(offset / 31) - 1, offset % 31 + 1)));
}

const holidays = new Set(["01-01", "01-06", "05-01", "05-03", "08-15", "11-01", "11-11", "12-25", "12-26"]);

export function averagedDeadline(birth: string): string {
  let day = addDays(birth, MATERNITY_PARAMETERS.averagedRequestDays);
  const easter = easterSunday(parseIso(day).getUTCFullYear());
  const movable = [addDays(easter, 1), addDays(easter, 60)];
  for (;;) {
    const weekday = parseIso(day).getUTCDay();
    const monthDay = day.slice(5);
    const christmasEve = day >= "2025-12-24" && monthDay === "12-24";
    if (weekday !== 0 && weekday !== 6 && !holidays.has(monthDay) && !christmasEve && !movable.includes(day)) return day;
    day = addDays(day, 1);
  }
}
