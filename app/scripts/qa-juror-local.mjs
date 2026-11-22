// From app/, with DATABASE_URL pointing to the tester's Unix-socket Postgres.
// node scripts/qa-juror-local.mjs --preflight|--draw [local-built-app-directory]
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { createHash, createHmac, randomBytes } from "node:crypto";
import { lstat, readFile, realpath, writeFile } from "node:fs/promises";
import { createServer, connect } from "node:net";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument } from "pdf-lib";
import { chromium } from "playwright-core";
import { previewCookies } from "./qa-preview-access.mjs";
import { offlineChrome, previewRelay } from "./qa-preview-browser.mjs";

const app = fileURLToPath(new URL("../", import.meta.url));
const script = fileURLToPath(import.meta.url);
const vault = path.join(homedir(), "Library/Application Support/Zusik/private-cases");
let stage = "startup";
const switchName = process.argv[2];
const remote = switchName === "--preview-preflight";
assert.ok(remote || ["--preflight", "--draw"].includes(switchName));
const noIP = '(version 1)(allow default)(deny network-outbound (remote ip "*:*"))';
const sandbox = "/usr/bin/sandbox-exec";
const marker = "QA-JUROR-FICTION-4179";
const name = "pakiet-" + marker + ".pdf";
const approvedRoles = new Set(["application", "insurance", "payroll", "certificate", "decision", "other"]);
const uuid = /^[a-f0-9-]{36}$/;

async function freePort() {
  const socket = createServer();
  await new Promise((ok, fail) => socket.once("error", fail).listen(0, "127.0.0.1", ok));
  const { port } = socket.address();
  await new Promise(ok => socket.close(ok));
  return port;
}
async function start() {
  const builtApp = process.argv[3] ? await realpath(process.argv[3]) : app;
  assert.ok((await lstat(path.join(builtApp,".next/BUILD_ID"))).isFile());
  const db = new URL(process.env.DATABASE_URL);
  const socket = db.searchParams.get("host");
  assert.ok(db.protocol === "postgresql:" && db.hostname === "localhost" && socket?.startsWith("/"));
  const dir = await lstat(socket);
  assert.ok(!dir.isSymbolicLink() && dir.uid === process.getuid() && !(dir.mode & 0o077));
  const port = await freePort();
  const origin = "http://127.0.0.1:" + port;
  const server = spawn(sandbox, ["-p", noIP, process.execPath, "node_modules/next/dist/bin/next",
    "start", "-H", "127.0.0.1", "-p", String(port)], {cwd:builtApp, stdio:["ignore","pipe","ignore"],
    env: { PATH:process.env.PATH, HOME:homedir(), NODE_ENV:"production", ZUSIK_CHAT_V1:"1",
      NEXT_TELEMETRY_DISABLED:"1", SESSION_SIGNING_SECRET:randomBytes(32).toString("hex"),
      DATABASE_URL:db.href, ZUSIK_APP_ORIGIN:origin }});
  try {
    await new Promise((ok, fail) => {
      const timer = setTimeout(() => fail(Error("server startup")), 30000);
      const clear = () => clearTimeout(timer);
      server.once("exit", () => { clear(); fail(Error("server exit")); });
      server.once("error", e => { clear(); fail(e); });
      server.stdout.on("data", chunk => { if (chunk.toString().includes("Ready")) { clear(); ok(); } });
    });
    const profile = noIP + '(allow network-outbound (remote ip "localhost:' + port + '"))';
    const child = spawnSync(sandbox, ["-p", profile, process.execPath, script, switchName, builtApp], {cwd:app,
      stdio:"inherit", env:{ PATH:process.env.PATH, HOME:homedir(), TMPDIR:process.env.TMPDIR || "/tmp", QA_JUROR_ORIGIN:origin }});
    process.exitCode = child.status ?? 1;
  } finally { server.kill(); }
}

