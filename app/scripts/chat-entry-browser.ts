import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { chromium } from "playwright-core";
import { chatStarters } from "../src/lib/zusik/conversation";

const target = new URL(process.argv[2] ?? "http://127.0.0.1:3913/app/rozmowa");
const fixture = process.argv.includes("--fixture-legacy");
if (!["localhost", "127.0.0.1"].includes(target.hostname)) throw Error("Próba wymaga lokalnego Preview.");
const question = process.argv.includes("--public-sources") ? "Jakie dokumenty dołączyć do wniosku o urlop rodzicielski?" : "Co umiesz?";

async function run() {
  const pdf = await PDFDocument.create();
  pdf.addPage().drawText("Syntetyczny dokument testowy. Wniosek o urlop rodzicielski.");
  const buffer = Buffer.from(await pdf.save());
  const browser = await chromium.launch({ channel: "chrome" });
  try {
    for (const width of [390, 1280]) {
      for (const entry of [...chatStarters, { label: "Tekst", prompt: question }, { label: "PDF", prompt: "" }]) {
        const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: "reduce" });
        try {
          const page = await context.newPage();
          page.setDefaultTimeout(15000);
          const sent: string[] = [];
          page.on("request", r => {
            if (r.method() !== "POST") return;
            const path = new URL(r.url()).pathname;
            if (path.endsWith("/ask")) sent.push(r.postDataJSON().question);
            if (path.endsWith("/messages")) sent.push(r.postDataJSON().publicQuestion);
            if (path.startsWith("/api/")) assert.doesNotMatch(r.postData() ?? "", /Syntetyczny dokument testowy|neutralny\.pdf|%PDF/);
          });
          if (fixture) {
            await page.route("**/api/zusik/session", r => r.fulfill({ json: { session: "existing" } }));
            await page.route("**/api/zusik/state?*", r => r.fulfill({ json: { view: { turns: [] } } }));
            await page.route("**/api/zusik/ask", r => r.fulfill({ json: { status: "conversation", message: "Odpowiedź testowa." } }));
          }
          await page.goto(target.href);
          const chat = page.getByRole("region", { name: "Czat z Zusikiem" });
          const starters = chat.getByRole("group", { name: "Zacznij od pytania" });
          await starters.waitFor();
          assert.equal(await starters.getByRole("button").count(), 3);
          const input = chat.getByRole("textbox", { name: "Wiadomość do Zusika" });
          assert.ok(await input.isEditable());
          await chat.getByRole("button", { name: "Dołącz PDF sprawy" }).waitFor();
          if (entry.label === "PDF") {
            const chooser = page.waitForEvent("filechooser");
            await chat.getByRole("button", { name: "Dołącz PDF sprawy" }).click();
            await (await chooser).setFiles({ name: "neutralny.pdf", mimeType: "application/pdf", buffer });
            await chat.getByRole("log").getByText("neutralny.pdf", { exact: true }).waitFor({ timeout: 60000 });
            assert.equal(sent.filter(Boolean).length, 0);
          } else {
            const posted = page.waitForResponse(r => r.request().method() === "POST" && /\/(ask|messages)$/.test(new URL(r.url()).pathname));
            if (entry.label === "Tekst") {
              await input.fill(entry.prompt);
              await chat.getByRole("button", { name: "Wyślij" }).click();
            } else {
              await starters.getByRole("button", { name: entry.label }).click();
            }
            assert.ok((await posted).ok());
            await chat.getByRole("log").getByText(entry.prompt, { exact: true }).waitFor();
            assert.deepEqual(sent, [entry.prompt]);
          }
          assert.equal(new URL(page.url()).pathname, "/app/rozmowa");
          assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
          console.log("PASS", width, entry.label);
        } finally { await context.close(); }
      }
    }
  } finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
