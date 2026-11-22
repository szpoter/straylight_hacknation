import { readFileSync } from "node:fs";
import path from "node:path";
import { PDFDocument, PDFSignature } from "pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { afterEach, expect, it, vi } from "vitest";
import { civilForms } from "@/lib/demo/forms-civil";
import { POZ_CHOICES, POZ_TEMPLATE } from "@/lib/forms/poz-map";

const bytes = (file: string) => new Uint8Array(readFileSync(path.resolve(__dirname, "../public", file)));
const template = bytes(POZ_TEMPLATE.slice(1));
const fonts = { regular: bytes("forms/fonts/DejaVuSans.ttf"), bold: bytes("forms/fonts/DejaVuSans-Bold.ttf") };
const date = "2026-11-22";
const example = {
  imie: "Zofia", nazwisko: "Łącka", identyfikator: "PESEL", dziecko_pesel: "26210100009", data_urodzenia: "2026-01-01",
  dziecko_dom: "15/2", dziecko_miasto: "01-234 Łódź", opiekun_imie: "Róża", opiekun_nazwisko: "Łącka",
  opiekun_dom: "13/4", opiekun_miasto: "00-111 Łódź", drugi_opiekun: "Nie", drugi_imie: "Ukryte",
  przychodnia: "Przychodnia Rodzinna", adres_przychodni: "Główna 11, Łódź", lekarz: "Anna Żuk",
  wybor_przychodni: POZ_CHOICES[3], wybor_przychodni_opis: "Zamknięcie filii", wybor_medyka: POZ_CHOICES[0],
};

afterEach(() => vi.unstubAllGlobals());

it.each([
  ["Lekarz POZ", "ORAZ LEKARZA", 568, 94],
  ["Pielęgniarka POZ", "ORAZ PIELĘGNIARKI", 593.3, 162],
  ["Położna POZ", "POŁOŻNEJ", 593, 159],
] as const)("drukuje właściwy załącznik POZ i dane w polach: %s", async (medyk, title, nameY, dateY) => {
  const fetchTemplate = vi.fn(() => Promise.resolve(new Response(template)));
  vi.stubGlobal("fetch", fetchTemplate);
  const result = await civilForms.poz.buildOfficial!({ ...example, medyk }, date, fonts);
  expect(fetchTemplate).toHaveBeenCalledWith(POZ_TEMPLATE);
  const pdf = await getDocument({ data: result, isEvalSupported: false }).promise;
  try {
    expect(pdf.numPages).toBe(3);
    const items = async (n: number) => (await (await pdf.getPage(n)).getTextContent()).items.filter(item => "str" in item);
    const [first, second, notes] = await Promise.all([items(1), items(2), items(3)]);
    expect(first.map(t => t.str).join(" ")).toContain(title);
    expect(first.find(t => t.str === example.imie)?.transform[5]).toBeCloseTo(nameY);
    expect(first.some(t => t.str.includes(example.opiekun_imie))).toBe(true);
    expect(first.some(t => t.str.includes(example.drugi_imie))).toBe(false);
    expect(second.find(t => t.str === "22.11.2026")?.transform[5]).toBe(dateY);
    for (const value of [example.przychodnia, example.adres_przychodni, example.lekarz, example.wybor_przychodni_opis]) {
      expect(second.some(t => t.str === value)).toBe(true);
    }
    expect(second.filter(t => t.str === "X")).toHaveLength(4);
    expect(notes.some(t => t.str.includes("OBJAŚNIENIA"))).toBe(true);
  } finally {
    await pdf.destroy();
  }
});

it("wiąże mapy z oficjalnym szablonem zawierającym jedynie pola podpisu publikacji", async () => {
  const original = await PDFDocument.load(template);
  const fields = original.getForm().getFields();
  expect(fields).toHaveLength(2);
  expect(fields.every(f => f instanceof PDFSignature)).toBe(true);
  expect(original.getPageCount()).toBe(10);
  vi.stubGlobal("fetch", async () => new Response(new Uint8Array([1])));
  await expect(civilForms.poz.buildOfficial!({ ...example, medyk: "Lekarz POZ" }, date, fonts)).rejects.toThrow("Wzór deklaracji POZ zmienił się");
});

it("zgłoszenie żywego urodzenia ma trzy drogi bez druku i dopuszcza dwa imiona", () => {
  const form = civilForms["zglos-urodzenie"];
  expect(form.pdf).toBe("none");
  expect(form.channels).toEqual(["govpl", "mobywatel", "usc"]);
  expect(form.bring).toContain("protokół");
  expect(form.validate!({ imiona: "Anna Maria", data_urodzenia: date }, date)).toEqual({});
  expect(form.validate!({ imiona: "Anna Maria Ewa", data_urodzenia: "2026-11-23" }, date)).toHaveProperty("imiona");
});

it("odpis wielojęzyczny wymaga papieru, pismo uwzględnia liczbę, opłatę, cel i załączniki", () => {
  const form = civilForms.odpis;
  expect(form.receipts?.govpl).toBe("Potwierdzenie na skrzynce e-Doręczeń (UPP)");
  const v = { rodzaj: "Wielojęzyczny", liczba: "2", odbior: "Na skrzynkę do e-Doręczeń", cel: "Do sprawy spadkowej" };
  expect(form.validate!(v, date)).toHaveProperty("odbior");
  expect(form.validate!({ ...v, liczba: "0" }, date)).toHaveProperty("liczba");
  const letter = form.letter!({ ...v, odbior: "Pocztą na adres zamieszkania", adres: "Leśna 1, Łódź" }, date).join("\n");
  for (const s of ["44 zł", "wielojęzycznym", "Leśna 1, Łódź", v.cel, "Załącznik"]) expect(letter).toContain(s);
  expect(form.letter!({ ...v, rodzaj: "Zupełny" }, date).join(" ")).toContain("66 zł");
  expect(form.letter!({ ...v, oplata: "Sprawa zwolniona z opłaty skarbowej" }, date).join(" ")).toContain("Załączniki: brak");
});
