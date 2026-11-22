// 10 · Trzy podkreślenia (18–20 s, film frames 540–599). Blok b07, modele r1.
// Same world as 09, camera punched in to z 3.2 on the folder (cut on the fingertip resting on URLOP).
// Paweł's right index pushes URLOP (Okres), pulls ZASIŁEK (Podstawa), pushes POTWIERDZENIE (Data wpływu);
// then ZASIŁEK loses the support of its lower corner and starts sliding toward Marta.
import { cam, shoot, world, key, lips, breath, mix, ss, span, reach, rot, printAt, PRINTS0, folderHold } from "../07/kolejka.mjs";
import { clerkIdle } from "../07/scene.mjs";
import { pawel09, marta09, pramX, extras09, FINGER_U } from "../09/scene.mjs";
import { rollDeg } from "../07/kolejka.mjs";
import { PRAM_X } from "../07/scene.mjs";

export const CAM10 = { z: 4, cx: 704, cy: 262 };
// print offsets in the folder frame [dx, dy, angle]; touch points are sheet-local (before rotation)
export const Z_TOUCH = [-24, -34], P_TOUCH = [16, -36];  // near the left top: the forearm stays clear of the marks
export function prints10(f) {
  const u = ss(span(f, 4, 16)), z = ss(span(f, 26, 37)), p = ss(span(f, 44, 53));
  const U0 = PRINTS0.U, Z0 = PRINTS0.Z, P0 = PRINTS0.P;
  const U = [mix(U0[0], 34, u), mix(U0[1], -80, u), U0[2]];          // right and up: "Okres" clears the cover
  const Z = [mix(Z0[0], -50, z), mix(Z0[1], -72, z), mix(Z0[2], -12, z)]; // left and up: "Podstawa"
  const h = ss(span(f, 38, 44));                                          // finger hooks the hidden top edge out (38–44)
  const P = [mix(P0[0], -2, p), mix(mix(P0[1], -22, h), -66, p), P0[2]];  // then pushes it up: "Data wpływu"
  return { U, Z, P };
}
// ZASIŁEK after it loses its support (world px, from 10/54): 1 px left and 2 px down per frame, accelerating
export function zSlide(Zw, f) { const t = Math.max(0, f - 53); return { x: Zw.x - t - .04 * t * t, y: Zw.y + 2 * t + .08 * t * t, ang: Zw.ang - .5 * t }; }

export function pawel10(k, f, g) {
  const base = pawel09(k, 59, 539);          // body, folder and left hand exactly as 09/59
  const F = base.F, o = prints10(f);
  const U = printAt(F, o.U), P = printAt(F, o.P);
  let Z = printAt(F, o.Z);
  if (f > 53) Z = zSlide(Z, f);
  // fingertip path: on URLOP (0–16), arc to ZASIŁEK (17–25), on it (26–37), arc to POTWIERDZENIE (38–43), on it (44–59)
  const tipU = rot(U.x, U.y, U.ang, FINGER_U[0], FINGER_U[1]);
  const Zs = printAt(F, o.Z), tipZ = rot(Zs.x, Zs.y, Zs.ang, Z_TOUCH[0], Z_TOUCH[1]);
  const tipP = rot(P.x, P.y, P.ang, P_TOUCH[0], P_TOUCH[1]);
  const Zat26 = printAt(F, prints10(26).Z), tipZ26 = rot(Zat26.x, Zat26.y, Zat26.ang, Z_TOUCH[0], Z_TOUCH[1]);
  const Pat44 = printAt(F, prints10(44).P), tipP44 = rot(Pat44.x, Pat44.y, Pat44.ang, P_TOUCH[0], P_TOUCH[1]);
  const Uat16 = printAt(F, prints10(16).U), tipU16 = rot(Uat16.x, Uat16.y, Uat16.ang, FINGER_U[0], FINGER_U[1]);
  const Zat37 = printAt(F, prints10(37).Z), tipZ37 = rot(Zat37.x, Zat37.y, Zat37.ang, Z_TOUCH[0], Z_TOUCH[1]);
  let tip;
  const press = f <= 3 ? f / 3 * 1.2 : 0;   // 0–3: the pad flattens on the paper (tiny push into the sheet)
  if (f <= 16) tip = [tipU[0], tipU[1] + press * .5];
  else if (f < 26) { const t = ss(span(f, 16, 26)); tip = [mix(tipU16[0], tipZ26[0], t), mix(tipU16[1], tipZ26[1], t) - Math.sin(t * Math.PI) * 9]; }
  else if (f <= 37) tip = tipZ;
  else if (f < 44) { const t = ss(span(f, 37, 44)); tip = [mix(tipZ37[0], tipP44[0], t), mix(tipZ37[1], tipP44[1], t) - Math.sin(t * Math.PI) * 8]; }
  else tip = tipP;
  let pose = { ...base.pose, leftGrip: "point", ...lips("pawel", g), head: .12, nod: .6, gazeDown: .9,
    gaze: key(f, [[0, .4], [20, .1], [40, .25]]) };
  pose = reach(k, "pawel", pose, "left", tip, f < 38 ? [-90, -40] : [-30, 10], true); // elbow drops below the marks for POTWIERDZENIE
  // screen-right hand keeps the folder against the chest
  pose = reach(k, "pawel", pose, "right", folderHold(F), [80, -20], true);
  return { pose, F, inFolder: [{ id: "Z", ...Z }, { id: "U", ...U }, { id: "P", ...P }], Z, U, P, tip };
}

export function scene(f, k) {
  const g = 540 + f;
  const pw = pawel10(k, f, g);
  const px = pramX(59);
  const st = {
    disp: 16, marta: marta09(k, 59, 539), pawel: pw.pose, folder: pw.F, inFolder: pw.inFolder, clerk: clerkIdle(g),
    pram: { x: px, roll: rollDeg(px - PRAM_X), breath: breath(g) }, ...extras09(59),
  };
  return shoot(cam(CAM10.z, CAM10.cx, CAM10.cy), world(k, st));
}
