// Przewodnik Rodzica v3 · props and sets, revision r1. Pure functions → SVG strings in the 1280×720 frame.
// Same ink/fill style as obsada.mjs (ink #283754, ~2.7 px line at s=1, flat fills).
//
// GRIP POINTS (local units of each prop, before its own rotation/scale; use the *Point() helpers to get px):
//   folder  (x,y = centre, w = drawn width, angle°, open 0..1)
//           spine (-0.5w, 0) · edge (0.5w, 0) · top (0,-0.6w) · bottom (0, 0.6w) · cornerTR · cornerBR · cornerBL
//           — when open, "edge" is the outer edge of the right (back) panel, "spine" the middle fold.
//   paper   (x,y = centre, w,h, angle°)  edgeL (-w/2,0) · edgeR (w/2,0) · top (0,-h/2) · bottom (0,h/2) ·
//           cornerTL/TR/BL/BR · header (−0.18w, −0.36h) = the printed title, where a finger lands.
//   shoe    (x,y = HEEL COLLAR "zapiętek" = the grip point, angle° 0 lying flat sole-down, 90 hanging toe-down)
//           toe (+46,+4)·s · sole centre (+16,+13)·s → on the floor use y = floorY − 13·s.
//   pram    (x,y = midpoint between the two wheel axles, s) handle (-150,-196)·s · canopy hinge (92,-160)·s ·
//           gondola rim front (88,-150)·s · Ola head (44,-184)·s.
// Use rekwizyty.folderPoint(...), paperPoint(...), shoePoint(...), pramPoint(...) with the same arguments + name.
import { ola, hand } from "./obsada.mjs";

const INK = "#283754", SKIN = "#FFEBDB", SAGE = "#B2CAAD", SAND = "#E9D5A6", SAND_DARK = "#CDB57F", PAPER = "#FFFDF7";
const BG = "#F5FAF7", FLOOR = "#EAF1EC", LINE = "#B8C7BD", SOFA = "#B9CDB4", SOFA_LIGHT = "#C9DAC4", SOFA_DARK = "#8EA889"; // sofa tints do weryfikacji
const f1 = n => Math.round(n * 10) / 10;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const P = (d, fill = "none", stroke = INK, w = 2.7, extra = "") =>
  `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"${extra}/>`;
