import { addMonths } from "./dates";
import { DEFAULTS, parameterOn, type RuleSchedule, type ScheduledValue } from "./parameters";

/**
 * Contribution arrears of the self-employed on the day the right to a benefit arises.
 * Art. 2a ustawy zasiłkowej (corpus uz-2a-1, uz-2a-2); ZUS guide 2026, p. 25 (poradnik-25-1).
 * Above 1% of the minimum wage the benefit is not paid until the whole debt is paid; unpaid for
 * 6 months from that day, the right expires.
 */

export const ARREARS_RULES_VERSION = "arrears-art2a-2026-11-22";

/** Minimum monthly wage by the day it applies from (gross PLN); values live in parameters.ts. */
export const MINIMUM_WAGE: readonly ScheduledValue[] = DEFAULTS["wage.minimum"];

export interface ArrearsInput {
  /** Art. 2a applies to the self-employed, people cooperating with them, clerics and seafarers. */
  covered: boolean;
  /** Debt on social insurance contributions on the day the right arises, in PLN. null = unknown. */
  arrears: number | null;
  /** Day the right to the benefit arises. */
  rightArisesOn: string;
  /** Day the whole debt was paid, if it was. */
  paidOn: string | null;
  today: string;
  schedule?: RuleSchedule;
}

export interface ArrearsResult {
  status: "not_applicable" | "needs_info" | "within_limit" | "withheld_until_paid" | "paid" | "expired";
  minimumWage: number;
  /** 1% of the minimum wage valid on the day the right arises, rounded to grosze. */
  threshold: number;
  /** Last day to pay the debt before the right expires. */
  payBy: string;
  text: string;
  lawIds: string[];
  rulesVersion: string;
}

const pln = (v: number) => `${v.toLocaleString("pl-PL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} zł`;
const day = (iso: string) => iso.split("-").reverse().join(".");

export function assessArrears(input: ArrearsInput): ArrearsResult {
  const minimumWage = parameterOn(input.schedule, "wage.minimum", input.rightArisesOn).value;
  const threshold = Math.round(minimumWage) / 100;
  const payBy = addMonths(input.rightArisesOn, 6);
  const base = { minimumWage, threshold, payBy, rulesVersion: ARREARS_RULES_VERSION, lawIds: ["uz-2a-1", "uz-2a-2"] };

  if (!input.covered) {
    return { ...base, status: "not_applicable", lawIds: [], text: "Zasada o zadłużeniu składkowym dotyczy osób, które same opłacają składki, np. prowadzących działalność." };
  }
  if (input.arrears === null || !(input.arrears >= 0)) {
    return {
      ...base,
      status: "needs_info",
      text: `Sprawdź stan zadłużenia składkowego na ${day(input.rightArisesOn)}. Zasiłek nie przysługuje, gdy przekracza ${pln(threshold)}.`,
    };
  }
  if (input.arrears <= threshold) {
    return {
      ...base,
      status: "within_limit",
      text: `Zadłużenie ${pln(input.arrears)} nie przekracza 1% minimalnego wynagrodzenia (${pln(threshold)}). Nie wstrzymuje zasiłku.`,
    };
  }
  if (input.paidOn && input.paidOn <= input.today && input.paidOn <= payBy) {
    return {
      ...base,
      status: "paid",
      text: `Zadłużenie spłacono ${day(input.paidOn)}, przed upływem 6 miesięcy. Prawo do zasiłku się nie przedawniło i zasiłek może zostać wypłacony.`,
    };
  }
  if (input.today > payBy) {
    return {
      ...base,
      status: "expired",
      text: `Zadłużenie ${pln(input.arrears)} nie zostało spłacone do ${day(payBy)}. Prawo do zasiłku przedawniło się.`,
    };
  }
  return {
    ...base,
    status: "withheld_until_paid",
    text: `Zadłużenie ${pln(input.arrears)} przekracza ${pln(threshold)}. Zasiłek nie przysługuje do spłaty całości. Spłać do ${day(payBy)}, inaczej prawo się przedawni.`,
  };
}
