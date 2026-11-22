import { describe, expect, it } from "vitest";
import { priceMaternityPeriod } from "@/lib/rules/case-maternity";
import { computeScenario, type ScenarioInput } from "@/lib/rules/maternity";

const employee = { title: "pracownik", fullTime: true, basis: { kind: "known", amount: 6000 } } as const;
const base: ScenarioInput = {
  event: "birth", date: "2026-05-11", children: 1, zaZyciem: false, variant: "100-70",
  parentA: employee, parentB: employee, weeksBeforeBirth: 0, transferWeeks: 0,
  supplementaryWeeks: 0, supplementaryParent: "A", parentalWeeksA: 0, parentalWeeksB: 0,
  parentalOrder: "sequential", workA: 0, workB: 0, paternityDays: 0,
};

describe("one employment per parent, independent leave calendars", () => {
  it("prices the father's parental week while the mother takes maternity leave", () => {
    const result = computeScenario({ ...base, parentalWeeksB: 1, parentalStarts: { B: base.date } });
    expect(result.ok).toBe(true);
    expect(result.periods.find(p => p.kind === "rodzicielski")).toMatchObject({
      parent: "B", from: "2026-05-11", to: "2026-05-17", daily: 140, amount: 980,
    });
  });

  it("flags an overlapping paternity and parental week for the same employee", () => {
    const result = computeScenario({ ...base, parentalWeeksB: 1, paternityDays: 7, paternityStart: "2026-09-28" });
    expect(result.ok).toBe(false);
  });

  it("allows adjacent leave for the same employee", () => {
    const result = computeScenario({ ...base, parentalWeeksB: 1, paternityDays: 7, paternityStart: "2026-09-21" });
    expect(result.ok).toBe(true);
    expect(result.totals.B).toBe(2380);
  });

  it("checks the age limit through the end of the father's tenth week", () => {
    expect(computeScenario({ ...base, parentalWeeksB: 10, parentalStarts: { B: "2032-10-26" } }).ok).toBe(false);
  });

  it("checks the age limit for an automatically scheduled second parent", () => {
    expect(computeScenario({ ...base, parentalWeeksA: 1, parentalWeeksB: 1, parentalStarts: { A: "2032-12-25" } }).ok).toBe(false);
  });

  it.each([3, 15])("requires a valid paternity leave duration instead of pricing %i days", days => {
    expect(computeScenario({ ...base, paternityDays: days }).ok).toBe(false);
  });

  it("asks for a corrected paternity date when the supplied day does not exist", () => {
    expect(computeScenario({ ...base, paternityDays: 7, paternityStart: "2026-09-31" }).ok).toBe(false);
  });
});

describe("monthly minimum for one insured title, with zero tax advance", () => {
  const low = { ...employee, fullTime: false, basis: { kind: "known", amount: 1005 } } as const;
  it("raises a full February to exactly 1000 zł based on the sum of daily payments", () => {
    const result = computeScenario({ ...base, date: "2026-02-01", parentA: low });
    expect(result.segments[0]).toMatchObject({ amount: 1000, topUp: 62, daily: 33.5, days: 28 });
    expect(result.assumptions.some(a => a.text.includes("zaliczkę"))).toBe(true);
    expect(priceMaternityPeriod({ ...base, date: "2026-02-01", parentA: low },
      { parent: "A", kind: "macierzynski", from: "2026-02-01", to: "2026-02-28" }).status).toBe("needs_review");
  });
  it("rounds the part-month minimum up to 10 gr before subtracting the actual payment", () => {
    const result = computeScenario({ ...base, date: "2026-01-30", parentA: { ...low, basis: { kind: "known", amount: 654.30 } } });
    // January daily floor 32.26 × 2 → 64.60; daily benefit 21.81 × 2 = 43.62.
    expect(result.segments[0]).toMatchObject({ amount: 64.60, topUp: 20.98, days: 2 });
    // A published increase on the first benefit day: 1200 / 29 → 41.38 × 6 → 248.30.
    const leap = computeScenario({ ...base, date: "2028-02-24", parentA: low,
      schedule: { "benefit.parentalMinimum": [{ value: 1200, validFrom: "2028-02-24" }] } });
    expect(leap.segments[0]).toMatchObject({ amount: 248.30, topUp: 47.30, days: 6 });
  });
  it("combines maternity and parental payments before checking the floor for that month", () => {
    const result = computeScenario({ ...base, date: "2026-01-01", parentA: { ...low, basis: { kind: "known", amount: 1200 } }, parentalWeeksA: 4 });
    const may = result.segments.filter(s => s.parent === "A" && s.month === "2026-05");
    // 20 maternity days × 40 plus 11 parental days × 28 = 1108.
    expect(may.map(s => s.amount)).toEqual([800, 308]);
  });
});
