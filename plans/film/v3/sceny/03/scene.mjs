import {endPose} from "../../ruch/pose.mjs";
// Scene 03 · "Zdjęcie pod folią" (4–6 s, global frames 120–179). Author: block b01, models r1.
// 0–5: exactly the clean 02 picture (02/59 ≡ 02/53). From 6 (wheel squeak 4.20 s) the camera pulls back along the
// print: the 02 picture IS the photo in the folder (photo02, same drawing), then the folder, Paweł's thumb and cuff,
// and finally the family in the ZUS queue (03/59 = 04/0). One glint crosses the foil 6–20 and stops at the pocket seam.
import { scene as scene02, motionFrame as motion02, photo02 } from "../02/scene.mjs";
import { thin } from "../01/scene.mjs";
import { queueWorld, queueFrame, restPoses, papers, FOLDER_Q, PRAM_Q, folderLocal, folderTransform, ss } from "./kolejka.mjs";

const D = Math.PI / 180;
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const f1 = v => Math.round(v * 1000) / 1000;

// Folder motion: tilt toward the light 6–21 (−5° → −1°), back and settle lower at the chest 22–40.
export function folder03(f) {
  const tilt = ss(6, 18, f) - ss(20, 36, f);
  const settle = ss(22, 40, f);
  return { ...FOLDER_Q, angle: FOLDER_Q.angle + 4 * tilt, x: FOLDER_Q.x - 2 * tilt, y: FOLDER_Q.y - 6 * (1 - settle) + 0 };
}
// Picture centre and size in world px for a folder state (picture rect −20.96..24.96 × −15.22..18.73, folder-local).
function picture(F) {
  const sc = F.w / 100, a = F.angle * D, cx = 2, cy = (-15.22 + 18.73) / 2 + 0; // 02 frame centre (640,360) ↔ (2, 1.755)
  const lx = -28 * .82 + 2 + 640 * .04375 * .82, ly = (-16.06 + 360 * .04375) * .82 + 2;
  return { c: [F.x + sc * (lx * Math.cos(a) - ly * Math.sin(a)), F.y + sc * (lx * Math.sin(a) + ly * Math.cos(a))], scale: sc * .82 * .04375, angle: F.angle };
}
export const PULL = { a: 6, b: 56 };
export function camera03(f, F) {
  const p = picture(F), S0 = 1 / p.scale;                       // at S0 one 02 px = one screen px
  const e = ss(PULL.a, PULL.b, f);                              // log-zoom progress: border 21, thumb+cuff 32, family 41+
  const S = Math.exp(Math.log(S0) * (1 - e));
  const w = (1 / S - 1 / S0) / (1 - 1 / S0);                    // keeps the zoom centred while it travels
  const Q = [lerp(p.c[0], 640, w), lerp(p.c[1], 360, w)];
  const r = -p.angle * (1 - w);
  return { S, Q, r, transform: `translate(640 360) rotate(${f1(r)}) scale(${f1(S)}) translate(${f1(-Q[0])} ${f1(-Q[1])})` };
}

// Pawel looks at the print; Marta keeps the handle and looks at Ola, then (41–59) is ready to rock the pram.
export function poses03(k, f, F) {
  // Marta's head/eyes end exactly on 04/0 (looking down at Ola); a small settle of the head 41–56
  const look = ss(41, 56, f);
  return restPoses(k, { folder: F, marta: { gaze: .15, gazeDown: .9, head: lerp(.56, .5, look), nod: lerp(.5, .45, look) },
    pawel: { gazeDown: .9, gaze: -.25, nod: .5 } });
}

function glint(f) {
  // diagonal sheen in folder-local units, clipped to the foil pocket; it travels with the tilt and stops at the seam
  const t = ss(6, 20, f), x = lerp(-70, 30, t), o = Math.sin(Math.PI * Math.min(1, (f - 6) / 16)) * (f >= 6 && f <= 24 ? 1 : 0);
  if (o <= 0) return "";
  return `<clipPath id="b01-foil"><path d="M-30 -26H35V31H-30Z"/></clipPath><g clip-path="url(#b01-foil)" opacity="${f1(o * .85)}">` +
    `<path d="M${x} -40L${x + 3.2} -40L${x - 36.8} 50L${x - 40} 50Z" fill="#FFFFFF"/><path d="M${x + 6} -40L${x + 6.8} -40L${x - 33.2} 50L${x - 34} 50Z" fill="#FFFFFF" opacity=".7"/></g>`;
}
// foil pocket seam (the sleeve holding the print on the cover) — local extension of rekwizyty.folder
const POCKET = f => `<path d="M-30 -26H35V31H-30Z" fill="#FFFFFF" fill-opacity="${f1(.08 * ss(6, 16, f))}" stroke="#B9AC86" stroke-width=".9" stroke-dasharray="2.2 1.6"/>`;

export function motionFrame(f,k) {
  const print=endPose(motion02,k);
  if(f<=5) return print;
  const F=folder03(f), state=poses03(k,f,F), cam=camera03(f,F), a=cam.r*D;
  const x=cam.S*Math.cos(a), y=cam.S*Math.sin(a);
  const camera=[x,y,-y,x,640-x*cam.Q[0]+y*cam.Q[1],360-y*cam.Q[0]-x*cam.Q[1]];
  const data=queueFrame(state,camera), mc=print.camera;
  const onPhoto=p=>{
    const sx=mc[0]*p[0]+mc[4],sy=mc[3]*p[1]+mc[5];
    return folderLocal(F,2+.82*(-28+.04375*sx),2+.82*(-16.06+.04375*sy));
  };
  const j=k.joints("pawel",print.actors.pawel);
  data.details={"photo.ola.gripL":onPhoto(print.details["ola.gripL"]),"photo.pawel.gripL":onPhoto(j.gripL)};
  // The queue behind the print is outside the frame at the start of the pullback.
  const inFrame=({target:[u,v]})=>{
    const sx=x*u-y*v+camera[4],sy=y*u+x*v+camera[5];
    return sx>=0 && sx<=1280 && sy>=0 && sy<=720;
  };
  data.contacts=data.contacts.filter(inFrame);
  data.supports=data.supports.filter(inFrame);
  return data;
}
export function world03(k,f,state) {
  const {F,marta,pawel,pr}=state;
  return queueWorld(k,{marta,pawel,pram:{...pr,breath:.3+.3*Math.sin(f/18)},folder:F,photo:"%%PHOTO%%",photoOver:POCKET(f)+glint(f),behindFolder:papers(k,F),extrasF:f});
}
// The world is thinned to keep its line weight under the zoom; the print keeps its own (photographed) lines.
export function withPhoto(svg, k) { return svg.replace("%%PHOTO%%", photo02(k)); }

export function scene(f, k) {
  if (f <= 5) return scene02(59, k);
  const state=motionFrame(f,k), F=state.F, svg=world03(k,f,state);
  const cam = camera03(f, F);
  return `<rect width="1280" height="720" fill="#F5FAF7"/><g transform="${cam.transform}">${withPhoto(thin(svg, 1 / Math.max(1, Math.pow(cam.S, .92))), k)}</g>`;
}
