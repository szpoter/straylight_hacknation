// From app/: node scripts/qa-private-pages.mjs --self-test | --edition | --work-diagnosis [--next-four] | --work-birth-dates [--whole-check] [--compare-app PATH] | --work-birth-regions | --leave-scans --compare-app PATH
import { workBirthReferences, compareWorkBirthDates } from "./qa-work-birth-browser.mjs";
import { compareLeaveScans } from "./qa-leave-scans.mjs";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readFile, realpath, appendFile, writeFile } from "node:fs/promises";
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
const roles = ["application", "certificate", "decision", "insurance", "payroll", "other", "medical_leave", "history"];
const safeFile = async pathname => {
  const stat = await lstat(pathname);
  assert.ok(!stat.isSymbolicLink() && stat.uid === process.getuid() && !(stat.mode & 0o077));
};

async function assets(readerApp = app, regions = false) {
  const compiled = await build({ stdin: { resolveDir: readerApp, contents:
    'export { readCaseDocuments } from "./src/features/chat/read-case-pdf.ts";export { analyzeCasePage } from "./src/features/chat/case-evidence.ts";' +
    (regions ? 'export { measureBirthRegions } from "./scripts/qa-birth-regions.mjs";' : "") },
    tsconfig: path.join(readerApp, "tsconfig.json"), bundle: true, write: false, platform: "browser", format: "iife",
    globalName: "qaReader", define: { "process.env.NODE_ENV": '"production"' }, logLevel: "silent" });
  const table = new Map([
    ["/", ["text/html", Buffer.from('<!doctype html><script src="/reader.js"></script>')]],
    ["/reader.js", ["text/javascript", compiled.outputFiles[0].contents]],
  ]);
  for (const p of ["/pdfjs/pdf.worker.min.mjs", "/ocr/worker.min.js", "/ocr/lang/pol.traineddata.gz",
    "/ocr/core/tesseract-core-lstm.wasm.js", "/ocr/core/tesseract-core-simd-lstm.wasm.js"]) {
    table.set(p, [p.endsWith(".gz") ? "application/octet-stream" : "text/javascript", await readFile(path.join(readerApp, "public", p))]);
  }
  return table;
}

