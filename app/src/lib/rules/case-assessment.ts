import { factInput, type CaseDocument, type EvidenceFact, type FactInput } from "../zusik/memory/contract";
import { addDays, addMonths, daysBetween, isValidIso } from "./dates";
import { basisMonthLabels, basisOn, birthLeaveWindow, computeBasis, dailyAmount, MATERNITY_RULES_VERSION, type BasisMonth } from "./maternity";
import { maternityParametersOn } from "./maternity-schedule";
import { priceMaternityPeriod } from "./case-maternity";
import { assessArrears } from "./arrears";
import { benefitPayer, countDateFor } from "./payer";
import type { RuleSchedule } from "./parameters";

export const CASE_RULE_VERSION = "case-2026-11-22.5/" + MATERNITY_RULES_VERSION;

export interface AssessmentInput {
  subjectId: string;
  benefit: string;
  asOf: string;
  profileRevision: number;
  caseRevision: number;
}

type Fact = FactInput;
type Evidence = EvidenceFact;
type AssessmentRow = Evidence | { fact: FactInput; verification: "assumed" };
export interface AssessmentSnapshot {
  facts: readonly Evidence[];
  documents: readonly CaseDocument[];
  profileRevision: number;
  caseRevision: number;
  schedule?: RuleSchedule;
}

interface Citation {
  kind: "public_source" | "fact" | "document";
  ref: string;
  version: string;
  page?: number;
  publicUrl?: string;
}
type Status = "eligible" | "ineligible" | "needs_information" | "needs_review" | "unsupported";
type Segment = Extract<ReturnType<typeof priceMaternityPeriod>, { status: "calculated" }>["segments"][number];
export interface DecisionResult {
  status: Status;
  benefit: string;
  subjectId: string;
  titleRef?: string;
  payerRef?: string;
  from?: string;
  to?: string;
  payer?: "employer" | "zus";
  paymentStatus?: "payable" | "withheld" | "needs_information" | "expired";
  grossAmountGrosze?: number;
  amountPeriod?: "total";
  amountStatus: "calculated" | "needs_information" | "needs_review" | "unsupported" | "not_applicable";
  reasonCode: string;
  citations: Citation[];
  needed?: { field: string; request: string }[];
  segments?: Segment[];
  assumptions?: FactInput[];
}

const law = (ref: string): Citation => ({
  kind: "public_source", ref, version: "Dz.U. 2026 poz. 854", publicUrl: "https://eli.gov.pl/eli/DU/2026/854/ogl",
});
const documentKinds: Record<string, CaseDocument["metadata"]["kind"][]> = {
  birthChildCount: ["certificate"], prenatalLeaveDays: ["application", "certificate"], maternityCourse: ["application", "certificate"], childDeathDate: ["certificate"],
  birthDate: ["certificate"], sicknessCertificate: ["certificate"], benefitHistory: ["insurance", "payroll"], accountArrears: ["insurance"], monthlyContributionBasis: ["insurance", "payroll"], debtSettlement: ["insurance"],
  benefitRequest: ["application"], deliveryDate: ["certificate"], insuranceTitle: ["insurance"],
  sicknessCoverage: ["insurance"], otherCoverage: ["insurance"], postInsuranceException: ["insurance", "certificate"],
  maternityPayVariant: ["application"], payrollRegime: ["payroll"], monthlyGrossPay: ["payroll"],
  monthlyEmployeeDeduction: ["payroll"], monthlyPayAfterDeduction: ["payroll"], payerInsuredCount: ["insurance", "payroll"],
};

function applies(f: Fact, day: string) {
  return f.validFrom ? f.validFrom <= day && (!f.validTo || f.validTo >= day) : f.asOf === day;
}

function valueOf(f: Fact) {
  switch (f.value.kind) {
    case "code": return f.value.code;
    case "date": return f.value.date;
    case "money": return f.value.grosze;
    case "count": return f.value.count;
  }
}

function admit(e: Evidence, documents: readonly CaseDocument[]) {
  if (e.verification !== "confirmed" && e.verification !== "disputed") return false;
  const { field, source } = e.fact;
  if (source.kind === "simulated_zus") return ["benefitHistory", "sicknessCertificate", "insuranceTitle", "sicknessCoverage", "otherCoverage", "postInsuranceException", "payerInsuredCount", "monthlyContributionBasis", "accountArrears", "debtSettlement"].includes(field);
  if (source.kind !== "document" || !source.page || !Number.isInteger(source.page)) return false;
  const doc = documents.find(d => d.id === source.referenceId);
  if (!doc || source.page < 1 || source.page > doc.metadata.pages) return false;
  const { pageKinds, pages, kind } = doc.metadata;
  if (pageKinds && pageKinds.length !== pages) return false;
  return !!documentKinds[field]?.includes(pageKinds ? pageKinds[source.page - 1] : kind);
}

class EvidenceIssue extends Error {
  constructor(readonly field: string, readonly question: string, readonly conflict: boolean) { super(field); }
}

function cite(result: DecisionResult, evidence: AssessmentRow[]) {
  for (const row of evidence) {
    if (row.verification === "assumed") {
      (result.assumptions ??= []).push(row.fact);
      continue;
    }
    const { factId, version, fact } = row;
    if (!result.citations.some(c => c.kind === "fact" && c.ref === factId && c.version === String(version))) {
      result.citations.push({ kind: "fact", ref: factId, version: String(version) });
    }
    if (fact.source.kind === "document" && !result.citations.some(c => c.kind === "document" && c.ref === fact.source.referenceId && c.page === fact.source.page)) {
      result.citations.push({ kind: "document", ref: fact.source.referenceId, page: fact.source.page, version: "1" });
    }
  }
}

