import { expect, it } from "vitest";
import { assessCase, type AssessmentSnapshot } from "../src/lib/rules/case-assessment";
import { assessSicknessCase } from "../src/lib/rules/sickness";
import type { Law, PageFact } from "../src/lib/sickness/types";

// Independent fictional records. Expected sums are written in grosze; no production calculator is the oracle.
it("retains maternity entitlement during a payroll gap and prices all nine days once it closes", () => {
  const day = "2026-11-03", subjectId = "qa-mother";
  const input = { asOf: "2026-11-14", benefit: "maternity", subjectId, caseRevision: 3, profileRevision: 8 };
  const docs = ["insurance", "payroll", "certificate", "application"] as const;
  const documents = docs.map(kind => ({ id: kind, metadata: { kind, clientDocumentId: kind, pages: 4 } }));
  type Evidence = AssessmentSnapshot["facts"][number];
  type Fact = Evidence["fact"];
  const code = (code: string) => ({ kind: "code", code } as const);
  const row = (field: Fact["field"], value: Fact["value"], doc: typeof docs[number], page: number,
    dates: Pick<Fact, "asOf" | "validFrom" | "validTo"> = { asOf: day }): Evidence => ({
    verification: "confirmed", version: 1, factId: field + (dates.validFrom || day), recordedAt: "2026-11-14T10:00:00Z",
    fact: { field, value, subjectId, payerRef: "qa-employer", titleRef: "qa-job", ...dates,
      source: { kind: "document", referenceId: doc, page } },
  });
  const claim = { asOf: day, validFrom: day, validTo: "2026-11-11" };
  const facts: Evidence[] = [
    row("benefitRequest", code("maternity"), "application", 1, claim),
    row("deliveryDate", { kind: "date", date: day }, "certificate", 2),
    row("insuranceTitle", code("employee"), "insurance", 1),
    row("sicknessCoverage", code("covered"), "insurance", 2),
    row("payerInsuredCount", { kind: "count", count: 29 }, "insurance", 3, { asOf: "2025-11-30" }),
    row("maternityPayVariant", code("100-70"), "application", 2, claim),
    row("payrollRegime", code("full_time_fixed_full_months"), "payroll", 1),
  ];
  const payroll = Array.from({length: 12}, (_, i) => {
    const iso = (date: Date) => date.toISOString().slice(0, 10);
    return row("monthlyPayAfterDeduction", { kind: "money", currency: "PLN", grosze: i < 6 ? 602742 : 662742 },
      "payroll", i < 6 ? 2 : 4, { validFrom: iso(new Date(Date.UTC(2025, 10 + i, 1))),
        validTo: iso(new Date(Date.UTC(2025, 11 + i, 0))) });
  });
  const read = (entries: Evidence[]) => assessCase(input, { ...input, documents, facts: entries });
  const before = read([...facts, ...payroll.slice(0, 11)]);
  expect(before).toHaveLength(1);
  expect(before[0]).toMatchObject({ status: "eligible", from: day, to: claim.validTo, amountStatus: "needs_information",
    needed: expect.arrayContaining([expect.objectContaining({ request: expect.stringContaining("2026-10") })]) });
  expect(before[0]).not.toHaveProperty("grossAmountGrosze");
  const after = read([...facts, ...payroll]);
  // Mean monthly basis 6327.42, daily amount 210.91 after rounding, nine days at 100%.
  expect(after).toHaveLength(1);
  expect(after[0]).toMatchObject({ subjectId, status: "eligible", from: day, to: claim.validTo,
    grossAmountGrosze: 189819, amountPeriod: "total", amountStatus: "calculated",
    segments: [{ dailyGrosze: 21091, days: 9 }] });
  expect(after[0].citations).toContainEqual({ kind: "document", ref: "payroll", version: "1", page: 4 });
});

it("requires employer evidence before denying the requested sickness period", () => {
  const period = { from: "2026-11-15", to: "2026-11-19" };
  const certificate: PageFact = { kind: "certificate", subject: "qa-parent", payer: "qa-company", title: "pracownik",
    period, onset: period.from, value: "incapacity", page: 3, text: "" };
  const history: PageFact = { ...certificate, kind: "history", title: "wszystkie", payer: "wszystkie",
    value: "never", page: 1, onset: null };
  const exclusion: PageFact = { ...certificate, kind: "employment", value: "excluded", page: 4, onset: null };
  // Source retrieval has its own G7 gate. This pair isolates the evidence supplied to the legacy sickness rule.
  const law: Law[] = ["uz-art6-ust1", "uz-art7", "uz-art11-ust2-pkt1", "uz-art13-ust1"].map(id =>
    ({ id, title: id, url: "https://eli.gov.pl/api/acts/DU/2026/854/text.pdf#page=1" }));
  const read = (pages: PageFact[]) => assessSicknessCase({ pages, otherCoverage: "no" }, law, "2026-11-20");
  const before = read([history, certificate]);
  expect(before.status).toBe("needs_fact");
  expect(before.question).toMatch(/ubezpieczeni/u);
  const after = read([history, exclusion, certificate]);
  expect(after).toMatchObject({ status: "not_entitled_for_period", period, question: null });
  expect(after.evidenceIds).toContain("employment-4");
});
