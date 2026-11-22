import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument } from "pdf-lib";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { chromium, type Page } from "playwright-core";
import { makeCertificateScan } from "./kamil-demo-docs";
import { ZAM_TEMPLATE_SHA256 } from "../src/lib/forms/zam-map";
import type { KamilView } from "../src/lib/kamil/contract";
import { kamilCertificate } from "../src/lib/kamil/profile";

const certificate = { ...kamilCertificate("2026-05-24"), childFirstName: "IGOR", childLastName: "KLON", birthPlace: "OPOLE" };
const question = "Syn od stycznia będzie chodził do żłobka. Z czego możemy skorzystać?";
const digest = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");

async function scannedPdf() {
  const document = await PDFDocument.create();
  document.setTitle("Fikcyjny odpis · próba G6");
  document.setCreationDate(new Date("2026-11-22T00:00:00Z"));
  document.setModificationDate(new Date("2026-11-22T00:00:00Z"));
  const image = await document.embedJpg(makeCertificateScan(certificate));
  document.addPage([595, 842]).drawImage(image, { x: 0, y: 0, width: 595, height: 842 });
  return Buffer.from(await document.save());
}

async function pdfPages(bytes: Uint8Array) {
  const pdf = await getDocument({ data: Uint8Array.from(bytes), isEvalSupported: false }).promise;
  const pages: string[] = [];
  try {
    for (let n = 1; n <= pdf.numPages; n++) {
      const content = await (await pdf.getPage(n)).getTextContent();
      pages.push(content.items.flatMap(item => "str" in item ? [item.str] : []).join(" "));
    }
    return pages;
  } finally { await pdf.destroy(); }
}

async function getCase(page: Page): Promise<KamilView> {
  return page.evaluate(async () => {
    const response = await fetch("/api/kamil", { cache: "no-store" });
    if (!response.ok) throw Error("GET /api/kamil HTTP " + response.status);
    return (await response.json()).view;
  });
}

async function acceptance(origin: string, output: string) {
  const input = await scannedPdf();
  assert.deepEqual((await pdfPages(input)).map(page => page.trim()), [""], "Input must require OCR");
  const browser = await chromium.launch({ channel: "chrome" });
  try {
    const page = await browser.newPage();
    await page.goto(new URL("/app/kamil", origin).href);
    await page.waitForFunction(async () => (await (await fetch("/api/kamil")).json()).view?.version > 0);
    const saved = page.waitForResponse(r => new URL(r.url()).pathname === "/api/kamil" && r.request().method() === "POST" &&
      r.request().postDataJSON()?.command?.type === "set_candidates", { timeout: 90_000 });
    await page.locator('input[type="file"]').first().setInputFiles({ name: "odpis-g6-skan.pdf", mimeType: "application/pdf", buffer: input });
    const response = await saved;
    assert.equal(response.status(), 200);
    let view: KamilView = (await response.json()).view;
    const expected = { child_first_name: "IGOR", child_last_name: "KLON", child_birth_date: "2026-05-24", child_birth_place: "OPOLE" };
    for (const [key, value] of Object.entries(expected)) {
      const candidate = view.candidates.find(field => field.key === key);
      assert.equal(candidate?.value, value, key);
      assert.ok(candidate.origin.kind === "document" && candidate.origin.method === "ocr" && candidate.origin.page === 1);
    }
    for (const field of view.candidates) {
      view = await page.evaluate(async ({ version, field }) => {
        const res = await fetch("/api/kamil", { method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ expectedVersion: version, command: { type: "confirm", opKey: crypto.randomUUID(), key: field.key, value: field.value, origin: field.origin } }) });
        if (!res.ok) throw Error("confirm " + field.key + " HTTP " + res.status);
        return (await res.json()).view;
      }, { version: view.version, field });
    }
    await page.reload();
    const chat = page.getByRole("region", { name: "Czat z Zusikiem" });
    async function ask(text: string, route: string) {
      await chat.getByRole("textbox", { name: "Wiadomość do Zusika" }).fill(text);
      const [sent] = await Promise.all([
        page.waitForResponse(r => new URL(r.url()).pathname === route && r.request().method() === "POST", { timeout: 75_000 }),
        chat.getByRole("button", { name: "Wyślij", exact: true }).click(),
      ]);
      assert.equal(sent.status(), 200);
    }
    await ask("Od 15 grudnia 2026. Jeden tydzień, drugi zostawię na później", "/api/kamil");
    await ask("Nie", "/api/kamil");
    assert.equal((await getCase(page)).draft, null, "Eligibility alone must not create the draft");
    await page.getByRole("button", { name: "Przygotuj szkic ZAM" }).click();
    const download = page.getByRole("link", { name: "Pobierz PDF do wydruku" });
    await download.waitFor();
    const before = await getCase(page);
    assert.ok(before.draft && !before.draft.stale);
    await ask(question, "/api/zusik/ask");
    const answer = chat.locator("[data-knowledge-turn]").filter({ has: page.getByText(question, { exact: true }) });
    await answer.getByRole("button", { name: /^Źródło / }).first().waitFor({ timeout: 70_000 });
    await page.reload();
    await answer.getByRole("button", { name: /^Źródło / }).first().waitFor();
    assert.match(await answer.innerText(), /aktywnie w żłobku/iu);
    assert.deepEqual(await getCase(page), before, "The informational question must preserve the complete case after reload");
    const template = await page.request.get(new URL(before.form.templatePath, origin).href);
    assert.equal(digest(await template.body()), ZAM_TEMPLATE_SHA256);
    const bytes = Uint8Array.from(await download.evaluate(async node => Array.from(new Uint8Array(await (await fetch((node as HTMLAnchorElement).href)).arrayBuffer()))));
    const pages = await pdfPages(bytes);
    assert.equal(pages.length, 7);
    assert.match(pages[1], /15\.12\.2026\s*–\s*21\.12\.2026/u);
    assert.match(pages[2], /IGOR KLON/u);
    assert.match(pages[2], /DATA URODZENIA:\s*24\.05\.2026/u);
    assert.match(pages[2], /MIEJSCE URODZENIA:\s*OPOLE/u);
    await mkdir(output, { recursive: true });
    await writeFile(join(output, "odpis-g6-skan.pdf"), input);
    await writeFile(join(output, "zam-g6.pdf"), bytes);
    console.log(JSON.stringify({ origin, inputSha256: digest(input), ocrPage: 1, expected, caseVersion: before.version,
      draftVersion: before.draft.version, draftStale: before.draft.stale, restoredCaseIdentical: true,
      start: before.result.period?.start, end: before.result.period?.end, deadline: before.result.deadline,
      templateVersion: before.form.version, templateSha256: ZAM_TEMPLATE_SHA256, outputSha256: digest(bytes), pages: pages.length }));
  } finally { await browser.close(); }
}

acceptance(process.argv[2], process.argv[3]).catch(error => { console.error(error); process.exitCode = 1; });