type ReadFact = (field: string, matches: (f: Fact) => boolean, question: string, optional?: boolean) => string | number | undefined;

function payrollMonths(basisDay: string, payerRef: string, employee: boolean, contractor: boolean,
  atReference: (f: Fact) => boolean, scoped: (f: Fact) => boolean, read: ReadFact): BasisMonth[] | null {
  const monthsDue = basisMonthLabels(basisDay);
  const form = employee ? "Z-3" : contractor ? "Z-3a" : "poświadczenie składek";
  const regime = read("payrollRegime", atReference, `Dołącz ${form} płatnika ${payerRef} z historią podstaw za okres od ${monthsDue[0]} do ${monthsDue.at(-1)}.`);
  if (regime !== (employee ? "full_time_fixed_full_months" : "full_year_contribution_months")) return null;
  return monthsDue.map(month => {
    const start = month + "-01";
    const end = addDays(addMonths(start, 1), -1);
    const row = (f: Fact) => scoped(f) && f.validFrom === start && f.validTo === end;
    if (!employee) {
      const contribution = read("monthlyContributionBasis", row, `Dołącz ${form} z podstawą chorobowego za ${month} dla płatnika ${payerRef}.`);
      if (typeof contribution !== "number" || !Number.isSafeInteger(contribution) || contribution < 0) throw new EvidenceIssue("monthlyContributionBasis", `Potwierdź kwotę za ${month} w groszach.`, true);
      return { amount: contribution / 100 };
    }
    const question = `Dołącz wiersz Z-3 płatnika ${payerRef} za ${month}, z podstawą i potrąconymi składkami lub kwotą po potrąceniu.`;
    const net = read("monthlyPayAfterDeduction", row, question, true);
    const gross = read("monthlyGrossPay", row, question, net !== undefined);
    const deduction = read("monthlyEmployeeDeduction", row, question, net !== undefined);
    const calculated = typeof gross === "number" && typeof deduction === "number" ? gross - deduction : undefined;
    const amount = net ?? calculated;
    if (typeof amount !== "number" || !Number.isSafeInteger(amount) || amount < 0 || (net !== undefined && calculated !== undefined && net !== calculated)) {
      throw new EvidenceIssue("monthlyGrossPay", question, true);
    }
    return { amount: amount / 100, deductionPct: 0 };
  });
}

function priceSickness(item: DecisionResult, basis: ReturnType<typeof computeBasis>, schedule?: RuleSchedule) {
  if (!item.from || !item.to) throw new Error("missing_sickness_period");
  const segments: Segment[] = [];
  for (let day = item.from; day <= item.to; day = addDays(day, 1)) {
    const dailyBasis = basisOn(basis, day, schedule);
    const basisGrosze = Math.round(dailyBasis * 100);
    const dailyGrosze = Math.round(dailyAmount(dailyBasis, 100) * 100);
    const last = segments.at(-1);
    if (last && last.from.slice(0, 7) === day.slice(0, 7) && last.basisGrosze === basisGrosze) {
      last.to = day;
      last.days++;
      last.grossAmountGrosze += dailyGrosze;
    } else segments.push({ from: day, to: day, days: 1, ratePct: 100, basisGrosze, dailyGrosze, grossAmountGrosze: dailyGrosze });
  }
  return { amountStatus: "calculated", amountPeriod: "total", segments, grossAmountGrosze: segments.reduce((total,s) => total + s.grossAmountGrosze, 0) } as const;
}

