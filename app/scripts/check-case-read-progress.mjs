// Synthetic browser regression for the private IndexedDB checkpoint. No server or PDF fixture required.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright-core";
import { build } from "esbuild";
import { PDFDocument } from "pdf-lib";

const { outputFiles } = await build({
  stdin: { contents: 'export * from "./src/features/chat/read-case-pdf"; export * from "./src/features/chat/case-read-progress";', resolveDir: process.cwd() },
  bundle: true, format: "esm", platform: "browser", write: false,
});
const pdfWorker = await readFile(new URL("../node_modules/pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url));
const pdf = await PDFDocument.create();
pdf.addPage().drawText("Strona pierwsza testowego pliku lokalnego", { x: 30, y: 650 });
pdf.addPage().drawText("Akt urodzenia\nData urodzenia: 25.06.2026", { x: 50, y: 700 });
const packet = Array.from(await pdf.save());
const browser = await chromium.launch({ channel: "chrome" });
const timeout = setTimeout(() => void browser.close(), 30_000);
try {
  const context = await browser.newContext();
  await context.route("**/*", route => {
    const url = route.request().url();
    if (url === "http://localhost/progress.js") return route.fulfill({ contentType: "text/javascript", body: outputFiles[0].text });
    if (url === "http://localhost/pdfjs/pdf.worker.min.mjs") return route.fulfill({ contentType: "text/javascript", body: pdfWorker });
    if (url === "http://localhost/") return route.fulfill({ contentType: "text/html", body: "<title>OCR progress test</title>" });
    return route.abort();
  });
  const tab = await context.newPage();
  await tab.goto("http://localhost/");
  await tab.evaluate(async () => {
    const { openCaseProgress } = await import("/progress.js");
    const cache = await openCaseProgress("case-A", "doc-A");
    await cache.save({ page: 2, text: "Synthetic unfinished page", status: "read", kind: "certificate", candidates: [] });
    cache.close();
  });
  const lookup = (page, scope, doc) => page.evaluate(async ([caseId, clientDocumentId]) => {
    const { openCaseProgress } = await import("/progress.js");
    const cache = await openCaseProgress(caseId, clientDocumentId);
    try { return (await cache.load(2))?.text; } finally { cache.close(); }
  }, [scope, doc]);
  await tab.reload();
  assert.equal(await lookup(tab, "case-A", "doc-A"), "Synthetic unfinished page");
  assert.equal(await lookup(tab, "case-B", "doc-A"), undefined);
  assert.equal(await lookup(tab, "case-A", "doc-B"), undefined);
  const other = await context.newPage();
  await other.goto("http://localhost/");
  assert.equal(await lookup(other, "case-A", "doc-A"), undefined);
  await tab.evaluate(async () => (await import("/progress.js")).clearCaseReadProgress("case-A"));
  assert.equal(await lookup(tab, "case-A", "doc-A"), undefined);
  await tab.evaluate(async data => {
    const { readCaseDocument } = await import("/progress.js");
    const abort = new AbortController();
    try {
      await readCaseDocument(new File([new Uint8Array(data)], "first.pdf"), {
        caseId: "interrupted", signal: abort.signal, onProgress() {}, onPage(page) { if (page.page === 1) abort.abort(); },
      });
      throw new Error("Expected an interrupted read");
    } catch (error) { if (error.name !== "AbortError") throw error; }
  }, packet);
  await tab.reload();
  const resumed = await tab.evaluate(async data => {
    const { readCaseDocument } = await import("/progress.js");
    const labels = [];
    const doc = await readCaseDocument(new File([new Uint8Array(data)], "renamed.pdf"), {
      caseId: "interrupted", signal: AbortSignal.timeout(10000), onProgress: label => labels.push(label),
    });
    return { labels, pages: doc.pages.length, field: doc.pages[1].candidates[0]?.value };
  }, packet);
  assert.ok(resumed.labels.includes("Wznowiono stronę 1 z 2."));
  assert.deepEqual(resumed.field, { kind: "date", date: "2026-06-25" });
  assert.equal(resumed.pages, 2);
  console.log("PASS: interrupted PDF.js reader resumed the first page after reload and read the field on page 2.");
  console.log("PASS: F5 restored page 2; another case, file, independent tab and cleared case returned no page.");
} finally { clearTimeout(timeout); await browser.close(); }
