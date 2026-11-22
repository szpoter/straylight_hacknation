// b13 · counter world for shots 13–14 (global frames 720–839). One deterministic function of the global frame.
// World coordinates = the final frame of 14 (camera 1:1 from 14/48). Shot 13 and 14/0–33 view it through a closer
// camera (zoom 1.4 around world (830,330)); 14/34–48 pulls back to 1:1. The closed folder's path from 14/51 continues
// in 15 (see ../15/kanapa.mjs → folderDrop) so the cut 14/15 is on the same moving prop.
import { clamp, lerp, span, sm, smr, chan, tween, reach, rot, r1, teczka, coverPt, teczkaPt, mouthAt, easeIn } from "../15/teczka.mjs";
import { folderDrop, PAWEL_DROP, SPINE14 } from "../15/kanapa.mjs";

const INK = "#283754";
const HAND_INK = "#2D3950";             // handwriting: navy token (DESIGN.md on-surface navy) — do weryfikacji
// Clerk's voice envelope from media/dialog.flac, frames 720–839 (0–9).
const VOICE = "765686221212866641452103666511344420000000000002174497658886113654565117511576421765554245654200000000000000000000000000";

const S = 1.28;
const PAPER = { x: 1005, y: 388, w: 120, h: 150, a: -10 };   // ZASIŁEK standing on the counter, tilted to Marta
const SPINE = SPINE14, W = 150, FA = -4;                   // Paweł's open folder (hinge), panel width, angle
const PEN_REST = [952, 471];                                  // pen lying on the counter top by the paper's lower-left edge
// 13/0 = 12/59: centre (816,463) on screen, −10°, height 151 px → world (976.5,405.5), scale .786; the clerk turns it
// toward Marta and brings it forward (13/0–16) to the counter spot used in the rest of 13 and in 14.
const paperNow = g => { const t = smr(g, 721, 736); return { x: lerp(976.5, PAPER.x, t), y: lerp(405.5, PAPER.y, t) - Math.sin(t * Math.PI) * 6, a: PAPER.a, sc: lerp(.786, 1, t), turn: lerp(.93, 1, t) }; };
let CUR = paperNow(840);
const pp = (x, y) => { const d = rot(x * CUR.sc * CUR.turn, y * CUR.sc, CUR.a); return [CUR.x + d[0], CUR.y + d[1]]; };  // paper-local → world
const DATE = { x: -50, y: 24, size: 15 }, LINE2 = { x: -46, y: 50, size: 15 };
const DATE_END = 21.4, LINE2_END = 10, HEAD_END = 20.6;   // Chrome getBBox (robocze/b13/mierz.mjs)                          // measured ink extents of the two handwritten strings (local px)

function camera(g) {
  const t = smr(g, 814, 828), t0 = smr(g, 720, 742);         // 13/0–22 push-in from the 12/59 layout; 14/34 → 14/48 pull-back
  const z = lerp(lerp(1.28, 1.4, t0), 1, t), cx = lerp(lerp(839, 805, t0), 640, t), cy = lerp(lerp(325, 338, t0), 360, t);
  return `translate(640 360) scale(${r1(z * 1000) / 1000}) translate(${r1(-cx)} ${r1(-cy)})`;
}

