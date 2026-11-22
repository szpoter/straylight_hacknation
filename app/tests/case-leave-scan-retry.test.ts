import { afterEach, expect, it, vi } from "vitest";
import { readCaseDocument } from "../src/features/chat/read-case-pdf";

const { recognize } = vi.hoisted(() => ({ recognize: vi.fn() }));
vi.mock("../src/features/kamil/read-document", () => ({
  createPolishOcrWorker: async () => ({ recognize, terminate: async () => {} }),
  pdfjs: async () => ({
    getDocument: () => ({ destroy: async () => {}, promise: Promise.resolve({ numPages: 1, getPage: async () => ({
      pageNumber: 1, getTextContent: async () => ({ items: [] }), cleanup() {},
      getViewport: ({ scale }: { scale: number }) => ({ width: 595 * scale, height: 842 * scale }),
      render: () => ({ promise: Promise.resolve() }),
    }) }) }),
  }),
}));
afterEach(() => { vi.unstubAllGlobals(); recognize.mockReset(); });

const declaration = "Proszę o udzielenie mi urlopu rodzicielskiego";
const dates = "od 04.09.2026 do 30.09.2026";
function reading(lines: string[], height: number, weak = -1) {
  return { data: { text: lines.join("\n"), confidence: 92,
    words: lines.map((text, i) => ({ text, confidence: i === weak ? 55 : 96,
      bbox: { x0: 20, x1: 360, y0: height * (.10 + i * .05), y1: height * (.12 + i * .05) } })) } };
}

async function readScales(low: string[], high: string[], lowWeak = -1, highWeak = -1) {
  vi.stubGlobal("document", { createElement: () => ({ getContext: () => ({ getImageData: () => ({ data: [0, 0, 0, 255] }) }) }) });
  const heights: number[] = [];
  recognize.mockImplementation(async (canvas: HTMLCanvasElement) => {
    heights.push(canvas.height);
    return canvas.height > 1800 ? reading(high, canvas.height, highWeak) : reading(low, canvas.height, lowWeak);
  });
  const file = new File(["%PDF-1.4 synthetic"], "scan.pdf");
  const doc = await readCaseDocument(file, { caseId: "synthetic", signal: AbortSignal.timeout(10000), onProgress() {} });
  return { page: doc.pages[0], heights, clientDocumentId: doc.metadata.clientDocumentId };
}

it.each(["match", "broken separator", "noisy declaration", "request heading", "only kind and dates", "unreadable high", "mention", "instruction", "other end date", "other kind", "history", "negated request", "earlier leave", "higher decision", "lower decision", "weak retry"])(
  "reads the 1800px leave request independently and checks the high-resolution pass (%s)", async variant => {
    let high = [variant === "history" ? "Historia urlopu rodzicielskiego" : declaration, dates];
    if (variant === "noisy declaration") high[0] = "Proszę o udziel|enie mi urlopu rodzicielskiego";
    if (variant === "request heading") high[0] = "Wniosek\nDane syntetyczne\nurlop rodzicielski";
    if (variant === "only kind and dates") high[0] = "Urlop rodzicielski";
    if (variant === "unreadable high") high = [];
    if (variant === "mention") high[0] = "Warunki urlopu rodzicielskiego";
    if (variant === "instruction") high.unshift("Instrukcja wypełniania wniosku");
    if (variant === "broken separator") high[1] = dates.replace(" do ", " ? ");
    if (variant === "negated request") high.unshift("Nie wnoszę o ten urlop.");
    if (variant === "earlier leave") high.unshift("Wcześniej korzystałam z takiego urlopu.");
    if (variant === "higher decision") high.unshift("Decyzja");
    const lower = [variant === "other kind" ? declaration.replace("rodzicielskiego", "ojcowskiego") : declaration,
      variant === "other end date" ? dates.replace("30.", "20.") : dates];
    if (variant === "lower decision") lower.unshift("Decyzja");
    const highLines = high.flatMap(line => line.split("\n"));
    const { page, heights, clientDocumentId } = await readScales(lower, highLines, variant === "weak retry" ? 1 : -1, highLines.length - 1);
    expect(page.candidates).toEqual([]);
    expect(page.leaveRequests ?? []).toEqual(["match", "broken separator", "noisy declaration", "request heading", "only kind and dates", "unreadable high"].includes(variant) ? [{ kind: "parental", validFrom: "2026-09-04", validTo: "2026-09-30",
      locator: { clientDocumentId, page: 1, lineStart: 1, lineEnd: 2 } }] : []);
    if (variant.includes("decision")) expect(page.status).toBe("excluded");
    expect(heights[0]).toBe(1800);
    expect(heights).toHaveLength(variant === "lower decision" ? 1 : 2);
    if (heights.length === 2) expect(heights[1]).toBeGreaterThan(heights[0]);
  });

it("retains both source citations when the legible leave and birth date come from different renders", async () => {
  const birth = "Data urodzenia dziecka: 08.05.2025";
  const low = ["Wniosek", declaration, dates, "Data urodzenia dziecka: ?"];
  const high = ["Wniosek o urlop rodzicielski", "–", "–", birth];
  const { page, clientDocumentId } = await readScales(low, high);
  expect(page.candidates).toMatchObject([{ field: "birthDate", value: { kind: "date", date: "2025-05-08" }, locator: { clientDocumentId, page: 1 } }]);
  expect(page.leaveRequests).toMatchObject([{ kind: "parental", validFrom: "2026-09-04", validTo: "2026-09-30", locator: { clientDocumentId, page: 1 } }]);

  const source = (locator: { lineStart: number; lineEnd: number }) => {
    const rows = page.lines?.slice(locator.lineStart - 1, locator.lineEnd) ?? [];
    expect(rows.map(row => row.text)).toEqual(page.text.split("\n").slice(locator.lineStart - 1, locator.lineEnd));
    return rows;
  };
  const request = page.leaveRequests?.[0];
  expect.assert(request);
  const periodRows = source(request.locator);
  expect(periodRows.map(row => row.text)).toEqual([declaration, dates]);
  expect(periodRows[0].box.y).toBeCloseTo(.15);
  const fieldRows = source(page.candidates[0].locator);
  expect(fieldRows.map(row => row.text)).toEqual([birth]);
  expect(fieldRows[0].box.y).toBeCloseTo(.25);
});
