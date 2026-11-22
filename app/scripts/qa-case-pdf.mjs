// Local browser baseline. All PDFs are generated here, without reading case files.
import assert from "node:assert/strict";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { chromium } from "playwright-core";

const url = new URL(process.argv[2]);
assert.equal(url.protocol, "http:");
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(url.hostname));
const browser = await chromium.launch({ channel: "chrome", headless: true });
const rows = [];
try {
  for (const mobile of [false, true]) {
    const context = await browser.newContext({
      viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
      isMobile: mobile, hasTouch: mobile, serviceWorkers: "block", reducedMotion: "reduce",
    });
    try {
      const page = await context.newPage();
      page.setDefaultTimeout(20000);
      await page.goto(new URL("/app/rozmowa", url).href);
      const attach = page.getByRole("button", { name: "Dołącz PDF sprawy" });
      await attach.waitFor();
      await page.waitForLoadState("networkidle");
      const chooser = page.waitForEvent("filechooser");
      await attach.click();

      const pdf = await PDFDocument.create();
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      pdf.addPage().drawText("SYNTHETIC TEST - cover sheet", { font });
      pdf.addPage().drawText("Zaswiadczenie. Miesieczna podstawa: 7239,30 PLN.", { font });
      // Source document deliberately contains no daily amount (7239.30 / 30 = 241.31).
      const attempted = [];
      await context.routeWebSocket("**/*", ws => { attempted.push("websocket"); ws.close(); });
      await context.route("**/*", route => {
        const request = route.request();
        const target = new URL(request.url());
        if (target.origin === url.origin && request.method() === "GET" &&
            !target.search && /^\/(?:_next\/static|pdfjs|ocr)\//.test(target.pathname))
          return route.continue();
        attempted.push(target.origin !== url.origin ? "external" : target.pathname.startsWith("/api/") ? "app-api" : "other-local");
        return route.abort();
      });
      await (await chooser).setFiles({
        name: "zalacznik-qa.pdf", mimeType: "application/pdf", buffer: Buffer.from(await pdf.save()),
      });
      await page.getByRole("link", { name: "Otwórz własny PDF" }).waitFor();
      const ask = async question => {
        await page.getByRole("textbox", { name: "Wiadomość do Zusika" }).fill(question);
        await page.getByRole("button", { name: "Wyślij", exact: true }).click();
        await page.getByRole("log").getByText(question, { exact: true }).waitFor();
      };
      await ask("Jaka jest miesięczna podstawa według dokumentu?");
      const source = page.getByRole("link", { name: "Otwórz stronę 2 w PDF" }).first();
      const href = await source.getAttribute("href");
      const evidence = href?.startsWith("blob:") && href.endsWith("#page=2") &&
        (await page.locator("blockquote").allTextContents()).some(text => text.includes("7239,30"));
      await ask("Ile wynosi kwota za jeden dzień przy stawce 100%?");
      const daily = (await page.getByRole("log").innerText()).includes("241,31");
      const blockedRequests = attempted.length;
      const blockedKinds = [...new Set(attempted)];
      await context.unrouteAll({ behavior: "wait" });
      await page.reload();
      await page.getByRole("textbox", { name: "Wiadomość do Zusika" }).waitFor();
      rows.push({ viewport: mobile ? "mobile-emulation" : "desktop", evidence, daily,
        restored: (await page.getByRole("log").innerText()).includes("7239,30"), blockedRequests, blockedKinds });
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
console.log(JSON.stringify(rows));
if (!rows.every(row => row.evidence && row.daily && row.restored && !row.blockedRequests)) process.exitCode = 1;
