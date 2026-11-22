import { describe, expect, it } from "vitest";
import { appParameters } from "@/lib/admin/catalog";
import { changeSpecFor } from "@/lib/admin/parameter-changes";
import { allTestCases, topUpTestCases } from "@/lib/admin/scenarios";
import { formatGrosze, parentalMinimumTopUp } from "@/lib/rules/rates";

const nbsp = (s: string) => s.replace(/ /g, " ");
const RAISED = { "benefit.parentalMinimum": [{ value: 1200, validFrom: "2027-01-01" }] };

describe("raise to the parental benefit amount (art. 31 ust. 3a)", () => {
  it("raises a lower benefit to 1000 zł a month, proportionally for part of a month", () => {
    expect(parentalMinimumTopUp({ netGrosze: 82000, firstDay: "2027-01-01", days: "whole" })).toMatchObject({
      minimumGrosze: 100000,
      topUpGrosze: 18000,
      paidGrosze: 100000,
    });
    expect(parentalMinimumTopUp({ netGrosze: 41000, firstDay: "2027-02-14", days: 15 }).topUpGrosze).toBe(12570);
    // 7 × 35.71 zł = 249.97 zł, rounded up to 250.00 zł.
    expect(parentalMinimumTopUp({ netGrosze: 0, firstDay: "2027-02-01", days: 7 }).minimumGrosze).toBe(25000);
    expect(parentalMinimumTopUp({ netGrosze: 151200, firstDay: "2027-01-01", days: "whole" }).topUpGrosze).toBe(0);
  });

  it("uses the amount valid on the first benefit day of the month", () => {
    const run = (firstDay: string) => parentalMinimumTopUp({ netGrosze: 82000, firstDay, days: "whole", schedule: RAISED });
    expect(run("2026-12-01").topUpGrosze).toBe(18000);
    expect(run("2027-01-01").topUpGrosze).toBe(38000);
  });

  it("uses the six remaining days of leap February in the panel change check", () => {
    // 1000 / 29 → 34.48 per day. 6 × 34.48 = 206.88 → 206.90.
    const firstDay = "2028-02-24";
    expect(parentalMinimumTopUp({ firstDay, days: 6, netGrosze: 18004 })).toMatchObject({
      minimumGrosze: 20690, topUpGrosze: 2686, paidGrosze: 20690,
    });
    const spec = changeSpecFor("app-parental-minimum")!;
    const partial = spec.checks({}, { value: 1000, validFrom: firstDay, source: "synthetic" })[3];
    expect(partial.expected).toBe(formatGrosze(20690));
    expect(partial.result).toBe(partial.expected);
    expect(parentalMinimumTopUp({ firstDay: "2028-02-01", days: 29, netGrosze: 0 }).minimumGrosze).toBe(100000);
  });

  it("shows the original February reference alongside the current result in the admin cases", () => {
    const february = allTestCases().find(c => c.id === "R-07")!;
    expect(february.expected.map(row => row.value)).toEqual([50000, 9000, 50000].map(formatGrosze));
    expect(february.result.map(row => row.value)).toEqual([53570, 12570, 53570].map(formatGrosze));
    expect(topUpTestCases().map((c) => c.status)).toEqual(["zgodna", "niezgodna", "zgodna"]);
    const after = topUpTestCases(RAISED);
    expect(after[0].status).toBe("do-aktualizacji");
    expect(nbsp(after[0].outdatedBy ?? "")).toContain("1 200 zł od 01.01.2027");
  });

  it("is a changeable parameter of the panel with its impact on a family", () => {
    const row = appParameters().find((p) => p.id === "app-parental-minimum");
    expect(row).toMatchObject({ group: "Stawki", editable: true, origin: "app" });
    expect(nbsp(row?.value ?? "")).toBe("1 000 zł");
    const impact = changeSpecFor("app-parental-minimum")!.impact({}, { value: 1200, validFrom: "2027-01-01" });
    expect(nbsp(impact.at(-1)!.after)).toBe(`+${nbsp(formatGrosze(20000))}`);
  });
});
