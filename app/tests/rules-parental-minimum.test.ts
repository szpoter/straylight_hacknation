import { describe, expect, it } from "vitest";
import { appParameters } from "@/lib/admin/catalog";
import { changeSpecFor } from "@/lib/admin/parameter-changes";
import { topUpTestCases } from "@/lib/admin/scenarios";
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
    expect(parentalMinimumTopUp({ netGrosze: 41000, firstDay: "2027-02-14", days: 15 }).topUpGrosze).toBe(9000);
    // 1000 zł × 7/30 = 233,333… rounded to the grosz.
    expect(parentalMinimumTopUp({ netGrosze: 0, firstDay: "2027-02-01", days: 7 }).minimumGrosze).toBe(23333);
    expect(parentalMinimumTopUp({ netGrosze: 151200, firstDay: "2027-01-01", days: "whole" }).topUpGrosze).toBe(0);
  });

  it("uses the amount valid on the first benefit day of the month", () => {
    const run = (firstDay: string) => parentalMinimumTopUp({ netGrosze: 82000, firstDay, days: "whole", schedule: RAISED });
    expect(run("2026-12-01").topUpGrosze).toBe(18000);
    expect(run("2027-01-01").topUpGrosze).toBe(38000);
  });

  it("test cases match on the initial values and need updating after a published change", () => {
    expect(topUpTestCases().map((c) => c.status)).toEqual(["zgodna", "zgodna", "zgodna"]);
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
