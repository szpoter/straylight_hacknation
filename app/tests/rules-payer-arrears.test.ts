import { describe, expect, it } from "vitest";
import { MINIMUM_WAGE, assessArrears } from "@/lib/rules/arrears";
import { benefitPayer, countDateFor } from "@/lib/rules/payer";

describe("who pays the benefit (art. 61)", () => {
  const employee = (count: number | null, extra = {}) =>
    benefitPayer({ situation: "employee", payerInsuredCount: count, benefitDate: "2027-02-10", ...extra });

  it("employer above 20 insured pays; 20 or fewer means ZUS and a payer certificate", () => {
    expect(employee(21)).toMatchObject({ payer: "employer", payerCertificateNeeded: false });
    expect(employee(20)).toMatchObject({ payer: "zus", payerCertificateNeeded: true });
    expect(employee(3).lawIds).toContain("uz-61-3");
  });

  it("counts insured on 30 November of the previous year", () => {
    expect(countDateFor("2027-02-10")).toBe("2026-11-30");
    expect(employee(null)).toMatchObject({ payer: null, countDate: "2026-11-30" });
    expect(employee(null).question).toContain("30.11.2026");
  });

  it("sends the self-employed and other listed situations straight to ZUS", () => {
    for (const situation of ["self_employed", "cooperating_with_self_employed", "cleric", "after_insurance_ended", "foreign_employer"] as const) {
      expect(benefitPayer({ situation, payerInsuredCount: 500, benefitDate: "2027-02-10" }).payer).toBe("zus");
    }
  });

  it("keeps an ongoing ZUS payment after New Year", () => {
    expect(employee(50, { zusAlreadyPaying: true }).payer).toBe("zus");
  });

  it("uses a threshold published in the panel from its date", () => {
    const schedule = { "payer.insuredThreshold": [{ value: 50, validFrom: "2027-01-01" }] };
    expect(employee(30, { schedule })).toMatchObject({ payer: "zus", threshold: 50 });
    expect(benefitPayer({ situation: "employee", payerInsuredCount: 30, benefitDate: "2026-12-10", schedule }).payer).toBe("employer");
  });
});

describe("contribution arrears (art. 2a)", () => {
  const base = { covered: true, rightArisesOn: "2026-12-08", paidOn: null, today: "2026-12-10" };

  it("threshold is 1% of the minimum wage valid on the day the right arises", () => {
    expect(assessArrears({ ...base, arrears: 0 }).threshold).toBe(48.06);
    expect(assessArrears({ ...base, arrears: 0, rightArisesOn: "2027-01-04" }).threshold).toBe(49.5);
    expect(MINIMUM_WAGE.map((w) => w.value)).toEqual([4666, 4806, 4950]);
  });

  it("at the threshold the benefit is not withheld, above it until the debt is paid", () => {
    expect(assessArrears({ ...base, arrears: 48.06 }).status).toBe("within_limit");
    const above = assessArrears({ ...base, arrears: 48.07 });
    expect(above.status).toBe("withheld_until_paid");
    expect(above.payBy).toBe("2027-06-08");
  });

  it("paying within 6 months keeps the right; later it expires", () => {
    expect(assessArrears({ ...base, arrears: 300, paidOn: "2027-06-08", today: "2027-06-08" }).status).toBe("paid");
    for (const paidOn of ["2027-03-01", "2027-06-09"]) {
      expect(assessArrears({ ...base, arrears: 300, paidOn }).status).toBe("withheld_until_paid");
    }
    expect(assessArrears({ ...base, arrears: 300, today: "2027-06-09" }).status).toBe("expired");
    expect(assessArrears({ ...base, arrears: 300, paidOn: "2027-07-01", today: "2027-07-01" }).status).toBe("expired");
  });

  it("asks for the amount when unknown and skips people the rule does not cover", () => {
    expect(assessArrears({ ...base, arrears: null }).status).toBe("needs_info");
    expect(assessArrears({ ...base, covered: false, arrears: 999 }).status).toBe("not_applicable");
  });

  it("uses a minimum wage published in the panel", () => {
    const schedule = { "wage.minimum": [{ value: 5000, validFrom: "2027-01-01" }] };
    expect(assessArrears({ ...base, arrears: 0, rightArisesOn: "2027-01-04", schedule }).threshold).toBe(50);
  });
});
