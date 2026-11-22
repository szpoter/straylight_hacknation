import type { OcrWord } from "@/lib/ocr/birth-certificate";

export type PageLine = { text: string; confidence: number; box: OcrWord["box"] };

// Both readers supply top-left normalized boxes. Group by physical baseline before finding columns.
export function pageLines(words: OcrWord[], width: number, height: number): PageLine[] {
  const ordered = [...words].sort((a, b) => a.box.y + a.box.h / 2 - b.box.y - b.box.h / 2);
  const rows: OcrWord[][] = [];
  for (const word of ordered) {
    const row = rows.at(-1);
    const first = row?.[0];
    if (row && first && Math.abs(word.box.y + word.box.h / 2 - first.box.y - first.box.h / 2) <= Math.max(word.box.h, first.box.h) * 0.55) row.push(word);
    else rows.push([word]);
  }
  return rows.map(row => {
    row.sort((a, b) => a.box.x - b.box.x);
    let text = "";
    let right = row[0].box.x;
    let top = 1, bottom = 0, confidence = 100;
    for (const word of row) {
      const { x, y, w, h } = word.box;
      if (text) text += (x - right) * width > h * height * 1.35 ? "\t" : " ";
      text += word.text;
      top = Math.min(top, y);
      bottom = Math.max(bottom, y + h);
      right = Math.max(right, x + w);
      confidence = Math.min(confidence, word.confidence);
    }
    return { text, confidence, box: { x: row[0].box.x, y: top, w: right - row[0].box.x, h: bottom - top } };
  });
}
