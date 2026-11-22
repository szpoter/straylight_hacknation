"use client";

import { createPolishOcrWorker, loadImage, pdfjs } from "@/features/kamil/read-document";
import { MIN_CONFIDENCE } from "@/lib/ocr/birth-certificate";
import { wordsFromPdfItems, wordsFromTesseract } from "@/lib/ocr/words";
import { analyzeCasePage, containsDecision, containsRegistryBirthTitle, preserveWrittenLeave, type LocalCasePage, type LocalCaseDocument, type LocalLocator } from "./case-evidence";
import { locateBirthCell, readBirthCellValue } from "./case-birth-cell";
import { checkScanDimensions } from "./case-image-size";
import { openCaseProgress } from "./case-read-progress";
import { pageLines, type PageLine } from "./case-page-layout";

type Progress = (label: string) => void;
type ReadOptions = { caseId: string; signal: AbortSignal; onProgress: Progress; onPage?: (page: LocalCasePage, total: number) => void };
type BirthCell = NonNullable<ReturnType<typeof locateBirthCell>> & { angle: number };
type PageRead = { birthCell?: BirthCell; text: string; method: LocalCasePage["method"]; lines?: PageLine[]; confidence?: number; blank?: boolean; protectedDecision?: boolean; highConfidenceText?: () => string };
type PdfPage = import("pdfjs-dist/types/src/display/api").PDFPageProxy;
type Worker = Awaited<ReturnType<typeof createPolishOcrWorker>>;

// A4 at 300 dpi preserves small printed digits. Bound square scans and unusually long PDF pages too.
function scanScale(width: number, height: number, maxScale: number) {
  return Math.min(maxScale, 3508 / Math.max(width, height), Math.sqrt(9_000_000 / (width * height)));
}

async function readBytes(file: File) {
  if (!file.size || file.size > 20 * 1024 * 1024) throw new Error("Wybierz PDF lub skan o wielkości do 20 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const isPdf = new TextDecoder().decode(bytes.subarray(0, 1024)).includes("%PDF-");
  const isPng = [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b);
  const isJpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (!(isPdf || isPng || isJpeg)) throw new Error("Ten plik nie zawiera PDF ani skanu PNG/JPEG.");
  const type = isPng ? "image/png" : isJpeg ? "image/jpeg" : "application/pdf";
  if (type !== "application/pdf") checkScanDimensions(bytes, type);
  return { bytes, type } as const;
}

function canvasFor(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.ceil(width));
  canvas.height = Math.max(1, Math.ceil(height));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Przeglądarka nie może odczytać skanu.");
  return { canvas, ctx };
}

function isBlank(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
  const rgba = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  for (let i = 0; i < rgba.length; i += 4) {
    if (rgba[i + 3] && (rgba[i] !== 255 || rgba[i + 1] !== 255 || rgba[i + 2] !== 255)) return false;
  }
  return true;
}

async function abortable<T>(work: Promise<T>, signal: AbortSignal) {
  signal.throwIfAborted();
  let abort: () => void = () => {};
  try {
    return await Promise.race([work, new Promise<never>((_, reject) => {
      abort = () => reject(signal.reason);
      signal.addEventListener("abort", abort, { once: true });
    })]);
  } finally {
    signal.removeEventListener("abort", abort);
  }
}

// Ink projections distinguish sideways text, but cannot tell left from right.
function retryRotation(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const { width, height } = canvas;
  const { data } = ctx.getImageData(0, 0, width, height);
  const rows = new Float64Array(height), cols = new Float64Array(width);
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * 4;
      const ink = (255 - data[i]) * data[i + 3];
      rows[y] += ink;
      cols[x] += ink;
    }
  }
  const horizontal = rows.reduce((sum, v) => sum + v * v, 0) / width;
  const vertical = cols.reduce((sum, v) => sum + v * v, 0) / height;
  return horizontal >= vertical ? [180] : [-90, 90];
}