async function privateDraw() {
  const safe = async file => {
    const stat = await lstat(file);
    assert.ok(!stat.isSymbolicLink() && stat.uid === process.getuid() && !(stat.mode & 0o077));
  };
  await safe(vault);
  const keyPath = path.join(vault, "qa-edition-2026.json");
  await safe(keyPath);
  const key = JSON.parse(await readFile(keyPath));
  assert.equal(key.cases.length, 86);
  // Deterministic random rank. Re-runs use the same file even when its result is inconvenient.
  const rank = sha => createHmac("sha256", key.seed).update("final-juror-v1/" + sha).digest("hex");
  const selected = [...key.cases].sort((a,b) => rank(a.sha).localeCompare(rank(b.sha)))[0];
  const drawPath = path.join(vault, "qa-juror-draw-v1.json");
  const receipt = JSON.stringify({ edition:key.edition, seed:key.seed, sha:selected.sha });
  try { await writeFile(drawPath, receipt, { mode:0o600, flag:"wx" }); }
  catch (e) { if (e.code !== "EEXIST") throw e; await safe(drawPath); assert.equal(await readFile(drawPath,"utf8"), receipt); }
  const source = await realpath(path.resolve(app, "../Materiały hackathonowe/Sprawy"));
  const file = await realpath(path.resolve(source, selected.aliases[0]));
  assert.ok(file.startsWith(source + path.sep));
  const bytes = await readFile(file);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), selected.sha);
  return bytes;
}

// Only replay route chunks already requested while opening this chat, before attaching a file.
async function localRouteScript(pathname, builtApp) {
  const decoded = pathname.replace(/%(?:28|29|5b|5d)/gi, code => decodeURIComponent(code));
  const prefix = "/_next/static/";
  if (!decoded.startsWith(prefix + "chunks/app/") || !/[()[\]]/.test(decoded)) return null;
  const parts = decoded.slice(prefix.length).split("/");
  if (!parts.every(part => /^[\w()[\].-]+$/.test(part) && part !== "." && part !== "..") ||
    !/^[\w.-]+-[a-f0-9]+\.js$/.test(parts.at(-1))) return null;
  const file = path.join(builtApp, ".next/static", ...parts);
  try {
    if (await realpath(file) !== file || !(await lstat(file)).isFile()) return null;
    return await readFile(file);
  } catch (error) {
    if (error.code === "ENOENT" || error.code === "ENOTDIR") return null;
    throw error;
  }
}

function permitted(request, origin, headers = request.headers(), localScripts) {
  const url = new URL(request.url()), method = request.method(), body = request.postData() || "";
  const wire = request.url() + body + JSON.stringify(headers);
  if (url.origin !== origin || /QA-JUROR-FICTION|%PDF-|JVBERi0|public_question|publicQuestion/i.test(wire)) return false;
  const p = url.pathname;
  if (method === "GET") {
    if (localScripts?.has(p) && !url.search && url.hostname === "127.0.0.1" && request.resourceType() === "script") return true;
    if (p.startsWith("/_next/static/") && /^\?dpl=dpl_[a-zA-Z0-9]+$/.test(url.search)) return /^[\w./-]+$/.test(p);
    if (url.search && !(p === "/app/rozmowa" && uuid.test(url.searchParams.get("sprawa") || "") &&
      Array.from(url.searchParams.keys()).length === 1)) return false;
    return p === "/app/rozmowa" || /^\/(?:_next\/static|ocr|pdfjs|fonts)\/[\w./-]+$/.test(p) ||
      /^\/api\/v1\/(?:cases|profiles)(?:\/[a-f0-9-]{36}(?:\/(?:documents|facts|proposals|messages|assessments)(?:\/[a-f0-9-]{36})?)?)?$/.test(p);
  }
  if (method !== "POST" || url.search) return false;
  if (p === "/api/v1/sessions" || p === "/api/zusik/session") return body === "";
  let input;
  try { input = JSON.parse(body); } catch { return false; }
  const keys = (...fields) => Object.keys(input).every(k => fields.includes(k));
  if (p === "/api/v1/profiles") return keys("mode") && input.mode === "case_import";
  if (p === "/api/v1/cases") return keys("profileId") && uuid.test(input.profileId);
  if (/^\/api\/v1\/cases\/[a-f0-9-]{36}\/documents$/.test(p)) return keys("clientDocumentId","pages","kind","pageKinds") &&
    /^[a-f0-9]{64}$/.test(input.clientDocumentId) && approvedRoles.has(input.kind) && Number.isInteger(input.pages) &&
    input.pages >= 1 && input.pages <= 128 && (!input.pageKinds || input.pageKinds.length === input.pages && input.pageKinds.every(r => approvedRoles.has(r)));
  return /^\/api\/v1\/cases\/[a-f0-9-]{36}\/messages$/.test(p) && keys("intent") && input.intent === "ask_case";
}

