// Scene 01 · "Narodziny Oli" (0–2 s, global frames 0–59). Author: block b01, models r1.
// Hospital medium close-up. Paweł's right index (screen-left arm, grip "point") approaches Ola's open left hand
// and stops 3 px (screen) before her palm; the touch itself belongs to 02 (local 5 = film frame 65).
// Everything is drawn in the r1 "ward" world (same layout as the model sheet's hospital panel) and framed by a
// fixed camera CAM. Ola's raised hand is a LOCAL extension (r1 has her hand only inside grasp()): its baby
// forearm, palm, thumb and fingers re-use grasp()'s geometry, re-aimed onto Paweł's real finger axis.
// Exports the world so 02 can punch in on the same hands (01/59 ≡ 02/0 after scaling about CONTACT).

export const CAM = { c: 1.85, tx: -236, ty: -250 };           // screen = tx + c·world
export const CONTACT = [578, 401];                              // screen point between fingertip and palm (SPEC)
export const W_CONTACT = [(CONTACT[0] - CAM.tx) / CAM.c, (CONTACT[1] - CAM.ty) / CAM.c]; // ≈ (440, 351.9) world
export const FINGER_DEG = 155;                                  // direction of Paweł's index at the stop (toward its tip), screen deg
export const GK = .2;                                          // grasp-frame unit → world px (baby palm Ø ≈ 32 px on screen in 01)
export const ARM_BEND = -47;                                     // forearm turned about the wrist so it rises out of the blanket

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
export const ss = (a, b, f) => { const t = clamp((f - a) / (b - a)); return t * t * (3 - 2 * t); };
const D = Math.PI / 180;
const f1 = v => Math.round(v * 10) / 10;

// Multiply every stroke-width in an SVG fragment (keeps the line weight constant under camera zoom).
export function thin(svg, k) {
  return svg.replace(/stroke-width="([\d.]+)"/g, (m, v) => `stroke-width="${Math.round(parseFloat(v) * k * 1000) / 1000}"`);
}

// Put the grip contact of one arm exactly on a target (world px), keeping the hand at a given screen angle.
export function aim(k, role, pose, side, target, angleDeg) {
  const key = side === "left" ? "left" : "right", gk = side === "left" ? "gripL" : "gripR", wk = side === "left" ? "wristL" : "wristR";
  const ek = side === "left" ? "elbowL" : "elbowR", wrk = side === "left" ? "wristL" : "wristR";
  let p = { ...pose }, w = [(target[0] - p.x) / p.s, (target[1] - p.y) / p.s];
  for (let i = 0; i < 10; i++) {
    p = { ...p, [key]: [pose[key][0], pose[key][1], w[0], w[1]] };
    const j = k.joints(role, p);
    if (angleDeg != null) {
      const fa = Math.atan2(j[wrk][1] - j[ek][1], j[wrk][0] - j[ek][0]) / D;
      let bend = angleDeg - fa; bend = ((bend + 540) % 360) - 180;
      p[wk] = clamp(bend, -55, 55);
    }
    const g = k.joints(role, p)[gk];
    w = [w[0] + (target[0] - g[0]) / p.s, w[1] + (target[1] - g[1]) / p.s];
  }
  return { ...p, [key]: [pose[key][0], pose[key][1], w[0], w[1]] };
}

