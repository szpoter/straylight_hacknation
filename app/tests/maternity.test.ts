import { describe, expect, it } from "vitest";
import {
  basisMonthLabels,
  basisOn,
  computeBasis,
  computeScenario,
  dailyAmount,
  estimateNet,
  limitsFor,
  minimumBasisOn,
  monthlyPayments,
  supplementaryWeeksFor,
  type ScenarioInput,
} from "@/lib/rules/maternity";

/**
 * Wektory z decyzji ZUS z zestawu przykładowych spraw (materiały konkursowe; tylko liczby,
 * oznaczenia spraw skrócone). Każda kwota tu = kwota wypłacona przez ZUS, co do grosza.
 */

const base: ScenarioInput = {
  event: "birth",
  date: "2026-06-03",
  children: 1,
  zaZyciem: false,
  variant: "815",
  parentA: { title: "pracownik", basis: { kind: "known", amount: 5608.85 }, fullTime: true },
  parentB: null,
  weeksBeforeBirth: 0,
  transferWeeks: 0,
  supplementaryWeeks: 0,
  supplementaryParent: "A",
  parentalWeeksA: 32,
  parentalWeeksB: 0,
  parentalOrder: "sequential",
  workA: 0,
  workB: 0,
  paternityDays: 0,
};

describe("podstawa wymiaru — zgodnie z decyzjami ZUS", () => {
  it("sprawa „El 5” (działalność, ojciec, 9 tyg.): pominięty miesiąc < połowy, podstawa 4 344,11, dzienna 101,36, 31 dni = 3 142,16", () => {
    const months = [5203.8, 5203.8, 5203.8, 5203.8, 3099.48, 5652, 5652, 5652, 5652, 3202.8, 2552.52, 5652].map((amount, i) => ({
      amount,
      underHalf: i === 10, // 14 z 31 dni — mniej niż połowa
    }));
    const b = computeBasis({ title: "dzialalnosc", basis: { kind: "months", months }, fullTime: false }, "2026-09-29");
    expect(b.basis).toBe(4344.11);
    expect(b.monthsUsed).toBe(11);
    expect(b.monthsExcluded).toBe(1);
    expect(dailyAmount(b.basis, 70)).toBe(101.36);
    expect(Math.round(101.36 * 31 * 100) / 100).toBe(3142.16);
  });

  it("sprawa „Pi 2” (pracownica, pełny etat): podstawa podniesiona do płacy minimalnej, w lipcu 2024 wzrost razem z nią", () => {
    const b = computeBasis({ title: "pracownik", basis: { kind: "average", amount: 3852 }, fullTime: true }, "2024-06-01");
    expect(minimumBasisOn("2024-06-01")).toBe(3660.42); // 4 242 × 86,29%
    expect(basisOn(b, "2024-06-01")).toBe(3660.42);
    expect(dailyAmount(basisOn(b, "2024-06-01"), 100)).toBe(122.01);
    expect(basisOn(b, "2024-07-01")).toBe(3710.47); // 4 300 × 86,29%
    expect(dailyAmount(basisOn(b, "2024-07-01"), 100)).toBe(123.68);
  });

  it("sprawa „Ol 2” (ojciec, 70%): 96,23 dziennie, 30 dni = 2 886,90, 11 dni = 1 058,53", () => {
    const d = dailyAmount(4124.06, 70);
    expect(d).toBe(96.23);
    expect(Math.round(d * 30 * 100) / 100).toBe(2886.9);
    expect(Math.round(d * 11 * 100) / 100).toBe(1058.53);
  });

  it("niepracownik: limit podstawy 2026 = 20 321,30 zł; pełny etat 2026: minimum 4 147,10 zł", () => {
    const high = computeBasis({ title: "dzialalnosc", basis: { kind: "average", amount: 30000 }, fullTime: false }, "2026-05-01");
    expect(high.basis).toBe(20321.3);
    expect(minimumBasisOn("2026-03-01")).toBe(4147.1);
  });

  it("12 miesięcy przed miesiącem porodu", () => {
    expect(basisMonthLabels("2026-06-03")).toEqual(["2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03", "2026-04", "2026-05"]);
  });
});