async function exercise(browser, origin, buffer, real, cookies = []) {
  assert.ok(!real || new URL(origin).hostname === "127.0.0.1");
  const context = await browser.newContext({viewport:{width:1365,height:880}, serviceWorkers:"block", acceptDownloads:false});
  let requests = 0, blocked = 0, workers = 0, active = false;
  const assets = new Set();
  const localScripts = new Map();
  let toolbarSuppressed = 0;
  const relay = remote ? previewRelay(context,origin,cookies,createHash("sha256").update(buffer).digest()) : null;
  try {
    if (cookies.length) await context.addCookies(cookies);
    await context.routeWebSocket("**/*", ws => { blocked++; ws.close(); });
    async function handle(route) {
      const request = route.request();
      const target = new URL(request.url());
      if (remote && target.origin === "https://vercel.live" && target.pathname === "/_next-live/feedback/feedback.js" && request.resourceType() === "script") {
        toolbarSuppressed++;
        return route.abort();
      }
      if (!remote && !active && target.origin === origin && request.method() === "GET" && request.resourceType() === "script" && !target.search) {
        const bytes = await localRouteScript(target.pathname, process.argv[3]);
        if (bytes) localScripts.set(target.pathname, bytes);
      }
      if (target.origin !== origin || (active || remote && target.pathname.startsWith("/api/")) && !permitted(request,origin,await request.allHeaders(),localScripts)) {
        if (!real) console.error("Synthetic preflight blocked", request.method(), request.resourceType(),
          target.origin === origin ? "same origin" : target.hostname === "vercel.live" ? "Vercel toolbar" : "other origin", active ? "during trial" : "before attachment");
        blocked++; return route.abort();
      }
      if (localScripts.has(target.pathname) && !target.search && request.method() === "GET" && request.resourceType() === "script") {
        return route.fulfill({ contentType: "application/javascript", body: localScripts.get(target.pathname) });
      }
      if (target.pathname.startsWith("/ocr/") || target.pathname.startsWith("/pdfjs/")) assets.add(target.pathname);
      requests++;
      if (relay) return relay(route,target,request.method());
      return route.continue();
    }
    await context.route("**/*", route => handle(route).catch(async () => {
      blocked++;
      if (!real) console.error("Synthetic preflight transport failed", route.request().resourceType());
      await route.abort().catch(() => {});
    }));
    const page = await context.newPage();
    page.on("worker", () => workers++);
    page.setDefaultTimeout(30000);
    stage = "opening chat";
    await page.goto(origin + "/app/rozmowa");
    const attach = page.getByRole("button",{name:"Dołącz PDF sprawy"});
    await attach.waitFor();
    await page.waitForLoadState("networkidle");
    active = true;
    const chooser = page.waitForEvent("filechooser");
    await attach.click();
    stage = "reading PDF";
    await (await chooser).setFiles({name, mimeType:"application/pdf", buffer});
    await page.getByRole("link",{name:"Otwórz własny PDF"}).first().waitFor({timeout:30 * 60000});
    const questions = [], replyStatuses = [];
    const ask = async question => {
      const box = page.getByRole("textbox",{name:"Wiadomość do Zusika"});
      await box.fill(question);
      const saved = page.waitForResponse(r => r.request().method() === "POST" && new URL(r.url()).pathname.endsWith("/messages"));
      await page.getByRole("button",{name:"Wyślij",exact:true}).click();
      assert.equal((await saved).status(),201);
      const turn = page.locator("[data-knowledge-turn]").filter({has:page.getByText(question,{exact:true})}).last();
      await turn.waitFor();
      const asksForPerson = await turn.getByText("Dodaj osobę i potwierdź dane z wniosku, aby rozpocząć analizę.",{exact:true}).count();
      const asksForPeriod = await turn.getByText(/Wskaż świadczenie i okres z wniosku\./).count();
      questions.push(question);
      replyStatuses.push(asksForPerson ? "person_and_confirmation_requested" : asksForPeriod ? "benefit_and_period_requested" : "other");
    };
    stage = "follow-up";
    await ask("Co wynika z tego dokumentu?");
    await ask("Od kiedy i ile mogę otrzymać?");
    const documentLinks = page.getByRole("log").getByRole("link",{name:/^Otwórz stronę \d+ w PDF$/, includeHidden:true});
    const hasPage = await documentLinks.count() > 0 && /^blob:.+#page=\d+$/.test(await documentLinks.first().getAttribute("href"));
    const passage = page.getByRole("link",{name:"Otwórz wskazaną stronę",exact:true,includeHidden:true}).first();
    let followedEvidence = false;
    if (await passage.count()) {
      await passage.locator("xpath=ancestor::details[1]/summary").click();
      const target = await passage.getAttribute("href");
      const popup = page.waitForEvent("popup");
      await passage.click();
      const preview = await popup;
      await preview.waitForURL(url => url.href === target);
      followedEvidence = /^blob:.+#page=\d+$/.test(preview.url());
      await preview.close();
    }
    const cards = page.getByRole("region",{name:"Ocena sprawy",exact:true});
    const decisionCard = await cards.count() > 0;
    const candidateFields = await page.getByRole("button",{name:/sprawdź stronę/i}).count();
    const hasCorrection = await page.getByRole("button",{name:"Popraw",exact:true}).count() > 0;
    let manualReviewOpened = false;
    const manual = page.getByRole("button",{name:/^Przepisz pole ze strony /,includeHidden:true}).first();
    if (!hasCorrection && await manual.count()) {
      const details = manual.locator("xpath=ancestor::details[1]");
      if (await details.getAttribute("open") === null) await details.locator("summary").click();
      await manual.click();
      const reference = await page.getByRole("link",{name:/Sprawdź oryginał · strona/}).getAttribute("href");
      manualReviewOpened = /^blob:.+#page=\d+$/.test(reference);
      await page.getByRole("button",{name:"Anuluj",exact:true}).click();
    }
    if (!hasCorrection) await ask("Co mam uzupełnić, żeby poprawić wynik?");
    // A correction requires a reviewed fact and its source. Never invent one for a private packet.
    stage = "reload";
    await page.reload();
    await page.getByText(/Dołącz ponownie ten sam PDF/).first().waitFor();
    let restoredQuestions = 0;
    for (const question of questions) if (await page.getByRole("log").getByText(question,{exact:true}).count()) restoredQuestions++;
    stage = "boundary";
    assert.equal(blocked,0);
    const pdfWorker = assets.has("/pdfjs/pdf.worker.min.mjs");
    const polishOcr = assets.has("/ocr/worker.min.js") && assets.has("/ocr/lang/pol.traineddata.gz");
    console.log(JSON.stringify({stage:real ? "local_draw" : remote ? "preview_synthetic":"synthetic_preflight", hasPage, followedEvidence, decisionCard,
      candidatesAvailable:candidateFields>0, correctionAvailable:hasCorrection, manualReviewOpened, restoredMetadata:true, restoredQuestions, replyStatuses, requests, blocked, workers, pdfWorker, polishOcr, toolbarSuppressed}));
    if (!real) assert.ok(pdfWorker && polishOcr && followedEvidence && workers >= 2);
    return {hasPage, decisionCard, hasCorrection};
  } finally { await context.close(); }
}

