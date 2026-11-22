import { describe, expect, it } from "vitest";
import { hospitalLeaveWeeks } from "@/lib/rules/hospital-stays";

const birth = "2026-04-01";
const long = [{ from: birth, to: "2026-08-01" }];
const child = (birthWeightGrams: number, stays = long) => ({ birthWeightGrams, stays });
const calc = (gestationDays: number, children = [child(1001)], acceptedOn?: string) => hospitalLeaveWeeks({ birth, gestationDays, children, acceptedOn });

describe("hospital certificates for supplementary leave", () => {
  it("uses the lightest twin and the longest child's distinct days", () => {
    expect(calc(30*7, [child(1000, []), child(1500, [...long, ...long])])).toMatchObject({ days: 105, weeks: 15 });
    expect(calc(28*7, [child(1001)])).toMatchObject({ days: 56, weeks: 8 });
    expect(calc(28*7-1)).toMatchObject({ days: 105, weeks: 15 });
  });
  it("requires two consecutive days with a first day from day 5 through 28 for term births", () => {
    expect(calc(37*7, [child(3000, [{ from: "2026-04-29", to: "2026-04-30" }])]).weeks).toBe(1);
    expect(calc(37*7, [child(3000, [{ from: "2026-04-30", to: "2026-05-01" }])]).weeks).toBe(0);
    expect(calc(37*7-1, [child(3000, [{ from: "2026-04-30", to: "2026-05-01" }])]).weeks).toBe(1);
  });
  it("clips stays to the window after taking a child into care and rounds once after deduplication", () => {
    const stays = [{ from: birth, to: "2026-04-20" }, { from: "2026-04-20", to: "2026-04-21" }, { from: "2026-05-01", to: "2026-05-04" }];
    expect(calc(33*7, [child(2100, stays)], "2026-04-18")).toMatchObject({ days: 7, weeks: 1 });
    expect(() => calc(33*7, [])).toThrow("invalid_hospital_certificate");
  });
});