// ── Ola's hand (local extension on grasp() geometry) ──────────────────────────────────────────────────────
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
// fingers: per-finger closure 0..1 (index, middle, ring, little = grasp i 0..3). Layer "back" = forearm+cuff+palm,
// "front" = fingers + thumb (drawn over Paweł's finger).
export function babyHand(layer, close = [0, 0, 0, 0], opts = {}) {
  const INK = "#283754", SKIN = "#FFEBDB", lw = opts.line ?? 3.4;
  const P = (d, fill, stroke = INK, w = lw) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
  let g = "";
  if (layer === "back") {
    // forearm out of the onesie sleeve (sleeve cuff = the "szew rękawa" checked on the 01/02 cut)
    let arm = P("M-60 280C-20 250 60 196 120 168L158 196C110 228 60 256 -30 312Z", SKIN);
    arm += P("M118 172q12 10 12 22", "none", "#C9A893", lw * .7);
    // onesie sleeve: a wider tube that starts 110 units down the forearm; its open end is the cuff seam
    arm += P("M52 206C20 222 -40 246 -96 262L-70 330C-20 312 40 290 74 262C82 246 70 214 52 206Z", "#FBFAF3");
    arm += P("M58 210Q76 236 70 258", "none", "#C9D6CD", lw * .8);
    g += `<g transform="rotate(${opts.armBend ?? ARM_BEND} 140 186)">${arm}</g>`;
    const press = opts.press ?? 0; // palm pad flattening under the fingertip
    g += P(`M128 168C130 136 152 116 180 ${f1(118 + press * 3)}C206 ${f1(120 + press * 4)} 220 142 214 166C208 192 182 206 156 202C140 200 128 188 128 168Z`, SKIN);
    if (press > .05) g += P(`M188 ${f1(132 + press * 3)}q10 4 14 ${f1(10 + press * 2)}`, "none", "#C9A893", lw * .6);
  } else {
    // chubby capsule fingers: open = small fan away from the incoming finger; shut = curled over it (grasp(1) tips)
    const C = [171, 160];
    for (const i of [3, 2, 1, 0]) {
      const t = clamp(close[i]), e = t * t * (3 - 2 * t);
      const bx = 150 + i * 17, by = 128 - i * 4, B = [bx + 1, by + 7];
      const dir = Math.atan2(B[1] - C[1], B[0] - C[0]) - (10 + i * 4) * D;
      const open = [B[0] + Math.cos(dir) * 30, B[1] + Math.sin(dir) * 30], shut = [bx + 22, by + 20];
      // the tip travels on an arc (over the top of the adult finger), not through it
      const T = [lerp(open[0], shut[0], e) + Math.sin(e * Math.PI) * 10, lerp(open[1], shut[1], e) - Math.sin(e * Math.PI) * 16];
      const M = [lerp(B[0], T[0], .5) + (T[1] - B[1]) * -.12 * (1 - e) - 6 * e, lerp(B[1], T[1], .5) - 8 * Math.sin(e * Math.PI) - 4 * e];
      const r0 = 8.4, r1 = 7.2;
      const n0 = Math.atan2(M[1] - B[1], M[0] - B[0]) + Math.PI / 2, n1 = Math.atan2(T[1] - M[1], T[0] - M[0]) + Math.PI / 2;
      const nm = (n0 + n1) / 2;
      const pt = (q, a, r) => `${f1(q[0] + Math.cos(a) * r)} ${f1(q[1] + Math.sin(a) * r)}`;
      g += P(`M${pt(B, n0, r0)}Q${pt(M, nm, (r0 + r1) / 2 + 1)} ${pt(T, n1, r1)}A${r1} ${r1} 0 0 0 ${pt(T, n1 + Math.PI, r1)}Q${pt(M, nm + Math.PI, (r0 + r1) / 2 + 1)} ${pt(B, n0 + Math.PI, r0)}Z`, SKIN, INK, lw * .85);
    }
    const th = clamp(opts.thumb ?? 0);
    g += P(`M138 186C${f1(lerp(132, 146, th))} ${f1(lerp(206, 208, th))} ${f1(lerp(160, 172, th))} ${f1(lerp(214, 212, th))} ${f1(lerp(178, 190, th))} ${f1(lerp(206, 200, th))}C${f1(lerp(184, 194, th))} ${f1(lerp(200, 194, th))} ${f1(lerp(176, 184, th))} 194 166 196`, SKIN, INK, lw * .8);
  }
  return g;
}

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
export function pawelPose(k, f, gapPx, edge = W_EDGE) {
  const u = [Math.cos(FINGER_DEG * D), Math.sin(FINGER_DEG * D)];
  const g = gapPx / CAM.c;
  // fingertip slides in from the right along a shallow arc that ends on the finger axis
  const arc = 22 * Math.pow(clamp(gapPx / 100), 1.6);
  const tip = [edge[0] - u[0] * g + arc * .9, edge[1] - u[1] * g - arc * .25];
  const lean = ss(14, 28, f), reach = ss(29, 48, f);
  const pose = { ...PAWEL, bow: .36 + .07 * lean + .04 * reach, lean: -6 - 2 * lean - 1 * reach, twist: -.12 * lean - .08 * reach,
    gaze: lerp(-.2, -.75, ss(2, 11, f)), gazeDown: lerp(.45, .85, ss(2, 11, f)), head: lerp(-.45, -.6, ss(4, 14, f)), nod: .45 + .12 * lean };
  return aim(k, "pawel", pose, "left", tip, lerp(195, FINGER_DEG, ss(18, 50, f)));
}

