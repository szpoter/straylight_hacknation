// b13 · living room for shots 15–18 (global frames 840–1079). ONE deterministic function of the global frame,
// so the internal cuts 15/16, 16/17, 17/18 are continuous by construction. Camera fixed (1:1), r1 SOFA layout.
// Frame 1079 (18/59) draws exactly sofaScene("przekazanie") from obsada/plansza.mjs (model handoff to 19).
import { clamp, lerp, span, sm, smr, chan, tween, reach, rot, r1, teczka, teczkaPt, coverPt, toLocal, mouthAt, easeIn, easeOut } from "./teczka.mjs";

const INK = "#283754", SOFA_LIGHT = "#C9DAC4", SOFA_DARK = "#8EA889";   // sofa tints from rekwizyty r1 (do weryfikacji)
// Dialog envelope (media/dialog.flac) 840–1079: Marta 884–923, Paweł 961–985 and 995–1043.
const VOICE = "000000000000000000000000000000000000000000007614772178899976642327889997131326866544100000000000000000000000000000000000"
  + "024985798666313763564322221000000003379578647723732587456656533566213443541456331111000000000000000000000000000000000000";
const voice = g => mouthAt(VOICE, 840, g);

const W = 150;                                   // one folder panel (open folder = 300 px, as in the r1 handoff)
const CORNER = [594, 548];                       // lower-left corner meets the seat edge between the knees (15/6 = 846)
const REST_ANG = -3;
// closed folder: centre ↔ spine, lower-left corner offset
const cornerOff = a => rot(-W / 2, W * .6, a);
const centerFromCorner = a => { const o = cornerOff(a); return [CORNER[0] - o[0], CORNER[1] - o[1]]; };
const spineOf = (c, a) => { const d = rot(-W / 2, 0, a); return [c[0] + d[0], c[1] + d[1]]; };
const gripOff = a => rot(W / 2 - 6, -46, a);     // Paweł's hand on the right edge, upper part of the closed folder

// Shared with 14: the closed folder from 14/51 (831) through the cut to rest on the seat (15/27 = 867).
export const PAWEL_DROP = { bow: .25 };
export const SPINE14 = [640, 362];               // Paweł's open folder hinge at the counter (13–14)
export function folderDrop(g) {
  const A = [SPINE14[0] + 8 + 74.8, SPINE14[1] + 5.2], angA = -4;            // closed centre at 14/51 (spine (648,320), −4°)
  const B = centerFromCorner(-8);
  let c, ang;
  if (g <= 846) {
    const t = span(g, 831, 846), e = t * t * (1.5 - .5 * t); // starts from rest, arrives at ≈ 1.5× mean speed
    c = [lerp(A[0], B[0], e) - Math.sin(t * Math.PI) * 18, lerp(A[1], B[1], e)];
    ang = lerp(angA, -8, sm(t));
  } else {
    const t = span(g, 846, 867), e = easeOut(t), bounce = Math.sin(span(g, 846, 856) * Math.PI) * 1.2;
    ang = lerp(-8, REST_ANG, e) + bounce;
    c = centerFromCorner(ang);
  }
  const sp = spineOf(c, ang), go = gripOff(ang);
  return { c, ang, sx: sp[0], sy: sp[1], grip: [c[0] + go[0], c[1] + go[1]] };
}
const REST = (() => { const c = centerFromCorner(REST_ANG), s = spineOf(c, REST_ANG); return { sx: s[0], sy: s[1] }; })();
const FINAL = { sx: 688, sy: 493, ang: -3 };    // 18/59 folder (model handoff)

// ── model handoff values (obsada sofaPose "przekazanie") ───────────────────────────────────────────────────
const URLOP_END = { x: 388, y: 478, w: 88, h: 112, a: -8 }, ZAS_END = { x: 468, y: 482, w: 88, h: 112, a: 6 };
const STACK_Z = { x: 814, y: 455, w: 100, h: 126, a: -3 }, STACK_B = { x: 826, y: 462, w: 100, h: 126, a: 8 };
const SHOE1 = [690, 676], SHOE2 = [912, 678];
const M_GRIP_L = [10.8, 7.7], M_GRIP_R = [-7.6, 3.2];       // Marta's pinch points relative to her two prints at 18/59

