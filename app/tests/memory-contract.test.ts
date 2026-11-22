import { describe, expect, it } from "vitest";
import { factInput, factValueKinds, profilePatch, type FactInput } from "../src/lib/zusik/memory/contract";

const declared: FactInput = { subjectId: "person-A", field: "monthlyGrossPay",
  value: { kind: "money", currency: "PLN", grosze: 600000 }, titleRef: "title-A", payerRef: "payer-P",
  validFrom: "2026-02-01", validTo: "2026-02-28", source: { kind: "declaration", referenceId: "statement-A" } };
const document: FactInput = { ...declared, value: { kind: "money", currency: "PLN", grosze: 650000 },
  source: { kind: "document", referenceId: "document-from-case", page: 2 } };

describe("memory v1 synthetic wire examples", () => {
  it.each([
    [{ action: "add_subject", subjectId: "person-A", role: "parent" }, { action: "add_fact", fact: declared }],
    [{ action: "correct_fact", previousFactId: "fact-from-read", fact: document }],
    [{ action: "change_from", previousFactId: "fact-from-read", fact: { ...declared, validFrom: "2026-02-15" } }],
  ])("parses a patch", (...changes) => expect(profilePatch.safeParse({ changes }).success).toBe(true));
  it.each([{ ...declared, value: { kind: "code", code: "600000" } }, { ...declared, validTo: "2026-02-30" },
    { ...declared, validTo: "2026-01-31" }, { ...document, ownerSession: "in-body" }])("rejects an invalid fact", f => {
    expect(factInput.safeParse(f).success).toBe(false);
  });
  it("keeps hypotheses outside the write contract", () => {
    expect(profilePatch.safeParse({ changes: [{ action: "hypothetical", fact: declared }] }).success).toBe(false);
  });
});

it("admits the scoped underwriting and payroll fields consumed by the maternity assessor", () => {
  const values = {
    benefitRequest: { kind: "code", code: "maternity" }, deliveryDate: { kind: "date", date: "2026-06-25" },
    sicknessCoverage: { kind: "code", code: "covered" }, otherCoverage: { kind: "code", code: "none" },
    postInsuranceException: { kind: "code", code: "none" }, maternityPayVariant: { kind: "code", code: "100-70" },
    payrollRegime: { kind: "code", code: "full_time_fixed_full_months" },
    monthlyEmployeeDeduction: { kind: "money", grosze: 82260, currency: "PLN" },
    monthlyPayAfterDeduction: { kind: "money", grosze: 517740, currency: "PLN" }, payerInsuredCount: { kind: "count", count: 21 },
  };
  for (const [field,value] of Object.entries(values)) {
    const fact = { ...document, field, value, asOf: "2026-02-01" };
    expect(factInput.parse(fact)).toEqual(fact);
    expect(factInput.safeParse({ ...fact, value: { kind: "count", count: -1 } }).success).toBe(false);
  }
});

it.each([
  ["birthChildCount", {kind:"count",count:2}],
  ["prenatalLeaveDays", {kind:"count",count:0}],
  ["maternityCourse", {kind:"code",code:"ordinary_uninterrupted"}],
  ["childDeathDate", {kind:"date",date:"2026-06-26"}],
  ["debtSettlement", {kind:"code",code:"unpaid"}],
  ["debtSettlement", {kind:"code",code:"2026-05-19"}],
  ["monthlyContributionBasis", {kind:"money",grosze:400000,currency:"PLN"}],
  ["accountArrears", {kind:"money",grosze:0,currency:"PLN"}],
] as const)("validates the value kind for %s", (field,value) => {
  const fact={...document,field,value};
  expect(factValueKinds[field]).toBe(value.kind);
  expect(factInput.parse(fact)).toEqual(fact);
  expect(factInput.safeParse({...fact,value:value.kind==="money"?{kind:"count",count:0}:declared.value}).success).toBe(false);
});
