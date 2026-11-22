import { describe, expect, it } from "vitest";
import { allFields, demoProfile, displayValue, initialValues, nextState, progress, sendEvents, validPesel, validate } from "@/features/documents/flow";
import { buildTimeline } from "@/features/documents/timeline";
import { childFiles, type DocCase } from "@/features/documents/model";
import { FORMS, formFor, prefillContext } from "@/lib/demo/forms";
import { getPlan } from "@/lib/demo/fixtures";
import { docCases } from "@/lib/plan/docs";

const ola = getPlan("ola");
const ctx = prefillContext(ola, demoProfile());

describe("formularze wniosków", () => {
  it("każda sprawa z dokumentem w planach demo (poza zakończonymi) ma formularz", () => {
    for (const id of ["ola", "oczekiwane", "test-alicja"]) {
      const open = docCases(getPlan(id).stops).filter((s) => s.state !== "zalatwione");
      for (const s of open) expect(formFor(s.id), `${id}/${s.id}`).toBeDefined();
    }
  });
  it("pola mają unikalne id w obrębie formularza", () => {
    for (const def of Object.values(FORMS)) {
      const ids = allFields(def).map((f) => f.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe("podstawianie danych", () => {
  it("z planu Oli: imię dziecka, data urodzenia, rodzic i pracodawca z profilu", () => {
    const v = initialValues(FORMS["zasilek-macierzynski"], ctx);
    expect(v.dziecko).toBe("Ola");
    expect(v.data_urodzenia).toBe("2026-11-10");
    expect(v.rodzic).toBe("Anna Przykładowa");
    expect(v.pracodawca).toBe("Kwiatek sp. z o.o.");
    expect(v.dziecko_pesel).toBeUndefined();
  });
  it("wartości wpisane przez rodzica wygrywają z podstawionymi", () => {
    expect(initialValues(FORMS["zasilek-macierzynski"], ctx, { dziecko: "Aleksandra" }).dziecko).toBe("Aleksandra");
  });
  it("plan oczekiwanego dziecka nie podstawia daty urodzenia", () => {
    const expected = prefillContext(getPlan("oczekiwane"), demoProfile());
    expect(initialValues(FORMS["800plus"], expected).data_urodzenia).toBeUndefined();
    expect(expected.dueDate).toBe("2027-05-14");
  });
});

describe("walidacja", () => {
  const def = FORMS["zasilek-macierzynski"];
  it("PESEL z cyfrą kontrolną", () => {
    expect(validPesel("44051401359")).toBe(true);
    expect(validPesel("44051401358")).toBe(false);
    expect(validPesel("123")).toBe(false);
  });
  it("PESEL wpisany w grupach (spacje, myślnik) przechodzi i jest pokazywany jako same cyfry", () => {
    for (const v of ["440514 01359", "440 514 01359", "440514-01359", " 44051401359 "]) {
      expect(validate(def, { ...initialValues(def, ctx), rodzic_pesel: v }).rodzic_pesel, v).toBeUndefined();
    }
    expect(displayValue(allFields(def).find((f) => f.id === "rodzic_pesel")!, "440514 01359")).toBe("44051401359");
  });
  it("komunikat przy PESEL-u mówi, co jest nie tak (zgłoszenie: 11 cyfr odrzucane jako „ma 11 cyfr”)", () => {
    const error = (v: string) => validate(def, { ...initialValues(def, ctx), rodzic_pesel: v }).rodzic_pesel;
    expect(error("12345678901")).toBe("Ostatnia cyfra PESEL-u (kontrolna) nie zgadza się z pozostałymi. Sprawdź, czy nie ma literówki");
    expect(error("4405140135")).toBe("PESEL ma 11 cyfr, a wpisano 10");
    expect(error("4405140135a")).toBe("PESEL składa się tylko z cyfr");
  });
  it("brakujące pola i zły rachunek", () => {
    const errors = validate(def, { ...initialValues(def, ctx), rachunek: "12 3456" });
    expect(errors.dziecko_pesel).toBeDefined();
    expect(errors.caly_okres).toBe("Wybierz jedną odpowiedź");
    expect(errors.rachunek).toBe("Numer rachunku ma 26 cyfr, a wpisano 6");
    expect(validate(def, { ...initialValues(def, ctx), rachunek: "61 1090 1014 0000 0712 198x 2874" }).rachunek).toBe("Numer rachunku składa się z cyfr. Możesz je oddzielić spacjami");
  });
  it("rachunek ze spacjami, myślnikami albo „PL” przechodzi", () => {
    for (const v of ["61109010140000071219812874", "61 1090 1014 0000 0712 1981 2874", "PL61 1090 1014 0000 0712 1981 2874", "61-1090-1014-0000-0712-1981-2874"]) {
      expect(validate(def, { ...initialValues(def, ctx), rachunek: v }).rachunek, v).toBeUndefined();
    }
  });
  it("ukryte pole nie blokuje (przekaz pocztowy bez rachunku)", () => {
    const errors = validate(def, { ...initialValues(def, ctx), wyplata: "Przekazem pocztowym" });
    expect(errors.rachunek).toBeUndefined();
  });
  it("kompletny wniosek przechodzi; postęp liczy wymagane pola", () => {
    const values = { ...initialValues(def, ctx), rodzic_pesel: "44051401359", dziecko_pesel: "44051401359", caly_okres: "Tak", rachunek: "PL12 3456 7890 1234 5678 9012 3456" };
    expect(validate(def, values)).toEqual({});
    const { done, total } = progress(def, values);
    expect(done).toBe(total);
    expect(displayValue(allFields(def).find((f) => f.id === "rachunek")!, values.rachunek)).toBe("12 3456 7890 1234 5678 9012 3456");
  });
});

describe("przejścia stanów", () => {
  it("zapis: szkic albo wypełniony", () => {
    expect(nextState("aktualna", "save", false)).toBe("szkic");
    expect(nextState("szkic", "save", true)).toBe("wypelniony");
  });
  it("zatwierdzenie tylko kompletnego, wysyłka tylko zatwierdzonego", () => {
    expect(nextState("wypelniony", "approve", false)).toBe("wypelniony");
    expect(nextState("wypelniony", "approve", true)).toBe("zatwierdzony");
    expect(nextState("wypelniony", "send", true)).toBe("wypelniony");
    expect(nextState("zatwierdzony", "send", true)).toBe("wyslano");
  });
  it("korekta wysłanego wniosku wraca do szkicu", () => {
    expect(nextState("wyslano", "correct", true)).toBe("szkic");
  });
  it("wysyłka dopisuje zdarzenia czytane przez przebieg i pliki dziecka", () => {
    const stop = ola.stops.find((s) => s.id === "urlop-ojcowski")!;
    const events = sendEvents(stop.doc?.events, "pracodawca", "Do pracodawcy", "2026-11-21");
    const sent = { ...stop, state: "wyslano" as const, doc: { ...stop.doc!, events } } as DocCase;
    const timeline = buildTimeline(sent);
    expect(timeline[0].status).toBe("done");
    expect(timeline[1].status).toBe("done");
    expect(childFiles([sent]).map((f) => f.type)).toEqual(expect.arrayContaining(["Kopia wniosku", "Potwierdzenie"]));
  });
  it("korekta zachowuje poprzednią wysyłkę jako zwykły wpis", () => {
    const first = sendEvents([], "pue", "ZUS", "2026-11-21");
    const second = sendEvents(first, "pue", "ZUS", "2026-11-22", true);
    expect(second.filter((e) => e.title === "Wysłano w symulacji")).toHaveLength(1);
    expect(second.map((e) => e.title)).toContain("Wysłano poprzednią wersję");
  });
});
