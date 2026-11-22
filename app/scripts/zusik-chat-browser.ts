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
    const stream = await response;
    assert.equal(stream.status(), 200);
    const frames = (await stream.text()).trim().split("\n").map(line => JSON.parse(line));
    const result = frames.at(-1);
    assert.equal(result?.type, "result");
    assert.ok(result.body?.turn?.citations?.length, "Brak cytatu dla „" + question + "”: " + result.body?.turn?.status);
    await turn(question).getByRole("button", { name: /^Źródło / }).first().waitFor();
  }
  await ask(first);
  assert.match(await turn(first).innerText(), /aktywnie w żłobku/iu);
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
    const live = mode === "official_live";
    await card.getByText(live ? /Pobrano ze strony ZUS/ : /Z biblioteki źródeł/).waitFor();
    const date = await card.locator("time").getAttribute("datetime");
    assert.ok(date && Number.isFinite(Date.parse(date)));
    return { quote, url, date };
  }
  const savedSource = await openSource();
  await page.reload();
  await openChat(page);
  assert.deepEqual(await openSource(), savedSource, "F5 przywraca ten sam cytat, URL i czas odczytu");
  console.log(await turn(first).innerText(), await answer.innerText(), savedSource.url);
  if (process.argv[4]) await page.screenshot({ path: process.argv[4] });
}

async function run() {
  assert.ok(["navigation", "corpus", "official_live"].includes(mode), "Podaj navigation, corpus lub official_live");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
    page.setDefaultTimeout(15_000);
    await page.goto(origin);
    await page.locator("header").getByRole("link", { name: "Zaloguj się", exact: true }).click();
    await page.getByRole("link", { name: /^login\.gov\.pl/i }).click();
    await page.getByRole("link", { name: /^Aplikacja mObywatel/i }).click();
    await page.getByRole("button", { name: "Symuluj zeskanowanie kodu" }).click();
    await page.waitForURL("**/start");
    await (mode === "navigation" ? navigationDuringLoad : nurseryConversation)(page);
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
