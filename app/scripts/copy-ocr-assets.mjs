// Runs before `next build` and `next dev`. Copies the OCR engine and the PDF.js worker from
// node_modules (pinned versions) into public/, so the app serves them itself and the browser never
// fetches code from a CDN. The copies are git-ignored; the Polish language model is committed.
import { copyFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nm = (p) => path.join(root, "node_modules", p);
const pub = (p) => path.join(root, "public", p);

const files = [
  [nm("tesseract.js/dist/worker.min.js"), pub("ocr/worker.min.js")],
  [nm("tesseract.js-core/tesseract-core-lstm.wasm.js"), pub("ocr/core/tesseract-core-lstm.wasm.js")],
  [nm("tesseract.js-core/tesseract-core-simd-lstm.wasm.js"), pub("ocr/core/tesseract-core-simd-lstm.wasm.js")],
  [nm("pdfjs-dist/build/pdf.worker.min.mjs"), pub("pdfjs/pdf.worker.min.mjs")],
];

for (const [from, to] of files) {
  mkdirSync(path.dirname(to), { recursive: true });
  copyFileSync(from, to);
}
console.log(`copy-ocr-assets: ${files.length} files → public/ocr, public/pdfjs`);
