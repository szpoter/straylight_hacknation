import type { OcrWord } from "./birth-certificate";

/** Minimal shape of a PDF.js text item (pdfjs-dist TextItem). */
export interface PdfTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

/**
 * PDF text layer → words with boxes. PDF.js gives runs of text in PDF points (origin bottom-left);
 * each run is split into words with an even advance per character.
 */
export function wordsFromPdfItems(items: PdfTextItem[], page: number, pageWidth: number, pageHeight: number): OcrWord[] {
  const words: OcrWord[] = [];
  for (const item of items) {
    if (!item.str.trim()) continue;
    const [, , , d, e, f] = item.transform;
    const size = item.height || Math.abs(d) || 10;
    const perChar = item.str.length ? item.width / item.str.length : 0;
    const re = /\S+/g;
    let match: RegExpExecArray | null;
    while ((match = re.exec(item.str))) {
      const x = e + match.index * perChar;
      const w = match[0].length * perChar;
      const top = pageHeight - f - size * 0.8;
      words.push({
        text: match[0],
        page,
        box: clampBox({ x: x / pageWidth, y: top / pageHeight, w: w / pageWidth, h: (size * 1.05) / pageHeight }),
        confidence: 100,
      });
    }
  }
  return words;
}

/** Minimal shape of a Tesseract.js word. */
export interface TesseractWord {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

export function wordsFromTesseract(words: TesseractWord[], page: number, imageWidth: number, imageHeight: number): OcrWord[] {
  return words
    .filter((w) => w.text.trim())
    .map((w) => ({
      text: w.text.trim(),
      page,
      box: clampBox({
        x: w.bbox.x0 / imageWidth,
        y: w.bbox.y0 / imageHeight,
        w: (w.bbox.x1 - w.bbox.x0) / imageWidth,
        h: (w.bbox.y1 - w.bbox.y0) / imageHeight,
      }),
      confidence: w.confidence,
    }));
}

function clampBox(b: { x: number; y: number; w: number; h: number }) {
  const x = Math.min(1, Math.max(0, b.x));
  const y = Math.min(1, Math.max(0, b.y));
  return { x, y, w: Math.min(1 - x, Math.max(0, b.w)), h: Math.min(1 - y, Math.max(0, b.h)) };
}
