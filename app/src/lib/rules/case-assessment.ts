import { factInput, type CaseDocument, type EvidenceFact, type FactInput } from "../zusik/memory/contract";
import { addDays, addMonths, isValidIso } from "./dates";
import { basisMonthLabels, birthLeaveWindow, MATERNITY_RULES_VERSION, type BasisMonth } from "./maternity";
import { maternityParametersOn } from "./maternity-schedule";
import { priceMaternityPeriod } from "./case-maternity";
import { benefitPayer, countDateFor } from "./payer";
import type { RuleSchedule } from "./parameters";

export const CASE_RULE_VERSION = "case-2026-11-22.1/" + MATERNITY_RULES_VERSION;

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
  if (source.kind === "simulated_zus") return ["insuranceTitle", "sicknessCoverage", "otherCoverage", "postInsuranceException", "payerInsuredCount"].includes(field);
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

function assessRequest(input: AssessmentInput, snapshot: AssessmentSnapshot, facts: AssessmentRow[], application: AssessmentRow[]) {
  const result: DecisionResult = {
    status: "needs_information", benefit: input.benefit, subjectId: input.subjectId, amountStatus: "needs_information",
    reasonCode: "missing_evidence", citations: [law("uz-art29-ust1-pkt1")],
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
    const { validFrom: from, validTo: to, asOf: filed, titleRef, payerRef } = first;
    if (application.some(e => e.verification === "disputed") || new Set(application.map(e => e.fact.asOf)).size > 1) throw new EvidenceIssue("benefitRequest", "Potwierdź okres i treść wniosku.", true);
    if (!from || !to || !isValidIso(from) || !isValidIso(to) || from > to || !titleRef || !payerRef) throw new EvidenceIssue("benefitRequest", "Potwierdź obie daty, tytuł i płatnika we wniosku.", false);
    Object.assign(result, { from, to, titleRef, payerRef });
    const birth = read("deliveryDate", f => (!f.titleRef || scoped(f)) && (!f.asOf || f.asOf <= input.asOf), "Dołącz potwierdzenie daty porodu wnioskodawczyni.");
    if (typeof birth !== "string" || !isValidIso(birth) || birth > input.asOf) throw new EvidenceIssue("deliveryDate", "Potwierdź faktyczną datę porodu.", true);
    const atBirth = (f: Fact) => scoped(f) && applies(f, birth);
    const event = (f: Fact) => (!f.titleRef || scoped(f)) && applies(f, birth);
    const outsideEarlyPeriod = from < birth || to >= addDays(birth, 56);
    const course = read("maternityCourse", event, "Potwierdź historię urlopu za wnioskowany okres (przejęcia, przerwy i zdarzenia wpływające na wymiar).", !outsideEarlyPeriod);
    let children = 1;
    let prenatalDays = 0;
    let deathDates: string[] | undefined;
    if (course !== undefined) {
      if (!["ordinary_uninterrupted", "single_stillbirth", "single_child_death"].includes(String(course))) {
        return { ...result, status: "needs_review", amountStatus: "needs_review", reasonCode: "verify_maternity_period_history" } satisfies DecisionResult;
      }
      const count = read("birthChildCount", event, "Ile dzieci obejmuje ten sam poród?");
      const before = read("prenatalLeaveDays", event, "Ile dni urlopu macierzyńskiego wykorzystano przed porodem?");
      if (typeof count !== "number" || count < 1 || !Number.isSafeInteger(count) || typeof before !== "number" || before < 0 || before > 42 || !Number.isInteger(before)) {
        throw new EvidenceIssue("maternityCourse", "Sprawdź liczbę dzieci i dni urlopu przed porodem.", true);
      }
      children = count;
      prenatalDays = before;
      if (course !== "ordinary_uninterrupted") {
        if (count !== 1) throw new EvidenceIssue("birthChildCount", "Ustal zdarzenia i okres opieki osobno dla każdego dziecka.", true);
        const death = course === "single_stillbirth" ? birth : read("childDeathDate", event, "Potwierdź datę zgonu dziecka.");
        if (typeof death !== "string" || !isValidIso(death) || death < birth || death > input.asOf) throw new EvidenceIssue("childDeathDate", "Sprawdź datę zdarzenia.", true);
        deathDates = [death];
      }
      const window = birthLeaveWindow(birth, count, before, deathDates, snapshot.schedule);
      if (from < window.from || to > window.to) {
        return { ...result, status: "needs_review", amountStatus: "needs_review", reasonCode: "requested_days_outside_entitlement_window" } satisfies DecisionResult;
      }
    }
    if (from < birth && read("sicknessCoverage", f => scoped(f) && applies(f, from), `Potwierdź ubezpieczenie od początku urlopu przed porodem (${from}).`) !== "covered") {
      throw new EvidenceIssue("sicknessCoverage", "Sprawdź tytuł w dniu rozpoczęcia urlopu przed porodem.", true);
    }
    const covered = read("sicknessCoverage", atBirth, `Czy poświadczenie chorobowego dla tego tytułu obejmuje ${birth}?`);
    if (covered === "excluded") {
      const personal = (f: Fact) => (!f.titleRef || scoped(f)) && applies(f, birth);
      const other = read("otherCoverage", personal, `Dołącz pełną historię pozostałych tytułów na ${birth}.`);
      const exception = read("postInsuranceException", personal, "Czy dokumenty wykluczają uprawnienie po ustaniu ubezpieczenia?");
      const alternate = facts.filter(e => e.fact.field === "sicknessCoverage" && !scoped(e.fact) && applies(e.fact, birth) && valueOf(e.fact) === "covered");
      cite(result, alternate);
      if (other !== "none" || exception !== "none" || alternate.length) throw new EvidenceIssue("otherCoverage", "Sprawdź inny tytuł lub wyjątek po ustaniu ubezpieczenia.", true);
      result.citations.push(law("uz-art30"));
      return { ...result, status: "ineligible", amountStatus: "not_applicable", reasonCode: "excluded_no_other_title_or_exception" } satisfies DecisionResult;
    }
    if (covered !== "covered") throw new EvidenceIssue("sicknessCoverage", "Potwierdź objęcie ubezpieczeniem chorobowym.", true);
    const title = read("insuranceTitle", atBirth, "Potwierdź rodzaj tytułu w dniu porodu.");
    if (title !== "employee" && title !== "pracownik") return { ...result, status: "unsupported", amountStatus: "unsupported", reasonCode: "unsupported_insurance_title" } satisfies DecisionResult;
    result.status = "eligible";
    const countDay = countDateFor(from);
    let count: string | number | undefined;
    try {
      count = read("payerInsuredCount", f => scoped(f) && f.asOf === countDay, `Ilu ubezpieczonych zgłaszał płatnik ${countDay}?`, true);
    } catch (issue) {
      if (!(issue instanceof EvidenceIssue)) throw issue;
      result.needed = [{ field: issue.field, request: issue.question }];
    }
    const payer = benefitPayer({ situation: "employee", payerInsuredCount: typeof count === "number" ? count : null, benefitDate: from, schedule: snapshot.schedule });
    if (payer.payer) result.payer = payer.payer;
    else if (payer.question && !result.needed) result.needed = [{ field: "payerInsuredCount", request: payer.question }];
    result.citations.push(law("uz-art61"));
    const variant = course === "single_stillbirth" ? "100-70" : read("maternityPayVariant", f => scoped(f) && applies(f, from), "Potwierdź wybraną stawkę na wniosku oraz datę jego złożenia.");
    if (course === "single_child_death" && variant === "815") throw new EvidenceIssue("maternityPayVariant", "Potwierdź stawkę po zmianie okresu świadczenia.", true);
    if (variant !== "100-70" && variant !== "815") throw new EvidenceIssue("maternityPayVariant", "Sprawdź wybór stawki na wniosku.", true);
    if (variant === "815" && (!filed || !isValidIso(filed) || filed < birth || filed > addDays(birth, maternityParametersOn(snapshot.schedule, birth).averagedRequestDays))) throw new EvidenceIssue("maternityPayVariant", "Sprawdź datę wniosku o stawkę uśrednioną i właściwą stawkę.", true);
    const basisDay = addDays(birth, -prenatalDays);
    const monthsDue = basisMonthLabels(basisDay);
    const regime = read("payrollRegime", atBirth, `Dołącz Z-3 płatnika ${payerRef} z informacją o etacie i wynagrodzeniach za okres od ${monthsDue[0]} do ${monthsDue.at(-1)}.`);
    if (regime !== "full_time_fixed_full_months") return { ...result, amountStatus: "unsupported", reasonCode: "unsupported_payroll_regime" } satisfies DecisionResult;
    const months: BasisMonth[] = monthsDue.map(month => {
      const start = month + "-01";
      const end = addDays(addMonths(start, 1), -1);
      const row = (f: Fact) => scoped(f) && f.validFrom === start && f.validTo === end;
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
    const priced = priceMaternityPeriod({
      event: "birth", date: birth, children, prenatalLeaveDays: prenatalDays, childDeathDates: deathDates, stillbirth: course === "single_stillbirth", zaZyciem: false, variant, parentA: { title: "pracownik", basis: { kind: "months", months }, fullTime: true },
      parentB: null, weeksBeforeBirth: 0, transferWeeks: 0, supplementaryWeeks: 0, supplementaryParent: "A", parentalWeeksA: 0,
      parentalWeeksB: 0, parentalOrder: "sequential", workA: 0, workB: 0, paternityDays: 0, schedule: snapshot.schedule,
    }, { parent: "A", kind: "macierzynski", from, to });
    if (priced.status !== "calculated") return { ...result, amountStatus: "needs_review", reasonCode: priced.reason } satisfies DecisionResult;
    result.citations.push(law("uz-art31"), law("uz-art36"));
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
  if (input.benefit !== "maternity") return [{ subjectId: input.subjectId, benefit: input.benefit, status: "unsupported", amountStatus: "unsupported", reasonCode: "unsupported_benefit", citations: [] }];
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
  return (applications.size ? [...applications.values()] : [[]]).map(group => assessRequest(input, snapshot, facts, group));
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