async function syntheticPacket(browser) {
  const blank = await browser.newPage();
  const png = await blank.evaluate(label => {
    const canvas = document.createElement("canvas");
    canvas.width=800; canvas.height=450;
    const ctx=canvas.getContext("2d");
    ctx.fillStyle="white"; ctx.fillRect(0,0,800,450);
    ctx.fillStyle="black"; ctx.font="26px Arial";
    ctx.fillText("Syntetyczny dokument " + label,20,70);
    return canvas.toDataURL("image/png").split(",")[1];
  }, marker);
  await blank.close();
  const pdf = await PDFDocument.create();
  pdf.addPage().drawText("Dokument testowy. Okres, podstawa i kwota " + marker);
  const raster = await pdf.embedPng(Buffer.from(png,"base64"));
  pdf.addPage([600,338]).drawImage(raster,{x:0,y:0,width:600,height:338});
  return Buffer.from(await pdf.save());
}

async function previewPreflight() {
  stage = "deployment authentication";
  const origin = process.argv[3];
  const cookies = await previewCookies(origin, process.argv[4]);
  const browser = await offlineChrome();
  try {
    const preflight = await exercise(browser,origin,await syntheticPacket(browser),false,cookies);
    assert.ok(preflight.hasPage);
  } finally { await browser.close(); }
}

