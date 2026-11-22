import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { chromium, type Page } from "playwright-core";
import { syntheticCasePdf } from "../tests/fixtures/case-import-pdf";

const target = new URL("/app/rozmowa", process.argv[2] ?? "http://127.0.0.1:3914");
if (!["localhost", "127.0.0.1"].includes(target.hostname)) throw Error("Użyj lokalnego Preview.");
async function attach(page: Page, kind: "covered" | "excluded" | "payroll") {
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Dołącz PDF sprawy" }).click();
  await (await chooser).setFiles({name:"neutralny.pdf", mimeType:"application/pdf", buffer:Buffer.from(await syntheticCasePdf(kind))});
  if (kind === "payroll") await page.getByRole("button",{name:"Uzupełnij tę sprawę"}).click();
  const packet = page.getByRole("log").locator("section").filter({has:page.getByRole("link",{name:"Otwórz własny PDF"})}).filter({hasText:kind === "payroll" ? "Liczba stron: 1." : "Liczba stron: 4."}).first();
  await packet.getByText(/^Sprawdź pola dokumentu/).click();
  const form = packet.locator("form");
  await form.getByLabel("Osoba z dokumentu").selectOption("person-A");
  await form.getByLabel("Tytuł z dokumentu").selectOption("title-A");
  await form.getByLabel("Płatnik z dokumentu").selectOption("payer-P");
  await form.getByLabel("Data oceny sprawy").fill("2026-07-09");
  const saved = page.waitForResponse(r => r.request().method() === "POST" && new URL(r.url()).pathname.endsWith("/messages") && r.request().postDataJSON().validAt === "2026-07-09");
  await form.getByRole("button",{name:"Potwierdź wybrane pola i oceń sprawę"}).click();
  assert.equal((await saved).status(),201);
}
async function run() {
  const browser = await chromium.launch({ channel: "chrome" });
  try {
    for (const kind of ["excluded", "covered"] as const) {
      const context = await browser.newContext({viewport:{width:390,height:844}, isMobile:true, hasTouch:true});
      try {
        const page = await context.newPage();
        page.setDefaultTimeout(20000);
        page.on("request", r => {
          const payload = r.postData() ?? "";
          assert.doesNotMatch(payload,/Decyzja|99 999,99|neutralny\.pdf|%PDF|Poswiadczenie/);
          if (r.method() === "PATCH") {
            const changes = r.postDataJSON().changes;
            assert.ok(changes.length <= 25);
            assert.ok(changes.every((c: {fact?:{source:{page?:number}}}) => c.fact?.source.page !== 4));
          }
        });
        await page.goto(target.href);
        await attach(page,kind);
        const cards = page.getByRole("region",{name:"Ocena sprawy",exact:true});
        const current = cards.last();
        await current.getByText(kind === "excluded" ? /^Nie przysługuje ·/ : /^Przysługuje ·/).waitFor();
        const caseId = new URL(page.url()).searchParams.get("sprawa");
        assert.ok(caseId);
        if (kind === "excluded") {
          await current.getByText("Dlaczego taki wynik?").click();
          assert.ok(await current.getByRole("link",{name:"Dowód · strona 3 w PDF"}).count());
          assert.equal(await current.getByRole("link",{name:"Dowód · strona 4 w PDF"}).count(),0);
        } else {
          await current.getByText("Kwota: Brakuje danych").waitFor();
          await attach(page,"payroll");
          await current.getByText(/Kwota: 2\s?416,12.*brutto/).waitFor();
          await current.getByText("Dlaczego taki wynik?").click();
          const trace = await current.innerText();
          assert.match(trace,/5\s?177,40/); assert.match(trace,/6 dni × 172,58/); assert.match(trace,/8 dni × 172,58/);
          assert.equal(new URL(page.url()).searchParams.get("sprawa"),caseId);
          await page.getByRole("textbox",{name:"Wiadomość do Zusika"}).fill("Skąd ta kwota?");
          await page.getByRole("button",{name:"Wyślij"}).click();
          await page.getByRole("log").getByText("Skąd ta kwota?",{exact:true}).waitFor();
          const revised = await PDFDocument.create();
          revised.addPage().drawText("Zestawienie wynagrodzen\nMiesiac | Brutto\n2026-02 | 6500,00", { size: 12, x: 40, y: 700 });
          const chooser = page.waitForEvent("filechooser");
          await page.getByRole("button",{name:"Dołącz PDF sprawy"}).click();
          await (await chooser).setFiles({name:"korekta.pdf",mimeType:"application/pdf",buffer:Buffer.from(await revised.save())});
          await page.getByRole("button",{name:"Uzupełnij tę sprawę"}).click();
          await page.getByRole("button",{name:/6\s?500,00.*sprawdź stronę/}).click();
          await page.getByLabel("Tytuł w tej sprawie").selectOption("title-A");
          await page.getByLabel("Płatnik w tej sprawie").selectOption("payer-P");
          await page.getByRole("button",{name:"Potwierdzam zapis"}).click();
          await page.getByRole("button",{name:"Potwierdź propozycję"}).click();
          await cards.last().getByText(/Kwota: 2\s?435,58.*brutto/).waitFor();
          await page.reload();
          await cards.last().getByText(/Kwota: 2\s?435,58.*brutto/).waitFor();
          assert.equal(new URL(page.url()).searchParams.get("sprawa"),caseId);
          await cards.last().getByText(/Zmiana kwoty:.*19,46/).waitFor();
          assert.ok(await page.getByText(/Ocena historyczna/).count());
        }
        console.log("PASS",kind,kind === "excluded" ? "odmowa · źródło str. 3 · decyzja str. 4 poza oceną" : "prawo bez płacy → drugi PDF → 241612 gr · podstawa 517740 · 14 × 17258 · korekta → 243558 gr · F5");
      } finally { await context.close(); }
    }
  } finally { await browser.close(); }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
