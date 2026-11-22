import {angleKeys,endPose} from "../../ruch/pose.mjs";
// Scene 04 · "Ile nam właściwie wypłacą?" (6–8 s, global frames 180–239). Author: block b01, models r1.
// Same camera and world as 03/59. Marta rocks the pram once (push 0–13, return 14–29, wheels roll by path/radius),
// her eyes leave Ola for the folder mid-return, the free hand opens, she bends from the hips toward Paweł (30–41).
// Paweł meets her look, lifts the folder from his supporting (left) hand, tilts it toward her and moves his right
// thumb to the top-left corner where URLOP and ZASIŁEK stick out (42–59) — 05 takes that pinch.
import mouths from "../../../montaz/assets/mowa.json" with { type: "json" };
import { queueWorld, queueFrame, restPoses, papers, FOLDER_Q, PRAM_Q, MARTA_Q, ss } from "../03/kolejka.mjs";
import { folder03, motionFrame as motion03, withPhoto } from "../03/scene.mjs";

const lerp = (a, b, t) => a + (b - a) * t;
const f1 = v => Math.round(v * 100) / 100;
export const push04 = f => 24 * ss(0, 13, f) - 24 * ss(14, 29, f);         // pram travel (px)
export function folder04(f) {
  const F0 = folder03(59), lift = ss(34, 50, f), tilt = ss(40, 56, f);
  return { ...F0, x: F0.x - 6 * lift, y: F0.y - 16 * lift, angle: F0.angle - 7 * tilt };
}
export function poses04(k, f) {
  const dx = push04(f), pr = { ...PRAM_Q, x: PRAM_Q.x + dx, roll: dx / (34 * PRAM_Q.s) * 180 / Math.PI };
  const F = folder04(f);
  const eyes = ss(17, 23, f), turn = ss(21, 30, f), bend = ss(30, 41, f), brow = ss(33, 39, f) * (1 - ss(46, 54, f));
  const right=angleKeys(f,[[0,[104,-32,8]],[17,[104,-32,8]],[20,[109,-29,9]],[30,[102,-93,-13]],[43,[102,-93,-13]],[59,[103,-64,2]]]);
  const a = mouths.marta[180 + f] ?? 0;
  const marta = {
    ...MARTA_Q, x: MARTA_Q.x + .3 * dx + 6 * bend, y: MARTA_Q.y + 3 * bend,
    bow: .12 + .2 * bend, lean: 4 + dx * .12 + 7 * bend, twist: .15 * turn,
    head: lerp(.5, .62, turn), nod: lerp(.45, .3, eyes) + .12 * bend * (1 - ss(42, 59, f)),
    gaze: lerp(.15, .8, eyes), gazeDown: lerp(.9, .45, eyes) + .2 * ss(42, 52, f),
    brow: .7 * brow, mouth: a * .85, smile: .1 - .2 * turn,
    angles:{left:[83,-45,-50],right},rightGrip:"open",
  };
  // Paweł: looks at the print, catches her look at 32–36, lifts the folder; thumb climbs to the top-left corner 42–56
  const meet = ss(31, 36, f) * (1 - ss(44, 50, f)), thumb = ss(42, 56, f);
  const r = restPoses(k, { folder: F, pram: pr, marta,
    pawel: { gaze: lerp(-.25, -.85, meet), gazeDown: lerp(.9, .25, meet) + .5 * thumb * 0, head: lerp(-.3, -.42, meet), nod: lerp(.5, .3, meet) + .15 * thumb },
    spineY: lerp(8, -58, thumb) });
  return { ...r, dx };
}

export function motionFrame(f,k) {
  const entry=endPose(motion03,k);
  return f===0 ? entry : queueFrame(poses04(k,f));
}
export function scene(f, k) {
  const { marta, pawel, F, pr } = motionFrame(f,k);
  const svg = queueWorld(k, { marta, pawel, pram: { ...pr, breath: .3 + .3 * Math.sin((f + 60) / 18) }, folder: F, photo: "%%PHOTO%%",
    behindFolder: papers(k, F), extrasF: f + 60 });
  return withPhoto(svg, k);
}
