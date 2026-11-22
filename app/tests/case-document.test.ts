import { createCanvas, loadImage } from "@napi-rs/canvas";
import { PDFDocument } from "pdf-lib";
import { afterEach, expect, it, vi } from "vitest";
import { readCaseDocument } from "../src/features/chat/read-case-pdf";

const { recognize } = vi.hoisted(() => ({ recognize: vi.fn() }));
afterEach(() => vi.unstubAllGlobals());
vi.mock("../src/features/kamil/read-document", () => ({
  createPolishOcrWorker: async () => ({ recognize, terminate: async () => {} }),
  loadImage: async (blob: Blob) => loadImage(Buffer.from(await blob.arrayBuffer())),
  pdfjs: () => import("pdfjs-dist/legacy/build/pdf.mjs"),
}));

it("locates a field in row 2 of page 74 of a renamed synthetic PDF", async () => {
  const pdf = await PDFDocument.create();
  for (let n = 1; n <= 74; n++) {
    const page = pdf.addPage();
    page.drawText(n === 74 ? "Odpis skrocony aktu urodzenia" : "Strona syntetycznego pakietu testowego", { x: 40, y: 700 });
    if (n === 74) page.drawText("Data urodzenia: 28.02.2024", { x: 40, y: 650 });
  }
  const bytes = Uint8Array.from(await pdf.save());
  const read = (name: string, caseId: string) => readCaseDocument(new File([bytes], name), { caseId, signal: AbortSignal.timeout(30_000), onProgress() {} });
  const first = await read("pakiet.pdf", "case-a");
  const renamed = await read("odmowa.pdf", "case-a");
  expect(renamed).toEqual(first);
  expect(first.metadata.pages).toBe(74);
  expect(first.pages[73].candidates).toEqual([{
    field: "birthDate", value: { kind: "date", date: "2024-02-28" },
    locator: { clientDocumentId: first.metadata.clientDocumentId, page: 74, lineStart: 2, lineEnd: 2 },
  }]);
  expect((await read("pakiet.pdf", "case-b")).metadata.clientDocumentId).not.toBe(first.metadata.clientDocumentId);
});

it.each([["dziecka", 1], ["marca", 0], ["proszę", 0]])("requires the request and dates to survive masking low-confidence word %s", async (weak, count) => {
  vi.stubGlobal("document", { createElement: () => createCanvas(1, 1) });
  const canvas = createCanvas(900, 400);
  canvas.getContext("2d").fillRect(0, 0, 900, 400);
  const content = ["Wniosek o udzielenie urlopu macierzyńskiego", "W związku z urodzeniem dziecka proszę o udzielenie urlopu macierzyńskiego,",
    "począwszy od 2 marca 2026 do 5 maja 2026"];
  const words = content.flatMap((line, index) => {
    let x = 10;
    return line.split(" ").map(text => {
      const x0 = x;
      x += text.length * 8 + 5;
      return { text, confidence: text === weak ? 45 : 96, bbox: { x0, x1: x - 5, y0: 50 + index * 50, y1: 72 + index * 50 } };
    });
  });
  recognize.mockResolvedValue({ data: { words, confidence: 95 } });
  const png = Uint8Array.from(canvas.toBuffer("image/png"));
  const result = await readCaseDocument(new File([png], "synthetic.png"), {
    caseId: "scan-words", signal: AbortSignal.timeout(5_000), onProgress() {},
  });
  expect(result.pages[0].leaveRequests ?? []).toHaveLength(count);
  expect(result.pages[0].candidates).toEqual([]);
});