const blink = (g, at) => { for (const b of at) { const d = g - b; if (d >= 0 && d < 5) return [.5, 1, 1, .6, .2][d]; } return 0; };

// ── folder state ───────────────────────────────────────────────────────────────────────────────────────────
function folderState(g) {
  if (g < 867) { const d = folderDrop(g); return { sx: d.sx, sy: d.sy, ang: d.ang, theta: 0 }; }
  const theta = chan([[909, 0], [918, 92], [926, 180]], g);
  const pull = sm(span(g, 1043, 1054));
  return { sx: lerp(REST.sx, FINAL.sx, pull), sy: lerp(REST.sy, FINAL.sy, pull) - Math.sin(pull * Math.PI) * 6, ang: REST_ANG, theta, pull };
}

// ── Marta ──────────────────────────────────────────────────────────────────────────────────────────────────
const M_FEET = [[398.8, 682], [455.2, 682]], M_KNEES = [[404, 536.1], [452.6, 536.1]];
function marta(k, g, F, papers) {
  const P = k.sofaPose("marta", "przekazanie");
  const body = tween([
    [840, { y: 420, bow: .38, lean: 2, head: .35, nod: .5, gaze: .5, gazeDown: .75, brow: -.3, smile: .1, left: [-60, -40, -54, -2], right: [60, -40, 52, -2] }],
    [846, { y: 452 }],
    [850, { y: 489, bow: .22 }],                                  // pelvis meets the cushion (15/10)
    [857, { y: 494, bow: .16, lean: 1 }],                         // deepest, cushion 18 px (15/17)
    [866, { y: 490, bow: .12, lean: 2 }],
    [876, { head: .3, gaze: .45, gazeDown: .8, nod: .55, left: [-62, -44, -30, 20], right: [62, -44, 32, 20] }],
    [899, { head: .28, gaze: .3, gazeDown: .85, nod: .6, bow: .2, lean: 4 }],
    [930, { head: .15, gaze: -.2, gazeDown: .85, nod: .55 }],
    [948, { head: .05, gaze: -.35, gazeDown: .8, nod: .6, bow: .3, lean: 3 }],
    [952, { head: .05, gaze: .5, gazeDown: .8 }],                 // eyes first (16/52–53) …
    [956, { head: P.head, gaze: P.gaze, gazeDown: P.gazeDown, nod: P.nod, brow: P.brow, smile: P.smile }], // … then the head
    [966, {}], [972, { head: .5, gaze: .8, gazeDown: -.05, nod: .25 }], [990, { head: .5, gaze: .8, gazeDown: -.05, nod: .25 }],
    [1000, { head: P.head, gaze: P.gaze, gazeDown: P.gazeDown, nod: P.nod }],
    [1052, { gaze: .4, gazeDown: .55 }], [1058, { gaze: P.gaze, gazeDown: P.gazeDown }],
    [1079, { head: P.head, gaze: P.gaze, gazeDown: P.gazeDown, nod: P.nod, bow: P.bow, lean: P.lean, brow: P.brow, smile: P.smile }],
  ], g);
  let p = { ...P, ...body, x: 427, s: 1.28, seat: true };
  if (g >= 1079) return { ...P };
  // legs: feet and knees stay on screen; the skirt hem lags the pelvis by ~3 frames
  const lag = Math.sin(span(g, 851, 862) * Math.PI) * 3;
  p.feet = toLocal(p, M_FEET);
  p.knees = toLocal(p, M_KNEES.map(([x, y]) => [x, y + lag]));
  p.mouth = g >= 880 && g < 926 ? voice(g) * .85 : 0;
  p.blink = blink(g, [872, 938, 1005, 1060]);
  // hands
  const fp = F;
  let R = null, L = null;
  if (g >= 876 && g < 905) { const sp = teczkaPt(fp.sx, fp.sy, W, fp.ang, 0, -78); const t = smr(g, 876, 899); R = [lerp(475, sp[0] - 8, t), lerp(470, sp[1], t)]; }
  if (g >= 905 && g < 929) { R = coverPt(fp.sx, fp.sy, W, fp.ang, fp.theta, .36, -88 - Math.sin(fp.theta * Math.PI / 180) * 14); p.rightGrip = g >= 906 ? "pinch" : "open"; if (g < 906) { const sp = teczkaPt(fp.sx, fp.sy, W, fp.ang, 0, -78); R = [lerp(sp[0] - 8, R[0], smr(g, 899, 905)), lerp(sp[1], R[1], smr(g, 899, 905))]; } }
  if (g >= 929 && g < 1079) { R = [papers.Z.x + M_GRIP_R[0], papers.Z.y + M_GRIP_R[1]]; p.rightGrip = g >= 931 ? "pinch" : "open";
    if (g < 934) { const c = coverPt(fp.sx, fp.sy, W, fp.ang, 180, .36, -88); R = [lerp(c[0], R[0], smr(g, 927, 934)), lerp(c[1], R[1], smr(g, 927, 934))]; }
    // 18: fingers leave ZASIŁEK so Paweł can pull the folder, then return
    const away = smr(g, 1039, 1045) - smr(g, 1064, 1074);
    if (away > 0) { R = [R[0] + 16 * away, R[1] - 30 * away]; if (away > .3) p.rightGrip = "open"; }
  }
  if (g >= 937 && g < 1079) { const t = smr(g, 937, 942); L = [lerp(390, papers.U.x + M_GRIP_L[0], t), lerp(522, papers.U.y + M_GRIP_L[1], t)]; p.leftGrip = g >= 941 ? "pinch" : "open"; }
  else if (g < 1079) p.leftGrip = "open";
  if (g < 905 && g >= 876) p.rightGrip = "open";
  if (g < 876) { p.rightGrip = "open";
    const sup = smr(g, 840, 848) - smr(g, 862, 874);
    if (sup > 0) { const L0 = [lerp(392, 352, sup), lerp(522, 494, sup)]; L = L0; }
  }
  if (g < 1079) { if (R) p = reach(k, "marta", p, "right", R); if (L) p = reach(k, "marta", p, "left", L); }
  return p;
}

