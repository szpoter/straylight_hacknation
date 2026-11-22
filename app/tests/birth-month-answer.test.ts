import { describe, expect, it } from "vitest";
import { loadCorpus } from "@/lib/rag/corpus-fs";
import { answerPublicTurn } from "@/lib/zusik/ask-service";
import { groundedClaims } from "@/features/chat/contract";
import { routeCaseQuestion } from "@/lib/zusik/v1/intent";
import { birthMonthInputs } from "@/lib/zusik/birth-month-input";
import { birthMonthAnswer } from "@/lib/zusik/birth-month-answer";

const asOf = "2026-11-22";
const sources = () => loadCorpus("publiczne");
const numeric = "Ola urodziła się 10 listopada. Moja podstawa to 6000 zł. Ile dostanę za listopad przy 81,5%, a ile przy 100%?";

describe("porównanie w rozmowie z Zusikiem", () => {
  it.each([numeric, "Ola urodziła się dziesiątego listopada. Mam sześć tysięcy podstawy. Ile dostanę za listopad przy osiemdziesięciu jeden i pół procent? A ile przy stu?"])("wyświetla kwoty i przypisy dla %s", async question => {
    const unexpected = async (): Promise<never> => { throw Error("private calculation sent to provider"); };
    const { answer } = await answerPublicTurn({ corpus: loadCorpus("marta"), selectCorpus: loadCorpus,
      asOf: () => asOf, search: { search: unexpected }, generate: unexpected }, question, []);
    expect(answer.status).toBe("answered");
    const { claims, citations } = groundedClaims(answer);
    expect(claims.map(c => c.text.replaceAll("\u00a0", " "))).toEqual([
      "Przy 81,5% za listopad: 3 423 zł brutto (21 dni po 163 zł).",
      "Przy 100% za listopad: 4 200 zł brutto (21 dni po 200 zł).",
    ]);
    expect(citations).toHaveLength(2);
    expect(answer.citations.map(c => c.fragmentId)).toEqual(["uz-31-2", "uz-31-1"]);
  });

  it("przelicza inny dzień i podstawę", () => {
    const route = routeCaseQuestion(numeric.replace("10 listopada", "30.11.2026").replace("6000", "7500"), { facts: [] });
    expect(route).toEqual({ input: { intent: "compare_birth_month", date: "2026-11-30", basis: 7500 } });
    const answer = "input" in route && route.input.intent === "compare_birth_month" ? birthMonthAnswer(route.input, sources()) : null;
    expect(answer?.claims[1].text).toContain("250 zł brutto");
  });

  it.each([numeric.replace("6000 zł", "nieznana"), numeric.replace("za listopad", "za grudzień"),
    numeric.replace("10 listopada", "31 listopada"), numeric.replace("dostanę", "dostanę netto")])("pomija nieobsługiwane dane: %s", question => {
    expect(birthMonthInputs(question, asOf)).toBeNull();
  });
});
