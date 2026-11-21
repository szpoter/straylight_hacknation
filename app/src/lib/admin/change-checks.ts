import type { PaternityResult } from "../kamil/contract";
import { addDays, addMonths, formatShort } from "../rules/dates";
import { RULE_PARAMETERS, valueOn, weeksLabel, type RuleSchedule } from "../rules/parameters";
import { TOTAL_DAYS, evaluatePaternity, type PaternityInput } from "../rules/paternity";
import { PATERNITY_SCENARIOS, scenarioOutcome } from "./scenarios";

/**
 * "Sprawdź zmianę" for the paternity total (SPEC-PANEL §7 step 3 and the "Wymiar lub limit" row):
 * a request exactly at the new limit, one above it, a period starting the day before the change,
 * a second part, and the test cases outside the change keeping their result (§12 point 2).
 * Expectations follow from the limit itself; results come from the real rule with the draft applied.
 */

export interface CheckRow {
  name: string;
  expected: string;
  result: string;
  /** "informacja": a case inside the change whose result changes on purpose; never blocks publication. */
  status: "zgodna" | "niezgodna" | "informacja";
}

export interface LimitDraft {
  value: number;
  validFrom: string;
  source: string;
}

const PARAM = "paternity.totalDays" as const;

/** Rule result in the words used by the checks. */
export function outcomeLabel(r: PaternityResult): string {
  if (r.status === "eligible") return "przysługuje";
  if (r.status === "not_eligible") return "nie przysługuje";
  if (r.missing[0] === "request_days") return "przekracza limit";
  return "wymaga uzupełnienia";
}

/**
 * A fictional insured father whose child is two months old on the day of the change. The app takes
 * requests of one or two weeks, so a longer total is reached with an earlier part of `usedDays`.
 */
function family(validFrom: string, start: string, days: 7 | 14, usedDays = 0): PaternityInput {
  const birth = addMonths(validFrom, -2);
  const priorParts = usedDays > 0 ? [{ start: addDays(birth, 3), end: addDays(birth, 3 + usedDays - 1) }] : [];
  return {
    childBirthDate: birth,
    insuranceConfirmed: true,
    noArrears: true,
    priorParts,
    request: { start, days },
    today: addDays(start, -14),
  };
}

/** Request exactly at `limit`: the last part is two weeks when possible, the rest was used earlier. */
function atLimit(limit: number): { days: 7 | 14; used: number } {
  return limit >= 14 ? { days: 14, used: limit - 14 } : { days: 7, used: limit - 7 };
}

export function withDraft(schedule: RuleSchedule, draft: Pick<LimitDraft, "value" | "validFrom">): RuleSchedule {
  const others = (schedule[PARAM] ?? []).filter((v) => v.validFrom !== draft.validFrom);
  return { ...schedule, [PARAM]: [...others, { value: draft.value, validFrom: draft.validFrom }] };
}

