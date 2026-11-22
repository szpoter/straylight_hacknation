// 11 · Ich numerek (20–22 s, film frames 600–659). Blok b07, modele r1. Plan ogólny, cam z = 1.
// ZASIŁEK keeps sliding from 10/59; the display turns A16 → A17 on the ding (local 6 = 20.20 s); Marta steps in,
// takes the handle with her left hand and catches the bottom-left corner (24 contact, 25 thumb on the print);
// she lifts it to Paweł, whose right hand closes on the top edge at ⅓ from the left on 36; both hold 36–39;
// Marta lets go on 40 (gap on 41); Paweł steps toward the counter carrying the print by that top edge.
import { cam, shoot, world, key, curve, step, lips, breath, mix, ss, span, reach, rot, centreFor, gripBar, rollDeg, folderHold, HIP_Y } from "../07/kolejka.mjs";
import { clerkIdle, PRAM_X } from "../07/scene.mjs";
import { marta09, pawel09, pramX, extras09 } from "../09/scene.mjs";
import { pawel10 } from "../10/scene.mjs";

export const Z_BL = [-32, 42], Z_TOP = [-32 + 64 / 3, -42];   // ZASIŁEK: bottom-left corner, top edge at ⅓
export const CATCH = [505, 388], CATCH_F = 24, TAKE_F = 36, LET_F = 40;
export const Z_END = { x: 796, y: 330, ang: 6 };                 // 11/59 (12/0 continues from here)

const zAng = f => f <= CATCH_F ? key(f, [[0, -15], [10, -21], [CATCH_F, -29]]) : f <= 39 ? key(f, [[25, -29], [39, -7]]) : key(f, [[40, -7], [59, 6]]);
// bottom-left corner path while falling (0–24): continues the 10/59 velocity (≈ −1, +3 px/frame), drifts left
const blFall = f => [curve(f, [[0, 611.8], [8, 596], [16, 562], [CATCH_F, CATCH[0]]]), curve(f, [[0, 316.4], [8, 345], [16, 372], [CATCH_F, CATCH[1]]])];
// Marta's grip on the corner while she lifts it (25–40)
const martaGrip = f => [curve(f, [[25, CATCH[0]], [32, 524], [39, 540]]), curve(f, [[25, CATCH[1]], [32, 352], [39, 328]])];
// Paweł's grip on the top edge (36–59)
const pawelGripEnd = () => rot(Z_END.x, Z_END.y, Z_END.ang, Z_TOP[0], Z_TOP[1]);

