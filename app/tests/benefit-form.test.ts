import { describe, expect, it } from "vitest";
import { getPlan } from "@/lib/demo/fixtures";
import { applyCalculatorToPlan, computeForm, formFromPlan, otherVariant, parseAmount, toScenario } from "@/lib/plan/benefit-form";
import { BENEFIT_PRESETS } from "@/lib/plan/benefit-presets";

describe("przykładowe sprawy ZUS w kalkulatorze", () => {
  for (const preset of BENEFIT_PRESETS) {
    it(`${preset.title}: zgodne z decyzją ZUS co do grosza`, () => {
      const { result, problems } = computeForm(preset.form);
      expect(problems).toEqual([]);
      expect(result?.ok).toBe(true);
      for (const check of preset.checks) expect(check.pick(result!), check.label).toBe(check.zus);
    });
  }
});

describe("formularz kalkulatora", () => {
  it("kwoty z polskim przecinkiem i spacjami", () => {
    expect(parseAmount("6 500,50")).toBe(6500.5);
    expect(parseAmount("6500")).toBe(6500);
    expect(parseAmount("6500,555")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
    expect(parseAmount("")).toBeNull();
  });

  it("z planu Oli: data urodzenia, 32 + 9 tygodni, urlop ojcowski", () => {
    const form = formFromPlan(getPlan("ola"));
    expect(form.date).toBe("2026-11-10");
    expect([form.parentalWeeksA, form.parentalWeeksB, form.paternityDays]).toEqual([32, 9, 14]);
    const { result } = computeForm(form);
    expect(result?.ok).toBe(true);
    expect(result?.warnings).toEqual([]);
  });

  it("puste pola: problem przy polu, bez wyniku przy braku daty", () => {
    const form = { ...formFromPlan(getPlan("ola")), A: { ...formFromPlan(getPlan("ola")).A, average: "" } };
    expect(toScenario(form).problems[0].field).toBe("A.average");
    expect(computeForm({ ...form, date: "" }).result).toBeNull();
  });

  it("porównanie wariantów: ta sama długość, inny rozkład kwot", () => {
    const form = formFromPlan(getPlan("ola"));
    const a = computeForm(form).result!;
    const b = computeForm(otherVariant(form)).result!;
    expect(a.span).toEqual(b.span);
    expect(a.totals.all).not.toBe(b.totals.all);
  });

  it("zapisany wynik na ścieżce: termin wniosku o rodzicielski i notatki ze źródłem", () => {
    const ola = getPlan("ola");
    const applied = applyCalculatorToPlan(ola, formFromPlan(ola));
    const parental = applied.stops.find((s) => s.id === "rodzicielski")!;
    expect(parental.due).toBe("2027-03-09"); // 30.03.2027 − 21 dni
    expect(parental.notes?.at(-1)?.sources[0].url).toContain("gov.pl");
    const benefit = applied.stops.find((s) => s.id === "zasilek-macierzynski")!;
    expect(benefit.notes?.at(-1)?.text).toContain("Wniosek o 81,5% do 1 grudnia 2026");
    expect(applyCalculatorToPlan(ola, undefined)).toBe(ola);
  });
});
