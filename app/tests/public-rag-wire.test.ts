import { expect, it } from "vitest";
import { messageInput } from "../src/lib/zusik/v1/conversation";
import { routeCaseQuestion } from "../src/lib/zusik/v1/intent";
import { publicQuestion } from "../src/lib/rag/public-query";
import { searchCorpus } from "../src/lib/rag/corpus-search";

it.each([
  ["Szef poleca jednorazową odpłatną pracę na zwolnieniu lekarskim. Czy taka praca stanowi wyjątek?", "uz-17-1"],
  ["Czy osoba tymczasowo aresztowana zachowuje świadczenie za zwolnienie lekarskie? Kiedy możliwy jest wyjątek?", "uz-12-1"],
  ["Kiedy można złożyć wniosek o 800+ na kolejny okres oraz które miesiące obejmuje ten okres?", ""],
])("round-trips the generated public query through the v1 request schema: %s", (raw, id) => {
  const route = routeCaseQuestion(raw, {facts: []});
  if (!("input" in route)) throw new Error("Expected a public POST");
  const body = messageInput.parse(JSON.parse(JSON.stringify(route.input)));
  if (body.intent !== "public_question") throw new Error("Expected a public POST");
  const text = body.publicQuestion;
  expect(publicQuestion(text, true)?.question).toBe(text);
  expect(publicQuestion(text)?.question).toBe(text);
  if (id) expect(searchCorpus(text)?.fragmentId).toBe(id);
});

it.each([
  "Czy na L4 moja odpłatna praca na polecenie szefa jest wyjątkiem w mojej sprawie?",
  "Na zwolnieniu lekarskim nie wykonywałem odpłatnej pracy. Czy to wyjątek?",
  "Czy odpłatna praca podczas zwolnienia z opłat za żłobek stanowi wyjątek?",
  "Czy zlecenie odpłatnej pracy na L4 pozwala szefowi zająć rachunek bankowy?",
])("does not turn a personal or unrelated condition into a public work exception: %s", text => {
  const route = routeCaseQuestion(text, {facts: []});
  if ("input" in route && route.input.intent === "public_question")
    expect(route.input.publicQuestion).not.toMatch(/^Zasiłek chorobowy\. .*incydentaln/u);
});

it("rejects joined legal terms with incompatible source conditions", () => {
  const mixed = "Zasiłek chorobowy. Co przewidują przepisy — tymczasowego, aresztowania, nadużyciem, alkoholu?";
  expect(publicQuestion(mixed, true)?.clarify).toBeTruthy();
  expect(publicQuestion(mixed)?.clarify).toBeTruthy();
  const raw = "Jak na chorobowe wpływa tymczasowe aresztowanie i nadużycie alkoholu?";
  expect(routeCaseQuestion(raw, {facts:[]})).toHaveProperty("clarify");
});
