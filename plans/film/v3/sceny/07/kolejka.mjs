// Blok b07 (ujęcia 07–12) · wspólny świat kolejki ZUS, kamera i pomocnicze funkcje bloku.
// Everything is drawn in ONE world (the "plan ogólny" of 09/11, 1280×720, people at s = 1, floor y = 590)
// and every shot looks at it through cam(z, cx, cy). Cast and props come only from the r1 kit `k`
// (k.person, k.pram, k.folder, k.paper, k.queue). Strokes are thinned by z^-0.6 so a 1.9× close-up
// gets ≈3.5 px lines instead of 5 px. Pure functions of the frame number — no state between frames.

// ── timing helpers ──────────────────────────────────────────────────────────────────────────────────
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const span = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
export const mix = (a, b, t) => a + (b - a) * t;
export const ss = t => t * t * (3 - 2 * t);                          // smoothstep
export const inOut = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
export const out = t => 1 - Math.pow(1 - t, 3);
export const inn = t => t * t * t;
// keyed value: keys = [[frame, value], ...] eased with smoothstep between keys
export function key(f, keys, ease = ss) {
  if (f <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [a, va] = keys[i], [b, vb] = keys[i + 1];
    if (f <= b) return mix(va, vb, ease(span(f, a, b)));
  }
  return keys[keys.length - 1][1];
}
const r2 = n => Math.round(n * 100) / 100;

// ── voices: envelopes from montaz/assets/mowa.json, global frames 360–719, quantised 0–9 ──────────────
const ENV = {
  marta: "599799999997999996997259999999990599999999999699661999999999969956679999763010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  pawel: "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000005999947521113420999988833139998744998332110000000000000000999926939933789984225665423179993797239999744121669732263019614320000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
  clerk: "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001999985512249997636412685665542558840110000000000000000299999938",
};
export function voice(who, g) { const s = ENV[who], i = g - 360; return i < 0 || i >= s.length ? 0 : +s[i] / 9; }
// mouth pose for k.person: closed below the threshold, otherwise opening + a deterministic viseme cycle
export function lips(who, g) {
  const v = (voice(who, g) * 2 + voice(who, g - 1)) / 3;
  if (v < .2) return { mouth: 0, viseme: undefined };
  const cyc = ["A", "E", "A", "O", "E", "M"][Math.floor(g / 3) % 6];
  return v > .6 ? { mouth: v * .8, viseme: cyc === "M" ? undefined : cyc } : { mouth: v * .55, viseme: undefined };
}

// Ola's breathing in the pram: one cycle of 34 frames, inhale 07/27→07/44, exhale →08/1 (global 387–421).
export const breath = g => .5 - .5 * Math.cos(2 * Math.PI * (g - 387) / 34);

// ── world layout (plan ogólny, s = 1) ─────────────────────────────────────────────────────────────────
export const FLOOR = 590;
export const PRAM_S = .95, PRAM_Y = FLOOR - 32;                    // axle midpoint y
export const HIP_Y = { marta: FLOOR - 188, pawel: FLOOR - 212, clerk: 420 };
export const CLERK = { x: 1130, y: 420 };                          // seated behind the counter
export const COUNTER = { x0: 960, top: 352, slab: 16 };            // counter top surface y = 360
export const SHEET = { w: 64, h: 84 };                              // one print, world px
export const FOLDER_W = 88;                                         // closed folder width (r1 folder: height 1.2·w)
// folder spine relative to Paweł's hips
export const FOLDER_OFF = [12, -48], FOLDER_ANG = -5;               // as b01 (03–06): upright against the chest

// camera: world → screen
export function cam(z = 1, cx = 640, cy = 360) {
  return { z, cx, cy, X: x => (x - cx) * z + 640, Y: y => (y - cy) * z + 360, tr: `translate(${r2(640 - cx * z)} ${r2(360 - cy * z)}) scale(${r2(z * 1000) / 1000})` };
}
export const thin = (svg, k) => svg.replace(/stroke-width="([\d.]+)"/g, (m, v) => `stroke-width="${r2(v * k)}"`);
export function shoot(c, world) { return `<g transform="${c.tr}">${thin(world, Math.pow(c.z, -.6))}</g>`; }

