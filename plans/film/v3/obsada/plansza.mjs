// Cast trial renders for r1. Usage: node v3/obsada/plansza.mjs [all|plansza|obrot|regresja|debug]
// Outputs into v3/obsada/: plansza-obsady-r1.png, test-obrotu.mp4, regresja-v2-v3.png.
// Work files (frames, debug stills) go to v3/robocze/obsada/.
import { chromium } from "../../../../app/node_modules/playwright-core/index.mjs";
import { mkdirSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { obsada, REWIZJA } from "./obsada.mjs";
import { rekwizyty } from "./rekwizyty.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const work = resolve(here, "../robocze/obsada");
mkdirSync(work, { recursive: true });
const media = resolve(here, "../media");
const fontCss = `@font-face{font-family:Inter;font-weight:100 900;src:url(${pathToFileURL(join(media, "07c7676b89ed2778-s.p.2bn3s6zvc0dyp.woff2")).href})format("woff2")}
@font-face{font-family:Inter;font-weight:100 900;src:url(${pathToFileURL(join(media, "ba63f6a0e436df8e-s.p.3-6t-g6q0vh0a.woff2")).href})format("woff2");unicode-range:U+100-2BA}
@font-face{font-family:Domine;font-weight:400 700;src:url(${pathToFileURL(join(media, "65fda886e20afadd-s.p.0rywfzomv7sk3.woff2")).href})format("woff2")}
@font-face{font-family:Domine;font-weight:400 700;src:url(${pathToFileURL(join(media, "83bbaa5605d394b8-s.p.286a1c3yqg-bk.woff2")).href})format("woff2");unicode-range:U+100-2BA}`;
const { person, head, ola, sofaPose, SOFA, headGuides, joints } = obsada;
const R = rekwizyty;
const INK = "#283754";
const text = (x, y, t, size = 22, weight = 600, fill = INK, anchor = "start") =>
  `<text x="${x}" y="${y}" font-family="Inter" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${t}</text>`;

let browser;
async function page(w, h) {
  browser ??= await chromium.launch({ executablePath: process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true, args: ["--allow-file-access-from-files"] });
  const pg = await browser.newPage({ viewport: { width: w, height: h } });
  pg.on("pageerror", e => console.error(e.message));
  const html = join(work, `strona-${w}x${h}.html`);
  writeFileSync(html, `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}html,body{margin:0;background:#F5FAF7}</style></head><body><svg id="s" xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"></svg></body></html>`);
  await pg.goto(pathToFileURL(html).href);
  await pg.evaluate(() => Promise.all([document.fonts.load("600 20px Inter"), document.fonts.load("700 20px Inter"), document.fonts.load("20px Domine")]));
  return pg;
}
async function shot(pg, svg, file, clip) {
  await pg.evaluate(s => { document.getElementById("s").innerHTML = s; }, svg);
  await pg.evaluate(() => document.fonts.ready);
  await pg.screenshot({ path: file, clip });
  console.log(file);
}

// ── scene builders (also used by the rotation test) ────────────────────────────────────────────────────────
export function sofaScene(variant = "przekazanie", over = {}) {
  const m = sofaPose("marta", variant, over.marta), p = sofaPose("pawel", variant, over.pawel);
  let s = R.salon({ pram: true, breath: over.breath ?? .5 });
  s += person("marta", { ...m, parts: "body" }) + person("pawel", { ...p, parts: "body" });
  if (variant === "przekazanie") {
    s += R.folder(688, 493, 300, -3, 1);
    s += R.paper(388, 478, 88, 112, -8, { header: "URLOP" }) + R.paper(468, 482, 88, 112, 6, { header: "ZASIŁEK" });
    s += R.paper(826, 462, 100, 126, 8, { header: "" }) + R.paper(814, 455, 100, 126, -3, { header: "ZASIŁEK", curl: .4 });
    s += R.shoe(690, 676, 0, 1.28) + R.shoe(912, 678, 0, 1.28, { flip: true });
  } else if (variant === "plansza") {
    s += R.folder(668, 500, 250, -4, 1);
    s += R.paper(388, 478, 92, 114, -10, { header: "URLOP" }) + R.paper(470, 482, 92, 114, 7, { header: "ZASIŁEK" });
    s += R.paper(790, 470, 100, 124, 10, {}) + R.paper(800, 478, 100, 124, -6, { header: "ZASIŁEK" });
  }
  s += person("marta", { ...m, parts: "arms" }) + person("pawel", { ...p, parts: "left" });
  s += R.sofaFront() + person("pawel", { ...p, parts: "right" });
  if (variant === "plansza") { const j = joints("pawel", p); s += R.shoe(j.gripR[0], j.gripR[1], 0, 1.28, { hang: true }); }
  return s;
}

// Family at the pram on one floor line, clerk on the same floor. x0 = left edge, floor y, s = scale.
function familyStanding(x0, floor, s) {
  const hipM = floor - 188 * s, hipP = floor - 212 * s, hipC = floor - 186 * s;
  const px = x0 + 300 * s, py = floor - 34 * s, ps = s * .95;
  const handle = R.pramPoint(px, py, ps, "handle");
  const toLocal = (q, hx, hy) => [(q[0] - hx) / s, (q[1] - hy) / s];
  const mx = x0 + 70 * s, hl = toLocal(handle, mx, hipM);
  let g = R.pram(px, py, ps, { breath: .4 });
  g += person("marta", { x: mx, y: hipM, s, head: .5, nod: .45, gaze: .5, gazeDown: .7, bow: .2, lean: 4,
    left: [-10, -50, hl[0] - 40, hl[1] - 12], right: [60, -60, hl[0] - 12, hl[1] + 2], leftGrip: "hold", rightGrip: "hold" });
  const pp = { x: x0 + 560 * s, y: hipP, s, head: -.35, nod: .3, gaze: -.5, gazeDown: .5, smile: .3, left: [-60, -60, -12, -84], right: [58, -62, 26, -64], leftGrip: "hold", rightGrip: "hold" };
  g += person("pawel", { ...pp, parts: "body" }) + R.folder(pp.x + 6 * s, hipP - 100 * s, 92 * s, -6, 0) + person("pawel", { ...pp, parts: "arms" });
  g += person("clerk", { x: x0 + 800 * s, y: hipC, s, head: -.25, gaze: -.4, smile: .4, left: [-60, -66, -40, -8], right: [60, -66, 40, -8] });
  g += `<path d="M${x0 - 20} ${floor + 10}H${x0 + 900 * s}" stroke="#AFC0B4" stroke-width="2.4"/>`;
  return g;
}

// Hospital: Marta in a gown holding Ola in bed, Paweł leans in with his index finger.
function hospital() {
  let s = R.ward({ bed: false });
  const pp = { x: 650, y: 452, s: 1.05, head: -.55, nod: .5, gaze: -.7, gazeDown: .8, smile: .5, bow: .5, lean: -12,
    left: [-110, -110, -175, -60], right: [58, -60, 30, -14], leftGrip: "point", rightGrip: "open" };
  const wq = solveWrist("pawel", pp, "left", [440, 352]);
  pp.left = [pp.left[0], pp.left[1], wq[0], wq[1]];
  s += person("pawel", pp) + R.wardBed();
  const m = { x: 290, y: 474, s: 1.05, legs: false, outfit: "patient", lean: -5, head: .55, nod: .6, gaze: .6, gazeDown: .9, smile: .45,
    left: [-58, -40, 50, -48], right: [80, -60, 96, -84], leftGrip: "open", rightGrip: "open" };
  s += person("marta", { ...m, parts: "body" }) + R.wardFront() + person("marta", { ...m, parts: "right" });
  s += ola({ x: 398, y: 378, s: 1.45, facing: 1, angle: -24, breath: .5 });
  s += person("marta", { ...m, parts: "left" });
  return s;
}

// Three views of each adult in ONE row at an identical head height, with shared construction lines per role.
function headViews(x0, y0, w, hh) {
  let s = "";
  const roles = [["marta", "Marta"], ["pawel", "Paweł"], ["clerk", "Pracownica ZUS"]];
  const views = [[0, "przód"], [.5, "¾"], [1, "profil"]];
  const lines = [["hairline", "linia włosów"], ["eyes", "oczy"], ["noseRoot", "nasada nosa"], ["jaw", "żuchwa"], ["neck", "osadzenie szyi"]];
  const lab = 170, seg = (w - lab) / 3, slot = seg / 3, cy = y0 + hh * 1.45;
  roles.forEach(([role, label], i) => {
    const g = headGuides(role), sc = hh / g.H, sx = x0 + lab + i * seg;
    s += `<rect x="${sx + 6}" y="${cy + g.earTop * sc}" width="${seg - 12}" height="${(g.earBottom - g.earTop) * sc}" fill="#FCDCAA" opacity=".35"/>`;
    s += text(sx + seg / 2, y0 + 8, label, 26, 700, INK, "middle");
    views.forEach(([h, vn], j) => {
      const cx = sx + slot * (j + .5);
      s += `<rect x="${cx - 12.5 * sc}" y="${cy - 12 * sc}" width="${25 * sc}" height="${44 * sc}" fill="#FFEBDB"/><path d="M${cx - 12.5 * sc} ${cy - 12 * sc}v${44 * sc}M${cx + 12.5 * sc} ${cy - 12 * sc}v${44 * sc}" stroke="${INK}" stroke-width="2.4"/>`;
      s += head(role, { x: cx, y: cy, s: sc, head: h, line: .85 });
      s += text(cx, cy + 62 * sc, vn, 19, 600, "#5E697F", "middle");
    });
    for (const [k] of lines) {
      const y = cy + g[k] * sc;
      s += `<path d="M${sx + 6} ${y}H${sx + seg - 6}" stroke="${k === "eyes" ? "#1A8648" : "#B98E5E"}" stroke-width="1.8" stroke-dasharray="${k === "eyes" ? "0" : "8 6"}" opacity=".75"/>`;
    }
    if (i < 2) s += `<path d="M${sx + seg} ${y0 + 30}V${cy + 70 * sc}" stroke="#D4D7DD" stroke-width="2"/>`;
  });
  const g = headGuides("marta"), sc = hh / g.H;
  const labs = lines.map(([k, name]) => ({ k, name, y: cy + g[k] * sc + 6 })).sort((p, q) => p.y - q.y);
  for (let i = 1; i < labs.length; i++) if (labs[i].y - labs[i - 1].y < 21) labs[i].y = labs[i - 1].y + 21;
  for (const l of labs) s += text(x0 + lab - 14, l.y, l.name, 17, 600, l.k === "eyes" ? "#1A8648" : "#8C6A44", "end")
    + `<path d="M${x0 + lab - 10} ${l.y - 6}L${x0 + lab + 4} ${cy + g[l.k] * sc}" stroke="#B98E5E" stroke-width="1"/>`;
  s += text(x0 + w - 4, cy + g.earBottom * sc - 4, "ucho", 17, 600, "#B08A3C", "end");
  return s;
}

function frame(x, y, w, h, title, body, sub = "") {
  return `<g transform="translate(${x} ${y})"><rect x="0" y="0" width="${w}" height="${h}" rx="18" fill="#FFFFFF" stroke="#D4D7DD" stroke-width="2"/>` +
    text(28, 44, title, 26, 700) + (sub ? text(28, 74, sub, 17, 400, "#5E697F") : "") + body + `</g>`;
}
// Embed a 1280×720 scene into a box.
function sceneBox(svg, x, y, w) { const k = w / 1280; return `<svg x="${x}" y="${y}" width="${w}" height="${720 * k}" viewBox="0 0 1280 720" overflow="hidden">${svg}</svg>`; }

async function plansza() {
  const W = 2560, H = 1440, pg = await page(W, H);
  let s = `<rect width="${W}" height="${H}" fill="#F5FAF7"/>`;
  s += text(48, 70, `Przewodnik Rodzica · modele obsady ${REWIZJA}`, 40, 700);
  s += text(48, 106, "Jeden rysownik, jedna konstrukcja głowy na osi szyi, stałe długości ramienia i przedramienia. Kod: v3/obsada/obsada.mjs + rekwizyty.mjs", 20, 400, "#5E697F");
  // A: family on one floor line
  s += frame(40, 130, 840, 640, "Rodzina i pracownica · wspólna podłoga, jedna skala",
    `<g transform="translate(-10 0)">${familyStanding(40, 580, .78)}</g>` + text(28, 618, "Wzrost: Paweł 1,00 · Marta 0,93 · pracownica 0,90. Głowa = 100 jednostek modelu.", 16, 400, "#5E697F"));
  // B: sofa duet
  s += frame(900, 130, 1000, 640, "Duet na kanapie · przekazanie 18/59 → 19/0",
    sceneBox(sofaScene("przekazanie"), 28, 84, 944) + text(28, 618, "SOFA: biodra Marty (427,490), Pawła (800,490), s = 1,28; łokieć Pawła na stosie (871,453).", 16, 400, "#5E697F"));
  // C: hospital
  s += frame(1920, 130, 600, 640, "Szpital", sceneBox(hospital(), 24, 84, 552)
    + text(24, 430, "Marta w stroju pacjentki z Olą,", 17, 400, "#5E697F") + text(24, 456, "Paweł zatrzymuje palec przed Olą.", 17, 400, "#5E697F")
    + text(24, 490, "Te same głowy i proporcje — zmienia", 17, 400, "#5E697F") + text(24, 516, "się garderoba, poza i tło.", 17, 400, "#5E697F"));
  // D: head views, one row, identical head height
  s += frame(40, 790, 2480, 620, "Trzy widoki głowy · identyczna wysokość głowy (korona → broda), wspólne linie konstrukcyjne",
    headViews(20, 150, 2440, 178));
  await shot(pg, s, join(here, "plansza-obsady-r1.png"));
}

// ── rotation / grip / sit test → test-obrotu.mp4 ───────────────────────────────────────────────────────────
function smoothstep(a, b, t) { const x = Math.max(0, Math.min(1, (t - a) / (b - a))); return x * x * (3 - 2 * x); }
function turnCurve(t) { // 0 front → .5 ¾ → 1 profile → .5 → 0, with holds
  const k = [[0, 0], [.12, 0], [.3, .5], [.38, .5], [.5, 1], [.6, 1], [.72, .5], [.8, .5], [.95, 0], [1, 0]];
  for (let i = 0; i < k.length - 1; i++) if (t <= k[i + 1][0]) return k[i][1] + (k[i + 1][1] - k[i][1]) * smoothstep(k[i][0], k[i + 1][0], t);
  return 0;
}
function obrotFrame(f) { // 0..59
  const t = f / 59, h = turnCurve(t);
  let s = `<rect width="1280" height="720" fill="#F5FAF7"/>`;
  s += person("marta", { x: 340, y: 880, s: 2.55, head: h, gaze: h * .5, left: [-70, -60, -60, 40], right: [70, -60, 60, 40] });
  s += person("pawel", { x: 940, y: 905, s: 2.45, head: -h, gaze: -h * .5, left: [-70, -60, -60, 40], right: [70, -60, 60, 40] });
  s += text(40, 56, "Obrót głowy na tej samej osi szyi · przód → ¾ → profil → ¾ → przód", 26, 700);
  s += text(40, 90, `klatka ${f}  ·  head Marta ${h.toFixed(2)}  ·  Paweł ${(-h).toFixed(2)}`, 20, 500, "#5E697F");
  return s;
}
// Grip test: Paweł's left hand pinches the short edge of a sheet: before contact, contact, under load, release.
function solveWrist(role, pose, side, target) {
  let w = [(target[0] - pose.x) / pose.s, (target[1] - pose.y) / pose.s];
  for (let i = 0; i < 8; i++) {
    const ps = { ...pose, [side]: [pose[side][0], pose[side][1], w[0], w[1]] };
    const j = joints(role, ps), g = side === "left" ? j.gripL : j.gripR;
    w = [w[0] + (target[0] - g[0]) / pose.s, w[1] + (target[1] - g[1]) / pose.s];
  }
  return w;
}
function chwytFrame(f) { // 0..29
  const t = f / 29;
  const phases = [[0, .3, "przed kontaktem"], [.3, .45, "kontakt"], [.45, .8, "pod obciążeniem"], [.8, 1.01, "puszczenie"]];
  const ph = phases.find(p => t >= p[0] && t < p[1]) ?? phases[3];
  const pull = smoothstep(.45, .8, t), release = smoothstep(.8, .95, t);
  const pw = 170, phh = 220, paperX = 560 - pull * 60, paperY = 560;
  const edge = R.paperPoint(paperX, paperY, pw, phh, -4, "edgeL");
  const approach = 1 - smoothstep(0, .3, t);
  const target = [edge[0] + 8 - approach * 60 - release * 10, edge[1] + 10 * approach + release * 40];
  const grip = t < .28 || t >= .82 ? "open" : "pinch";
  const base = { x: 200, y: 860, s: 1.75, seat: true, head: .4, nod: .45, gaze: .7, gazeDown: .6, legs: false, bow: .1,
    left: [-60, -60, -50, 0], right: [90, -60, 0, -60], leftGrip: "open", rightGrip: grip, wristR: -10 };
  const w = solveWrist("pawel", base, "right", target);
  const pose = { ...base, right: [90, -40, w[0], w[1]] };
  let s = person("pawel", { ...pose, parts: "body" }) + person("pawel", { ...pose, parts: "left" });
  s += R.paper(paperX, paperY, pw, phh, -4, { header: "ZASIŁEK", bend: pull * .45 * (1 - release), lift: pull * (1 - release) });
  s += person("pawel", { ...pose, parts: "right" });
  s += `<circle cx="${edge[0]}" cy="${edge[1]}" r="6" fill="none" stroke="#1A8648" stroke-width="2.4"/>`;
  s += text(40, 100, `chwyt: ${ph[2]}`, 24, 700, "#1A8648");
  return s;
}
// Sit test: Marta lowers onto the sofa cushion; pelvis first, then knees bend forward and the skirt settles on both knees.
function siadFrame(f) { // 0..29
  const u = f / 29, s = 1, floor = 494 + 158;
  const y = (floor - 188) + 30 * smoothstep(0, .75, u);
  const kn = smoothstep(.1, 1, u);
  const knees = [[-14 - 4 * kn, 96 - 60 * kn], [14 + 6 * kn, 96 - 60 * kn]];
  const feet = [[-13 - 9 * kn, 180 - 30 * kn], [13 + 9 * kn, 180 - 30 * kn]];
  let g = `<g transform="translate(533 0)">` + R.sofaBack();
  g += person("marta", { x: 427, y, s, seat: true, knees, feet, bow: .3 * Math.sin(Math.PI * u), head: .15, gazeDown: .4 * u,
    left: [-60, -60, -40 + 8 * kn, -14 + 18 * kn], right: [60, -60, 40 - 8 * kn, -14 + 18 * kn] });
  g += `</g>` + text(980, 100, "siad: miednica → kolana → tkanina", 24, 700, "#1A8648", "middle");
  return g;
}
async function obrot() {
  const pg = await page(1280, 720), dir = join(work, "obrot");
  rmSync(dir, { recursive: true, force: true }); mkdirSync(dir, { recursive: true });
  let n = 0;
  for (let f = 0; f < 60; f++) await shot(pg, obrotFrame(f), join(dir, `k${String(n++).padStart(3, "0")}.png`));
  for (let f = 0; f < 30; f++) {
    let s = `<rect width="1280" height="720" fill="#F5FAF7"/>` + text(40, 56, "Chwyt brzegu kartki i siad", 26, 700);
    s += `<g transform="translate(0 0) scale(1)">${chwytFrame(f)}</g>`;
    s += `<svg x="640" y="0" width="640" height="720" viewBox="640 0 640 720">${siadFrame(f)}</svg>`;
    await shot(pg, s, join(dir, `k${String(n++).padStart(3, "0")}.png`));
  }
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-framerate", "30", "-i", join(dir, "k%03d.png"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", join(here, "test-obrotu.mp4")]);
  // contact sheet for review
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-framerate", "30", "-i", join(dir, "k%03d.png"), "-vf", "select='not(mod(n\\,6))',scale=426:-1,tile=5x3", "-frames:v", "1", join(work, "obrot-arkusz.png")]);
  console.log(join(here, "test-obrotu.mp4"));
}

