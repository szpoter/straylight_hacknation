import { readFile } from "node:fs/promises";
import path from "node:path";

/** Serves the contest PDFs the demo cites (RAG sources), so "Otwórz stronę w PDF" opens the right page. */
const FILES: Record<string, string> = {
  poradnik: "Poradnik dla rodziców, ZUS 2026.pdf",
  kodeks: "Kodeks pracy (wyciąg z przepisów).pdf",
};

const FOLDER = path.join(process.cwd(), "..", "Materiały hackathonowe", "Materiały dla uczestników");

export async function GET(_request: Request, ctx: RouteContext<"/demo/zusik/zrodla/[plik]">) {
  const { plik } = await ctx.params;
  const name = FILES[plik];
  if (!name) return new Response("Nie ma takiego źródła", { status: 404 });
  const file = await readFile(path.join(FOLDER, name));
  return new Response(new Uint8Array(file), {
    headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${plik}.pdf"` },
  });
}
