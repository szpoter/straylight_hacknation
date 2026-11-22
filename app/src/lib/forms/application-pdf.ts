import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";

/**
 * Wniosek z „Dokumentów” jako PDF do pobrania i samodzielnego wysłania (np. e-mailem do kadr).
 * Układ wzorcowy, nie urzędowy druk: tytuł, adresat, sekcje „etykieta → wartość” jak na ekranie
 * „Sprawdź odpowiedzi”, miejsce na podpis i stopka z uwagą o wierności drukowi. Czysta funkcja
 * na bajtach czcionek, więc działa i w przeglądarce, i w testach.
 */

export type ApplicationRow = { label: string; value: string };
export type ApplicationSection = { title: string; rows: ApplicationRow[] };

export type ApplicationDoc = {
  title: string;
  /** Adresat w nagłówku, np. nazwa pracodawcy albo „Urząd stanu cywilnego”. */
  addressee?: string;
  /** Data przygotowania, gotowa do druku. */
  date: string;
  /** Oznaczenia przy nagłówku, np. „SZKIC”, „KOREKTA”. */
  marks: string[];
  sections: ApplicationSection[];
  /** Stopka na każdej stronie. */
  note: string;
};

export type ApplicationFonts = { regular: Uint8Array; bold: Uint8Array };

const PAGE: [number, number] = [595.28, 841.89];
const LEFT = 56;
const RIGHT = 539;
const TOP = 786;
const BOTTOM = 84;
const LABEL_WIDTH = 190;
const VALUE_X = LEFT + LABEL_WIDTH + 16;

const INK = rgb(0.1, 0.12, 0.14);
const MUTED = rgb(0.36, 0.39, 0.42);
const RULE = rgb(0.8, 0.82, 0.84);

/**
 * Znaki spoza czcionki (np. emoji) zamieniamy na „?”, a znaki sterujące na spacje, żeby PDF
 * zawsze dał się złożyć. Nowe wiersze zostają — łamie je `wrap`.
 */
function printable(text: string, charset: Set<number>): string {
  let out = "";
  for (const ch of text.replace(/\r\n?/g, "\n")) {
    const code = ch.codePointAt(0)!;
    out += ch === "\n" ? ch : code < 32 ? " " : charset.has(code) ? ch : "?";
  }
  return out;
}

/** Najwyżej `max` wierszy; ucięty tekst kończy się „…”. */
function clamp(lines: string[], max: number): string[] {
  if (lines.length <= max) return lines;
  return [...lines.slice(0, max - 1), `${lines[max - 1]} …`];
}

/** Krótki wiersz nie dzieli się między strony; wysoki zaczyna się tam, gdzie zmieszczą się 3 linie. */
const KEEP_TOGETHER = 120;

/** Łamanie na słowach; słowo dłuższe niż wiersz łamiemy na znakach. Puste wiersze zostają. */
export function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\r?\n/)) {
    let line = "";
    for (const word of paragraph.split(" ").filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= width) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      line = "";
      for (const ch of word) {
        if (line && font.widthOfTextAtSize(line + ch, size) > width) {
          lines.push(line);
          line = "";
        }
        line += ch;
      }
    }
    lines.push(line);
  }
  return lines;
}

