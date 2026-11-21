import { describe, expect, it } from "vitest";
import { nextStep, planReadyText, prevStep, questionFor, sanitize, steps, targetPlanId, warningCount } from "@/features/onboarding/flow";

describe("sekwencja onboardingu", () => {
  it("scena odbioru: ciąża → termin → Wstecz → „Dziecko jest już z nami” zamienia termin na datę urodzenia", () => {
    let answers = sanitize({ situation: "ciaza", role: "w-ciazy" });
    expect(nextStep("role", answers)).toBe("dueDate");
    expect(questionFor("dueDate", answers).question).toBe("Na kiedy planowany jest poród?");
    answers = { ...answers, dueDate: "2027-05-14" };
    expect(prevStep("dueDate", answers)).toBe("role");

    answers = sanitize({ ...answers, situation: "urodzone" });
    expect(answers.dueDate).toBeUndefined();
    expect(answers.role).toBeUndefined(); // „Jestem w ciąży” nie pasuje do nowej sytuacji
    answers = { ...answers, role: "urodzilam" };
    const next = nextStep("role", answers);
    expect(next).toBe("birthDate");
    expect(questionFor(next, answers).question).toBe("Kiedy urodziło się dziecko?");
    expect(steps(answers)).not.toContain("dueDate");
    expect(targetPlanId(answers)).toBe("ola");
  });

  it("planowanie pomija datę i liczbę dzieci", () => {
    expect(steps({ situation: "planuje" })).toEqual(["situation", "role", "planName", "jobChange", "summary"]);
  });

  it("adopcja pyta o datę przyjęcia i datę urodzenia dziecka", () => {
    const list = steps({ situation: "adopcja" });
    expect(list).toContain("careDate");
    expect(list).toContain("childBirthDate");
    expect(list).not.toContain("childCount");
  });

  it("zachowuje rolę wspólną dla obu sytuacji", () => {
    expect(sanitize({ situation: "urodzone", role: "drugi-rodzic" }).role).toBe("drugi-rodzic");
  });

  it("ostrzeżenie przy zmianie pracy i tekst gotowego planu", () => {
    expect(warningCount({ jobChange: "tak" })).toBe(1);
    expect(warningCount({ jobChange: "pominieto" })).toBe(0);
    expect(planReadyText("Ola")).toBe("Plan dla Oli gotowy");
    expect(planReadyText("Maja")).toBe("Plan dla Mai gotowy");
    expect(planReadyText("Anna")).toBe("Plan dla Anny gotowy");
    expect(planReadyText("Jan")).toBe("Plan „Jan” gotowy");
  });
});
