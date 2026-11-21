"use client";

import type { KamilView } from "@/lib/kamil/contract";
import { fillZam } from "@/lib/forms/zam-fill";
import { buildZamValues } from "@/lib/forms/zam-map";
import { pdfjs, type PageImage } from "./read-document";

/**
 * Builds Kamil's ZAM in the browser from the confirmed case (the same view the chat and the
 * deadline come from), so a change in the case changes all three at once.
 */
let assets: Promise<Uint8Array[]> | null = null;

function loadAssets() {
  assets ??= Promise.all(
    ["/forms/zam-2026-10-24.pdf", "/forms/fonts/DejaVuSans.ttf"].map(async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`asset ${url} ${res.status}`);
      return new Uint8Array(await res.arrayBuffer());
    }),
  );
  return assets;
}

export const MARGIN_NOTE = "PRZYKŁAD Z DANYMI FIKCYJNYMI · ZUSIK DEMO · wzór ZAM z 24.10.2026";

export async function buildZamPdf(view: KamilView): Promise<Uint8Array> {
  const [template, font] = await loadAssets();
  const { values } = buildZamValues(view, view.today);
  return fillZam(template, font, values, { marginNote: MARGIN_NOTE });
}

/** Pages Kamil fills: 1 (his data, payer), 2 (period, part, insurance), 3 (child), 5 (statement, mother, date). */
export const FILLED_PAGES = [1, 2, 3, 5];

export async function renderPages(pdf: Uint8Array, pages = FILLED_PAGES): Promise<PageImage[]> {
  const lib = await pdfjs();
  const doc = await lib.getDocument({ data: pdf.slice(), isEvalSupported: false }).promise;
  const out: PageImage[] = [];
  for (const p of pages) {
    const page = await doc.getPage(p);
    const viewport = page.getViewport({ scale: 1.6 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    await page.render({ canvasContext: ctx, viewport }).promise;
    out.push({ page: p, url: canvas.toDataURL("image/png"), width: canvas.width, height: canvas.height });
  }
  return out;
}
