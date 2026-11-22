"use client";

import { createPolishOcrWorker, loadImage, pdfjs } from "@/features/kamil/read-document";
import { MIN_CONFIDENCE } from "@/lib/ocr/birth-certificate";
import { wordsFromPdfItems, wordsFromTesseract } from "@/lib/ocr/words";
import { analyzeCasePage, containsDecision, type LocalCasePage, type LocalCaseDocument, type LocalLocator } from "./case-evidence";
import { checkScanDimensions } from "./case-image-size";
import { openCaseProgress } from "./case-read-progress";
import { pageLines, type PageLine } from "./case-page-layout";

type Progress = (label: string) => void;
type ReadOptions = { caseId: string; signal: AbortSignal; onProgress: Progress; onPage?: (page: LocalCasePage, total: number) => void };
type PageRead = { text: string; method: LocalCasePage["method"]; lines?: PageLine[]; confidence?: number; blank?: boolean; protectedDecision?: boolean };
type PdfPage = import("pdfjs-dist/types/src/display/api").PDFPageProxy;
type Worker = Awaited<ReturnType<typeof createPolishOcrWorker>>;

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

// Text rows give a stronger horizontal projection than vertical text. One rotated retry is enough
// to recover common upside-down and clockwise scans; weaker results go to manual review.
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
  return horizontal >= vertical ? 180 : -90;
}

async function runOcr(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, signal: AbortSignal, getWorker: () => Promise<Worker>): Promise<PageRead> {
  signal.throwIfAborted();
  if (isBlank(ctx, canvas)) return { method: "ocr", text: "", blank: true };
  const worker = await getWorker();
  signal.throwIfAborted();
  const recognize = (image: HTMLCanvasElement) => abortable(worker.recognize(image, { rotateAuto: true }, { blocks: true }), signal);
  let { data } = await recognize(canvas);
  let rotation = 0;
  let width = canvas.width, height = canvas.height;
  if (data.confidence < MIN_CONFIDENCE) {
    const angle = retryRotation(canvas, ctx);
    const sideways = angle === -90;
    const retry = canvasFor(sideways ? height : width, sideways ? width : height);
    try {
      retry.ctx.translate(retry.canvas.width / 2, retry.canvas.height / 2);
      retry.ctx.rotate(angle * Math.PI / 180);
      retry.ctx.drawImage(canvas, -width / 2, -height / 2);
      const rotated = await recognize(retry.canvas);
      if (rotated.data.confidence > data.confidence) {
        data = rotated.data;
        rotation = angle;
        width = retry.canvas.width; height = retry.canvas.height;
      }
    } finally { retry.canvas.width = retry.canvas.height = 0; }
  }
  const words = data.words ?? data.blocks?.flatMap(b => b.paragraphs.flatMap(p => p.lines.flatMap(l => l.words))) ?? [];
  const lines = pageLines(wordsFromTesseract(words, 1, width, height), width, height);
  for (const line of lines) {
    const { x, y, w, h } = line.box;
    if (rotation === 180) line.box = { x: 1 - x - w, y: 1 - y - h, w, h };
    if (rotation === -90) line.box = { x: 1 - y - h, y: x, w: h, h: w };
  }
  const text = lines.length ? lines.map(l => l.text).join("\n") : data.text.trim();
  return { method: "ocr", text, confidence: data.confidence, lines };

}

async function readPage(page: PdfPage, lib: Awaited<ReturnType<typeof pdfjs>>, signal: AbortSignal, progress: Progress, total: number, getWorker: () => Promise<Worker>): Promise<PageRead> {
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
      return { method: "pdf_text", text: lines.length ? lines.map(l => l.text).join("\n") : raw, lines, confidence: 100 };
    }
  }
  signal.throwIfAborted();
  progress(`Rozpoznaję skan strony ${page.pageNumber} z ${total}…`);
  const view = page.getViewport({ scale: 1800 / Math.max(base.width, base.height) });
  const { canvas, ctx } = canvasFor(view.width, view.height);
  try {
    await page.render({ canvasContext: ctx, viewport: view }).promise;
    const result = await runOcr(canvas, ctx, signal, getWorker);
    if (!result.text && raw) return { method: "ocr", text: raw, confidence: 0 };
    return { ...result, protectedDecision: containsDecision(raw) };
  } finally {
    canvas.width = canvas.height = 0;
  }
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
  function record(input: PageRead, total: number) {
    signal.throwIfAborted();
    const page = analyzeCasePage(clientDocumentId, pages.length + 1, input.text, input.method, pages.at(-1), input.confidence);
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
      const reliable = (c: { locator: LocalLocator }) => {
        if (lines.slice(c.locator.lineStart - 1, c.locator.lineEnd).every(line => line.confidence >= MIN_CONFIDENCE)) return true;
        page.reason = "ambiguous_field";
        return false;
      };
      page.candidates = page.candidates.filter(reliable);
      if (page.leaveRequests) page.leaveRequests = page.leaveRequests.filter(reliable);
    }
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
          let result: PageRead;
          try {
            const page = await pdf.getPage(n);
            try { result = await readPage(page, lib, signal, onProgress, pdf.numPages, getWorker); }
            finally { page.cleanup(); }
          } catch {
            signal.throwIfAborted();
            result = { method: "manual", text: "" };
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
      const scale = Math.min(1, 1800 / Math.max(img.naturalWidth, img.naturalHeight));
      const { canvas, ctx } = canvasFor(img.naturalWidth * scale, img.naturalHeight * scale);
      try {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        record(await runOcr(canvas, ctx, signal, getWorker), 1);
      } finally { canvas.width = canvas.height = 0; }
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
