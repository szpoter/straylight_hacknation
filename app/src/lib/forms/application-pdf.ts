import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export type ApplicationDoc = {
  title: string;
  sender: string;
  addressee: string;
  date: string;
  marks: string[];
  paragraphs: string[];
};

export type ApplicationFonts = { regular: Uint8Array; bold: Uint8Array };

const PAGE: [number, number] = [595.28, 841.89];
const LEFT = 56;
const RIGHT = 539;
const TOP = 786;
const BOTTOM = 84;

const INK = rgb(0.1, 0.12, 0.14);
const MUTED = rgb(0.36, 0.39, 0.42);

/**
 * Znaki spoza czcionki (np. emoji) zamieniamy na „?”, a znaki sterujące na spacje, żeby PDF
 * zawsze dał się złożyć. Nowe wiersze zostają — łamie je `wrap`.
 */
function printable(text: string, charset: Set<number>): string {
  let out = "";
  for (const ch of text.replace(/\r\n?/g, "\n")) {
    const code = ch.codePointAt(0) ?? 0;
    out += ch === "\n" ? ch : code < 32 ? " " : charset.has(code) ? ch : "?";
  }
  return out;
}

/** Łamanie na słowach; słowo dłuższe niż wiersz łamiemy na znakach. Puste wiersze zostają. */
function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
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
  const regularCharset = new Set(regular.getCharacterSet());
  const boldCharset = new Set(bold.getCharacterSet());
  let page: PDFPage = pdf.addPage(PAGE);
  let y = TOP;
  const ensure = (height: number) => {
    if (y - height >= BOTTOM) return;
    page = pdf.addPage(PAGE);
    y = TOP;
  };
  const block = (value: string, font: PDFFont, size: number, x = LEFT, alignRight = false) => {
    const clean = printable(value, font === bold ? boldCharset : regularCharset);
    for (const line of wrap(clean, font, size, RIGHT - x)) {
      ensure(size + 5);
      const left = alignRight ? RIGHT - font.widthOfTextAtSize(line, size) : x;
      page.drawText(line, { x: left, y, size, font, color: INK });
      y -= size + 5;
    }
    y -= 9;
  };

  block(doc.date, regular, 10, LEFT, true);
  block(doc.sender, regular, 11);
  block(doc.addressee, bold, 11, 295);
  block(doc.title, bold, 17);
  for (const paragraph of doc.paragraphs) {
    if (paragraph.trim()) block(paragraph, regular, 11);
  }

  // Miejsce na podpis.
  ensure(70);
  y -= 40;
  page.drawLine({ start: { x: RIGHT - 200, y }, end: { x: RIGHT, y }, thickness: 0.6, color: MUTED });
  const sign = "podpis wnioskodawcy";
  page.drawText(sign, { x: RIGHT - 100 - regular.widthOfTextAtSize(sign, 8) / 2, y: y - 11, size: 8, font: regular, color: MUTED });

  const pages = pdf.getPages();
  const footer = ["Wersja demonstracyjna Zusika", ...doc.marks].join("  ·  ");
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: LEFT, y: 66 }, end: { x: RIGHT, y: 66 }, thickness: 0.6, color: MUTED });
    p.drawText(footer, { x: LEFT, y: 54, size: 8, font: regular, color: MUTED });
    const number = `Strona ${i + 1} z ${pages.length}`;
    p.drawText(number, { x: RIGHT - regular.widthOfTextAtSize(number, 8), y: 54, size: 8, font: regular, color: MUTED });
  });

  return pdf.save();
}
