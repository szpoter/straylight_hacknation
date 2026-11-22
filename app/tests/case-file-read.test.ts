import { afterEach, describe, expect, it, vi } from "vitest";
import { readCasePdf, readCaseDocuments, readCaseDocument } from "../src/features/chat/read-case-pdf";
import { confirmCaseCandidate, evidenceAvailability } from "../src/features/chat/case-evidence";
import { createPolishOcrWorker, pdfjs } from "../src/features/kamil/read-document";

vi.mock("../src/features/kamil/read-document", () => ({
  pdfjs: vi.fn(),
  createPolishOcrWorker: vi.fn(),
}));

function setup(pages: string[]) {
  const destroy = vi.fn();
  const cleanup = vi.fn();
  const recognize = vi.fn(async () => ({ data: { text: "Treść odczytana ze skanu." } }));
  const terminate = vi.fn();
  const getPage = vi.fn(async (n: number) => ({
    getTextContent: async () => ({ items: [{ str: pages[n - 1], transform: [1, 0, 0, 12, 10, 90], width: 220, height: 12, hasEOL: true }] }),
    pageNumber: n, getOperatorList: async () => ({ fnArray: [] }),
    getViewport: ({ scale }: { scale: number }) => ({ width: 300 * scale, height: 500 * scale }),
    render: () => ({ promise: Promise.resolve() }),
    cleanup,
  }));
  vi.mocked(pdfjs).mockResolvedValue({
    OPS: {},
    getDocument: () => ({ promise: Promise.resolve({ numPages: pages.length, getPage }), destroy }),
  } as unknown as Awaited<ReturnType<typeof pdfjs>>);
  vi.mocked(createPolishOcrWorker).mockResolvedValue({ recognize, terminate } as unknown as Awaited<ReturnType<typeof createPolishOcrWorker>>);
  vi.stubGlobal("document", { createElement: () => ({ getContext: () => ({ getImageData: () => ({ data: [0, 0, 0, 255] }) }) }) });
  return { cleanup, destroy, getPage, recognize, terminate };
}

const file = () => new File(["%PDF-1.4 mock"], "dowody.pdf", { type: "application/pdf" });

