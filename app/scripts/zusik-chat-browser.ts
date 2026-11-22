import assert from "node:assert/strict";
import { chromium, type Page } from "playwright-core";

const origin = new URL(process.argv[2]).origin;
const mode = process.argv[3] ?? "corpus";
const openChat = (page: Page) => page.getByRole("button", { name: "Otwórz czat z Zusikiem" }).click();
const conversation = (page: Page) => page.getByRole("region", { name: "Czat z Zusikiem" });

async function navigationDuringLoad(page: Page) {
  const release = Promise.withResolvers<void>();
  await page.route(url => url.pathname === "/profil", async route => {
    await release.promise;
    await route.continue();
  });
  try {
    await page.goto(origin + "/wsparcie");
    await page.locator('nav a[href="/profil"]:visible').first().click({ noWaitAfter: true });
    await openChat(page);
    await conversation(page).getByText(/ · Wsparcie$/).waitFor();
    assert.equal(new URL(page.url()).pathname, "/wsparcie");
  } finally {
    release.resolve();
  }
  await page.waitForURL("**/profil");
  await conversation(page).getByText(/ · Profil$/).waitFor();
  console.log("PASS Wsparcie → otwarcie czatu podczas przejścia → Profil");
}

async function caseShortcuts(page: Page) {
  const cards = [
    { label: "Porównaj warianty urlopu", path: "/app", api: "/api/zusik/marta" },
    { label: "Przygotuj wniosek o urlop ojcowski", path: "/app/kamil", api: "/api/kamil" },
    { label: "Sprawdź chorobowe w ciąży", path: "/app/chorobowe", api: "/api/zusik/sickness" },
  ];
  for (const { label, path, api } of cards) {
    await openChat(page);
    const shortcuts = conversation(page).getByRole("navigation", { name: "Rozpocznij sprawę" });
    await shortcuts.waitFor();
    assert.equal(await shortcuts.getByRole("link").count(), 3);
    const caseResponse = (method = "GET") => page.waitForResponse(res => new URL(res.url()).pathname === api && res.request().method() === method);
    const loaded = caseResponse(path === "/app/kamil" ? "POST" : "GET");
    await shortcuts.getByRole("link", { name: label, exact: true }).click();
    await page.waitForURL(url => url.pathname === path);
    let first = (await (await loaded).json()).view;
    if (path === "/app") {
      assert.equal(first, null, "Porównanie powstaje po działaniu rodzica");
      const saved = caseResponse("POST");
      await page.getByRole("button", { name: "Porównaj warianty", exact: true }).click();
      first = (await (await saved).json()).view;
      assert.equal(first.variants.sequential.calendarDays, 56);
    }
    if (path === "/app/chorobowe") {
      assert.equal(first, null);
      const received = caseResponse("POST");
      await conversation(page).getByRole("textbox", { name: "Wiadomość do Zusika" }).fill("Czy za dni zwolnienia dostanę zasiłek?");
      await conversation(page).getByRole("button", { name: "Wyślij", exact: true }).click();
      first = (await (await received).json()).view;
    }
    assert.ok(first?.version > 0);
    const restored = caseResponse();
    await page.reload();
    assert.equal((await (await restored).json()).view.version, first.version);
    await conversation(page).getByRole("textbox", { name: "Wiadomość do Zusika" }).waitFor();
    assert.equal(await page.getByRole("log", { name: "Przebieg rozmowy" }).count(), 1);
    console.log("PASS", page.viewportSize()?.width, label, path, "F5", first.version);
    await page.goto(origin + "/start");
  }
}

async function nurseryConversation(page: Page) {
  const state = page.waitForResponse(res => new URL(res.url()).pathname === "/api/zusik/state" && res.request().method() === "GET");
  await openChat(page);
  const chat = conversation(page);
  assert.deepEqual((await (await state).json()).view.turns, [], "Pusta historia nowej sesji");
  assert.equal(await chat.locator("[data-knowledge-turn]").count(), 0);
  assert.ok(await chat.getByRole("textbox", { name: "Wiadomość do Zusika" }).isEditable());
  const first = "Syn od stycznia będzie chodził do żłobka. Z czego możemy skorzystać?";
  const followUp = "na czyje konto?";
  const turn = (question: string) => chat.locator("[data-knowledge-turn]").filter({ has: page.getByText(question, { exact: true }) });
  async function ask(question: string) {
    await chat.getByRole("textbox", { name: "Wiadomość do Zusika" }).fill(question);
    const response = page.waitForResponse(res => new URL(res.url()).pathname === "/api/zusik/ask" && res.request().method() === "POST");
    await chat.getByRole("button", { name: "Wyślij", exact: true }).click();
    assert.equal((await response).status(), 200);
    await turn(question).getByRole("button", { name: /^Źródło / }).first().waitFor({ timeout: 70_000 });
  }
  await ask(first);
  assert.match(await turn(first).innerText(), /aktywnie w żłobku/iu);
  assert.equal(await chat.getByRole("navigation", { name: "Rozpocznij sprawę" }).count(), 0);
  await page.reload();
  await openChat(page);
  await turn(first).getByRole("button", { name: /^Źródło / }).first().waitFor();
  await ask(followUp);
  const answer = turn(followUp);
  const source = answer.getByRole("button", { name: /^Źródło .*Komu wypłacamy/iu }).first();
  const card = answer.getByRole("region", { name: /^Źródło:/ });
  async function openSource() {
    await source.click();
    const quote = await card.locator("blockquote").innerText();
    assert.match(quote, /rachunek bankowy podmiotu, który prowadzi żłobek/iu);
    const url = await card.getByRole("link").getAttribute("href");
    assert.equal(new URL(url ?? "", origin).hostname, "www.zus.pl");
    const provenance = mode.startsWith("cards-") ? /Pobrano ze strony ZUS|Z biblioteki źródeł/
      : mode === "official_live" ? /Pobrano ze strony ZUS/ : /Z biblioteki źródeł/;
    const from = await card.getByText(provenance).innerText();
    const date = await card.locator("time").getAttribute("datetime");
    assert.ok(date && Number.isFinite(Date.parse(date)));
    return { quote, url, date, from };
  }
  const savedSource = await openSource();
  await page.reload();
  await openChat(page);
  assert.deepEqual(await openSource(), savedSource, "F5 przywraca ten sam cytat, URL i czas odczytu");
  console.log(await turn(first).innerText(), await answer.innerText(), savedSource.url);
  if (process.argv[4]) await page.screenshot({ path: process.argv[4] });
}

async function run() {
  assert.ok(["navigation", "corpus", "official_live", "cards-mobile", "cards-desktop"].includes(mode), "Nieznany tryb testu");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const viewport = mode === "cards-desktop" ? { width: 1440, height: 900 } : { width: 390, height: 844 };
    const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
    page.setDefaultTimeout(15_000);
    await page.goto(origin);
    await page.locator("header").getByRole("link", { name: "Zaloguj się", exact: true }).click();
    await page.getByRole("link", { name: /^login\.gov\.pl/i }).click();
    await page.getByRole("link", { name: /^Aplikacja mObywatel/i }).click();
    await page.getByRole("button", { name: "Symuluj zeskanowanie kodu" }).click();
    await page.waitForURL("**/start");
    if (mode.startsWith("cards-")) await caseShortcuts(page);
    await (mode === "navigation" ? navigationDuringLoad : nurseryConversation)(page);
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
