import { describe, expect, it } from "vitest";
import { getPlan } from "@/lib/demo/fixtures";
import { compareHeadline, poolState, summarize } from "@/features/calculator/summary";

describe("kalkulator — przykład ze specyfikacji (140 i 105 zł dziennie, po 28 dni)", () => {
  const calc = getPlan("ola").calculator;
  const a = summarize(calc, calc.variants[0]);
  const b = summarize(calc, calc.variants[1]);

  it("A kolejno: 56 dni, 6 860 zł", () => {
    expect(a.calendarDays).toBe(56);
    expect(a.total).toBe(6860);
    expect(a.segments.filter((s) => s.kind === "rodzicielski").map((s) => s.amount)).toEqual([3920, 2940]);
  });

  it("B jednocześnie: 28 dni, ta sama kwota, razem 4 tygodnie", () => {
    expect(b.calendarDays).toBe(28);
    expect(b.total).toBe(6860);
    expect(compareHeadline(a, b).headline).toBe("Wariant B: ta sama kwota · razem w domu 4 tygodnie");
  });

  it("pula: 41 − 8 = 33 tygodnie do zaplanowania", () => {
    expect(poolState(calc, a)).toMatchObject({ kind: "left", weeks: 33 });
  });

  it("brak podstawy drugiego rodzica: suma niekompletna", () => {
    const expected = getPlan("oczekiwane").calculator;
    const s = summarize(expected, expected.variants[0]);
    expect(s.complete).toBe(false);
    expect(s.segments[1].amount).toBeUndefined();
    expect(s.total).toBe(3920);
  });
});
