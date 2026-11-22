import { expect, it } from "vitest";
import { publicQuestion } from "../src/lib/rag/public-query";
import { routeCaseQuestion } from "../src/lib/zusik/v1/intent";
import { reviewedSourceIds } from "../src/lib/rag/excerpt";
import { loadCorpus } from "../src/lib/rag/corpus-fs";
import { answerPublicTurn } from "../src/lib/zusik/ask-service";

it.each([
  "W jakich datach zaczyna się i kończy rok świadczeniowy 800+?",
  "Jak długo trwa okres świadczeniowy świadczenia wychowawczego?",
])("preserves both public period bounds: %s", raw => {
  const route = routeCaseQuestion(raw, {facts: []});
  if (!("input" in route) || route.input.intent !== "public_question") throw new Error("Expected public query");
  const plan = publicQuestion(route.input.publicQuestion);
  expect(plan?.question).toBe("Od kiedy do kiedy trwa okres świadczeniowy 800+?");
  const corpus = loadCorpus("oferta");
  const f = plan && corpus.fragments.get(reviewedSourceIds(plan, corpus)[0]);
  expect(f && f.sourceText).toMatch(/1 czerwca do 31 maja/iu);
});

it("passes two individually reproducible facets for the same programme", () => {
  const raw = "Czy komornik może zająć środki z Dobrego Startu oraz jak złożyć wniosek przez internet?";
  const route = routeCaseQuestion(raw, {facts: []});
  if (!("input" in route) || route.input.intent !== "public_question") throw new Error("Expected public query");
  expect(route.input.publicQuestion).toMatch(/^Pytania publiczne: Dobry Start\..*komornik.*\? oraz Jakimi kanałami/u);
  expect(publicQuestion(route.input.publicQuestion, true)?.question).toBe(route.input.publicQuestion);
});

it.each([
  "Czy komornik może zająć środki z Dobrego Startu oraz ile kosztuje pizza?",
  "Czy komornik może zająć środki z Dobrego Startu oraz jak złożyć wniosek o 800+?",
  "Czy komornik może zająć środki z Dobrego Startu oraz jakie dokumenty dołączyć do zasiłku macierzyńskiego?",
  "W jakich datach trwa okres świadczeniowy 800+ oraz czy należało mi się świadczenie w 2022 roku?",
])("clarifies unsupported or historical situations before looking up or generating a public answer: %s", async raw => {
  const route = routeCaseQuestion(raw, {facts: []});
  if ("clarify" in route) {
    expect(route.clarify).toBeTruthy();
    return;
  }
  if (!("input" in route) || route.input.intent !== "public_question") throw new Error("Expected a clarification");
  expect(route.input.publicQuestion).not.toContain("2022");
  const unexpected = ():never => {throw new Error("Unresolved question reached a provider");};
  const {answer} = await answerPublicTurn({corpus:loadCorpus(), search:{search:unexpected}, generate:unexpected}, route.input.publicQuestion, []);
  expect(answer.status).toBe("needs_clarification");
  expect(answer.citations).toEqual([]);
});

it("keeps the programme period and submission channels as two independent questions", () => {
  const route = routeCaseQuestion("Jak długo trwa okres świadczeniowy 800+ oraz jakimi kanałami można składać wnioski?", {facts: []});
  if (!("input" in route) || route.input.intent !== "public_question") throw new Error("Expected public pair");
  const [bounds, channels] = route.input.publicQuestion.replace(/^Pytania publiczne: /u, "").split("? oraz ");
  expect(bounds).toContain("okres świadczeniowy 800+");
  const plan = publicQuestion(channels ?? "");
  expect(plan?.question).toBe("Jakimi kanałami można złożyć wniosek o 800+?");
  expect(plan && reviewedSourceIds(plan, loadCorpus("oferta"))).toEqual(["of-800-6-2", "of-800-6-3"]);
});

it("carries the opening date and months of coverage independently", () => {
  const raw = "Kiedy można złożyć wniosek na kolejny okres 800+ oraz które miesiące obejmuje ten okres?";
  const route = routeCaseQuestion(raw, { facts: [] });
  if (!("input" in route) || route.input.intent !== "public_question") throw new Error("Expected two public questions");
  const text = route.input.publicQuestion;
  expect(text).toBe("Pytania publiczne: Od kiedy można złożyć wniosek o 800+ na nowy okres? oraz Od kiedy do kiedy trwa okres świadczeniowy 800+?");
  expect(publicQuestion(text, true)?.question).toBe(text);
});