export function checkPaternityLimit(published: RuleSchedule, draft: LimitDraft): CheckRow[] {
  const next = withDraft(published, draft);
  const limit = draft.value;
  const dayBefore = addDays(draft.validFrom, -1);
  const oldLimit = valueOn(published, PARAM, dayBefore, TOTAL_DAYS).value;
  const run = (input: PaternityInput) => outcomeLabel(evaluatePaternity({ ...input, schedule: next }));
  const row = (name: string, expected: string, result: string): CheckRow => ({
    name,
    expected,
    result,
    status: expected === result ? "zgodna" : "niezgodna",
  });

  const on = atLimit(limit);
  const usedText = (used: number) => (used > 0 ? ` po wykorzystanych ${used} dniach` : "");
  const rows: CheckRow[] = [
    row(
      `Wniosek dokładnie na limicie ${weeksLabel(limit)}: ${weeksLabel(on.days)} od ${formatShort(draft.validFrom)}${usedText(on.used)}`,
      "przysługuje",
      run(family(draft.validFrom, draft.validFrom, on.days, on.used)),
    ),
    row(
      `Wniosek ponad limit: 2 tygodnie od ${formatShort(draft.validFrom)}${usedText(limit - 7)}`,
      "przekracza limit",
      run(family(draft.validFrom, draft.validFrom, 14, limit - 7)),
    ),
    row(
      `Ten sam wniosek na limicie od dnia przed zmianą (${formatShort(dayBefore)}): obowiązuje ${weeksLabel(oldLimit)}`,
      // Under the old limit: fits, nothing left at all, or this part is longer than what is left.
      limit <= oldLimit ? "przysługuje" : on.used >= oldLimit ? "nie przysługuje" : "przekracza limit",
      run(family(draft.validFrom, dayBefore, on.days, on.used)),
    ),
    row(
      `Druga część po wykorzystanym tygodniu: tydzień od ${formatShort(draft.validFrom)}`,
      limit - 7 >= 7 ? "przysługuje" : "nie przysługuje",
      run(family(draft.validFrom, draft.validFrom, 7, 7)),
    ),
  ];

  // Test cases: outside the change they must keep their result; inside it they may change.
  const outside: string[] = [];
  const changedOutside: string[] = [];
  for (const scenario of PATERNITY_SCENARIOS) {
    const eventDay = scenario.input.request?.start ?? scenario.input.today;
    const before = scenarioOutcome(scenario, published);
    const after = scenarioOutcome(scenario, next);
    if (eventDay < draft.validFrom) {
      outside.push(scenario.id);
      if (before !== after) changedOutside.push(scenario.id);
    } else if (before !== after) {
      rows.push({ name: `${scenario.id}: ${scenario.title} (w zakresie zmiany)`, expected: before, result: after, status: "informacja" });
    }
  }
  rows.push(
    row(
      `Sprawy testowe sprzed daty zmiany (${outside.length ? outside.join(", ") : "brak"})`,
      "wynik bez zmian",
      changedOutside.length ? `zmiana w ${changedOutside.join(", ")}` : "wynik bez zmian",
    ),
  );

  rows.push(row("Podstawa zmiany", "uzupełniona", draft.source.trim() ? "uzupełniona" : "brak"));
  return rows;
}

export interface ImpactRow {
  label: string;
  before: string;
  after: string;
}

/**
 * "Wpływ na rodzinę" (SPEC §7 step 2): a fictional father asks for the whole new limit from the change
 * date. "Obecnie" applies the published values, "Po zmianie" adds the draft. Pure, runs in the browser.
 */
export function limitImpact(published: RuleSchedule, draft: Omit<LimitDraft, "source">): ImpactRow[] {
  const next = withDraft(published, draft);
  const on = atLimit(draft.value);
  const input = family(draft.validFrom, draft.validFrom, on.days, on.used);
  const before = evaluatePaternity({ ...input, schedule: published });
  const after = evaluatePaternity({ ...input, schedule: next });
  const limitOn = (s: RuleSchedule) => valueOn(s, PARAM, draft.validFrom, TOTAL_DAYS).value;
  const period = (r: PaternityResult) => (r.period ? `${formatShort(r.period.start)}–${formatShort(r.period.end)}` : "—");
  const left = (r: PaternityResult) => (r.daysLeftAfter === null ? "—" : `${r.daysLeftAfter} dni`);
  const request = `${weeksLabel(on.days)} od ${formatShort(draft.validFrom)}${on.used ? `, wcześniej ${on.used} dni` : ""}`;
  return [
    { label: "Łączny wymiar", before: weeksLabel(limitOn(published)), after: weeksLabel(limitOn(next)) },
    { label: "Wniosek", before: request, after: request },
    { label: "Wynik", before: outcomeLabel(before), after: outcomeLabel(after) },
    { label: "Okres", before: period(before), after: period(after) },
    { label: "Zostaje do wykorzystania", before: left(before), after: left(after) },
  ];
}

export function checksPassed(rows: CheckRow[]): boolean {
  return rows.every((r) => r.status !== "niezgodna");
}

export function checksSummary(rows: CheckRow[]): string {
  const counted = rows.filter((r) => r.status !== "informacja");
  return `${counted.filter((r) => r.status === "zgodna").length} / ${counted.length} zgodnych`;
}

export const LIMIT_EVENT = RULE_PARAMETERS[PARAM].event;
