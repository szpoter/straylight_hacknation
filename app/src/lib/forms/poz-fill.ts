import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, type PDFPage } from "pdf-lib";
import { formatShort } from "../rules/dates";
import { POZ_CHOICES, POZ_MAP, POZ_SHA256, POZ_TEMPLATE } from "./poz-map";
import { sha256Hex } from "./zam-fill";
import type { ApplicationFonts } from "./application-pdf";

export async function buildPoz(values: Record<string, string>, date: string, fonts: ApplicationFonts) {
  const layout = POZ_MAP[values.medyk as keyof typeof POZ_MAP];
  if (!layout) throw new Error("Wybierz rodzaj deklaracji POZ.");
  const response = await fetch(POZ_TEMPLATE);
  if (!response.ok) throw new Error("Nie udało się pobrać wzoru deklaracji POZ.");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (await sha256Hex(bytes) !== POZ_SHA256) throw new Error("Wzór deklaracji POZ zmienił się. Sprawdź mapę pól.");

  const official = await PDFDocument.load(bytes);
  const pdf = await PDFDocument.create();
  const pages = await pdf.copyPages(official, [layout.page - 1, layout.page, layout.page + 1]);
  pages.forEach(p => pdf.addPage(p));
  pdf.setTitle(`Deklaracja wyboru · ${values.medyk}`);
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(fonts.regular, { subset: true });
  const write = (page: PDFPage, raw: string | undefined, x: number, y: number, width: number, size = 10) => {
    const text = raw?.replace(/\s+/g, " ").trim();
    if (!text) return;
    const fitted = Math.min(size, size * width / font.widthOfTextAtSize(text, size));
    if (fitted < 6) throw new Error(`Wartość „${text.slice(0, 25)}…” jest zbyt długa, aby zmieścić ją na druku POZ.`);
    page.drawText(text, { x, y, font, size: fitted });
  };
  const patient = (value: string, x: number, y: number, width: number) => write(pages[0], value, x + layout.dx, y + layout.dy, width);
  patient(values.imie, 81, 568, 211);
  patient(values.nazwisko, 303, 568, 211);
  const [year, month, day] = values.data_urodzenia.split("-");
  patient(day, 105, 513, 14);
  patient(month, 128, 513, 14);
  patient(year, 151, 513, 30);
  const identifier = values.identyfikator === "PESEL" ? values.dziecko_pesel.replace(/[\s-]/g, "") : values.dokument.replace(/\s/g, "");
  if (identifier.length <= 11) {
    Array.from(identifier).forEach((c, i) => patient(c, 217 + i * 28.6, 509, 16));
  } else {
    // Dłuższy numer dokumentu wpisujemy w dwóch wierszach, po jednym znaku w kratce.
    if (identifier.length > 22) throw new Error("Numer dokumentu jest zbyt długi dla druku POZ.");
    Array.from(identifier).forEach((c, i) => patient(c, 217 + i % 11 * 28.6, i < 11 ? 516 : 502, 16));
  }
  const address = (prefix: string, y: number) => {
    patient(values[prefix + "_ulica"], 85, y, 159);
    patient(values[prefix + "_dom"], 254, y, 82);
    patient(values[prefix + "_miasto"], 345, y, 171);
  };
  address("dziecko", 440);
  const phone = values.telefon?.replace(/[\s()-]/g, "") ?? "";
  Array.from(phone).forEach((c, i) => patient(c, 215 + i * 24, 414, 15));
  patient(values.email, 274, 391, 240);
  patient(values.opiekun_imie, 85, 307, 77);
  patient(values.opiekun_nazwisko, 171, 307, 164);
  patient(values.opiekun_telefon, 345, 307, 170);
  address("opiekun", 228);
  if (values.drugi_opiekun === "Tak") {
    patient(values.drugi_imie, 85, 151, 77);
    patient(values.drugi_nazwisko, 171, 151, 164);
    patient(values.drugi_telefon, 345, 151, 170);
    address("drugi", 69);
  }

  const provider = (value: string, x: number, y: number, width: number) => write(pages[1], value, x + layout.dx, y, width);
  provider(values.przychodnia, 202, 691, 307);
  provider(values.adres_przychodni, 202, 664, 307);
  provider(values.lekarz, 191, layout.medicNameY, 319);
  const markChoice = (key: string, y: number, reasonY: number) => {
    const choice = POZ_CHOICES.indexOf(values[key]);
    if (choice < 0) throw new Error("Zaznacz, który to wybór w bieżącym roku.");
    const mark = (x: number, baseline: number) => write(pages[1], "X", x + layout.dx, baseline, 8, 8);
    mark(choice === 0 ? 87 : 304, y);
    if (!choice) return;
    if (choice === 4) {
      mark(87, reasonY - 26.4);
      return;
    }
    mark(87, y - 46.8);
    mark(104, choice === 3 ? reasonY : y - (choice === 1 ? 73.1 : 86.3));
    if (choice === 3) provider(values[key + "_opis"], 123, reasonY - 10, 380);
  };
  markChoice("wybor_przychodni", layout.providerY, layout.providerReasonY);
  markChoice("wybor_medyka", layout.medicY, layout.medicReasonY);
  provider(formatShort(date), 109, layout.dateY, 85);
  return pdf.save();
}