function assessPregnancySickness(result: DecisionResult, from: string, to: string, payerRef: string, asOf: string, facts: AssessmentRow[], scoped: (f: Fact) => boolean, read: ReadFact, schedule?: RuleSchedule): DecisionResult[] {
  const entire = (f: Fact) => scoped(f) && applies(f, from) && applies(f, to);
  const overlaps = (f: Fact, start: string) => f.validFrom ? f.validFrom <= to && (!f.validTo || f.validTo >= start) : !!f.asOf && f.asOf >= start && f.asOf <= to;
  const review = (reasonCode: string): DecisionResult[] => [{ ...result, status: "needs_review", amountStatus: "needs_review", reasonCode }];
  const cert = read("sicknessCertificate", entire, `Dołącz e-ZLA za ${from}–${to} i początek ciągłej niezdolności w ciąży.`);
  if (cert !== "pregnancy_new_spell") throw new EvidenceIssue("sicknessCertificate", "Potwierdź ciążę i pierwszy dzień ciągłej niezdolności do pracy.", false);
  const certs = facts.filter(e => e.fact.field === "sicknessCertificate" && entire(e.fact));
  const starts = new Set(certs.map(e => e.fact.validFrom));
  const onset = certs[0]?.fact.validFrom;
  if (!onset || starts.size !== 1 || to > asOf) return review("verify_incapacity_dates");
  const during = (f: Fact) => scoped(f) && applies(f, onset) && applies(f, to);
  const coverageQuestion = `Dołącz potwierdzenie chorobowego od ${onset} do ${to}.`;
  const coverage = read("sicknessCoverage", f => scoped(f) && overlaps(f, onset), coverageQuestion);
  const allCoverage = facts.filter(e => e.fact.field === "sicknessCoverage");
  const intervals = allCoverage.map(e => e.fact).filter(f => scoped(f) && overlaps(f, onset))
    .map(f => ({ from: f.validFrom ?? f.asOf ?? onset, to: f.validFrom ? f.validTo ?? to : f.asOf ?? onset }))
    .sort((a,b) => a.from.localeCompare(b.from));
  let nextDay = onset;
  for (const interval of intervals) {
    if (interval.from > nextDay) break;
    if (interval.to >= to) { nextDay = addDays(to, 1); break; }
    if (interval.to >= nextDay) nextDay = addDays(interval.to, 1);
  }
  if (nextDay <= to) throw new EvidenceIssue("sicknessCoverage", `Dołącz potwierdzenie chorobowego za dzień ${nextDay}.`, false);
  if (coverage === "excluded") {
    const other = read("otherCoverage", f => (!f.titleRef || scoped(f)) && applies(f, onset) && applies(f, to), "Potwierdź wszystkie inne tytuły za okres niezdolności.");
    const prior = read("postInsuranceException", during, "Dołącz historię wykluczającą także prawo po ustaniu wcześniejszego ubezpieczenia.");
    const alternative = facts.filter(e => e.fact.field === "sicknessCoverage" && !scoped(e.fact) && overlaps(e.fact, onset) && valueOf(e.fact) === "covered");
    cite(result, alternative);
    if (other !== "none" || prior !== "none" || alternative.length) return review("verify_other_sickness_coverage");
    return [{ ...result, status: "ineligible", amountStatus: "not_applicable", reasonCode: "excluded_no_other_title_or_exception" }];
  }
  if (coverage !== "covered") return review("verify_sickness_coverage_history");
  const title = read("insuranceTitle", during, "Potwierdź tytuł i okres ubezpieczenia na czas zwolnienia.");
  const employee = title === "employee" || title === "pracownik";
  const contractor = title === "contract" || title === "zleceniobiorca";
  if (!employee && !contractor) return review("verify_sickness_title_and_payment_conditions");
  const waiting = employee ? 30 : 90;
  const waitingQuestion = `Potwierdź ${waiting} dni wyczekiwania albo wyjątek od tego warunku.`;
  const sameTitle = (a: Fact, b: Fact) => a.titleRef === b.titleRef && a.payerRef === b.payerRef;
  const endedTitles = allCoverage.flatMap(row => {
    const f = row.fact;
    const day = f.validFrom ?? f.asOf;
    if (!day || day >= onset || scoped(f) || !f.titleRef || !f.payerRef || valueOf(f) !== "ended") return [];
    const conflicting = allCoverage.filter(other => sameTitle(f, other.fact) && valueOf(other.fact) === "covered" && applies(other.fact, day));
    return [{ row, day, conflicting }];
  });
  const history = allCoverage.filter(e => scoped(e.fact) || endedTitles.some(end => sameTitle(end.row.fact, e.fact)));
  let insuredDays = 0;
  let gap = 0;
  // Art. 4 ust. 2: shorter breaks connect periods, but the break itself earns no insured days.
  for (let day = addDays(onset, -1); insuredDays < waiting && gap <= 30; day = addDays(day, -1)) {
    const rows = history.filter(e => applies(e.fact, day));
    const usable = rows.filter(e => valueOf(e.fact) === "covered" && (scoped(e.fact) ||
      endedTitles.some(end => sameTitle(end.row.fact, e.fact) && end.day > day)));
    if (!usable.length) { gap++; continue; }
    for (const row of usable) {
      const matching = rows.filter(e => sameTitle(row.fact, e.fact));
      cite(result, matching);
      if (matching.some(e => e.verification === "disputed" || valueOf(e.fact) !== "covered")) {
        throw new EvidenceIssue("sicknessCoverage", waitingQuestion, true);
      }
      if (!scoped(row.fact)) {
        const ends = endedTitles.filter(end => sameTitle(end.row.fact, row.fact) && end.day > day);
        cite(result, ends.flatMap(end => [end.row, ...end.conflicting]));
        if (ends.some(end => end.row.verification === "disputed" || end.conflicting.length)) {
          throw new EvidenceIssue("sicknessCoverage", waitingQuestion, true);
        }
      }
    }
    insuredDays++;
    gap = 0;
  }
  if (insuredDays < waiting) throw new EvidenceIssue("sicknessCoverage", waitingQuestion, false);
  const investigation = facts.filter(e => e.fact.field === "benefitHistory" && scoped(e.fact) && overlaps(e.fact, onset));
  if (investigation.length) { cite(result, investigation); return review("verify_overlapping_benefit_or_control"); }
  if (daysBetween(onset, to) >= 270) return review("verify_sickness_period_limit");
  const births = facts.filter(e => e.fact.field === "deliveryDate" && typeof valueOf(e.fact) === "string" && String(valueOf(e.fact)) >= onset && String(valueOf(e.fact)) <= to);
  if (births.length) { cite(result, births); return review("split_sickness_at_delivery"); }
  let salaryEnd: string | undefined;
  if (employee) {
    if (onset.slice(0, 4) !== to.slice(0, 4)) return review("verify_sickness_payment_at_year_boundary");
    const yearStart = onset.slice(0, 4) + "-01-01";
    if (onset !== yearStart) {
      const priorSalary = facts.filter(e => e.fact.field === "benefitHistory" && valueOf(e.fact) === "sickness_salary" &&
        (e.fact.validFrom ?? e.fact.asOf ?? onset) < onset &&
        (e.fact.validTo ?? (e.fact.validFrom ? onset : e.fact.asOf) ?? "") >= yearStart);
      if (priorSalary.length) {
        cite(result, priorSalary);
        throw new EvidenceIssue("benefitHistory", "Potwierdź łączną liczbę dni wynagrodzenia chorobowego u wszystkich pracodawców w tym roku.", true);
      }
      const history = read("benefitHistory", f => scoped(f) && applies(f, yearStart) && applies(f, addDays(onset, -1)),
        "Dołącz historię dni wynagrodzenia chorobowego od początku roku do dnia przed zachorowaniem.");
      if (history !== "no_sickness_days") return review("verify_prior_employer_sick_pay");
    }
    const dob = read("birthDate", f => (!f.titleRef || scoped(f)) && (!f.asOf || f.asOf <= asOf), "Potwierdź datę urodzenia dla limitu wynagrodzenia chorobowego.");
    if (typeof dob !== "string" || !isValidIso(dob) || dob >= onset) return review("invalid_claimant_birth_date");
    const shorterLimit = Number(onset.slice(0, 4)) > Number(dob.slice(0, 4)) + 50;
    salaryEnd = addDays(onset, (shorterLimit ? 14 : 33) - 1);
  }
  result.citations.push(law("uz-art4"), law("uz-art8"), law("uz-art9"), law("uz-art11-ust2-pkt1"));
  const items: DecisionResult[] = [];
  if (salaryEnd && from <= salaryEnd) {
    items.push({ ...result, benefit: "sickness_salary", to: to < salaryEnd ? to : salaryEnd, payer: "employer", status: "eligible",
      amountStatus: "needs_information", reasonCode: "employer_sick_pay", needed: [{ field: "payrollRegime", request: "Dołącz dane płacowe potrzebne do wyceny wynagrodzenia chorobowego." }],
      citations: [...result.citations, { kind: "public_source", ref: "kp-art92", version: "Dz.U. 2025 poz. 277", publicUrl: "https://eli.gov.pl/eli/DU/2025/277/ogl" }] });
  }
  if (!salaryEnd || to > salaryEnd) {
    const first = salaryEnd && salaryEnd >= from ? addDays(salaryEnd, 1) : from;
    const countDate = countDateFor(first);
    let count: string | number | undefined;
    try {
      count = read("payerInsuredCount", f => scoped(f) && f.asOf === countDate, `Ilu ubezpieczonych zgłaszał płatnik ${countDate}?`, true);
    } catch (issue) {
      if (!(issue instanceof EvidenceIssue)) throw issue;
    }
    const payer = benefitPayer({ situation: employee ? "employee" : "contract", payerInsuredCount: typeof count === "number" ? count : null, benefitDate: first, schedule });
    items.push({ ...result, from: first, ...(payer.payer ? { payer: payer.payer } : {}), status: "eligible", amountStatus: "needs_information",
      reasonCode: "covered_pregnancy_sickness", needed: [{ field: "payrollRegime", request: `Dołącz ${employee ? "Z-3" : "Z-3a"} z podstawą dla zwolnienia od ${onset}.` },
        ...(payer.question ? [{ field: "payerInsuredCount", request: payer.question }] : [])] });
  }
  let months: BasisMonth[] | null;
  try {
    months = payrollMonths(onset, payerRef, employee, contractor, f => scoped(f) && applies(f, onset), scoped, read);
  } catch (issue) {
    if (!(issue instanceof EvidenceIssue)) throw issue;
    for (const item of items) {
      item.citations = [...result.citations, ...item.citations.filter(c => c.ref === "kp-art92")];
      if (result.assumptions) item.assumptions = [...result.assumptions];
      item.amountStatus = issue.conflict ? "needs_review" : "needs_information";
      item.needed = [{field: issue.field, request: issue.question}, ...(item.needed ?? []).filter(n => n.field !== "payrollRegime")];
    }
    return items;
  }
  if (!months) return items.map(item => ({ ...item, amountStatus: "unsupported", reasonCode: "unsupported_payroll_regime" }));
  const basis = computeBasis({ title: employee ? "pracownik" : "zleceniobiorca", fullTime: employee, basis: {kind:"months", months} }, onset, schedule);
  for (const item of items) {
    Object.assign(item, priceSickness(item, basis, schedule));
    item.needed = item.needed?.filter(n => n.field !== "payrollRegime");
    if (!item.needed?.length) delete item.needed;
    item.citations = [...result.citations, ...item.citations.filter(c => c.ref === "kp-art92"), law(employee ? "uz-art36" : "uz-art48")];
    if (result.assumptions) item.assumptions = [...result.assumptions];
  }
  return items;
}

