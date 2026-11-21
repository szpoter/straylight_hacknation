"use client";

import { extractBirthCertificate, type OcrWord, type ReadResult } from "@/lib/ocr/birth-certificate";
import { wordsFromPdfItems, wordsFromTesseract, type PdfTextItem, type TesseractWord } from "@/lib/ocr/words";
import type { Candidate } from "@/lib/kamil/contract";

/**
 * Reads Kamil's document in the browser. The file never leaves this device:
 * PDF text layer via PDF.js, scans via Tesseract.js (Polish model served by the app).
 */

export interface PageImage {
  page: number;
  url: string;
  width: number;
  height: number;
}

export interface DocumentRead {
  fileName: string;
  method: ReadResult["method"];
  candidates: Candidate[];
  pages: PageImage[];
}

export type Progress = (label: string) => void;

export async function pdfjs() {
  const lib = await import("pdfjs-dist");
  lib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
  return lib;
}

export async function ocrImage(source: HTMLCanvasElement, page: number, progress: Progress): Promise<OcrWord[]> {
  progress("Rozpoznaję tekst na skanie (OCR)…");
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("pol", 1, {
    workerPath: "/ocr/worker.min.js",
    corePath: "/ocr/core",
    langPath: "/ocr/lang",
    gzip: true,
  });
  try {
    const { data } = await worker.recognize(source, {}, { blocks: true });
    const words: TesseractWord[] = [];
    for (const block of data.blocks ?? [])
      for (const para of block.paragraphs) for (const line of para.lines) words.push(...(line.words as TesseractWord[]));
    return wordsFromTesseract(words, page, source.width, source.height);
  } finally {
    await worker.terminate();
  }
}

export async function loadImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function readDocument(file: File, progress: Progress): Promise<DocumentRead> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (isPdf) {
    progress("Otwieram PDF…");
    const lib = await pdfjs();
    const doc = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
    const words: OcrWord[] = [];
    const pages: PageImage[] = [];
    let method: ReadResult["method"] = "pdf_text";
    for (let p = 1; p <= Math.min(doc.numPages, 3); p++) {
      const page = await doc.getPage(p);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas unavailable");
      await page.render({ canvasContext: ctx, viewport }).promise;
      pages.push({ page: p, url: canvas.toDataURL("image/jpeg", 0.85), width: canvas.width, height: canvas.height });
      progress("Czytam warstwę tekstową PDF…");
      const content = await page.getTextContent();
      const pageWords = wordsFromPdfItems(content.items as PdfTextItem[], p, base.width, base.height);
      if (pageWords.length >= 5) words.push(...pageWords);
      else {
        // PDF without a text layer (a scanned PDF): OCR the rendered page.
        method = "ocr";
        words.push(...(await ocrImage(canvas, p, progress)));
      }
    }
    progress("Dopasowuję pola…");
    return { fileName: file.name, method, candidates: extractBirthCertificate({ fileName: file.name, method, words }), pages };
  }
  progress("Otwieram skan…");
  const img = await loadImage(file);
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  canvas.getContext("2d")?.drawImage(img, 0, 0);
  const words = await ocrImage(canvas, 1, progress);
  progress("Dopasowuję pola…");
  return {
    fileName: file.name,
    method: "ocr",
    candidates: extractBirthCertificate({ fileName: file.name, method: "ocr", words }),
    pages: [{ page: 1, url: canvas.toDataURL("image/jpeg", 0.85), width: canvas.width, height: canvas.height }],
  };
}

/* ---------- page images survive F5 in this browser only (IndexedDB), never on the server ---------- */

const DB = "zusik-kamil";
const STORE = "document";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePages(scope: string, fileName: string, pages: PageImage[]): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ fileName, pages }, scope);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Storage blocked (private window): crops disappear after a refresh, values stay in the case.
  }
}

export async function loadPages(scope: string): Promise<{ fileName: string; pages: PageImage[] } | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const req = db.transaction(STORE, "readonly").objectStore(STORE).get(scope);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function clearPages(scope: string): Promise<void> {
  try {
    const db = await openDb();
    db.transaction(STORE, "readwrite").objectStore(STORE).delete(scope);
  } catch {
    // nothing to clear
  }
}