// rotate a sheet-local point into world
export function rot(cx, cy, ang, lx, ly) { const a = ang * Math.PI / 180; return [cx + lx * Math.cos(a) - ly * Math.sin(a), cy + lx * Math.sin(a) + ly * Math.cos(a)]; }
// inverse: where the sheet centre must be so that its local point (lx,ly) sits on world point p
export function centreFor(p, ang, lx, ly) { const q = rot(0, 0, ang, lx, ly); return [p[0] - q[0], p[1] - q[1]]; }

// Two-bone wrist solver on the r1 rig: moves the wrist target until joints().grip lands on `target` (world px).
export function solve(k, role, pose, side, target) {
  const key = side === "left" ? "left" : "right", s = pose.s ?? 1;
  const arm = pose[key] ?? [side === "left" ? -60 : 60, -70, 0, 0];
  const gripOf = w => { const j = k.joints(role, { ...pose, [key]: [arm[0], arm[1], w[0], w[1]] }); return side === "left" ? j.gripL : j.gripR; };
  const err = w => { const g = gripOf(w); return Math.hypot(g[0] - target[0], g[1] - target[1]); };
  // 1) search the forearm direction: wrist = target − 26·(cos θ, sin θ); keep the best IK branch
  const T = [(target[0] - pose.x) / s, (target[1] - pose.y) / s];
  let best = null;
  for (let a = 0; a < 360; a += 6) {
    const r = a * Math.PI / 180, w = [T[0] - 26 * Math.cos(r), T[1] - 26 * Math.sin(r)], e = err(w);
    if (!best || e < best.e) best = { w, e };
  }
  // 2) refine with small damped steps from there
  let w = best.w;
  for (let i = 0; i < 16; i++) {
    const g = gripOf(w);
    const nw = [w[0] + .5 * (target[0] - g[0]) / s, w[1] + .5 * (target[1] - g[1]) / s];
    if (err(nw) > err(w)) break;
    w = nw;
  }
  return [arm[0], arm[1], r2(w[0]), r2(w[1])];
}
// set an arm so its grip lands on a world target; returns the pose (copy). The elbow hint picks the IK branch;
// when that branch cannot put the grip on the target (forearm direction fixed by the joint lengths), the
// other hints are tried and the closest result wins (given hint preferred within 1.5 px).
export function reach(k, role, pose, side, target, elbowHint, strict = false) {
  const hints = [elbowHint ?? pose[side]?.slice(0, 2) ?? [side === "left" ? -60 : 60, -70]];
  const sx = side === "left" ? -1 : 1;
  for (const h of [[sx * 100, -100], [sx * 40, -20], [sx * 90, 10], [sx * 20, -90]]) hints.push(h);
  let best = null;
  for (const [i, h] of hints.entries()) {
    const p = { ...pose, [side]: [h[0], h[1], 0, 0] };
    p[side] = solve(k, role, p, side, target);
    const j = k.joints(role, p), g = side === "left" ? j.gripL : j.gripR, e = Math.hypot(g[0] - target[0], g[1] - target[1]);
    if (i === 0 && (e < 1.5 || strict)) return p;
    if (!best || e < best.e) best = { p, e };
  }
  return best.p;
}

