import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { chromium, type Browser, type Page } from "playwright-core";
import { CHANNEL_LABEL, type Channel, type FormDef } from "../src/lib/demo/form-fields";
import { FORMS } from "../src/lib/demo/forms";

// All fields contain synthetic test data. Freeze the clock so leave notice periods are reproducible.
const pdfFonts = join(dirname(require.resolve("pdfjs-dist/package.json")), "standard_fonts/");
const fixtureDay = "2026-11-22";
const sample: Record<string, string> = {
  rodzic: "Marta Lis", dziecko: "Ola Lis", rodzic_pesel: "90051212349", dziecko_pesel: "26311000009",
  pracodawca: "Studio Lipa", imiona: "Ola", nazwisko: "Lis", miejsce: "Opole", miejscowosc: "Opole",
  email_kadr: "kadry@example.test", adres_pocztowy: "ul. Testowa 12, 45-001 Opole", zus_ade: "AE:PL-00000-00000-TESTY-00",
  adres: "ul. Testowa 8, 45-001 Opole", rachunek: "61109010140000071219812874",
  data_urodzenia: "2026-11-10", od: "2026-12-21", do: "2026-12-27", email: "marta@example.test", telefon: "500000000",
  placowka: "Szpital Miejski w Opolu", obywatelstwo: "polskie", rodzic_rodowe: "Nowak", rodzic_urodzenie: "1990-05-12", rodzic_miejsce: "Opole",
  drugi_rodowe: "Lis", drugi_urodzenie: "1944-05-14", drugi_miejsce: "Opole", drugi_obywatelstwo: "polskie",
  zameldowanie: "Opole, ul. Testowa 8", cel: "Prywatna dokumentacja rodzinna",
  logowanie: "Profil zaufany", platnosc: "Płatność online w usłudze gov.pl", podpis: "Podpis zaufany",
  podpis_poz: "Podpis kwalifikowany", dostep_ikp: "Tak",
  przychodnia: "Przychodnia Rodzinna", adres_przychodni: "ul. Testowa 2, 45-001 Opole", lekarz: "Ewa Nowak",
  imie: "Ola", rodzic_imie: "Marta", rodzic_nazwisko: "Lis", dziecko_imie: "Ola", dziecko_nazwisko: "Lis",
  termin: "2027-01-10", wykorzystane_moje: "0", wykorzystane_drugiego: "0", drugi: "Nie", wydluzenie: "Nie", wymiar: "1/4",
  rodzic_data: "1990-05-12", rodzic_obywatelstwo: "polskie", dziecko_obywatelstwo: "polskie",
  ulica: "Testowa", dom: "8", kod: "45-001", panstwo: "Polska", nip: "5250001003",
  drugi_rodzic: "Paweł Lis", drugi_pesel: "44051401359", drugi_opiekun: "Nie",
  dziecko_ulica: "Testowa", dziecko_dom: "8", dziecko_miasto: "45-001 Opole",
  opiekun_imie: "Marta", opiekun_nazwisko: "Lis", opiekun_telefon: "500000000",
  opiekun_ulica: "Testowa", opiekun_dom: "8", opiekun_miasto: "45-001 Opole",
  stan_cywilny: "Zamężna", praca: "Umowa o pracę", drugi_status: "Umowa o pracę", spoza_ue: "Nie", zagranica: "Nie",
  drugi_zagranica: "Nie", wniosek_zagranica: "Nie", naprzemienna: "Nie", swiadczenie_zagranica: "Nie", dziecko_zagraniczne: "Nie",
  pobyt_dokument: "Nie", utrata: "Nie", uzyskanie: "Nie", urzad_gmina: "Opole", adres_gmina: "Opole", urzad_miasto: "Opole", adres_miasto: "Opole",
  rodzina: "Paweł | Lis | 44051401359 | Małżonek", alimenty: "0", samotnie: "Nie", rolne: "Nie", nieopodatkowane: "Nie",
  urzad: "Urząd Miasta Opola", urzad_kod: "45-001", urzad_miejscowosc: "Opole", urzad_ulica: "Rynek", urzad_dom: "1",
  adres_kod: "45-001", adres_miejscowosc: "Opole", adres_ulica: "Testowa", adres_dom: "8", miejsce_urodzenia: "Opole",
};

const requiredFormIds = ["zglos-urodzenie", "macierzynski-przed", "urlop-ojcowski", "rodzicielski", "rodzicielski-praca", "zasilek-macierzynski", "ubezpieczenie-dziecka", "800plus", "becikowe", "odpis", "poz"];

async function fillFields(page: Page, form: FormDef, values: Record<string, string>) {
  for (const field of form.sections.flatMap(section => section.fields)) {
    const group = page.locator(`[id="pole-${field.id}"]`);
    if (!await group.isVisible()) continue;
    const wanted = values[field.id];
    if (field.type === "radio" || field.type === "select") {
      const options = field.options ?? [];
      const value = options.find(option => option === wanted) ?? options[0];
      assert.ok(value, `Brak odpowiedzi dla ${field.id}`);
      if (field.type === "select") await group.getByRole("combobox").selectOption(value);
      else await group.getByText(value, { exact: true }).click();
      continue;
    }
    const input = group.locator("input, textarea");
    if (wanted !== undefined) await input.fill(wanted);
    else if (field.required) assert.ok(await input.inputValue(), `Brak wartości testowej dla ${field.id} (${field.label})`);
  }
}