function assessRequest(input: AssessmentInput, snapshot: AssessmentSnapshot, facts: AssessmentRow[], application: AssessmentRow[]) {
  const result: DecisionResult = {
    status: "needs_information", benefit: input.benefit, subjectId: input.subjectId, amountStatus: "needs_information",
    reasonCode: "missing_evidence", citations: input.benefit === "sickness" ? [law("uz-art6"), law("uz-art7"), law("uz-art13")] : [law("uz-art29-ust1-pkt1")],
  };
  const first = application[0]?.fact;
  const scoped = (f: Fact) => f.titleRef === first?.titleRef && f.payerRef === first?.payerRef;
  function read(field: string, matches: (f: Fact) => boolean, question: string, optional = false) {
    const rows = facts.filter(e => e.fact.field === field && matches(e.fact));
    cite(result, rows);
    if (rows.some(e => e.verification === "disputed") || new Set(rows.map(e => valueOf(e.fact))).size > 1) throw new EvidenceIssue(field, question, true);
    if (!rows.length && !optional) throw new EvidenceIssue(field, question, false);
    return rows[0] ? valueOf(rows[0].fact) : undefined;
  }
  try {
    if (!first) throw new EvidenceIssue("benefitRequest", "Dołącz wniosek z okresem świadczenia, tytułem i płatnikiem.", false);
    cite(result, application);
    const { validFrom: from, validTo: to, titleRef, payerRef } = first;
    if (application.some(e => e.verification === "disputed") || new Set(application.map(e => e.fact.asOf)).size > 1) throw new EvidenceIssue("benefitRequest", "Potwierdź okres i treść wniosku.", true);
    if (!from || !to || !isValidIso(from) || !isValidIso(to) || from > to || !titleRef || !payerRef) throw new EvidenceIssue("benefitRequest", "Potwierdź obie daty, tytuł i płatnika we wniosku.", false);
    Object.assign(result, { from, to, titleRef, payerRef });
    const overlaps = facts.filter(e => e.fact.field === "benefitRequest" && valueOf(e.fact) === input.benefit && scoped(e.fact) &&
      (!e.fact.asOf || e.fact.asOf <= input.asOf) && e.fact.validFrom && e.fact.validTo &&
      e.fact.validFrom <= to && e.fact.validTo >= from && (e.fact.validFrom !== from || e.fact.validTo !== to));
    if (overlaps.length) {
      cite(result, overlaps);
      throw new EvidenceIssue("benefitRequest", "Okresy wniosków dla tego samego tytułu nakładają się. Potwierdź aktualny wniosek lub sprostuj jego daty.", true);
    }
    if (input.benefit === "sickness") return assessPregnancySickness(result, from, to, payerRef, input.asOf, facts, scoped, read, snapshot.schedule);
    const personal = (f: Fact) => (!f.titleRef || f.titleRef === titleRef) && (!f.payerRef || f.payerRef === payerRef);
    const birth = read("deliveryDate", f => personal(f) && (!f.asOf || f.asOf <= input.asOf), "Dołącz potwierdzenie daty porodu wnioskodawczyni.");
    if (typeof birth !== "string" || !isValidIso(birth) || birth > input.asOf) throw new EvidenceIssue("deliveryDate", "Potwierdź faktyczną datę porodu.", true);
    const atBirth = (f: Fact) => scoped(f) && applies(f, birth);
    const event = (f: Fact) => personal(f) && applies(f, birth);
    const childcareLeave = from >= birth && facts.some(e => e.fact.field === "insuranceTitle" && atBirth(e.fact) && valueOf(e.fact) === "employee_childcare_leave")
      && read("insuranceTitle", atBirth, "Potwierdź zatrudnienie i urlop wychowawczy w dniu porodu.") === "employee_childcare_leave";
    const covered = childcareLeave ? undefined : read("sicknessCoverage", atBirth, `Czy poświadczenie chorobowego dla tego tytułu obejmuje ${birth}?`);
    if (covered === "excluded" && from >= birth) {
      const other = read("otherCoverage", event, `Dołącz pełną historię pozostałych tytułów na ${birth}.`);
      const exception = read("postInsuranceException", event, "Czy dokumenty wykluczają uprawnienie po ustaniu ubezpieczenia?");
      const alternate = facts.filter(e => !scoped(e.fact) && applies(e.fact, birth) && (
        (e.fact.field === "sicknessCoverage" && valueOf(e.fact) === "covered") ||
        (e.fact.field === "insuranceTitle" && valueOf(e.fact) === "employee_childcare_leave")));
      cite(result, alternate);
      if (other !== "none" || exception !== "none" || alternate.length) throw new EvidenceIssue("otherCoverage", "Sprawdź inny tytuł lub wyjątek po ustaniu ubezpieczenia.", true);
      result.citations.push(law("uz-art30"));
      return { ...result, status: "ineligible", amountStatus: "not_applicable", reasonCode: "excluded_no_other_title_or_exception" } satisfies DecisionResult;
    }
    const outsideEarlyPeriod = from < birth || to >= addDays(birth, 56);
    const course = read("maternityCourse", event, "Potwierdź historię urlopu za wnioskowany okres (przejęcia, przerwy i zdarzenia wpływające na wymiar).", !outsideEarlyPeriod);
    let children = 1;
    const prenatalDays = read("prenatalLeaveDays", event, "Ile dni urlopu macierzyńskiego wykorzystano przed porodem?", course === undefined) ?? 0;
    if (typeof prenatalDays !== "number" || prenatalDays < 0 || prenatalDays > 42 || !Number.isInteger(prenatalDays)) {
      throw new EvidenceIssue("prenatalLeaveDays", "Sprawdź liczbę dni wykorzystanych przed porodem.", true);
    }
    let deathDates: string[] | undefined;
    if (course !== undefined) {
      if (!["ordinary_uninterrupted", "single_stillbirth", "single_child_death"].includes(String(course))) {
        return { ...result, status: "needs_review", amountStatus: "needs_review", reasonCode: "verify_maternity_period_history" } satisfies DecisionResult;
      }
      const count = read("birthChildCount", event, "Ile dzieci obejmuje ten sam poród?");
      if (typeof count !== "number" || count < 1 || !Number.isSafeInteger(count)) {
        throw new EvidenceIssue("birthChildCount", "Sprawdź liczbę dzieci urodzonych podczas tego porodu.", true);
      }
      children = count;
      if (course !== "ordinary_uninterrupted") {
        if (count !== 1) throw new EvidenceIssue("birthChildCount", "Ustal zdarzenia i okres opieki osobno dla każdego dziecka.", true);
        const death = course === "single_stillbirth" ? birth : read("childDeathDate", event, "Potwierdź datę zgonu dziecka.");
        if (typeof death !== "string" || !isValidIso(death) || death < birth || death > input.asOf) throw new EvidenceIssue("childDeathDate", "Sprawdź datę zdarzenia.", true);
        deathDates = [death];
      }
      const window = birthLeaveWindow(birth, count, prenatalDays, deathDates, snapshot.schedule);
      if (from < window.from || to > window.to) {
        return { ...result, status: "needs_review", amountStatus: "needs_review", reasonCode: "requested_days_outside_entitlement_window" } satisfies DecisionResult;
      }
    }
    if (from < birth && read("sicknessCoverage", f => scoped(f) && applies(f, from), `Potwierdź ubezpieczenie od początku urlopu przed porodem (${from}).`) !== "covered") {
      throw new EvidenceIssue("sicknessCoverage", "Sprawdź tytuł w dniu rozpoczęcia urlopu przed porodem.", true);
    }
    const basisDay = addDays(birth, -prenatalDays);
    if (covered === "ended" && from >= birth) {
      result.citations.push(law("uz-art30-ust1"), law("uz-art61"));
      const ended = facts.filter(e => e.fact.field === "sicknessCoverage" && atBirth(e.fact));
      const starts = new Set(ended.map(e => e.fact.validFrom));
      const firstUninsured = ended[0]?.fact.validFrom;
      if (starts.size !== 1 || !firstUninsured || firstUninsured > birth) {
        throw new EvidenceIssue("sicknessCoverage", "Potwierdź pierwszy dzień po ustaniu ubezpieczenia chorobowego.", starts.size > 1);
      }
      const lastDay = addDays(firstUninsured, -1);
      const onLastDay = (f: Fact) => scoped(f) && applies(f, lastDay);
      const previous = read("sicknessCoverage", onLastDay, `Dołącz historię chorobowego obejmującą ostatni dzień zatrudnienia (${lastDay}).`);
      const title = read("insuranceTitle", onLastDay, `Potwierdź stosunek pracy na ${lastDay}.`);
      if (previous !== "covered" || (title !== "employee" && title !== "pracownik")) {
        throw new EvidenceIssue("insuranceTitle", "Sprawdź wcześniejszy tytuł i jego okres ochrony.", true);
      }
      const pregnancy = read("sicknessCertificate", f => personal(f) && applies(f, lastDay),
        `Dołącz zaświadczenie o ciąży w dniu ustania zatrudnienia (${lastDay}).`);
      if (pregnancy !== "pregnancy") throw new EvidenceIssue("sicknessCertificate", "Potwierdź ciążę w dniu ustania zatrudnienia.", true);
      const cause = read("postInsuranceException", f => onLastDay(f) && f.source.kind === "document" && (!f.asOf || f.asOf <= input.asOf),
        "Dołącz dokument przyczyny ustania zatrudnienia lub prawomocne orzeczenie sądu o naruszeniu prawa.");
      if (!["employer_death", "employer_bankruptcy", "employer_liquidation", "unlawful_termination_final_judgment"].includes(String(cause))) {
        throw new EvidenceIssue("postInsuranceException", "Sprawdź podstawę ustania zatrudnienia i prawomocność orzeczenia.", true);
      }
      return { ...result, status: "eligible", payer: "zus", amountStatus: "needs_review",
        reasonCode: "entitled_after_employment_ended", needed: [{ field: "payrollRegime", request: "Sprawdź podstawę sprzed ustania zatrudnienia w Z-3 byłego pracodawcy." }] } satisfies DecisionResult;
    }
    if (childcareLeave) {
      return { ...result, status: "eligible", amountStatus: "needs_review", reasonCode: "birth_during_childcare_leave",
        needed: [{ field: "payrollRegime", request: "Zweryfikuj w Z-3 podstawę zasiłku z uwzględnieniem miesięcy urlopu wychowawczego." }] } satisfies DecisionResult;
    }
    if (covered !== "covered") throw new EvidenceIssue("sicknessCoverage", "Potwierdź objęcie ubezpieczeniem chorobowym.", true);
    const title = read("insuranceTitle", atBirth, "Potwierdź rodzaj tytułu w dniu porodu.");
    const employee = title === "employee" || title === "pracownik";
    const contractor = title === "contract" || title === "zleceniobiorca";
    const business = title === "business" || title === "dzialalnosc";
    if (!employee && !contractor && !business) return { ...result, status: "unsupported", amountStatus: "unsupported", reasonCode: "unsupported_insurance_title" } satisfies DecisionResult;
    result.status = "eligible";
    const countDay = countDateFor(from);
    let count: string | number | undefined;
    try {
      if (!business) count = read("payerInsuredCount", f => scoped(f) && f.asOf === countDay, `Ilu ubezpieczonych zgłaszał płatnik ${countDay}?`, true);
    } catch (issue) {
      if (!(issue instanceof EvidenceIssue)) throw issue;
      result.needed = [{ field: issue.field, request: issue.question }];
    }
    const payer = benefitPayer({ situation: business ? "self_employed" : contractor ? "contract" : "employee", payerInsuredCount: typeof count === "number" ? count : null, benefitDate: from, schedule: snapshot.schedule });
    if (payer.payer) result.payer = payer.payer;
    else if (payer.question && !result.needed) result.needed = [{ field: "payerInsuredCount", request: payer.question }];
    result.citations.push(law("uz-art61"));
    if (business) {
      try {
        const debt = read("accountArrears", f => scoped(f) && f.asOf === basisDay, `Dołącz saldo składek na ${basisDay}.`, true);
        if (typeof debt !== "number") {
          result.paymentStatus = "needs_information";
          (result.needed ??= []).push({ field: "accountArrears", request: `Dołącz saldo składek na dzień powstania prawa (${basisDay}).` });
        } else {
          let arrears = assessArrears({ covered: true, arrears: debt / 100, rightArisesOn: basisDay, today: input.asOf, paidOn: null, schedule: snapshot.schedule });
          if (arrears.status !== "within_limit" && input.asOf !== basisDay) {
            const settlement = read("debtSettlement", f => scoped(f) && applies(f, input.asOf), "Potwierdź pełną spłatę i jej datę lub niespłacone saldo na dzień oceny.", true);
            if (typeof settlement === "string" && isValidIso(settlement) && settlement >= basisDay && settlement <= input.asOf) {
              arrears = assessArrears({ covered: true, arrears: debt / 100, rightArisesOn: basisDay, today: input.asOf, paidOn: settlement, schedule: snapshot.schedule });
            } else if (settlement !== "unpaid") {
              result.paymentStatus = "needs_information";
              (result.needed ??= []).push({ field: "debtSettlement", request: `Czy i kiedy w całości spłacono dług wykazany ${basisDay}?` });
            }
          }
          if (!result.paymentStatus) result.paymentStatus = arrears.status === "expired" ? "expired" : arrears.status === "withheld_until_paid" ? "withheld" : "payable";
          result.citations.push(law("uz-art2a"));
          if (result.paymentStatus === "expired") return { ...result, status: "ineligible", amountStatus: "not_applicable", reasonCode: "debt_not_settled_in_time" } satisfies DecisionResult;
        }
      } catch (issue) {
        if (!(issue instanceof EvidenceIssue)) throw issue;
        result.paymentStatus = "needs_information";
        (result.needed ??= []).push({ field: issue.field, request: issue.question });
      }
    }
    const atStart = (f: Fact) => scoped(f) && applies(f, from);
    const rateQuestion = "Potwierdź wariant wypłaty za wnioskowany okres.";
    const choice = course === "single_stillbirth" ? "100-70" : read("maternityPayVariant", atStart, rateQuestion);
    if (course !== "single_stillbirth") {
      read("maternityPayVariant", f => scoped(f) && (f.validFrom ? f.validFrom <= to && (!f.validTo || f.validTo >= from) :
        !!f.asOf && f.asOf >= from && f.asOf <= to), rateQuestion);
    }
    if (choice === "815") throw new EvidenceIssue("maternityPayVariant", "Sprawdź, czy wniosek lub deklaracja obejmuje pełny okres macierzyńskiego i należnego rodzicielskiego.", false);
    const variant = choice === "815_full_election" ? "815" : choice;
    if (course === "single_child_death" && variant === "815") throw new EvidenceIssue("maternityPayVariant", "Potwierdź stawkę po zmianie okresu świadczenia.", true);
    if (variant !== "100-70" && variant !== "815") throw new EvidenceIssue("maternityPayVariant", rateQuestion, true);
    if (variant === "815") {
      const coversPeriod = (f: Fact) => atStart(f) && applies(f, to);
      read("maternityPayVariant", coversPeriod, rateQuestion);
      const dates = new Set(facts.filter(e => e.fact.field === "maternityPayVariant" && coversPeriod(e.fact)).map(({fact}) =>
        fact.asOf ?? application.find(e => e.fact.source.referenceId === fact.source.referenceId && e.fact.source.page === fact.source.page)?.fact.asOf));
      const [filed] = dates;
      if (dates.size !== 1 || !filed || filed < birth || filed > input.asOf || filed > addDays(birth, maternityParametersOn(snapshot.schedule, birth).averagedRequestDays)) {
        throw new EvidenceIssue("maternityPayVariant", "Potwierdź datę złożenia wniosku o stawkę uśrednioną.", dates.size > 1 || !!filed);
      }
      result.citations.push(law("uz-art30a"));
    }
    const months = payrollMonths(basisDay, payerRef, employee, contractor, f => scoped(f) && applies(f, basisDay), scoped, read);
    if (!months) return { ...result, amountStatus: "unsupported", reasonCode: "unsupported_payroll_regime" } satisfies DecisionResult;
    const priced = priceMaternityPeriod({
      event: "birth", date: birth, children, prenatalLeaveDays: prenatalDays, childDeathDates: deathDates, stillbirth: course === "single_stillbirth", zaZyciem: false, variant, parentA: { title: employee ? "pracownik" : business ? "dzialalnosc" : "zleceniobiorca", basis: { kind: "months", months }, fullTime: employee },
      parentB: null, weeksBeforeBirth: 0, transferWeeks: 0, supplementaryWeeks: 0, supplementaryParent: "A", parentalWeeksA: 0,
      parentalWeeksB: 0, parentalOrder: "sequential", workA: 0, workB: 0, paternityDays: 0, schedule: snapshot.schedule,
    }, { parent: "A", kind: "macierzynski", from, to });
    if (priced.status !== "calculated") return { ...result, amountStatus: "needs_review", reasonCode: priced.reason } satisfies DecisionResult;
    result.citations.push(law("uz-art31"), law(employee ? "uz-art36" : "uz-art48"));
    return { ...result, amountStatus: "calculated", amountPeriod: "total", grossAmountGrosze: priced.grossAmountGrosze, segments: priced.segments, reasonCode: "insured_at_delivery" } satisfies DecisionResult;
  } catch (issue) {
    if (!(issue instanceof EvidenceIssue)) throw issue;
    const status = issue.conflict ? "needs_review" : "needs_information";
    if (result.status !== "eligible") result.status = status;
    result.amountStatus = status;
    result.reasonCode = issue.conflict ? "conflicting_evidence" : "missing_evidence";
    result.needed = [{ field: issue.field, request: issue.question }, ...(result.needed ?? [])];
    return result;
  }
}

