// From app/: node scripts/qa-private-pages.mjs --self-test | --edition
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readFile, realpath, appendFile } from "node:fs/promises";
import { connect } from "node:net";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import { PDFDocument } from "pdf-lib";
import { chromium } from "playwright-core";

const script = fileURLToPath(import.meta.url);
const app = path.resolve(path.dirname(script), "..");
const privateDir = path.join(homedir(), "Library/Application Support/Zusik/private-cases");
const source = path.resolve(app, "../Materiały hackathonowe/Sprawy");
const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const assetOrigin = "https://offline.invalid";
const kinds = ["pdf_text", "ocr", "manual"];
const states = ["read", "manual", "blank", "excluded"];
const safeFile = async pathname => {
  const stat = await lstat(pathname);
  assert.ok(!stat.isSymbolicLink() && stat.uid === process.getuid() && !(stat.mode & 0o077));
};

async function assets() {
  const compiled = await build({ entryPoints: [path.join(app, "src/features/chat/read-case-pdf.ts")],
    tsconfig: path.join(app, "tsconfig.json"), bundle: true, write: false, platform: "browser", format: "iife",
    globalName: "qaReader", define: { "process.env.NODE_ENV": '"production"' }, logLevel: "silent" });
  const table = new Map([
    ["/", ["text/html", Buffer.from('<!doctype html><script src="/reader.js"></script>')]],
    ["/reader.js", ["text/javascript", compiled.outputFiles[0].contents]],
  ]);
  for (const p of ["/pdfjs/pdf.worker.min.mjs", "/ocr/worker.min.js", "/ocr/lang/pol.traineddata.gz",
    "/ocr/core/tesseract-core-lstm.wasm.js", "/ocr/core/tesseract-core-simd-lstm.wasm.js"]) {
    table.set(p, [p.endsWith(".gz") ? "application/octet-stream" : "text/javascript", await readFile(path.join(app, "public", p))]);
  }
  return table;
}

async function readPages(page, bytes, copies, checkScan = false) {
  return page.evaluate(async ({ encoded, copies, checkScan }) => {
    const arr = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
    const files = Array.from({ length: copies }, (_, n) => new File([arr], "pakiet-" + n + ".pdf", { type: "application/pdf" }));
    const result = await qaReader.readCaseDocuments(files, {
      caseId: "offline", signal: AbortSignal.timeout(45 * 60_000), onProgress() {},
    });
    if (result.length !== 1) throw Error("dedup");
    const { pages } = result[0];
    return { pages: pages.length, methods: pages.map(p => p.method), statuses: pages.map(p => p.status),
      fields: pages.reduce((n, p) => n + p.candidates.length, 0),
      scanned: checkScan && /KONTROLA/i.test(pages[2]?.text ?? "") };
  }, { encoded: bytes.toString("base64"), copies, checkScan });
}

async function preflight(page) {
  const png = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 450;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.font = "bold 54px Arial";
    ctx.fillText("KONTROLA", 75, 160);
    ctx.fillText("LOKALNY ODCZYT DOKUMENTU", 75, 250);
    return canvas.toDataURL();
  });
  const pdf = await PDFDocument.create();
  pdf.addPage().drawText("Syntetyczny tekst testowy do sprawdzenia warstwy tekstowej PDF");
  pdf.addPage();
  const picture = await pdf.embedPng(png);
  pdf.addPage([1200, 450]).drawImage(picture, { x: 0, y: 0, width: 1200, height: 450 });
  const result = await readPages(page, Buffer.from(await pdf.save()), 2, true);
  assert.deepEqual(result.methods, ["pdf_text", "ocr", "ocr"]);
  assert.equal(result.statuses[1], "blank");
  assert.ok(result.scanned);
}

function aggregate(records) {
  const counts = { files: 0, unique: 0, pages: 0, candidates: 0, methods: {}, statuses: {}, durationSeconds: 0 };
  for (const record of records) {
    counts.files += record.copies;
    counts.unique++;
    counts.pages += record.n;
    counts.candidates += record.fields;
    counts.durationSeconds += record.seconds;
    for (const column of ["methods", "statuses"]) for (const [key, value] of Object.entries(record[column]))
      counts[column][key] = (counts[column][key] || 0) + value;
  }
  return counts;
}