async function inspectPdf(page: Page, directory: string, key: string, fullLeave?: boolean) {
  const pending = page.waitForEvent("download");
  await page.locator("a[download]").click();
  const download = await pending;
  assert.match(download.suggestedFilename(), /\.pdf$/i);
  const path = join(directory, `${key}.pdf`);
  await download.saveAs(path);
  const pdf = await getDocument({ data: new Uint8Array(await readFile(path)), isEvalSupported: false, standardFontDataUrl: pdfFonts }).promise;
  try {
    const text: string[] = [];
    for (let index = 1; index <= pdf.numPages; index++) {
      const content = await (await pdf.getPage(index)).getTextContent();
      const pageText = content.items.map(item => "str" in item ? item.str : "").join("");
      text.push(pageText);
      if (fullLeave !== undefined && (index === 2 || index === 5)) {
        const marks = content.items.filter(item => "str" in item && item.str === "X");
        if (index === 2) {
          const intent = marks.some(item => "transform" in item && item.transform[4] >= 42 && item.transform[4] < 61 && item.transform[5] >= 303 && item.transform[5] < 321);
          assert.equal(intent, fullLeave, "ZAM: deklaracja pełnego wymiaru na stronie 2");
        } else {
          // Only parental or supplementary leave requires the other-parent declaration on page 5.
          assert.equal(marks.some(item => "transform" in item && Math.abs(item.transform[5] - 474) < 8), false);
        }
      }
    }
    const compact = text.join("").toLocaleLowerCase("pl").replace(/\s/g, "");
    assert.match(compact, /martalis|pawełlis|90051212349|olalis|26311000009/, `W pobranym PDF brakuje danych rodziny (${path})`);
    assert.doesNotMatch(compact, /undefined|\bszkic\b/);
    return pdf.numPages;
  } finally { await pdf.destroy(); }
}

