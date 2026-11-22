import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { chromium } from "playwright-core";

async function run() {
  const target = new URL("/app/rozmowa", process.argv[2] ?? "http://127.0.0.1:3914");
  assert.ok(["localhost", "127.0.0.1"].includes(target.hostname));
  const pdf = await PDFDocument.create();
  pdf.addPage().drawText("Lista plac. PRIVATE-SYNTHETIC-ROW. Kwota w tabeli 6537,15 PLN.", {x:20,y:700,size:12});
  pdf.addPage().drawText("Decyzja. Przyznano swiadczenie. PRIVATE-SYNTHETIC-ROW.", {x:20,y:700,size:12});
  const browser = await chromium.launch({channel:"chrome"});
  try {
    const page = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    page.on("request", r => assert.doesNotMatch(r.postData() ?? "",/PRIVATE-SYNTHETIC-ROW|umowna\.pdf|%PDF/));
    await page.goto(target.href);
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("button",{name:"Dołącz PDF sprawy"}).click();
    await (await chooser).setFiles({name:"umowna.pdf",mimeType:"application/pdf",buffer:Buffer.from(await pdf.save())});
    await page.getByText(/Brak automatycznie rozpoznanych pól/).waitFor();
    await page.getByText("Strona 1",{exact:true}).click();
    await page.getByRole("button",{name:"Przepisz pole ze strony 1"}).click();
    assert.equal(await page.getByRole("button",{name:"Przepisz pole ze strony 2",includeHidden:true}).count(),0);
    assert.match((await page.getByRole("link",{name:"Sprawdź oryginał · strona 1"}).getAttribute("href")) ?? "",/^blob:.*#page=1$/);
    await page.getByLabel("Kwota w złotych").fill("6537,15");
    await page.getByLabel("Obowiązuje od").fill("2026-02-01");
    await page.getByLabel("Obowiązuje do").fill("2026-02-28");
    await page.getByLabel("Tytuł w tej sprawie").selectOption("title-A");
    await page.getByLabel("Płatnik w tej sprawie").selectOption("payer-P");
    const patch = page.waitForResponse(r => r.request().method() === "PATCH");
    await page.getByRole("button",{name:"Potwierdzam zapis"}).click();
    const res = await patch;
    assert.equal(res.status(),200);
    const fact = res.request().postDataJSON().changes.at(-1).fact;
    assert.deepEqual(fact.value,{kind:"money",currency:"PLN",grosze:653715});
    assert.equal(fact.source.page,1);
    assert.equal(fact.source.kind,"document");
    await page.reload();
    await page.getByText(/Wynagrodzenie brutto · 6\s?537,15/).waitFor();
    await page.getByText(/Dowód · strona 1/).waitFor();
    console.log("PASS 390 · brak kandydatów → ręczny zapis 653715 gr za luty ze strony 1 → źródło po F5 · strona decyzji wykluczona");
  } finally { await browser.close(); }
}
run().catch(e => {console.error(e);process.exitCode = 1;});
