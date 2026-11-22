import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { PDFDocument } from "pdf-lib";
import { afterEach, describe, expect, it, vi } from "vitest";
import { benefitsForms } from "@/lib/demo/forms-benefits";
import { CHANNEL_LABEL, type FormDef } from "@/lib/demo/form-fields";
import { SR_HASH } from "@/lib/forms/sr2-pdf";
import { incomeYear } from "@/lib/forms/sr2-data";
import { makePesel } from "@/lib/ocr/identifiers";

const root = join(__dirname, "../public/forms");
const bytes = (file: string) => new Uint8Array(readFileSync(join(root, file)));
const fonts = { regular: bytes("fonts/DejaVuSans.ttf"), bold: bytes("fonts/DejaVuSans-Bold.ttf") };
const { becikowe: sr, "800plus": sw } = benefitsForms;
const day = "2026-11-22";
const applicant = makePesel("1992-01-05", 1, false);
const baby = makePesel("2026-11-18", 3, false);
const base = {
  urzad: "Prezydent Miasta Łodzi", urzad_gmina: "Łódź", urzad_miasto: "Łódź", urzad_kod: "90-001", urzad_ulica: "Piotrkowska", urzad_dom: "1",
  adres_gmina: "Łódź", adres_miasto: "Łódź", adres_kod: "90-002", adres_ulica: "Łąkowa", adres_dom: "10", adres_lokal: "7",
  rola: "Rodzic biologiczny", rodzic_imie: "Łucja", rodzic_nazwisko: "Żak", rodzic_pesel: applicant, rodzic_data: "1992-01-05", rodzic_obywatelstwo: "polskie", stan_cywilny: "Panna",
  dziecko_imie: "Róża", dziecko_nazwisko: "Żak", dziecko_pesel: baby, data_urodzenia: "2026-11-18", dziecko_obywatelstwo: "polskie",
  skladki: "ZUS", alimenty: "1002,04", nieopodatkowane: "Nie", rolne: "Nie", utrata: "Nie", uzyskanie: "Nie", samotnie: "Nie",
  zaswiadczenie: "Tak", pobyt_dokument: "Nie", zagranica_sr: "Potwierdzam", oswiadczenie: "Potwierdzam", miejscowosc: "Zgierz",
  wyplata: "Na rachunek bankowy", rachunek: "83102011110000000012345678",
};

function mockTemplates() {
  return vi.stubGlobal("fetch", vi.fn(async (url: string) => new Response(bytes(url.replace("/forms/", "")))));
}

async function pdfText(data: Uint8Array) {
  const d = await getDocument({ data: data.slice(), isEvalSupported: false }).promise;
  try {
    return await Promise.all(Array.from({ length: d.numPages }, async (_, i) => {
      const page = await d.getPage(i + 1);
      return (await page.getTextContent()).items.map(item => "str" in item ? item.str : "").join(" ");
    }));
  } finally { await d.destroy(); }
}

afterEach(() => vi.unstubAllGlobals());

