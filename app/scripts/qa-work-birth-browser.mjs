// The Python selector checks the work split and IP denial before writing to private FD 3.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument } from "pdf-lib";

export function workBirthReferences() {
  const selector = fileURLToPath(new URL("./qa-work-birth-reference.py", import.meta.url));
  const reference = spawnSync("python3", [selector, "--pipe"], { stdio: ["ignore", "ignore", "ignore", "pipe"], maxBuffer: 1_000_000 });
  assert.equal(reference.status, 0);
  const records = JSON.parse(reference.output[3]);
  assert.ok(Array.isArray(records) && records.length > 0);
  return records;
}

async function comparePage(page, root, entry, whole) {
  const physical = await realpath(path.resolve(root, entry.relative_path));
  assert.ok(physical.startsWith(root + path.sep));
  let bytes = await readFile(physical);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), entry.sha);
  assert.ok(/^\d{4}-\d{2}-\d{2}$/u.test(entry.date));
  const pdf = await PDFDocument.load(bytes);
  assert.ok(Number.isSafeInteger(entry.page) && entry.page >= 1 && entry.page <= pdf.getPageCount());
  if (!whole) {
    const one = await PDFDocument.create();
    const [copied] = await one.copyPages(pdf, [entry.page - 1]);
    one.addPage(copied);
    bytes = Buffer.from(await one.save());
  }
  return page.evaluate(async ({ encoded, reference, number }) => {
    const pdfBytes = Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
    const [doc] = await qaReader.readCaseDocuments([new File([pdfBytes], "working.pdf")], {
      caseId: "offline", signal: AbortSignal.timeout(45 * 60_000), onProgress() {},
    });
    const p = doc.pages[number - 1];
    if (p.page !== number) throw Error("source_page");
    const [year, month, day] = reference.split("-");
    const date = new RegExp(`\\b(?:${reference}|0?${Number(day)}([./-])0?${Number(month)}\\1(?:${year}))\\b`, "u");
    const fold = s => s.toLowerCase().normalize("NFD").replace(/\p{M}/gu, "").replaceAll("ł", "l");
    const label = /\bdata(?: i miejsce)? urodzenia\b/u;
    const lines = p.text.split("\n").map(fold);
    const candidates = p.candidates.filter(c => c.field === "birthDate");
    const correct = candidates.filter(c => c.value.date === reference);
    const located = correct.some(c => {
      const source = lines.slice(c.locator.lineStart - 1, c.locator.lineEnd).join(" ");
      return c.locator.page === number && c.locator.clientDocumentId === doc.metadata.clientDocumentId && label.test(source) && date.test(source);
    });
    const title = /odpis (?:skrocony|zupelny) aktu urodzenia/u;
    const same = lines.findIndex(l => label.test(l) && date.test(l));
    const missed = !correct.length && same >= 0;
    const titleIndex = lines.findIndex(l => title.test(l));
    const child = lines.findIndex(l => /\bdane dziecka\b/u.test(l));
    const parents = lines.findIndex((l, i) => i > same && /\bdane rodzicow\b/u.test(l));
    const structured = titleIndex >= 0 && child > titleIndex && same > child && parents > same;
    const prefix = titleIndex >= 0 ? lines[titleIndex].split(title)[0].trim() : "";
    return {
      pages: 1, manual: p.status === "manual", excluded: p.status === "excluded", certificate: p.role === "certificate",
      label: lines.some(l => label.test(l)), date: lines.some(l => date.test(l)), sameLine: same >= 0,
      agree: correct.length > 0, disagree: candidates.some(c => c.value.date !== reference), located,
      missedSameLine: missed, missedWithStructuredRows: missed && structured,
      missedAllRowsConfident: missed && structured && [titleIndex, child, same, parents].every(i => p.lines?.[i]?.confidence >= 80),
      missedCleanTitle: missed && titleIndex >= 0 && !prefix,
      missedSymbolTitlePrefix: missed && !!prefix && !/[\p{L}\d]/u.test(prefix),
      missedAlnumTitlePrefix: missed && /[\p{L}\d]/u.test(prefix),
      missedTrailingDateText: missed && !!lines[same].split(date).at(-1)?.trim(),
    };
  }, { encoded: bytes.toString("base64"), reference: entry.date, number: whole ? entry.page : 1 });
}

export async function compareWorkBirthDates(page, source, references, blocked, wholeCheck, selectVersion) {
  const root = await realpath(source);
  async function measure(version) {
    if (selectVersion) await selectVersion(version);
    const rows = [], counts = {}, packagesWithAgreement = new Set();
    for (const ref of references) {
      const result = await comparePage(page, root, ref, false);
      assert.equal(blocked(), 0);
      rows.push(result);
      for (const [key, value] of Object.entries(result)) counts[key] = (counts[key] ?? 0) + Number(value);
      if (result.agree) packagesWithAgreement.add(ref.sha);
    }
    console.log(JSON.stringify({ stage: "isolated-pages", version, packages: new Set(references.map(r => r.sha)).size,
      packagesWithAgreement: packagesWithAgreement.size, ...counts }));
    return rows;
  }
  const base = selectVersion ? await measure("base") : undefined;
  const current = await measure("current");
  const gained = current.map((row, i) => row.located && !base?.[i].located);
  if (base) console.log(JSON.stringify({ stage: "paired-pages", gained: gained.filter(Boolean).length,
    lost: current.filter((row, i) => !row.located && base[i].located).length }));
  if (wholeCheck) {
    const selected = gained.indexOf(true);
    const example = references[selected >= 0 ? selected : 0];
    for (const version of base ? ["base", "current"] : ["current"]) {
      if (selectVersion) await selectVersion(version);
      // Keep the multipage import in memory when the reader attempts to checkpoint it.
      await page.evaluate(() => Object.defineProperty(window, "indexedDB", { get() { throw Error("storage_blocked"); } }));
      const result = await comparePage(page, root, example, true);
      assert.equal(blocked(), 0);
      console.log(JSON.stringify({ stage: "whole-original", version, checked: 1, agreed: Number(result.agree),
        located: Number(result.located), disagreed: Number(result.disagree) }));
    }
  }
}
