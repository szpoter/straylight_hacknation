// b13 shared helpers for shots 13–18 (author b13). Local extension built on r1 model functions only.
// · teczka(): the r1 folder with a cover that turns 0° (closed, outside up) … 180° (open, = k.folder(...,1)).
//   Below 90° the cover lies over the back panel (squashed k.folder closed drawing), above 90° it is the
//   model's own open drawing with t = −cos θ. Papers passed in `inner` sit on the back panel.
// · tween(): pose-to-pose interpolation over global frames (smoothstep per segment, strings step at the key).
// · reach(): moves a wrist so the hand's grip point lands on a screen target (same idea as solveWrist in
//   obsada/plansza.mjs); the model keeps arm lengths constant and reports reach "short" if it cannot.

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const span = (g, a, b) => clamp((g - a) / (b - a), 0, 1);
export const sm = t => t * t * (3 - 2 * t);
export const smr = (g, a, b) => sm(span(g, a, b));
export const easeIn = t => t * t;
export const easeOut = t => 1 - (1 - t) * (1 - t);
const D2R = Math.PI / 180;
export const rot = (x, y, a) => { const r = a * D2R, c = Math.cos(r), s = Math.sin(r); return [x * c - y * s, x * s + y * c]; };
export const r1 = n => Math.round(n * 10) / 10;

function mixVal(a, b, t) {
  if (typeof a === "number" && typeof b === "number") return lerp(a, b, t);
  if (Array.isArray(a) && Array.isArray(b) && a.length === b.length) return a.map((v, i) => mixVal(v, b[i], t));
  return t >= 1 ? b : a;
}
// keys: [[g, {..pose}], ...] sorted. Missing fields inherit from the previous key.
export function tween(keys, g, ease = sm) {
  const full = []; let acc = {};
  for (const [kg, p] of keys) { acc = { ...acc, ...p }; full.push([kg, acc]); }
  if (g <= full[0][0]) return { ...full[0][1] };
  for (let i = 0; i < full.length - 1; i++) {
    const [g0, a] = full[i], [g1, b] = full[i + 1];
    if (g < g1) {
      const t = ease((g - g0) / (g1 - g0)), out = {};
      for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) out[key] = key in a && key in b ? mixVal(a[key], b[key], t) : (b[key] ?? a[key]);
      return out;
    }
  }
  return { ...full[full.length - 1][1] };
}
// scalar channel: [[g, v], ...]
export function chan(keys, g, ease = sm) {
  if (g <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) if (g < keys[i + 1][0]) return lerp(keys[i][1], keys[i + 1][1], ease((g - keys[i][0]) / (keys[i + 1][0] - keys[i][0])));
  return keys[keys.length - 1][1];
}

// Place the grip point of `side` ("left"|"right") on target [x,y] (screen px). Returns a new pose.
// Analytic: forearm + hand (to the grip point) is treated as one segment, the elbow side follows the pose's
// elbow hint, then two small corrections absorb the grip point's sideways offset and any wrist bend.
const HAND_UNITS = { marta: 26, pawel: 29, clerk: 26 };
const ARM = { marta: [70, 64], pawel: [76, 70], clerk: [68, 62] };
export function reach(k, role, pose, side, target) {
  const s = pose.s ?? 1, arm = pose[side], gname = side === "left" ? (pose.leftGrip ?? pose.grip ?? "open") : (pose.rightGrip ?? pose.grip ?? "open");
  const gp = (k.GRIP_POINT[gname] ?? k.GRIP_POINT.open)[0] * HAND_UNITS[role] / 24;
  const [L1, L2] = ARM[role], L2e = L2 + gp;
  const j0 = k.joints(role, pose), S0 = side === "left" ? j0.shoulderL : j0.shoulderR;
  const S = [(S0[0] - pose.x) / s, (S0[1] - pose.y) / s], hint = [arm[0], arm[1]];
  const solve = T => {
    let dx = T[0] - S[0], dy = T[1] - S[1], d = Math.hypot(dx, dy) || 1;
    const dd = clamp(d, Math.abs(L1 - L2e) + 1, L1 + L2e - .5), ux = dx / d, uy = dy / d;
    const a = (L1 * L1 - L2e * L2e + dd * dd) / (2 * dd), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
    const e1 = [S[0] + ux * a - uy * h, S[1] + uy * a + ux * h], e2 = [S[0] + ux * a + uy * h, S[1] + uy * a - ux * h];
    const E = Math.hypot(e1[0] - hint[0], e1[1] - hint[1]) <= Math.hypot(e2[0] - hint[0], e2[1] - hint[1]) ? e1 : e2;
    const Tn = [S[0] + ux * dd, S[1] + uy * dd], fx = Tn[0] - E[0], fy = Tn[1] - E[1], fl = Math.hypot(fx, fy) || 1;
    return [E[0] + fx / fl * L2, E[1] + fy / fl * L2];
  };
  let T = [(target[0] - pose.x) / s, (target[1] - pose.y) / s], out = pose;
  for (let i = 0; i < 3; i++) {
    const w = solve(T);
    out = { ...pose, [side]: [arm[0], arm[1], w[0], w[1]] };
    const j = k.joints(role, out), g = side === "left" ? j.gripL : j.gripR;
    T = [T[0] + (target[0] - g[0]) / s, T[1] + (target[1] - g[1]) / s];
  }
  return out;
}
// Feet/knees given in SCREEN px → local units for the current hip position.
export function toLocal(pose, pts) { const s = pose.s ?? 1; return pts.map(([X, Y]) => [r1((X - pose.x) / s), r1((Y - pose.y) / s)]); }