async function runOcr(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, signal: AbortSignal, getWorker: () => Promise<Worker>, originalOrientation = false): Promise<PageRead> {
  signal.throwIfAborted();
  if (isBlank(ctx, canvas)) return { method: "ocr", text: "", blank: true };
  const worker = await getWorker();
  signal.throwIfAborted();
  const recognize = (image: HTMLCanvasElement) => abortable(worker.recognize(image, { rotateAuto: true }, { blocks: true }), signal);
  let { data } = await recognize(canvas);
  let protectedDecision = containsDecision(data.text);
  let rotation = 0;
  let width = canvas.width, height = canvas.height;
  const angles = data.confidence < MIN_CONFIDENCE ? retryRotation(canvas, ctx) : [];
  for (const angle of originalOrientation ? angles.slice(0, 1) : angles) {
    const sideways = Math.abs(angle) === 90;
    const retry = canvasFor(sideways ? canvas.height : canvas.width, sideways ? canvas.width : canvas.height);
    try {
      retry.ctx.translate(retry.canvas.width / 2, retry.canvas.height / 2);
      retry.ctx.rotate(angle * Math.PI / 180);
      retry.ctx.drawImage(canvas, -canvas.width / 2, -canvas.height / 2);
      const rotated = await recognize(retry.canvas);
      protectedDecision ||= containsDecision(rotated.data.text);
      if (rotated.data.confidence > data.confidence) {
        data = rotated.data;
        rotation = angle;
        width = retry.canvas.width; height = retry.canvas.height;
      }
    } finally { retry.canvas.width = retry.canvas.height = 0; }
    if (data.confidence >= MIN_CONFIDENCE) break;
  }
  const words = data.words ?? data.blocks?.flatMap(b => b.paragraphs.flatMap(p => p.lines.flatMap(l => l.words))) ?? [];
  const positioned = wordsFromTesseract(words, 1, width, height);
  const lines = pageLines(positioned, width, height);
  for (const line of lines) {
    const { x, y, w, h } = line.box;
    if (rotation === 180) line.box = { x: 1 - x - w, y: 1 - y - h, w, h };
    if (rotation === 90) line.box = { x: y, y: 1 - x - w, w: h, h: w };
    if (rotation === -90) line.box = { x: 1 - y - h, y: x, w: h, h: w };
  }
  const text = lines.length ? lines.map(l => l.text).join("\n") : data.text.trim();
  const cell = rotation === 0 && !protectedDecision && containsRegistryBirthTitle(text) ? locateBirthCell(lines, words, width, height) : undefined;
  return { method: "ocr", text, confidence: data.confidence, lines, protectedDecision,
    birthCell: cell && { ...cell, angle: data.rotateRadians || 0 },
    highConfidenceText: () => pageLines(positioned.map(word => word.confidence >= MIN_CONFIDENCE ? word : { ...word, text: "�" }),
      width, height).map(line => line.text).join("\n") };

}

