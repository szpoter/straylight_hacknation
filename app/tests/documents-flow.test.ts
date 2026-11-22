import { describe, expect, it } from "vitest";
import { allFields, demoProfile, documentDraft, displayValue, initialValues, nextState, progress, sendEvents, validPesel, validate } from "@/features/documents/flow";
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
    expect(v.dziecko).toBe("Ola Lis");
    expect(v.data_urodzenia).toBe("2026-11-10");
    expect(v.rodzic).toBe("Marta Lis");
    expect(v.pracodawca).toBe("Studio Lipa");
    expect(v.dziecko_pesel).toBeUndefined();
  });
  it("preserves the original draft, keeps deliberate edits and separates identifiers", () => {
    const id = "zasilek-macierzynski";
    const original = { rodzic: "Anna Przykładowa", pracodawca: "Kwiatek sp. z o.o.", dziecko: "Ola", rodzic_pesel: "old-parent", dziecko_pesel: "old-child", rachunek: "old-account", adres: "old-address", caly_okres: "Tak" };
    const store: Record<string, Record<string, string>> = { [id]: { ...original } };
    const read = (key: string) => store[key] ?? {};
    const migrated = documentDraft("ola", id, read);
    expect(migrated.values).toEqual({ rodzic: "Marta Lis", pracodawca: "Studio Lipa", dziecko: "Ola Lis", caly_okres: "Tak" });
    store[migrated.key] = { ...migrated.values, rodzic: "Paweł Lis", rodzic_pesel: "confirmed" };
    expect(documentDraft("ola", id, read).values.rodzic_pesel).toBe("confirmed");
    expect(store[id]).toEqual(original);
    const custom = { rodzic: "Inna osoba", dziecko: "Ola", dziecko_pesel: "deliberate", rachunek: "chosen" };
    expect(documentDraft("ola", id, () => custom).values).toEqual(custom);
    expect(documentDraft("inne", id, read).values).toEqual(original);
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
  it("brakujące pola i zły rachunek", () => {
    const errors = validate(def, { ...initialValues(def, ctx), rachunek: "12 3456" });
    expect(errors.dziecko_pesel).toBeDefined();
    expect(errors.caly_okres).toBe("Wybierz jedną odpowiedź");
    expect(errors.rachunek).toBe("Numer rachunku ma 26 cyfr");
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
    expect(timeline[1].status).toBe("current");
    expect(events.at(-1)).toMatchObject({ author: "Ty", date: "2026-11-21" });
    expect(childFiles([sent]).map((f) => f.type)).toEqual(["Kopia wniosku"]);
  });
  it("korekta zachowuje poprzednią wysyłkę jako zwykły wpis", () => {
    const first = sendEvents([], "pue", "ZUS", "2026-11-21");
    const second = sendEvents(first, "pue", "ZUS", "2026-11-22", true);
    expect(second.filter((e) => e.title === "Rodzic oznaczył przekazanie")).toHaveLength(1);
    expect(second.map((e) => e.title)).toContain("Poprzedni wpis o przekazaniu");
  });
});
