"use client";

import { pdfjs, loadImage } from "@/features/kamil/read-document";

/**
 * Tekst wszystkich stron wgranej sprawy, czytany na tym urządzeniu: warstwa tekstowa PDF, a gdy
 * jej brak (skany z zestawu ZUS), OCR Tesseract.js z polskim modelem serwowanym przez aplikację.
 * Plik nie opuszcza przeglądarki. Jeden worker OCR na cały plik, żeby nie ładować modelu co stronę.
 */

export interface ReadPage {
  page: number;
  text: string;
  /** Podgląd strony (JPEG data URL) do sprawdzenia podpowiedzi. */
  image: string;
}

export const MAX_PAGES = 40;

export async function readCasePdf(file: File, progress: (label: string) => void, signal?: AbortSignal): Promise<ReadPage[]> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  const canvases: HTMLCanvasElement[] = [];
  const pageTexts: string[] = [];

  if (isPdf) {
    progress("Otwieram PDF…");
    const lib = await pdfjs();
    const doc = await lib.getDocument({ data: new Uint8Array(await file.arrayBuffer()), isEvalSupported: false }).promise;
    const count = Math.min(doc.numPages, MAX_PAGES);
    for (let p = 1; p <= count; p++) {
      if (signal?.aborted) throw new DOMException("aborted", "AbortError");
      progress(`Przygotowuję stronę ${p} z ${count}…`);
      const page = await doc.getPage(p);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("canvas unavailable");
      await page.render({ canvasContext: ctx, viewport }).promise;
      const content = await page.getTextContent();
      const text = (content.items as Array<{ str?: string }>).map((i) => i.str ?? "").join(" ").trim();
      canvases.push(canvas);
      pageTexts.push(text);
    }
  } else {
    progress("Otwieram skan…");
    const img = await loadImage(file);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    canvas.getContext("2d")?.drawImage(img, 0, 0);
    canvases.push(canvas);
    pageTexts.push("");
  }

  const needOcr = pageTexts.map((t) => t.split(/\s+/).filter(Boolean).length < 20);
  if (needOcr.some(Boolean)) {
    progress("Ładuję polski model OCR…");
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("pol", 1, { workerPath: "/ocr/worker.min.js", corePath: "/ocr/core", langPath: "/ocr/lang", gzip: true });
    try {
      for (let i = 0; i < canvases.length; i++) {
        if (!needOcr[i]) continue;
        if (signal?.aborted) throw new DOMException("aborted", "AbortError");
        progress(`Rozpoznaję tekst (OCR): strona ${i + 1} z ${canvases.length}…`);
        const { data } = await worker.recognize(canvases[i]);
        pageTexts[i] = data.text;
      }
    } finally {
      await worker.terminate();
    }
  }

  return canvases.map((canvas, i) => {
    // Mniejszy podgląd: wystarczy do sprawdzenia podpowiedzi, nie trzyma w pamięci pełnych skanów.
    const scale = Math.min(1, 900 / canvas.width);
    const small = document.createElement("canvas");
    small.width = Math.round(canvas.width * scale);
    small.height = Math.round(canvas.height * scale);
    small.getContext("2d")?.drawImage(canvas, 0, 0, small.width, small.height);
    return { page: i + 1, text: pageTexts[i], image: small.toDataURL("image/jpeg", 0.8) };
  });
}
