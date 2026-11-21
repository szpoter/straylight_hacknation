"use client";

import { fillZam } from "@/lib/forms/zam-fill";
import { ZAM_FORM } from "@/lib/kamil/sources";
import type { ZamValues } from "@/lib/forms/zam-map";

/**
 * Builds Kamil's ZAM in the browser from the confirmed case (the same view the chat and the
 * deadline come from), so a change in the case changes all three at once.
 */
let assets: Promise<Uint8Array[]> | null = null;

function loadAssets() {
  assets ??= Promise.all(
    [ZAM_FORM.templatePath, "/forms/fonts/DejaVuSans.ttf"].map(async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`asset ${url} ${res.status}`);
      return new Uint8Array(await res.arrayBuffer());
    }),
  ).catch(error => {
    assets = null;
    throw error;
  });
  return assets;
}

export const MARGIN_NOTE = "PRZYKŁAD Z DANYMI FIKCYJNYMI · ZUSIK DEMO · wzór ZAM z 24.10.2026";

export async function buildZamPdf(values: ZamValues): Promise<Uint8Array> {
  const [template, font] = await loadAssets();
  return fillZam(template, font, values, { marginNote: MARGIN_NOTE });
}