export function state11(k, f) {
  const g = 600 + f;
  // pram: still until 42, then Marta rolls it 25 px after Paweł
  const px = pramX(59) + key(f, [[42, 0], [59, 25]], t => t * t * (3 - 2 * t));
  // ── Marta
  const m0 = marta09(k, 59, 539);
  const mx = key(f, [[13, m0.x], [24, m0.x + 50], [42, m0.x + 50], [59, m0.x + 72]]);
  const [fa, la] = step(f, 13, 21, m0.x - 13, m0.x + 30, 6), [fb, lb] = step(f, 17, 25, m0.x + 13, m0.x + 70, 6);
  const [fa2, la2] = step(f, 44, 52, m0.x + 30, m0.x + 52, 5), [fb2, lb2] = step(f, 50, 58, m0.x + 70, m0.x + 92, 5);
  const footA = f < 44 ? [fa, la] : [fa2, la2], footB = f < 50 ? [fb, lb] : [fb2, lb2];
  let marta = {
    ...m0, x: mx, ...lips("marta", g),
    head: key(f, [[9, .7], [12, .95], [16, .7], [24, .55], [36, .7], [44, .85]]),
    nod: key(f, [[9, .3], [12, .05], [18, .35], [26, .25], [38, .1]]),
    gaze: key(f, [[6, .6], [9, 1], [14, .3], [30, .6], [40, .8]]), gazeDown: key(f, [[6, .3], [9, -.2], [14, .6], [26, .3], [40, 0]]),
    lean: key(f, [[13, 5], [24, 15], [30, 13], [40, 6], [50, 4]]), bow: key(f, [[13, .18], [24, .34], [34, .2], [44, .12]]),
    twist: key(f, [[13, .3], [24, .45], [44, .3]]), brow: key(f, [[14, -.2], [22, .2], [40, -.1]]),
    feet: [[footA[0] - mx, 180 + footA[1]], [footB[0] - mx, 180 + footB[1]]],
    knees: [[(footA[0] - mx) * .5 - 6, 96 + footA[1] * .5], [(footB[0] - mx) * .5 + 6, 96 + footB[1] * .5]],
  };
  // hands: right on the bar until 13, then the left takes the bar (13–19) and the right goes for the print
  if (f < 13) { marta.leftGrip = "hold"; marta = reach(k, "marta", marta, "right", gripBar(px, .35), [60, 30]); }
  else {
    const lt = ss(span(f, 13, 19)), rest = [m0.x - 46, 398];
    const lbar = gripBar(px, .55);
    marta.leftGrip = "hold";
    marta = reach(k, "marta", marta, "left", [mix(rest[0] + (mx - m0.x), lbar[0], lt), mix(rest[1], lbar[1], lt)], [-40, -20]);
  }
  let Z;
  if (f >= 13) {
    let tgt;
    if (f <= CATCH_F) { // right hand leaves the bar and goes under the falling corner (open palm), contact on 24
      const t = ss(span(f, 15, CATCH_F)), bar = gripBar(px, .35), bl = blFall(f);
      tgt = [mix(bar[0], bl[0] - 1, t), mix(bar[1], bl[1] + 2, t)];
      marta.rightGrip = "open";
    } else if (f <= 41) {
      tgt = f <= 39 ? martaGrip(f) : martaGrip(39);
      marta.rightGrip = f < LET_F ? "pinch" : "open";
      if (f >= LET_F) tgt = [tgt[0] - 4 * (f - 39), tgt[1] + 6 * (f - 39)];   // thumb off (40), gap (41)
    } else { // right hand comes back down beside the hip (wrist eases to the r1 standing rest)
      tgt = null;
    }
    if (tgt) marta = reach(k, "marta", marta, "right", tgt, [60, 30]);
    else {
      const rel = reach(k, "marta", { ...marta }, "right", [martaGrip(39)[0] - 8, martaGrip(39)[1] + 12], [60, 30]).right, t = ss(span(f, 41, 53));
      marta.right = [58, -78, mix(rel[2], 50, t), mix(rel[3], -10, t)]; marta.rightGrip = "hold";
    }
  }
  // ── Paweł
  const p0 = pawel10(k, 59, 599);
  const hx = key(f, [[40, p0.pose.x], [59, p0.pose.x + 62]]);
  const [ra, rl] = step(f, 41, 50, p0.pose.x + p0.pose.feet[1][0], p0.pose.x + p0.pose.feet[1][0] + 62, 8);
  const [la3, ll] = step(f, 49, 58, p0.pose.x + p0.pose.feet[0][0], p0.pose.x + p0.pose.feet[0][0] + 62, 8);
  let pawel = {
    ...p0.pose, x: hx, ...lips("pawel", g),
    head: key(f, [[9, .12], [12, .55], [24, .1], [30, -.35], [40, -.1], [46, .5]]),
    nod: key(f, [[9, .6], [12, .1], [22, .35], [32, .2], [46, .05]]),
    gaze: key(f, [[6, .25], [9, 1], [14, -.4], [24, -.8], [40, -.3], [46, .8]]),
    gazeDown: key(f, [[6, .9], [9, -.1], [14, .4], [28, .5], [44, .1]]),
    lean: key(f, [[24, -2], [34, -11], [40, -9], [50, 2], [58, 4]]), brow: key(f, [[10, -.5], [26, -.2], [46, -.3]]),
    feet: [[la3 - hx, 204 + ll], [ra - hx, 204 + rl]],
    knees: [[(la3 - hx) * .6, 108 + ll * .4], [(ra - hx) * .55, 108 + rl * .4]],
  };
  // folder rides with the hips; the left hand keeps it
  const dx = hx - p0.pose.x;
  const F = { ...p0.F, x: p0.F.x + dx };
  const shift = o => ({ ...o, x: o.x + dx });
  pawel.rightGrip = "hold";
  pawel = reach(k, "pawel", pawel, "right", folderHold(F), [80, -20], true);
  // screen-left hand: fingertip stays on POTWIERDZENIE (0–25), opens and reaches for the top edge (26–35), pinches on 36
  if (f < 26) { pawel.leftGrip = "point"; pawel = reach(k, "pawel", pawel, "left", p0.tip, [-90, -40], true); }
  else if (f < TAKE_F) {
    const t = ss(span(f, 26, 35)), zz = zAt(f), top = rot(zz.x, zz.y, zz.ang, Z_TOP[0], Z_TOP[1]);
    pawel.leftGrip = "open";
    pawel = reach(k, "pawel", pawel, "left", [mix(p0.tip[0], top[0] - 4, t), mix(p0.tip[1], top[1] - 6, t) - Math.sin(t * Math.PI) * 10], [-90, -40], true);
  } else {
    pawel.leftGrip = "pinch";
    const zz = zAt(f);
    pawel = reach(k, "pawel", pawel, "left", rot(zz.x, zz.y, zz.ang, Z_TOP[0], Z_TOP[1]), [-90, -40]);
  }
  // ── ZASIŁEK
  function zAt(ff) {
    const a = zAng(ff);
    if (ff <= CATCH_F) { const c = centreFor(blFall(ff), a, Z_BL[0], Z_BL[1]); return { x: c[0], y: c[1], ang: a }; }
    if (ff < LET_F) { const c = centreFor(martaGrip(Math.min(ff, 39)), a, Z_BL[0], Z_BL[1]); return { x: c[0], y: c[1], ang: a }; }
    // Paweł carries it: grip path from where he took it to the end grip (Z_END)
    const at39 = centreFor(martaGrip(39), zAng(39), Z_BL[0], Z_BL[1]), g39 = rot(at39[0], at39[1], zAng(39), Z_TOP[0], Z_TOP[1]);
    const ge = pawelGripEnd(), t = ss(span(ff, 40, 58));
    let gp = [mix(g39[0], ge[0], t), mix(g39[1], ge[1], t) - Math.sin(t * Math.PI) * 10];
    if (ff > 58) gp = [ge[0] + (ff - 59) * 2, ge[1]];                 // last two frames: 820 → 822 (2 px/frame)
    if (ff === 58) gp = [ge[0] - 2, ge[1]];
    const c = centreFor(gp, a, Z_TOP[0], Z_TOP[1]);
    return { x: c[0], y: c[1], ang: a };
  }
  Z = zAt(f);
  const inFolder = p0.inFolder.filter(p => p.id !== "Z").map(shift);
  return { g, px, marta, pawel, F, inFolder, Z };
}

export function scene(f, k) {
  const s = state11(k, f);
  const ex = extras09(59);
  const st = {
    disp: f < 6 ? 16 : 17, marta: s.marta, pawel: s.pawel, folder: s.F, inFolder: s.inFolder, free: [{ id: "Z", ...s.Z }],
    clerk: { ...clerkIdle(s.g), head: key(f, [[6, -.25], [12, -.45]]), gaze: key(f, [[6, -.4], [12, -.8]]) },
    pram: { x: s.px, roll: rollDeg(s.px - PRAM_X), breath: breath(s.g) }, lady: ex.lady, bob: ex.bob,
  };
  return shoot(cam(1, 640, 360), world(k, st));
}