async function checkChannel(browser: Browser, origin: string, directory: string, id: string, form: FormDef, channel: Channel, medic?: string) {
  const page = await browser.newPage({ locale: "pl-PL", timezoneId: "Europe/Warsaw", reducedMotion: "reduce" });
  try {
    page.setDefaultTimeout(15_000);
    await page.clock.setFixedTime(new Date(`${fixtureDay}T10:00:00Z`));
    // The shipped Ola plan includes completed cases. Start only this case afresh in an isolated browser profile.
    await page.addInitScript(({ id, fixtureDay }) => {
      if (sessionStorage.getItem("qa-case")) return;
      sessionStorage.setItem("qa-case", id);
      sessionStorage.setItem("przewodnik-rodzica:sesja-demo", JSON.stringify({ version: 1, method: "local", data: "local", loggedInAt: fixtureDay }));
      localStorage.setItem("zusik.state.v1", JSON.stringify({ patches: { ola: { [id]: { state: "aktualna", doc: { events: [], hasDraft: false, result: null, summons: null } } } } }));
    }, { id, fixtureDay });
    const response = await page.goto(`${origin}/dokumenty/${id}`);
    assert.equal(response?.status(), 200, `Błąd HTTP podczas otwierania ${id}`);
    await page.getByRole("button", { name: "Rozpocznij wniosek" }).click();
    await page.getByRole("heading", { name: form.name, exact: true }).waitFor();
    const values = { ...sample };
    const fullLeave = id === "zasilek-macierzynski" ? channel === "zus" : undefined;
    if (id === "zasilek-macierzynski") Object.assign(values, { od: values.data_urodzenia, do: "", caly_okres: fullLeave ? "Tak" : "Nie", platnik: ["pue", "zus", "edoreczenia"].includes(channel) ? "ZUS" : "Pracodawca" });
    if (id === "urlop-ojcowski") values.rodzic = "Paweł Lis";
    if (id === "ubezpieczenie-dziecka" && channel === "poczta") {
      Object.assign(values, {
        rodzic: "Roman Lis", rodzic_data: "1944-05-14", rodzic_pesel: "44051401359",
        pokrewienstwo: "Wnuk lub wnuczka", rodzice_bez_ubezpieczenia: "Tak", wymaga_zgloszenia: "Tak",
        orzeczenie: "Dziecko ma orzeczenie o niepełnosprawności", rodzaj_orzeczenia: "Orzeczenie dla dziecka poniżej 16 lat",
      });
    }
    if (id === "odpis" && channel === "govpl") Object.assign(values, { odbior: "Na skrzynkę do e-Doręczeń", ade: "AE:PL-00000-00001-TESTY-00" });
    if (id === "poz" && medic) values.medyk = medic;
    if (id === "becikowe" && channel === "poczta") {
      Object.assign(values, {
        kolejne_dzieci: ["Maja", "Iga", "Łucja", "Jan"].map((name, index) => `${name} | Lis | dok: TEST00${index} | 2026-11-10 | polskie`).join("\n"),
        nieopodatkowane: "Tak", dochody_osoby: "90051212349 | Stypendium | 1200,00",
        rolne: "Tak", hektary_osoby: "90051212349 | 1,25",
      });
    }
    await fillFields(page, form, values);
    await page.getByRole("button", { name: "Zapisz i sprawdź" }).click();
    const errors = page.locator("form [role=alert]");
    if (await errors.count()) throw new Error((await errors.allTextContents()).join(" / "));
    await page.getByRole("checkbox", { name: /Sprawdziłam/ }).check();
    if (id === "800plus" || id === "zglos-urodzenie") {
      assert.equal(form.pdf, "none");
      assert.equal(await page.locator("a[download], a[href^='blob:']").count(), 0);
    }
    await page.getByRole("button", { name: "Zatwierdź wniosek" }).click();
    await page.waitForURL(url => url.searchParams.get("krok") === "przekaz");
    assert.deepEqual(await page.getByRole("radio").evaluateAll(elements => elements.map(el => (el as HTMLInputElement).value)), form.channels);
    const delivery = CHANNEL_LABEL[channel];
    const receipt = delivery.mode === "online" ? form.receipts?.[channel] ?? delivery.receipt : undefined;
    await page.getByText(delivery.label, { exact: true }).click();
    let output: string;
    if (delivery.mode === "pdf") {
      const pages = await inspectPdf(page, directory, `${id}-${channel}${medic ? "-" + medic.split(" ")[0] : ""}`, fullLeave);
      const expected = id === "poz" ? 3 : id === "becikowe" && channel === "poczta" ? 14 : form.pdf === "official" ? 7 : 1;
      assert.equal(pages, expected, "Niekompletny wydruk lub załączniki");
      output = `${pages} str.`;
    } else {
      assert.equal(await page.locator("a[download]").count(), 0);
      if (delivery.mode === "osobiscie") await page.getByText("Co zabrać lub dołączyć", { exact: true }).waitFor();
      output = receipt ?? "wizyta";
    }
    const submit = page.getByRole("button", { name: /Symuluj|Załatwione w|Potwierdzam samodzielne przekazanie/i });
    await submit.click();
    await page.waitForURL(url => !url.searchParams.has("krok"));
    const notice = page.getByRole("status").filter({ hasText: receipt ?? /zapisano/i });
    await notice.first().waitFor();
    await page.reload();
    await page.locator(delivery.mode === "osobiscie" ? "#etap-wynik button" : "#etap-wyslano button").click();
    const timeline = await page.getByRole("region", { name: "Przebieg sprawy" }).innerText();
    assert.ok(timeline.includes(delivery.label), `Brakuje kanału w historii: ${timeline}`);
    if (receipt) assert.ok(timeline.includes(receipt), `Brakuje potwierdzenia: ${timeline}`);
    if (form.recipientFor) assert.ok(timeline.includes(form.recipientFor(values, channel)), `Brakuje adresata: ${timeline}`);
    console.log(`PASS ${id} | ${channel} | ${medic ? medic + " | " : ""}${output}`);
  } finally { await page.close(); }
}

async function run() {
  const origin = new URL(process.argv[2]).origin;
  const selected = process.argv.slice(3);
  for (const id of requiredFormIds) assert.ok(FORMS[id], `Brak wymaganego formularza ${id}`);
  const ids = selected.length ? selected : Object.keys(FORMS);
  const ready = await fetch(`${origin}/dokumenty/${ids[0]}`);
  assert.equal(ready.status, 200, `Serwer nie zwraca widoku Dokumentów pod ${origin}`);
  await ready.body?.cancel();
  const directory = await mkdtemp(join(tmpdir(), "wnioski-browser-"));
  console.log(`Pobrane PDF: ${directory}`);
  const browser = await chromium.launch({ channel: "chrome" });
  const failures: string[] = [];
  let passed = 0;
  try {
    for (const id of ids) {
      const form = FORMS[id];
      assert.ok(form, `Brak formularza ${id}`);
      const routes = form.channels.flatMap<{ channel: Channel; medic?: string }>(channel => id === "poz" && channel === "przychodnia"
        ? ["Lekarz POZ", "Pielęgniarka POZ", "Położna POZ"].map(medic => ({ channel, medic })) : [{ channel, medic: undefined }]);
      for (const { channel, medic } of routes) {
        try {
          await checkChannel(browser, origin, directory, id, form, channel, medic);
          passed++;
        } catch (error) {
          const failure = `${id}/${channel}${medic ? "/" + medic : ""}: ${error instanceof Error ? error.message : error}`;
          failures.push(failure);
          console.error("FAIL", failure);
        }
      }
    }
  } finally { await browser.close(); }
  console.log(`${passed} PASS, ${failures.length} FAIL`);
  assert.ok(!failures.length, failures.join("\n"));
}

run().catch(error => { console.error(error); process.exitCode = 1; });
