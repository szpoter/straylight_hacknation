import type { LeaveRequest, MissingKey, PaternityResult, PriorPart, RuleReason } from "../kamil/contract";
import { addDays, addMonths, daysBetween, formatLong, formatRange, isValidIso } from "./dates";
import { valueOn, weeksLabel, type RuleSchedule } from "./parameters";

/**
 * Maternity benefit for the paternity-leave period, insured person who is not an employee
 * (self-employed, voluntary sickness insurance). Code decides; the model only explains.
 *
 * - 2 weeks in total, at most 2 parts, each at least one week      (zam-info-okres, zus-ojcowski-niepracownik)
 * - no later than until the child completes 12 months              (zam-info-okres)
 * - ZAM filed before the period starts → last day = start − 1      (zus-termin-niepracownik)
 * - benefit requires sickness insurance                             (zam-info-prawo)
 */
export const PATERNITY_RULES_VERSION = "paternity-niepracownik-2026-11-21";

export const TOTAL_DAYS = 14;
export const MAX_PARTS = 2;

export interface PaternityInput {
  childBirthDate: string | null;
  /** Voluntary sickness insurance covering the requested period. null = not confirmed yet. */
  insuranceConfirmed: boolean | null;
  noArrears: boolean | null;
  priorParts: PriorPart[];
  request: LeaveRequest | null;
  today: string;
  /**
   * Values published in the admin panel. `paternity.totalDays` valid on the first day of the requested
   * period replaces TOTAL_DAYS (today's date while no start is chosen). Omitted = built-in defaults.
   */
  schedule?: RuleSchedule;
}

export const QUESTIONS: Record<MissingKey, string> = {
  child_birth_date: "Kiedy urodził się syn? Możesz też dodać odpis aktu urodzenia, odczytam datę.",
  insurance_confirmed: "Czy w wybranym okresie masz opłacane dobrowolne ubezpieczenie chorobowe z działalności?",
  no_arrears: "Czy masz opłacone wszystkie składki, bez zaległości?",
  request_start: "Od którego dnia chcesz zacząć?",
  request_days: "Na tydzień czy na dwa tygodnie?",
} as Record<MissingKey, string>;

function partDays(part: PriorPart): number {
  return daysBetween(part.start, part.end) + 1;
}

function overlaps(a: { start: string; end: string }, b: { start: string; end: string }) {
  return a.start <= b.end && b.start <= a.end;
}

