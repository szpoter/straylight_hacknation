// 07 · Marta pochyla się do Oli (12–14 s, film frames 360–419). Blok b07, modele r1.
// Camera z 1.9 on the canopy, same world as 09/11 (see kolejka.mjs). Marta's profile = k.person head:1
// (one r1 head construction; no separate face module). Body stays the r1 front torso with lean/bow/twist,
// framed from the waist up — the profile torso is a request to the model owner (SPEC 07, Realizacja v3).
import { cam, shoot, world, key, span, ss, lips, breath, folderAt, printAt, PRINTS0, folderHold, gripBar, reach, rot, centreFor, U_EDGE, U_ANG, HIP_Y, CLERK } from "./kolejka.mjs";

export const CAM07 = { z: 1.9, cx: 400, cy: 270 };
export const MARTA_X = 222, PRAM_X = 470, PAWEL_X = 700;

// Marta's lean over the canopy (frames local 0–59), also used as the entry of 08
export function marta07(k, f, g) {
  const head = key(f, [[0, .7], [10, .72], [26, 1]]);
  const nod = key(f, [[0, .05], [10, .1], [26, .72], [43, .76]]);
  const pose = {
    x: MARTA_X + key(f, [[10, 0], [26, 4]]), y: HIP_Y.marta, s: 1,
    head, nod, tilt: key(f, [[10, 0], [26, 4]]),
    gaze: key(f, [[0, .7], [9, .35], [26, .25]]), gazeDown: key(f, [[0, -.1], [9, .8], [26, .55]]),
    bow: key(f, [[0, .15], [10, .16], [27, .42], [32, .44]]), lean: key(f, [[0, 6], [10, 6.5], [27, 17], [32, 18]]),
    twist: key(f, [[10, .25], [26, .45]]), brow: key(f, [[20, -.15], [30, .1]]), smile: key(f, [[26, .25], [36, .5]]),
    knees: [[-14, key(f, [[10, 96], [26, 92]])], [14, key(f, [[10, 96], [26, 92]])]],
    left: [-56, -66, -46, -4], leftGrip: "hold", rightGrip: "hold",
    ...lips("marta", g),
  };
  return reach(k, "marta", pose, "right", gripBar(PRAM_X, .35), [60, 30]);
}

// Paweł reading the turned-over URLOP (end of 06): screen-left hand pinches its left edge over the closed folder,
// screen-right hand holds the folder upright against the chest (same hands as b01 in 05–06).
export const READ_ARM = [-90, 10, -57.95, -72.94]; // pinch in front of the folder's left edge (06/59)
export function pawel07(k, g, extra = {}) {
  const hip = [PAWEL_X, HIP_Y.pawel];
  const F = folderAt(hip);
  let pose = { x: hip[0], y: hip[1], s: 1, head: .05, nod: .55, gaze: .1, gazeDown: .85, brow: -.35, smile: -.1,
    leftGrip: "pinch", rightGrip: "hold", left: READ_ARM, ...extra };
  pose = reach(k, "pawel", pose, "right", folderHold(F), [80, -20], true);
  const U = heldU(k, pose);
  // URLOP is held in front of the cover (as in 06/59), the other two stand in the folder
  return { pose, F, inFolder: [{ id: "Z", ...printAt(F, PRINTS0.Z) }, { id: "P", ...printAt(F, PRINTS0.P) }], free: [{ id: "U", ...U, mark: false }] };
}
export function heldU(k, pose) {
  const gl = k.joints("pawel", pose).gripL, c = centreFor(gl, U_ANG, U_EDGE[0], U_EDGE[1]);
  return { x: c[0], y: c[1], ang: U_ANG };
}

export function clerkIdle(g) {
  return { x: CLERK.x, y: CLERK.y, s: .9, seat: true, head: -.25, gaze: -.4, smile: .35, nod: .1,
    left: [-60, -66, -36, -40], right: [60, -66, 36, -40], blink: (g % 97) < 3 ? 1 : 0 };
}

export function scene(f, k) {
  const g = 360 + f;
  const marta = marta07(k, f, g);
  const pw = pawel07(k, g);
  const st = {
    disp: 16, marta, pawel: pw.pose, folder: pw.F, inFolder: pw.inFolder, free: pw.free, clerk: clerkIdle(g),
    pram: { x: PRAM_X, roll: 0, breath: breath(g) },
    bob: { x: 1010, step: 0 }, lady: { x: 770, phase: 0, walking: 0 },
  };
  const c = cam(CAM07.z, CAM07.cx, CAM07.cy);
  return shoot(c, world(k, st));
}
