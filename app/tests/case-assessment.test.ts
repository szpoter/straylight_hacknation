import { describe, expect, it } from "vitest";
import { assessCase, assessCaseVariant, type AssessmentSnapshot } from "@/lib/rules/case-assessment";
import { computeScenario } from "@/lib/rules/maternity";
import { addDays, addMonths } from "@/lib/rules/dates";

type Evidence = AssessmentSnapshot["facts"][number];
type Fact = Evidence["fact"];
const period = { validFrom: "2026-06-25", validTo: "2026-07-08" };
const scope = { titleRef: "title-A", payerRef: "payer-P" };
const input = { asOf: "2026-07-09", subjectId: "person-A", benefit: "maternity", caseRevision: 3, profileRevision: 6 };
const code = (code: string) => ({ kind: "code", code } as const);
const money = (grosze: number) => ({ kind: "money", grosze, currency: "PLN" } as const);
const doc = (id: string, kind: AssessmentSnapshot["documents"][number]["metadata"]["kind"]) => ({ id, metadata: { kind, clientDocumentId: id, pages: 3 } });
const documents = [doc("application", "application"), doc("insurance", "insurance"), doc("certificate", "certificate"), doc("payroll", "payroll"), doc("decision", "decision")];
function entry(field: Fact["field"], value: Fact["value"], source: string, f: Partial<Fact> = {}): Evidence {
  const fact = { field, value, source: { kind: "document" as const, referenceId: source, page: 2 }, ...scope, subjectId: input.subjectId, asOf: period.validFrom, ...f };
  return { fact, factId: field + "-" + (fact.validFrom ?? fact.asOf), version: 1, recordedAt: "2026-07-09T00:00:00Z", verification: "confirmed" };
}
const right = [
  entry("benefitRequest", code("maternity"), "application", period),
  entry("deliveryDate", { kind: "date", date: period.validFrom }, "certificate"),
  entry("insuranceTitle", code("employee"), "insurance"),
  entry("sicknessCoverage", code("covered"), "insurance"),
];
const paid = [
  entry("maternityPayVariant", code("100-70"), "application", period),
  entry("payerInsuredCount", { kind: "count", count: 21 }, "insurance", { asOf: "2025-11-30" }),
  entry("payrollRegime", code("full_time_fixed_full_months"), "payroll"),
  ...Array.from({length: 12}, (_, i) => {
    const validFrom = addMonths("2025-06-01", i);
    const row = { validFrom, validTo: addDays(addMonths(validFrom, 1), -1), asOf: undefined };
    return [entry("monthlyGrossPay", money(600000), "payroll", row), entry("monthlyEmployeeDeduction", money(82260), "payroll", row)];
  }).flat(),
];
const verdict = (facts: Evidence[], changes: Partial<AssessmentSnapshot> = {}) =>
  assessCase(input, { facts, documents, caseRevision: 3, profileRevision: 6, ...changes })[0];
const excluded = [right[0], right[1], entry("sicknessCoverage", code("excluded"), "insurance"), entry("otherCoverage", code("none"), "insurance"), entry("postInsuranceException", code("none"), "certificate")];

