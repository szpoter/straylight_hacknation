import { isValidIso } from "./dates";
import { DEFAULTS, parameterOn, type RuleSchedule } from "./parameters";

/**
 * Who pays sickness and maternity benefits: the contribution payer (employer) or ZUS.
 * Art. 61 ustawy zasiłkowej (Dz.U. 2026 poz. 854), corpus units uz-61-1, uz-61-2, uz-61-3.
 * Code decides; screens and the assistant only explain.
 */

export const PAYER_RULES_VERSION = "payer-art61-2026-11-22.2";
export const DEFAULT_INSURED_THRESHOLD = DEFAULTS["payer.insuredThreshold"][0].value;

/** Insured situations art. 61 ust. 1 pkt 2 lit. b–e sends straight to ZUS. */
export type InsuredSituation =
  | "employee"
  | "contract"
  | "self_employed"
  | "cooperating_with_self_employed"
  | "cleric"
  | "after_insurance_ended"
  | "foreign_employer";

export interface PayerInput {
  situation: InsuredSituation;
  /** Insured the payer reported to sickness insurance on 30 November of the previous year. null = unknown. */
  payerInsuredCount: number | null;
  /** First day the benefit is due; decides the year of the count and the threshold in force. */
  benefitDate: string;
  /** ZUS already pays this benefit and the year changed (art. 61 ust. 4). */
  zusAlreadyPaying?: boolean;
  /** First month of notifications if nobody was registered on the previous 30 November (art. 61 ust. 2). */
  firstRegistrationMonth?: string;
  /** Values published in the admin panel; `payer.insuredThreshold` replaces the default 20. */
  schedule?: RuleSchedule;
}

export interface PayerResult {
  payer: "employer" | "zus" | null;
  /** Question to ask when the count is missing. */
  question: string | null;
  reason: string;
  /** Day the number of insured is counted on (art. 61 ust. 2). */
  countDate: string | null;
  /** The whole reference month for a new payer. */
  countMonth?: string;
  threshold: number;
  /** When ZUS pays an employee, the payer files the pay certificate (art. 61 ust. 3). */
  payerCertificateNeeded: boolean;
  lawIds: string[];
  rulesVersion: string;
}

const DIRECT_TO_ZUS: Record<Exclude<InsuredSituation, "employee" | "contract">, string> = {
  self_employed: "Osobom prowadzącym pozarolniczą działalność zasiłek wypłaca ZUS.",
  cooperating_with_self_employed: "Osobom współpracującym przy działalności zasiłek wypłaca ZUS.",
  cleric: "Duchownym zasiłek wypłaca ZUS.",
  after_insurance_ended: "Za okres po ustaniu ubezpieczenia zasiłek wypłaca ZUS.",
  foreign_employer: "Przy zatrudnieniu u pracodawcy zagranicznego zasiłek wypłaca ZUS.",
};

export function countDateFor(benefitDate: string): string {
  return `${Number(benefitDate.slice(0, 4)) - 1}-11-30`;
}

export function benefitPayer(input: PayerInput): PayerResult {
  const threshold = parameterOn(input.schedule, "payer.insuredThreshold", input.benefitDate).value;
  const base = { threshold, rulesVersion: PAYER_RULES_VERSION };

  if (input.situation !== "employee" && input.situation !== "contract") {
    return {
      ...base,
      payer: "zus",
      question: null,
      reason: DIRECT_TO_ZUS[input.situation],
      countDate: null,
      payerCertificateNeeded: false,
      lawIds: ["uz-61-1", "uz-61-2"],
    };
  }

  const firstMonth = input.firstRegistrationMonth;
  if (firstMonth && (!isValidIso(firstMonth + "-01") || firstMonth > input.benefitDate.slice(0, 7))) {
    throw new RangeError("invalid_first_registration_month");
  }
  const countDate = firstMonth ? null : countDateFor(input.benefitDate);
  const reference = firstMonth ? { countMonth: firstMonth, countDate } : { countDate };
  const entity = input.situation === "contract" ? "zleceniodawca" : "pracodawca";
  if (input.zusAlreadyPaying) {
    return {
      ...base,
      payer: "zus",
      question: null,
      reason: "ZUS kontynuuje wypłatę rozpoczętą wcześniej, także po zmianie roku.",
      ...reference,
      payerCertificateNeeded: false,
      lawIds: ["uz-61-3"],
    };
  }
  if (input.payerInsuredCount === 0) {
    return { ...base, payer: null, question: "Ile osób płatnik zgłosił do chorobowego w pierwszym miesiącu zgłoszeń?",
      reason: "Przy braku ubezpieczonych 30 listopada rozstrzyga liczba osób w pierwszym miesiącu zgłoszeń.",
      ...reference, payerCertificateNeeded: false, lawIds: ["uz-61-2"] };
  }
  if (input.payerInsuredCount === null || !Number.isInteger(input.payerInsuredCount) || input.payerInsuredCount < 0) {
    const day = (countDate ?? "").split("-").reverse().join(".");
    return {
      ...base,
      payer: null,
      question: `Ilu ubezpieczonych Twój ${entity} zgłaszał do ubezpieczenia chorobowego ${firstMonth ? "w pierwszym miesiącu zgłoszeń " + firstMonth : "na " + day}? Wystarczy informacja, czy więcej niż ${threshold}.`,
      reason: `Od liczby ubezpieczonych u płatnika składek zależy, kto wypłaca zasiłek.`,
      ...reference,
      payerCertificateNeeded: false,
      lawIds: ["uz-61-1", "uz-61-2"],
    };
  }
  if (input.payerInsuredCount > threshold) {
    return {
      ...base,
      payer: "employer",
      question: null,
      reason: `Płatnik składek zgłasza ponad ${threshold} ubezpieczonych, więc sam ustala prawo do zasiłku i go wypłaca.`,
      ...reference,
      payerCertificateNeeded: false,
      lawIds: ["uz-61-1", "uz-61-2"],
    };
  }
  return {
    ...base,
    payer: "zus",
    question: null,
    reason: `Płatnik składek zgłasza najwyżej ${threshold} ubezpieczonych, więc zasiłek wypłaca ZUS. Płatnik przekazuje zaświadczenie o podstawie składek.`,
    ...reference,
    payerCertificateNeeded: true,
    lawIds: ["uz-61-1", "uz-61-2", "uz-61-3"],
  };
}
