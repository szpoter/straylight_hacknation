import { MIN_CONFIDENCE } from "@/lib/ocr/birth-certificate";
import type { TesseractWord } from "@/lib/ocr/words";
import { documentDay } from "./case-claim-fields";
import type { PageLine } from "./case-page-layout";

const fold = (s: string) => s.normalize("NFD").replace(/\p{M}/gu, "").replace(/ł/giu, "l").toLowerCase();
const token = (s: string) => fold(s).replace(/[^a-z]/gu, "");

export function locateBirthCell(lines: PageLine[], words: readonly TesseractWord[], width: number, height: number) {
  const text = lines.map(l => fold(l.text));
  if (!text.some(l => /^[^a-z0-9]*(?:[a-z0-9][|\s]+)?odpis\s+(?:skrocony|zupelny)\s+aktu\s+urodzenia[^a-z0-9]*$/u.test(l))) return;
  const child = text.findIndex(l => /\bdane dziecka\b/u.test(l));
  const parents = text.findIndex(l => /\bdane rodzicow\b/u.test(l));
  const labels = text.flatMap((l, i) => {
    if (parents >= 0 && i >= parents) return [];
    const explicit = /\bdata urodzenia dziecka\b/u.test(l);
    const section = child >= 0 && i > child && i < parents;
    return explicit || (section && /\bdata urodzenia\b/u.test(l)) ? [i] : [];
  });
  if (labels.length !== 1) return;
  const index = labels[0], box = lines[index].box;
  if (box.w <= box.h) return;
  const row = words.filter(({ bbox }) => {
    const mid = (bbox.y0 + bbox.y1) / 2 / height;
    return mid >= box.y && mid <= box.y + box.h;
  }).sort((a, b) => a.bbox.x0 - b.bbox.x0);
  const start = row.findIndex((w, i) => token(w.text) === "data" && token(row[i + 1]?.text ?? "") === "urodzenia");
  if (start < 0) return;
  const end = token(row[start + 2]?.text ?? "") === "dziecka" ? start + 2 : start + 1;
  const label = row.slice(start, end + 1);
  if (!label.every(w => w.confidence >= MIN_CONFIDENCE) || row.slice(end + 1).some(w => token(w.text) === "data")) return;

  const y = Math.min(...label.map(w => w.bbox.y0));
  const h = Math.max(...label.map(w => w.bbox.y1)) - y;
  const left = Math.ceil(row[end].bbox.x1 + .15 * h * width / height);
  const top = Math.max(0, Math.floor(y - h / 4));
  const right = Math.floor(.97 * width), bottom = Math.min(height, Math.ceil(y + 1.25 * h));
  if (left >= right || top >= bottom || h <= 0) return;
  return { index, label: label.map(w => w.text).join(" "), labelLeft: row[start].bbox.x0,
    labelConfidence: Math.min(...label.map(w => w.confidence)), rectangle: { left, top, width: right - left, height: bottom - top } };
}

export function readBirthCellValue(words: readonly TesseractWord[]) {
  if (!words.length || !words.every(w => w.confidence >= MIN_CONFIDENCE)) return;
  const text = words.map(w => w.text).join(" ").trim();
  if (!/^(?:\d{4}-\d{2}-\d{2}|\d{1,2}([./-])\d{1,2}\1\d{4})$/u.test(text)) return;
  const date = documentDay(text);
  if (date) return { text, date, confidence: Math.min(...words.map(w => w.confidence)) };
}
