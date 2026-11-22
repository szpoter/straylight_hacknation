// 12 · Przy okienku (22–24 s, film frames 660–719). Blok b07, modele r1.
// New angle from the end of the counter: same world, cam z 1.8 at the window, parents cheated forward
// (Marta hip 615, Paweł 812 instead of 11/59's 358 / 723 — the screen direction of the print stays left→right).
// Paweł hands ZASIŁEK by its top edge; the clerk's screen-left hand (model `left`) takes the right edge at 45 %
// of its height on 12; both hold 13–17; Paweł lets go on 18 (gap by 22); she reads the title (23–36), turns it
// toward Marta and rests the bottom edge on the counter top on 53. End centre on screen (816,463), −10°.
import { cam, shoot, world, key, lips, mix, ss, span, reach, rot, centreFor, folderAt, printAt, folderHold, HIP_Y, CLERK } from "../07/kolejka.mjs";
import { Z_TOP } from "../11/scene.mjs";
import { pawel10 } from "../10/scene.mjs";

export const CAM12 = { z: 1.8, cx: 885, cy: 254 };
export const Z_RIGHT45 = [32, -42 + .45 * 84];        // right edge, 45 % of the height from the top
export const TOUCH_F = 12, RELEASE_F = 18;
export const MARTA12 = 640, PAWEL12 = 850;
const toWorld = (sx, sy) => [CAM12.cx + (sx - 640) / CAM12.z, CAM12.cy + (sy - 360) / CAM12.z];
export const Z_FINAL = { ...(([x, y]) => ({ x, y }))(toWorld(816, 463)), ang: -10 };

export function zAt(f) {
  if (f <= TOUCH_F) { const t = ss(span(f, 0, TOUCH_F)); return { x: mix(872, 936, t), y: mix(332, 322, t) - Math.sin(t * Math.PI) * 4, ang: mix(6, 2, t) }; }
  if (f <= 22) { const t = span(f, TOUCH_F, 22); return { x: mix(936, 946, t), y: mix(322, 318, t), ang: mix(2, 4, t) }; }
  if (f <= 36) { const t = ss(span(f, 22, 30)); return { x: mix(946, 992, t), y: mix(318, 300, t), ang: mix(4, 20, t) }; }
  const t = ss(span(f, 37, 53));
  return { x: mix(992, Z_FINAL.x, t), y: mix(300, Z_FINAL.y, t) - Math.sin(t * Math.PI) * 6, ang: mix(20, Z_FINAL.ang, t) };
}

export function scene(f, k) {
  const g = 660 + f;
  const Z = zAt(f);
  // ── clerk: reaches with the screen-left hand, thumb on the printed side at the right edge
  const edge = rot(Z.x, Z.y, Z.ang, Z_RIGHT45[0], Z_RIGHT45[1]);
  let clerk = {
    x: CLERK.x, y: CLERK.y, s: .9, seat: true, ...lips("clerk", g),
    head: key(f, [[0, -.45], [10, -.35], [23, -.2], [37, -.25], [53, -.55]]),
    nod: key(f, [[0, .1], [23, .25], [28, .5], [37, .45], [53, .1]]),
    gaze: key(f, [[0, -.8], [12, -.5], [23, -.6], [37, -.7], [53, -1]]),
    gazeDown: key(f, [[0, .1], [12, .5], [23, .9], [37, .8], [53, -.1]]),
    lean: key(f, [[0, 0], [12, -9], [22, -6], [36, -3], [53, -6]]), brow: key(f, [[20, 0], [30, -.15], [53, .1]]),
    smile: key(f, [[30, .3], [54, .5]]), leftGrip: f < TOUCH_F ? "open" : "pinch", rightGrip: "hold", right: [60, -66, 34, -40],
  };
  const rest = [CLERK.x - 40, 372];
  const ct = ss(span(f, 2, TOUCH_F));
  clerk = reach(k, "clerk", clerk, "left", f < TOUCH_F ? [mix(rest[0], edge[0] + 3, ct), mix(rest[1], edge[1] - 2, ct)] : edge, [-50, -10]);
  // ── Paweł: hands the print by its top edge, lets go on 18, hand back to the folder
  const p0 = pawel10(k, 59, 599);
  const hip = [PAWEL12, HIP_Y.pawel];
  const F = folderAt(hip, 10);
  let pawel = {
    ...p0.pose, x: hip[0], y: hip[1], ...lips("pawel", g), feet: undefined, knees: undefined, lean: key(f, [[0, 5], [18, 3], [30, 0]]),
    head: key(f, [[0, .5], [16, .45], [26, .3], [40, .35]]), nod: key(f, [[0, .1], [20, .2], [40, .25]]),
    gaze: key(f, [[0, .7], [20, .5], [40, .6]]), gazeDown: key(f, [[0, .2], [20, .4], [40, .5]]), brow: -.25,
  };
  pawel.rightGrip = "hold";
  pawel = reach(k, "pawel", pawel, "right", folderHold(F), [80, -20], true);
  // screen-left (working) hand carries the print by the top edge, lets go on 18, returns to the folder top
  const top = rot(Z.x, Z.y, Z.ang, Z_TOP[0], Z_TOP[1]);
  if (f < RELEASE_F) { pawel.leftGrip = "pinch"; pawel = reach(k, "pawel", pawel, "left", top, [-90, 10]); }
  else {
    const t = ss(span(f, RELEASE_F, 34)), back = rot(F.x, F.y, F.ang, -30, -44);
    const z17 = zAt(RELEASE_F - 1), from = rot(z17.x, z17.y, z17.ang, Z_TOP[0], Z_TOP[1]);
    pawel.leftGrip = f < 24 ? "open" : "hold";
    pawel = reach(k, "pawel", pawel, "left", [mix(from[0] - 6, back[0], t), mix(from[1] - 5, back[1], t)], [-90, 10]);
  }
  const inFolder = p0.inFolder.filter(p => p.id !== "Z").map(p => { const d = printAt(F, [0, 0, 0]); const o = printAt(p0.F, [0, 0, 0]); return { ...p, x: p.x + d.x - o.x, y: p.y + d.y - o.y }; });
  // ── Marta: waits, then reads the title as it turns to her
  const marta = {
    x: MARTA12, y: HIP_Y.marta, s: 1, head: key(f, [[0, .7], [20, .6], [40, .45]]), nod: key(f, [[0, .1], [37, .15], [53, .3]]),
    gaze: key(f, [[0, .8], [24, .6], [44, .5]]), gazeDown: key(f, [[0, .1], [37, .2], [53, .45]]), lean: 3, bow: .08, twist: .25,
    brow: key(f, [[30, -.2], [53, -.4]]), smile: .1, leftGrip: "hold", rightGrip: "hold", right: [60, -70, 48, 0], left: [-60, -70, -48, 0],
  };
  const st = { disp: 17, marta, pawel, folder: F, inFolder, free: [{ id: "Z", ...Z }], clerk };
  return shoot(cam(CAM12.z, CAM12.cx, CAM12.cy), world(k, st));
}
