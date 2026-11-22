// node scripts/responsive-browser.mjs http://localhost:3000 [chromium|webkit|firefox]
import assert from "node:assert/strict";
import { chromium, firefox, webkit } from "playwright-core";

const origin = new URL(process.argv[2]).origin;
const engine = process.argv[3] ?? "chromium";
const browserType = { chromium, firefox, webkit }[engine];
assert.ok(browserType, "Choose chromium, firefox or webkit");
const sizes = [
  [280, 653], [320, 568], [360, 640], [390, 844], [399, 700], [400, 700], [401, 700],
  [568, 320], [639, 420], [640, 420], [767, 1024], [768, 1024], [844, 390],
  [900, 600], [901, 600], [959, 768], [960, 640], [1023, 768], [1024, 600],
  [1079, 720], [1080, 720], [1101, 600], [1280, 720], [1440, 900], [1920, 1080], [2560, 1440], [3440, 1440],
];
const routes = [
  "/", "/logowanie", "/rejestracja", "/logowanie/aplikacja-zus", "/logowanie/login-gov",
  "/logowanie/mobywatel", "/logowanie/wczytywanie", "/plan", "/dokumenty", "/dokumenty/rodzicielski",
  "/kalkulator", "/wsparcie", "/profil", "/profil/przyklad-ubezpieczenia", "/app/rozmowa", "/app", "/zusik", "/admin",
];
const adminRoutes = ["/admin/reguly", "/admin/historia", "/admin/tresci", "/admin/sprawy-testowe", "/admin/zmiany"];
const browser = await browserType.launch(engine === "chromium" ? { channel: "chrome" } : {});
const failures = [];
let layouts = 0;

async function inspect(page, path) {
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const issues = await page.evaluate(() => {
      const problems = [];
      if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) problems.push("page overflows");
      // Ranges measure the painted letters, including words that spill outside a narrower flex item.
      const bounds = el => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return range.getBoundingClientRect();
      };
      const brand = document.querySelector('header a[aria-label^="Przewodnik Rodzica"] span:last-child');
      const action = document.querySelector('header a[href="/logowanie"]');
      if (brand && action && bounds(brand).right > action.getBoundingClientRect().left + 1) problems.push("brand covers action");
      for (const tile of document.querySelectorAll('#liczby button[aria-haspopup="dialog"]')) {
        const box = tile.getBoundingClientRect();
        for (const label of tile.querySelectorAll("span > span")) {
          const text = bounds(label);
          if (text.left < box.left - 1 || text.right > box.right + 1) problems.push(label.textContent);
        }
      }
      return problems;
    });
    if (issues.length) failures.push(path + " " + width + "×" + height + " " + issues.join(", "));
    layouts++;
  }
}

try {
  const context = await browser.newContext({ reducedMotion: "reduce", locale: "pl-PL" });
  await context.addInitScript(() => sessionStorage.setItem("przewodnik-rodzica:sesja-demo", JSON.stringify({
    version: 1, method: "local", data: "local", loggedInAt: "2026-11-22",
  })));
  const openPage = async () => {
    const page = await context.newPage();
    page.on("pageerror", error => failures.push(page.url() + " " + error.message));
    return page;
  };
  for (const path of routes) {
    const page = await openPage();
    const response = await page.goto(origin + path + (path.endsWith("/wczytywanie") ? "?blad=1" : ""));
    assert.ok(response?.ok(), path);
    assert.equal(new URL(page.url()).pathname, path);
    await page.evaluate(() => document.fonts.ready);
    if (path === "/plan") await page.getByRole("heading", { name: "Plan dla Oli" }).waitFor();
    if (path === "/") {
      await page.getByRole("status", { name: /Ładowanie Przewodnika/ }).waitFor({ state: "hidden" });
      assert.ok(await page.locator("video").evaluate(video => video.paused), "reduced-motion video");
    }
    await inspect(page, path);
    if (path === "/plan") {
      await page.setViewportSize({ width: 320, height: 568 });
      await page.locator('button[aria-pressed][aria-label]:visible').first().click();
      const sheet = page.getByRole("dialog");
      await sheet.waitFor();
      await page.setViewportSize({ width: 844, height: 390 });
      assert.ok(await sheet.evaluate(el => el.scrollWidth <= el.clientWidth + 1), "case sheet overflows");
      await sheet.getByRole("button", { name: "Zamknij" }).click();
      await sheet.waitFor({ state: "hidden" });
    }
    if (path === "/admin") {
      if (["127.0.0.1", "localhost", "[::1]"].includes(new URL(origin).hostname) && await page.locator('input[type=password]').inputValue()) {
        await page.locator('button[type=submit]').click();
        await page.waitForURL("**/admin/reguly");
        routes.push(...adminRoutes);
      } else {
        console.log("Skipped admin panel: local demo sign-in is unavailable.");
      }
    }
    if (path === "/admin/reguly") {
      await page.setViewportSize({ width: 568, height: 320 });
      await page.getByRole("button", { name: "Otwórz menu" }).click();
      const logout = page.getByRole("button", { name: "Wyloguj się" });
      await logout.scrollIntoViewIfNeeded();
      const rect = await logout.boundingBox();
      assert.ok(rect && rect.y >= 0 && rect.y + rect.height <= 321, "menu actions out of reach");
      await page.keyboard.press("Escape");
    }
    await page.close();
  }

  const page = await openPage();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(origin);
  await page.waitForFunction(() => document.documentElement.dataset.intro === "reveal");
  await page.evaluate(() => window.scrollTo(0, innerHeight));
  await page.waitForFunction(() => Number(document.querySelector('[style*="--p-window"]')?.style.getPropertyValue("--p-window")) > 0.9);

  const tile = page.locator('#liczby button[aria-haspopup="dialog"]').first();
  await tile.click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  await page.setViewportSize({ width: 320, height: 568 });
  await dialog.getByRole("button", { name: "Zamknij" }).click();
  await dialog.waitFor({ state: "hidden" });
  assert.ok(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY !== "hidden"), "stale scroll lock");

  await tile.click();
  await dialog.waitFor();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('[role="dialog"]')).opacity) > 0.9);
  await dialog.getByRole("button", { name: "Zamknij" }).click();
  await dialog.waitFor({ state: "hidden" });
  assert.ok(await tile.evaluate(button => button === document.activeElement), "lost tile focus");

  await page.setViewportSize({ width: 568, height: 320 });
  const row = page.locator("#agent [data-side]").first();
  await row.evaluate(el => el.scrollIntoView({ block: "start" }));
  await page.waitForFunction(() => document.querySelector("#agent [data-side]")?.dataset.phase === "active");
  assert.ok(await row.evaluate(el => getComputedStyle(el).position !== "sticky"), "scene pins on a short screen");
  if (engine !== "firefox") {
    const touch = await browser.newPage({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
    await touch.goto(origin);
    await touch.waitForFunction(() => document.documentElement.dataset.intro === "reveal");
    const card = touch.locator("#dla-rodzicow li").first();
    await card.scrollIntoViewIfNeeded();
    const firstFrame = await card.locator("svg").first().innerHTML();
    await card.tap();
    await touch.waitForFunction(frame => document.querySelector("#dla-rodzicow li svg")?.innerHTML !== frame, firstFrame);
    await touch.close();
  }
  assert.deepEqual(failures, []);
  console.log(engine + ": " + layouts + " layouts and interaction checks passed.");
} finally {
  await browser.close();
}
