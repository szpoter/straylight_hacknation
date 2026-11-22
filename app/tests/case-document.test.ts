import { PDFDocument } from "pdf-lib";
import { expect, it, vi } from "vitest";
import { readCaseDocument } from "../src/features/chat/read-case-pdf";

vi.mock("../src/features/kamil/read-document", () => ({
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
