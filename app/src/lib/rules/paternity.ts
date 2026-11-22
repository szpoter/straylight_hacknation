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
  title?: "employee" | "business" | "contract";
  /** Undefined for biological fatherhood, null for an adoption awaiting the court date. */
  adoptionFinalOn?: string | null;
  filedOn?: string;
  employerGrantedLateLeave?: boolean;
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

/** KP art. 182³ §1 (Dz.U. 2025 poz. 277). Both limits are exclusive anniversaries. */
export function paternityWindow(birth: string, adoptionFinalOn?: string) {
  const from = adoptionFinalOn ?? birth;
  const ageLimit = addMonths(birth, adoptionFinalOn ? 14 * 12 : 12);
  const endExclusive = [addMonths(from, 12), ageLimit].sort()[0];
  return { from, to: addDays(endExclusive, -1) };
}

export function evaluatePaternity(input: PaternityInput): PaternityResult {
  const reasons: RuleReason[] = [];
  const missing: MissingKey[] = [];
  const priorParts = [...new Map(input.priorParts.map(p => [p.start + "/" + p.end, p])).values()];
  const daysUsedBefore = priorParts.reduce((sum, part) => sum + partDays(part), 0);
  const partsUsed = priorParts.length;
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
      text: "Potwierdzono brak ubezpieczenia chorobowego z badanego tytułu.",
      citationId: "zam-info-prawo",
    });
    return finish("not_eligible", null);
  }
  if (input.insuranceConfirmed === true) {
    reasons.push({
      ruleId: "R1-ubezpieczenie",
      ok: true,
      text: "Masz potwierdzone ubezpieczenie chorobowe z badanego tytułu.",
      citationId: "zam-info-prawo",
    });
  } else missing.push("insurance_confirmed");

  // R2 · arrears (an assumption of the demo profile; ZUS checks it on the real case)
  if (!input.title || input.title === "business") {
    if (input.noArrears === true) {
      reasons.push({ ruleId: "R2-skladki", ok: true, text: "Profil potwierdza brak zaległości w składkach.", citationId: null });
    } else if (input.noArrears === false) {
      reasons.push({
        ruleId: "R2-skladki",
        ok: false,
        text: "Do ustalenia wypłaty potrzebna jest kwota zaległości oraz informacja o jej spłacie.",
        citationId: null,
      });
      return finish("needs_info", "Masz zaległość w składkach. Czy już ją uregulowałeś?", { missing: ["no_arrears"] });
    } else missing.push("no_arrears");
  }

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
  if (input.adoptionFinalOn === null || (input.adoptionFinalOn && (!isValidIso(input.adoptionFinalOn) || (birth && input.adoptionFinalOn < birth)))) {
    return finish("needs_info", "Potwierdź datę prawomocności postanowienia o przysposobieniu.");
  }
  const window = birth ? paternityWindow(birth, input.adoptionFinalOn) : null;
  const lastAllowedDay = window?.to ?? null;
  const assessedOn = input.filedOn ?? input.today;
  if (!isValidIso(assessedOn) || assessedOn > input.today) return finish("needs_info", "Potwierdź dzień złożenia wniosku.");
  if (birth && lastAllowedDay) {
    if (assessedOn > lastAllowedDay) {
      reasons.push({
        ruleId: "R3-wiek-dziecka",
        ok: false,
        text: `Okres ojcowski można było wykorzystać do ${formatLong(lastAllowedDay)}`,
        citationId: "zam-info-okres",
      });
      return finish("not_eligible", null, { lastAllowedDay });
    }
    reasons.push({
      ruleId: "R3-wiek-dziecka",
      ok: true,
      text: `Okres musi się skończyć najpóźniej ${formatLong(lastAllowedDay)}`,
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
  const deadline = addDays(start, input.title === "employee" ? -7 : -1);

  if (window && start < window.from) {
    return finish("needs_info", `Okres nie może zacząć się przed ${formatLong(window.from)}. Od kiedy zacząć?`, {
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
  const clash = priorParts.find((part) => overlaps(part, period));
  if (clash) {
    return finish(
      "needs_info",
      `Ten okres nachodzi na część wykorzystaną ${formatRange(clash.start, clash.end)} Od kiedy zacząć?`,
      { missing: ["request_start"], lastAllowedDay },
    );
  }

  // R5 · deadline: before the period starts
  const deadlinePassed = deadline < assessedOn;
  reasons.push({
    ruleId: "R5-termin",
    ok: !deadlinePassed,
    text: input.title === "employee"
      ? `Wniosek o urlop ojcowski do pracodawcy należy złożyć co najmniej 7 dni przed początkiem, do ${formatLong(deadline)}.`
      : deadlinePassed
      ? `Wniosek trzeba złożyć przed początkiem okresu. Na start ${formatLong(start)} jest już za późno.`
      : `Wniosek złóż w ZUS przed początkiem okresu, czyli najpóźniej ${formatLong(deadline)}`,
    citationId: input.title === "employee" ? "kp-art182-3" : "zus-termin-niepracownik",
  });
  if (deadlinePassed && !(input.title === "employee" && input.employerGrantedLateLeave)) {
    if (input.title === "employee") return finish("needs_info", "Czy pracodawca mimo spóźnienia udzielił urlopu za wskazany okres?", { lastAllowedDay, deadline, deadlinePassed });
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