// Marta's two prints: in the folder (back panel) until 930, then in her hands, final layout from 953.
function printsState(g, F) {
  const inU = teczkaPt(F.sx, F.sy, W, F.ang, .48, 8), inZ = teczkaPt(F.sx, F.sy, W, F.ang, .54, 2);
  const at = (a, b, t) => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t), a: lerp(a.a, b.a, t) });
  const U0 = { x: inU[0], y: inU[1], a: F.ang + 2 }, Z0 = { x: inZ[0], y: inZ[1], a: F.ang - 1 };
  const Umid = { x: 432, y: 462, a: -3 }, Zmid = { x: 446, y: 466, a: 1 };
  let U, Z, inFolder = g < 934;
  if (g < 934) { U = U0; Z = Z0; }
  else if (g < 944) { const t = sm(span(g, 934, 944)); U = at(U0, Umid, t); Z = at(Z0, Zmid, t); U.y -= Math.sin(t * Math.PI) * 26; Z.y -= Math.sin(t * Math.PI) * 24; }
  else { const t = sm(span(g, 944, 953)); U = at(Umid, URLOP_END, t); Z = at(Zmid, ZAS_END, t); }
  return { U: { ...U, w: 88, h: 112 }, Z: { ...Z, w: 88, h: 112 }, inFolder };
}

// The stack that stays in the folder (corrected ZASIŁEK on top, a blank sheet under it). Folder-local offsets.
function stackState(g, F) {
  const s = sm(span(g, 1050, 1064));
  const rel = (ox, oy, ang, rx, ry, ra) => { const u = lerp(ox, rx, s), v = lerp(oy, ry, s), d = rot(u, v, F.ang); return { x: F.sx + d[0], y: F.sy + d[1], a: F.ang + lerp(ang, ra, s) }; };
  const Zr = rot(STACK_Z.x - FINAL.sx, STACK_Z.y - FINAL.sy, -FINAL.ang), Br = rot(STACK_B.x - FINAL.sx, STACK_B.y - FINAL.sy, -FINAL.ang);
  const Z = rel(76, 0, 0, Zr[0], Zr[1], STACK_Z.a - FINAL.ang), B = rel(80, 5, 2, Br[0], Br[1], STACK_B.a - FINAL.ang);
  return { Z: { ...Z, w: 100, h: 126, curl: .4 * sm(span(g, 1058, 1072)) }, B: { ...B, w: 100, h: 126 } };
}