describe("okresy i wypłaty — zgodnie z decyzjami ZUS", () => {
  it("sprawa „Ol 4” (81,5%): macierzyński 3.06–20.10.2026, rodzicielski 21.10.2026–1.06.2027, wypłaty miesięczne co do grosza", () => {
    const r = computeScenario(base);
    expect(r.ok).toBe(true);
    const mat = r.periods.find((p) => p.id === "mat-A")!;
    const par = r.periods.find((p) => p.id === "par-A")!;
    expect([mat.from, mat.to, mat.daily]).toEqual(["2026-06-03", "2026-10-20", 152.37]);
    expect([par.from, par.to]).toEqual(["2026-10-21", "2027-06-01"]);
    const seg = (periodId: string, month: string) => r.segments.find((s) => s.periodId === periodId && s.month === month)!.amount;
    expect(seg("mat-A", "2026-06")).toBe(4266.36); // 28 dni
    expect(seg("mat-A", "2026-07")).toBe(4723.47); // 31 dni
    expect(seg("mat-A", "2026-09")).toBe(4571.1); // 30 dni
    expect(seg("mat-A", "2026-10")).toBe(3047.4); // 20 dni
    expect(seg("par-A", "2026-10")).toBe(1676.07); // 11 dni
    expect(seg("par-A", "2027-06")).toBe(152.37); // 1 dzień
  });

  it("sprawa „Joanna 1” (działalność, 81,5%, podstawa z wcześniejszego zasiłku): 11 dni = 1 457,39, 31 dni = 4 107,19", () => {
    const r = computeScenario({ ...base, date: "2026-09-20", parentA: { title: "dzialalnosc", basis: { kind: "known", amount: 4877.11 }, fullTime: false } });
    const mat = r.periods.find((p) => p.id === "mat-A")!;
    expect([mat.to, mat.daily]).toEqual(["2027-02-06", 132.49]);
    expect(r.periods.find((p) => p.id === "par-A")!.to).toBe("2027-09-18");
    expect(r.segments.find((s) => s.month === "2026-09")!.amount).toBe(1457.39);
    expect(r.segments.find((s) => s.month === "2026-10")!.amount).toBe(4107.19);
  });
});

