/**
 * Visual diff of the mascot against the reference image.
 *
 * 1. Renders /mascot/raw (the component at 2048 × 2048, 1:1 with design/mascot/base.jpg) and screenshots it.
 * 2. Decodes the JPEG reference in the same browser (pngjs reads only PNG) by screenshotting it as an <img>.
 * 3. Compares both with pixelmatch and writes design/mascot/diff/{current,diff}.png.
 *
 * Run: npm run mascot:diff
 * Uses the dev server at MASCOT_URL (default http://localhost:3000) or starts a temporary one.
 */
import { spawn, type ChildProcess } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { chromium } from "playwright";

const SIZE = 2048;
const REFERENCE = path.join("design", "mascot", "base.jpg");
const OUT_DIR = path.join("design", "mascot", "diff");
const RAW_ROUTE = "/mascot/raw";
const BASE_URL = process.env.MASCOT_URL ?? "http://localhost:3000";
const FALLBACK_PORT = 3123;
/** A reference pixel counts as part of the character when any channel is below this (JPEG noise keeps the background just under 255). */
const NEAR_WHITE = 245;

async function isUp(url: string): Promise<boolean> {
  try {
    return (await fetch(url)).ok;
  } catch {
    return false;
  }
}

/** Reuses a running dev server, or starts `next dev` on a spare port and returns it for cleanup. */
async function ensureServer(): Promise<{ url: string; server?: ChildProcess }> {
  if (await isUp(BASE_URL + RAW_ROUTE)) return { url: BASE_URL };

  const url = `http://localhost:${FALLBACK_PORT}`;
  const nextBin = path.join("node_modules", "next", "dist", "bin", "next");
  const server = spawn(process.execPath, [nextBin, "dev", "--port", String(FALLBACK_PORT)], { stdio: "ignore" });
  for (let attempt = 0; attempt < 120; attempt++) {
    if (await isUp(url + RAW_ROUTE)) return { url, server };
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  server.kill();
  throw new Error(`Dev server did not start on ${url}`);
}

async function main() {
  const { url, server } = await ensureServer();
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: SIZE, height: SIZE },
      deviceScaleFactor: 1,
      colorScheme: "light",
    });

    await page.goto(url + RAW_ROUTE);
    // The Next.js dev indicator floats over the page; keep it out of the screenshot.
    await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
    const currentPng = await page.locator("[data-mascot-raw] svg").screenshot();

    const jpeg = await readFile(REFERENCE);
    await page.setContent(
      `<body style="margin:0"><img src="data:image/jpeg;base64,${jpeg.toString("base64")}" style="display:block"></body>`,
    );
    const img = page.locator("img");
    await img.evaluate((el: HTMLImageElement) => el.decode());
    const referencePng = await img.screenshot();

    const current = PNG.sync.read(currentPng);
    const reference = PNG.sync.read(referencePng);
    if (current.width !== SIZE || current.height !== SIZE || reference.width !== SIZE || reference.height !== SIZE) {
      throw new Error(
        `Expected ${SIZE}×${SIZE}, got current ${current.width}×${current.height}, reference ${reference.width}×${reference.height}`,
      );
    }

    const diff = new PNG({ width: SIZE, height: SIZE });
    const mismatched = pixelmatch(current.data, reference.data, diff.data, SIZE, SIZE, { threshold: 0.1 });

    let characterArea = 0;
    for (let i = 0; i < reference.data.length; i += 4) {
      const [r, g, b] = [reference.data[i], reference.data[i + 1], reference.data[i + 2]];
      if (r < NEAR_WHITE || g < NEAR_WHITE || b < NEAR_WHITE) characterArea++;
    }

    await mkdir(OUT_DIR, { recursive: true });
    await writeFile(path.join(OUT_DIR, "current.png"), PNG.sync.write(current));
    await writeFile(path.join(OUT_DIR, "diff.png"), PNG.sync.write(diff));

    const pct = (n: number, of: number) => ((100 * n) / of).toFixed(2);
    console.log(`Mismatched pixels: ${mismatched}`);
    console.log(`  of the whole image:    ${pct(mismatched, SIZE * SIZE)} %`);
    console.log(`  of the character area: ${pct(mismatched, characterArea)} % (${characterArea} px)`);
    console.log(`Images: ${path.join(OUT_DIR, "current.png")}, ${path.join(OUT_DIR, "diff.png")}`);
  } finally {
    await browser.close();
    server?.kill();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
