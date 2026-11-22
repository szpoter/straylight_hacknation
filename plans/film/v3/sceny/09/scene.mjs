// 09 · Paweł przytrzymuje wózek (16–18 s, film frames 480–539). Blok b07, modele r1. Plan ogólny, cam z = 1.
// The queue moves: the bob client steps to the window, the elderly client walks behind Paweł. The pram rolls
// right with Marta; Paweł plants his screen-left foot, shifts his pelvis and stops the gondola with his
// outer thigh (first contact 28, wheels stop 34). Right fingertip lands on the turned URLOP on 59.
import { cam, shoot, world, key, curve, step, lips, breath, mix, ss, span, reach, gripBar, rot, folderAt, printAt, PRINTS0,
  folderHold, rollDeg, GONDOLA_RIGHT, THIGH_OUT, HIP_Y, U_EDGE, SHEET } from "../07/kolejka.mjs";
import { marta07, clerkIdle, heldU, READ_ARM, MARTA_X, PRAM_X, PAWEL_X } from "../07/scene.mjs";

export const PRAM_KEYS = [[8, PRAM_X], [20, PRAM_X + 22], [28, PRAM_X + 56], [34, PRAM_X + 61]];
export const pramX = f => curve(f, PRAM_KEYS);
export const CONTACT = 28;
// Paweł's hips: shifts left until the thigh meets the gondola rim, then rides with it until the wheels stop
export function pawelHipX(f) {
  if (f < CONTACT) return key(f, [[23, PAWEL_X], [CONTACT, pramX(CONTACT) + GONDOLA_RIGHT + THIGH_OUT]], t => 1 - (1 - t) * (1 - t));
  return pramX(f) + GONDOLA_RIGHT + THIGH_OUT;
}
export const FINGER_U = [-20, -34];   // fingertip on the turned URLOP, sheet-local (above the POTWIERDZENIE top)   // fingertip on the turned URLOP, sheet-local (before rotation)
export const FOOT_L = [PAWEL_X - 22, PAWEL_X - 60], FOOT_R = PAWEL_X + 22;

// Paweł in 09 (also the exact source of 10/0 and 11/0)
export function pawel09(k, f, g) {
  const hx = pawelHipX(f), hip = [hx, HIP_Y.pawel];
  const F = folderAt(hip, key(f, [[24, 0], [34, 10]]));
  const Z = printAt(F, PRINTS0.Z), P = printAt(F, PRINTS0.P);
  const [lx, lift] = step(f, 10, 23, FOOT_L[0], FOOT_L[1], 9);
  let pose = {
    x: hx, y: hip[1], s: 1, ...lips("pawel", g),
    head: key(f, [[7, -.55], [16, .4], [24, .35], [31, -.05], [44, .12]]),
    nod: key(f, [[7, .08], [16, .05], [31, .3], [44, .55]]),
    gaze: key(f, [[7, -.55], [14, .9], [26, .7], [36, .4], [42, .35]]),
    gazeDown: key(f, [[7, -.05], [14, .1], [28, .5], [38, .85]]),
    brow: key(f, [[8, -.6], [20, -.3], [40, -.35]]), smile: -.15,
    lean: key(f, [[8, 0], [20, 2], [28, -5], [36, -2]]),
    feet: [[lx - hx, 204 + lift], [FOOT_R - hx, 204]],
    knees: [[(lx - hx) * .6 - 4, 108 + lift * .4], [(FOOT_R - hx) * .55, key(f, [[24, 108], [30, 104]])]],
    rightGrip: "hold",
  };
  pose = reach(k, "pawel", pose, "right", folderHold(F), [80, -20], true);
  // screen-left hand: holds URLOP by its left edge (READ_ARM) until 30, stands it back into the folder (slot
  // PRINTS0.U) by 40 following the edge, lets go (41–44), the index fingertip lands on FINGER_U on 59.
  const held = heldU(k, { ...pose, left: READ_ARM, leftGrip: "pinch" }), slot = printAt(F, PRINTS0.U);
  // URLOP hangs beside the cover (no overlap), so from 30 it slides sideways behind the cover into the slot (30–40)
  const lay = ss(span(f, 30, 40));
  const U = { x: mix(held.x, slot.x, lay), y: mix(held.y, slot.y, lay) - Math.sin(lay * Math.PI) * 8, ang: mix(held.ang, slot.ang, lay) };
  const uFront = f < 30;
  const edge = rot(U.x, U.y, U.ang, U_EDGE[0], U_EDGE[1]), tip = rot(U.x, U.y, U.ang, FINGER_U[0], FINGER_U[1]);
  if (f < 30) { pose.left = READ_ARM; pose.leftGrip = "pinch"; }
  else if (f < 41) { pose.leftGrip = "pinch"; pose = reach(k, "pawel", pose, "left", edge, [-90, -40], true); }
  else {
    const t = ss(span(f, 44, 59)), lift2 = Math.sin(span(f, 41, 59) * Math.PI) * -10;
    pose.leftGrip = f < 45 ? "open" : "point";
    pose = reach(k, "pawel", pose, "left", [mix(edge[0] - 4, tip[0], t), mix(edge[1] - 2, tip[1], t) + lift2], [-90, -40], true);
  }
  return { pose, F, inFolder: uFront ? [{ id: "Z", ...Z }, { id: "P", ...P }] : [{ id: "Z", ...Z }, { id: "U", ...U, mark: lay >= 1 }, { id: "P", ...P }], free: uFront ? [{ id: "U", ...U, mark: false }] : [], U, tip };
}

