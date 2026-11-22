import { describe, expect, it } from "vitest";
import { rowAction, type DocCase } from "@/features/documents/model";
import { buildPlan } from "@/lib/plan/build";

/** Przycisk sprawy z wnioskiem na ścieżce (CaseCard) wynika ze stanu — jak w Dokumentach. */
const actionFor = (plan: ReturnType<typeof buildPlan>, id: string) => rowAction(plan.stops.find((s) => s.id === id) as DocCase);

describe("przycisk sprawy w nowym planie", () => {
  const plan = buildPlan({ situation: "urodzone", role: "urodzilam", date: "2026-11-15", name: "Maja" }, "p1");

  it("niewysłany wniosek nie pokazuje przebiegu z przykładu Oli", () => {
    for (const id of ["800plus", "urlop-macierzynski"]) {
      expect(plan.stops.find((s) => s.id === id)!.state).toBe("aktualna");
      expect(actionFor(plan, id)).toMatchObject({ label: "Rozpocznij", step: "wniosek" });
    }
  });

  it("sprawa czekająca na warunek nie zaprasza do złożenia wniosku", () => {
    const stop = plan.stops.find((s) => s.id === "ubezpieczenie-dziecka")!;
    expect(stop.state).toBe("warunek");
    expect(actionFor(plan, stop.id)).toEqual({ label: "Zobacz, co przygotować", kind: "link" });
  });

  it("bez szkicu nie ma notatki ze szkicu Oli", () => {
    const zasilek = plan.stops.find((s) => s.id === "zasilek-macierzynski")!;
    expect(zasilek.doc?.hasDraft).toBeFalsy();
    expect(zasilek.doc?.note).toBeUndefined();
  });
});
