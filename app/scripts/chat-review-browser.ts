import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { chromium } from "playwright-core";

const origin = new URL(process.argv[2] ?? "http://127.0.0.1:3914");
if (!["localhost", "127.0.0.1"].includes(origin.hostname)) throw Error("Użyj lokalnego Preview.");
async function payroll(amount: string) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage();
  page.drawText("Zestawienie wynagrodzen\nMiesiac | Brutto\n2026-02 | " + amount + "\nPRIVATE-SYNTHETIC-MARKER", { size: 12, x: 40, y: 700 });
  return Buffer.from(await pdf.save());
}
async function run() {
  const browser = await chromium.launch({channel:"chrome"});
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
    page.setDefaultTimeout(20000);
    const writes: string[] = [];
    const intents: string[] = [];
    page.on("request", r => {
      if (r.method() === "GET") return;
      const path = new URL(r.url()).pathname;
      if (path.startsWith("/api/")) {
        assert.doesNotMatch(r.postData() ?? "", /PRIVATE-SYNTHETIC-MARKER|neutralny\.pdf|Zestawienie wynagrodzen|%PDF/);
        writes.push(r.method() + " " + path);
        if (path.endsWith("/messages")) intents.push(r.postDataJSON().intent);
      }
    });
    await page.goto(new URL("/app/rozmowa", origin).href);
    const attach = async (buffer: Buffer) => {
      const chooser = page.waitForEvent("filechooser");
      await page.getByRole("button", {name:"Dołącz PDF sprawy"}).click();
      await (await chooser).setFiles({name:"neutralny.pdf", mimeType:"application/pdf", buffer});
    };
    const original = await payroll("6000,00");
    await attach(original);
    const choose = page.getByRole("button", {name:/Wynagrodzenie brutto .*sprawdź stronę/});
    await choose.first().click();
    await page.getByLabel("Tytuł w tej sprawie").selectOption("title-A");
    await page.getByLabel("Płatnik w tej sprawie").selectOption("payer-P");
    const confirmed = page.waitForResponse(r => r.request().method() === "PATCH");
    await page.getByRole("button", {name:"Potwierdzam zapis"}).click();
    assert.equal((await confirmed).status(), 200);
    const source = page.getByRole("link", {name:"Dowód · strona 1 w PDF"}).first();
    await source.waitFor();
    assert.match((await source.getAttribute("href")) ?? "", /^blob:.+#page=1$/);
    await page.getByLabel("Osoba do oceny").selectOption("person-A");
    await page.getByLabel("Dzień oceny").fill("2026-02-15");
    await page.getByRole("button",{name:"Przelicz sprawę"}).click();
    await page.getByRole("region",{name:"Ocena sprawy"}).first().waitFor();
    await attach(await payroll("6500,00"));
    await page.getByRole("button",{name:"Uzupełnij tę sprawę"}).click();
    await page.getByRole("button",{name:/6\s?500,00.*sprawdź stronę/}).click();
    await page.getByLabel("Tytuł w tej sprawie").selectOption("title-A");
    await page.getByLabel("Płatnik w tej sprawie").selectOption("payer-P");
    await page.getByRole("button",{name:"Potwierdzam zapis"}).click();
    await page.getByRole("button",{name:"Potwierdź propozycję"}).click();
    await page.getByText(/Potwierdzono 6\s?500,00/).waitFor();
    const saved = new URL(page.url());
    assert.ok(saved.searchParams.get("sprawa"));
    const numWrites = writes.filter(w => !w.endsWith("/sessions")).length;
    await page.reload();
    await page.getByText(/Wynagrodzenie brutto · 6\s?500,00/).first().waitFor();
    await page.getByText(/Ocena historyczna/).first().waitFor();
    assert.equal(writes.filter(w => !w.endsWith("/sessions")).length, numWrites);
    assert.ok(await page.getByText(/Dołącz ponownie ten sam PDF/).count());
    const other = await browser.newPage();
    await other.goto(saved.href);
    await other.getByText(/Ta sprawa jest niedostępna/).waitFor();
    assert.equal(await other.getByText(/6\s?500,00/).count(), 0);
    assert.ok(!intents.includes("link_account"));
    await page.getByText("Sprawdź symulowane konto ZUS",{exact:true}).click();
    await page.getByLabel("Osoba na koncie").selectOption("person-A");
    await page.getByLabel("Scenariusz konta").selectOption("business-settlement");
    await page.getByRole("button",{name:"Powiąż konto z osobą"}).click();
    await page.getByLabel("Rejestr").selectOption("balance");
    await page.getByLabel("Początek odczytu").fill("2026-05-19");
    await page.getByLabel("Koniec odczytu").fill("2026-05-19");
    await page.getByRole("button",{name:"Odczytaj z konta"}).click();
    const accept = page.getByRole("button",{name:/Potwierdź z konta · Zadłużenie składkowe · 0,00/});
    await accept.click();
    await page.getByText("Symulowane konto ZUS",{exact:true}).waitFor();
    await page.reload();
    await page.getByText(/Zadłużenie składkowe · 0,00/).first().waitFor();
    assert.deepEqual(intents.slice(-3), ["link_account","read_account","declare_fact"]);
    await page.getByText("Historia rozmów",{exact:true}).click();
    await page.getByRole("button",{name:"Usuń tę sprawę"}).click();
    await page.getByRole("button",{name:"Tak, usuń sprawę"}).click();
    await page.waitForURL("**/app/rozmowa?nowa=1");
    const erased = await page.request.get(new URL("/api/v1/cases/" + saved.searchParams.get("sprawa"),origin).href);
    assert.equal(erased.status(),404);
    console.log("PASS 390 · PDF → 600000 gr → dowód strony 1 → ocena → drugi PDF → konflikt → 650000 gr → F5 bez zapisów → drugie cookie bez danych → jawne konto, saldo 0 gr z 19 maja → usunięta sprawa 404");
  } finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