async function readPage(page: PdfPage, lib: Awaited<ReturnType<typeof pdfjs>>, signal: AbortSignal, progress: Progress, total: number,
  getWorker: () => Promise<Worker>, assess: (input: PageRead, previous?: LocalCasePage) => LocalCasePage, clientDocumentId: string): Promise<LocalCasePage> {
  const { items } = await page.getTextContent();
  const runs = items.filter(item => "str" in item);
  const raw = runs.map(item => item.str + (item.hasEOL ? "\n" : " ")).join("").trim();
  const base = page.getViewport({ scale: 1 });
  if ((raw.match(/[\p{L}\d]/gu)?.length ?? 0) >= 24 && !page.rotate) {
    const operations = await page.getOperatorList();
    const imageOps = [lib.OPS.paintImageXObject, lib.OPS.paintInlineImageXObject, lib.OPS.paintImageMaskXObject,
      lib.OPS.paintImageXObjectRepeat, lib.OPS.paintInlineImageXObjectGroup, lib.OPS.paintImageMaskXObjectGroup, lib.OPS.paintImageMaskXObjectRepeat];
    if (!operations.fnArray.some(op => imageOps.includes(op))) {
      const lines = pageLines(wordsFromPdfItems(runs, page.pageNumber, base.width, base.height), base.width, base.height, true);
      return assess({ method: "pdf_text", text: lines.length ? lines.map(l => l.text).join("\n") : raw, lines, confidence: 100, protectedDecision: containsDecision(raw) });
    }
  }
  signal.throwIfAborted();
  progress(`Rozpoznaję skan strony ${page.pageNumber} z ${total}…`);
  async function rendered<T>(scale: number, inspect: (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => Promise<T>) {
    const view = page.getViewport({ scale });
    const { canvas, ctx } = canvasFor(view.width, view.height);
    try {
      await page.render({ canvasContext: ctx, viewport: view }).promise;
      return await inspect(canvas, ctx);
    } finally { canvas.width = canvas.height = 0; }
  }
  let cell: BirthCell | undefined;
  function atScale(scale: number, original: boolean) {
    return rendered(scale, async (canvas, ctx) => {
      const result = await runOcr(canvas, ctx, signal, getWorker, original);
      if (!original) cell = result.birthCell;
      if (!result.text && raw) { result.text = raw; result.confidence = 0; result.blank = false; }
      result.protectedDecision ||= containsDecision(raw) || containsDecision(result.text);
      return result;
    });
  }
  const scale = scanScale(base.width, base.height, 300 / 72);
  const originalScale = 1800 / Math.max(base.width, base.height);
  const originalInput = await atScale(originalScale, true).catch((): PageRead => {
    signal.throwIfAborted();
    return { method: "manual", text: "" };
  });
  const original = assess(originalInput);
  if (originalInput.protectedDecision) return original;
  const detailedInput = await atScale(scale, false);
  // A complete, independently identified application starts a new document after a decision.
  const first = assess(detailedInput, original.leaveRequests?.length ? original : undefined);
  if (first.status === "excluded" || original.leaveRequests?.length) return preserveWrittenLeave(original, first);
  if (scale <= originalScale || (first.role !== "certificate" && first.role !== "other") || first.candidates.length ||
      !containsRegistryBirthTitle(first.text)) return first;
  try {
    if (original.role === "certificate" && original.lines?.length && original.candidates.length === 1 && original.candidates[0].field === "birthDate") return original;
    if (!cell || !first.lines || original.candidates.length || (original.role !== "certificate" && original.role !== "other")) return first;
    const source = cell;
    const worker = await getWorker();
    const options = { rectangle: source.rectangle, rotateRadians: source.angle, tessedit_char_whitelist: "0123456789./-", tessedit_pageseg_mode: "7" };
    const { data } = await rendered(scale, canvas => abortable(worker.recognize(canvas, options, { blocks: true }), signal));
    if (containsDecision(data.text)) return assess({ method: "ocr", text: first.text, lines: first.lines, protectedDecision: true });
    const words = data.words ?? data.blocks?.flatMap(b => b.paragraphs.flatMap(p => p.lines.flatMap(l => l.words))) ?? [];
    const value = readBirthCellValue(words);
    if (!value) return first;
    const row = first.lines[source.index];
    row.text = source.label + "\t" + value.text;
    row.confidence = Math.min(source.labelConfidence, value.confidence);
    const view = page.getViewport({ scale });
    const w = Math.ceil(view.width), h = Math.ceil(view.height);
    // Enclose label and cell in the original scan, including displacement from automatic deskew.
    const pad = Math.sin(Math.abs(source.angle)) * Math.hypot(w, h) / 2;
    const x = Math.max(0, Math.min(source.labelLeft, source.rectangle.left) - pad), y = Math.max(0, source.rectangle.top - pad);
    const right = Math.min(w, source.rectangle.left + source.rectangle.width + pad);
    const bottom = Math.min(h, source.rectangle.top + source.rectangle.height + pad);
    row.box = { x: x / w, y: y / h, w: (right - x) / w, h: (bottom - y) / h };
    first.kind = first.role = "certificate";
    first.status = "read";
    first.reason = "ambiguous_field";
    first.text = first.lines.map(line => line.text).join("\n");
    first.candidates = [{ field: "birthDate", value: { kind: "date", date: value.date },
      locator: { clientDocumentId, page: first.page, lineStart: source.index + 1, lineEnd: source.index + 1 } }];
  } catch { signal.throwIfAborted(); }
  return first;
}

async function read(file: File, options: ReadOptions, pdfOnly = false, existing: readonly LocalCaseDocument[] = []): Promise<LocalCaseDocument> {
  const { caseId, signal, onProgress } = options;
  if (!caseId.trim()) throw new Error("Wybierz aktywną sprawę.");
  signal.throwIfAborted();
  const { bytes, type } = await readBytes(file);
  if (pdfOnly && type !== "application/pdf") throw new Error("Wybierz dokument PDF.");
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  const scoped = await crypto.subtle.digest("SHA-256", await new Blob([caseId, digest]).arrayBuffer());
  const clientDocumentId = Array.from(new Uint8Array(scoped), b => b.toString(16).padStart(2, "0")).join("");
  const duplicate = existing.find(d => d.metadata.clientDocumentId === clientDocumentId);
  if (duplicate) return duplicate;
  const pages: LocalCasePage[] = [];
  let checkpoint: Awaited<ReturnType<typeof openCaseProgress>> | undefined;
  let storageUnavailable = false;
  const disableCheckpoint = () => {
    checkpoint?.close();
    checkpoint = undefined;
    storageUnavailable = true;
    onProgress("Praca bez zapisu postępu. Po odświeżeniu wybierz plik ponownie.");
  };
  let worker: Promise<Worker> | undefined;
  const getWorker = () => worker ??= createPolishOcrWorker();
  function assess(input: PageRead, previous = pages.at(-1)) {
    signal.throwIfAborted();
    const page = analyzeCasePage(clientDocumentId, pages.length + 1, input.text, input.method, previous, input.confidence, input.lines);
    if (input.protectedDecision) {
      page.kind = page.role = "decision";
      page.status = "excluded";
      page.reason = "decision";
      page.candidates = [];
      delete page.leaveRequests;
    } else if (input.blank) { page.status = "blank"; page.reason = undefined; }
    const lines = input.lines;
    if (lines?.length) {
      page.lines = lines;
      const reliable = (c: { locator: LocalLocator }) =>
        lines.slice(c.locator.lineStart - 1, c.locator.lineEnd).every(line => line.confidence >= MIN_CONFIDENCE);
      const candidates = page.candidates.filter(reliable);
      if (candidates.length < page.candidates.length) page.reason = "ambiguous_field";
      page.candidates = candidates;
      const leaves = page.leaveRequests;
      if (leaves?.some(leave => !reliable(leave))) {
        // A weak word elsewhere in a letter must not invalidate a legible request and its dates.
        const masked = input.highConfidenceText?.() ?? "";
        const confirmed = analyzeCasePage(clientDocumentId, page.page, masked, page.method, previous, input.confidence).leaveRequests ?? [];
        page.leaveRequests = leaves.filter(request => reliable(request) || confirmed.some(other =>
          other.kind === request.kind && other.validFrom === request.validFrom && other.validTo === request.validTo &&
          other.locator.lineStart === request.locator.lineStart && other.locator.lineEnd === request.locator.lineEnd));
        if (page.leaveRequests.length < leaves.length) page.reason = "ambiguous_field";
      }
    }
    return page;
  }
  function record(page: LocalCasePage, total: number) {
    pages.push(page);
    options.onPage?.(page, total);
  }
  try {
    if (type === "application/pdf") {
      const lib = await pdfjs();
      signal.throwIfAborted();
      const task = lib.getDocument({ data: bytes, isEvalSupported: false, maxImageSize: 16_000_000, verbosity: 0 });
      try {
        const pdf = await abortable(task.promise, signal);
        if (pdf.numPages > 128) throw new Error("Wybierz PDF do 128 stron.");
        if (!pdfOnly && pdf.numPages > 1 && typeof window !== "undefined") {
          try { checkpoint = await openCaseProgress(caseId, clientDocumentId); }
          catch { disableCheckpoint(); }
        }
        for (let n = 1; n <= pdf.numPages; n++) {
          signal.throwIfAborted();
          if (checkpoint) {
            try {
              const saved = await checkpoint.load(n);
              if (saved && saved.status !== "manual") {
                pages.push(saved);
                options.onPage?.(saved, pdf.numPages);
                onProgress(`Wznowiono stronę ${n} z ${pdf.numPages}.`);
                continue;
              }
            } catch { disableCheckpoint(); }
          }
          onProgress(`Czytam stronę ${n} z ${pdf.numPages}…`);
          signal.throwIfAborted();
          let result: LocalCasePage;
          try {
            const page = await pdf.getPage(n);
            try { result = await readPage(page, lib, signal, onProgress, pdf.numPages, getWorker, assess, clientDocumentId); }
            finally { page.cleanup(); }
          } catch {
            signal.throwIfAborted();
            result = assess({ method: "manual", text: "" });
          }
          record(result, pdf.numPages);
          if (checkpoint) {
            try { await checkpoint.save(pages[n - 1]); }
            catch { disableCheckpoint(); }
          }
        }
        signal.throwIfAborted();
        if (checkpoint) { try { await checkpoint.clear(); } catch { disableCheckpoint(); } }
      } catch (error) {
        if (error instanceof Error && error.name === "PasswordException") throw new Error("Wybierz odblokowaną kopię dokumentu PDF.");
        throw error;
      } finally { await task.destroy(); }
    } else {
      onProgress("Rozpoznaję skan strony 1 z 1…");
      const img = await loadImage(new Blob([bytes], { type }));
      const scale = scanScale(img.naturalWidth, img.naturalHeight, 1);
      const originalScale = Math.min(1, 1800 / Math.max(img.naturalWidth, img.naturalHeight));
      async function imageAtScale(factor: number, original = false) {
        const { canvas, ctx } = canvasFor(img.naturalWidth * factor, img.naturalHeight * factor);
        try {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          return assess(await runOcr(canvas, ctx, signal, getWorker, original));
        } finally { canvas.width = canvas.height = 0; }
      }
      const original = await imageAtScale(originalScale, true);
      const sameRead = originalScale === scale && (original.status === "blank" || (original.confidence ?? 0) >= MIN_CONFIDENCE);
      record(original.status === "excluded" || sameRead ? original : preserveWrittenLeave(original, await imageAtScale(scale)), 1);
    }
  } finally {
    checkpoint?.close();
    if (worker) await (await worker.catch(() => undefined))?.terminate();
  }
  signal.throwIfAborted();
  const pageKinds = pages.map(p => p.kind);
  const kind = new Set(pageKinds).size === 1 ? pageKinds[0] : "other";
  return { caseId, mediaType: type, metadata: { clientDocumentId, pages: pages.length, kind, pageKinds }, pages, storageUnavailable };
}

export function readCaseDocument(file: File, options: ReadOptions) {
  return read(file, options);
}

export async function readCasePdf(file: File, signal: AbortSignal, progress: Progress) {
  const { pages } = await read(file, { caseId: "local-preview", signal, onProgress: progress }, true);
  return pages.map(page => page.text);
}

// Commit this returned batch only after the promise succeeds; a failed attachment leaves earlier imports intact.
export async function readCaseDocuments(files: Iterable<File>, options: ReadOptions, existing: readonly LocalCaseDocument[] = []) {
  if (existing.some(doc => doc.caseId !== options.caseId)) throw new Error("Wybierz dokumenty z aktywnej sprawy.");
  const documents = [...existing];
  for (const file of files) {
    const document = await read(file, options, false, documents);
    if (!documents.includes(document)) documents.push(document);
  }
  return documents;
}