describe("independent case assessment", () => {
  it("denies a confirmed exclusion only once other titles and exceptions have been ruled out", () => {
    const decision = verdict(excluded);
    expect(decision).toMatchObject({ status: "ineligible", reasonCode: "excluded_no_other_title_or_exception", amountStatus: "not_applicable", from: period.validFrom, to: period.validTo });
    expect(decision.citations).toContainEqual({ kind: "document", ref: "insurance", version: "1", page: 2 });
    for (const field of ["sicknessCoverage", "otherCoverage", "postInsuranceException"]) {
      expect(verdict(excluded.filter(e => e.fact.field !== field))).toMatchObject({ status: "needs_information", needed: [{ field, request: expect.any(String) }] });
    }
  });
  it("calculates only the claimed days in grosze and cites the used evidence", () => {
    const decision = verdict([...right, ...paid]);
    expect(decision).toMatchObject({ status: "eligible", grossAmountGrosze: 241612, amountPeriod: "total", payer: "employer", segments: [{ basisGrosze: 517740, days: 6 }, { dailyGrosze: 17258, days: 8 }] });
    expect(decision.citations).toContainEqual({ kind: "fact", ref: "monthlyGrossPay-2026-04-01", version: "1" });
    const calculator = computeScenario({ event: "birth", date: period.validFrom, children: 1, zaZyciem: false, variant: "100-70",
      parentA: { title: "pracownik", fullTime: true, basis: { kind: "average", amount: 6000 } }, parentB: null,
      weeksBeforeBirth: 0, transferWeeks: 0, supplementaryWeeks: 0, supplementaryParent: "A", parentalWeeksA: 0, parentalWeeksB: 0, parentalOrder: "sequential", workA: 0, workB: 0, paternityDays: 0 });
    expect(decision.segments?.[0].dailyGrosze).toBe(calculator.segments[0].daily * 100);
  });
  it("keeps entitlement and asks for the exact payroll month after removing just one row", () => {
    const facts = [...right, ...paid].filter(e => e.fact.validFrom !== "2026-02-01");
    const decision = verdict([...facts, entry("monthlyPayAfterDeduction", money(517740), "decision", { validFrom: "2026-02-01", validTo: "2026-02-28" })]);
    expect(decision).toMatchObject({ status: "eligible", amountStatus: "needs_information", needed: [{ field: "monthlyGrossPay", request: expect.stringMatching(/Z-3.*2026-02/) }] });
    expect(decision).not.toHaveProperty("grossAmountGrosze");
    expect(decision.citations.some(c => c.ref === "decision")).toBe(false);
    expect(verdict([...facts, entry("monthlyPayAfterDeduction", money(517740), "payroll", { validFrom: "2026-02-01", validTo: "2026-02-28" })]).grossAmountGrosze).toBe(241612);
  });
  it("distinguishes a disagreement from a duplicate, a different person, and a withdrawn fact", () => {
    const all = [...right, ...paid];
    const different = entry("deliveryDate", { kind: "date", date: "2026-06-26" }, "certificate");
    expect(verdict([...all, different]).status).toBe("needs_review");
    expect(verdict([...all, ...right, { ...different, verification: "withdrawn" }, { ...different, fact: { ...different.fact, subjectId: "person-B" } }]).grossAmountGrosze).toBe(241612);
    expect(verdict(all, { documents: documents.filter(d => d.id !== "insurance") }).status).toBe("needs_information");
  });
  it("refuses a stale snapshot, another insurance title or an unconfirmed coverage assertion", () => {
    expect(() => verdict(right, { caseRevision: 4 })).toThrow("assessment_revision_mismatch");
    expect(verdict([...excluded, entry("sicknessCoverage", code("covered"), "insurance", {titleRef: "title-B"})]).status).toBe("needs_review");
    expect(verdict([...right.slice(0,3), {...right[3], verification: "declared"}]).status).toBe("needs_information");
  });
});


it("picks the individual page role in a mixed file and ignores a final decision page", () => {
  const documents: AssessmentSnapshot["documents"] = [{ id: "packet", metadata: { clientDocumentId: "packet", kind: "other", pages: 5,
    pageKinds: ["application", "insurance", "certificate", "payroll", "decision"] } }];
  const page: Record<string, number> = { application: 1, insurance: 2, certificate: 3, payroll: 4 };
  const facts = [...right, ...paid].map(e => ({ ...e, fact: { ...e.fact, source: { kind: "document" as const, referenceId: "packet", page: page[e.fact.source.referenceId] } } }));
  expect(verdict(facts, { documents }).grossAmountGrosze).toBe(241612);
  const contaminated = facts.map(e => e.fact.field === "sicknessCoverage" ? { ...e, fact: { ...e.fact, source: { ...e.fact.source, page: 5 } } } : e);
  const missing = verdict(contaminated, { documents });
  expect(missing.status).toBe("needs_information");
  expect(missing.citations.some(c => c.page === 5)).toBe(false);
});

describe("ephemeral payroll variants", () => {
  const snapshot = { facts: [...right, ...paid], documents, caseRevision: 3, profileRevision: 6 };
  const pay = (field: Fact["field"], grosze: number): Fact => ({ field, subjectId: input.subjectId, ...scope, validFrom: "2026-02-01", validTo: "2026-02-28",
    value: money(grosze), source: { kind: "declaration", referenceId: "what-if" } });
  it("prices a missing or altered month without citing the hypothetical pay as an employer fact", () => {
    const variant = [pay("monthlyPayAfterDeduction", 637740)];
    for (const facts of [snapshot.facts, snapshot.facts.filter(e => e.fact.validFrom !== "2026-02-01")]) {
      const [answer] = assessCaseVariant(input, { ...snapshot, facts }, variant);
      expect(answer).toMatchObject({ status: "eligible", grossAmountGrosze: 246274, assumptions: variant });
      expect(answer.citations.some(c => c.ref.includes("2026-02-01") || c.ref === "what-if")).toBe(false);
    }
    expect(assessCase(input, snapshot)[0]).toMatchObject({ grossAmountGrosze: 241612 });
    expect(assessCase(input, snapshot)[0].assumptions).toBeUndefined();
  });
  it("requires deductions for a changed gross salary and rejects an insurance or cross-person assumption", () => {
    const change = pay("monthlyGrossPay", 700000);
    expect(assessCaseVariant(input, snapshot, [change])[0]).toMatchObject({ status: "eligible", amountStatus: "needs_information", needed: [{ field: "monthlyEmployeeDeduction", request: expect.stringContaining("2026-02") }] });
    for (const invalid of [{...change, subjectId: "person-B"}, { ...change, field: "sicknessCoverage" as const, value: code("covered") }]) {
      expect(() => assessCaseVariant(input, snapshot, [invalid])).toThrow("invalid_assessment_variant");
    }
  });
});
