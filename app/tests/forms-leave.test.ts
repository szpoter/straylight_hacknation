import { readFile } from "node:fs/promises";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";
import { validate } from "@/features/documents/flow";
import { renderFormPdf } from "@/features/documents/pdf";
import { leaveForms } from "@/lib/demo/forms-leave";

const today = "2026-11-22";
const base = { rodzic: "Jan Testowy", pracodawca: "Firma Przykładowa", miejscowosc: "Gdańsk" };
const family = { ...base, dziecko: "Ola Testowa", data_urodzenia: "2026-11-10", sytuacja: "Urodzenie dziecka", odpis: "Dokument jest już w aktach osobowych" };
const pre = { ...base, termin: "2027-01-10", od: "2026-11-29", zaswiadczenie: "Dołączam do wniosku" };
const dad = { ...family, od: "2026-11-29", okres: "1 tydzień", wykorzystany: "Nie korzystałem" };
const parental = { ...family, od: "2026-12-13", do: "2026-12-23", liczba_dzieci: "Jedno dziecko", za_zyciem: "Podstawowy", wykorzystane_moje: "0", wykorzystane_drugiego: "0", liczba_czesci: "0", drugi: "Nie" };
const work = { ...base, od: "2026-12-13", do: "2027-01-31", wymiar: "1/5", wydluzenie: "Tak", wymiar_wydluzenia: "0,5" };

describe("pisma urlopowe", () => {
  it("uznaje dokładnie 6 tygodni przed porodem, z wyłączeniem dnia porodu", () => {
    const form = leaveForms["macierzynski-przed"];
    expect(validate(form, pre, today)).toEqual({});
    for (const od of ["2026-11-28", pre.termin]) expect(validate(form, { ...pre, od }, today)).toHaveProperty("od");
  });

  it("liczy oba końce ojcowskiego, tydzień wyprzedzenia i części wykorzystane wcześniej", () => {
    const form = leaveForms["urlop-ojcowski"];
    expect(validate(form, dad, today)).toEqual({});
    expect(form.letter!(dad, today).join(" ")).toContain("29.11.2026 do 05.12.2026");
    expect(validate(form, { ...dad, od: "2026-11-28" }, today)).toHaveProperty("od");
    expect(validate(form, { ...dad, okres: "2 tygodnie", wykorzystany: "Wykorzystałem 1 tydzień" }, today)).toHaveProperty("okres");
    expect(validate(form, { ...dad, od: "2027-11-03" }, today)).toEqual({});
    expect(validate(form, { ...dad, od: "2027-11-04" }, today)).toHaveProperty("od");
    expect(validate(form, { ...dad, data_urodzenia: "2020-01-15", sytuacja: "Przysposobienie", adopcja: "2026-10-01", postanowienie: "Dołączam do wniosku" }, today)).toEqual({});
  });

  it("sprawdza termin 21 dni, 5 części, wspólną i nieprzenoszalną pulę rodzicielskiego", () => {
    const form = leaveForms.rodzicielski;
    expect(validate(form, parental, today)).toEqual({});
    expect(validate(form, { ...parental, od: "2026-12-12" }, today)).toHaveProperty("od");
    expect(validate(form, { ...parental, liczba_czesci: "5" }, today)).toHaveProperty("liczba_czesci");
    expect(validate(form, { ...parental, do: "2027-07-25" }, today)).toHaveProperty("do");
    expect(validate(form, { ...parental, do: "2027-07-25", za_zyciem: "Korzystam z uprawnienia „Za życiem”", zaswiadczenie: "Dołączam do wniosku" }, today)).toEqual({});
    expect(validate(form, { ...parental, wykorzystane_moje: "122", wykorzystane_drugiego: "150", liczba_czesci: "3", drugi: "Tak", drugi_od: parental.od, drugi_do: parental.do }, today)).toHaveProperty("do");
    expect(validate(form, { ...parental, drugi: "Tak", drugi_od: "2026-12-12", drugi_do: parental.do }, today)).toHaveProperty("drugi_od");
    expect(validate(form, { ...parental, data_urodzenia: "2020-03-01", do: "2026-12-31" }, today)).toEqual({});
    expect(validate(form, { ...parental, data_urodzenia: "2020-03-01", do: "2027-01-01" }, today)).toHaveProperty("do");
  });

  it("przy łączeniu z pracą sprawdza oba wymiary etatu oraz okres pracy", () => {
    const form = leaveForms["rodzicielski-praca"];
    expect(validate(form, work, today)).toEqual({});
    expect(validate(form, { ...work, wymiar: "2/3", wymiar_wydluzenia: "3/0" }, today)).toMatchObject({ wymiar: expect.any(String), wymiar_wydluzenia: expect.any(String) });
    expect(validate(form, { ...work, do: "2026-12-01" }, today)).toHaveProperty("do");
    expect(validate(form, { ...work, wydluzenie: "Nie", wymiar_wydluzenia: "3/4" }, today)).toEqual({});
  });

  it.each([
    ["macierzynski-przed", pre, ["29.11.2026", "10.01.2027", "zaświadczenia"]],
    ["urlop-ojcowski", dad, ["05.12.2026", "Nie korzystałem", "aktach osobowych"]],
    ["rodzicielski", parental, ["23.12.2026", "nie zamierza", "aktach osobowych"]],
    ["rodzicielski-praca", work, ["31.01.2027", "1/5", "0,5"]],
  ] as const)("renderuje datę, adresata, podpis i treść %s w pobieranym PDF", async (id, values, expected) => {
    const regular = await readFile("public/forms/fonts/DejaVuSans.ttf");
    const bold = await readFile("public/forms/fonts/DejaVuSans-Bold.ttf");
    const pdf = await renderFormPdf(leaveForms[id], values, { recipient: "Do pracodawcy", date: today }, { regular, bold });
    const document = await getDocument({ data: pdf, isEvalSupported: false }).promise;
    try {
      const page = await document.getPage(1);
      const { items } = await page.getTextContent();
      const text = items.map(item => "str" in item ? item.str : "").join(" ").replace(/\s+/g, " ");
      for (const sample of [base.rodzic, base.pracodawca, base.miejscowosc, "22 listopada 2026", "podpis", ...expected]) expect(text).toContain(sample);
      expect(text).not.toContain("SZKIC");
    } finally {
      await document.destroy();
    }
  });
});
