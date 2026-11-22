// Synthetic browser replay, two tabs of one session and a second isolated browser context.
import assert from "node:assert/strict";
import { chromium } from "playwright-core";
import { PDFDocument } from "pdf-lib";

const origin = new URL(process.argv[2]);
assert.ok(origin.protocol === "http:" && ["localhost", "127.0.0.1"].includes(origin.hostname));
const pdf = await PDFDocument.create();
pdf.addPage().drawText("Zestawienie wynagrodzen\nMiesiac | Brutto\n2026-02 | 7123,40", { x: 40, y: 700 });
const buffer = Buffer.from(await pdf.save());
const browser = await chromium.launch({ channel:"chrome" });
try {
  const ctx = await browser.newContext({viewport:{width:1440,height:900}});
  const first = await ctx.newPage();
  first.setDefaultTimeout(20000);
  await first.goto(new URL("/app/rozmowa",origin).href);
  const chooser = first.waitForEvent("filechooser");
  await first.getByRole("button",{name:"Dołącz PDF sprawy"}).click();
  await (await chooser).setFiles({name:"test.pdf",mimeType:"application/pdf",buffer});
  await first.getByRole("button",{name:/Wynagrodzenie brutto .*sprawdź stronę/}).click();
  await first.getByLabel("Tytuł w tej sprawie").selectOption("title-A");
  await first.getByLabel("Płatnik w tej sprawie").selectOption("payer-P");
  const responses = [];
  let attempts = 0;
  await first.route("**/api/v1/profiles/*", async route => {
    if (route.request().method() !== "PATCH") return route.continue();
    attempts++;
    const response = await route.fetch();
    assert.equal(response.status(),200);
    responses.push({ key:route.request().headers()["idempotency-key"], revision:(await response.json()).revision });
    if (attempts === 1) return route.abort("connectionreset");
    return route.fulfill({response});
  });
  await first.getByRole("button",{name:"Potwierdzam zapis"}).click();
  await first.getByRole("button",{name:"Ponów próbę"}).click();
  const edit = p => p.getByRole("button",{name:"Popraw",exact:true});
  await edit(first).waitFor();
  assert.equal(attempts,2);
  assert.ok(responses[0].key);
  assert.deepEqual(responses[0],responses[1]);
  await first.unrouteAll({behavior:"wait"});

  const second = await ctx.newPage();
  const saved = first.url();
  await second.goto(saved);
  await Promise.all([edit(first).click(),edit(second).click()]);
  await first.getByLabel("Kwota w złotych").fill("7310,20");
  await second.getByLabel("Kwota w złotych").fill("7999,99");
  async function submit(page) {
    const response = page.waitForResponse(r => r.request().method() === "PATCH");
    await page.getByRole("button",{name:"Potwierdzam zapis"}).click();
    return (await response).status();
  }
  assert.equal(await submit(first),200);
  assert.equal(await submit(second),412);
  await second.getByText(/Dane zmieniły się w innej karcie/).waitFor();
  await second.reload();
  await second.getByText(/Wynagrodzenie brutto · 7\s?310,20/).first().waitFor();
  assert.equal(await second.getByText(/7\s?999,99/).count(),0);
  assert.equal(await edit(second).count(),1);
  const other = await browser.newPage();
  await other.goto(saved);
  await other.getByText(/Ta sprawa jest niedostępna/).waitFor();
  assert.equal(await other.getByText(/7\s?310,20/).count(),0);
  const session = (await ctx.cookies()).find(c => c.name === "zusik_demo_session");
  assert.ok(session?.httpOnly && session.expires > Date.now()/1000);
  await ctx.addCookies([{...session,expires:Math.floor(Date.now()/1000)-1}]);
  assert.equal((await ctx.request.get(new URL("/api/v1/cases",origin).href)).status(),401);
  await first.reload();
  await first.getByText(/Ta sprawa jest niedostępna/).waitFor();
  assert.equal(await first.getByText(/7\s?310,20/).count(),0);
  console.log("PASS browser cookie expiry -> 401 and fresh UI without old case");
  console.log("PASS lost response + same operation key and revision; two edits 200/412; F5 one winner; second session isolated");
} finally { await browser.close(); }
