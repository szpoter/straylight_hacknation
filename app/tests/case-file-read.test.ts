import { afterEach, describe, expect, it, vi } from "vitest";
import { readCasePdf } from "../src/features/chat/read-case-pdf";
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
    getTextContent: async () => ({ items: [{ str: pages[n - 1], hasEOL: true }] }),
    getViewport: () => ({ width: 300, height: 500 }),
    render: () => ({ promise: Promise.resolve() }),
    cleanup,
  }));
  vi.mocked(pdfjs).mockResolvedValue({
    getDocument: () => ({ promise: Promise.resolve({ numPages: pages.length, getPage }), destroy }),
  } as unknown as Awaited<ReturnType<typeof pdfjs>>);
  vi.mocked(createPolishOcrWorker).mockResolvedValue({ recognize, terminate } as unknown as Awaited<ReturnType<typeof createPolishOcrWorker>>);
  vi.stubGlobal("document", { createElement: () => ({ getContext: () => ({}) }) });
  return { cleanup, destroy, getPage, recognize, terminate };
}

const file = () => new File(["%PDF-1.4 mock"], "dowody.pdf", { type: "application/pdf" });

describe("private chat PDF import", () => {
  afterEach(() => { vi.unstubAllGlobals(); vi.resetAllMocks(); });

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
    expect(recognize).toHaveBeenCalledTimes(2);
    expect(cleanup).toHaveBeenCalledTimes(74);
    expect(destroy).toHaveBeenCalledOnce();
    expect(terminate).toHaveBeenCalledOnce();
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
