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
pdf.addPage().drawText("Wzorzec wyniku\nAkt urodzenia\nData urodzenia: 25.06.2026", { x: 30, y: 650 });
pdf.addPage().drawText("Akt urodzenia\nData urodzenia: 25.06.2026", { x: 50, y: 700 });
const packet = Array.from(await pdf.save());
// Frozen v1 writer, using the AAD and IndexedDB layout shipped before reader-v2.
async function seedLegacyPages({ data, caseId }) {
  const rawKey = Uint8Array.from(atob(sessionStorage.getItem("zusik-case-read-tab-key-v1")), c => c.charCodeAt(0));
  const digest = async bytes => new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  const hex = bytes => Array.from(bytes, byte => byte.toString(16).padStart(2, "0")).join("");
  const docId = hex(await digest(await new Blob([caseId, await digest(new Uint8Array(data))]).arrayBuffer()));
  const path = [caseId, hex(await digest(rawKey)), docId];
  const key = await crypto.subtle.importKey("raw", rawKey, "AES-GCM", false, ["encrypt"]);
  const db = await new Promise((resolve, reject) => {
    const req = indexedDB.open("zusik-case-read-v1", 1);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  try {
    for (const page of [1, 2]) {
      const id = [...path, page], iv = crypto.getRandomValues(new Uint8Array(12));
      const text = (page === 1 ? "Wzorzec wyniku\n" : "") + "Akt urodzenia\nData urodzenia: 25.06.2026";
      const candidate = { field: "birthDate", value: { kind: "date", date: "2026-06-25" },
        locator: { clientDocumentId: docId, page, lineStart: page === 1 ? 3 : 2, lineEnd: page === 1 ? 3 : 2 } };
      const legacy = { page, text, method: "pdf_text", status: "read", kind: "certificate", role: "certificate", candidates: [candidate] };
      const encode = value => new TextEncoder().encode(JSON.stringify(value));
      const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: encode(id) }, key, encode(legacy));
      await new Promise((resolve, reject) => {
        const tx = db.transaction("pages", "readwrite");
        tx.objectStore("pages").put({ iv, cipher, expiresAt: Date.now() + 86_400_000 }, id);
        tx.oncomplete = resolve;
        tx.onabort = () => reject(tx.error);
      });
    }
  } finally { db.close(); }
  return docId;
}

async function storedPages(caseId) {
  const db = await new Promise((resolve, reject) => {
    const req = indexedDB.open("zusik-case-read-v1", 1);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  try {
    return await new Promise((resolve, reject) => {
      const req = db.transaction("pages").objectStore("pages").count(IDBKeyRange.bound([caseId], [caseId, []]));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally { db.close(); }
}
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
  const upgraded = "upgrade";
  const documentId = await tab.evaluate(seedLegacyPages, { caseId: upgraded, data: packet });
  assert.equal(await tab.evaluate(storedPages, upgraded), 2);
  const readFirst = () => tab.evaluate(async ({ caseId, packet }) => {
    const { readCaseDocument } = await import("/progress.js");
    const abort = new AbortController(), labels = [];
    let result;
    try {
      await readCaseDocument(new File([new Uint8Array(packet)], "generated.pdf"), {
        caseId, signal: abort.signal, onProgress: label => labels.push(label),
        onPage(page) { result = page; abort.abort(); },
      });
      throw new Error("Expected an interrupted read");
    } catch (error) { if (error.name !== "AbortError") throw error; }
    return { status: result.status, candidates: result.candidates.length, labels };
  }, { caseId: upgraded, packet });
  await tab.reload();
  const fresh = await readFirst();
  assert.equal(fresh.status, "excluded");
  assert.equal(fresh.candidates, 0);
  assert.ok(fresh.labels.includes("Czytam stronę 1 z 2…"));
  await tab.reload();
  const restored = await readFirst();
  assert.equal(restored.status, "excluded");
  assert.equal(restored.candidates, 0);
  assert.ok(restored.labels.includes("Wznowiono stronę 1 z 2."));
  assert.deepEqual(await tab.evaluate(async ([caseId, docId]) => {
    const cache = await (await import("/progress.js")).openCaseProgress(caseId, docId);
    try { return [(await cache.load(1))?.status, await cache.load(2)]; }
    finally { cache.close(); }
  }, [upgraded, documentId]), ["excluded", undefined]);
  assert.equal(await tab.evaluate(storedPages, upgraded), 2);
  await tab.evaluate(async id => (await import("/progress.js")).clearCaseReadProgress(id), upgraded);
  assert.equal(await tab.evaluate(storedPages, upgraded), 0);
  console.log("PASS: legacy encrypted read page reclassified as excluded after F5, current checkpoint resumed, both versions cleared.");
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