async function run() {
  const denied = await new Promise(ok => {
    const probe = connect({host:"192.0.2.1",port:9});
    probe.once("error", e => ok(["EPERM","EACCES"].includes(e.code)));
    probe.setTimeout(1200, () => { probe.destroy(); ok(false); });
  });
  assert.ok(denied);
  const origin = process.env.QA_JUROR_ORIGIN;
  const local = new URL(origin);
  assert.ok(local.protocol === "http:" && local.hostname === "127.0.0.1" && local.port && local.origin === origin);
  const forbiddenRequest = (url, data) => ({ url: () => url, postData: () => data, headers: () => ({}), method: () => "POST" });
  assert.equal(permitted(forbiddenRequest("https://example.invalid/api/v1/sessions", ""), origin), false);
  assert.equal(permitted(forbiddenRequest(origin + "/api/v1/sessions?file=" + marker, ""), origin), false);
  assert.equal(permitted(forbiddenRequest(origin + "/api/v1/cases/" + "a".repeat(36) + "/messages",
    JSON.stringify({intent:"public_question", publicQuestion:marker})), origin), false);
  const routePath = "/_next/static/chunks/app/(parent)/%5Bslug%5D/page-abc123.js";
  const seen = new Set([routePath]);
  const scriptRequest = url => ({ ...forbiddenRequest(url, ""), method: () => "GET", resourceType: () => "script" });
  assert.ok(permitted(scriptRequest(origin + routePath), origin, {}, seen));
  assert.ok(!permitted(scriptRequest(origin + routePath + "?extra=1"), origin, {}, seen));
  assert.ok(!permitted(scriptRequest(origin + routePath), origin, {}, new Set()));
  assert.ok(!permitted(scriptRequest(origin + routePath), origin, { "x-test":marker }, seen));
  assert.ok(!permitted(scriptRequest("https://example.invalid" + routePath), "https://example.invalid", {}, seen));
  assert.equal(await localRouteScript("/_next/static/chunks/app/(parent)/%2e%2e/not-in-build-aaa.js", process.argv[3]), null);
  const browser = await chromium.launch({channel:"chrome", args:["--disable-background-networking"]});
  try {
    const preflight = await exercise(browser,origin,await syntheticPacket(browser),false);
    assert.ok(preflight.hasPage);
    if (switchName === "--draw") {
      const draw = await exercise(browser,origin,await privateDraw(),true);
      if (!draw.decisionCard || !draw.hasCorrection) process.exitCode = 1;
    }
  } finally { await browser.close(); }
}
try { await (remote ? previewPreflight() : process.env.QA_JUROR_ORIGIN ? run() : start()); }
catch (error) {
  // Playwright and filesystem exceptions can contain a filename or a quoted locator. Never log them.
  console.error("Juror check incomplete at " + stage + " (" + (error.name === "TimeoutError" ? "timeout" : "guard or application") + ").");
  process.exitCode = 2;
}