function assess(input: AssessmentInput, snapshot: AssessmentSnapshot, assumptions: FactInput[]): DecisionResult[] {
  if (input.profileRevision !== snapshot.profileRevision || input.caseRevision !== snapshot.caseRevision) throw new Error("assessment_revision_mismatch");
  if (!isValidIso(input.asOf)) throw new Error("invalid_assessment_date");
  if (input.benefit !== "maternity" && input.benefit !== "sickness") return [{ subjectId: input.subjectId, benefit: input.benefit, status: "unsupported", amountStatus: "unsupported", reasonCode: "unsupported_benefit", citations: [] }];
  const evidence = snapshot.facts.filter(e => e.fact.subjectId === input.subjectId && admit(e, snapshot.documents));
  const rows = (f: FactInput) => JSON.stringify([f.subjectId, f.titleRef, f.payerRef, f.validFrom, f.validTo]);
  const replaced = new Map<string, Set<string>>();
  for (const f of assumptions) {
    const key = rows(f);
    const fields = replaced.get(key) ?? new Set<string>();
    if (fields.has(f.field)) throw new Error("duplicate_variant_field");
    fields.add(f.field);
    replaced.set(key, fields);
  }
  const facts: AssessmentRow[] = evidence.filter(e => {
    const fields = replaced.get(rows(e.fact));
    if (!fields || !payFields.has(e.fact.field)) return true;
    if (fields.has("monthlyPayAfterDeduction") || fields.has("monthlyGrossPay")) return false;
    return e.fact.field === "monthlyGrossPay";
  });
  for (const fact of assumptions) facts.push({ fact, verification: "assumed" });
  const applications = new Map<string, AssessmentRow[]>();
  for (const e of facts.filter(e => e.fact.field === "benefitRequest" && valueOf(e.fact) === input.benefit && (!e.fact.asOf || e.fact.asOf <= input.asOf))) {
    const { titleRef, payerRef, validFrom, validTo } = e.fact;
    const key = JSON.stringify([titleRef, payerRef, validFrom, validTo]);
    applications.set(key, [...(applications.get(key) ?? []), e]);
  }
  return (applications.size ? [...applications.values()] : [[]]).flatMap(group => assessRequest(input, snapshot, facts, group));
}