export async function buildApplicationPdf(doc: ApplicationDoc, fonts: ApplicationFonts): Promise<Uint8Array> {
  const pdf = await PDFDocument.create({ updateMetadata: false });
  pdf.setTitle(doc.title);
  pdf.setCreator("Zusik");
  pdf.registerFontkit(fontkit);
  const regular = await pdf.embedFont(fonts.regular, { subset: true });
  const bold = await pdf.embedFont(fonts.bold, { subset: true });
  const charsets = new Map<PDFFont, Set<number>>([
    [regular, new Set(regular.getCharacterSet())],
    [bold, new Set(bold.getCharacterSet())],
  ]);
  const text = (value: string, font: PDFFont) => printable(value, charsets.get(font)!);

  let page: PDFPage = pdf.addPage(PAGE);
  let y = TOP;
  const newPage = () => {
    page = pdf.addPage(PAGE);
    y = TOP;
  };
  /** Nowa strona, jeśli blok o tej wysokości się nie zmieści. */
  const ensure = (height: number) => {
    if (y - height < BOTTOM) newPage();
  };
  const lines = (value: string, font: PDFFont, size: number, x: number, lineHeight: number, color = INK) => {
    for (const line of wrap(text(value, font), font, size, RIGHT - x)) {
      page.drawText(line, { x, y, size, font, color });
      y -= lineHeight;
    }
  };

  // Nagłówek: oznaczenie wersji demonstracyjnej, data, adresat, tytuł.
  const head = ["ZUSIK · WERSJA DEMONSTRACYJNA", ...doc.marks].join("  ·  ");
  page.drawText(text(head, bold), { x: LEFT, y, size: 8, font: bold, color: MUTED });
  const date = text(doc.date, regular);
  page.drawText(date, { x: RIGHT - regular.widthOfTextAtSize(date, 10), y: y - 1, size: 10, font: regular, color: INK });
  y -= 12;
  page.drawLine({ start: { x: LEFT, y }, end: { x: RIGHT, y }, thickness: 0.6, color: MUTED });
  y -= 30;
  if (doc.addressee) {
    const width = 220;
    page.drawText("Adresat", { x: RIGHT - width, y, size: 8, font: regular, color: MUTED });
    y -= 14;
    for (const line of clamp(wrap(text(doc.addressee, bold), bold, 11, width), 4)) {
      page.drawText(line, { x: RIGHT - width, y, size: 11, font: bold, color: INK });
      y -= 15;
    }
    y -= 18;
  }
  lines(doc.title, bold, 18, LEFT, 23);
  y -= 10;

  for (const section of doc.sections) {
    if (section.rows.length === 0) continue;
    // Tytuł sekcji nie zostaje sam na dole strony.
    ensure(22 + 30);
    y -= 8;
    page.drawText(text(section.title, bold), { x: LEFT, y, size: 12, font: bold, color: INK });
    y -= 10;
    page.drawLine({ start: { x: LEFT, y }, end: { x: RIGHT, y }, thickness: 0.8, color: INK });
    y -= 16;
    for (const row of section.rows) {
      const label = wrap(text(row.label, regular), regular, 9.5, LABEL_WIDTH);
      const value = wrap(text(row.value, regular), regular, 10.5, RIGHT - VALUE_X);
      const height = Math.max(label.length * 13, value.length * 14);
      ensure((height <= KEEP_TOGETHER ? height : Math.max(label.length * 13, 3 * 14)) + 10);
      const rowPage = page;
      let ly = y;
      for (const line of label) {
        page.drawText(line, { x: LEFT, y: ly, size: 9.5, font: regular, color: MUTED });
        ly -= 13;
      }
      // Bardzo długa wartość (np. adres) może przejść na kolejną stronę.
      for (const line of value) {
        if (y < BOTTOM) newPage();
        page.drawText(line, { x: VALUE_X, y, size: 10.5, font: regular, color: INK });
        y -= 14;
      }
      y = (page === rowPage ? Math.min(y, ly) : y) - 2;
      page.drawLine({ start: { x: LEFT, y: y + 8 }, end: { x: RIGHT, y: y + 8 }, thickness: 0.4, color: RULE });
      y -= 8;
    }
    y -= 10;
  }

  // Miejsce na podpis.
  ensure(70);
  y -= 40;
  page.drawLine({ start: { x: RIGHT - 200, y }, end: { x: RIGHT, y }, thickness: 0.6, color: MUTED });
  const sign = "podpis wnioskodawcy";
  page.drawText(sign, { x: RIGHT - 100 - regular.widthOfTextAtSize(sign, 8) / 2, y: y - 11, size: 8, font: regular, color: MUTED });

  // Stopka i numer strony na każdej stronie.
  const pages = pdf.getPages();
  const note = wrap(text(doc.note, regular), regular, 8, RIGHT - LEFT - 70);
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: LEFT, y: 66 }, end: { x: RIGHT, y: 66 }, thickness: 0.6, color: MUTED });
    note.slice(0, 3).forEach((line, n) => p.drawText(line, { x: LEFT, y: 54 - n * 10, size: 8, font: regular, color: MUTED }));
    const number = `Strona ${i + 1} z ${pages.length}`;
    p.drawText(number, { x: RIGHT - regular.widthOfTextAtSize(number, 8), y: 54, size: 8, font: regular, color: MUTED });
  });

  return pdf.save();
}
