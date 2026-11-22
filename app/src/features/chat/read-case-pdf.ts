"use client";

import { createPolishOcrWorker, pdfjs } from "@/features/kamil/read-document";

export async function readCasePdf(file: File, signal: AbortSignal, progress: (label: string) => void) {
  if (!file.size || file.size > 20 * 1024 * 1024) throw new Error("Wybierz plik PDF o wielkości do 20 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!new TextDecoder().decode(bytes.subarray(0, 1024)).includes("%PDF-")) throw new Error("Ten plik nie zawiera dokumentu PDF.");
  const lib = await pdfjs();
  signal.throwIfAborted();
  const task = lib.getDocument({ data: bytes, isEvalSupported: false, maxImageSize: 16_000_000 });
  let worker: Awaited<ReturnType<typeof createPolishOcrWorker>> | undefined;
  const pages: string[] = [];
  try {
    const pdf = await task.promise;
    if (pdf.numPages > 128) throw new Error("Wybierz PDF do 128 stron.");
    for (let number = 1; number <= pdf.numPages; number++) {
      signal.throwIfAborted();
      progress(`Czytam stronę ${number} z ${pdf.numPages}…`);
      const page = await pdf.getPage(number);
      try {
        const { items } = await page.getTextContent();
        const text = items.flatMap(item => "str" in item ? [item.str + (item.hasEOL ? "\n" : " ")] : []).join("").trim();
        if ((text.match(/[\p{L}\d]/gu)?.length ?? 0) >= 24) {
          pages.push(text);
          continue;
        }
        signal.throwIfAborted();
        progress(`Rozpoznaję skan strony ${number} z ${pdf.numPages}…`);
        const base = page.getViewport({ scale: 1 });
        const view = page.getViewport({ scale: 1800 / Math.max(base.width, base.height) });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(view.width);
        canvas.height = Math.ceil(view.height);
        try {
          const context = canvas.getContext("2d");
          if (!context) throw new Error("Przeglądarka nie może odczytać skanu.");
          await page.render({ canvasContext: context, viewport: view }).promise;
          worker ??= await createPolishOcrWorker();
          signal.throwIfAborted();
          const result = await worker.recognize(canvas);
          pages.push(result.data.text.trim() || text);
        } finally {
          canvas.width = canvas.height = 0;
        }
      } finally {
        page.cleanup();
      }
    }
    return pages;
  } finally {
    try { await worker?.terminate(); } finally { await task.destroy(); }
  }
}
