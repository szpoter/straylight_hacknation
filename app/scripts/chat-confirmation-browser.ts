import assert from "node:assert/strict";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright-core";
import { syntheticCasePdf } from "../tests/fixtures/case-import-pdf";

async function run() {
  const url = new URL("/app/rozmowa", process.argv[2] ?? "http://127.0.0.1:3914");
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname));
  const weak = !process.argv.includes("--origin-etag");
  const browser = await chromium.launch({channel:"chrome"});
  try {
    const page = await browser.newPage({viewport:{width:390,height:844}});
    const submit = page.locator("button").filter({hasText:"Potwierdź wybrane pola i oceń sprawę"});
    let initialQuestion = false;
    let firstRead = true;
    const patches: number[] = [];
    await page.route("**/api/v1/cases/*/messages", async route => {
      const request = route.request();
      if (!initialQuestion && request.method() === "POST" && request.postDataJSON().intent === "ask_case") {
        initialQuestion = true;
        await delay(350);
        assert.equal(await submit.count(), 0);
      }
      await route.continue();
    });
    await page.route(/\/api\/v1\/profiles\/[^/?]+$/, async route => {
      const response = await route.fetch();
      const headers = response.headers();
      if (route.request().method() === "GET" && firstRead) {
        firstRead = false;
        await delay(350);
        assert.equal(await submit.count(), 0);
      }
      if (route.request().method() === "PATCH") patches.push(response.status());
      // A compressing intermediary can weaken the entity tag on GET and PATCH responses.
      if (weak && headers.etag && !headers.etag.startsWith("W/")) headers.etag = "W/" + headers.etag;
      await route.fulfill({response, headers});
    });
    await page.goto(url.href);
    const buffer = Buffer.from(await syntheticCasePdf("covered"));
    async function pick() {
      const chooser = page.waitForEvent("filechooser");
      await page.getByRole("button",{name:"Dołącz PDF sprawy"}).click();
      await (await chooser).setFiles({name:"test.pdf",mimeType:"application/pdf",buffer});
    }
    await pick();
    await page.getByText(/^Sprawdź pola dokumentu/).click();
    assert.ok(initialQuestion && !firstRead);
    await page.getByLabel("Osoba z dokumentu").selectOption("person-A");
    await page.getByLabel("Tytuł z dokumentu").selectOption("title-A");
    await page.getByLabel("Płatnik z dokumentu").selectOption("payer-P");
    await page.getByLabel("Data oceny sprawy").fill("2026-07-09");
    const firstPatch = page.waitForResponse(r => r.request().method() === "PATCH");
    await submit.click();
    const result = await firstPatch;
    console.log("First PATCH", result.status(), "If-Match", result.request().headers()["if-match"]?.startsWith("W/") ? "weak" : "strong");
    assert.equal(result.status(), 200);
    await page.getByRole("region",{name:"Ocena sprawy",exact:true}).getByText(/^Przysługuje ·/).waitFor();
    assert.deepEqual(patches,[200,200]);
    const old = result.request();
    const stale = await page.request.patch(old.url(), {data:old.postDataJSON(), headers:{
      Origin:url.origin, "If-Match":old.headers()["if-match"], "Idempotency-Key":crypto.randomUUID(),
    }});
    assert.equal(stale.status(), 412);
    await page.reload();
    await page.getByText(/Dołącz ponownie ten sam PDF/).first().waitFor();
    firstRead = true;
    await pick();
    await page.getByRole("button",{name:"Uzupełnij tę sprawę"}).click();
    await page.getByText(/^Sprawdź pola dokumentu/).waitFor();
    assert.equal(firstRead, false);
    assert.deepEqual(patches,[200,200]);
    console.log("PASS delayed initial ask_case and profile GET · one confirmation · two PATCH 200 · assessment visible · stale PATCH 412");
  } finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
