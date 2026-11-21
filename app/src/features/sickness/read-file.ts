"use client";

import { parsePage, splitPages } from "@/lib/sickness/read";
import { loadImage, ocrImage, pdfjs } from "@/features/kamil/read-document";

type Page = { text: string; image?: Blob };
function makeCanvas(width: number, height: number) {
  const scale = Math.min(1, 1800 / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  return canvas;
}
async function scanned(canvas: HTMLCanvasElement, page: number, update: (s: string) => void) {
  return (await ocrImage(canvas, page, update)).map((w) => w.text).join(" ");
}
async function imageBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob | undefined>((resolve) =>
    canvas.toBlob((b) => resolve(b ?? undefined), "image/jpeg", 0.75),
  );
}

export async function readSicknessFile(file: File, update: (s: string) => void) {
  if (file.size > 8 * 1024 * 1024) throw new Error("Plik przekracza 8 MB.");
  const pages: Page[] = [];
  if (/\.txt$/i.test(file.name) || file.type === "text/plain") {
    const textPages = splitPages(await file.text());
    pages.push(...textPages.map((text) => ({ text })));
  } else if (/\.pdf$/i.test(file.name) || file.type === "application/pdf") {
    const lib = await pdfjs();
    const task = lib.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      isEvalSupported: false,
      maxImageSize: 16_000_000,
    });
    try {
      const doc = await task.promise;
      if (doc.numPages > 6) throw new Error("Pakiet demonstracyjny może mieć do sześciu stron.");
      for (let n = 1; n <= doc.numPages; n++) {
        update("Czytam stronę " + n + "…");
        const page = await doc.getPage(n);
        const base = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale: 1800 / Math.max(base.width, base.height) });
        const canvas = makeCanvas(viewport.width, viewport.height);
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Podgląd strony jest niedostępny.");
        await page.render({ canvasContext: context, viewport }).promise;
        const items = (await page.getTextContent()).items;
        const text = items
          .flatMap((item) => ("str" in item ? [item.str] : []))
          .join(" ")
          .trim();
        pages.push({ text: text || (await scanned(canvas, n, update)), image: await imageBlob(canvas) });
      }
    } finally {
      await task.destroy();
    }
  } else if (["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    const image = await loadImage(file);
    const canvas = makeCanvas(image.naturalWidth, image.naturalHeight);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Podgląd strony jest niedostępny.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    pages.push({ text: await scanned(canvas, 1, update), image: await imageBlob(canvas) });
  } else throw new Error("Wybierz PDF, TXT, PNG, JPG lub WebP.");
  if (pages.length < 1 || pages.length > 6)
    throw new Error("Pakiet demonstracyjny może mieć od jednej do sześciu stron.");
  return pages.map((p, i) => {
    const page = i + 1;
    try {
      return { page, raw: p.text, fact: parsePage(p.text, page), image: p.image };
    } catch {
      return { page, raw: p.text, fact: null, image: p.image };
    }
  });
}

export async function saveOriginalPages(pages: { url: string; image: Blob }[]) {
  if (!pages.length) return;
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open("zusik-sickness-evidence", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("pages");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("pages", "readwrite");
      for (const p of pages) tx.objectStore("pages").put(p.image, p.url);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