const payFields = new Set<string>(["monthlyGrossPay", "monthlyEmployeeDeduction", "monthlyPayAfterDeduction"]);

export function assessCase(input: AssessmentInput, snapshot: AssessmentSnapshot): DecisionResult[] {
  return assess(input, snapshot, []);
}

/** Ephemeral payroll assumptions; they cannot establish entitlement or become evidence citations. */
export function assessCaseVariant(input: AssessmentInput, snapshot: AssessmentSnapshot, variant: FactInput[]): DecisionResult[] {
  if (!variant.length) throw new Error("empty_assessment_variant");
  const assumptions = variant.map(f => {
    const parsed = factInput.safeParse(f);
    if (!parsed.success || !payFields.has(f.field) || f.source.kind !== "declaration" || f.subjectId !== input.subjectId ||
        !f.titleRef || !f.payerRef || !f.validFrom?.endsWith("-01") || f.validTo !== addDays(addMonths(f.validFrom, 1), -1)) {
      throw new Error("invalid_assessment_variant");
    }
    return parsed.data;
  });
  const decisions = assess(input, snapshot, assumptions);
  for (const f of assumptions) {
    const targets = decisions.filter(d => d.payerRef === f.payerRef && d.titleRef === f.titleRef);
    if (!targets.length || (targets.every(d => d.amountStatus === "calculated") && !targets.some(d => d.assumptions?.includes(f)))) {
      throw new Error("unused_assessment_variant");
    }
  }
  return decisions;
}
