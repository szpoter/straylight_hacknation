import { createCanvas, loadImage } from "@napi-rs/canvas";
import { PDFDocument } from "pdf-lib";
import { afterEach, expect, it, vi } from "vitest";
import { readCaseDocument } from "../src/features/chat/read-case-pdf";

const { recognize } = vi.hoisted(() => ({ recognize: vi.fn() }));
afterEach(() => { vi.unstubAllGlobals(); recognize.mockReset(); });
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
  recognize.mockResolvedValue({ data: { text: content.join("\n"), words, confidence: 95 } });
  const png = Uint8Array.from(canvas.toBuffer("image/png"));
  const result = await readCaseDocument(new File([png], "synthetic.png"), {
    caseId: "scan-words", signal: AbortSignal.timeout(5_000), onProgress() {},
  });
  expect(result.pages[0].leaveRequests ?? []).toHaveLength(count);
  expect(result.pages[0].candidates).toEqual([]);
});

it("keeps a decision excluded when a more confident rotated pass misses its heading", async () => {
  vi.stubGlobal("document", { createElement: () => createCanvas(1, 1) });
  const canvas = createCanvas(120, 60);
  canvas.getContext("2d").fillRect(0, 0, 120, 60);
  recognize.mockResolvedValueOnce({ data: { text: "Decyzja", confidence: 61 } })
    .mockResolvedValueOnce({ data: { text: "Akt urodzenia\nData urodzenia: 02.03.2026", confidence: 93 } });
  const result = await readCaseDocument(new File([Uint8Array.from(canvas.toBuffer("image/png"))], "scan.png"), {
    caseId: "rotation", signal: AbortSignal.timeout(5_000), onProgress() {},
  });
  expect(result.pages[0]).toMatchObject({ status: "excluded", role: "decision", candidates: [] });
});

it.each(["legible", "decision", "weak digit", "parent"])("rechecks an unreadable registry date at a smaller PDF scale (%s)", async variant => {
  vi.stubGlobal("document", { createElement: () => createCanvas(1, 1) });
  const pdf = await PDFDocument.create();
  pdf.addPage([595, 842]).drawRectangle({ x: 30, y: 40, width: 10, height: 10 });
  const title = "Odpis skrócony aktu urodzenia";
  const scan = (lines: string[], weak = -1) => ({ data: { confidence: 92, text: lines.join("\n"),
    words: lines.map((text, row) => ({ text, confidence: row === weak ? 50 : 96, bbox: { x0: 10, x1: 240, y0: 40 * row, y1: 40 * row + 25 } })) } });
  const retry = [title, variant === "parent" ? "Dane rodziców" : "Dane dziecka", "Data urodzenia: 02.03.2026"];
  if (variant === "decision") retry.push("Decyzja");
  recognize.mockResolvedValueOnce(scan(["Odpis skrócony aktu urodzenią", "Dane dziecka", "Data urodzenia: ?2.03.2026", "Dane rodziców"]))
    .mockResolvedValueOnce(scan(retry, variant === "weak digit" ? 2 : -1));
  const result = await readCaseDocument(new File([Uint8Array.from(await pdf.save())], "scan.pdf"), {
    caseId: "registry", signal: AbortSignal.timeout(10_000), onProgress() {},
  });
  expect(result.pages[0].status).toBe(variant === "decision" ? "excluded" : "read");
  expect(result.pages[0].candidates.map(c => [c.field, c.value, c.locator.lineStart])).toEqual(
    variant === "legible" ? [["birthDate", { kind: "date", date: "2026-03-02" }, 3]] : []);
});