async function runEdition(context, table, firstPage, rejected) {
  const keyPath = path.join(privateDir, "qa-edition-2026.json");
  await safeFile(privateDir);
  await safeFile(keyPath);
  const key = JSON.parse(await readFile(keyPath, "utf8"));
  const fingerprint = sha(Buffer.concat([await readFile(script), ...[...table.values()].map(([, bytes]) => bytes)]));
  const cache = path.join(privateDir, "qa-page-results-" + fingerprint + ".jsonl");
  let records = new Map();
  try {
    await safeFile(cache);
    const data = await readFile(cache, "utf8");
    records = new Map(data.trim().split("\n").filter(Boolean).map(line => { const r = JSON.parse(line); return [r.digest, r]; }));
  } catch (error) { if (error.code !== "ENOENT") throw error; }
  const queue = key.cases;
  assert.equal(queue.length, 86);
  assert.equal(queue.reduce((n, c) => n + c.pages, 0), 2008);
  assert.equal(queue.reduce((n, c) => n + c.aliases.length, 0), 87);
  const root = await realpath(source);
  const slots = [firstPage, ...await Promise.all(Array.from({ length: 3 }, () => context.newPage()))];
  await Promise.all(slots.slice(1).map(p => p.goto(assetOrigin)));
  const start = performance.now();
  const count = (xs, allowed) => {
    const out = {};
    for (const x of xs) { assert.ok(allowed.includes(x)); out[x] = (out[x] || 0) + 1; }
    return out;
  };
  for (const holdout of [true, false]) {
    const cases = queue.filter(c => (c.proposedSplit === "holdout") === holdout);
    const cursor = cases.values();
    await Promise.all(slots.map(async p => {
      for (const c of cursor) {
        let bytes;
        for (const entry of c.aliases) {
          const file = await realpath(path.resolve(root, entry));
          assert.ok(file.startsWith(root + path.sep));
          const content = await readFile(file);
          assert.equal(sha(content), c.sha);
          bytes ??= content;
        }
        if (records.has(c.sha)) continue;
        const began = performance.now();
        const result = await readPages(p, bytes, c.aliases.length);
        assert.equal(result.pages, c.pages);
        assert.equal(rejected(), 0);
        const record = { digest: c.sha, copies: c.aliases.length, n: result.pages,
          methods: count(result.methods, kinds), statuses: count(result.statuses, states),
          fields: result.fields, seconds: Math.round((performance.now() - began) / 1000) };
        await appendFile(cache, JSON.stringify(record) + "\n", {mode: 0o600});
        records.set(c.sha, record);
      }
    }));
    console.log(JSON.stringify({ stage: holdout ? "provisional-holdout" : "edition",
      ...aggregate((holdout ? cases : queue).map(c => records.get(c.sha))), wallSeconds: Math.round((performance.now() - start) / 1000) }));
  }
}

async function main(mode) {
  // Refuse a forged child environment or a host without enforced IP denial.
  const denied = await new Promise(resolve => {
    const socket = connect(9, "127.0.0.1");
    socket.setTimeout(1000, () => { socket.destroy(); resolve(false); });
    socket.on("connect", () => { socket.destroy(); resolve(false); });
    socket.on("error", error => resolve(["EPERM", "EACCES"].includes(error.code)));
  });
  assert.ok(denied, "macOS network policy inactive");
  const table = await assets();
  let blocked = 0;
  const browser = await chromium.launch({ channel: "chrome", headless: true, args: ["--disable-background-networking"] });
  try {
    const context = await browser.newContext({ offline: true, serviceWorkers: "block", acceptDownloads: false });
    await context.routeWebSocket("**/*", ws => { blocked++; ws.close(); });
    await context.route("**/*", route => {
      const req = route.request();
      const url = new URL(req.url());
      const asset = url.origin === assetOrigin && !url.search && req.method() === "GET" && table.get(url.pathname);
      if (!asset) { blocked++; return route.abort(); }
      return route.fulfill({ contentType: asset[0], body: Buffer.from(asset[1]) });
    });
    const page = await context.newPage();
    await page.goto(assetOrigin);
    await preflight(page);
    assert.equal(blocked, 0);
    console.log("offline preflight: text, blank, OCR and duplicate passed");
    if (mode === "--edition") await runEdition(context, table, page, () => blocked);
  } finally { await browser.close(); }
}

const mode = process.argv[2];
if (!["--self-test", "--edition"].includes(mode)) {
  console.error("Usage: node scripts/qa-private-pages.mjs --self-test | --edition");
  process.exitCode = 2;
} else if (!process.env.QA_PAGES_SANDBOX_CHILD) {
  // Playwright uses local pipes. macOS denies outgoing IP traffic for Node, Chrome and their descendants.
  const run = spawnSync("/usr/bin/sandbox-exec", ["-p", '(version 1)(allow default)(deny network-outbound (remote ip "*:*"))',
    process.execPath, script, mode], { stdio: "inherit", env: { ...process.env, DEBUG: "", PWDEBUG: "", QA_PAGES_SANDBOX_CHILD: "1" } });
  process.exitCode = run.status ?? 2;
} else {
  try { await main(mode); } catch (error) {
    if (mode === "--self-test") console.error(error.message.slice(0, 1000));
    console.error("Offline reader check failed. No case details were logged.");
    process.exitCode = 1;
  }
}
