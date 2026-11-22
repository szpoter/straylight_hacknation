// Independent synthetic award. The PDFs contain only input fields, never the expected sum.
import assert from "node:assert/strict";
import { PDFDocument } from "pdf-lib";
import { chromium } from "playwright-core";

const origin = new URL(process.argv[2]);
assert.ok(origin.protocol === "http:" && ["127.0.0.1","localhost"].includes(origin.hostname));
async function packet(pages) {
  const pdf = await PDFDocument.create();
  for (const lines of pages) {
    const p = pdf.addPage();
    lines.forEach((line,i) => p.drawText(line,{x:20,y:780 - i * 25,size:12}));
  }
  return Buffer.from(await pdf.save());
}
const original = await packet([
  ["Zaswiadczenie o porodzie","Data porodu: 03.11.2026"],
  ["Poswiadczenie ubezpieczenia","Stan na dzien: 03.11.2026","Tytul ubezpieczenia: pracownik",
    "Liczba ubezpieczonych na dzien 30.11.2025: 29","Ubezpieczenie chorobowe: podlega"],
  ["Wniosek o zasilek macierzynski","Okres wnioskowany: od 03.11.2026 do 11.11.2026",
    "Data zlozenia wniosku: 04.11.2026","Wybrany wariant: 100% / 70%"],
]);
const payroll = await packet([["Z-3 - zaswiadczenie platnika","Stan na dzien: 03.11.2026",
  "Warunki zatrudnienia: pelny etat, stale wynagrodzenie, pelne miesiace",
  "Miesiac nalezny | Kwota po potraceniu skladek",
  ...Array.from({length:12}, (_,i) => new Date(Date.UTC(2025,10+i,1)).toISOString().slice(0,7) + " | " + (i<6 ? "6027,42" : "6627,42"))]]);
const browser = await chromium.launch({channel:"chrome"});
try {
  for (const width of [1440,390]) {
    const page = await browser.newPage({ viewport:{width,height:844}, isMobile:width===390, hasTouch:width===390 });
    try {
      await page.goto(new URL("/app/rozmowa",origin).href);
      for (const [idx,bytes] of [original,payroll].entries()) {
        const chooser = page.waitForEvent("filechooser");
        await page.getByRole("button",{name:"Dołącz PDF sprawy"}).click();
        await (await chooser).setFiles({name:"dowod-qa.pdf",mimeType:"application/pdf",buffer:bytes});
        if (idx) await page.getByRole("button",{name:"Uzupełnij tę sprawę"}).click();
        const section = page.getByRole("log").locator("section").filter({
          has:page.getByRole("link",{name:"Otwórz własny PDF"}), hasText:idx ? "Liczba stron: 1." : "Liczba stron: 3.",
        }).first();
        await section.getByText(/^Sprawdź pola dokumentu/).click();
        await section.getByLabel("Osoba z dokumentu").selectOption("person-A");
        await section.getByLabel("Tytuł z dokumentu").selectOption("title-A");
        await section.getByLabel("Płatnik z dokumentu").selectOption("payer-P");
        await section.getByLabel("Data oceny sprawy").fill("2026-11-14");
        await section.getByRole("button",{name:"Potwierdź wybrane pola i oceń sprawę"}).click();
        const card = page.getByRole("region",{name:"Ocena sprawy",exact:true}).last();
        await card.getByText(/Przysługuje · od 2026-11-03 do 2026-11-11/).waitFor();
        await card.getByText(idx ? /Kwota: 1\s?898,19.*brutto/ : /Kwota: Brakuje danych/).waitFor();
        if (idx) {
          await card.getByText("Dlaczego taki wynik?").click();
          assert.match(await card.innerText(),/9 dni × 210,91/);
          await card.getByRole("link",{name:"Dowód · strona 1 w PDF"}).first().waitFor();
          await page.reload();
          await page.getByRole("region",{name:"Ocena sprawy",exact:true}).last().getByText(/Kwota: 1\s?898,19/).waitFor();
        }
      }
      console.log("PASS",width,"entitlement without payroll, nine days, evaluated amount, evidence and F5");
    } finally { await page.close(); }
  }
} finally { await browser.close(); }