// ── Paweł ──────────────────────────────────────────────────────────────────────────────────────────────────
const P_FEET0 = [[723.2, 682], [894.7, 692.2]], P_KNEES0 = [[733.4, 536.1], [876.8, 531]];
function pawel(k, g, F, stack) {
  const P = k.sofaPose("pawel", "przekazanie");
  const body = tween([
    [840, { y: 424, bow: .25, lean: -2, twist: -.3, head: -.35, nod: .45, gaze: -.6, gazeDown: .6, brow: -.4, smile: -.1, right: [62, -50, 52, -14], left: [-100, -80, -60, -60] }],
    [852, { y: 446, bow: .3 }],
    [860, { y: 489, bow: .28 }],                                 // pelvis on the cushion (15/20)
    [865, { y: 494, bow: .22, lean: -3 }],                       // deepest, cushion 22 px (15/25)
    [874, { y: 490, bow: .15, lean: -1, twist: -.25 }],
    [882, { head: -.45, gaze: -.6, gazeDown: .25, nod: .25, left: [-70, -40, -50, 22], right: [70, -40, 56, 20] }],
    [899, { head: -.45, gaze: -.7, gazeDown: .5, nod: .35, twist: -.3 }],
    [940, { head: -.45, gaze: -.7, gazeDown: .5, nod: .35 }],
    [946, { gaze: -.8, gazeDown: .75 }], [952, { head: -.5, nod: .5, brow: -.6 }],
    // 17: first shoe (screen-left foot), eyes on the feet
    [960, {}], [964, { head: -.3, gaze: -.2, gazeDown: 1, nod: .7, bow: .3 }],
    [974, { bow: .35, lean: 2 }],
    [986, { bow: .72, lean: 18, twist: .3, head: .1, gaze: .2, gazeDown: 1, nod: .8, left: [-70, -30, -46, 28] }], // ribs toward the right foot
    [996, { bow: .66, lean: 15, twist: .25 }],
    [1004, { bow: .5, lean: 8, twist: 0 }],
    [1006, { gaze: -.7, gazeDown: .7 }],                                       // eyes back to ZASIŁEK (17/46)
    [1013, { head: -.3, nod: .55, gaze: -.45, gazeDown: .75, bow: .45, lean: 6, twist: -.3, brow: -.8, smile: -.4 }], // head follows
    [1020, {}],
    // 18: shoe down to the floor, still looking at the print
    [1030, { bow: .9, lean: 26, twist: .05, head: -.5, gaze: -.9, gazeDown: .6, nod: .45 }],
    [1038, { bow: 1, lean: 34, twist: .1, x: 806, head: -.55, gaze: -.9, gazeDown: .55, nod: .4 }],
    [1046, { bow: .85, lean: 16, twist: -.1, x: 800 }],
    [1060, { bow: P.bow, lean: P.lean, twist: P.twist, head: P.head, nod: P.nod, gaze: P.gaze, gazeDown: P.gazeDown, brow: P.brow, smile: P.smile }],
    [1079, {}],
  ], g);
  let p = { ...P, ...body, s: 1.28, seat: true };
  p.x = body.x ?? 800;
  p.wristR = chan([[1060, 0], [1074, P.wristR]], g);
  if (g >= 1079) p = { ...P };
  // legs: feet on the floor; first shoe comes off 962–972, the second foot lifts 976–1004
  let feet = P_FEET0.map(q => q.slice()), knees = P_KNEES0.map(q => q.slice());
  const up = smr(g, 976, 987) - smr(g, 997, 1006);
  feet[1] = [lerp(894.7, 912, up), lerp(692.2, 604, up)];
  knees[1] = [lerp(876.8, 902, up), lerp(531, 478, up)];
  const toModel = smr(g, 1050, 1079);
  feet = feet.map((q, i) => [lerp(q[0], [723.2, 897.3][i], toModel), lerp(q[1], [682, 694.8][i], toModel)]);
  if (g < 1079) { p.feet = toLocal(p, feet); p.knees = toLocal(p, knees.map((q, i) => [lerp(q[0], [733.4, 876.8][i], toModel), lerp(q[1], [536.1, 531][i], toModel)])); }
  const heel0 = smr(g, 962, 969), heel1 = smr(g, 989, 995);
  p.shoes = [g < 970 ? "shoe" : "sock", g < 995 ? "shoe" : "sock"];
  p.heelOut = [g < 970 ? heel0 : 0, g < 995 ? heel1 : 0];
  p.mouth = g >= 955 && g < 1046 ? voice(g) * .9 : 0;
  p.blink = blink(g, [886, 955, 1023, 1062]);
  // hands ------------------------------------------------------------------------------------------------
  let L = null, Rt = null, held = null;
  if (g < 871) { L = folderDrop(Math.min(g, 867)).grip; p.leftGrip = "hold"; }
  else if (g < 878) { const a = folderDrop(867).grip; const t = smr(g, 871, 878); L = [lerp(a[0], 744, t), lerp(a[1], 528, t)]; p.leftGrip = "open"; }
  // second shoe: hand to the heel (983–987), grip 987, pull (988–996), carry to (942,537) and hang (996–1019)
  const footR = [feet[1][0], feet[1][1]];
  if (g >= 978 && g < 1039) {
    const heel = [footR[0] + 14, footR[1] - 4];
    if (g < 987) { const t = smr(g, 978, 987); Rt = [lerp(890, heel[0], t), lerp(560, heel[1], t)]; p.rightGrip = "open"; }
    else if (g < 996) { Rt = [heel[0] + 6 * smr(g, 989, 995), heel[1] - 10 * smr(g, 989, 995)]; p.rightGrip = "hold"; }
    else if (g < 1020) { const t = smr(g, 996, 1012); Rt = [lerp(heel[0] + 6, 942, t), lerp(heel[1] - 10, 537, t)]; p.rightGrip = "hold"; }
    else { const t = smr(g, 1022, 1038); Rt = [lerp(942, SHOE2[0], t), lerp(537, SHOE2[1], t)]; p.rightGrip = "hold"; }
  }
  if (g >= 840 && g < 882) { const sup = smr(g, 842, 850) - smr(g, 868, 880); if (sup > 0) Rt = [lerp(872, 912, sup), lerp(526, 492, sup)]; }
  if (g >= 1039 && g < 1079) { // release, then the elbow travels to the stack
    const t = smr(g, 1039, 1048), t2 = smr(g, 1056, 1072);
    p.rightGrip = "open";
    const j = k.joints("pawel", { ...P });
    Rt = [lerp(lerp(SHOE2[0] + 6, 905, t), j.gripR[0], t2), lerp(lerp(SHOE2[1] - 10, 600, t), j.gripR[1], t2)];
    p.right = [lerp(70, P.right[0], t2), lerp(30, P.right[1], t2), p.right[2], p.right[3]];
  }
  // left hand: thigh support during the shoe; folder edge (1040–1054); ZASIŁEK short edge (1056–1066)
  if (g >= 1036 && g < 1079) {
    const edge = teczkaPt(F.sx, F.sy, W, F.ang, 1, 4), zs = [stack.Z.x, stack.Z.y], zEdge = (() => { const d = rot(-stack.Z.w / 2 - 4, 10, stack.Z.a); return [zs[0] + d[0], zs[1] + d[1]]; })();
    const j = k.joints("pawel", { ...P });
    if (g < 1043) { const t = smr(g, 1036, 1043); L = [lerp(744, edge[0], t), lerp(528, edge[1], t)]; p.leftGrip = "open"; }
    else if (g < 1055) { L = edge; p.leftGrip = "grab"; }
    else { const t = smr(g, 1055, 1066); L = [lerp(edge[0], j.gripL[0], t), lerp(edge[1], j.gripL[1], t) - Math.sin(t * Math.PI) * 14]; p.leftGrip = t > .7 ? "pinch" : "open"; }
  }
  if (g < 1079) { if (Rt) p = reach(k, "pawel", p, "right", Rt); if (L) p = reach(k, "pawel", p, "left", L); }
  if (g >= 1079) p = { ...P };
  // shoe held in the right hand (drawn under the fingers)
  if (g >= 995 && g < 1039) {
    const j = k.joints("pawel", p), a = g < 1020 ? chan([[995, -25], [1006, -80], [1011, -98], [1016, -86], [1019, -90]], g) : chan([[1020, -90], [1028, -70], [1037, -4], [1038, 0]], g);
    held = { x: j.gripR[0], y: j.gripR[1], a };
    if (g === 1038) held = { x: SHOE2[0], y: SHOE2[1], a: 0 };
  }
  return { p, held, heel0 };
}

