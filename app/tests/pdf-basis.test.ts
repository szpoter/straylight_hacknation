import { describe, expect, it } from "vitest";
import { basisCandidates } from "@/lib/plan/pdf-basis";

describe("basis from a case PDF", () => {
  it("keeps each labelled amount with its page for confirmation", () => {
    const results = basisCandidates(["Wypłata 4 266,36 zł.", "Podstawa wymiaru zasiłku macierzyńskiego wynosi 5 608,85 zł."]);
    expect(results).toMatchObject([{ page: 2, amount: "5608,85" }]);
  });
  it("ignores daily rates, percentages and unrelated amounts", () => {
    expect(basisCandidates(["Podstawa wymiaru: 81,5%. Stawka dzienna: 152,37 zł. Podstawa wymiaru składek: 8000,00 zł."])).toEqual([]);
  });
});