// ── sheets ────────────────────────────────────────────────────────────────────────────────────────────
// The three prints in Paweł's folder. Local label row = the underlined paragraph (v2 scene 10 wording).
export const SHEETS = {
  P: { header: "POTWIERDZENIE", label: "Data wpływu", ly: 10, lx: -2, back: false },
  Z: { header: "ZASIŁEK", label: "Podstawa", ly: 10, lx: -28, back: false },
  U: { header: "", label: "Okres", ly: 22, lx: 4, back: true },   // URLOP turned over in 06: grid side, no title
};
const INK = "#283754", GREEN = "#1A8648", MUTED = "#5E697F";
export function sheet(k, id, x, y, ang, opts = {}) {
  const S = SHEETS[id], w = SHEET.w, h = SHEET.h;
  let s = k.paper(x, y, w, h, ang, { header: S.header || undefined, lines: !S.back, boxes: S.back, line: .9, curl: opts.curl ?? 0, bend: opts.bend ?? 0 });
  if (S.header && S.header.length > 9) { // long title: shrink so it stays on the sheet (paper() sizes by width only)
    s = k.paper(x, y, w, h, ang, { lines: true, boxes: false, line: .9, curl: opts.curl ?? 0, bend: opts.bend ?? 0 })
      + `<g transform="translate(${r2(x)} ${r2(y)}) rotate(${r2(ang)})"><text x="${-w / 2 + w * .1}" y="${-h / 2 + h * .16}" font-family="Inter, Arial, sans-serif" font-weight="700" font-size="5.6" fill="${INK}" letter-spacing=".2">${S.header}</text></g>`;
  }
  if (opts.mark === false) return s;   // held URLOP (07–09): no mark visible, as in 06
  // underlined paragraph (green underline = Paweł's marking); size in world px
  const lx = S.lx;
  s += `<g transform="translate(${r2(x)} ${r2(y)}) rotate(${r2(ang)})">`
    + `<rect x="${lx - 1}" y="${S.ly - 6.5}" width="${Math.min(w * .78, w / 2 - lx - 2)}" height="15" fill="#FFFDF7"/>`
    + `<text x="${lx}" y="${S.ly}" font-family="Inter, Arial, sans-serif" font-weight="600" font-size="7.4" fill="${INK}">${S.label}</text>`
    + `<path d="M${lx} ${S.ly + 2.6}h${S.label.length * 4}" stroke="${GREEN}" stroke-width="1.6" stroke-linecap="round" fill="none"/>`
    + `<path d="M${lx} ${S.ly + 7}h${Math.min(w * .6, w / 2 - lx - 4)}" stroke="#98A6AC" stroke-width="1.2" fill="none"/></g>`;
  return s;
}
// Folder as drawn by rekwizyty.folder, keeping the back panel in place while the front cover opens (12).
// Coordinator 06→07: the photo on the cover is the 02 grasp image (photo02, same overlay as b01 in 03–06).
import { photo02 } from "../02/scene.mjs";
import { PHOTO_IN_FOLDER } from "../03/kolejka.mjs";
export function folderSvg(k, F) {
  const t = F.open ?? 0, sc = F.w / 100;
  if (t < .02) return k.folder(F.x, F.y, F.w, F.ang, 0)
    + `<g transform="translate(${r2(F.x)} ${r2(F.y)}) rotate(${F.ang}) scale(${sc})"><path d="M-27 -22H32V28H-27Z" fill="#E9D5A6"/><path d="M-25.88 -19.32H29.88V23.32H-25.88Z" fill="#FFFFFF" stroke="#283754" stroke-width="1.35"/><clipPath id="b07-pic"><path d="M-20.96 -15.22H24.96V18.73H-20.96Z"/></clipPath><g clip-path="url(#b07-pic)"><g transform="${PHOTO_IN_FOLDER}">${photo02(k)}</g></g><path d="M-20.96 -15.22H24.96V18.73H-20.96Z" fill="none" stroke="#283754" stroke-width=".6"/></g>`;
  const c = rot(F.x, F.y, F.ang, -50 * t * sc, 0);
  return k.folder(c[0], c[1], F.w * (1 + t), F.ang, t);
}

