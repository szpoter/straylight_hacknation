import assert from "node:assert/strict";
import { chromium, type Browser, type Page } from "playwright-core";

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

async function starterPrompts(browser: Browser, viewport: { width: number; height: number }) {
  const prompts = [
    ["Sprawdź ubezpieczenie", "Jak sprawdzić, czy mam ubezpieczenie chorobowe na dzień, od którego ubiegam się o zasiłek?"],
    ["Oblicz wysokość zasiłku", "Jak obliczyć wysokość mojego zasiłku macierzyńskiego i jakie dane o wynagrodzeniu mam podać?"],
    ["Sprawdź dokumenty i terminy", "Jakie dokumenty są potrzebne do zasiłku macierzyńskiego, gdzie je złożyć i w jakim terminie?"],
  ];
  for (const [label, question] of prompts) {
    const testPage = await browser.newPage({ viewport, reducedMotion: "reduce" });
    try {
      await testPage.goto(origin + "/app/rozmowa");
      const chat = conversation(testPage);
      const starters = chat.getByRole("group", { name: "Zacznij od pytania" });
      await starters.waitFor();
      assert.equal(await starters.getByRole("button").count(), 3);
      const submitted: string[] = [];
      testPage.on("request", request => {
        if (request.method() !== "POST") return;
        const path = new URL(request.url()).pathname;
        if (path === "/api/zusik/ask") submitted.push(request.postDataJSON().question);
        if (/^\/api\/v1\/cases\/[^/]+\/messages$/.test(path)) submitted.push(request.postDataJSON().publicQuestion);
      });
      const response = testPage.waitForResponse(res => /\/(ask|messages)$/.test(new URL(res.url()).pathname) && res.request().method() === "POST");
      await starters.getByRole("button", { name: label, exact: true }).click();
      assert.ok((await response).ok());
      await chat.getByRole("log").getByText(question, { exact: true }).waitFor();
      assert.deepEqual(submitted, [question]);
      if (label === "Oblicz wysokość zasiłku") {
        assert.equal(await chat.getByRole("link", { name: "Otwórz kalkulator dla swojej sprawy" }).getAttribute("href"), "/app/kalkulator");
      }
      assert.equal(new URL(testPage.url()).pathname, "/app/rozmowa");
      assert.equal(await starters.count(), 0);
      console.log("PASS", viewport.width, label);
    } finally {
      await testPage.close();
    }
  }
}

