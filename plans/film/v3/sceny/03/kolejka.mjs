// Block b01 · shared queue world for scenes 03–06 (ZUS hall, r1 models). Final 03 framing = 04 framing.
// Everything is in the 04 screen space ("queue world"); scenes add their own camera on top.
// Local extensions (reported to the model owner): flat background extras without faces (no r1 model),
// the thumb-in-front clip of Paweł's right hand on the folder edge, the second sheet behind the cover.
import { thin } from "../01/scene.mjs";

export const FLOOR = 700;                 // soles of Marta and Paweł
export const S = 1.3;                     // figure scale in the queue world
export const BG = { s: 1.25, tx: -260, ty: -177.5 }; // queue() set transform (wall/floor junction → y 560)
const D = Math.PI / 180;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const f1 = v => Math.round(v * 10) / 10;
export const ss = (a, b, f) => { const t = clamp((f - a) / (b - a)); return t * t * (3 - 2 * t); };

// Standing hips (sole at FLOOR): Marta 188 local, Paweł 212.
export const MARTA_Q = { x: 232, y: FLOOR - 188 * S, s: S, head: .45, nod: .35, gaze: .45, gazeDown: .7, smile: .1, bow: .12, lean: 4,
  left: [-10, -40, 46, -40], right: [62, -70, 44, -14], leftGrip: "hold", rightGrip: "open" };
export const PAWEL_Q = { x: 880, y: FLOOR - 212 * S, s: S, head: -.3, nod: .45, gaze: -.35, gazeDown: .85, smile: .1, brow: -.2,
  left: [-90, -60, -40, -100], right: [72, -12, 30, -60], leftGrip: "pinch", rightGrip: "grab" };
export const PRAM_Q = { x: 470, y: FLOOR - 34 * 1.25, s: 1.25 };
// Closed folder at Paweł's chest (rekwizyty.folder): centre, drawn width, angle.
export const FOLDER_Q = { x: 896, y: 342, w: 114, angle: -5 };

// Solve a wrist so that the given grip contact lands on target (px). For each candidate wrist bend (−60…60°) the
// wrist is iterated onto the target; the result with the smallest miss, closest to the preferred hand direction
// `angle` (screen deg, optional) and the least bend wins. Deterministic.
export function grip(k, role, pose, side, target, angle) {
  const gk = side === "left" ? "gripL" : "gripR", ek = side === "left" ? "elbowL" : "elbowR", wr = side === "left" ? "wristL" : "wristR";
  const bk = side === "left" ? "wristL" : "wristR";
  let best = null;
  for (let bend = -60; bend <= 60; bend += 10) {
    let w = [(target[0] - pose.x) / pose.s, (target[1] - pose.y) / pose.s], p;
    for (let i = 0; i < 18; i++) {
      p = { ...pose, [bk]: bend, [side]: [pose[side][0], pose[side][1], w[0], w[1]] };
      const g = k.joints(role, p)[gk];
      w = [w[0] + .7 * (target[0] - g[0]) / pose.s, w[1] + .7 * (target[1] - g[1]) / pose.s];
    }
    p = { ...pose, [bk]: bend, [side]: [pose[side][0], pose[side][1], w[0], w[1]] };
    const j = k.joints(role, p), err = Math.hypot(j[gk][0] - target[0], j[gk][1] - target[1]);
    const ha = Math.atan2(j[wr][1] - j[ek][1], j[wr][0] - j[ek][0]) / D + bend;
    const da = angle == null ? 0 : Math.abs((((ha - angle) % 360) + 540) % 360 - 180);
    const score = err * 8 + da * .25 + Math.abs(bend) * .04;
    if (!best || score < best.score) best = { score, p };
  }
  return best.p;
}

// Folder-local → world (closed folder: local panel −50..50 × −60..60, scale w/100).
export function folderLocal(F, lx, ly) {
  const sc = F.w / 100, a = F.angle * D;
  return [F.x + sc * (lx * Math.cos(a) - ly * Math.sin(a)), F.y + sc * (lx * Math.sin(a) + ly * Math.cos(a))];
}
// The folder's photo picture (inside the white border): folder-local transform for 02 coordinates.
// photo at (2,2) scale .82; picture −28..28 × −21..20.4; 02 frame x 0..1280 ↔ −28..28 (y extended, see PRINT_EXT).
export const PHOTO_IN_FOLDER = "translate(2 2) scale(.82) translate(-28 -16.06) scale(.04375)";
export function folderTransform(F) { return `translate(${f1(F.x * 100) / 100} ${f1(F.y * 100) / 100}) rotate(${F.angle}) scale(${F.w / 100})`; }