function pen(nib, ang = 128, len = 62) {                       // ang = direction nib → cap (deg)
  const [dx, dy] = rot(1, 0, ang), e = [nib[0] + dx * len, nib[1] + dy * len], m = [nib[0] + dx * 12, nib[1] + dy * 12];
  return `<path d="M${r1(m[0])} ${r1(m[1])}L${r1(e[0])} ${r1(e[1])}" stroke="${INK}" stroke-width="9" stroke-linecap="round"/>`
    + `<path d="M${r1(m[0])} ${r1(m[1])}L${r1(e[0])} ${r1(e[1])}" stroke="#426358" stroke-width="5" stroke-linecap="round"/>`
    + `<path d="M${r1(nib[0])} ${r1(nib[1])}L${r1(m[0] - dy * 3.5)} ${r1(m[1] + dx * 3.5)}L${r1(m[0] + dy * 3.5)} ${r1(m[1] - dx * 3.5)}Z" fill="#E8ECF2" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
}
const PEN_GRIP = 22;                                           // pinch point sits 22 px up the barrel from the nib

// Handwriting on the form: date always, "do jutra" revealed up to `wr` (0..1) of its ink width.
function form(k, cx, cy, a, wr, g, sc = 1, turn = 1) {
  let s = k.paper(cx, cy, PAPER.w, PAPER.h, a, { header: "ZASIŁEK", boxes: false });
  const id = "dj" + g;
  s += `<g transform="translate(${r1(cx)} ${r1(cy)}) rotate(${r1(a)})">`
    + `<text x="${DATE.x}" y="${DATE.y}" font-family="Domine, Georgia, serif" font-style="italic" font-weight="700" font-size="${DATE.size}" fill="${HAND_INK}" letter-spacing="-.4">11.01.2027</text>`
    + `<path d="M${DATE.x} ${DATE.y + 4}h${DATE_END - DATE.x + 2}" stroke="#98A6AC" stroke-width="1.2"/>`;
  if (wr > 0) s += `<clipPath id="${id}"><rect x="${LINE2.x - 2}" y="${LINE2.y - 20}" width="${r1((LINE2_END - LINE2.x + 4) * wr)}" height="28"/></clipPath>`
    + `<text clip-path="url(#${id})" x="${LINE2.x}" y="${LINE2.y}" font-family="Domine, Georgia, serif" font-style="italic" font-size="${LINE2.size}" fill="${HAND_INK}">do jutra</text>`;
  s += `</g>`;
  return sc === 1 && turn === 1 ? s : `<g transform="translate(${r1(cx)} ${r1(cy)}) rotate(${r1(a)}) scale(${r1(sc * turn * 1000) / 1000} ${r1(sc * 1000) / 1000}) rotate(${r1(-a)}) translate(${r1(-cx)} ${r1(-cy)})">${s}</g>`;
}

// ── timelines ──────────────────────────────────────────────────────────────────────────────────────────────
// Writing: nib path along the empty line under the date (paper-local), 14/2–23, lift between words 11–13.
function nibLocal(g) {
  const f = g - 780, y0 = LINE2.y - 2;
  if (f < 2) return [LINE2.x, y0 - 7 + 2 * span(f, 0, 2)];          // hovering ~5 px above (≈ 3 mm)
  if (f <= 23) {
    const w1 = span(f, 2, 11), w2 = span(f, 13, 23), gap = f > 11 && f < 13;
    const x = f < 11 ? lerp(LINE2.x, -18, w1) : f < 13 ? lerp(-18, -12, span(f, 11, 13)) : lerp(-12, LINE2_END, w2);
    const wig = Math.sin(f * 2.1) * 2;
    return [x, y0 + wig - (gap ? 5 : 0)];
  }
  return [LINE2_END + 10 * span(f, 24, 30), y0 - 40 * sm(span(f, 24, 32))]; // lifts away up-right
}
function writeReveal(g) { const f = g - 780; if (f < 2) return 0; if (f < 11) return span(f, 2, 11) * .4; if (f < 13) return .4; return lerp(.4, 1, span(f, 13, 23)); }

function clerkPose(k, g) {
  const f = g - 720;
  const base = { x: 1178, y: 545, s: S, seat: true, legs: false, head: -.42, nod: .25, gaze: -.6, gazeDown: 0, brow: .1, smile: .4,
    left: [-30, -20, -100, -90], right: [30, -20, -70, -75], leftGrip: "point", rightGrip: "pinch", lean: -6, bow: .15 };
  const look = tween([[720, { gaze: -.9, gazeDown: -.1, nod: .2 }], [726, { gaze: -.5, gazeDown: .6, nod: .45 }], [740, { gazeDown: .9, nod: .55 }],
    [752, { gazeDown: 1, nod: .62 }], [770, { gazeDown: 1, nod: .62 }], [800, { gazeDown: 1, nod: .66 }], [806, { gaze: -.9, gazeDown: .1, nod: .3 }],
    [812, { gaze: -.6, gazeDown: .7, nod: .5 }], [840, { gaze: -.6, gazeDown: .7, nod: .5 }]], g);
  let p = { ...base, ...look, mouth: mouthAt(VOICE, 720, g) * .9 };
  // screen-right hand (anatomical left): thumb on the paper's right edge at 45 % height, releases at 14/32
  const hold = pp(PAPER.w / 2 + 2, -PAPER.h / 2 + PAPER.h * .45);
  const rel = smr(g, 812, 820);
  const take = smr(g, 720, 726);
  p = reach(k, "clerk", p, "right", [lerp(lerp(1150, hold[0], take), hold[0] + 40, rel), lerp(lerp(500, hold[1], take), hold[1] + 50, rel)]);
  if (g < 725) p.rightGrip = "open";
  if (g >= 812) p.rightGrip = "open";
  // screen-left hand (anatomical right): point → pen
  let tip, grip = "point", penAt = null;
  const headerEnd = pp(HEAD_END + 9, -52), dateEnd = pp(DATE_END + 9, DATE.y - 5);
  if (g < 734) { const t = smr(g, 725, 733); tip = [lerp(hold[0] - 6, headerEnd[0], t), lerp(hold[1] + 4, headerEnd[1], t) - Math.sin(t * Math.PI) * 14]; grip = g < 725 ? "pinch" : "point"; }
  else if (g < 752) { const t = sm(span(g, 734, 751)); tip = [lerp(headerEnd[0], dateEnd[0], t) + Math.sin(t * Math.PI) * 10, lerp(headerEnd[1], dateEnd[1], t)]; }
  else if (g < 768) tip = dateEnd;
  else if (g < 774) { const t = sm(span(g, 768, 774)); tip = [lerp(dateEnd[0], PEN_REST[0] + 30, t), lerp(dateEnd[1], PEN_REST[1] - 40, t) - Math.sin(t * Math.PI) * 18]; grip = "open"; }
  else {
    grip = "pinch";
    const pick = sm(span(g, 774, 778)), nibW = g < 780 || g > 803 ? null : null;
    const n = nibLocal(Math.max(g, 780)), nibPaper = pp(n[0], n[1]);
    const lift = sm(span(g, 776, 780));
    const restNib = PEN_REST, nib = g < 776 ? restNib : [lerp(restNib[0], nibPaper[0], lift), lerp(restNib[1], nibPaper[1], lift)];
    const pang = lerp(176, 128, sm(span(g, 775, 780)));
    const [dx, dy] = rot(1, 0, pang);
    tip = [nib[0] + dx * PEN_GRIP, nib[1] + dy * PEN_GRIP];
    penAt = { nib, ang: pang };
    if (g < 776) tip = [lerp(PEN_REST[0] + 30, tip[0], pick), lerp(PEN_REST[1] - 40, tip[1], pick)];
  }
  p.leftGrip = grip;
  p = reach(k, "clerk", p, "left", tip);
  return { p, penAt };
}

function martaPose(g) {
  const look = tween([
    [720, { head: .45, nod: .35, gaze: .7, gazeDown: .2, brow: -.2 }],
    [735, { gaze: .7, gazeDown: .2 }], [740, { gaze: .8, gazeDown: .75 }], [745, { nod: .6, gazeDown: .8 }], [752, { nod: .62, gazeDown: .85 }],
    [804, { nod: .62, head: .42, gazeDown: .85 }], [806, { nod: .82 }], [808, { nod: .82 }], [813, { nod: .45, gazeDown: .5 }],
    [820, { head: .3, gaze: .3, gazeDown: .6, nod: .4 }], [832, { head: 0, gaze: -.1, gazeDown: .5, nod: .35 }]], g);
  return { x: 430, y: 475, s: S, lean: 5, bow: .1, smile: .1, brow: -.25, ...look,
    left: [-56, -70, -44, -4], right: [56, -70, 30, -14], leftGrip: "open", rightGrip: "open", blink: blink(g, [742, 790, 830]) };
}
const blink = (g, at) => { for (const b of at) { const d = g - b; if (d >= 0 && d < 5) return [.5, 1, 1, .6, .2][d]; } return 0; };

// Paweł: standing, open folder at the chest; 14/24–33 takes the free left edge, inserts, closes, lowers.
function pawelState(k, g) {
  const p0 = { x: 790, y: 455, s: S, head: .35, nod: .35, gaze: .5, gazeDown: .55, brow: -.4, smile: -.1, bow: .1,
    left: [-100, -80, -60, -60], right: [60, -30, 40, -80], leftGrip: "hold", rightGrip: "hold" };
  const look = tween([[720, {}], [760, { gaze: .6, gazeDown: .5 }], [804, { head: .35, gazeDown: .5 }], [809, { head: .3, gaze: .7, gazeDown: .8 }],
    [822, { head: 0, gaze: 0, gazeDown: .9, nod: .5 }], [834, { head: -.3, gaze: -.4, gazeDown: .9, nod: .5, bow: .2 }]], g);
  let p = { ...p0, ...look, blink: blink(g, [770]) };
  // folder: spine glides a little right while he offers it (804–812), cover angle closes 40–51
  const fs = lerp(.9, 1, smr(g, 720, 730)), fm = smr(g, 720, 730);
  const offer = smr(g, 804, 812) - smr(g, 820, 830) * .5;
  const sx = lerp(810 - 67.5, SPINE[0], fm) + offer * 16, sy = lerp(419 + 4.7, SPINE[1], fm);
  const theta = chan([[730, 0], [746, 108], [820, 108], [831, 0]], g);
  // 13/0–10: the closed folder from 12/59 (screen ≈ (603,480), 174 px) slides to the hinge used below
  // paper: on counter → in Paweł's right hand (809) → onto back panel (813–825)
  let paper = { x: PAPER.x, y: PAPER.y, a: PAPER.a, inFolder: false };
  const tIn = sm(span(g, 813, 825));
  if (g >= 813) {
    const dst = teczkaPt(sx, sy, W, FA, .52, 6);
    paper = { x: lerp(PAPER.x, dst[0], tIn), y: lerp(PAPER.y, dst[1], tIn) - Math.sin(tIn * Math.PI) * 30, a: lerp(PAPER.a, FA, tIn), inFolder: tIn > .99 };
  }
  // right hand: folder edge → paper left edge (804–809) → with paper → back to the panel edge (824–830)
  const panelEdge = teczkaPt(sx, sy, W * fs, FA, 1, 46);
  const paperEdge = (() => { const d = rot(-PAPER.w / 2 + 2, 4, paper.a); return [paper.x + d[0], paper.y + d[1]]; })();
  let rT;
  if (g < 804) rT = panelEdge;
  else if (g < 809) { const t = sm(span(g, 804, 809)); rT = [lerp(panelEdge[0], paperEdge[0], t), lerp(panelEdge[1], paperEdge[1], t) - Math.sin(t * Math.PI) * 25]; }
  else if (g < 824) rT = paperEdge;
  else { const t = sm(span(g, 824, 830)); rT = [lerp(paperEdge[0], panelEdge[0], t), lerp(paperEdge[1], panelEdge[1], t)]; }
  p.rightGrip = g >= 806 && g < 824 ? "pinch" : "hold";
  if (g >= 831) p.rightGrip = "open";
  // left hand on the cover's free edge (top third) until closed; then the closed folder's right edge
  const early = g < 752 ? (() => { const a = coverPt(sx, sy, W * fs, FA, theta, g < 730 ? .1 : 1, g < 730 ? -84 : 30), b = coverPt(sx, sy, W, FA, theta, .12, 78), t = smr(g, 746, 752); return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; })() : null;
  let lT = early ? early : g < 816 ? coverPt(sx, sy, W, FA, theta, .12, 78) : g < 820 ? (() => { const a = coverPt(sx, sy, W, FA, theta, .12, 78), b = coverPt(sx, sy, W, FA, theta, 1, 30), t = smr(g, 816, 820); return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; })() : coverPt(sx, sy, W, FA, theta, 1, 30);
  let folder = { sx, sy, theta, ang: FA, w: W * fs };
  if (g >= 831) {                                         // closed: continue on the shared drop path
    const d = folderDrop(g);
    folder = { sx: d.sx, sy: d.sy, theta: 0, ang: d.ang, w: W };
    lT = d.grip;
  }
  p = reach(k, "pawel", p, "right", g >= 831 ? [lerp(panelEdge[0], 880, smr(g, 831, 838)), lerp(panelEdge[1], 430, smr(g, 831, 838))] : rT);
  if (g < 828) p.left = [-60, -30, -60, -60];                 // elbow hint: low while holding the open cover, outward for the carry
  p = reach(k, "pawel", p, "left", lT);
  if (g >= 831) { const t = smr(g, 831, 839); p.bow = lerp(p.bow, PAWEL_DROP.bow, t); }
  return { p, paper, folder };
}

export function okienko(g, k) {
  CUR = paperNow(g);
  const { p: clerk, penAt } = clerkPose(k, g), marta = martaPose(g), { p: pawel, paper, folder } = pawelState(k, g);
  let w = k.queue({ counter: false });
  w += `<path d="M960 110H1280V470H960Z" fill="#E6EFEA" stroke="#A9BBAF" stroke-width="2.4"/><path d="M1120 110V470" stroke="#C9D6CD" stroke-width="2"/>`;
  w += `<path d="M1116 131H1250V187H1116Z" fill="${INK}" stroke="${INK}" stroke-width="2.2"/><text x="1183" y="173" text-anchor="middle" font-family="Inter, Arial" font-weight="700" font-size="36" fill="#A6D0B8" letter-spacing="1.4">A17</text>`;   // queue display = 07–12 (A17)
  w += k.person("clerk", { ...clerk, parts: "body" });
  w += k.queueCounter();
  w += k.person("clerk", { ...clerk, parts: "right" });            // holding hand behind the sheet (fingers at the back)
  const wr = writeReveal(g);
  if (!paper.inFolder && g < 813) w += g < 736 ? form(k, CUR.x, CUR.y, CUR.a, wr, g, CUR.sc, CUR.turn) : form(k, paper.x, paper.y, paper.a, wr, g);
  if (!penAt) w += pen(PEN_REST, 176);
  w += k.person("marta", marta);
  w += k.person("pawel", { ...pawel, parts: "body" });
  // folder with its papers (URLOP under; ZASIŁEK lands on top)
  let inner = "";
  const inP = teczkaPt(folder.sx, folder.sy, W, folder.ang, .5, 4);
  inner += k.paper(inP[0] - 4, inP[1] + 6, 112, 140, folder.ang + 3, { header: "URLOP", boxes: false });
  if (g >= 813) inner += form(k, paper.x, paper.y, paper.a, 1, g);
  w += teczka(k, folder.sx, folder.sy, folder.w, folder.ang, folder.theta, g >= 831 ? "" : inner);   // closed: papers hidden inside
  w += k.person("clerk", { ...clerk, parts: "left" });
  if (penAt) w += pen(penAt.nib, penAt.ang);
  w += k.person("pawel", { ...pawel, parts: "arms" });
  return `<g transform="${camera(g)}">${w}</g>`;
}
