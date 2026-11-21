import { describe, expect, it } from "vitest";
import { publicQuestion } from "../src/lib/rag/public-query";
import { suggestSubmissionFacet, suggestTopic } from "../src/lib/zusik/topic-ranker";

describe("local semantic projection of an otherwise unrecognized question", () => {
  it.each([
    ["Czy na zakup zeszytów i podręczników mogę liczyć na pomoc finansową?", "Dobry Start"],
    ["Syn zaczyna pierwszą klasę. Podręczniki i zeszyty już kupione. Czy ZUS może dorzucić się do tego wydatku?", "Dobry Start"],
    ["Tyle poszło na zeszyty dla córki. Ktoś współfinansuje taki wydatek?", "Dobry Start"],
    ["Wydatki na plecak dla córki są spore. ZUS coś dopłaca?", "Dobry Start"],
    ["Kto doplaca do zeszytow uczniom?", "Dobry Start"],
    ["Chcemy wynająć opiekunkę dla malucha. Czy są dopłaty?", "Aktywny Rodzic"],
    ["Co miesiąc jakieś pieniądze na wychowanie syna od państwa?", "800+"],
  ])("finds the public topic for %s", (question, topic) => {
    expect(publicQuestion(question)).toBeNull();
    expect(suggestTopic(question)).toEqual(publicQuestion(topic));
  });

  it("projects a personal anecdote onto exactly the allowlisted plan", () => {
    const question = "Helena Malinowska pyta o dofinansowanie kupna zeszytów dla córki.";
    expect(suggestTopic(question)).toEqual(publicQuestion("Dobry Start"));
  });

  it.each([
    "Dlaczego na szlaku nosi się plecak turystyczny? ZUS coś dopłaca?",
    "Syn potrzebuje zeszytów i podręczników. Gdzie kupić je najtaniej?",
    "Obok oddziału ZUS sprzedają podręczniki dla dzieci. Czy sklep jest otwarty?",
    "Kto dorzuci się do zakupu plecaka turystycznego?",
    "Dorzucić synowi do koszyka jeszcze zeszyty?",
    "Dorzucę podręczniki do zamówienia. Który sklep polecasz?",
    "Czy mam dorzucić do plecaka jeszcze parę zeszytów?",
    "Czy ZUS zapłaci za klub piłkarski dla dziecka?",
    "Lekarstwo dla dziecka co miesiąc kosztuje majątek. Jest pomoc?",
    "Dopłata do studiów albo podręczników?",
    "Pieniądze na kolonie dla dzieci?",
    "Potrzebuję dofinansowania na podręczniki i na nianię.",
    "Jakie są pieniądze dla rodzica?",
    "Czy dopłacają do zeszytów? PESEL 11111111111",
    "Dopłata do podręczników dla syna, napisz na test@example.invalid.",
  ])("abstains on %s", question => expect(suggestTopic(question)).toBeNull());
});

describe("elliptical submission questions", () => {
  it.each([
    ["Da się to ogarnąć z telefonu?", "sposób złożenia wniosku"],
    ["Czy mogę to wysłać tabletem?", "sposób złożenia wniosku"],
    ["A kiedy zamykają nabór?", "termin złożenia wniosku"],
    ["Czy z telefonu mogę wysłać zdjęcia do sklepu?", null],
    ["Kiedy zamykają nabór do klubu piłkarskiego?", null],
    ["Na który wysłać? 500123456", null],
    ["Jaka jest pogoda?", null],
  ] as const)("%s", (question, facet) => expect(suggestSubmissionFacet(question)).toBe(facet));
});