export function breath01(f) { return Math.sin(Math.PI * ss(14, 48, f)) ** 1.2 * ss(14, 28, f + 6); } // in 14–28, out 29–48

// Draw the ward world (no camera). opts.olaHand=false omits Ola's hand (02 draws it at macro scale).
export function world01(k, f, opts = {}) {
  const br = opts.breath ?? breath01(f), lift = -2.2 * br;
  const pp = opts.pawel ?? pawelPose(k, f, gap01(f));
  const mGaze = ss(30, 40, f), mChin = ss(40, 50, f);
  const m = { ...MARTA, gaze: lerp(.45, .95, mGaze), gazeDown: lerp(.95, .35, mGaze), head: lerp(.55, .48, mChin), nod: lerp(.55, .35, mChin),
    lean: MARTA.lean - br * 1.2, right: [MARTA.right[0], MARTA.right[1], MARTA.right[2], MARTA.right[3] - br * 2] };
  let s = k.ward({ bed: false });
  s += k.person("pawel", { ...pp, parts: "body" }) + k.person("pawel", { ...pp, parts: "right" });
  s += k.wardBed();
  s += k.person("marta", { ...m, parts: "body" }) + k.wardFront() + k.person("marta", { ...m, parts: "right" });
  // small pillow under Marta's supporting elbow; its top edge dips under the elbow (local extension of the ward set)
  const dip = 3 + br * 1.5;
  s += `<path d="M232 412C250 402 276 ${f1(402 + dip)} 300 ${f1(404 + dip)}C318 406 330 416 328 432C324 446 300 452 268 452C246 452 232 446 228 434C226 424 228 416 232 412Z" fill="#FFFFFF" stroke="#283754" stroke-width="2.4" stroke-linejoin="round"/>`;
  s += `<g transform="translate(0 ${f1(lift)})">`;
  s += k.ola({ ...OLA, breath: br, blanket: false });
  if (opts.olaHand !== false) s += `<g transform="${graspTransform(W_EDGE)}">${babyHand("back", [0, 0, 0, 0], { line: 11.5 })}</g>`;
  s += k.ola({ ...OLA, breath: br });
  s += `</g>`;
  s += k.person("marta", { ...m, parts: "left" });
  if (opts.olaHand !== false) {
    s += k.person("pawel", { ...pp, parts: "left" });
    s += `<g transform="translate(0 ${f1(lift)})"><g transform="${graspTransform(W_EDGE)}">${babyHand("front", [0, 0, 0, 0], { line: 11.5 })}</g></g>`;
  }
  return s;
}

export function scene(f, k) {
  const w = world01(k, f);
  return `<g transform="translate(${CAM.tx} ${CAM.ty}) scale(${CAM.c})">${thin(w, .62)}</g>`;
}
