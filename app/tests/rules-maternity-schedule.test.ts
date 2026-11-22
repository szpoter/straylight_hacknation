import { describe, expect, it } from "vitest";
import { appParameters } from "@/lib/admin/catalog";
import { changeSpecFor } from "@/lib/admin/parameter-changes";
import { MATERNITY_PARAMETERS } from "@/lib/rules/maternity";
import { maternityParametersOn } from "@/lib/rules/maternity-schedule";

describe("calculator parameters from the panel schedule", () => {
  it("without a schedule equal the calculator's own numbers", () => {
    // Guards against drift: if MATERNITY_PARAMETERS changes, DEFAULTS in parameters.ts must follow.
    expect(maternityParametersOn(undefined, "2026-11-22")).toEqual(MATERNITY_PARAMETERS);
  });

  it("apply published values from their day, in the calculator's units", () => {
    const schedule = {
      "rate.parental": [{ value: 750, validFrom: "2027-01-01" }],
      "parental.weeksOne": [{ value: 45, validFrom: "2027-01-01" }],
      "contributions.employeePct": [{ value: 1400, validFrom: "2027-01-01" }],
    };
    const before = maternityParametersOn(schedule, "2026-12-31");
    const after = maternityParametersOn(schedule, "2027-01-01");
    expect([before.rateParental, before.parentalWeeks.one, before.deductionPct]).toEqual([70, 41, 13.71]);
    expect([after.rateParental, after.parentalWeeks.one, after.deductionPct]).toEqual([75, 45, 14]);
    expect(after.maternityWeeks).toEqual([20, 31, 33, 35, 37]);
  });

  it("checks keep leave lengths consistent", () => {
    const failing = (catalogId: string, value: number) =>
      changeSpecFor(catalogId)!
        .checks({}, { value, validFrom: "2027-01-01", source: "art. 1" })
        .filter((r) => r.status === "niezgodna")
        .map((r) => r.name);
    expect(failing("app-maternity-weeks2", 19)).toEqual(["Nie krótszy niż dla mniejszej liczby dzieci (20 tyg.)"]);
    expect(failing("app-parental-exclusiveWeeks", 21)).toHaveLength(1);
    expect(failing("app-parental-weeksOne", 44)).toEqual(["Jedno dziecko: nie dłużej niż przy więcej dzieciach"]);
  });

  it("are listed in the panel with the statute text", () => {
    const params = appParameters();
    const weeks1 = params.find((p) => p.id === "app-maternity-weeks1");
    expect(weeks1).toMatchObject({ value: "20 tyg.", group: "Wymiary", editable: true, origin: "app" });
    expect(weeks1?.quote).toContain("20 tygodni");
    expect(params.find((p) => p.id === "app-contributions-employeePct")).toMatchObject({ value: "13,71%", group: "Podstawa" });
    expect(params.find((p) => p.id === "app-averaged-requestDays")).toMatchObject({ value: "21 dni", group: "Terminy" });
    expect(changeSpecFor("app-contributions-employeePct")!.toValue("13,71")).toBe(1371);
    expect(changeSpecFor("app-contributions-employeePct")!.toValue("13,715")).toBeNull();
  });
});