// ── folder with a turning cover ─────────────────────────────────────────────────────────────────────────────
const INK = "#283754", SAND = "#E9D5A6", SAND_DARK = "#CDB57F";
// spine point (sx,sy) = middle of the hinge; W = one panel's drawn width (r1 sofa: 150); ang deg; theta deg.
export function teczka(k, sx, sy, W, ang, theta, inner = "") {
  const th = clamp(theta, 0, 180), c = Math.cos(th * D2R), sc = W / 100, lw = 2.7;
  if (th >= 90) {
    const t = -c;
    if (t >= .03) {
      const shift = (100 - 100 * t) / 2, d = rot(sc * shift, 0, ang);
      return k.folder(sx + d[0], sy + d[1], W * (1 + t), ang, t) + inner;
    }
  }
  // back panel (same strokes as the model's open drawing), papers, then the cover
  let g = `<g transform="translate(${r1(sx)} ${r1(sy)}) rotate(${r1(ang)}) scale(${r1(sc * 1000) / 1000})">`
    + `<path d="M0 -60H100V60H0Z" fill="${SAND}" stroke="${INK}" stroke-width="${lw}" stroke-linejoin="round"/>`
    + `<path d="M6 -20H94V56H6Z" fill="#F2E3BD" stroke="${SAND_DARK}" stroke-width="${lw * .6}" stroke-linejoin="round"/></g>`;
  g += inner;
  if (Math.abs(c) < .03) {           // cover edge-on at the hinge
    const a = rot(0, -60 * sc, ang), b = rot(0, 60 * sc, ang);
    g += `<path d="M${r1(sx + a[0])} ${r1(sy + a[1] - 4)}L${r1(sx + b[0])} ${r1(sy + b[1])}" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
    g += `<path d="M${r1(sx + a[0])} ${r1(sy + a[1] - 4)}L${r1(sx + b[0])} ${r1(sy + b[1])}" stroke="${SAND}" stroke-width="2" stroke-linecap="round"/>`;
  } else if (c > 0) {                // cover over the panel, outside face (photo) squashed by cos θ
    g += `<g transform="translate(${r1(sx)} ${r1(sy)}) rotate(${r1(ang)}) scale(${r1(c * 1000) / 1000} 1)">${k.folder(W / 2, 0, W, 0, 0)}</g>`;
  }
  return g;
}
// point on the folder: u along the panel from the spine (0..1 of W, negative = cover side when open), v vertical px
export function teczkaPt(sx, sy, W, ang, u, v) { const d = rot(u * W, v, ang); return [sx + d[0], sy + d[1]]; }
// point on the cover at fraction u from the hinge for cover angle theta
export function coverPt(sx, sy, W, ang, theta, u, v) { return teczkaPt(sx, sy, W, ang, u * Math.cos(clamp(theta, 0, 180) * D2R), v); }

// Mouth from the dialog envelope string (one digit 0–9 per frame starting at g0).
export function mouthAt(env, g0, g) { const i = g - g0; if (i < 0 || i >= env.length) return 0; return Number(env[i]) / 9; }
