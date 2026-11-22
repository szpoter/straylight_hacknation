import { expect, it } from "vitest";
import { publicBenefitTopics } from "../src/lib/rag/public-query";
import { routeCaseQuestion } from "../src/lib/zusik/v1/intent";

it.each([
  "Czy na L4 wykonanie czynności incydentalnej na polecenie pracodawcy jest pracą zarobkową?",
  "Co oznacza praca zarobkowa na zwolnieniu?",
  "Co oznaczają czynności incydentalne podczas zwolnienia?",
])("keeps statutory work conditions in the sick-leave question: %s", text => {
  const route = routeCaseQuestion(text, { facts: [] });
  if (!("input" in route) || route.input.intent !== "public_question") throw new Error("Expected a public query");
  expect(route.input.publicQuestion).toMatch(/^Zasiłek chorobowy\./u);
  expect(route.input.publicQuestion).toMatch(/incydental|zarobkow/iu);
  expect(route.input.publicQuestion).not.toMatch(/macierzyń|rodzicielsk/iu);
});

it.each([
  "Na L4 pracodawca nie polecił żadnej czynności. Czy pracownik traci świadczenie?",
  "Co oznacza brak polecenia pracodawcy podczas zwolnienia?",
  "Czy przy L4 można mówić o pracy zarobkowej bez wynagrodzenia?",
  "Czy na L4 czynność nieodpłatna na życzenie pracodawcy powoduje utratę świadczenia?",
  "Nie chodzi o urlop ojcowski. Czy na zwolnieniu lekarskim wolno pracować?",
])("clarifies rather than dropping the qualification at the browser boundary: %s", text => {
  expect(routeCaseQuestion(text, { facts: [] })).toHaveProperty("clarify");
});

it.each([
  ["Jakie czynności można wykonywać w trakcie zwolnienia lekarskiego?", ["sickness"]],
  ["Co oznacza ubezpieczenie w okresie niezdolności do pracy?", ["sickness"]],
  ["Kto wystawia zaświadczenie o opiece nad chorym dzieckiem?", ["care"]],
  ["Czy zasiłek macierzyński można pobierać za okres urlopu ojcowskiego?", ["maternity", "paternity"]],
  ["Które dokumenty trzeba okazać po zwolnieniu z aresztu?", []],
  ["Opłata po zwolnieniu z podatku.", []],
])("identifies only the benefits explicitly named by the vocabulary: %s", (q, expected) => {
  expect(publicBenefitTopics(q as string)).toEqual(expected);
});

it.each([
  ["Czy osoba popełniająca umyślne wykroczenie zachowuje świadczenie za okres zwolnienia lekarskiego?", "uz-15-1"],
  ["Czy przy niezdolności spowodowanej nadużyciem alkoholu można otrzymać zasiłek?", "uz-16-1"],
])("keeps the corroborated legal qualification despite a grammatical subject: %s", async (raw, expected) => {
  const { searchCorpus } = await import("../src/lib/rag/corpus-search");
  const route = routeCaseQuestion(raw, { facts: [] });
  if (!("input" in route) || route.input.intent !== "public_question") throw new Error("Expected statutory query");
  expect(searchCorpus(route.input.publicQuestion)?.fragmentId).toBe(expected);
});

it.each([
  "Czy przy niezdolności do samodzielnej egzystencji wpływ alkoholu zmienia świadczenie?",
  "Czy osoba objęta dozorem elektronicznym zachowuje świadczenie za zwolnienie lekarskie? Kiedy możliwy jest wyjątek?",
])("keeps unsupported or incompatible qualifications out of a legal projection: %s", q => {
  expect(routeCaseQuestion(q, {facts: []})).toHaveProperty("clarify");
});