// ── regression sheet v2 vs r1 ─────────────────────────────────────────────────────────────────────────────
async function regresja() {
  execFileSync("node", [join(here, "regresja-v2.mjs")], { stdio: "inherit" });
  const W = 2560, H = 1440, pg = await page(W, H);
  let s = `<rect width="${W}" height="${H}" fill="#F5FAF7"/>` + text(48, 70, "Regresja głów · v2 (góra) wobec r1 (dół), wyrównana wysokość głowy", 38, 700);
  s += text(48, 106, "v2: każde ujęcie rysowało własny moduł głowy. r1: jedna konstrukcja na osi szyi — oczy, nasada nosa, ucho, żuchwa i linia włosów na tych samych poziomach.", 20, 400, "#5E697F");
  // crops: [file, cx, cy, headHeight, label]
  const crops = [["v2-01-30.png", 318, 250, 190, "v2 · 01 szpital · Marta"], ["v2-07-30.png", 478, 150, 228, "v2 · 07 profil Marty"],
    ["v2-01-30.png", 868, 196, 186, "v2 · 01 szpital · Paweł"], ["v2-08-40.png", 872, 160, 192, "v2 · 08 oczy Pawła"]];
  const box = 560, hh = 300, top = 150;
  crops.forEach(([file, cx, cy, h, label], i) => {
    const k = hh / h, vw = box / k, x = 48 + i * (box + 50);
    s += `<rect x="${x}" y="${top}" width="${box}" height="${box}" rx="16" fill="#FFFFFF" stroke="#D4D7DD" stroke-width="2"/>`;
    s += `<svg x="${x}" y="${top}" width="${box}" height="${box}" viewBox="${cx - vw / 2} ${cy - vw / 2} ${vw} ${vw}"><image href="${pathToFileURL(join(work, file)).href}" width="1280" height="720"/></svg>`;
    s += text(x + 16, top + box + 34, label, 22, 600);
  });
  const views = [["marta", .5, "r1 · Marta ¾ (01, 07)"], ["marta", 1, "r1 · Marta profil (07)"], ["pawel", -.5, "r1 · Paweł ¾ (01, 08)"], ["pawel", -.15, "r1 · Paweł oczy na Martę (08)"]];
  const top2 = 790;
  views.forEach(([role, h, label], i) => {
    const x = 48 + i * (box + 50), g = headGuides(role), sc = hh / g.H, cx = x + box / 2, cy = top2 + box / 2 + 120;
    s += `<rect x="${x}" y="${top2}" width="${box}" height="${box - 30}" rx="16" fill="#FFFFFF" stroke="#D4D7DD" stroke-width="2"/>`;
    const extra = role === "pawel" && h > -.3 ? { gaze: -.8, lid: .15, brow: -.3 } : { gaze: h * .4 };
    s += `<g clip-path="inset(0)"><rect x="${cx - 13 * sc}" y="${cy - 10 * sc}" width="${26 * sc}" height="${40 * sc}" fill="#FFEBDB" stroke="${INK}" stroke-width="2.4"/>` + head(role, { x: cx, y: cy, s: sc, head: h, line: .75, ...extra }) + `</g>`;
    for (const k of ["eyes", "noseRoot", "jaw"]) { const y = cy + g[k] * sc; s += `<path d="M${x + 10} ${y}h24M${x + box - 34} ${y}h24" stroke="#1A8648" stroke-width="2"/>`; }
    s += text(x + 16, top2 + box + 4 + 20, label, 22, 600);
  });
  await shot(pg, s, join(here, "regresja-v2-v3.png"));
}