describe("Świadczenia rodzinne", () => {
  it("SW-R ma cztery kanały elektroniczne i nie tworzy PDF", () => {
    expect(sw.channels).toEqual(["pue", "mzus", "bank", "empatia"]);
    expect(sw.channels.every(c => CHANNEL_LABEL[c].mode === "online")).toBe(true);
    expect(sw.pdf).toBe("none");
    expect(sw.buildOfficial).toBeUndefined();
    expect(sw.validate?.({ wspolne: "Nie", email: "a", okres: "2027/2028" }, day)).toMatchObject({
      wspolne: expect.any(String), okres: expect.any(String), email: expect.any(String),
    });
    expect(sw.validate?.({ wspolne: "Tak", okres: "2027/2028" }, "2027-02-01")).toEqual({});
  });
  it("sprawdza wymagania papieru i Emp@tii, wyjątki dla opiekuna oraz rok bazowy", () => {
    expect(sr.channels).toEqual(["empatia", "gmina", "poczta"]);
    expect(incomeYear("2026-10-31")).toBe(2024);
    expect(incomeYear("2026-11-01")).toBe(2025);
    expect(sr.validate?.(base, day)).toEqual({});
    expect(sr.validateChannel?.(base, "empatia")).toHaveProperty("email");
    expect(sr.validateChannel?.(base, "gmina")).toEqual({});
    expect(sr.validate?.({ ...base, zaswiadczenie: "Nie", samotnie: "Tak", alimenty_tytul: "Brak tytułu i wyjątku" }, day)).toMatchObject({ zaswiadczenie: expect.any(String), alimenty_tytul: expect.any(String) });
    expect(sr.validate?.({ ...base, rola: "Opiekun prawny", zaswiadczenie: "Nie" }, day)).toEqual({});
    expect(sr.validate?.({ ...base, dziecko_pesel: "", dziecko_dokument: "AA123456" }, day)).toEqual({});
    expect(sr.validate?.({ ...base, rodzina: "Jan | Żak | 123 | ojciec" }, day)).toHaveProperty("rodzina");
    expect(sr.validate?.({ ...base, nieopodatkowane: "Tak", dochody_osoby: `${applicant} | alimenty | 999999,90\n${applicant} | stypendium | 2,50` }, day)).toHaveProperty("dochody_osoby");
  });
  it("zachowuje wersję i liczbę stron każdego wzoru", async () => {
    for (const [name, hash] of Object.entries(SR_HASH)) {
      const raw = bytes(name + ".pdf");
      expect(createHash("sha256").update(raw).digest("hex")).toBe(hash);
      const doc = await PDFDocument.load(raw);
      expect(doc.getPageCount()).toBe(({ "sr-2": 7, "sr-2z": 3, "zsr-05": 3, "zsr-07": 1 })[name]);
      expect(doc.getForm().getFields().every(f => f.constructor.name === "PDFSignature")).toBe(true);
    }
  });
  it("drukuje wszystkie dzieci i członków rodziny, warunkowe załączniki, kwoty, datę i wykaz dokumentów", async () => {
    mockTemplates();
    const extra = ["Anna", "Julia", "Klara", "Jagoda"].map((name, i) => [name, "Żak", "dok: AA" + (10000 + i), "2026-11-18", "polskie"].join(" | ")).join("\n");
    const data = { ...base, kolejne_dzieci: extra, rodzina: "Michał | Żak | dok: BBB12345 | ojciec", nieopodatkowane: "Tak", dochody_osoby: applicant + " | Stypendium | 341,25", rolne: "Tak", hektary_osoby: "dok: BBB12345 | 3,125", uzyskanie: "Tak" };
    expect(sr.validate?.(data, day)).toEqual({});
    const pdf = await sr.buildOfficial!(data, day, fonts);
    const pages = await pdfText(pdf);
    expect(pages).toHaveLength(15);
    expect(pages[0]).toContain("PREZYDENT MIASTA ŁODZI");
    expect(pages[1]).toContain("KLARA");
    expect(pages[3]).toContain("JAGODA");
    expect(pages[6]).toContain("ZGIERZ");
    expect(pages[6]).toContain("22.11.2026");
    expect(pages[7]).toContain("JAGODA");
    expect(pages[8]).toContain("MICHAŁ");
    expect(pages[10]).toContain("STYPENDIUM");
    expect(pages[13]).toContain("BBB12345");
    expect(pages[3].replace(/\s/g, "")).toContain("2025100204");
    expect(pages[5].replace(/\s/g, "")).toContain(base.rachunek);
    expect(pages[10].replace(/\s/g, "")).toContain("STYPENDIUM34125");
    expect(pages[13].replace(/\s/g, "")).toContain("31250");
    expect(pages[14]).toContain("ZSR-07");
    expect((await PDFDocument.load(pdf)).getForm().getFields()).toHaveLength(0);
  });
  it("pomija stare ukryte wartości i zatrzymuje generowanie po podmianie wzoru", async () => {
    mockTemplates();
    const pdf = await sr.buildOfficial!({ ...base, wyplata: "Przekazem pocztowym", dochody_osoby: "stara treść" }, day, fonts);
    const pages = await pdfText(pdf);
    expect(pages).toHaveLength(7);
    expect(pages[5].replace(/\s/g, "")).not.toContain(base.rachunek);
    vi.stubGlobal("fetch", async () => new Response(bytes("sr-2z.pdf")));
    await expect(sr.buildOfficial!(base, day, fonts)).rejects.toThrow(/mapy pól/);
  });
  it("każde pole ma unikatowy identyfikator, a warunki wskazują istniejącą opcję", () => {
    for (const def of Object.values(benefitsForms) as FormDef[]) {
      const fields = def.sections.flatMap(s => s.fields);
      expect(new Set(fields.map(f => f.id)).size).toBe(fields.length);
      for (const { showIf } of fields) if (showIf) expect(fields.find(f => f.id === showIf.field)?.options).toContain(showIf.equals);
    }
  });
});
