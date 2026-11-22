// Szpital. The same joint poses and hand model enter the macro in 02.
import {angleKeys, ease, reach} from "../../ruch/pose.mjs";
export const CAM = { c: 1.85, tx: -236, ty: -250 };           // screen = tx + c·world
export const CONTACT = [578, 401];                              // screen point between fingertip and palm (SPEC)
export const W_CONTACT = [(CONTACT[0] - CAM.tx) / CAM.c, (CONTACT[1] - CAM.ty) / CAM.c]; // ≈ (440, 351.9) world
export const FINGER_DEG = 155;                                  // direction of Paweł's index at the stop (toward its tip), screen deg
export const GK = .2;                                          // grasp-frame unit → world px (baby palm Ø ≈ 32 px on screen in 01)
export const ARM_BEND = -47;                                     // forearm turned about the wrist so it rises out of the blanket

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
export const ss = (a, b, f) => { return ease((f-a)/(b-a)); };
const D = Math.PI / 180;
const f1 = v => Math.round(v * 10) / 10;

// Multiply every stroke-width in an SVG fragment (keeps the line weight constant under camera zoom).
export function thin(svg, k) {
  return svg.replace(/stroke-width="([\d.]+)"/g, (m, v) => `stroke-width="${Math.round(parseFloat(v) * k * 1000) / 1000}"`);
}

// grasp frame: adult finger axis points from (430,-10) toward its tip at T1 = (192,146), i.e. 148.7°.
const G_AXIS = Math.atan2(156, -238) / D;           // 146.8° (finger polygon centre line)
const G_T1 = [192, 146];                             // fingertip resting on the palm in the full grip
export const G_EDGE = [209.5, 135.4];                 // where that axis crosses the palm rim (first touch)
// Map grasp-frame point → world, so that G_EDGE lands on `edge` and the grasp axis follows FINGER_DEG.
export function graspToWorld(q, edge) {
  const a = (FINGER_DEG - G_AXIS) * D, c = Math.cos(a), s = Math.sin(a);
  const dx = q[0] - G_EDGE[0], dy = q[1] - G_EDGE[1];
  return [edge[0] + GK * (dx * c - dy * s), edge[1] + GK * (dx * s + dy * c)];
}
export function graspTransform(edge) {
  const a = FINGER_DEG - G_AXIS;
  return `translate(${f1(edge[0] * 1000) / 1000} ${f1(edge[1] * 1000) / 1000}) rotate(${f1(a)}) scale(${GK}) translate(${-G_EDGE[0]} ${-G_EDGE[1]})`;
}
// The rim point (world) for 01: 3 screen px beyond the gap point along the finger.
export const W_EDGE = (() => {
  const u = [Math.cos(FINGER_DEG * D), Math.sin(FINGER_DEG * D)], h = 3 / CAM.c; // contact = middle of the 6 px centre-line gap
  return [W_CONTACT[0] + u[0] * h, W_CONTACT[1] + u[1] * h];
})();
// ── World (ward) ───────────────────────────────────────────────────────────────────────────────────────────
export const OLA = { x: 376, y: 402, s: 1.45, angle: -10, facing: 1 };
export const MARTA = { x: 318, y: 474, s: 1.05, legs: false, outfit: "patient", lean: -6, head: .55, nod: .55, gaze: .55, gazeDown: .9, smile: .4,
  left: [-58, -30, 30, -30], right: [92, -40, 104, -44], leftGrip: "open", rightGrip: "grab", wristR: 10 };
export const PAWEL = { x: 700, y: 420, s: 1.05, seat: true, head: -.55, nod: .45, gaze: -.6, gazeDown: .7, smile: .35, bow: .45, lean: -8,
  left: [-60, -20, -150, -100], right: [62, -50, 40, 10], leftGrip: "point", rightGrip: "grab" };