// ── hall: r1 queue() without its low counter + our counter at standing-hip height, clerk, display ──────
export function hallBack(k) {
  let s = k.queue({ counter: false });
  // glass partition frame above the counter, open window in the middle where the clerk sits
  s += `<path d="M960 110H1280V352H960Z" fill="#E6EFEA" stroke="#A9BBAF" stroke-width="2.4"/>`;
  s += `<path d="M1200 130H1250V176H1200Z" fill="#FFFFFF" stroke="${INK}" stroke-width="2.2"/><text x="1225" y="165" text-anchor="middle" font-family="Inter, Arial" font-weight="700" font-size="30" fill="${INK}">2</text>`;
  return s;
}
export function display(n) { // queue number display over the counter
  return `<path d="M1082 116H1178V156H1082Z" fill="${INK}" stroke="${INK}" stroke-width="2.2"/>`
    + `<text x="1130" y="146" text-anchor="middle" font-family="Inter, Arial" font-weight="700" font-size="26" fill="#A6D0B8" letter-spacing="1">A${n}</text>`;
}
export function counter() {
  const { x0, top, slab } = COUNTER;
  return `<path d="M${x0 + 8} ${top + slab}H1280V${FLOOR + 6}H${x0 + 8}Z" fill="#F4F7F3" stroke="${INK}" stroke-width="2.6"/>`
    + `<path d="M${x0 - 6} ${top}H1280V${top + slab}H${x0 - 6}Z" fill="#DDE7DF" stroke="${INK}" stroke-width="2.4"/>`
    + `<path d="M${x0 + 30} ${top + 60}H1260" stroke="#C9D6CD" stroke-width="2" fill="none"/>`;
}
// glass panes left and right of the service window (drawn in front of the clerk, never over her face)
export function glass() {
  return `<path d="M962 112H1056V350H962ZM1206 112H1278V350H1206Z" fill="#DCEBE4" opacity=".55"/>`
    + `<path d="M1056 112V350M1206 112V350" stroke="#A9BBAF" stroke-width="2.4" fill="none"/>`
    + `<path d="M980 300L1030 150M1222 320L1262 200" stroke="#FFFFFF" stroke-width="3" opacity=".7" fill="none"/>`;
}

