import ManualCalculatorPage from "@/app/app/kalkulator/page";
import { describe, expect, it } from "vitest";
import { getPlan } from "@/lib/demo/fixtures";
import { applyCalculatorToPlan, blankCalculatorForm, computeForm, formFromPlan, otherVariant, parseAmount, toScenario } from "@/lib/plan/benefit-form";
import { BENEFIT_PRESETS } from "@/lib/plan/benefit-presets";

describe("przykładowe sprawy ZUS w kalkulatorze", () => {
  for (const preset of BENEFIT_PRESETS) {
    it(`${preset.title}: zgodne z decyzją ZUS co do grosza`, () => {
      const { result, problems } = computeForm(preset.form);
      expect(problems).toEqual([]);
      expect(result?.ok).toBe(true);
      for (const check of preset.checks) expect(check.pick(result!), check.label).toBe(check.zus);
      // Ekran kalkulatora liczy z requireComplete: przykład musi mieć komplet pól.
      expect(computeForm(preset.form, { requireComplete: true }).result?.ok).toBe(true);
    });
  }
});

describe("formularz kalkulatora", () => {
  it("dawny kalkulator z czatu prowadzi do kalkulatora rodziny", () => {
    expect(ManualCalculatorPage).toThrow(expect.objectContaining({ digest: expect.stringContaining("/kalkulator") }));
  });

  it("symulacja z czatu wymaga własnych danych i ukrywa wynik błędnego scenariusza", () => {
    const blank = blankCalculatorForm();
    const calculate = (form: typeof blank) => computeForm(form, { requireComplete: true });
    expect(blank).toMatchObject({ date: "", hasB: false, A: { average: "", known: "" }, B: { average: "" } });
    const dated = { ...blank, date: "2026-06-03" };
    expect(calculate(dated).result).toBeNull();
    const filled = { ...dated, A: { ...dated.A, average: "6000" } };
    expect(calculate(filled).result?.periods[0].daily).toBe(172.58);
    expect(calculate({ ...filled, event: "adoption" }).result).toBeNull();
    expect(calculate({ ...filled, parentalWeeksA: 99 }).result).toBeNull();
  });

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
    expect([form.A.average, form.B.average]).toEqual(["", ""]);
    expect(computeForm(form, { requireComplete: true }).result).toBeNull();
  });

  it("puste pola: problem przy polu, bez wyniku przy braku daty", () => {
    const form = { ...formFromPlan(getPlan("ola")), A: { ...formFromPlan(getPlan("ola")).A, average: "" } };
    expect(toScenario(form).problems[0].field).toBe("A.average");
    expect(computeForm({ ...form, date: "" }).result).toBeNull();
  });

  it("porównanie wariantów: ta sama długość, inny rozkład kwot", () => {
    const form = formFromPlan(getPlan("ola"));
    form.A.average = "5500";
    form.B.average = "7200";
    const a = computeForm(form).result!;
    const b = computeForm(otherVariant(form)).result!;
    expect(a.span).toEqual(b.span);
    expect(a.totals.all).not.toBe(b.totals.all);
  });

  it("zapisany wynik na ścieżce: termin wniosku o rodzicielski i notatki ze źródłem", () => {
    const ola = getPlan("ola");
    const form = formFromPlan(ola);
    expect(applyCalculatorToPlan(ola, form)).toBe(ola);
    form.A.average = "5500";
    form.B.average = "7200";
    const applied = applyCalculatorToPlan(ola, form);
    const parental = applied.stops.find((s) => s.id === "rodzicielski")!;
    expect(parental.due).toBe("2027-03-09"); // 30.03.2027 − 21 dni
    expect(parental.notes?.at(-1)?.sources[0].url).toContain("gov.pl");
    const benefit = applied.stops.find((s) => s.id === "zasilek-macierzynski")!;
    expect(benefit.notes?.at(-1)?.text).toContain("Wniosek o 81,5% do 1 grudnia 2026");
    expect(applyCalculatorToPlan(ola, undefined)).toBe(ola);
  });
});
