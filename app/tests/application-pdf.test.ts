import { readFileSync } from "node:fs";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it } from "vitest";
import { demoProfile, initialValues, validate, type Values } from "@/features/documents/flow";
import { applicationDoc, pdfFilename } from "@/features/documents/pdf";
import { formatLong } from "@/lib/demo/dates";
import { getPlan } from "@/lib/demo/fixtures";
import { FORMS, prefillContext, type FormDef } from "@/lib/demo/forms";
import { buildApplicationPdf } from "@/lib/forms/application-pdf";

const ROOT = path.resolve(__dirname, "..");
const font = (name: string) => new Uint8Array(readFileSync(path.join(ROOT, "public/forms/fonts", name)));
const FONTS = { regular: font("DejaVuSans.ttf"), bold: font("DejaVuSans-Bold.ttf") };

const profile = demoProfile();
const ctx = prefillContext(getPlan("ola"), profile);
const opts = { recipient: "Do pracodawcy", date: "2026-11-21" };

/** Wydrukowane wiersze tekstu, strona po stronie. */
async function pageLines(bytes: Uint8Array): Promise<string[][]> {
  const pdf = await getDocument({ data: bytes.slice(), isEvalSupported: false }).promise;
  try {
    const out: string[][] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const content = await (await pdf.getPage(i)).getTextContent();
      out.push(content.items.map((item) => ("str" in item ? item.str : "")).filter((s) => s.trim()));
    }
    return out;
  } finally {
    await pdf.destroy();
  }
}

/** Tekst każdej strony, z pojedynczymi spacjami. */
const pages = async (bytes: Uint8Array) => (await pageLines(bytes)).map((lines) => lines.join(" ").replace(/\s+/g, " "));

const render = async (def: FormDef, values: Values, extra: Partial<typeof opts> & { correction?: boolean } = {}) =>
  pages(await buildApplicationPdf(applicationDoc(def, values, { ...opts, ...extra }), FONTS));

describe("PDF wniosku z Dokumentów", () => {
  const parental = { ...initialValues(FORMS.rodzicielski, ctx), od: "2027-01-04", tygodnie: "16" };

  it("drukuje wpisane wartości, adresata i datę, bez oznaczenia szkicu", async () => {
    expect(validate(FORMS.rodzicielski, parental)).toEqual({});
    const [text, ...rest] = await render(FORMS.rodzicielski, parental);
    expect(rest).toHaveLength(0);
    for (const s of ["Wniosek o urlop rodzicielski", profile.parentName, profile.employer, "Ola", formatLong(ctx.birthDate!), "4 stycznia 2027", "Liczba tygodni 16", "21 listopada 2026", "podpis wnioskodawcy", "Strona 1 z 1"]) {
      expect(text).toContain(s);
    }
    expect(text).not.toMatch(/SZKIC|KOREKTA|undefined|null/);
  });

  it("pomija pola ukryte przez odpowiedź i pokazuje je po jej zmianie", async () => {
    expect((await render(FORMS.rodzicielski, parental))[0]).not.toContain("Wymiar pracy");
    const [text] = await render(FORMS.rodzicielski, { ...parental, praca: "Tak", wymiar: "1/2 etatu" });
    expect(text).toContain("Wymiar pracy w czasie urlopu 1/2 etatu");
  });

  it("składa każdy z wniosków; niepełny jest oznaczony jako szkic, korekta jako korekta", async () => {
    for (const def of Object.values(FORMS)) {
      const values = initialValues(def, ctx);
      const text = (await render(def, values)).join(" ");
      expect(text, def.name).toContain(def.name);
      expect(text.includes("SZKIC"), def.name).toBe(Object.keys(validate(def, values)).length > 0);
      expect(text).not.toMatch(/undefined|null/);
    }
    expect((await render(FORMS.rodzicielski, parental, { correction: true }))[0]).toContain("KOREKTA");
  });

  it("długą wartość przenosi na kolejne strony, zachowuje nowe wiersze i numeruje strony", async () => {
    const address = Array.from({ length: 90 }, (_, i) => `ul. Długa ${i + 1}`).join("\r\n");
    const doc = applicationDoc(FORMS.poz, { ...initialValues(FORMS.poz, ctx), przychodnia: address }, { ...opts, recipient: "Przychodnia" });
    const lines = await pageLines(await buildApplicationPdf(doc, FONTS));
    const total = lines.length;
    expect(total).toBeGreaterThan(1);
    expect(lines[0]).toContain(`Strona 1 z ${total}`);
    expect(lines.at(-1)).toContain(`Strona ${total} z ${total}`);
    // Każdy wiersz adresu to osobny wiersz w PDF (nowe linie z pola tekstowego nie giną).
    expect(lines.flat().filter((l) => l === "ul. Długa 90")).toHaveLength(1);
    // Adresat w nagłówku jest skrócony do 4 wierszy: piąty wiersz adresu jest już tylko w treści.
    expect(lines[0]).toContain("ul. Długa 4 …");
    expect(lines.flat().filter((l) => l === "ul. Długa 5")).toHaveLength(1);
    // Nagłówek sekcji nie zostaje sam: pierwszy wiersz sekcji jest na tej samej stronie.
    const heading = lines.findIndex((page) => page.includes("Przychodnia"));
    expect(lines[heading]).toContain("Nazwa i adres przychodni");
  });

  it("znaki spoza czcionki zamienia na „?”, zamiast przerywać składanie", async () => {
    const [text] = await render(FORMS.rodzicielski, { ...parental, rodzic: "Anna 👶\tPrzykładowa" });
    expect(text).toContain("Anna ? Przykładowa");
  });

  it("adresat: pracodawca lub przychodnia z wniosku, inaczej odbiorca sprawy", () => {
    expect(applicationDoc(FORMS.rodzicielski, parental, opts).addressee).toBe(profile.employer);
    expect(applicationDoc(FORMS.poz, { przychodnia: "Przychodnia Lipowa" }, { ...opts, recipient: "Przychodnia" }).addressee).toBe("Przychodnia Lipowa");
    expect(applicationDoc(FORMS.odpis, {}, { ...opts, recipient: "Urząd stanu cywilnego" }).addressee).toBe("Urząd stanu cywilnego");
    expect(applicationDoc(FORMS["800plus"], {}, { ...opts, recipient: "Do ZUS" }).addressee).toBe("ZUS");
  });

  it("nazwa pliku bez polskich znaków", () => {
    expect(pdfFilename(FORMS.rodzicielski)).toBe("wniosek-o-urlop-rodzicielski.pdf");
    expect(pdfFilename(FORMS.rodzicielski, true)).toBe("wniosek-o-urlop-rodzicielski-korekta.pdf");
    expect(pdfFilename(FORMS["800plus"])).toBe("wniosek-o-swiadczenie-wychowawcze-800-sw-1.pdf");
    expect(pdfFilename(FORMS.becikowe)).toMatch(/^[a-z0-9-]+[a-z0-9]\.pdf$/);
  });
});