// ── extras (statyści): no r1 model exists → light, faceless, seen from behind/side; request filed ─────
// Colours of coats, hair and bags are not DESIGN.md tokens → do weryfikacji.
// lady: elderly client with a handbag, walking screen-right. x = between the feet, phase = walk cycle 0..1
export function lady(x, floor, s, phase = 0, walking = 0, bagLag = 0) {
  const w = walking, sw = Math.sin(phase * 2 * Math.PI) * 14 * w, lift = Math.max(0, Math.sin(phase * 2 * Math.PI)) * 4 * w;
  const C = "#D8D1C2", D = "#8C8A82", HAIR = "#ECEDEE", L = "#5E697F";
  let g = "";
  g += `<path d="M${-6 - sw} 0L-4 -70M${6 + sw} ${-lift}L4 -70" stroke="${L}" stroke-width="9" stroke-linecap="round" fill="none"/>`;
  g += `<path d="M${-12 - sw} 2h14M${2 + sw} ${2 - lift}h14" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`;
  g += `<path d="M-30 -60C-32 -110 -28 -150 -18 -168C-6 -176 10 -176 20 -168C30 -150 32 -110 30 -60Z" fill="${C}" stroke="${D}" stroke-width="2.4"/>`;
  g += `<path d="M2 -164V-64" stroke="#C3BBAA" stroke-width="1.6"/>`;
  g += `<ellipse cx="2" cy="-188" rx="17" ry="19" fill="#F3E2D3" stroke="${D}" stroke-width="2.2"/>`;
  g += `<path d="M-16 -190C-18 -212 20 -214 20 -192C14 -200 -6 -202 -16 -190Z" fill="${HAIR}" stroke="${D}" stroke-width="2"/>`;
  g += `<circle cx="-10" cy="-200" r="5" fill="${HAIR}" stroke="${D}" stroke-width="1.6"/><circle cx="2" cy="-206" r="5" fill="${HAIR}" stroke="${D}" stroke-width="1.6"/>`;
  // arm + bag (lags behind the step)
  const ba = 8 - bagLag * 18;
  g += `<g transform="translate(22 -146) rotate(${r2(ba)})"><path d="M0 0L2 58" stroke="${C}" stroke-width="12" stroke-linecap="round"/><path d="M2 58l-2 6" stroke="#F3E2D3" stroke-width="7" stroke-linecap="round"/>`
    + `<path d="M-6 64C-8 54 12 54 10 64" stroke="${D}" stroke-width="2.2" fill="none"/><path d="M-12 64H18L15 96H-9Z" fill="#B9AE98" stroke="${D}" stroke-width="2.2"/></g>`;
  return `<g transform="translate(${r2(x)} ${r2(floor)}) scale(${s})" opacity=".92">${g}</g>`;
}
// bob: client with a dark bob and a shoulder bag at the window, back three-quarter view, facing screen-right
export function bob(x, floor, s, step = 0) {
  const C = "#E3DED3", D = "#8C8A82", HAIR = "#3B4660", L = "#7C8A96", st = step * 10;
  let g = "";
  g += `<path d="M-8 0L-6 -72M${8 + st} ${-Math.sin(step * Math.PI) * 5}L6 -72" stroke="${L}" stroke-width="9" stroke-linecap="round" fill="none"/>`;
  g += `<path d="M-16 2h14M${2 + st} ${2 - Math.sin(step * Math.PI) * 5}h14" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`;
  g += `<path d="M-28 -66C-30 -112 -26 -152 -16 -168C-4 -176 12 -176 22 -168C32 -152 32 -112 28 -66Z" fill="${C}" stroke="${D}" stroke-width="2.4"/>`;
  g += `<path d="M-14 -166L28 -96" stroke="#6E6656" stroke-width="3"/><path d="M18 -110H40L38 -80H20Z" fill="#9FB8A5" stroke="${D}" stroke-width="2.2"/>`;
  g += `<ellipse cx="4" cy="-190" rx="17" ry="19" fill="#F3E2D3" stroke="${D}" stroke-width="2.2"/>`;
  g += `<path d="M-16 -176C-22 -206 -4 -214 8 -212C24 -210 28 -194 24 -178C18 -180 8 -178 4 -182C-2 -176 -10 -174 -16 -176Z" fill="${HAIR}" stroke="${INK}" stroke-width="2"/>`;
  return `<g transform="translate(${r2(x)} ${r2(floor)}) scale(${s})" opacity=".92">${g}</g>`;
}

// ── one frame of the world ────────────────────────────────────────────────────────────────────────────
// st: { marta, pawel, clerk (poses in world px, s = 1), pram {x, roll, breath}, folder {x,y,w,ang} (spine),
//       inFolder [{id,x,y,ang}], free [{id,x,y,ang,curl}], lady, bob, disp, hall:true }
export function world(k, st) {
  let s = "";
  if (st.hall !== false) s += hallBack(k) + display(st.disp ?? 16);
  if (st.clerk) s += k.person("clerk", { ...st.clerk, legs: false, parts: "body" });
  if (st.hall !== false) s += glass();
  if (st.lady) s += lady(st.lady.x, st.lady.floor ?? FLOOR - 22, st.lady.s ?? 2.0, st.lady.phase, st.lady.walking, st.lady.bagLag);
  if (st.hall !== false) s += counter();
  if (st.bob) s += bob(st.bob.x, FLOOR - 10, 2.05, st.bob.step);
  if (st.marta) s += k.person("marta", { ...st.marta, parts: "body" });
  if (st.pram) s += k.pram(st.pram.x, PRAM_Y, PRAM_S, { breath: st.pram.breath, roll: st.pram.roll });
  if (st.marta) s += k.person("marta", { ...st.marta, parts: "left" });
  if (st.pawel) s += k.person("pawel", { ...st.pawel, parts: "body" });
  if (st.folder) { // prints stand in the folder: drawn first, the cover hides their lower part
    for (const p of st.inFolder ?? []) s += sheet(k, p.id, p.x, p.y, p.ang, p);
    s += folderSvg(k, st.folder);
  }
  if (st.pawel) s += k.person("pawel", { ...st.pawel, parts: "right" });    // folder hand, behind a free print
  for (const p of st.free ?? []) s += sheet(k, p.id, p.x, p.y, p.ang, p);
  if (st.clerk) s += k.person("clerk", { ...st.clerk, parts: "arms" });
  if (st.marta) s += k.person("marta", { ...st.marta, parts: "right" });
  if (st.pawel) s += k.person("pawel", { ...st.pawel, parts: "left" });     // working hand (as in 05–06)
  return s;
}

