import { describe, expect, it } from "vitest";
import { DEFAULTS, formatValue, parameterOn, validateValue } from "@/lib/rules/parameters";
import { benefitForPeriod, formatGrosze, rateOn } from "@/lib/rules/rates";
import { TOTAL_DAYS } from "@/lib/rules/paternity";

describe("benefit rates (ZUS task p. 9)", () => {
  it("uses 100%, 70% and 81,5% from the code", () => {
    expect(rateOn("maternity", "2027-01-01")).toBe(1000);
    expect(rateOn("parental", "2027-01-01")).toBe(700);
    expect(rateOn("averaged", "2027-01-01")).toBe(815);
    expect(formatValue("rate.averaged", 815)).toBe("81,5%");
    expect(formatValue("rate.parental", 700)).toBe("70%");
  });

  it("SPEC §12 example: 200 zł daily base, 28 days, 70% → 75% gives +280 zł", () => {
    const before = benefitForPeriod({ kind: "parental", dailyBase: 200, start: "2027-01-04", days: 28 });
    const schedule = { "rate.parental": [{ value: 750, validFrom: "2027-01-01" }] };
    const after = benefitForPeriod({ kind: "parental", dailyBase: 200, start: "2027-01-04", days: 28, schedule });
    expect(before.totalGrosze).toBe(392000);
    expect(after.totalGrosze).toBe(420000);
    expect(after.totalGrosze - before.totalGrosze).toBe(28000);
    expect(formatGrosze(after.totalGrosze - before.totalGrosze).replace(/ /g, " ")).toBe("280,00 zł");
  });

  it("splits a period that crosses the change date", () => {
    const schedule = { "rate.parental": [{ value: 750, validFrom: "2027-01-01" }] };
    const r = benefitForPeriod({ kind: "parental", dailyBase: 200, start: "2026-12-29", days: 7, schedule });
    expect(r.parts.map((p) => [p.from, p.to, p.days, p.rate10])).toEqual([
      ["2026-12-29", "2026-12-31", 3, 700],
      ["2027-01-01", "2027-01-04", 4, 750],
    ]);
    expect(r.totalGrosze).toBe(3 * 14000 + 4 * 15000);
  });

  it("rounds the daily benefit to the grosz", () => {
    expect(benefitForPeriod({ kind: "parental", dailyBase: 133.33, start: "2027-01-04", days: 28 }).totalGrosze).toBe(9333 * 28);
  });

  it("validates rates in tenths of a percent", () => {
    expect(validateValue("rate.parental", 750)).toEqual([]);
    expect(validateValue("rate.parental", 1001)).not.toEqual([]);
    expect(validateValue("rate.parental", 75.5)).not.toEqual([]);
  });
});

describe("parameter defaults", () => {
  it("agree with the rule constants and the task's form changes", () => {
    expect(DEFAULTS["paternity.totalDays"][0].value).toBe(TOTAL_DAYS);
    expect(parameterOn({}, "form.ZUR", "2026-10-23").value).toBe(1);
    expect(parameterOn({}, "form.ZUR", "2026-10-24").value).toBe(0);
    expect(parameterOn({}, "form.ZAM", "2026-10-24").value).toBe(1);
  });
});
