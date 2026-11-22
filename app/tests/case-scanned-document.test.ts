import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { PDFDocument } from "pdf-lib";
import { createWorker } from "tesseract.js";
import { afterEach, expect, it, vi } from "vitest";
import { readCaseDocuments } from "../src/features/chat/read-case-pdf";

vi.mock("../src/features/kamil/read-document", () => ({
  pdfjs: () => import("pdfjs-dist/legacy/build/pdf.mjs"),
  loadImage: async (blob: Blob) => loadImage(Buffer.from(await blob.arrayBuffer())),
  createPolishOcrWorker: async () => {
    const worker = await createWorker("pol", 1, { langPath: path.resolve("public/ocr/lang"), cacheMethod: "none", gzip: true });
    return {
      recognize: (canvas: import("@napi-rs/canvas").Canvas, options: Partial<import("tesseract.js").RecognizeOptions>, output: Partial<import("tesseract.js").OutputFormats>) =>
        worker.recognize(canvas.toBuffer("image/png"), options, output),
      terminate: () => worker.terminate(),
    };
  },
}));

afterEach(() => vi.unstubAllGlobals());

it("reads payroll cells with Polish OCR from PNG, mixed PDF and 90°/180° JPEG scans", async () => {
  vi.stubGlobal("document", { createElement: () => createCanvas(1, 1) });
  const canvas = createCanvas(1600, 650);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, 1600, 650);
  ctx.fillStyle = "black";
  ctx.font = "44px Arial";
  ctx.fillText("Zestawienie wynagrodzeń", 70, 120);
  ctx.fillText("Miesiąc", 70, 250);
  ctx.fillText("Brutto", 570, 250);
  ctx.fillText("2026-02", 70, 330);
  ctx.fillText("6500,00", 570, 330);
  const png = Uint8Array.from(canvas.toBuffer("image/png"));
  const upsideDown = createCanvas(canvas.width, canvas.height);
  const flipped = upsideDown.getContext("2d");
  flipped.translate(canvas.width, canvas.height);
  flipped.rotate(Math.PI);
  flipped.drawImage(canvas, 0, 0);
  const sideways = createCanvas(canvas.height, canvas.width);
  const turned = sideways.getContext("2d");
  turned.translate(canvas.height, 0);
  turned.rotate(Math.PI / 2);
  turned.drawImage(canvas, 0, 0);
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([800, 500]);
  page.drawText("Zestawienie wynagrodzen platnika skladek", { x: 35, y: 450, size: 16 });
  page.drawImage(await pdf.embedPng(png), { x: 0, y: 0, width: 800, height: 325 });
  const rasterPacket = Uint8Array.from(await pdf.save());
  // Simulate a decision title present only in the digital layer, missed by the rendered OCR.
  const decision = await PDFDocument.load(rasterPacket);
  decision.getPage(0).drawText("Decyzja", { x: 30, y: 470, size: 12, opacity: 0 });
  const docs = await readCaseDocuments([new File([png], "pierwszy.bin"), new File([rasterPacket], "drugi.bin"),
    new File([Uint8Array.from(upsideDown.toBuffer("image/jpeg"))], "trzeci.bin"),
    new File([Uint8Array.from(sideways.toBuffer("image/jpeg"))], "czwarty.bin"), new File([Uint8Array.from(await decision.save())], "piaty.bin")], {
    caseId: "scan-A", signal: AbortSignal.timeout(55_000), onProgress() {},
  });
  expect(docs[4].pages[0]).toMatchObject({ status: "excluded", role: "decision", candidates: [] });
  for (const doc of docs.slice(0, 4)) {
    expect(doc.pages[0].method).toBe("ocr");
    expect(doc.pages[0].candidates, doc.pages[0].text).toContainEqual(expect.objectContaining({
      field: "monthlyGrossPay", value: { kind: "money", currency: "PLN", grosze: 650000 },
      locator: expect.objectContaining({ clientDocumentId: doc.metadata.clientDocumentId, page: 1, column: 2 }),
    }));
  }
}, 60_000);
