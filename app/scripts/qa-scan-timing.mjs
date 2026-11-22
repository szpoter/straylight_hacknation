// Run on macOS against a local build with a test database. Each PDF is generated here.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { PDFDocument } from "pdf-lib";
import { chromium } from "playwright-core";

const origin = new URL(process.argv[2]);
assert.ok(origin.protocol === "http:" && ["127.0.0.1", "localhost"].includes(origin.hostname));

async function packet(page, count) {
  const png = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 720;
    canvas.height = 970;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.font = "26px Arial";
    ctx.fillText("Zaswiadczenie o porodzie", 55, 100);
    ctx.fillText("Data porodu: 03.11.2026", 55, 160);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  const pdf = await PDFDocument.create();
  const scan = await pdf.embedPng(Buffer.from(png, "base64"));
  for (let i = 0; i < count; i++) pdf.addPage([480, 647]).drawImage(scan, { x:0, y:0, width:480, height:647 });
  return Buffer.from(await pdf.save());
}

async function measure(context, cdp, count, width, cache) {
  const page = await context.newPage();
  try {
    await page.goto(new URL("/app/rozmowa?nowa=1", origin).href);
    const bytes = await packet(page, count);
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button", { name:"Dołącz PDF sprawy" }).click();
    const input = await chooser;
    let peakKiB = 0;
    let timedOut = false;
    const sample = async () => {
      const { processInfo } = await cdp.send("SystemInfo.getProcessInfo");
      const pids = processInfo.map(p => Number(p.id)).filter(Number.isSafeInteger);
      const rss = execFileSync("ps", ["-o", "rss=", "-p", pids.join(",")], { encoding:"utf8" });
      peakKiB = Math.max(peakKiB, rss.trim().split(/\s+/).reduce((n, v) => n + Number(v), 0));
    };
    await sample();
    const start = performance.now();
    await input.setFiles({ name:"proba-skanu.pdf", mimeType:"application/pdf", buffer:bytes });
    const progress = page.getByRole("button", { name:"Anuluj odczyt" });
    await progress.waitFor({ timeout:30000 });
    const progressMs = Math.round(performance.now() - start);
    const review = page.getByText(/^Sprawdź pola dokumentu/).first();
    while (!await review.isVisible()) {
      if (performance.now() - start > 5 * 60000) { timedOut = true; break; }
      await sample();
      await page.waitForTimeout(250);
    }
    const reviewMs = Math.round(performance.now() - start);
    await sample();
    console.log(JSON.stringify({ width, count, cache, progressMs, reviewMs, browserPeakRssMiB:Math.round(peakKiB / 1024), timedOut }));
    assert.ok(!timedOut && peakKiB > 0);
    await page.getByRole("link", { name:"Otwórz własny PDF" }).first().waitFor();
    return progressMs <= 2000;
  } finally { await page.close(); }
}

let onTime = true;
for (const width of [1440, 390]) {
  for (const count of [8, 20, 52, 74]) {
    const browser = await chromium.launch({ channel:"chrome" });
    try {
      const context = await browser.newContext({ viewport:{ width, height:844 }, isMobile:width === 390, hasTouch:width === 390 });
      const cdp = await browser.newBrowserCDPSession();
      for (const cache of ["cold", "warm"]) {
        if (!await measure(context, cdp, count, width, cache)) onTime = false;
      }
    } finally { await browser.close(); }
  }
}
assert.ok(onTime, "Progress took more than two seconds");