async function seedSicknessHistory(page: Page) {
  const database = new URL(process.env.CHAT_TEST_DATABASE_URL ?? "");
  assert.ok(["localhost", "127.0.0.1"].includes(database.hostname) && ["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
  const { SESSION_COOKIE } = await import("../src/lib/zusik/constants");
  const { decodeSession } = await import("../src/lib/zusik/session");
  const raw = (await page.context().cookies()).find(c => c.name === SESSION_COOKIE)?.value;
  const session = decodeSession(raw && decodeURIComponent(raw), process.env.CHAT_TEST_SIGNING_SECRET ?? "");
  assert.ok(session, "Wymagana jest syntetyczna sesja testowa na lokalnym serwerze");
  const { Pool } = await import("pg");
  const { PostgresSaver } = await import("@langchain/langgraph-checkpoint-postgres");
  const { SicknessService } = await import("../src/lib/sickness/service");
  const { PgCaseStore } = await import("../src/lib/zusik/case-store");
  const pool = new Pool({connectionString:database.href, max:2});
  try {
    const service = new SicknessService(new PgCaseStore(pool), new PostgresSaver(pool,undefined,{schema:"zusik"}), async () => []);
    assert.equal((await service.change(session, {type:"start",message:"Wcześniejszy zapis testowy."})).status,200);
  } finally { await pool.end(); }
}

async function legacyCaseRoutes(page: Page) {
  const cards = [
    { label: "Porównaj warianty urlopu", path: "/app", api: "/api/zusik/marta" },
    { label: "Przygotuj wniosek o urlop ojcowski", path: "/app/kamil", api: "/api/kamil" },
    { label: "Sprawdź chorobowe w ciąży", path: "/app/chorobowe", api: "/api/zusik/sickness" },
  ];
  for (const { label, path, api } of cards) {
    const caseResponse = (method = "GET") => page.waitForResponse(res => new URL(res.url()).pathname === api && res.request().method() === method);
    let destination = path;
    if (path !== "/app" && mode === "legacy") {
      const redirected = await page.request.get(origin + path, {maxRedirects:0});
      assert.equal(redirected.headers().location,"/plan");
      destination = "/app/rozmowa?historia=" + path.split("/").at(-1);
    }
    const seeded = path === "/app/chorobowe" && mode === "legacy" && process.argv.includes("--seed-history");
    if (seeded) await seedSicknessHistory(page);
    const loaded = caseResponse(path === "/app/kamil" ? "POST" : "GET");
    await page.goto(origin + destination);
    await page.waitForURL(origin + destination);
    let first = (await (await loaded).json()).view;
    if (path === "/app") {
      assert.equal(first, null, "Porównanie powstaje po działaniu rodzica");
      const saved = caseResponse("POST");
      await page.getByRole("button", { name: "Porównaj warianty", exact: true }).click();
      first = (await (await saved).json()).view;
      assert.equal(first.variants.sequential.calendarDays, 56);
    }
    if (path === "/app/chorobowe" && !seeded) {
      assert.equal(first, null);
      const received = caseResponse("POST");
      await conversation(page).getByRole("textbox", { name: "Wiadomość do Zusika" }).fill("Czy za dni zwolnienia dostanę zasiłek?");
      await conversation(page).getByRole("button", { name: "Wyślij", exact: true }).click();
      first = (await (await received).json()).view;
    }
    if (seeded) await conversation(page).getByText("Wcześniejszy zapis testowy.", {exact:true}).waitFor();
    assert.ok(first?.version > 0);
    const restored = caseResponse();
    await page.reload();
    assert.equal((await (await restored).json()).view.version, first.version);
    await conversation(page).getByRole("textbox", { name: "Wiadomość do Zusika" }).waitFor();
    assert.equal(await page.getByRole("log", { name: "Przebieg rozmowy" }).count(), 1);
    console.log("PASS", page.viewportSize()?.width, label, destination, "F5", first.version);
    await page.goto(origin + "/start");
  }
  if (mode === "legacy") {
    await page.goto(origin + "/app/rozmowa?historia=1");
    const chat = conversation(page);
    const submitted = page.waitForResponse(r => r.url().endsWith("/api/zusik/ask") && r.request().method() === "POST");
    await chat.getByRole("button",{name:"Sprawdź ubezpieczenie"}).click();
    assert.equal((await submitted).status(),200);
    await chat.getByRole("log").getByText(/Jak sprawdzić, czy mam ubezpieczenie/).waitFor();
    await page.reload();
    await chat.getByRole("log").getByText(/Jak sprawdzić, czy mam ubezpieczenie/).waitFor();
    console.log("PASS wcześniejsza rozmowa ogólna po F5");
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
  assert.equal(await chat.getByRole("group", { name: "Zacznij od pytania" }).count(), 0);
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
  assert.ok(["navigation", "corpus", "official_live", "cards-mobile", "cards-desktop", "legacy"].includes(mode), "Nieznany tryb testu");
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  try {
    const viewport = mode === "cards-desktop" ? { width: 1440, height: 900 } : { width: 390, height: 844 };
    const page = await browser.newPage({ viewport, reducedMotion: "reduce" });
    page.setDefaultTimeout(15_000);
    if (mode === "legacy") { await legacyCaseRoutes(page); return; }
    await page.goto(origin);
    await page.locator("header").getByRole("link", { name: "Zaloguj się", exact: true }).click();
    await page.getByRole("link", { name: /^login\.gov\.pl/i }).click();
    await page.getByRole("link", { name: /^Aplikacja mObywatel/i }).click();
    await page.getByRole("button", { name: "Symuluj zeskanowanie kodu" }).click();
    await page.waitForURL("**/start");
    if (mode.startsWith("cards-")) {
      await starterPrompts(browser, viewport);
      await legacyCaseRoutes(page);
    }
    await (mode === "navigation" ? navigationDuringLoad : nurseryConversation)(page);
  } finally {
    await browser.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