describe("private chat PDF import", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.resetAllMocks(); });

  it.each(["legible", "weak label", "weak digit", "parent", "two dates", "another label", "mentioned attachment", "decision"])(
    "binds a reread cell to its child, source line and explicit label (%s)", async variant => {
      setup([""]);
      const recognize = vi.fn();
      vi.mocked(createPolishOcrWorker).mockResolvedValue({ recognize, terminate: async () => {} } as unknown as Awaited<ReturnType<typeof createPolishOcrWorker>>);
      const rows = ["Odpis skrócony aktu urodzenia", "Dane dziecka", "Data urodzenia O2.03.2026", "Dane rodziców"];
      if (variant === "parent") [rows[2], rows[3]] = [rows[3], rows[2]];
      if (variant === "another label") rows[2] = "Data urodzenia Data wydania 02.03.2026";
      if (variant === "mentioned attachment") rows[0] = "Do wniosku należy dołączyć odpis skrócony aktu urodzenia";
      if (variant === "decision") rows.unshift("Decyzja");
      recognize.mockImplementation(async (_canvas, opts) => {
        const contents = opts.rectangle ? [variant === "two dates" ? "02.03.2026 03.03.2026" : "02.03.2026"] : rows;
        return { data: { text: contents.join("\n"), confidence: 94, rotateRadians: 0,
          words: contents.flatMap((line, i) => line.split(" ").map((text, j) => ({
            text, confidence: (opts.rectangle && variant === "weak digit") || (text === "urodzenia" && variant === "weak label") ? 50 : 95,
            bbox: opts.rectangle
              ? { x0: opts.rectangle.left + 5 + 110 * j, x1: opts.rectangle.left + 105 + 110 * j, y0: opts.rectangle.top + 3, y1: opts.rectangle.top + 33 }
              : { x0: 40 + 110 * j, x1: 140 + 110 * j, y0: 80 + 70 * i, y1: 110 + 70 * i },
          }))) } };
      });
      const doc = await readCaseDocument(file(), {
        caseId: "registry-cell", signal: AbortSignal.timeout(15_000), onProgress() {},
      });
      const page = doc.pages[0];
      if (variant !== "legible") {
        expect(page.candidates).toEqual([]);
        if (variant === "decision") expect(page.status).toBe("excluded");
        return;
      }
      expect(page.candidates).toHaveLength(1);
      const [candidate] = page.candidates;
      expect(candidate.locator).toMatchObject({ page: 1, lineStart: 3, lineEnd: 3 });
      expect(page.lines?.[2].text).toMatch(/Data\s+urodzenia.*02\.03\.2026/iu);
      expect(evidenceAvailability([doc], "birthDate").needsReview).toContain(page);
      const accepted = confirmCaseCandidate(doc, { id: "test-doc", metadata: doc.metadata }, candidate, { subjectId: "child" });
      expect(accepted).toMatchObject({ field: "birthDate", value: { kind: "date", date: "2026-03-02" },
        source: { referenceId: "test-doc", page: 1 } });
    });

  it("reads the whole document page-by-page and reuses one local OCR worker for sparse pages", async () => {
    const native = "Dokument zawiera tekst możliwy do odczytania bez OCR.";
    const pages = Array<string>(74).fill(native);
    pages[2] = "";
    pages[73] = "74";
    const { cleanup, destroy, recognize, terminate } = setup(pages);
    const read = await readCasePdf(file(), new AbortController().signal, () => {});
    expect(read).toHaveLength(74);
    expect(read[0]).toBe(native);
    expect(read[73]).toContain("skanu");
    expect(createPolishOcrWorker).toHaveBeenCalledTimes(1);
    expect(recognize).toHaveBeenCalledTimes(4);
    expect(cleanup).toHaveBeenCalledTimes(74);
    expect(destroy).toHaveBeenCalledOnce();
    expect(terminate).toHaveBeenCalledOnce();
  });

  it("keeps separate attachments with matching names and reuses renamed identical bytes", async () => {
    const state = setup(["Formularz o treści syntetycznej, do próby odczytu."]);
    const options = { caseId: "case-A", signal: new AbortController().signal, onProgress() {} };
    const first = await readCaseDocuments([file()], options);
    const documents = await readCaseDocuments([new File([file()], "odmowa.pdf"), new File(["%PDF-different"], file().name)], options, first);
    expect(state.getPage).toHaveBeenCalledTimes(2);
    expect(documents).toHaveLength(2);
    expect(documents[0]).toBe(first[0]);
    expect(documents[1].metadata.clientDocumentId).not.toBe(first[0].metadata.clientDocumentId);
    await expect(readCaseDocuments([new File(["bad"], "next.pdf")], options, first)).rejects.toThrow();
    await expect(readCaseDocuments([], { ...options, caseId: "other" }, first)).rejects.toThrow();
    expect(first).toHaveLength(1);
  });

  it("keeps unreadable pages numbered when one page fails", async () => {
    const state = setup(["", "Akt urodzenia i dane osoby syntetycznej."]);
    state.getPage.mockRejectedValueOnce(new Error("damaged page"));
    const document = await readCaseDocument(file(), { caseId: "case-A", signal: new AbortController().signal, onProgress() {} });
    expect(document.pages.map(p => [p.page, p.status])).toEqual([[1, "manual"], [2, "read"]]);
  });

  it("releases the document and stops before the next page after cancellation", async () => {
    const state = setup(["Strona zawiera tekst poprzednio wpisany.", "Kolejna strona zawiera więcej tekstu."]);
    const controller = new AbortController();
    await expect(readCasePdf(file(), controller.signal, () => controller.abort())).rejects.toThrow();
    expect(state.getPage.mock.calls.length).toBeLessThan(2);
    expect(state.destroy).toHaveBeenCalledOnce();
  });

  it("rejects a renamed non-PDF before loading the reader", async () => {
    await expect(readCasePdf(new File(["<html>"], "scany.pdf"), new AbortController().signal, () => {})).rejects.toThrow("PDF");
    expect(pdfjs).not.toHaveBeenCalled();
  });
});

it("rejects a small encoded PNG claiming 400 megapixels before decode", async () => {
  const bytes = new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82,0,0,78,32,0,0,78,32]);
  await expect(readCaseDocument(new File([bytes], "scan.png"), { caseId: "new", signal: new AbortController().signal, onProgress() {} })).rejects.toThrow("megapikseli");
});
