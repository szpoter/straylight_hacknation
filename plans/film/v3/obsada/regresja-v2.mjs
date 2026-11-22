// Renders selected v2 frames to PNG (for the r1 regression sheet). node v3/obsada/regresja-v2.mjs
// Output: v3/robocze/obsada/v2-<scene>-<frame>.png (1280×720).
import { kit } from "../../v2/rysunek.mjs";
import { scene as s01 } from "../../v2/sceny/01/scene.mjs";
import { scene as s07 } from "../../v2/sceny/07/scene.mjs";
import { scene as s08 } from "../../v2/sceny/08/scene.mjs";
import { chromium } from "../../../../app/node_modules/playwright-core/index.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const here = dirname(fileURLToPath(import.meta.url)), work = resolve(here, "../robocze/obsada");
mkdirSync(work, { recursive: true });
const jobs = [["01", s01, 30], ["07", s07, 30], ["08", s08, 40]];
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
try {
  const pg = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  for (const [n, fn, f] of jobs) {
    const html = join(work, "v2.html");
    writeFileSync(html, `<!doctype html><meta charset="utf-8"><body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">${fn(f, kit)}</svg>`);
    await pg.goto(pathToFileURL(html).href);
    const out = join(work, `v2-${n}-${f}.png`); await pg.screenshot({ path: out }); console.log(out);
  }
} finally { await browser.close(); }
