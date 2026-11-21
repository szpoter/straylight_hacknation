"use client";

import { PdfPreview } from "@/components/pdf-preview";
import type { MartaView } from "@/lib/marta/types";

export function MartaPdfPreview({ view }: { view: MartaView | null }) {
  const version = view?.version ?? 0;
  async function load(signal: AbortSignal) {
    const response = await fetch(`/api/zusik/marta/pdf?version=${version}`, { signal, cache: "no-store" });
    if (!response.ok) throw new Error(`PDF: ${response.status}`);
    return response.blob();
  }
  return (
    <PdfPreview key={version} load={load} title="Wniosek o urlop rodzicielski do pracodawcy Studio Lipa"
      filename="wniosek-rodzicielski.pdf" label={view?.confirmed ? "Pobierz wniosek PDF" : "Pobierz szkic PDF"} />
  );
}
