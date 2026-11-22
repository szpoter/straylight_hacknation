import { describe, expect, it, vi } from "vitest";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { answerPublicTurn } from "../src/lib/zusik/ask-service";
import { routeCaseQuestion } from "../src/lib/zusik/v1/intent";
import { publicClarification } from "../src/lib/zusik/public-clarification";

const examples: [string, RegExp][] = [
  ["Czy mój syn spełnia warunek wieku do wypłaty?", /wiek/u],
  ["Oblicz, ile wyniesie moja wypłata na rękę za zwolnienie.", /podstaw|wynagrodze/u],
  ["Który z tych wariantów będzie dla mnie korzystniejszy?", /wariant|porówna/u],
  ["Wypełnij za mnie wniosek.", /formularz|druk/u],
  ["Wyślij do ZUS podpisany formularz.", /podpis|wysył/u],
  ["Pokaż stan konta mojej koleżanki w ZUS.", /dostęp|danych/u],
  ["Czy dla mnie program obowiązywał w grudniu 2019 roku?", /obowiąz/u],
  ["Czy mogę dostać dofinansowanie „Nowa wyprawka 2099”?", /źródł|potwierdz/u],
  ["Jaki jest mój osobisty termin na złożenie wniosku?", /świadczeni/u],
];

describe("public questions requiring case information", () => {
  it.each([
    "Jak podpisać elektronicznie wniosek do ZUS?",
    "Czy świadczenie „800 plus” przysługuje rodzicowi z zagranicy?",
    "Który wariant urlopu ojcowskiego wybrać?",
    "Jak obliczany jest procent podstawy wymiaru zasiłku?",
  ])("preserves public questions that identify what to look up: %s", question => {
    expect(publicClarification(question)).toBeUndefined();
  });

  it("keeps another person's account and a request for signature local in a private case", () => {
    for (const question of ["Pokaż dane konta mojego brata.", "Podpisz za mnie wniosek."])
      expect(routeCaseQuestion(question, {facts:[], hasDocuments:true})).toHaveProperty("clarify");
  });

  it.each(examples)("asks a specific question and sends only public wording: %s", async (question, expected) => {
    const first = routeCaseQuestion(question, { facts: [] });
    if (!("input" in first) || first.input.intent !== "public_question") throw new Error("expected a resumable public turn");
    const wire = first.input.publicQuestion;
    expect(wire).not.toBe(question);
    expect(wire).not.toMatch(/koleżanki|2099|grudniu|2019/u);
    const search = vi.fn(async () => { throw new Error("unexpected search"); });
    const generate = vi.fn(async () => { throw new Error("unexpected generation"); });
    const deps = { corpus: loadCorpus("marta"), search: { search }, generate };
    for (const input of [wire, question]) {
      const { answer } = await answerPublicTurn(deps, input, []);
      expect(["insufficient_evidence", "needs_clarification"]).toContain(answer.status);
      expect(answer.message).toMatch(expected);
      expect(answer.citations).toEqual([]);
    }
    expect(search).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
  });
});
