// Scene 05 · "Na pewno wziąłeś dobre?" (8–10 s, global frames 240–299). Author: block b01, models r1.
// Over Marta's left shoulder: her profile (r1 head, yaw +1) on the left edge, Paweł ¾ in the queue world behind.
// Szelest 8.30 s = local 9: his right thumb+index (screen-left arm, pinch) leave the folder corner for URLOP's free
// top-left corner (closed at 15), the corner bends first (16–19), then the sheet slides out to his right and up
// (18–35); at 25 ZASIŁEK's header is clear. Marta's pupil drops to it 26–29, her head follows 30–35.
// 36–59 he holds URLOP face-out under his face, corner still pinched — 06 starts from that pinch.
import mouths from "../../../montaz/assets/mowa.json" with { type: "json" };
import { thin } from "../01/scene.mjs";
import { queueWorld, restPoses, grip, papers, paperPointQ, folderLocal, PRAM_Q, ss } from "../03/kolejka.mjs";
import { withPhoto } from "../03/scene.mjs";
import { folder04, poses04 } from "../04/scene.mjs";

const lerp = (a, b, t) => a + (b - a) * t;
const f1 = v => Math.round(v * 1000) / 1000;
export const CAM05 = { z: 2.05, cx: 806, cy: 252 };        // world point at the frame centre
export const camT = c => `translate(640 360) scale(${c.z}) translate(${-c.cx} ${-c.cy})`;

export function pull05(f) {
  const go = ss(16, 26, f), corner = ss(15, 19, f) * (1 - go);
  return { dx: -84 * go, dy: -34 * go, angle: -9 * go, bend: .35 * corner + .12 * Math.sin(Math.PI * go), lift: .6 * corner };
}
export function pose05(k, f) {
  const base = poses04(k, 59), F = folder04(59);
  const pull = pull05(f);
  // pinch target: folder corner (04/59) → URLOP's top-left corner (15) → travels with the sheet
  const corner0 = folderLocal(F, -50, -58);
  const pc = paperPointQ(k, F, pull, "cornerTL"), sc = F.w / 100, a = (F.angle - 1 + pull.angle) * Math.PI / 180;
  const onPaper = [pc[0] + sc * (6 * Math.cos(a) - 7 * Math.sin(a)), pc[1] + sc * (6 * Math.sin(a) + 7 * Math.cos(a))];
  const reach = ss(9, 15, f);
  const target = [lerp(corner0[0], onPaper[0], reach), lerp(corner0[1], onPaper[1], reach)];
  const look = ss(26, 29, f), nod = ss(30, 35, f);
  let pawel = { ...base.pawel, gaze: -.2, gazeDown: .8 - .25 * ss(18, 35, f), head: lerp(-.42, -.5, ss(16, 35, f)), nod: .45 - .1 * ss(18, 35, f) };
  pawel = grip(k, "pawel", { ...pawel, left: [-90, -60, -40, -100] }, "left", target, lerp(-60, -100, ss(16, 35, f)));
  return { ...base, pawel, F, pull, look, nod };
}

// Foreground: Marta's profile and the edge of her sage shoulder (left edge of frame).
function martaOTS(k, f, look, nod) {
  const a = mouths.marta[240 + f] ?? 0;
  const head = k.head("marta", { x: 120, y: 470, s: 3.1, head: .93, nod: .22 + .2 * nod, tilt: 3 - 3 * nod, gaze: .7, gazeDown: lerp(.25, .85, look),
    brow: -.35 * look, mouth: a * .8, smile: -.15 * look, line: 1.25 });
  const neck = `<path d="M70 470C78 520 86 560 92 600L170 610C160 560 150 520 150 470Z" fill="#FFEBDB" stroke="#283754" stroke-width="3.4"/>`;
  const shoulder = `<path d="M-60 560C20 548 120 572 190 610C240 640 262 690 270 760H-60Z" fill="#B2CAAD" stroke="#283754" stroke-width="3.4"/>` +
    `<path d="M120 600C150 640 160 690 158 740" fill="none" stroke="#8FAE8A" stroke-width="2.4"/>`;
  return neck + shoulder + head;
}

export function scene(f, k) {
  const { marta, pawel, F, pr, pull, look, nod } = pose05(k, f);
  const ps = papers(k, F, pull, { split: true });
  const svg = queueWorld(k, { marta, pawel, pram: { ...pr, breath: .3 + .3 * Math.sin((f + 120) / 18) }, folder: F, photo: "%%PHOTO%%",
    behindFolder: ps.z + ps.u, extrasF: f + 120 });
  return `<rect width="1280" height="720" fill="#F5FAF7"/><g transform="${camT(CAM05)}">${withPhoto(thin(svg, 1 / Math.pow(CAM05.z, .62)), k)}</g>` + martaOTS(k, f, look, nod);
}