async function readPages(page, bytes, copies, synthetic = false, diagnose = false) {
  return page.evaluate(async ({ encoded, copies, synthetic, diagnose }) => {
    const arr = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
    const files = Array.from({ length: copies }, (_, n) => new File([arr], "pakiet-" + n + ".pdf", { type: "application/pdf" }));
    const result = await qaReader.readCaseDocuments(files, {
      caseId: "offline", signal: AbortSignal.timeout(45 * 60_000), onProgress() {},
    });
    if (result.length !== 1) throw Error("dedup");
    const { pages } = result[0];
    if (synthetic && qaReader.measureBirthRegions) {
      const decision = pages[9];
      const trial = await qaReader.measureBirthRegions(arr, decision.page, decision);
      if (decision.status !== "excluded" || Object.keys(trial).length) throw Error("protected_region");
    }
    const problems = {}, signals = {};
    if (diagnose) for (const [index, p] of pages.entries()) {
      const text = p.text.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replaceAll("ł", "l");
      const preFilter = qaReader.analyzeCasePage("diagnosis", p.page, p.text, p.method, pages[index-1], 100);
      const numbers = /(?:\d{1,2}[.\/-]\d{1,2}[.\/-]\d{2,4}|\d+[,.]\d{2})/;
      const label = /wynagrodze|podstaw.{0,10}wymiar|okres.{0,10}(?:od|ubezpiecze)|data.{0,10}(?:urodz|porod|zloz)|kwota|skladk/;
      const lines = text.split(/\n/u);
      const nearby = lines.some((l, i) => label.test(l) && numbers.test(l + " " + (lines[i + 1] || "")));
      const legalWords = /zasilk|ubezpiecze|platnik|wnios|porod|wynagrodze|zaswiadcz|(?:^|\W)z[ -]?3(?:\W|$)/.test(text);
      const bucket = p.candidates.length ? "field_found" : p.leaveRequests?.length ? "leave_request_only"
        : p.status === "excluded" ? "decision_excluded"
        : !text.trim() ? "no_recognized_text"
        : p.method === "manual" || p.status === "manual" ? "reader_requires_review"
        : p.role === "other" ? (legalWords ? "unmatched_heading_with_form_terms" : "unmatched_heading_other_text")
        : preFilter.candidates.length ? "line_confidence_filtered_candidates"
        : p.reason === "ambiguous_field" ? "field_validation_or_ambiguous_layout"
        : nearby ? "recognized_role_label_near_number_unmapped" : "recognized_role_no_mapped_label";
      problems[bucket] = (problems[bucket] || 0) + 1;
      if (p.status === "excluded") continue;
      for (const [key, hit] of Object.entries({ labelNearNumber: nearby, multilineLabelWithNumber: lines.some((l,i) =>
          label.test(l) && !numbers.test(l) && numbers.test(lines[i+1] || "")), cleanTextThreshold: text.replace(/[^a-z0-9]/g,"").length >= 24,
          apparentTable: lines.some(l => /miesiac|brutto|potracen|wynagrodze/.test(l)) && lines.filter(l => numbers.test(l)).length >= 3,
          confidencePreventsCandidate: !p.candidates.length && preFilter.candidates.length > 0 })) {
        if (hit) signals[key] = (signals[key] || 0) + 1;
      }
    }
    return { pages: pages.length, methods: pages.map(p => p.method), statuses: pages.map(p => p.status),
      fields: pages.reduce((n, p) => n + p.candidates.length, 0),
      leavePages: pages.filter(p => p.leaveRequests?.length).length,
      fieldPages: pages.filter(p => p.candidates.length).length,
      problems, signals, roles: pages.map(p => p.role),
      protectedFields: pages.filter(p => p.role === "decision" || p.status === "excluded").reduce((n, p) => n + p.candidates.length + (p.leaveRequests?.length ?? 0), 0),
      synthetic: synthetic && {
        payroll: pages[10]?.candidates.map(c => [c.field, c.value.grosze, c.validFrom, c.validTo, c.locator.page, c.locator.column]),
        finePrintDate: pages[8]?.candidates.map(c => [c.field, c.value.date, c.locator.page]),
        finePrintDecision: pages[9]?.status === "excluded" && pages[9]?.candidates.length === 0,
        scanned: /KONTROLA/i.test(pages[2]?.text ?? ""),
        protection: pages[4]?.status === "excluded" && pages[4]?.candidates.length === 0,
        mentioned: pages[3]?.role,
        chosen: pages[5]?.candidates.some(c => c.field === "sicknessCoverage" && c.value.code === "covered"),
        unmarked: pages[6]?.candidates.some(c => c.field === "sicknessCoverage"),
        leaveOnly: pages[7]?.candidates.length === 0 && pages[7]?.leaveRequests?.length === 1 &&
          pages[7].leaveRequests[0].kind === "paternity",
      } };
  }, { encoded: bytes.toString("base64"), copies, synthetic, diagnose });
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
  pdf.addPage().drawText("Opis dla testera: zaswiadczenie platnika wystepuje gdzie indziej.");
  const hybrid = pdf.addPage([1200, 450]);
  hybrid.drawText("Decyzja o przyznaniu swiadczenia", { x: 80, y: 240 });
  hybrid.drawImage(picture, { x: 0, y: 0, width: 1200, height: 450 });
  for (const select of ["[X] podlega [ ] nie podlega", "[ ] podlega [ ] nie podlega"]) {
    const form = pdf.addPage();
    ["Poswiadczenie ubezpieczenia", "Stan na dzien: 14.11.2026", "Ubezpieczenie chorobowe: " + select]
      .forEach((line, i) => form.drawText(line, { x: 40, y: 720 - i * 36, size: 14 }));
  }
  const letter = pdf.addPage();
  ["Prosze o udzielenie mi urlopu ojcowskiego", "od 15.05.2026 do 21.05.2026"].forEach((line, i) =>
    letter.drawText(line, { x: 48, y: 700 - i * 36, size: 14 }));
  // A4 at 300 dpi, with a roughly five-point date field.
  for (const decision of [false, true]) {
    const scan = await page.evaluate(decision => {
      const canvas = document.createElement("canvas");
      canvas.width = 2480;
      canvas.height = 3508;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.font = "bold 48px Arial";
      ctx.fillText("Odpis skrócony aktu urodzenia", 240, 320);
      if (decision) ctx.fillText("Decyzja", 240, 220);
      ctx.font = "22px Arial";
      ctx.fillText("Data urodzenia dziecka: 17.04.2026", 240, 430);
      return canvas.toDataURL();
    }, decision);
    pdf.addPage([595, 842]).drawImage(await pdf.embedPng(scan), { x: 0, y: 0, width: 595, height: 842 });
  }
  const payroll = pdf.addPage();
  payroll.drawText("Lista plac", { x: 40, y: 720, size: 16 });
  for (const [x, heading, value] of [[40, "Rok", "2024"], [120, "Miesiac", "2"], [250, "Wynagrodzenie brutto", "4 012,33"]]) {
    payroll.drawText(heading, { x, y: 665, size: 12 });
    payroll.drawText(value, { x, y: 635, size: 12 });
  }
  const result = await readPages(page, Buffer.from(await pdf.save()), 2, true);
  assert.equal(result.leavePages, 1);
  assert.deepEqual(result.methods, ["pdf_text", "ocr", "ocr", "pdf_text", "ocr", "pdf_text", "pdf_text", "pdf_text", "ocr", "ocr", "pdf_text"]);
  assert.equal(result.statuses[1], "blank");
  assert.deepEqual(result.synthetic, { payroll: [["monthlyGrossPay", 401233, "2024-02-01", "2024-02-29", 11, 3]],
    finePrintDate: [["birthDate", "2026-04-17", 9]], finePrintDecision: true, scanned: true, protection: true, mentioned: "other", chosen: true, unmarked: false, leaveOnly: true });
}

