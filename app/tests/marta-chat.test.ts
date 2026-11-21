import { describe, expect, it } from "vitest";
import { applyMarta } from "../src/lib/marta/case";
import { martaInput } from "../src/features/chat/marta-input";

const today = "2026-11-21";
describe("chat messages use the same versioned Marta workflow as the form", () => {
  it("compares a new date, selects sequential leave, then recomputes after correction", () => {
    const date = martaInput("Od 18 stycznia 2027", null, today);
    if (!date || !("action" in date)) throw new Error("missing compare");
    const first = applyMarta(null, date.action).view;
    expect(first?.variants.together.first.from).toBe("2027-01-18");
    const choice = martaInput("Wybieram kolejno", first, today);
    if (!choice || !("action" in choice)) throw new Error("missing choice");
    const saved = applyMarta(first, choice.action).view;
    expect(saved?.selected).toBe("sequential");
    const corrected = martaInput("Jednak od 1 lutego 2027", saved, today);
    if (!corrected || !("action" in corrected)) throw new Error("missing correction");
    expect(applyMarta(saved, corrected.action).view?.variants.sequential.first.from).toBe("2027-02-01");
  });
  it("keeps ordinary questions, negations and invalid dates out of writes", () => {
    for (const text of [
      "Czy możemy razem?",
      "Czy mogę od 18 stycznia?",
      "Nie wybieram kolejno",
      "Od 11 stycznia do 2 lutego",
    ])
      expect(martaInput(text, null, today)).toBeNull();
    expect(martaInput("Od 31 lutego 2027", null, today)).toHaveProperty("notice");
    expect(martaInput("Wybieram razem", null, today)).toHaveProperty("notice");
  });
});
