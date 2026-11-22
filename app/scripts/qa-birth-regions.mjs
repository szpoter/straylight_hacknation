// Browser experiment only. Independent dates and boxes are available exclusively to the caller.
import { pdfjs, createPolishOcrWorker } from "../src/features/kamil/read-document";
import { locateBirthCell, readBirthCellValue } from "../src/features/chat/case-birth-cell";
import { documentDay } from "../src/features/chat/case-claim-fields";
import { containsRegistryBirthTitle, containsDecision } from "../src/features/chat/case-evidence";
import { MIN_CONFIDENCE } from "../src/lib/ocr/birth-certificate";

const fold = s => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replaceAll("ł", "l");
const label = /\bdata(?: i miejsce)? urodzenia(?: dziecka)?\b/u;
const wordsOf = data => data.words ?? data.blocks?.flatMap(b => b.paragraphs.flatMap(p => p.lines.flatMap(l => l.words))) ?? [];
const strong = word => word.confidence >= MIN_CONFIDENCE;

function region(box, canvas, left, right) {
  const top = Math.max(0, Math.floor((box.y - box.h / 4) * canvas.height));
  const bottom = Math.min(canvas.height, Math.ceil((box.y + 1.25 * box.h) * canvas.height));
  return { left, top, width: right - left, height: bottom - top };
}

export async function measureBirthRegions(bytes, pageNumber, page) {
  const result = {};
  if (page.status === "excluded" || !containsRegistryBirthTitle(page.text)) return result;
  const lines = page.lines ?? [];
  const child = lines.findIndex(l => /\bdane dziecka\b/u.test(fold(l.text)));
  const parents = lines.findIndex((l, i) => i > child && /\bdane rodzicow\b/u.test(fold(l.text)));
  const markers = lines.flatMap((l, i) => label.test(fold(l.text)) ? [i] : []);
  const guarded = markers.filter(i => /\bdata urodzenia dziecka\b/u.test(fold(lines[i].text)) || child >= 0 && i > child && i < parents);
  const chosen = guarded.length === 1 ? guarded : markers;
  if (chosen.length !== 1) return result;
  result.guarded = guarded.length === 1;
  const box = lines[chosen[0]].box;
  if (box.w <= box.h) return result;

  const lib = await pdfjs();
  const task = lib.getDocument({ data: bytes.slice(), isEvalSupported: false, maxImageSize: 16_000_000, verbosity: 0 });
  const canvas = document.createElement("canvas");
  let worker;
  try {
    const pdfPage = await (await task.promise).getPage(pageNumber);
    const base = pdfPage.getViewport({ scale: 1 });
    const scale = Math.min(300 / 72, 3508 / Math.max(base.width, base.height), Math.sqrt(9_000_000 / (base.width * base.height)));
    const view = pdfPage.getViewport({ scale });
    canvas.width = Math.ceil(view.width);
    canvas.height = Math.ceil(view.height);
    await pdfPage.render({ canvasContext: canvas.getContext("2d"), viewport: view }).promise;
    worker = await createPolishOcrWorker();

    // Reread word boxes locally, so the experiment needs no hook in the product reader.
    const full = (await worker.recognize(canvas, { rotateAuto: true }, { blocks: true })).data;
    if (containsDecision(full.text)) return {};
    const cell = locateBirthCell(lines, wordsOf(full), canvas.width, canvas.height);
    await worker.setParameters({ tessedit_pageseg_mode: "7" });
    const row = (await worker.recognize(canvas, { rectangle: region(box, canvas, 0, canvas.width) }, { blocks: true })).data;
    if (containsDecision(row.text)) return {};
    const safeRow = fold(wordsOf(row).map(w => strong(w) ? w.text : "�").join(" "));
    const paired = /\bdata(?: i miejsce)? urodzenia(?: dziecka)?[\s:|–.—-]+(\d{1,2}[./-]\d{1,2}[./-]\d{4}|\d{4}-\d{2}-\d{2})\b/u.exec(safeRow);
    result.rowTried = true;
    if (paired && [...safeRow.matchAll(/\d{1,2}[./-]\d{1,2}[./-]\d{4}|\d{4}-\d{2}-\d{2}/gu)].length === 1) result.rowDate = documentDay(paired[1]);
    if (!cell) return result;
    const rect = cell.rectangle;
    await worker.setParameters({ tessedit_char_whitelist: "0123456789./-" });
    const recognized = (await worker.recognize(canvas, { rectangle: rect, rotateRadians: full.rotateRadians }, { blocks: true })).data;
    const words = wordsOf(recognized);
    result.cellTried = true;
    result.labelStrong = true;
    result.cellDigits = words.some(w => /\d/u.test(w.text));
    result.cellDate = readBirthCellValue(words)?.date;
    result.cellBox = { x: rect.left / canvas.width, y: rect.top / canvas.height, w: rect.width / canvas.width, h: rect.height / canvas.height };
    return result;
  } finally {
    try { if (worker) await worker.terminate(); } finally { await task.destroy(); canvas.width = canvas.height = 0; }
  }
}