// ── shared poses of the block ─────────────────────────────────────────────────────────────────────────
// Folder (closed, upright, held by Paweł's screen-right hand as in 03–06 of b01) and prints standing in it.
// Print offsets [dx, dy, angle°] are in the folder's frame from its centre; the cover top is at dy −52.8.
// Draw order bottom → top: Z, U, P. Each underlined paragraph sits below the cover top until its sheet moves.
export const PRINTS0 = { Z: [-18, -50, -6], U: [18, -46, -2], P: [0, -8, -4] };   // P hidden below the cover top until 10
// URLOP (grid side to camera) hangs from Paweł's screen-left pinch at the edge it was turned about in 06 — the right
// edge of the reverse — so the sheet hangs to the LEFT of the hand, beside the folder (06/59, coordinator decision)
export const U_EDGE = [32, -4], U_ANG = -3;
export function folderAt(hip, raise = 0, open = 0) {
  return { x: hip[0] + FOLDER_OFF[0], y: hip[1] + FOLDER_OFF[1] - raise, w: FOLDER_W, ang: FOLDER_ANG, open };
}
export function printAt(F, off) { const q = rot(F.x, F.y, F.ang, off[0], off[1]); return { x: q[0], y: q[1], ang: F.ang - FOLDER_ANG + off[2] }; }
// Paweł's screen-right hand holds the folder at its right edge, a little below the middle
export const folderHold = F => rot(F.x, F.y, F.ang, 46 * F.w / 100, 10 * F.w / 100);
// Marta's right hand on the pram's grip bar (between the tube end and the bar end)
export const gripBar = (px, t = .3) => [px + mix(-150, -176, t) * PRAM_S, PRAM_Y - 194 * PRAM_S];

// Smooth curve through keys [[frame, value], ...] (Catmull-Rom tangents, flat at both ends): no stop at
// intermediate keys, unlike key(). Used for wheels and steps that must keep their speed through a key.
export function curve(f, keys) {
  const n = keys.length;
  if (f <= keys[0][0]) return keys[0][1];
  if (f >= keys[n - 1][0]) return keys[n - 1][1];
  let i = 0; while (keys[i + 1][0] < f) i++;
  const [a, va] = keys[i], [b, vb] = keys[i + 1], h = b - a, t = (f - a) / h;
  const m = j => (j <= 0 || j >= n - 1) ? 0 : (keys[j + 1][1] - keys[j - 1][1]) / (keys[j + 1][0] - keys[j - 1][0]) * h;
  const t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * va + (t3 - 2 * t2 + t) * m(i) + (-2 * t3 + 3 * t2) * vb + (t3 - t2) * m(i + 1);
}
// one foot step in world px: from x0 to x1 between frames a and b, heel lift h (px)
export function step(f, a, b, x0, x1, h = 8) { const t = span(f, a, b), e = ss(t); return [mix(x0, x1, e), -Math.sin(t * Math.PI) * h]; }
export const WHEEL_R = 34 * PRAM_S;
export const rollDeg = d => d / WHEEL_R * 180 / Math.PI;
// thigh-to-gondola contact: outer thigh of Paweł is 46 px left of his hips at the gondola rim height
export const GONDOLA_RIGHT = 112 * PRAM_S, THIGH_OUT = 46;