// Background extras: flat, faceless figures seen from behind, lighter ink (far plane). Request for r1 models filed.
export function extras(f = 0, opts = {}) {
  const ink = "#7C8A96", lw = 2.2, P = (d, fill) => `<path d="${d}" fill="${fill}" stroke="${ink}" stroke-width="${lw}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const sway = Math.sin(f / 30 * Math.PI) * 1.2;
  let s = "";
  // older person with a bag (grey coat, grey hair, back to camera)
  let a = "";
  a += P("M-18 168L-14 250H-2L0 172Z", "#B9BFB0") + P("M18 168L14 250H2L0 172Z", "#B9BFB0");
  a += P("M-12 250h-10q-2 6 4 7h12ZM12 250h10q2 6 -4 7h-12Z", "#56627A");
  a += P("M-30 40C-34 80 -32 130 -26 172H26C32 130 34 80 30 40C24 24 -24 24 -30 40Z", "#D6D2C3");
  a += P("M-30 46C-40 80 -40 120 -36 140M30 46C40 80 42 120 40 138", "none");
  a += P("M-14 26C-14 10 -8 0 0 0C10 0 16 10 14 26C10 34 -10 34 -14 26Z", "#E9E6E0");
  a += P("M-14 18C-12 6 -6 2 0 2C8 2 14 8 14 18C8 12 -8 12 -14 18Z", "#C7CBCF");
  a += P(`M36 ${f1(130 + sway)}h26l4 40h-34Z`, "#CFC8B5") + P(`M42 ${f1(130 + sway)}q7 -16 14 0`, "none");
  s += `<g transform="translate(${opts.oldX ?? 1010} ${opts.oldY ?? 300}) scale(${opts.oldS ?? 1.05})">${a}</g>`;
  // client with a dark bob and a shoulder bag
  let b = "";
  b += P("M-12 166L-10 252H0L2 170Z", "#E8E3D6") + P("M12 166L10 252H0L-2 170Z", "#E8E3D6");
  b += P("M-10 252h-9q-2 6 4 7h9ZM10 252h9q2 6 -4 7h-9Z", "#56627A");
  b += P("M-26 40C-30 80 -28 130 -22 170H22C28 130 30 80 26 40C20 26 -20 26 -26 40Z", "#EDE7DA");
  b += P("M-16 30C-18 10 -10 -2 0 -2C12 -2 18 10 16 30C10 36 -10 36 -16 30Z", "#3A4558");
  b += P("M-24 44L22 120", "none") + P(`M14 ${f1(112 - sway)}h22l2 30h-26Z`, "#B7C9B4");
  s += `<g transform="translate(${opts.cliX ?? 1150} ${opts.cliY ?? 296}) scale(${opts.cliS ?? 1.02})">${b}</g>`;
  return s;
}

// The whole queue world. st: { marta, pawel, pram:{x,y,s,roll,breath}, folder:F, photo(svg|null), papers(fn|null),
// handOnFolder: true → Paweł's right hand (screen-left) holds the spine with the thumb in front, extrasF }
export function queueWorld(k, st) {
  const pr = st.pram ?? PRAM_Q, F = st.folder ?? FOLDER_Q;
  let s = thin(`<g transform="translate(${BG.tx} ${BG.ty}) scale(${BG.s})">${k.queue({ counter: true })}</g>`, 1 / BG.s);
  s += extras(st.extrasF ?? 0);
  // Paweł (behind the pram on the right)
  const pp = st.pawel;
  s += k.person("pawel", { ...pp, parts: "body" });
  if (st.behindFolder) s += st.behindFolder;
  s += k.person("pawel", { ...pp, parts: "left" });                     // right hand behind the cover (fingers)
  if (!st.rightFront) s += k.person("pawel", { ...pp, parts: "right" }); // left hand under the folder (support)
  if (!st.noFolder) {
    s += `<g transform="${folderTransform(F)}">` + "" + `</g>`;
    s += k.folder(F.x, F.y, F.w, F.angle, 0);
    // r1 folder photo: grasp(1)'s baby forearm pokes out below the print (no clip in rekwizyty) → cover the print area
    // with the cover colour, redraw the white border, then the 02 picture (photo02) inside it.
    if (st.photo) s += `<g transform="${folderTransform(F)}"><path d="M-27 -22H32V28H-27Z" fill="#E9D5A6"/><path d="M-25.88 -19.32H29.88V23.32H-25.88Z" fill="#FFFFFF" stroke="#283754" stroke-width="1.35"/><clipPath id="b01-pic"><path d="M-20.96 -15.22H24.96V18.73H-20.96Z"/></clipPath><g clip-path="url(#b01-pic)"><g transform="${PHOTO_IN_FOLDER}">${st.photo}</g></g>` +
      `<path d="M-20.96 -15.22H24.96V18.73H-20.96Z" fill="none" stroke="#283754" stroke-width=".6"/>` + (st.photoOver ?? "") + `</g>`;
  }
  if (st.overFolder) s += st.overFolder;
  // thumb + knuckles in front of the spine: redraw the right hand clipped to a strip around the folder's left edge
  if (!st.noFolder && st.thumbFront !== false) {
    const a = folderLocal(F, -62, -70), b = folderLocal(F, -38, -70), c = folderLocal(F, -38, 70), d = folderLocal(F, -62, 70);
    s += `<clipPath id="b01-thumb"><path d="M${a}L${b}L${c}L${d}Z"/></clipPath><g clip-path="url(#b01-thumb)">${k.person("pawel", { ...pp, parts: "left" })}</g>`;
  }
  if (st.rightFront) s += k.person("pawel", { ...pp, parts: "right" });
  // Marta + pram
  const m = st.marta;
  s += k.person("marta", { ...m, parts: "body" }) + k.person("marta", { ...m, parts: "right" });
  s += k.pram(pr.x, pr.y, pr.s, { roll: pr.roll ?? 0, breath: pr.breath ?? 0 });
  s += k.person("marta", { ...m, parts: "left" });
  if (st.front) s += st.front;
  return s;
}

export const PAPER = { w: 88, h: 115 };                 // folder-local units (×w/100 px)

// Two prints sticking out of the closed folder's top (behind the cover): URLOP in front, ZASIŁEK behind, higher.
// pull = 05's lift of URLOP {dx,dy,angle,bend} in folder-local units.
export function papers(k, F, pull = { dx: 0, dy: 0, angle: 0, bend: 0 }, opts = {}) {
  const sc = F.w / 100, P = (lx, ly) => folderLocal(F, lx, ly);
  const zc = P(8, -60 - 34 + PAPER.h / 2), uc = P(-2 + pull.dx, -60 - 38 + PAPER.h / 2 + pull.dy);
  const z = k.paper(zc[0], zc[1], PAPER.w * sc, PAPER.h * sc, F.angle + 1.5, { header: "ZASIŁEK" });
  const u = k.paper(uc[0], uc[1], PAPER.w * sc, PAPER.h * sc, F.angle - 1 + pull.angle, { header: "URLOP", bend: pull.bend ?? 0, lift: pull.lift ?? 0 });
  return opts.split ? { z, u, uc } : z + u;
}
export function paperPointQ(k, F, pull, name) {
  const sc = F.w / 100, uc = folderLocal(F, -2 + pull.dx, -60 - 38 + PAPER.h / 2 + pull.dy);
  return k.paperPoint(uc[0], uc[1], PAPER.w * sc, PAPER.h * sc, F.angle - 1 + pull.angle, name);
}


// Default rest poses for the 03/59 = 04/0 frame (hands solved onto the handle and the folder).
export function restPoses(k, o = {}) {
  const F = o.folder ?? FOLDER_Q, pr = o.pram ?? PRAM_Q;
  const handle = k.pramPoint(pr.x, pr.y, pr.s, "handle");
  let marta = grip(k, "marta", { ...MARTA_Q, ...(o.marta ?? {}) }, "left", [handle[0] - 10, handle[1] + 2], -10);
  const spine = folderLocal(F, -50, o.spineY ?? 8), bottom = folderLocal(F, o.bottomX ?? 26, 60);
  let pawel = grip(k, "pawel", { ...PAWEL_Q, ...(o.pawel ?? {}) }, "left", spine, o.rightHandAngle ?? -60);
  pawel = grip(k, "pawel", pawel, "right", bottom, o.leftHandAngle ?? 185);
  return { marta, pawel, F, pr };
}