export function marta09(k, f, g) {
  const px = pramX(f), d = px - PRAM_X;
  const hx = MARTA_X + curve(f - 2, PRAM_KEYS) - PRAM_X + key(f, [[30, 0], [38, 3]]);
  const m = marta07(k, 59, 419);
  const [a, la] = step(f, 7, 19, MARTA_X - 13, MARTA_X - 13 + 61, 7), [b, lb] = step(f, 15, 30, MARTA_X + 13, MARTA_X + 13 + 64, 7);
  let pose = {
    ...m, x: hx, ...lips("marta", g),
    head: key(f, [[0, .62], [10, .72], [24, .85], [40, .7]]), nod: key(f, [[0, .05], [12, .3], [26, .4], [44, .3]]),
    gaze: key(f, [[0, .45], [12, .4], [40, .6]]), gazeDown: key(f, [[0, -.05], [12, .6], [44, .3]]),
    bow: key(f, [[0, .2], [14, .25], [34, .18]]), lean: key(f, [[0, 9], [14, 11], [30, 8], [36, 5]]), twist: .3,
    brow: key(f, [[0, -.35], [30, -.2]]), smile: .1, tilt: 0,
    feet: [[a - hx, 180 + la], [b - hx, 180 + lb]], knees: [[(a - hx) * .5 - 6, 96 + la * .5], [(b - hx) * .5 + 6, 96 + lb * .5]],
  };
  return reach(k, "marta", pose, "right", gripBar(px, .35), [60, 30]);
}

export function extras09(f) {
  const x = key(f, [[3, 770], [55, 905]], t => t), walking = key(f, [[2, 0], [6, 1], [50, 1], [56, 0]]);
  const phase = (x - 770) / 64;
  const settle = f > 54 ? .5 * Math.exp(-(f - 54) / 5) * Math.cos((f - 54) / 2.2) : 0;
  const bagLag = walking * (.45 + .45 * Math.sin(2 * Math.PI * phase - 1.3)) + settle;
  return { lady: { x, phase, walking, bagLag }, bob: { x: key(f, [[0, 1010], [11, 1032]]), step: key(f, [[0, 0], [11, 1]]) } };
}

export function scene(f, k) {
  const g = 480 + f;
  const pw = pawel09(k, f, g);
  const px = pramX(f);
  const st = {
    disp: 16, marta: marta09(k, f, g), pawel: pw.pose, folder: pw.F, inFolder: pw.inFolder, free: pw.free, clerk: clerkIdle(g),
    pram: { x: px, roll: rollDeg(px - PRAM_X), breath: breath(g) }, ...extras09(f),
  };
  return shoot(cam(1, 640, 360), world(k, st));
}