export function evaluatePaternity(input: PaternityInput): PaternityResult {
  const reasons: RuleReason[] = [];
  const missing: MissingKey[] = [];
  const daysUsedBefore = input.priorParts.reduce((sum, part) => sum + partDays(part), 0);
  const partsUsed = input.priorParts.length;
  const totalDays = valueOn(input.schedule, "paternity.totalDays", input.request?.start ?? input.today, TOTAL_DAYS).value;
  const available = Math.max(0, totalDays - daysUsedBefore);

  const finish = (
    status: PaternityResult["status"],
    question: string | null,
    extra: Partial<PaternityResult> = {},
  ): PaternityResult => {
    const citationIds = [...new Set(reasons.map((r) => r.citationId).filter((id): id is string => !!id))];
    return {
      status,
      missing,
      question,
      period: null,
      partNumber: null,
      daysUsedBefore,
      daysLeftAfter: null,
      lastAllowedDay: null,
      deadline: null,
      deadlinePassed: false,
      reasons,
      citationIds,
      rulesVersion: PATERNITY_RULES_VERSION,
      ...extra,
    };
  };

  // R1 · insurance
  if (input.insuranceConfirmed === false) {
    reasons.push({
      ruleId: "R1-ubezpieczenie",
      ok: false,
      text: "Bez dobrowolnego ubezpieczenia chorobowego zasiłek macierzyński nie przysługuje.",
      citationId: "zam-info-prawo",
    });
    return finish("not_eligible", null);
  }
  if (input.insuranceConfirmed === true) {
    reasons.push({
      ruleId: "R1-ubezpieczenie",
      ok: true,
      text: "Masz potwierdzone dobrowolne ubezpieczenie chorobowe z działalności.",
      citationId: "zam-info-prawo",
    });
  } else missing.push("insurance_confirmed");

  // R2 · arrears (an assumption of the demo profile; ZUS checks it on the real case)
  if (input.noArrears === true) {
    reasons.push({ ruleId: "R2-skladki", ok: true, text: "Profil potwierdza brak zaległości w składkach.", citationId: null });
  } else if (input.noArrears === false) {
    reasons.push({
      ruleId: "R2-skladki",
      ok: false,
      text: "Zaległość w składkach może przerwać dobrowolne ubezpieczenie chorobowe. Najpierw trzeba ją wyjaśnić w ZUS.",
      citationId: null,
    });
    return finish("needs_info", "Masz zaległość w składkach. Czy już ją uregulowałeś?", { missing: ["no_arrears"] });
  } else missing.push("no_arrears");

  // R4 · parts already used
  if (partsUsed >= MAX_PARTS || available === 0) {
    reasons.push({
      ruleId: "R4-czesci",
      ok: false,
      text: `Wykorzystałeś już ${daysUsedBefore} dni w ${partsUsed} ${partsUsed === 1 ? "części" : "częściach"}. Okres ojcowski to ${weeksLabel(totalDays)} w najwyżej ${MAX_PARTS} częściach.`,
      citationId: "zus-ojcowski-niepracownik",
    });
    return finish("not_eligible", null, { daysLeftAfter: 0 });
  }

  // R3 · child's age
  const birth = input.childBirthDate && isValidIso(input.childBirthDate) ? input.childBirthDate : null;
  if (!birth) missing.unshift("child_birth_date");
  const lastAllowedDay = birth ? addDays(addMonths(birth, 12), -1) : null;
  if (birth && lastAllowedDay) {
    if (input.today > lastAllowedDay) {
      reasons.push({
        ruleId: "R3-wiek-dziecka",
        ok: false,
        text: `Syn ukończył 12 miesięcy. Okres ojcowski można było wykorzystać do ${formatLong(lastAllowedDay)}`,
        citationId: "zam-info-okres",
      });
      return finish("not_eligible", null, { lastAllowedDay });
    }
    reasons.push({
      ruleId: "R3-wiek-dziecka",
      ok: true,
      text: `Syn kończy 12 miesięcy ${formatLong(addMonths(birth, 12))} Okres musi się skończyć najpóźniej ${formatLong(lastAllowedDay)}`,
      citationId: "zam-info-okres",
    });
  }

  const start = input.request?.start ?? null;
  let days = input.request?.days ?? null;
  if (!start) missing.push("request_start");
  if (!days) {
    // With one week left there is nothing to ask.
    if (available === 7) days = 7;
    else missing.push("request_days");
  }
  if (missing.length > 0 || !start || !days) {
    return finish("needs_info", QUESTIONS[missing[0]], { lastAllowedDay });
  }

  // R4 · length of this part
  if (days > available) {
    reasons.push({
      ruleId: "R4-czesci",
      ok: false,
      text: `Zostało Ci ${available} dni okresu ojcowskiego, więc ta część może trwać najwyżej ${weeksLabel(available)}.`,
      citationId: "zus-ojcowski-niepracownik",
    });
    return finish("needs_info", `Zostało Ci ${available} dni. Wpisać tydzień od ${formatLong(start)}?`, {
      missing: ["request_days"],
      lastAllowedDay,
    });
  }

  const end = addDays(start, days - 1);
  const period = { start, end, days };
  const deadline = addDays(start, -1);

  if (birth && start < birth) {
    return finish("needs_info", `Okres nie może zacząć się przed urodzeniem syna (${formatLong(birth)}). Od kiedy zacząć?`, {
      missing: ["request_start"],
      lastAllowedDay,
    });
  }
  if (lastAllowedDay && end > lastAllowedDay) {
    reasons.push({
      ruleId: "R3-wiek-dziecka",
      ok: false,
      text: `Okres ${formatRange(start, end)} kończy się po ${formatLong(lastAllowedDay)}`,
      citationId: "zam-info-okres",
    });
    return finish("needs_info", `Okres musi się skończyć najpóźniej ${formatLong(lastAllowedDay)} Od kiedy zacząć?`, {
      missing: ["request_start"],
      lastAllowedDay,
    });
  }
  const clash = input.priorParts.find((part) => overlaps(part, period));
  if (clash) {
    return finish(
      "needs_info",
      `Ten okres nachodzi na część wykorzystaną ${formatRange(clash.start, clash.end)} Od kiedy zacząć?`,
      { missing: ["request_start"], lastAllowedDay },
    );
  }

  // R5 · deadline: before the period starts
  const deadlinePassed = deadline < input.today;
  reasons.push({
    ruleId: "R5-termin",
    ok: !deadlinePassed,
    text: deadlinePassed
      ? `Wniosek trzeba złożyć przed początkiem okresu. Na start ${formatLong(start)} jest już za późno.`
      : `Wniosek złóż w ZUS przed początkiem okresu, czyli najpóźniej ${formatLong(deadline)}`,
    citationId: "zus-termin-niepracownik",
  });
  if (deadlinePassed) {
    return finish("needs_info", "Wybierz późniejszy początek, żeby zdążyć ze złożeniem wniosku. Od kiedy zacząć?", {
      missing: ["request_start"],
      lastAllowedDay,
      deadline,
      deadlinePassed,
    });
  }

  const partNumber = (partsUsed + 1) as 1 | 2;
  reasons.push({
    ruleId: "R4-czesci",
    ok: true,
    text:
      partNumber === 1
        ? days === 7
          ? "To pierwsza część. Drugi tydzień zostaje na później."
          : "Wykorzystujesz cały okres w jednej części."
        : "To druga, ostatnia część okresu ojcowskiego.",
    citationId: "zus-ojcowski-niepracownik",
  });

  return finish("eligible", null, {
    period,
    partNumber,
    daysLeftAfter: available - days,
    lastAllowedDay,
    deadline,
    deadlinePassed,
  });
}