function aggregate(records) {
  const counts = { files: 0, unique: 0, pages: 0, candidates: 0, leavePages: 0, fieldPages: 0, methods: {}, statuses: {}, roles: {}, protectedFields: 0, durationSeconds: 0 };
  for (const record of records) {
    counts.files += record.copies;
    counts.unique++;
    counts.pages += record.n;
    counts.candidates += record.fields;
    counts.leavePages += record.leavePages;
    counts.fieldPages += record.fieldPages;
    counts.durationSeconds += record.seconds;
    counts.protectedFields += record.protectedFields;
    for (const column of ["methods", "statuses", "roles"]) for (const [key, value] of Object.entries(record[column]))
      counts[column][key] = (counts[column][key] || 0) + value;
  }
  return counts;
}

async function runEdition(context, table, firstPage, rejected, diagnose, nextFour) {
  const keyPath = path.join(privateDir, "qa-edition-2026.json");
  await safeFile(privateDir);
  await safeFile(keyPath);
  const key = JSON.parse(await readFile(keyPath, "utf8"));
  const fingerprint = sha(Buffer.concat([await readFile(script), ...[...table.values()].map(([, bytes]) => bytes)]));
  const queue = key.cases;
  assert.equal(queue.length, 86);
  assert.equal(queue.reduce((n, c) => n + c.pages, 0), 2008);
  assert.equal(queue.reduce((n, c) => n + c.aliases.length, 0), 87);
  const root = await realpath(source);
  if (diagnose) {
    const start = nextFour ? 4 : 0;
    const work = queue.filter(c => c.proposedSplit === "work").slice(start, start + 4);
    assert.equal(work.length, 4);
    const exposurePath = path.join(privateDir, "qa-working-diagnosis-" + fingerprint + (nextFour ? "-next-four" : "") + ".json");
    const receipt = JSON.stringify({ version: 1, purpose: "local_diagnosis", known: work.map(c => c.id) });
    try { await writeFile(exposurePath, receipt, { flag: "wx", mode: 0o600 }); }
    catch (e) { if (e.code !== "EEXIST") throw e; await safeFile(exposurePath); assert.equal(await readFile(exposurePath,"utf8"),receipt); }
    const began = performance.now();
    const total = { workingPackages: work.length, pages: 0, fields: 0, protectedFields: 0, leavePages: 0, fieldPages: 0,
      statuses: Object.fromEntries(states.map(state => [state, 0])), problems: {}, signals: {} };
    for (const c of work) {
      const file = await realpath(path.resolve(root, c.aliases[0]));
      assert.ok(file.startsWith(root + path.sep));
      const bytes = await readFile(file);
      assert.equal(sha(bytes), c.sha);
      const r = await readPages(firstPage, bytes, 1, false, true);
      assert.equal(r.pages, c.pages);
      assert.equal(rejected(), 0);
      total.pages += r.pages;
      total.fields += r.fields;
      total.protectedFields += r.protectedFields;
      for (const state of r.statuses) { assert.ok(states.includes(state)); total.statuses[state]++; }
      total.leavePages += r.leavePages;
      total.fieldPages += r.fieldPages;
      for (const metric of ["problems", "signals"]) for (const [key, val] of Object.entries(r[metric]))
        total[metric][key] = (total[metric][key] || 0) + val;
    }
    console.log(JSON.stringify({ ...total, seconds: Math.round((performance.now() - began) / 1000) }));
    return;
  }
  const cache = path.join(privateDir, "qa-page-results-" + fingerprint + ".jsonl");
  let records = new Map();
  try {
    await safeFile(cache);
    const data = await readFile(cache, "utf8");
    records = new Map(data.trim().split("\n").filter(Boolean).map(line => { const r = JSON.parse(line); return [r.digest, r]; }));
  } catch (error) { if (error.code !== "ENOENT") throw error; }
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
          fields: result.fields, leavePages: result.leavePages, fieldPages: result.fieldPages, roles: count(result.roles, roles), protectedFields: result.protectedFields, seconds: Math.round((performance.now() - began) / 1000) };
        await appendFile(cache, JSON.stringify(record) + "\n", {mode: 0o600});
        records.set(c.sha, record);
      }
    }));
    console.log(JSON.stringify({ stage: holdout ? "provisional-holdout" : "edition",
      ...aggregate((holdout ? cases : queue).map(c => records.get(c.sha))), wallSeconds: Math.round((performance.now() - start) / 1000) }));
  }
}