// ── seat dents (local extension: the r1 seat seam with dips under each pelvis) ─────────────────────────────────
function seam(dM, dP) {
  if (dM < .3 && dP < .3) return "";
  const pts = [];
  for (let x = 330; x <= 962; x += 12) {
    const t = x <= 640 ? (x - 330) / 310 : (x - 640) / 322;
    const y = x <= 640 ? (1 - t) * (1 - t) * 506 + 2 * (1 - t) * t * 516 + t * t * 512 : (1 - t) * (1 - t) * 512 + 2 * (1 - t) * t * 516 + t * t * 506;
    const b = (c, w) => Math.exp(-(((x - c) / w) ** 2));
    pts.push([x, y + dM * b(427, 70) + dP * b(800, 80)]);
  }
  const d = "M" + pts.map(q => `${r1(q[0])} ${r1(q[1])}`).join("L");
  let s = `<path d="M330 506Q480 516 640 512Q800 516 962 506" fill="none" stroke="${SOFA_LIGHT}" stroke-width="4"/>`;
  s += `<path d="${d}" fill="none" stroke="${SOFA_DARK}" stroke-width="1.8" stroke-linejoin="round"/>`;
  for (const [c, dd] of [[427, dM], [800, dP]]) if (dd > 2) {
    const o = clamp(dd / 18, 0, 1);
    s += `<path d="M${c - 86} ${r1(498 + dd * .3)}q22 ${r1(dd * .5)} 40 ${r1(dd * .9)}M${c + 86} ${r1(498 + dd * .3)}q-22 ${r1(dd * .5)} -40 ${r1(dd * .9)}" fill="none" stroke="${SOFA_DARK}" stroke-width="1.6" opacity="${r1(o * 10) / 10}"/>`;
  }
  return s;
}