describe("wymiary i warianty", () => {
  it("liczba dzieci i „Za życiem”", () => {
    expect(limitsFor({ children: 1, zaZyciem: false })).toMatchObject({ maternityWeeks: 20, parentalPoolWeeks: 41, maxParentalOneParent: 32 });
    expect(limitsFor({ children: 2, zaZyciem: false })).toMatchObject({ maternityWeeks: 31, parentalPoolWeeks: 43, maxParentalOneParent: 34 });
    expect(limitsFor({ children: 5, zaZyciem: true })).toMatchObject({ maternityWeeks: 37, parentalPoolWeeks: 67, parentalWithWorkMaxWeeks: 134 });
  });

  it("wariant 100/70: macierzyński 100%, rodzicielski 70%; 9 tygodni drugiego rodzica zawsze 70%", () => {
    const r = computeScenario({ ...base, variant: "100-70", parentB: { title: "pracownik", basis: { kind: "known", amount: 5000 }, fullTime: true }, parentalWeeksB: 9 });
    expect(r.periods.find((p) => p.id === "mat-A")!.ratePct).toBe(100);
    expect(r.periods.find((p) => p.id === "par-A")!.ratePct).toBe(70);
    const b = r.periods.find((p) => p.id === "par-B")!;
    expect([b.ratePct, b.from, b.days]).toEqual([70, "2027-06-02", 63]);
    const r815 = computeScenario({ ...base, parentB: { title: "pracownik", basis: { kind: "known", amount: 5000 }, fullTime: true }, parentalWeeksB: 12 });
    expect(r815.periods.filter((p) => p.parent === "B").map((p) => [p.ratePct, p.days])).toEqual([
      [70, 63],
      [81.5, 21],
    ]);
  });

  it("pula i 9 tygodni: błąd przy przekroczeniu, ostrzeżenie gdy drugi rodzic nie wykorzysta swoich", () => {
    expect(computeScenario({ ...base, parentalWeeksA: 33 }).errors[0].text).toContain("najwyżej 32");
    const both = computeScenario({ ...base, parentB: { title: "pracownik", basis: { kind: "known", amount: 5000 }, fullTime: true }, parentalWeeksA: 32, parentalWeeksB: 10 });
    expect(both.errors.some((e) => e.text.includes("41 tyg."))).toBe(true);
    expect(computeScenario(base).warnings[0].text).toContain("9 tygodni");
  });

  it("przejęcie macierzyńskiego: matka min. 14 tygodni po porodzie", () => {
    const B = { title: "pracownik" as const, basis: { kind: "known" as const, amount: 5000 }, fullTime: true };
    expect(computeScenario({ ...base, parentB: B, transferWeeks: 6 }).ok).toBe(true);
    expect(computeScenario({ ...base, parentB: B, transferWeeks: 7 }).ok).toBe(false);
    const ok = computeScenario({ ...base, parentB: B, transferWeeks: 6 });
    expect(ok.periods.find((p) => p.id === "mat-B")!.from).toBe("2026-09-09");
  });

  it("łączenie z pracą na ½ etatu: urlop dwa razy dłuższy, zasiłek o połowę niższy", () => {
    const r = computeScenario({ ...base, workA: 0.5 });
    const par = r.periods.find((p) => p.id === "par-A")!;
    expect(par.days).toBe(448);
    expect(par.daily).toBe(dailyAmount(5608.85, 81.5, 0.5));
  });

  it("podwyższenie do 1000 zł: niska podstawa, rodzicielski 70%; bez podwyższenia za urlop ojcowski", () => {
    const low = { title: "zleceniobiorca" as const, basis: { kind: "known" as const, amount: 1200 }, fullTime: false };
    const r = computeScenario({ ...base, variant: "100-70", date: "2026-01-01", parentA: low, parentB: low, paternityDays: 14, paternityStart: "2026-01-01" });
    const par = r.segments.filter((s) => s.periodId === "par-A");
    const fullMonth = par.find((s) => s.days === 31)!;
    expect(fullMonth.amount).toBeGreaterThanOrEqual(1000);
    expect(fullMonth.topUp).toBeGreaterThan(0);
    expect(r.segments.filter((s) => s.kind === "ojcowski").every((s) => s.topUp === 0)).toBe(true);
    expect(r.assumptions.some((a) => a.text.includes("1000 zł"))).toBe(true);
  });

  it("adopcja: wymiar ograniczony wiekiem dziecka, nie krócej niż 9 tygodni", () => {
    const r = computeScenario({ ...base, event: "adoption", date: "2026-03-01", childBirthDate: "2012-04-01" });
    expect(r.limits.maternityWeeks).toBe(9);
    expect(r.periods[0].kind).toBe("na-warunkach");
    expect(computeScenario({ ...base, event: "foster", date: "2026-03-01", childBirthDate: "2018-01-01" }).ok).toBe(false);
  });

  it("uzupełniający urlop: tydzień za tydzień w szpitalu, niepełny w górę, limit 8 / 15", () => {
    expect(supplementaryWeeksFor(30, false)).toBe(5);
    expect(supplementaryWeeksFor(200, false)).toBe(8);
    expect(supplementaryWeeksFor(200, true)).toBe(15);
    const r = computeScenario({ ...base, supplementaryWeeks: 5 });
    expect(r.periods.find((p) => p.kind === "uzupelniajacy")).toMatchObject({ from: "2026-10-21", ratePct: 100 });
    expect(r.periods.find((p) => p.id === "par-A")!.from).toBe("2026-11-25");
  });

  it("terminy: 81,5% do 21 dni po porodzie, rodzicielski 21 dni przed, ojcowski 7 dni przed", () => {
    const B = { title: "pracownik" as const, basis: { kind: "known" as const, amount: 5000 }, fullTime: true };
    const r = computeScenario({ ...base, parentB: B, parentalWeeksB: 9, paternityDays: 14, paternityStart: "2026-06-20" });
    expect(r.deadlines.map((d) => [d.date, d.who])).toEqual([
      ["2026-06-13", "B"],
      ["2026-06-24", "A"],
      ["2026-09-30", "A"],
      ["2027-05-12", "B"],
    ]);
  });

  it("miesiąc po miesiącu i szacunek netto", () => {
    const rows = monthlyPayments(computeScenario(base));
    expect(rows[0]).toEqual({ month: "2026-06", A: 4266.36, B: 0 });
    expect(estimateNet(3142.16, { pit2: false, exempt: false })).toEqual({ advance: 377, net: 2765.16 }); // sprawa „El 5”: podatek 377,00
  });

  it("martwe urodzenie: 8 tygodni po porodzie, 100%, bez rodzicielskiego", () => {
    const r = computeScenario({ ...base, stillbirth: true, weeksBeforeBirth: 2 });
    expect(r.periods.map((p) => [p.kind, p.from, p.days, p.ratePct])).toEqual([["macierzynski", "2026-05-20", 70, 100]]);
    expect(r.warnings).toEqual([]);
  });
});