async function main(mode, nextFour, wholeCheck) {
  // Refuse a forged child environment or a host without enforced IP denial.
  const denied = await new Promise(resolve => {
    const socket = connect(9, "127.0.0.1");
    socket.setTimeout(1000, () => { socket.destroy(); resolve(false); });
    socket.on("connect", () => { socket.destroy(); resolve(false); });
    socket.on("error", error => resolve(["EPERM", "EACCES"].includes(error.code)));
  });
  assert.ok(denied, "macOS network policy inactive");
  const references = mode === "--work-birth-dates" && workBirthReferences();
  const regions = mode === "--work-birth-regions";
  const samples = regions && [["work-prefix-geometry", workBirthReferences(true)], ["work-index-text", workBirthReferences()]];
  const currentTable = await assets(app, regions || mode === "--self-test");
  const baseTable = compareApp && await assets(await realpath(compareApp));
  let table = currentTable;
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
    if (mode === "--leave-scans") {
      await compareLeaveScans(page, async version => {
        table = version === "base" ? baseTable : currentTable;
        await page.reload();
      });
      assert.equal(blocked, 0);
      return;
    }
    if (references) {
      const selectVersion = baseTable && (async version => {
        table = version === "base" ? baseTable : currentTable;
        await page.reload();
      });
      return await compareWorkBirthDates(page, source, references, () => blocked, wholeCheck, selectVersion);
    }
    await preflight(page);
    assert.equal(blocked, 0);
    console.log("offline preflight: text, blank, OCR, duplicate, mixed decision, mentioned heading, marked and empty choices, leave-only request and fine-print scan pair and payroll columns passed");
    if (samples) {
      for (const [name, sample] of samples) await compareWorkBirthDates(page, source, sample, () => blocked, false, undefined, name);
      return;
    }
    if (mode !== "--self-test") await runEdition(context, table, page, () => blocked, mode === "--work-diagnosis", nextFour);
  } finally { await browser.close(); }
}

const [mode, ...options] = process.argv.slice(2);
const nextFour = mode === "--work-diagnosis" && options.length === 1 && options[0] === "--next-four";
const dateOptions = mode === "--work-birth-dates" || mode === "--leave-scans" ? [...options] : [];
const wholeCheck = dateOptions[0] === "--whole-check";
if (wholeCheck) dateOptions.shift();
const compareApp = dateOptions.length === 2 && dateOptions[0] === "--compare-app" && dateOptions[1];
const validDateOptions = mode === "--work-birth-dates" && (!dateOptions.length || compareApp);
const validLeaveOptions = mode === "--leave-scans" && compareApp && !wholeCheck;
if (!["--self-test", "--edition", "--work-diagnosis", "--work-birth-dates", "--work-birth-regions", "--leave-scans"].includes(mode) ||
    (mode === "--leave-scans" && !validLeaveOptions) || (options.length && !nextFour && !validDateOptions && !validLeaveOptions)) {
  console.error("Usage: node scripts/qa-private-pages.mjs --self-test | --edition | --work-diagnosis [--next-four] | --work-birth-dates [--whole-check] [--compare-app PATH] | --work-birth-regions | --leave-scans --compare-app PATH");
  process.exitCode = 2;
} else if (!process.env.QA_PAGES_SANDBOX_CHILD) {
  // Playwright uses local pipes. macOS denies outgoing IP traffic for Node, Chrome and their descendants.
  const run = spawnSync("/usr/bin/sandbox-exec", ["-p", '(version 1)(allow default)(deny network-outbound (remote ip "*:*"))',
    process.execPath, script, mode, ...options], { stdio: "inherit", env: { ...process.env, DEBUG: "", PWDEBUG: "", QA_PAGES_SANDBOX_CHILD: "1" } });
  process.exitCode = run.status ?? 2;
} else {
  try { await main(mode, nextFour, wholeCheck); } catch (error) {
    if (mode === "--self-test" || mode === "--leave-scans") console.error(error.message.slice(0, 1000));
    console.error("Offline reader check failed. No case details were logged.");
    process.exitCode = 1;
  }
}
