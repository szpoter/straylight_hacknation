// Scene 02 · "Patrz, jak cię trzyma" (2–4 s, global frames 60–119). Author: block b01, models r1.
// Punch-in (JumpCutPunchIn): the hands are the SAME world as 01, scaled Z× about the shared point CONTACT (578,401),
// so 01/59 and 02/0 overlay after scaling. Touch at local 5 (film 65); Ola closes middle → ring → index → little;
// local 53 is the clean "photo" frame; flash 54–57 (klik 3.805 s), 58–59 = frame 53 again.
// photo02() returns the clean frame 53 extended to the print's aspect (56 : 41.4) for the folder in 03–06.
import mouths from "../../../montaz/assets/mowa.json" with { type: "json" };
import { CAM, CONTACT, W_EDGE, FINGER_DEG, thin, ss, motionFrame as wardFrame, graspTransform, MARTA } from "../01/scene.mjs";

import {endPose,reach} from "../../ruch/pose.mjs";

export const Z = 7;                                   // macro magnification relative to 01
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const f1 = v => Math.round(v * 10) / 10;
const INK = "#283754", SAGE = "#B2CAAD", CREAM = "#FBFAF3", GOWN = "#E2ECEA";

// Fingertip gap in 01-screen px along the finger axis (negative = pressed into the palm).
// Per-finger closure (index, middle, ring, little) and thumb.
export function fingers02(f) {
  return [ss(20, 31, f), ss(9, 21, f), ss(14, 26, f), ss(27, 34, f)];
}
export const breath02 = f => Math.sin(Math.PI * ss(5, 38, f)) * ss(5, 24, f + 4); // blanket up 5–24, settles by ~38

function macroBackground(f, ext = 0) {
  const lift = -6 * breath02(f);
  let s = `<rect x="-40" y="${-40 - ext}" width="1360" height="${800 + 2 * ext}" fill="#F5FAF7"/>`;
  // Marta's gown behind her face (top-left), then the blanket fold with ONE sage stripe at the 01 angle (−10°)
  s += `<path d="M-40 352C40 330 150 340 236 392C290 424 316 470 320 760V${760 + ext}H-40Z" fill="${GOWN}" stroke="${INK}" stroke-width="3"/>`;
  s += `<path d="M60 344L112 404L160 352" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
  // Marta's bed sheet in the lower right (same tint as wardFront)
  s += `<path d="M560 ${760 + ext}V760C600 660 760 610 1320 600V${760 + ext}Z" fill="#DCE9E4" stroke="${INK}" stroke-width="3"/>`;
  s += `<path d="M700 690Q980 650 1320 652" fill="none" stroke="#B5CCC4" stroke-width="3"/>`;
  s += `<g transform="translate(0 ${f1(lift)})">`;
  s += `<path d="M-40 560C80 520 220 500 330 520C420 536 470 600 480 760V${760 + ext}H-40Z" fill="${CREAM}" stroke="${INK}" stroke-width="4"/>`;
  s += `<path d="M-40 650L392 574C430 600 452 640 462 ${700}L-40 ${764}Z" fill="${SAGE}"/>`;
  s += `<path d="M-40 560C80 520 220 500 330 520C420 536 470 600 480 760V${760 + ext}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`;
  s += `</g>`;
  return s;
}
function martaHead(f) {
  const a = mouths.marta[60 + f] ?? 0;
  return `<g filter="url(#b01-depth)" opacity=".96">` +
    `<defs><filter id="b01-depth" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter></defs>` +
    `${MARTA_HEAD(f, a)}</g>`;
}
let KREF = null;
const MARTA_HEAD = (f, a) => KREF.head("marta", { x: 60, y: 318, s: 3.0, head: .5, nod: .55, gaze: .75, gazeDown: .75, lid: .15, smile: .35 * (1 - a), mouth: a * .8, line: 1.3 });

// The hands: 01 world (only Paweł's arm + Ola's hand) under the punch-in camera.
export function motionFrame(f,k) {
  const start=endPose(wardFrame,k), t=Math.min(f,53);
  const press=ss(5,12,t)*(1-.4*ss(30,53,t)), thumb=ss(25,36,t);
  const settle=1.5*ss(27,40,t), c=CAM.c*Z;
  const camera=[c,0,0,c,CONTACT[0]+Z*(CAM.tx-CONTACT[0]),CONTACT[1]+settle+Z*(CAM.ty-CONTACT[1])];
  const before=start.actors.pawel.pins.left.target;
  const point=before.map((v,i)=>lerp(v,W_EDGE[i],ss(0,5,t)));
  const flinch=1.8*Math.sin(Math.PI*ss(13,20,t));
  const pawel=reach("pawel",{...start.actors.pawel,handAngle:{left:FINGER_DEG+flinch}},"left",point);
  return {camera,segment:"ward",actors:{pawel},details:{"ola.gripL":W_EDGE},props:{palm:W_EDGE},
    visible:{pawel:["shoulderL","elbowL","wristL","gripL"]},contacts:t<5?[]:[{role:"pawel",joint:"gripL",id:"ola.palm",target:W_EDGE}],
    cl:fingers02(t),thumb,press,settle,supports:[]};
}
function hands(f,k) {
  const {actors:{pawel:pp},cl,thumb:th,press,settle}=motionFrame(f,k);
  let w = `<g transform="${graspTransform(W_EDGE)}">${k.babyHand("back", cl, { line: 11.5, press })}</g>`;
  w += k.person("pawel", { ...pp, parts: "left" });
  w += `<g transform="${graspTransform(W_EDGE)}">${k.babyHand("front", cl, { line: 11.5, thumb: th })}</g>`;
  return `<g transform="translate(${CONTACT[0]} ${f1(CONTACT[1] + settle)}) scale(${Z}) translate(${-CONTACT[0]} ${-CONTACT[1]})">` +
    `<g transform="translate(${CAM.tx} ${CAM.ty}) scale(${CAM.c})">${thin(w, .62 / Z * 1.55)}</g></g>`;
}

// Clean picture of local frame f (no flash). ext extends the background above/below the frame (for the print).
export function frame02(f, k, ext = 0) {
  KREF = k;
  return macroBackground(f, ext) + martaHead(f) + hands(f, k);
}
// Print aspect of the folder photo (rekwizyty.folder: picture 56 × 41.4 inside a 68 × 52 white border).
export const PRINT = { w: 56, h: 41.4 };
export const PRINT_EXT = Math.ceil((1280 * PRINT.h / PRINT.w - 720) / 2); // ≈ 113 px above and below
export function photo02(k) { return frame02(53, k, PRINT_EXT); }

export function scene(f, k) {
  const clean = f >= 58 ? 53 : Math.min(f, 53);
  let s = frame02(clean, k);
  if (f >= 54 && f <= 57) {
    const o = [1, .7, .38, .12][f - 54];
    s += `<rect width="1280" height="720" fill="#FFFFFF" opacity="${o}"/>`;
  }
  return s;
}
