import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdtemp, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright-core";

// Chrome and every worker inherit the OS network restriction. Playwright uses a pipe.
export async function offlineChrome() {
  const dir = await mkdtemp(join(tmpdir(), "zusik-qa-chrome-"));
  const launcher = join(dir, "launch");
  await writeFile(launcher, `#!/bin/sh
exec /usr/bin/sandbox-exec -p '(version 1)(allow default)(deny network-outbound (remote ip "*:*"))' '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' "$@"
`, {mode:0o700});
  const browser = await chromium.launch({executablePath:launcher, args:["--disable-background-networking","--no-proxy-server","--host-resolver-rules=MAP * ~NOTFOUND"]});
  const probe = createServer((_, res) => { res.end("unexpected direct connection"); });
  try {
    await new Promise((ok, fail) => probe.once("error", fail).listen(0, "127.0.0.1", ok));
    const page = await browser.newPage();
    const connected = await page.goto("http://127.0.0.1:" + probe.address().port, { timeout:4000 }).then(() => true, () => false);
    await page.close();
    assert.equal(connected, false, "Browser has an outgoing connection");
    return browser;
  } catch (error) { await browser.close(); throw error; }
  finally { probe.close(); }
}

// Only the generated fixture reaches this transport. Browser headers are not forwarded.
export function previewRelay(context, origin, cookies, digest) {
  const cache = new Map();
  const cookie = cookies.map(c => c.name + "=" + c.value).join("; ");
  const known = new Set();
  const keys = new Map();
  const pending = new Set();
  async function fetchResponse(url, method, data, key) {
    const headers = {origin, "x-vercel-skip-toolbar":"1"};
    const session = (await context.cookies(origin)).filter(c => c.name === "zusik_demo_session" && c.httpOnly);
    headers.cookie = [cookie, ...session.map(c => c.name + "=" + c.value)].join("; ");
    if (data !== undefined) headers["content-type"] = "application/json";
    if (key) headers["idempotency-key"] = key;
    const fetch = async () => {
      const res = await context.request.fetch(url, { method, headers, data, maxRedirects:0, timeout:30000 });
      assert.ok(res.status() >= 200 && res.status() < 300, "Unexpected upstream status");
      return res;
    };
    while (pending.size >= 4) await Promise.race(pending);
    const work = method === "GET" ? fetch().catch(fetch) : fetch();
    const done = work.then(() => {}, () => {});
    pending.add(done);
    try { return await work; } finally { pending.delete(done); }
  }
  function recordIds(value) {
    if (Array.isArray(value)) { value.forEach(recordIds); return; }
    if (!value || typeof value !== "object") return;
    if (typeof value.id === "string") known.add(value.id);
    Object.values(value).filter(v => typeof v === "object" && v).forEach(recordIds);
  }
  return async (route, target, method) => {
    assert.equal(target.origin, origin);
    if (!target.pathname.startsWith("/api/") && target.pathname !== "/app/rozmowa") {
      assert.equal(method, "GET");
      if (!cache.has(target.href)) {
        const res = await fetchResponse(target.href, "GET");
        cache.set(target.href, {body:await res.body(), contentType:res.headers()["content-type"]});
        await res.dispose();
      }
      return route.fulfill(cache.get(target.href));
    }
    const ids = target.href.match(/[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}/gi) ?? [];
    assert.ok(ids.every(id => known.has(id)));
    const req = route.request();
    const key = req.headers()["idempotency-key"];
    if (key && !keys.has(key)) keys.set(key,randomUUID());
    const value = req.postData() ? JSON.parse(req.postData()) : undefined;
    if (value?.profileId) assert.ok(known.has(value.profileId));
    if (value?.clientDocumentId) assert.equal(value.clientDocumentId, createHash("sha256").update(ids[0]).update(digest).digest("hex"));
    const res = await fetchResponse(target.href, method, value, keys.get(key));
    try {
      if (res.headers()["content-type"]?.includes("application/json")) recordIds(await res.json());
      await route.fulfill({response:res});
    } finally { await res.dispose(); }
  };
}