async function debug() {
  const pg = await page(1280, 720);
  await shot(pg, sofaScene("przekazanie"), join(work, "debug-sofa.png"));
  await shot(pg, sofaScene("plansza"), join(work, "debug-sofa-plansza.png"));
  let g = `<rect width="1280" height="720" fill="#F5FAF7"/>`;
  const yaws = [-1, -.5, 0, .5, 1];
  ["marta", "pawel", "clerk"].forEach((r, i) => yaws.forEach((h, j) => { g += head(r, { x: 140 + j * 250, y: 170 + i * 230, s: 1.55, head: h }); }));
  await shot(pg, g, join(work, "debug-heads.png"));
  await shot(pg, `<rect width="1280" height="720" fill="#F5FAF7"/>` + familyStanding(30, 640, 1), join(work, "debug-family.png"));
  await shot(pg, hospital(), join(work, "debug-szpital.png"));
  // 360 px readability: the sofa frame scaled to 360 wide
  await shot(pg, `<rect width="1280" height="720" fill="#FFFFFF"/>` + sceneBox(sofaScene("przekazanie"), 0, 0, 360) + sceneBox(sofaScene("plansza"), 380, 0, 360) + sceneBox(hospital(), 760, 0, 360), join(work, "debug-360.png"), { x: 0, y: 0, width: 1120, height: 203 });
}

const mode = process.argv[2] ?? "all";
try {
  if (mode === "debug") await debug();
  if (mode === "all" || mode === "plansza") await plansza();
  if (mode === "all" || mode === "obrot") await obrot();
  if (mode === "all" || mode === "regresja") await regresja();
} finally { await browser?.close(); }
