import { describe, expect, it } from "vitest";
import {
  asksJobChange,
  estimateChoices,
  genitiveName,
  hasAnswer,
  nextStep,
  prevStep,
  questionFor,
  sanitize,
  steps,
  toBuildAnswers,
  validateDate,
  warningCount,
  zusikLine,
} from "@/features/onboarding/flow";

const TODAY = "2026-11-21";

describe("sekwencja onboardingu", () => {
  it("ciąża → termin → Wstecz → „Dziecko już się urodziło” zamienia termin na datę urodzenia", () => {
    let answers = sanitize({ situation: "ciaza", role: "w-ciazy" });
    expect(nextStep("role", answers)).toBe("dueDate");
    answers = { ...answers, dueDate: "2027-05-14" };
    expect(prevStep("dueDate", answers)).toBe("role");

    answers = sanitize({ ...answers, situation: "urodzone" });
    expect(answers.dueDate).toBeUndefined();
    expect(answers.role).toBeUndefined(); // „Jestem w ciąży” nie pasuje do nowej sytuacji
    answers = { ...answers, role: "urodzilam" };
    expect(nextStep("role", answers)).toBe("birthDate");
    expect(steps(answers)).not.toContain("dueDate");
  });

  it("każdy etap życia ma swoją, spójną ścieżkę pytań", () => {
    const base = { employment: "etat" as const };
    expect(steps({ situation: "planuje", ...base })).toEqual(["situation", "role", "employment", "jobChange", "summary"]);
    expect(steps({ situation: "ciaza", ...base })).toEqual(["situation", "role", "dueDate", "childCount", "planName", "employment", "jobChange", "summary"]);
    expect(steps({ situation: "urodzone", ...base })).toEqual(["situation", "role", "birthDate", "childCount", "names", "employment", "summary"]);
    expect(steps({ situation: "adopcja", ...base, careDate: "2026-11-01" }, TODAY)).toEqual([
      "situation",
      "role",
      "careDate",
      "childCount",
      "childBirthDate",
      "names",
      "employment",
      "summary",
    ]);
  });

  it("po porodzie nie pytamy o zmianę pracy „przed porodem”", () => {
    expect(asksJobChange({ situation: "urodzone", employment: "etat" })).toBe(false);
    expect(sanitize({ situation: "urodzone", employment: "etat", jobChange: "tak" }).jobChange).toBeUndefined();
    expect(asksJobChange({ situation: "ciaza", employment: "etat" })).toBe(true);
    expect(questionFor("jobChange", { situation: "ciaza" }).question).toContain("do porodu");
    // Przyjęcie w przyszłości — pytamy; przyjęcie w przeszłości — nie.
    expect(asksJobChange({ situation: "adopcja", employment: "etat", careDate: "2027-01-10" }, TODAY)).toBe(true);
    expect(asksJobChange({ situation: "adopcja", employment: "etat", careDate: "2026-10-10" }, TODAY)).toBe(false);
    expect(asksJobChange({ situation: "ciaza", employment: "nie-pracuje" })).toBe(false);
  });

  it("bliźnięta: dwa pola imion, liczba mnoga w pytaniach, imiona przycięte przy zmianie liczby dzieci", () => {
    const twins = { situation: "urodzone" as const, childCount: "2" as const, names: ["Ola", "Ala"] };
    expect(questionFor("names", twins).question).toBe("Jak mają na imię?");
    expect(questionFor("birthDate", twins).question).toBe("Kiedy urodziły się dzieci?");
    expect(zusikLine("employment", twins)).toContain("Ola i Ala");
    expect(zusikLine("summary", twins)).toBe("Plany dla Oli i Ali gotowe.");
    expect(sanitize({ ...twins, childCount: "1" }).names).toEqual(["Ola"]);
  });

  it("karty nie przechodzą same — „Dalej” wymaga odpowiedzi", () => {
    expect(hasAnswer("situation", {})).toBe(false);
    expect(hasAnswer("situation", { situation: "ciaza" })).toBe(true);
    expect(hasAnswer("jobChange", { jobChange: "pominieto" })).toBe(false);
    expect(hasAnswer("names", {})).toBe(true); // imiona są opcjonalne
  });

  it("daty sprawdzane w kontekście pytania", () => {
    expect(validateDate("birthDate", "2026-12-24", TODAY)).toContain("w przyszłości");
    expect(validateDate("dueDate", "2026-09-01", TODAY)).toContain("minął");
    expect(validateDate("dueDate", "2028-09-01", TODAY)).toContain("10 miesięcy");
    expect(validateDate("dueDate", "2027-05-14", TODAY)).toBeUndefined();
    expect(validateDate("careDate", "2027-01-10", TODAY)).toBeUndefined();
  });

  it("przybliżona data, dane z ZUS i odmiana imion", () => {
    expect(estimateChoices("dueDate", TODAY)[0]).toEqual({ value: "2026-12-15", label: "grudzień 2026" });
    const b = toBuildAnswers({ situation: "urodzone" }, TODAY);
    expect(b.date).toBe("2026-11-14");
    expect(b.dateEstimated).toBe(true);
    expect(zusikLine("employment", { employmentFromZus: true, employment: "etat" })).toContain("W ZUS widzę");
    expect(genitiveName("Ola")).toBe("Oli");
    expect(genitiveName("Maja")).toBe("Mai");
    expect(genitiveName("Antek")).toBe("Antka");
    expect(genitiveName("Paweł")).toBe("Pawła");
    expect(genitiveName("Jaś")).toBe("Jasia");
    expect(warningCount({ jobChange: "tak" })).toBe(1);
  });
});