const E = (x, y, rx, ry, fill, stroke = "none", w = 0) => `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
const G = (tr, body, extra = "") => `<g transform="${tr}"${extra}>${body}</g>`;
const T = (x, y, a = 0, s = 1) => `translate(${f1(x)} ${f1(y)})${a ? ` rotate(${f1(a)})` : ""}${s !== 1 ? ` scale(${f1(s * 1000) / 1000})` : ""}`;
const rotPt = (x, y, a, s, lx, ly) => { const r = a * Math.PI / 180; return [f1(x + s * (lx * Math.cos(r) - ly * Math.sin(r))), f1(y + s * (lx * Math.sin(r) + ly * Math.cos(r)))]; };
let uid = 0;
const nextId = p => `${p}${(++uid).toString(36)}`;

// ── SALON ──────────────────────────────────────────────────────────────────────────────────────────────────
// Layout matches SOFA in obsada.mjs: seat surface ≈ y 494, floor (feet) ≈ y 690, wall/floor junction y 652.
// salon({sofa=true, pram=true, lamp=true, breath}) = wall, floor, lamp, pram with Ola, sofaBack().
// Draw people AFTER salon(), then sofaFront() (armrests) on top.
export function salon(opts = {}) {
  let s = `<rect width="1280" height="720" fill="${BG}"/>`;
  s += `<rect y="652" width="1280" height="68" fill="${FLOOR}"/>` + P("M0 652H1280", "none", LINE, 2.2);
  // a framed picture and a plant on the right keep the wall from being empty
  s += P("M1110 250h110v86h-110Z", "#F9FBF6", "#A9BBAF", 2.2) + P("M1122 322l26 -30 18 18 14 -14 28 26", "none", "#9FB8A5", 2.2);
  s += P("M1150 652l8 -62h50l8 62Z", "#E8E1CC", INK, 2.4) + P("M1183 592c-4 -40 -30 -62 -52 -70c22 2 44 18 52 44c4 -36 22 -60 46 -70c-14 20 -28 50 -40 96", "#A9C4A3", INK, 2.2);
  if (opts.lamp !== false) {
    s += P("M215 640V178", "none", "#7C8A96", 5) + P("M188 652q27 -14 54 0Z", "#7C8A96", INK, 2.2);
    s += P("M164 178l22 -98h60l22 98Z", "#F6F1DD", INK, 2.7);
  }
  if (opts.pram !== false) s += pram(150, 620, .8, { breath: opts.breath ?? 0, roll: opts.roll ?? 0 });
  if (opts.sofa !== false) s += sofaBack();
  return s;
}
export function sofaBack() {
  let s = "";
  // legs
  s += P("M300 640l6 34h16l4 -34ZM992 640l-6 34h-16l-4 -34Z", "#7C8A96", INK, 2.4);
  // back frame + base
  s += P("M262 470C258 360 262 300 300 286C470 262 820 262 990 286C1028 300 1034 360 1030 470L1036 600Q1036 640 1000 642H296Q256 640 258 600Z", SOFA, INK, 2.8);
  // back cushions
  s += P("M332 476C326 400 330 330 360 318C450 304 560 302 640 304L644 476Z", SOFA_LIGHT, INK, 2.5);
  s += P("M644 476L640 304C720 302 840 304 930 318C960 330 964 400 958 476Z", SOFA_LIGHT, INK, 2.5);
  // seat cushions (top surface + front face)
  s += P("M318 492C318 470 340 462 380 462H640V560H340Q316 558 316 530Z", SOFA_LIGHT, INK, 2.6);
  s += P("M640 462H910C950 462 972 470 972 492L974 530Q974 558 950 560H640Z", SOFA_LIGHT, INK, 2.6);
  s += P("M330 506Q480 516 640 512Q800 516 962 506", "none", SOFA_DARK, 1.8);
  s += P("M296 600H998", "none", SOFA_DARK, 1.8);
  return s;
}
// Armrests, drawn after the people.
export function sofaFront(opts = {}) {
  let s = "";
  if (opts.left !== false) s += P("M238 452C232 410 248 392 284 390C322 390 338 406 338 440L340 610Q340 642 306 642H270Q238 642 238 610Z", SOFA, INK, 2.8)
    + P("M246 444C252 420 268 410 290 410C316 410 330 422 332 444", "none", SOFA_DARK, 1.8);
  if (opts.right !== false) s += P("M954 440C954 406 970 390 1008 390C1044 392 1060 410 1054 452L1054 610Q1054 642 1022 642H986Q952 642 952 610Z", SOFA, INK, 2.8)
    + P("M960 444C962 422 976 410 1002 410C1024 410 1040 420 1046 444", "none", SOFA_DARK, 1.8);
  return s;
}

// ── PRAM ───────────────────────────────────────────────────────────────────────────────────────────────────
// pram(x,y,s,{breath, roll (wheel deg), hood 0..1 (1 = up), ola=true, flip=false})
export function pram(x, y, s = 1, opts = {}) {
  const roll = opts.roll ?? 0, hood = clamp(opts.hood ?? 1, 0, 1), flip = opts.flip ? -1 : 1;
  let g = "";
  const wheel = (wx) => {
    let w = E(0, 0, 34, 34, "#F9FAF5", INK, 5.5) + E(0, 0, 25, 25, "none", INK, 1.6);
    for (let a = 0; a < 180; a += 30) w += G(`rotate(${a})`, P("M-25 0H25", "none", INK, 2));
    w += E(0, 0, 5, 5, INK);
    return G(`translate(${wx} 0) rotate(${f1(roll)})`, w);
  };
  // frame: crossed tubes + handle
  g += P("M-72 0L58 -104M72 0L-60 -104M-60 -104L-150 -192", "none", INK, 6.5);
  g += P("M-150 -192Q-158 -198 -176 -196", "none", INK, 9);
  g += E(0, -55, 7, 7, "#F9FAF5", INK, 3);
  g += wheel(-72) + wheel(72);
  // canopy (folding hood with ribs) hinged at (92,-160)
  const hx = 92, hy = -160, up = hood;
  const tip = [lerp(150, 40, up), lerp(-150, -268, up)];
  g += P(`M${hx - 112 * up - 20 * (1 - up)} -150C${hx - 110 * up} ${f1(-230 * up - 150 * (1 - up))} ${f1(tip[0] - 40)} ${f1(tip[1])} ${f1(tip[0] + 20)} ${f1(tip[1] + 4)}C${f1(tip[0] + 90)} ${f1(tip[1] + 30)} ${hx + 40} -200 ${hx + 30} -150Z`, SAGE, INK, 2.8);
  for (const k of [.3, .55, .8]) {
    const a = [lerp(hx - 100 * up, tip[0] + 10, k), lerp(-150, tip[1] + 4, k)];
    g += P(`M${hx} ${hy}L${f1(a[0])} ${f1(a[1] + 6 * k)}`, "none", "#86A383", 1.8);
  }
  // Ola + blanket
  if (opts.ola !== false) g += ola({ x: 44, y: -184, s: 1.35, facing: -1, breath: opts.breath ?? 0, angle: -10, blanket: false });
  const br = clamp(opts.breath ?? 0, 0, 1) * 3;
  g += P(`M-108 -150C-80 ${f1(-178 - br)} -10 ${f1(-186 - br)} 26 ${f1(-170 - br * .6)}L30 -150Z`, "#FBFAF3", INK, 2.6);
  g += P(`M-98 -152C-70 ${f1(-170 - br)} -20 ${f1(-176 - br)} 22 ${f1(-162 - br * .6)}L24 -151C-14 ${f1(-160 - br * .7)} -60 ${f1(-158 - br * .7)} -88 -150Z`, SAGE, "none");
  // gondola (tub)
  g += P("M-118 -150Q-120 -96 -84 -90H76Q112 -92 112 -150Z", "#FBFAF3", INK, 2.8);
  g += E(hx, hy, 6, 6, "#F9FAF5", INK, 3);
  g += P("M-118 -150H112", "none", INK, 2.8);
  return G(`translate(${f1(x)} ${f1(y)}) scale(${f1(s * flip * 1000) / 1000} ${f1(s * 1000) / 1000})`, g);
}

// ── OLA'S GRASP (photo + macro) ────────────────────────────────────────────────────────────────────────────
// grasp(p): Ola's fist around Paweł's index finger in a local 400×230 frame. p 0 = fingers open, 1 = full grip.
// The finger enters from the top-right; the baby forearm from the bottom-left. Fingers close one by one.
export function grasp(p = 1, opts = {}) {
  const q = clamp(p, 0, 1), lw = opts.line ?? 3.4;
  let g = "";
  // Paweł's finger + knuckle (adult)
  g += P("M430 -10L300 70C250 98 214 120 196 132C182 142 186 160 202 160C222 158 260 140 312 112L440 52Z", SKIN, INK, lw);
  g += P("M202 136q-8 10 2 18", "none", "#C9A893", lw * .6) + P("M258 104q10 4 14 14", "none", "#C9A893", lw * .6);
  // baby forearm and wrist
  g += P("M-20 260C10 230 60 196 120 168L158 196C110 228 60 250 20 280Z", SKIN, INK, lw);
  g += P("M118 172q12 10 12 22", "none", "#C9A893", lw * .7);
  // palm behind the finger
  g += P("M128 168C130 136 152 116 180 118C206 120 220 142 214 166C208 192 182 206 156 202C140 200 128 188 128 168Z", SKIN, INK, lw);
  // fingers wrapping over the adult finger, closing in sequence
  for (let i = 0; i < 4; i++) {
    const t = clamp(q * 1.6 - i * .2, 0, 1);
    const bx = 150 + i * 17, by = 128 - i * 4;
    const tipX = lerp(bx + 10, bx + 22, t), tipY = lerp(by - 36, by + 20, t);
    g += P(`M${bx - 7} ${by + 6}C${bx - 8} ${f1(lerp(by - 30, by - 14, t))} ${f1(tipX - 6)} ${f1(tipY - lerp(10, 8, t))} ${f1(tipX + 2)} ${f1(tipY)}C${f1(tipX + 8)} ${f1(tipY + 6)} ${bx + 9} ${by + 4} ${bx + 7} ${by + 10}Z`, SKIN, INK, lw * .85);
  }
  // thumb under
  g += P("M140 190C150 206 174 210 190 202", "none", INK, lw * .8);
  return g;
}

// ── FOLDER ─────────────────────────────────────────────────────────────────────────────────────────────────
// folder(x,y,w,angle,open) — sand folder; front cover has the photo of Ola's grasp (made with grasp(1)).
// w is the drawn width at the current open state (v2 convention). Portrait: closed height = 1.2·w.
export function folder(x, y, w = 165, angle = 0, open = 0, opts = {}) {
  const t = clamp(open, 0, 1), lw = 2.7 * (opts.line ?? 1);
  const totalU = 100 * (1 + t); // local units: one panel = 100 wide, 120 tall
  const sc = w / totalU;
  const H = 120;
  let g = "";
  const photo = (cx, cy, ws) => G(`translate(${cx} ${cy}) scale(${ws})`, P("M-34 -26H34V26H-34Z", "#FFFFFF", INK, lw / ws * .5) +
    G("translate(-28 -21) scale(.14 .18)", `<rect x="0" y="0" width="400" height="230" fill="#F1ECE6"/>` + grasp(1, { line: 5 })) + P("M-34 -26H34V26H-34Z", "none", INK, lw / ws * .5));
  if (t < .02) {
    g += P(`M-50 -60H34L50 -44V60H-50Z`, SAND, INK, lw);
    g += P("M34 -60L33 -45H50", "#F6E7C2", INK, lw * .7);
    g += P("M-44 -60V60", "none", SAND_DARK, lw * .5);
    g += photo(2, 2, .82);
    g += P("M-30 -52L-6 -28M14 32L32 50", "none", "#FFFFFF", lw * .8, ' opacity=".75"');
  } else {
    // right (back) panel with the inner pocket and papers, left = open front cover (inside, photo seen through the sleeve)
    const skew = 10 * t;
    g += P(`M0 -60H100V60H0Z`, SAND, INK, lw);
    g += P(`M6 -20H94V56H6Z`, "#F2E3BD", SAND_DARK, lw * .6);
    g += P(`M${-100 * t} ${-60 + skew}L0 -60V60L${-100 * t} ${60 - skew * .4}Z`, "#F1DFB4", INK, lw);
    if (t > .5) g += photo(-50 * t, 0, .7 * t);
    g += P("M0 -60V60", "none", SAND_DARK, lw * .8);
  }
  const shift = t < .02 ? 0 : (-100 * t + 100) / 2;
  return G(`${T(x, y, angle, 1)} scale(${f1(sc * 1000) / 1000}) translate(${f1(-shift)} 0)`, g);
}
export function folderPoint(x, y, w, angle, open, name) {
  const t = clamp(open, 0, 1), sc = w / (100 * (1 + t)), shift = t < .02 ? 0 : (-100 * t + 100) / 2;
  const L = t < .02 ? { spine: [-50, 0], edge: [50, 0], top: [0, -60], bottom: [0, 60], cornerTR: [42, -52], cornerBR: [50, 60], cornerBL: [-50, 60] }
    : { spine: [0, 0], edge: [100, 0], top: [50, -60], bottom: [50, 60], cornerTR: [100, -60], cornerBR: [100, 60], cornerBL: [-100 * t, 60] };
  const q = L[name] ?? [0, 0];
  return rotPt(x, y, angle, sc, q[0] - shift, q[1]);
}

// ── PAPER ──────────────────────────────────────────────────────────────────────────────────────────────────
// paper(x,y,w,h,angle,{header:"ZASIŁEK", fold 0..1 dog-ear TR, bend −1..1 bow of the whole sheet,
//   curl 0..1 lifted bottom-right corner, lift 0..1 lifted left edge (being pulled), boxes=true, lines=true, opacity})
export function paper(x, y, w = 100, h = 130, angle = 0, opts = {}) {
  if (typeof opts === "number") opts = { fold: opts };
  const fold = clamp(opts.fold ?? 0, 0, 1), bend = clamp(opts.bend ?? 0, -1, 1), curl = clamp(opts.curl ?? 0, 0, 1), lift = clamp(opts.lift ?? 0, 0, 1);
  const hw = w / 2, hh = h / 2, lw = 2.2 * (opts.line ?? 1);
  const b = bend * h * .12, fc = fold * Math.min(w, h) * .2, cc = curl * Math.min(w, h) * .32;
  // outline: TL → TR (dog-ear) → BR (curl) → BL, sides bowed by bend
  let d = `M${f1(-hw - lift * 4)} ${f1(-hh)}Q0 ${f1(-hh - b)} ${f1(hw - fc)} ${f1(-hh)}L${f1(hw)} ${f1(-hh + fc)}`;
  d += `Q${f1(hw + b * .3)} 0 ${f1(hw)} ${f1(hh - cc)}`;
  d += cc > .5 ? `Q${f1(hw - cc * .2)} ${f1(hh - cc * .2)} ${f1(hw - cc)} ${f1(hh)}` : "";
  d += `Q0 ${f1(hh - b)} ${f1(-hw - lift * 4)} ${f1(hh)}Q${f1(-hw - b * .3 - lift * 6)} 0 ${f1(-hw - lift * 4)} ${f1(-hh)}Z`;
  let g = P(d, PAPER, INK, lw);
  if (fc > .5) g += P(`M${f1(hw - fc)} ${f1(-hh)}L${f1(hw - fc * .9)} ${f1(-hh + fc * .9)}L${f1(hw)} ${f1(-hh + fc)}Z`, "#E6EEE7", INK, lw * .7);
  if (cc > .5) g += P(`M${f1(hw)} ${f1(hh - cc)}Q${f1(hw - cc * .9)} ${f1(hh - cc * .9)} ${f1(hw - cc)} ${f1(hh)}Q${f1(hw - cc * .35)} ${f1(hh - cc * .35)} ${f1(hw)} ${f1(hh - cc)}Z`, "#E6EEE7", INK, lw * .7);
  // header text
  const cl = Math.max(0, Math.min(1, opts.lines ?? 1));
  let yy = -hh + h * .14;
  if (opts.header) {
    const fs = Math.max(6, w * .13);
    g += `<text x="${f1(-hw + w * .1)}" y="${f1(-hh + h * .16)}" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="${f1(fs)}" fill="${INK}" letter-spacing=".3">${opts.header}</text>`;
    yy = -hh + h * .25;
  } else g += P(`M${f1(-hw + w * .1)} ${f1(-hh + h * .12)}h${f1(w * .42)}`, "none", "#647C72", lw * 1.4);
  if (opts.lines !== false) for (let i = 0; i < 4; i++) {
    const ly = yy + i * h * .085, len = w * (i === 3 ? .5 : .76);
    g += P(`M${f1(-hw + w * .1)} ${f1(ly)}q${f1(len / 2)} ${f1(-b * .15)} ${f1(len)} 0`, "none", "#98A6AC", lw * .7);
  }
  if (opts.boxes !== false) {
    const by = yy + h * .38, bw = w * .78, bh = h * .14;
    g += P(`M${f1(-hw + w * .1)} ${f1(by)}h${f1(bw)}v${f1(bh)}h${f1(-bw)}Z`, "none", "#7E8F98", lw * .7);
    for (const k of [1, 2, 3]) g += P(`M${f1(-hw + w * .1 + bw * k / 4)} ${f1(by)}v${f1(bh)}`, "none", "#7E8F98", lw * .6);
    g += P(`M${f1(-hw + w * .1)} ${f1(by + bh + h * .07)}h${f1(w * .5)}`, "none", "#98A6AC", lw * .7);
  }
  return G(T(x, y, angle), g, opts.opacity != null ? ` opacity="${opts.opacity}"` : "");
}
export function paperPoint(x, y, w, h, angle, name) {
  const L = { edgeL: [-w / 2, 0], edgeR: [w / 2, 0], top: [0, -h / 2], bottom: [0, h / 2], cornerTL: [-w / 2, -h / 2], cornerTR: [w / 2, -h / 2],
    cornerBL: [-w / 2, h / 2], cornerBR: [w / 2, h / 2], header: [-w * .18, -h * .36], center: [0, 0] };
  const q = L[name] ?? [0, 0];
  return rotPt(x, y, angle, 1, q[0], q[1]);
}

// ── SHOE ───────────────────────────────────────────────────────────────────────────────────────────────────
// shoe(x,y,angle,s,{hang}) — Paweł's dark shoe in side view. x,y = heel collar (grip point "zapiętek").
// angle 0: lying on its sole, toe to screen-right; 90: hanging toe-down. {hang:true} = angle 90 shortcut. flip mirrors.
export function shoe(x, y, angle = 0, s = 1, opts = {}) {
  const a = opts.hang ? 90 + angle : angle, fl = opts.flip ? -1 : 1;
  const g = P("M-4 -2C2 6 16 6 28 4C38 2 46 4 50 10C52 14 50 18 44 18H-6C-10 18 -12 14 -11 8C-10 2 -8 -2 -4 -2Z", "#283754", INK, 2.4)
    + P("M-6 14H48", "none", "#56627A", 1.6) + P("M0 0C8 4 18 4 26 2", "none", "#56627A", 1.4) + E(0, 1, 3, 1.6, "#56627A");
  return G(`${T(x, y, a, s)} scale(${fl} 1)`, g);
}
export function shoePoint(x, y, angle, s, name, opts = {}) {
  const a = opts.hang ? 90 + angle : angle;
  const L = { heel: [0, 0], toe: [46, 4], sole: [16, 13] }, q = L[name] ?? [0, 0];
  return rotPt(x, y, a, s, q[0] * (opts.flip ? -1 : 1), q[1]);
}
export const pramPoint = (x, y, s, name) => {
  const L = { handle: [-150, -196], hinge: [92, -160], rim: [88, -150], ola: [44, -184] }, q = L[name] ?? [0, 0];
  return [f1(x + q[0] * s), f1(y + q[1] * s)];
};

// ── QUEUE (ZUS hall) ───────────────────────────────────────────────────────────────────────────────────────
// queue({counter=true}) — hall with a window left, door, ZUS sign, counter window "2" at the right.
// The counter top is at y 470 (clerk seated behind it, hips ≈ (1110, 520), s ≈ 1).
export function queue(opts = {}) {
  let s = `<rect width="1280" height="720" fill="${BG}"/>`;
  s += `<rect y="590" width="1280" height="130" fill="${FLOOR}"/>` + P("M0 590H1280", "none", LINE, 2.2);
  s += P("M30 70H330V280H30Z", "#E9F2EC", "#A9BBAF", 2.4) + P("M180 70V280M30 175H330", "none", "#A9BBAF", 2.4);
  s += P("M60 280c10 -40 40 -56 70 -50c20 -30 60 -26 76 4c30 -6 60 14 64 46Z", "#CFE0CF", "none");
  s += P("M560 160H700V590H560Z", "#EEF3EF", "#A9BBAF", 2.4) + E(682, 380, 4, 4, "#7C8A96");
  s += P("M740 120H900V200H740Z", "#FFFFFF", "#A9BBAF", 2.2) + `<text x="820" y="174" text-anchor="middle" font-family="Inter, Arial" font-weight="700" font-size="40" fill="#283754">ZUS</text>` + P("M768 186H872", "none", "#A6D0B8", 6);
  s += P("M60 520H230V560H60Z", "#D9E6DC", INK, 2) + P("M70 560V590M220 560V590", "none", INK, 2.5);
  // stanchions with green rope
  for (const sx of [760, 860]) s += P(`M${sx} 440V588M${sx - 16} 590H${sx + 16}`, "none", "#7C8A96", 4);
  s += P("M760 452Q810 470 860 452", "none", "#1A8648", 3.5);
  if (opts.counter !== false) {
    s += P("M960 110H1280V470H960Z", "#E6EFEA", "#A9BBAF", 2.4) + P("M1120 110V470", "none", "#C9D6CD", 2);
    s += P("M1200 130H1250V176H1200Z", "#FFFFFF", INK, 2.2) + `<text x="1225" y="165" text-anchor="middle" font-family="Inter, Arial" font-weight="700" font-size="30" fill="#283754">2</text>`;
    s += P("M940 470H1280V600H940Z", "#F4F7F3", INK, 2.6) + P("M930 462H1280V478H930Z", "#DDE7DF", INK, 2.4);
  }
  return s;
}
export function queueCounter() { return P("M940 470H1280V600H940Z", "#F4F7F3", INK, 2.6) + P("M930 462H1280V478H930Z", "#DDE7DF", INK, 2.4); }

// ── WARD (hospital room) ───────────────────────────────────────────────────────────────────────────────────
// ward({bed=true}) — window right, bed from the left: mattress top ≈ y 470, pillow at x 140–300.
// Marta sits in it with hips ≈ (330, 478), s ≈ 1.05; draw wardFront() (blanket) after her body, before Ola/arms.
export function ward(opts = {}) {
  let s = `<rect width="1280" height="720" fill="${BG}"/>`;
  s += `<rect y="610" width="1280" height="110" fill="${FLOOR}"/>` + P("M0 610H1280", "none", LINE, 2.2);
  s += P("M880 90H1200V350H880Z", "#E6F0EB", "#A9BBAF", 2.4) + P("M1040 90V350M880 220H1200", "none", "#A9BBAF", 2.4);
  s += P("M900 350c20 -50 70 -60 100 -40c20 -40 80 -40 100 0c30 -10 70 10 80 40Z", "#D3E3D4", "none");
  s += P("M640 120H760V170H640Z", "#FFFFFF", "#C9D6CD", 2);
  if (opts.bed !== false) s += wardBed();
  return s;
}
export function wardBed() {
  return P("M40 300V640M40 380H80", "none", "#7C8A96", 6) + P("M40 470H700Q730 470 730 500V560H40Z", "#FFFFFF", INK, 2.6)
    + P("M60 560V650M700 560V650", "none", "#7C8A96", 6)
    + P("M110 400C110 370 140 360 200 362C270 364 300 372 300 400C300 440 270 460 200 460C140 460 110 440 110 400Z", "#FFFFFF", INK, 2.4);
}
export function wardFront() {
  return P("M220 520C300 500 520 494 720 500Q744 504 742 530L736 580H210Q196 548 220 520Z", "#DCE9E4", INK, 2.6) + P("M260 540Q480 528 700 534", "none", "#B5CCC4", 2);
}

export const rekwizyty = { salon, sofaBack, sofaFront, pram, pramPoint, grasp, folder, folderPoint, paper, paperPoint, shoe, shoePoint, queue, queueCounter, ward, wardBed, wardFront, ola, hand };