// Paweł's fingertip gap (screen px) along the finger axis, per frame (SPEC 01: ~100 → 10 at 48 → 3 at 55).
export function gap01(f) {
  // geometric gap between the stroke centre lines; the visible clearance is ≈ 3 px less (two half strokes)
  return lerp(103, 85, ss(14, 28, f)) - (85 - 13) * ss(29, 48, f) - 7 * ss(48, 55, f);
}
export function pawelPose(k, f) {
  const lean = ss(14,28,f), extension = ss(29,48,f);
  const left = angleKeys(f,[[0,[97,110,-12]],[13,[97,110,-12]],[28,[105,107,-26]],
    [48,[142,48,-35]],[55,[146,40,-31]]]);
  const pose = {...PAWEL,r2:true,poles:{left:1,right:1},angles:{left,right:[88,11,-1]},
    bow:.36+.07*lean+.04*extension,lean:-6-2*lean-extension,twist:-.12*lean-.08*extension,
    gaze:lerp(-.2,-.75,ss(2,11,f)),gazeDown:lerp(.45,.85,ss(2,11,f)),head:lerp(-.45,-.6,ss(4,14,f)),nod:.45+.12*lean};
  const target = W_EDGE.map((x,i)=>x - [Math.cos(FINGER_DEG*D),Math.sin(FINGER_DEG*D)][i]*6/CAM.c);
  return reach("pawel",{...pose,handAngle:{left:FINGER_DEG}},"left",target,ss(48,55,f));
}

export function breath01(f) { return Math.sin(Math.PI * ss(14, 48, f)) ** 1.2 * ss(14, 28, f + 6); } // in 14–28, out 29–48

// Draw the ward world (no camera). opts.olaHand=false omits Ola's hand (02 draws it at macro scale).
const wardCamera=[CAM.c,0,0,CAM.c,CAM.tx,CAM.ty];
export function motionFrame(f,k) {
  const br=breath01(f), lift=-2.2*br;
  const mGaze=ss(30,40,f), mChin=ss(40,50,f);
  const marta={...MARTA,r2:true,poles:{left:-1,right:-1},angles:{left:[51,-12-2*br,0],right:[82,-51,10]},
    gaze:lerp(.45,.95,mGaze),gazeDown:lerp(.95,.35,mGaze),head:lerp(.55,.48,mChin),nod:lerp(.55,.35,mChin)};
  const olaEdge=[W_EDGE[0],W_EDGE[1]+lift];
  return {br,lift,actors:{marta,pawel:pawelPose(k,f)},camera:wardCamera,segment:"ward",
    visible:{pawel:["shoulderL","elbowL","wristL","gripL","shoulderR","elbowR","wristR","gripR"]},
    details:{"ola.gripL":olaEdge},props:{palm:olaEdge},contacts:[],supports:[]};
}
export function world01(k, f, opts = {}) {
  const {br,lift,actors:{marta:m,pawel:pp}}=motionFrame(f,k);
  let s = k.ward({ bed: false });
  s += k.person("pawel", { ...pp, parts: "body" }) + k.person("pawel", { ...pp, parts: "right" });
  s += k.wardBed();
  s += k.person("marta", { ...m, parts: "body" }) + k.wardFront() + k.person("marta", { ...m, parts: "right" });
  // small pillow under Marta's supporting elbow; its top edge dips under the elbow (local extension of the ward set)
  const dip = 3 + br * 1.5;
  s += `<path d="M232 412C250 402 276 ${f1(402 + dip)} 300 ${f1(404 + dip)}C318 406 330 416 328 432C324 446 300 452 268 452C246 452 232 446 228 434C226 424 228 416 232 412Z" fill="#FFFFFF" stroke="#283754" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<g transform="translate(0 ${f1(lift)})">`;
  s += k.ola({ ...OLA, breath: br, blanket: false });
  if (opts.olaHand !== false) s += `<g transform="${graspTransform(W_EDGE)}">${k.babyHand("back", [0, 0, 0, 0], { line: 11.5 })}</g>`;
  s += k.ola({ ...OLA, breath: br });
  s += `</g>`;
  s += k.person("marta", { ...m, parts: "left" });
  if (opts.olaHand !== false) {
    s += k.person("pawel", { ...pp, parts: "left" });
    s += `<g transform="translate(0 ${f1(lift)})"><g transform="${graspTransform(W_EDGE)}">${k.babyHand("front", [0, 0, 0, 0], { line: 11.5 })}</g></g>`;
  }
  return s;
}

export function scene(f, k) {
  const w = world01(k, f);
  return `<g transform="translate(${CAM.tx} ${CAM.ty}) scale(${CAM.c})">${thin(w, .62)}</g>`;
}