export function kanapa(g, k) {
  const F = folderState(g), prints = printsState(g, F), stack = stackState(g, F);
  const m = marta(k, g, F, prints), { p, held } = pawel(k, g, F, stack);
  const breath = .5 + .5 * Math.sin((g - 1079) / 80 * 2 * Math.PI);
  const dM = chan([[849, 0], [857, 18], [868, 10], [884, 7], [930, 0]], g), dP = chan([[859, 0], [865, 22], [878, 11], [899, 7], [945, 0]], g);
  let s = k.salon({ pram: true, breath: g >= 1079 ? .5 : breath });
  s += seam(dM, dP);
  s += k.person("marta", { ...m, parts: "body" }) + k.person("pawel", { ...p, parts: "body" });
  // folder + what lies on its back panel
  let inner = "";
  inner += k.paper(stack.B.x, stack.B.y, 100, 126, stack.B.a, { header: "" }) + k.paper(stack.Z.x, stack.Z.y, 100, 126, stack.Z.a, { header: "ZASIŁEK", curl: stack.Z.curl });
  if (prints.inFolder) inner += k.paper(prints.Z.x, prints.Z.y, 88, 112, prints.Z.a, { header: "ZASIŁEK" }) + k.paper(prints.U.x, prints.U.y, 88, 112, prints.U.a, { header: "URLOP" });
  if (g >= 1079) s += k.folder(688, 493, 300, -3, 1) + inner;
  else s += teczka(k, F.sx, F.sy, W, F.ang, F.theta, inner);   // papers sit between the back panel and the cover
  if (!prints.inFolder) s += k.paper(prints.U.x, prints.U.y, 88, 112, prints.U.a, { header: "URLOP" }) + k.paper(prints.Z.x, prints.Z.y, 88, 112, prints.Z.a, { header: "ZASIŁEK" });
  // shoes on the floor
  if (g >= 970) s += k.shoe(SHOE1[0], SHOE1[1], 0, 1.28);
  if (g >= 1038) s += k.shoe(SHOE2[0], SHOE2[1], 0, 1.28, { flip: true });
  s += k.person("marta", { ...m, parts: "arms" }) + k.person("pawel", { ...p, parts: "left" });
  s += k.sofaFront();
  if (held) s += k.shoe(held.x, held.y, held.a, 1.28, { flip: true });
  s += k.person("pawel", { ...p, parts: "right" });
  return s;
}
