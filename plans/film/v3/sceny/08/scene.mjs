// 08 · Końcówka pytania Marty (14–16 s, film frames 420–479). Blok b07, modele r1.
// Starts on the exact camera and poses of 07/59, then widens to both faces. Marta: eyes → chin → shoulder.
// Paweł: eyes leave the grid of the turned URLOP (26–32), then the r1 head yaws to ¾ left on its neck (33–43).
import { cam, shoot, world, key, lips, breath, mix, ss, span, reach, gripBar } from "../07/kolejka.mjs";
import { CAM07, marta07, pawel07, clerkIdle, PRAM_X } from "../07/scene.mjs";

export const CAM08 = { z: 1.45, cx: 470, cy: 258 };

export function scene(f, k) {
  const g = 420 + f;
  // Marta: entry = 07/59, eyes first (3–9), head on the neck axis (10–25), shoulder from 14
  const m0 = marta07(k, 59, 419);
  const up = key(f, [[10, 0], [25, 1]]), sh = key(f, [[14, 0], [27, 1]]);
  let marta = {
    ...m0, ...lips("marta", g),
    gaze: key(f, [[3, .25], [9, .55], [25, .45]]), gazeDown: key(f, [[3, .55], [9, -.35], [25, -.05]]),
    head: mix(1, .62, up), nod: mix(.76, .05, up), tilt: mix(4, 0, up),
    bow: mix(.44, .2, sh), lean: mix(18, 9, sh), twist: mix(.45, .3, sh), brow: key(f, [[12, .1], [24, -.35]]),
    smile: key(f, [[10, .5], [24, .15]]),
  };
  marta = reach(k, "marta", marta, "right", gripBar(PRAM_X, .35), [60, 30]); // same point of the grip bar

  // Paweł: reads, then eyes (26–32), then head (33–43), holds the look, "Nie wiem" starts on 59
  const pw = pawel07(k, g, {
    gaze: key(f, [[26, .35], [32, -1], [43, -.55]]), gazeDown: key(f, [[26, .85], [32, .25], [43, -.05]]),
    head: key(f, [[33, .15], [43, -.55]]), nod: key(f, [[33, .55], [43, .08]]), brow: key(f, [[30, -.35], [44, -.6]]),
    smile: key(f, [[40, -.1], [50, -.25]]), ...lips("pawel", g),
  });

  const st = {
    disp: 16, marta, pawel: pw.pose, folder: pw.F, inFolder: pw.inFolder, free: pw.free, clerk: clerkIdle(g),
    pram: { x: PRAM_X, roll: 0, breath: breath(g) },
    bob: { x: 1010, step: 0 }, lady: { x: 770, phase: 0, walking: 0 },
  };
  const t = ss(span(f, 10, 25));
  const c = cam(mix(CAM07.z, CAM08.z, t), mix(CAM07.cx, CAM08.cx, t), mix(CAM07.cy, CAM08.cy, t));
  return shoot(c, world(k, st));
}
