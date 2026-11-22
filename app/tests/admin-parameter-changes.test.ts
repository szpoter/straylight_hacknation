import { describe, expect, it } from "vitest";
import { checksPassed } from "@/lib/admin/change-checks";
import { CHANGE_SPECS, changeSpecFor } from "@/lib/admin/parameter-changes";
import { rateTestCases } from "@/lib/admin/scenarios";

const plausible: Record<string, { value: number; validFrom: string }> = {
  "paternity.totalDays": { value: 21, validFrom: "2027-01-01" },
  "rate.maternity": { value: 950, validFrom: "2027-01-01" },
  "rate.parental": { value: 750, validFrom: "2027-01-01" },
  "rate.averaged": { value: 800, validFrom: "2027-01-01" },
  "payer.insuredThreshold": { value: 30, validFrom: "2027-01-01" },
  "wage.minimum": { value: 5000, validFrom: "2027-01-01" },
  "benefit.parentalMinimum": { value: 1200, validFrom: "2027-01-01" },
  "maternity.weeks1": { value: 22, validFrom: "2027-01-01" },
  "maternity.weeks2": { value: 32, validFrom: "2027-01-01" },
  "maternity.weeks3": { value: 34, validFrom: "2027-01-01" },
  "maternity.weeks4": { value: 36, validFrom: "2027-01-01" },
  "maternity.weeks5": { value: 38, validFrom: "2027-01-01" },
  "parental.weeksOne": { value: 42, validFrom: "2027-01-01" },
  "parental.weeksMany": { value: 44, validFrom: "2027-01-01" },
  "parental.weeksOneZaZyciem": { value: 66, validFrom: "2027-01-01" },
  "parental.weeksManyZaZyciem": { value: 68, validFrom: "2027-01-01" },
  "parental.exclusiveWeeks": { value: 10, validFrom: "2027-01-01" },
  "averaged.requestDays": { value: 28, validFrom: "2027-01-01" },
  "contributions.employeePct": { value: 1400, validFrom: "2027-01-01" },
  "form.ZAM": { value: 0, validFrom: "2027-03-01" },
  "form.ZUR": { value: 1, validFrom: "2027-01-01" },
};

describe("change registry", () => {
  it("has a unique catalogue id per parameter", () => {
    expect(new Set(CHANGE_SPECS.map((s) => s.catalogId)).size).toBe(CHANGE_SPECS.length);
    expect(changeSpecFor("app-rate-parental")?.parameter).toBe("rate.parental");
  });

  for (const spec of CHANGE_SPECS) {
    const draft = plausible[spec.parameter] ?? { value: 0, validFrom: "2027-01-01" };
    it(`${spec.parameter}: a plausible change passes its checks, a missing source fails`, () => {
      const rows = spec.checks({}, { ...draft, source: "art. 1" });
      expect(rows.filter((r) => r.status === "niezgodna")).toEqual([]);
      expect(checksPassed(spec.checks({}, { ...draft, source: "" }))).toBe(false);
      expect(spec.impact({}, draft).length).toBeGreaterThan(0);
    });
  }

  it("parental rate 70% → 75%: impact shows +280 zł and R-01 is reported as changing", () => {
    const spec = changeSpecFor("app-rate-parental")!;
    const draft = { value: 750, validFrom: "2027-01-01" };
    const impact = spec.impact({}, draft).map((r) => [r.label, r.before, r.after.replace(/ /g, " ")]);
    expect(impact.at(-1)).toEqual(["Różnica", "—", "+280,00 zł"]);
    const info = spec.checks({}, { ...draft, source: "art. 1" }).filter((r) => r.status === "informacja");
    expect(info.map((r) => r.name.slice(0, 4))).toContain("R-01");
  });

  it("typed values: weeks, percent with comma, integers, flags", () => {
    expect(changeSpecFor("app-paternity-total")!.toValue("3")).toBe(21);
    expect(changeSpecFor("app-rate-averaged")!.toValue("81,5")).toBe(815);
    expect(changeSpecFor("app-rate-averaged")!.toValue("81,55")).toBeNull();
    expect(changeSpecFor("app-wage-minimum")!.toValue("5 020")).toBe(5020);
    expect(changeSpecFor("app-form-ZUR")!.toValue("0")).toBe(0);
  });
});

describe("amount test cases", () => {
  it("match the hand-worked amounts, and change after a published rate", () => {
    expect(rateTestCases().map((c) => [c.id, c.status])).toEqual([
      ["R-01", "zgodna"],
      ["R-02", "zgodna"],
      ["R-03", "zgodna"],
      ["R-04", "zgodna"],
      ["R-05", "brak-danych"],
    ]);
    const after = rateTestCases({ "rate.parental": [{ value: 750, validFrom: "2027-01-01" }] });
    expect(after[0].status).toBe("do-aktualizacji");
    expect(after[0].outdatedBy).toContain("75% od 01.01.2027");
    // Maternity cases do not depend on the parental rate.
    expect(after[1].status).toBe("zgodna");
    expect(after[0].result.at(-1)?.value.replace(/ /g, " ")).toBe("4 200,00 zł");
  });
});
