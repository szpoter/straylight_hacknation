// Przewodnik Rodzica v3 · shared cast models, revision r1 (owner: art director / model sheet author).
// Pure functions returning SVG fragments (strings) in the 1280×720 frame space, no outer <svg>.
// Works in the browser and in Node (no DOM, no dependencies).
//
// ── UNITS ──────────────────────────────────────────────────────────────────────────────────────────────
// Every figure is built in LOCAL units with the origin at the centre of the hips (pelvis), y pointing down.
// Screen = (pose.x + s·lx, pose.y + s·ly). In the living room (SOFA) s = 1.16, so 1 local unit = 1.16 px.
// One "head" (crown→chin, without hair) is 100 local units for Marta and the clerk, 104 for Paweł.
//
// ── JOINTS (local units, rest pose, before lean/bow/twist) ───────────────────────────────────────────────
//                     marta        pawel        clerk
//   neck base (torso)  (0,-148)     (0,-158)     (0,-146)
//   neck axis top      (0,-170)     (0,-182)     (0,-168)   head pivot; the head yaws about this vertical axis
//   chin               ≈ -158       ≈ -169       ≈ -156
//   crown (skull)      ≈ -258       ≈ -273       ≈ -256     (+ hair volume, Paweł's fringe ≈ -286, clerk's bun ≈ -282)
//   shoulder           (±46,-140)   (±52,-150)   (±46,-138)
//   upper arm  L1      72           78           70         shoulder→elbow, constant
//   forearm    L2      66           72           64         elbow→wrist, constant
//   hand (wrist→tip)   24           27           24
//   hip joint          (±18,4)      (±20,6)      (±18,4)
//   standing knee y    96           108          94
//   standing ankle y   180          204          178        sole = ankle + 8
//   seated knee        (-15,30)/(17,30)  (-44,30)/(50,27)   knees together for Marta, apart for Paweł
//   seated sole y      172          172/180      172        floor in SOFA = 490 + 172·1.16 ≈ 690 px
//
// ── ARMS & GRIP ───────────────────────────────────────────────────────────────────────────────────────────
// pose.left / pose.right = [elbowX, elbowY, wristX, wristY] relative to the hips, local units, NOT rotated by
// lean (hands stay planted while the chest turns). left/right = screen sides. The wrist target is honoured
// with constant L1/L2 (two-bone IK); the given elbow only picks which of the two IK solutions is used
// (the one nearer the hint). If the wrist is out of reach the shoulder girdle first slides ≤10 units toward
// it, then the arm straightens and the wrist stops short (never stretched). rig() reports `reach` per side.
// Sleeves taper shoulder→cuff; the hand is drawn first and slides under the cuff.
// Grip shapes: open | pinch | hold | point | grab. Each has a CONTACT POINT in hand space (wrist at 0,0,
// +x along the forearm):  open (22,2) · pinch (25,-3) thumb+index tips · hold (15,2) inside the fist ·
// point (31,-2) fingertip · grab (22,6) under curled fingers. obsada.joints(role,pose).gripL/gripR gives
// the contact point in screen px → place a prop's grip point exactly there at the frame of contact.
// pose.wristL / wristR (deg) bend the hand relative to the forearm; leftFlip/rightFlip mirror the thumb.
//
// ── HEAD ──────────────────────────────────────────────────────────────────────────────────────────────────
// ONE construction per role: a stack of horizontal slices (half-width a, front depth cf, back depth cb)
// from crown to chin. pose.head ∈ [-1,1] yaws it about the neck axis (−1 profile facing screen-left,
// 0 front, ±0.5 ≈ three-quarter, +1 profile facing screen-right). The silhouette, jaw, nose bump, both
// ears, eyes, hairline, bun and fringe are all projected from the same 3D points, so front/¾/profile
// share eye line, nose root, ear, jaw and hairline (see obsada.headGuides()). nod ∈ [-1,1] pitches
// (+ down), tilt = roll in degrees. gaze ∈ [-1,1] slides the pupils sideways, gazeDown ∈ [-1,1] down;
// lid 0..1 lowers the upper lid, blink 0..1 closes; brow −1 worried … +1 frowning; mouth 0..1 open;
// smile −1 … 1; viseme 'A'|'O'|'E'|'M'|'U' overrides mouth shape for dubbing.
//
// ── BODY ──────────────────────────────────────────────────────────────────────────────────────────────────
// seat (bool) · lean (deg, image-plane, + to screen-right, bends gradually above the waist) ·
// bow 0..1 forward bend from the hips toward camera (shoulders drop, head goes forward/down) ·
// twist −1..1 turns the shoulder girdle (placket moves, shoulders narrow) ·
// knees [[x,y],[x,y]] · feet [[x,y],[x,y]] (ankle points, screen-left leg first) override the defaults ·
// shoes ['shoe'|'sock', …] · heelOut [0..1, 0..1] heel slipping out of the shoe (Paweł, scenes 17–18) ·
// outfit 'default' | 'patient' (hospital gown) · line (stroke multiplier, default 1 → 2.7 local) ·
// parts 'all' | 'body' | 'arms' | 'left' | 'right' — draw the body, then a prop on the lap, then the arms.
//
// Palette: ink #283754 · skin #FFEBDB · Marta sage #B2CAAD · Paweł navy #2D3950 · background #F5FAF7.
// Values not in DESIGN.md tokens are marked "do weryfikacji".

export const REWIZJA = "r1";

const INK = "#283754", SKIN = "#FFEBDB", SKIN_LINE = "#C9A893", NAVY = "#2D3950", SAGE = "#B2CAAD";
const SAGE_DARK = "#8FAE8A";          // do weryfikacji: jacket fold lines
const DRESS = "#FAF8F0";              // do weryfikacji: Marta's light dress
const TEE = "#FDFCF7", TROUSERS = "#EEECE3"; // do weryfikacji
const CLERK_HAIR = "#A7AEB2", CLERK_CARDI = "#C5CFD6", CLERK_TROUSERS = "#5E697F"; // do weryfikacji (grey hair / cardigan); trousers = on-surface-variant
const GOWN = "#E2ECEA";               // do weryfikacji: hospital gown
const SOCK = "#F4F2EA", SHOE = "#283754", BLUSH = "#FFD5C2";
const GREEN = "#1A8648";

const f1 = n => Math.round(n * 10) / 10;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const D2R = Math.PI / 180;
let uid = 0;
const nextId = p => `${p}${(++uid).toString(36)}`;

// ── path helpers ───────────────────────────────────────────────────────────────────────────────────────────
const pts = a => a.map(p => `${f1(p[0])} ${f1(p[1])}`);
const poly = a => "M" + pts(a).join("L") + "Z";
const line = a => "M" + pts(a).join("L");
// Catmull-Rom through points → cubic Béziers. closed: loop.
function smooth(P, closed = true, k = 1) {
  const n = P.length; if (n < 3) return closed ? poly(P) : line(P);
  const g = i => closed ? P[(i + n) % n] : P[clamp(i, 0, n - 1)];
  let d = `M${f1(P[0][0])} ${f1(P[0][1])}`;
  const last = closed ? n : n - 1;
  for (let i = 0; i < last; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6 * k, p1[1] + (p2[1] - p0[1]) / 6 * k];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6 * k, p2[1] - (p3[1] - p1[1]) / 6 * k];
    d += `C${f1(c1[0])} ${f1(c1[1])} ${f1(c2[0])} ${f1(c2[1])} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return closed ? d + "Z" : d;
}
const P = (d, fill = "none", stroke = INK, w = 2.7, extra = "") =>
  `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${f1(w * 100) / 100}" stroke-linejoin="round" stroke-linecap="round"${extra}/>`;
const E = (x, y, rx, ry, fill, stroke = "none", w = 0, rot = 0) =>
  `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(Math.max(.01, rx))}" ry="${f1(Math.max(.01, ry))}"${rot ? ` transform="rotate(${f1(rot)} ${f1(x)} ${f1(y)})"` : ""} fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
const G = (tr, body, extra = "") => `<g${tr ? ` transform="${tr}"` : ""}${extra}>${body}</g>`;
// Union of shapes: ink pass (double width), then fill pass → one clean outer contour, no inner seams.
function union(shapes, w) {
  return shapes.map(s => P(s.d, s.fill, INK, w * 2)).join("") + shapes.map(s => P(s.d, s.fill, "none", 0)).join("");
}
// Tapered tube with round ends, a → b, radii ra, rb.
function tube(a, b, ra, rb, capStart = true) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  if (!capStart) return `M${f1(a[0] + nx * ra)} ${f1(a[1] + ny * ra)}L${f1(b[0] + nx * rb)} ${f1(b[1] + ny * rb)}` +
    `A${f1(rb)} ${f1(rb)} 0 0 0 ${f1(b[0] - nx * rb)} ${f1(b[1] - ny * rb)}L${f1(a[0] - nx * ra)} ${f1(a[1] - ny * ra)}Z`;
  return `M${f1(a[0] + nx * ra)} ${f1(a[1] + ny * ra)}L${f1(b[0] + nx * rb)} ${f1(b[1] + ny * rb)}` +
    `A${f1(rb)} ${f1(rb)} 0 0 0 ${f1(b[0] - nx * rb)} ${f1(b[1] - ny * rb)}` +
    `L${f1(a[0] - nx * ra)} ${f1(a[1] - ny * ra)}A${f1(ra)} ${f1(ra)} 0 0 0 ${f1(a[0] + nx * ra)} ${f1(a[1] + ny * ra)}Z`;
}
const circ = (c, r) => `M${f1(c[0] - r)} ${f1(c[1])}a${f1(r)} ${f1(r)} 0 1 0 ${f1(2 * r)} 0a${f1(r)} ${f1(r)} 0 1 0 ${f1(-2 * r)} 0Z`;
// cubic interpolation through [u, ...values] keys
function keyInterp(keys, u) {
  if (u <= keys[0][0]) return keys[0].slice(1);
  const n = keys.length;
  if (u >= keys[n - 1][0]) return keys[n - 1].slice(1);
  let i = 0; while (keys[i + 1][0] < u) i++;
  const k0 = keys[Math.max(0, i - 1)], k1 = keys[i], k2 = keys[i + 1], k3 = keys[Math.min(n - 1, i + 2)];
  const t = (u - k1[0]) / (k2[0] - k1[0]), t2 = t * t, t3 = t2 * t;
  return k1.slice(1).map((_, j) => {
    const p0 = k0[j + 1], p1 = k1[j + 1], p2 = k2[j + 1], p3 = k3[j + 1];
    const m1 = (p2 - p0) / 2, m2 = (p3 - p1) / 2;
    return (2 * t3 - 3 * t2 + 1) * p1 + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2 + (t3 - t2) * m2;
  });
}
// periodic linear interpolation over angle keys [[deg, u], ...] sorted −180..180
function angInterp(keys, deg) {
  let d = ((deg + 180) % 360 + 360) % 360 - 180;
  for (let i = 0; i < keys.length - 1; i++) {
    const [a0, v0] = keys[i], [a1, v1] = keys[i + 1];
    if (d >= a0 && d <= a1) { const t = (d - a0) / (a1 - a0 || 1); const s = t * t * (3 - 2 * t); return lerp(v0, v1, s); }
  }
  return keys[0][1];
}

// ── HEAD MODELS ────────────────────────────────────────────────────────────────────────────────────────────
// keys: [u (0 crown → 1 chin), a half-width, cf front depth, cb back depth]. Same projection for all roles.
const HEADS = {
  marta: {
    H: 100, Zp: -12, wide: 1.14,
    keys: [[0, 0, 0, 0], [.02, 15, 14, 16], [.06, 25, 24, 29], [.12, 33, 31, 37], [.22, 41, 39, 45], [.38, 46, 43, 48], [.55, 46.5, 44, 45],
      [.68, 44, 44, 34], [.8, 38.5, 42, 21], [.9, 29, 37, 10], [.965, 18, 33, 4], [1, 7, 30, 1]],
    eye: { u: .6, x: .36, rx: 5, ry: 7.4 }, brow: { u: .47, w: 10, lift: 0 }, lash: true,
    nose: { u: .735, len: 5.5, root: .55 }, mouth: { u: .86, w: 7.5 }, ear: { u: .655, rx: 7, ry: 10.5 },
    cheek: { u: .73, x: .58, r: 6.5 },
    hair: {
      color: NAVY, th: [[0, 5], [.3, 4], [.55, 3], [.82, 2]], back: .78, thAz: [[-180, 0], [-90, 1], [-40, 2.5], [0, 1.5], [60, 0], [180, 0]],
      // hairline height u as a function of azimuth (0 = front, +90 = head's screen-right in front view)
      line: [[-180, .8], [-140, .77], [-114, .7], [-102, .56], [-86, .48], [-66, .36], [-46, .27], [-28, .25], [-8, .29],
        [12, .36], [32, .43], [52, .49], [70, .53], [86, .55], [102, .56], [114, .7], [140, .77], [180, .8]],
      stroke: false,
    },
    // low bun behind, slightly to the screen-left side so it reads in front view too
    bun: { X: -40, u: .6, Z: -44, r: 18.5, knot: true },
    strand: { side: 1, u0: .54, u1: .7, x: .97 },
    part: [[-26, .02], [-34, .12], [-40, .24]],     // small lock in front of the screen-right ear, by the cheek
  },
  pawel: {
    H: 104, Zp: -12, wide: 1.08,
    keys: [[0, 0, 0, 0], [.02, 14, 13, 16], [.06, 24, 23, 29], [.12, 32, 30, 37], [.22, 40, 38, 45], [.38, 44.5, 42, 47], [.55, 44, 44, 44],
      [.68, 40.5, 45, 32], [.8, 33, 44, 20], [.9, 23, 40, 9], [.965, 14, 36, 3], [1, 6, 33, 1]],
    eye: { u: .6, x: .36, rx: 4.2, ry: 6.4 }, brow: { u: .47, w: 10, lift: 0 }, lash: false, lid: .28,
    nose: { u: .745, len: 7, root: .55 }, mouth: { u: .865, w: 7 }, ear: { u: .655, rx: 7.5, ry: 11 },
    cheek: null,
    hair: {
      color: NAVY, th: [[0, 10], [.25, 8], [.5, 5], [.8, 3]], back: .78, thAz: [[-180, 0], [-110, 3], [-60, 7], [-20, 5], [30, 2], [90, 0], [180, 0]],
      // asymmetric fringe: low on the head's screen-left forehead, jagged tips
      line: [[-180, .8], [-140, .77], [-112, .7], [-98, .54], [-82, .5], [-66, .46], [-54, .4], [-44, .44], [-34, .36],
        [-24, .4], [-14, .32], [-4, .35], [6, .27], [18, .3], [34, .25], [56, .33], [78, .45], [98, .53], [112, .7], [140, .77], [180, .8]],
      stroke: false,
    },
    // protruding locks: [azimuth°, u of root, out (units beyond hair surface), dy (u shift of tip), width°]
    locks: [[-92, .3, 13, .1, 16, .16], [-80, .16, 15, .02, 18, .16], [-62, .05, 12, -.07, 26, .1], [86, .36, 7, .08, 10, .14], [-30, .3, 5, .15, 22, .02], [-6, .29, 4, .1, 16, .02]],
    cowlick: { az: 10, u: 0 },
  },
  clerk: {
    H: 100, Zp: -12, wide: 1.13,
    keys: [[0, 0, 0, 0], [.02, 15, 14, 16], [.06, 25, 24, 29], [.12, 33, 31, 37], [.22, 41, 38, 45], [.38, 45, 41, 47], [.55, 46.5, 42, 44],
      [.68, 46.5, 42, 33], [.8, 43, 41, 21], [.9, 34, 37, 10], [.965, 22, 33, 4], [1, 9, 30, 1]],
    eye: { u: .61, x: .36, rx: 3.9, ry: 5.4 }, brow: { u: .49, w: 9, lift: 2 }, lash: false, lid: .12,
    nose: { u: .745, len: 5, root: .56 }, mouth: { u: .87, w: 7 }, ear: { u: .66, rx: 7, ry: 10.5 },
    cheek: { u: .76, x: .6, r: 6 }, fold: true,
    hair: {
      color: CLERK_HAIR, th: [[0, 6], [.3, 5], [.55, 4], [.82, 2.5]], back: .8,
      line: [[-180, .78], [-140, .76], [-112, .7], [-100, .56], [-84, .5], [-60, .4], [-30, .32], [0, .3], [30, .32],
        [60, .4], [84, .5], [100, .56], [112, .7], [140, .76], [180, .78]],
      stroke: true, wave: true,
    },
    bun: { X: 0, u: -.12, Z: -14, r: 21, knot: false, high: true },
  },
};

// Projection of a head-space point (X right, u down 0..1, Z toward viewer) for a given view.
function makeView(m, p) {
  const th = clamp(p.head ?? 0, -1.2, 1.2) * 90 * D2R, pitch = clamp(p.nod ?? 0, -1, 1) * 18 * D2R, roll = (p.tilt ?? 0) * D2R;
  const ct = Math.cos(th), st = Math.sin(th), cp = Math.cos(pitch), sp = Math.sin(pitch), cr = Math.cos(roll), sr = Math.sin(roll);
  const pivotU = .9;
  return {
    th, // returns [x, y, z] in head-pixel space with the pivot (neck axis top) at 0,0
    pr(X, u, Z) {
      const zz = Z - m.Zp;
      const x = X * ct + zz * st, z = -X * st + zz * ct;
      let y = (u - pivotU) * m.H;
      const yy = y * cp + z * sp, zz2 = -y * sp + z * cp;
      return [x * cr - yy * sr, x * sr + yy * cr, zz2];
    },
    nz(nx, ny, nzz) { // rotated normal's z
      const z = -nx * st + nzz * ct;
      return -ny * sp + z * cp;
    },
  };
}
function slice(m, u) { const [a, cf, cb] = keyInterp(m.keys, u); return { a: a * (m.wide ?? 1), cf, cb }; }
function surfZ(m, X, u) { const { a, cf } = slice(m, u); const q = clamp(X / a, -1, 1); return cf * Math.sqrt(Math.max(0, 1 - q * q)); }
function surfNormal(m, X, u) {
  const { a, cf } = slice(m, u); const Z = surfZ(m, X, u);
  let nx = X / (a * a), nz = Z / (cf * cf); const L = Math.hypot(nx, nz) || 1; return [nx / L, 0, nz / L];
}
// point on the egg slice at azimuth φ (0 front), offset `off` outward
function eggPt(s, phi, off = 0) {
  const sn = Math.sin(phi), cs = Math.cos(phi);
  return [(s.a + off) * sn, ((cs >= 0 ? s.cf : s.cb) + off) * cs];
}
function silhouette(view, slices) {
  // slices: [{u, pts:[[X,Z],...]}] → closed outline (right side down, left side up)
  const R = [], L = [];
  for (const sl of slices) {
    let lo = null, hi = null;
    for (const pt of sl.pts) {
      const q = view.pr(pt[0], pt[2] ?? sl.u, pt[1]);
      if (!lo || q[0] < lo[0]) lo = q;
      if (!hi || q[0] > hi[0]) hi = q;
    }
    if (lo) { L.push(lo); R.push(hi); }
  }
  return R.concat(L.reverse());
}

function headParts(role, p) {
  const m = HEADS[role];
  const view = makeView(m, p);
  const lw = 2.7 * (p.line ?? 1);
  const N = 30, A = 36;
  const us = Array.from({ length: N + 1 }, (_, i) => Math.pow(i / N, 1));
  // skin slices + nose bump
  const skinSlices = us.map(u => {
    const s = slice(m, u), arr = [];
    for (let j = 0; j < A; j++) arr.push(eggPt(s, j / A * 2 * Math.PI));
    const nu = (u - m.nose.root) / (m.nose.u - m.nose.root);
    if (u > m.nose.root - .02 && u < m.nose.u + .05) {
      const bump = u <= m.nose.u ? Math.sin(clamp(nu, 0, 1) * Math.PI / 2) * m.nose.len : m.nose.len * (1 - (u - m.nose.u) / .05);
      arr.push([0, s.cf + Math.max(0, bump)]);
    }
    return { u, pts: arr };
  });
  const skinOutline = silhouette(view, skinSlices);
  const skinD = smooth(skinOutline);
  // hair volume
  const hm = m.hair;
  const thAt = u => keyInterp(hm.th.map(k => [k[0], k[1]]), u)[0];
  const hairSlices = [];
  for (const u of us.concat([.005])) {
    if (u > hm.back + .01) continue;
    const s = slice(m, u), arr = [];
    for (let j = 0; j < 72; j++) {
      const phi = j / 72 * 2 * Math.PI, deg = phi / D2R;
      const th = thAt(u) + (hm.thAz ? angInterp(hm.thAz, deg) * Math.max(0, 1 - u / .6) : 0);
      const ue = u - th / m.H * Math.max(0, 1 - u / .32) * 1.1; // hair volume also rises above the crown
      if (u <= angInterp(hm.line, deg) + .015) { const e = eggPt(s, phi, th); arr.push([e[0], e[1], ue]); }
    }
    if (arr.length) hairSlices.push({ u, pts: arr });
  }
  hairSlices.sort((a, b) => a.u - b.u);
  const hairOutline = silhouette(view, hairSlices);
  const hairD = smooth(hairOutline);
  // visible hairline → clip polygon "above the hairline"
  const hl = [];
  for (let j = 0; j < 144; j++) {
    const phi = -Math.PI + j / 144 * 2 * Math.PI, deg = phi / D2R, u = angInterp(hm.line, deg), s = slice(m, u);
    const [X, Z] = eggPt(s, phi, .5);
    const q = view.pr(X, u, Z);
    hl.push({ q, vis: q[2] >= -1.5 });
  }
  let start = hl.findIndex((h, i) => h.vis && !hl[(i - 1 + hl.length) % hl.length].vis);
  if (start < 0) start = 0;
  const run = [];
  for (let k = 0; k < hl.length; k++) { const h = hl[(start + k) % hl.length]; if (!h.vis) break; run.push(h.q); }
  let clipPoly = null;
  if (run.length > 2) {
    const a = run[0], b = run[run.length - 1], dir = b[0] >= a[0] ? 1 : -1, BIG = 400;
    clipPoly = run.map(q => [q[0], q[1]]).concat([[b[0] + dir * BIG, b[1]], [b[0] + dir * BIG, -BIG], [a[0] - dir * BIG, -BIG], [a[0] - dir * BIG, a[1]]]);
  }
  return { m, view, lw, skinD, skinOutline, hairD, clipPoly, hairline: run };
}

// Face features, projected; returns svg (to be clipped by the skin silhouette).
function faceFeatures(role, p, hp) {
  const { m, view, lw } = hp;
  let s = "";
  const gaze = clamp(p.gaze ?? 0, -1, 1), gd = clamp(p.gazeDown ?? 0, -1, 1), blink = clamp(p.blink ?? 0, 0, 1);
  const lid = clamp(p.lid ?? m.lid ?? 0, 0, 1), brow = clamp(p.brow ?? 0, -1, 1);
  const face = (X, u, dz = 0) => { const Z = surfZ(m, X, u) + dz; return view.pr(X, u, Z); };
  const vis = (X, u) => { const n = surfNormal(m, X, u); return view.nz(n[0], n[1], n[2]); };
  const turn = Math.sin(view.th);
  // cheeks (blush) under the eyes
  if (m.cheek) for (const sd of [-1, 1]) {
    const X = sd * m.cheek.x * slice(m, m.cheek.u).a, v = vis(X, m.cheek.u);
    if (v > .15) { const q = face(X, m.cheek.u); s += E(q[0], q[1], m.cheek.r * (.4 + .6 * v), m.cheek.r * .62, BLUSH); }
  }
  // eyes + brows
  for (const sd of [-1, 1]) {
    const ex = sd * m.eye.x * slice(m, m.eye.u).a, v = vis(ex, m.eye.u);
    if (v < .12) continue;
    const q = face(ex, m.eye.u, -1.5), fx = .35 + .65 * v;
    const rx = m.eye.rx * fx, ry = m.eye.ry;
    const cx = q[0] + gaze * 2.2 * fx, cy = q[1] + gd * 2.2;
    const shut = blink > .82;
    if (shut) {
      s += P(`M${f1(cx - rx * 1.5)} ${f1(cy)}Q${f1(cx)} ${f1(cy + ry * .55)} ${f1(cx + rx * 1.5)} ${f1(cy)}`, "none", INK, lw * .95);
    } else {
      const top = -ry + 2 * ry * Math.max(lid, blink) * .85; // upper lid line (local y)
      const pts2 = [];
      for (let k = 0; k <= 24; k++) {
        const t = Math.PI * 2 * k / 24, x = Math.cos(t) * rx, y = Math.sin(t) * ry * (1 - blink * .5);
        pts2.push([cx + x, cy + Math.max(y, top)]);
      }
      s += P(poly(pts2), INK, "none", 0);
      if (lid > .05 || blink > .05) {
        const yl = cy + top, w = Math.sqrt(Math.max(0, 1 - (top / ry) ** 2)) * rx;
        s += P(`M${f1(cx - w - 1.6)} ${f1(yl - .3)}L${f1(cx + w + 1.6)} ${f1(yl - .3)}`, "none", INK, lw * .85);
      }
      if (top < ry * .2) s += E(cx + rx * .32 - gaze * .6, cy - ry * .35 + Math.max(0, top + ry) * .5, Math.min(1.4, rx * .32), Math.min(1.6, ry * .26), "#FFFFFF");
      if (m.lash && v > .3) { // tiny outer lash flick for Marta
        const ox = cx + sd * rx * .95, oy = cy - ry * .45;
        s += P(`M${f1(ox)} ${f1(oy)}l${f1(sd * 2.6 * fx)} -2.2`, "none", INK, lw * .7);
      }
    }
    // brow: three projected points, inner end lifts when worried (brow<0)
    const bu = m.brow.u, a = slice(m, bu).a, xi = ex - sd * m.brow.w * .55, xo = ex + sd * m.brow.w * .65;
    const inner = face(xi, bu - (brow < 0 ? -brow * .04 : 0) + (brow > 0 ? brow * .025 : 0), 1);
    const mid = face(ex, bu - .012 - (m.brow.lift || 0) / 100, 1.5);
    const outer = face(clamp(xo, -a * .95, a * .95), bu + .01 + (brow < 0 ? -brow * .012 : 0), 1);
    const bv = vis(xo, bu);
    if (bv > -.1) s += P(`M${f1(inner[0])} ${f1(inner[1])}Q${f1(mid[0])} ${f1(mid[1] - 2.5)} ${f1(outer[0])} ${f1(outer[1])}`, "none", INK, lw * .95);
  }
  // nose: hook on the side away from the turn + ridge in ¾/profile
  {
    const nu = m.nose.u, base = slice(m, nu);
    const tip = view.pr(0, nu, base.cf + m.nose.len);
    const sd = turn >= 0 ? -1 : 1; // nostril wing drawn on the far side
    const wing = view.pr(sd * 4.5, nu + .035, surfZ(m, sd * 4.5, nu + .035) + 1.5);
    const under = view.pr(0, nu + .035, slice(m, nu + .035).cf + 2.5);
    const vt = Math.abs(turn);
    if (vt < .9) s += P(`M${f1(tip[0])} ${f1(tip[1])}Q${f1(under[0])} ${f1(under[1] + 1)} ${f1(wing[0])} ${f1(wing[1])}`, "none", INK, lw * .85);
    else s += P(`M${f1(under[0] - turn * 1.5)} ${f1(under[1] - 1)}q${f1(-turn * 3)} 1.5 ${f1(-turn * 4)} -1.5`, "none", INK, lw * .7);
    if (vt > .25 && vt < .9) {
      const root = view.pr(0, m.nose.u - .07, slice(m, m.nose.u - .07).cf + m.nose.len * .5);
      s += P(`M${f1(root[0])} ${f1(root[1])}Q${f1(lerp(root[0], tip[0], .5) + turn * 1.5)} ${f1(lerp(root[1], tip[1], .6))} ${f1(tip[0])} ${f1(tip[1])}`, "none", INK, lw * .7, ` opacity="${f1(clamp((vt - .25) * 4, 0, 1) * 10) / 10}"`);
    }
  }
  // mouth
  {
    const mu = m.mouth.u, w = m.mouth.w, sm = clamp(p.smile ?? (role === "marta" ? .35 : role === "clerk" ? .45 : .1), -1, 1);
    let open = clamp(p.mouth ?? 0, 0, 1), wide = 1, round = 0;
    const vz = { A: [.85, 1.05, 0], O: [.6, .62, 1], E: [.4, 1.2, 0], M: [0, .9, 0], U: [.35, .5, 1] }[p.viseme];
    if (vz) { open = vz[0]; wide = vz[1]; round = vz[2]; }
    const L = face(-w * wide, mu - sm * .012), R = face(w * wide, mu - sm * .012), C = face(0, mu + .012 + sm * .022, 1.5);
    if (vis(0, mu) > -.35) {
      if (open > .12) {
        const B = face(0, mu + .02 + open * .09, 1);
        if (round) s += E(C[0], (C[1] + B[1]) / 2 - 1, (R[0] - L[0]) / 2 * .7, (B[1] - C[1]) / 2 + 2.5, "#7A3B3F", INK, lw * .8);
        else s += P(`M${f1(L[0])} ${f1(L[1])}Q${f1(C[0])} ${f1(C[1] - 2)} ${f1(R[0])} ${f1(R[1])}Q${f1(B[0])} ${f1(B[1] + 3)} ${f1(L[0])} ${f1(L[1])}Z`, "#7A3B3F", INK, lw * .8)
          + P(`M${f1(lerp(L[0], C[0], .45))} ${f1(lerp(L[1], B[1], .7))}Q${f1(B[0])} ${f1(B[1] - 1.5)} ${f1(lerp(R[0], C[0], .45))} ${f1(lerp(R[1], B[1], .7))}`, "none", "#E8908A", lw * .7);
      } else s += P(`M${f1(L[0])} ${f1(L[1])}Q${f1(C[0])} ${f1(C[1])} ${f1(R[0])} ${f1(R[1])}`, "none", INK, lw * .9);
    }
  }
  // clerk: mature cheek fold (soft nasolabial arc) on the near side
  if (m.fold) for (const sd of [-1, 1]) {
    const X = sd * 19, v = vis(X, .8);
    if (v > .45) { const a = face(sd * 15, .77), b = face(sd * 20, .81), c = face(sd * 18, .845); s += P(`M${f1(a[0])} ${f1(a[1])}Q${f1(b[0])} ${f1(b[1])} ${f1(c[0])} ${f1(c[1])}`, "none", SKIN_LINE, lw * .6); }
  }
  return s;
}

function ear(m, view, sd, lw, front) {
  const u = m.ear.u, s = slice(m, u);
  const X = sd * (s.a - 1.5), Z = -6;
  const q = view.pr(X, u, Z);
  const nz = view.nz(sd, 0, -.2);
  const isFront = nz > .25;
  if (front !== isFront) return "";
  if (nz < -.75) return "";
  const rx = isFront ? m.ear.rx * (.75 + .3 * nz) : m.ear.rx, ry = m.ear.ry;
  const out = Math.sign(q[0] - view.pr(0, u, -6)[0]) || sd; // outward on screen
  if (isFront) {
    return E(q[0], q[1], rx, ry, SKIN, INK, lw) + P(`M${f1(q[0] + out * rx * .25)} ${f1(q[1] - ry * .45)}q${f1(-out * rx * .6)} ${f1(ry * .3)} ${f1(-out * rx * .1)} ${f1(ry * .75)}`, "none", INK, lw * .7);
  }
  const cx = q[0] + out * rx * .35;
  return E(cx, q[1], rx, ry, SKIN, INK, lw) + P(`M${f1(cx + out * rx * .1)} ${f1(q[1] - ry * .45)}q${f1(out * rx * .5)} ${f1(ry * .35)} ${f1(0)} ${f1(ry * .8)}`, "none", INK, lw * .7);
}

function bunSvg(m, view, lw, wantFront) {
  const b = m.bun; if (!b) return "";
  const q = view.pr(b.X, b.u, b.Z);
  const front = q[2] > 8;
  if (front !== wantFront) return "";
  let s = E(q[0], q[1], b.r, b.r * (b.high ? .9 : 1), m.hair.color, INK, lw);
  if (b.high) s += P(`M${f1(q[0] - b.r * .55)} ${f1(q[1] - b.r * .1)}q${f1(b.r * .55)} ${f1(-b.r * .5)} ${f1(b.r * 1.1)} 0M${f1(q[0] - b.r * .4)} ${f1(q[1] + b.r * .35)}q${f1(b.r * .4)} ${f1(-b.r * .35)} ${f1(b.r * .8)} 0`, "none", "#8B9397", lw * .6);
  if (b.knot) s += P(`M${f1(q[0] - b.r * .5)} ${f1(q[1] + b.r * .15)}q${f1(b.r * .5)} ${f1(-b.r * .55)} ${f1(b.r * .95)} -${f1(b.r * .1)}`, "none", "#4A5670", lw * .6);
  return s;
}

function locksSvg(m, view, lw) {
  if (!m.locks) return "";
  const th = keyInterp(m.hair.th.map(k => [k[0], k[1]]), .1)[0];
  let s = "";
  for (const [az, u, out, du, wdeg, uSpan = 0] of m.locks) {
    const ua = clamp(u - uSpan / 2, 0, 1), ub = clamp(u + uSpan / 2, 0, 1);
    const sa = slice(m, ua), sb = slice(m, ub), s1 = slice(m, clamp(u + du, 0, 1));
    const phi = az * D2R, w = wdeg * D2R;
    const b1 = eggPt(sa, phi - w / 2, th - 2), b2 = eggPt(sb, phi + w / 2, th - 2), t = eggPt(s1, phi + w * .1, th + out);
    const q1 = view.pr(b1[0], ua, b1[1]), q2 = view.pr(b2[0], ub, b2[1]), qt = view.pr(t[0], clamp(u + du, -.2, 1), t[1]);
    const nz = view.nz(Math.sin(phi), -.3, Math.cos(phi));
    if (nz < -.35) continue;
    const mid = [(q1[0] + q2[0]) / 2, (q1[1] + q2[1]) / 2];
    const c1 = [lerp(mid[0], qt[0], .5) + (q1[0] - q2[0]) * .25, lerp(mid[1], qt[1], .5) + (q1[1] - q2[1]) * .25];
    s += P(`M${f1(q1[0])} ${f1(q1[1])}Q${f1(c1[0])} ${f1(c1[1])} ${f1(qt[0])} ${f1(qt[1])}Q${f1(mid[0])} ${f1(mid[1])} ${f1(q2[0])} ${f1(q2[1])}Z`, m.hair.color, INK, lw * .9);
    s += P(`M${f1(q1[0])} ${f1(q1[1])}L${f1(q2[0])} ${f1(q2[1])}`, "none", m.hair.color, lw * 2.2);
  }
  return s;
}

function strandSvg(m, view, lw) {
  const st = m.strand; if (!st) return "";
  const pts3 = [];
  for (let k = 0; k <= 6; k++) {
    const u = lerp(st.u0, st.u1, k / 6), s = slice(m, u), X = st.side * s.a * lerp(st.x, st.x - .05, k / 6);
    const Z = surfZ(m, X, u) + 2.5 + Math.sin(k / 6 * Math.PI) * 1.5;
    pts3.push(view.pr(X + st.side * Math.sin(k / 6 * Math.PI) * 2.5, u, Z));
  }
  const nz = view.nz(st.side * .8, 0, .6);
  if (nz < .05) return "";
  return P(smooth(pts3.map(q => [q[0], q[1]]), false), "none", m.hair.color, lw * 1.05);
}

// Full head drawing at head-space origin (neck pivot). Returns svg + metrics.
function headSvg(role, p) {
  const hp = headParts(role, p), { m, view, lw } = hp;
  const clipSkin = nextId("hs"), clipHair = nextId("hh");
  let s = `<defs><clipPath id="${clipSkin}"><path d="${hp.skinD}"/></clipPath>`;
  if (hp.clipPoly) s += `<clipPath id="${clipHair}"><path d="${poly(hp.clipPoly)}"/></clipPath>`;
  s += `</defs>`;
  s += bunSvg(m, view, lw, false);
  s += ear(m, view, -1, lw, false) + ear(m, view, 1, lw, false);
  s += P(hp.hairD, m.hair.color, INK, lw);
  s += P(hp.skinD, SKIN, INK, lw);
  s += `<g clip-path="url(#${clipSkin})">${faceFeatures(role, p, hp)}</g>`;
  if (hp.clipPoly) {
    s += `<g clip-path="url(#${clipHair})">${P(hp.hairD, m.hair.color, INK, lw)}`;
    if (m.hair.wave) { // soft combed lines for the clerk's grey hair
      s += `<g clip-path="url(#${clipSkin})" opacity=".55">`;
      for (const az of [-50, -20, 15, 45]) {
        const a = view.pr(...(() => { const sl = slice(m, .08); const e = eggPt(sl, az * D2R * .3, 3); return [e[0], .08, e[1]]; })());
        const sl2 = slice(m, .32), e2 = eggPt(sl2, az * D2R, 3), b = view.pr(e2[0], .32, e2[1]);
        s += P(`M${f1(a[0])} ${f1(a[1])}Q${f1((a[0] + b[0]) / 2 + 4)} ${f1((a[1] + b[1]) / 2)} ${f1(b[0])} ${f1(b[1])}`, "none", "#7F888D", lw * .6);
      }
      s += `</g>`;
    }
    s += `</g>`;
    if (m.hair.stroke && hp.hairline.length > 1) s += P(smooth(hp.hairline.map(q => [q[0], q[1]]), false), "none", INK, lw * .9);
  }
  if (m.part) { // parting / combing line on the hair
    const q = m.part.map(([az, u]) => { const sl = slice(m, u), e = eggPt(sl, az * D2R, 4.5); return view.pr(e[0], u - .03, e[1]); });
    if (q.every(p => p[2] > 4)) s += P(smooth(q.map(p => [p[0], p[1]]), false), "none", "#56627A", lw * .7);
  }
  s += locksSvg(m, view, lw);
  if (m.cowlick) {
    const sl = slice(m, .02), e = eggPt(sl, m.cowlick.az * D2R, 8), q = view.pr(e[0], .0, e[1]);
    s += P(`M${f1(q[0] - 3)} ${f1(q[1] + 1)}q2 -9 9 -11q-2 5 1 9`, "none", INK, lw * .85);
  }
  s += ear(m, view, -1, lw, true) + ear(m, view, 1, lw, true);
  s += strandSvg(m, view, lw);
  s += bunSvg(m, view, lw, true);
  const tilt = p.tilt ?? 0;
  return s;
}

// Guide levels for the model sheet, in head space (pivot 0,0): y of crown, hairline, brow, eye, nose root,
// nose tip, ear top/bottom, mouth, chin/jaw, neck axis.
function headGuides(role, p = {}) {
  const m = HEADS[role], view = makeView(m, { ...p, nod: 0, tilt: 0 });
  const y = u => (u - .9) * m.H;
  return {
    crown: y(0), hairline: y(angInterp(m.hair.line, 0)), brow: y(m.brow.u), eyes: y(m.eye.u), noseRoot: y(m.nose.root),
    noseTip: y(m.nose.u), earTop: y(m.ear.u) - m.ear.ry, earBottom: y(m.ear.u) + m.ear.ry, mouth: y(m.mouth.u),
    jaw: y(.8), chin: y(1), neck: 0, H: m.H,
  };
}

// ── BODY MODELS ────────────────────────────────────────────────────────────────────────────────────────────
const BODY = {
  marta: { neckBase: -150, neckTop: -170, neckR: 12, sh: [54, -141], L1: 70, L2: 64, hand: 26, hipJ: [21, 4],
    stand: { knee: 96, ankle: 180, sole: 188, kneeX: 14, ankleX: 13 }, seatKnees: [[-18, 36], [20, 36]], seatFeet: [[-22, 150], [22, 150]],
    waist: 40, hipW: 54, sleeve: .78, armR: [14, 10, 7.2] },
  pawel: { neckBase: -160, neckTop: -182, neckR: 13.5, sh: [60, -151], L1: 76, L2: 70, hand: 29, hipJ: [24, 6],
    stand: { knee: 108, ankle: 204, sole: 212, kneeX: 22, ankleX: 22 }, seatKnees: [[-52, 36], [60, 32]], seatFeet: [[-60, 150], [74, 158]],
    waist: 47, hipW: 54, sleeve: 1, armR: [15.5, 12, 9] },
  clerk: { neckBase: -148, neckTop: -168, neckR: 12, sh: [54, -139], L1: 68, L2: 62, hand: 26, hipJ: [21, 4],
    stand: { knee: 94, ankle: 178, sole: 186, kneeX: 18, ankleX: 18 }, seatKnees: [[-25, 36], [25, 36]], seatFeet: [[-27, 150], [27, 150]],
    waist: 46, hipW: 56, sleeve: 1, armR: [14, 11, 7.6] },
};

// Upper-body deformation: lean (deg) / bow / twist applied with a weight growing from the waist up.
function bender(p) {
  const lean = (p.lean ?? 0) * D2R, bow = clamp(p.bow ?? 0, 0, 1), tw = clamp(p.twist ?? 0, -1, 1);
  return ([x, y]) => {
    const w = clamp((-y - 15) / 115, 0, 1), ws = w * w * (3 - 2 * w);
    x = x * (1 - .16 * Math.abs(tw) * ws * (Math.abs(x) > 20 ? 1 : .4)) + tw * 13 * ws;
    y = y * (1 - .3 * bow * ws);
    const a = lean * ws, c = Math.cos(a), s = Math.sin(a);
    return [x * c - y * s, x * s + y * c];
  };
}

function ik(S, H, L1, L2, hint) {
  let dx = H[0] - S[0], dy = H[1] - S[1], d = Math.hypot(dx, dy);
  let reach = "ok", Sx = S[0], Sy = S[1];
  const max = L1 + L2 - .5;
  if (d > max) { // slide the shoulder girdle up to 10 units toward the target
    const slide = Math.min(10, d - max);
    Sx += dx / d * slide; Sy += dy / d * slide; dx = H[0] - Sx; dy = H[1] - Sy; d = Math.hypot(dx, dy);
    reach = "shoulder";
  }
  let W = [H[0], H[1]];
  if (d > max) { W = [Sx + dx / d * max, Sy + dy / d * max]; d = max; reach = "short"; }
  const minD = Math.abs(L1 - L2) + 2;
  if (d < minD) { W = [Sx + dx / (d || 1) * minD, Sy + dy / (d || 1) * minD]; d = minD; reach = "folded"; }
  const ux = (W[0] - Sx) / d, uy = (W[1] - Sy) / d;
  const a = (L1 * L1 - L2 * L2 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  const e1 = [Sx + ux * a - uy * h, Sy + uy * a + ux * h], e2 = [Sx + ux * a + uy * h, Sy + uy * a - ux * h];
  const pick = hint && Math.hypot(e1[0] - hint[0], e1[1] - hint[1]) > Math.hypot(e2[0] - hint[0], e2[1] - hint[1]) ? e2 : e1;
  return { S: [Sx, Sy], E: pick, W, reach };
}

const GRIP_POINT = { open: [22, 2], pinch: [25, -3], hold: [15, 2], point: [31, -2], grab: [22, 6] };
const DEFAULT_ARMS = {
  stand: { left: [-58, -78, -50, -10], right: [58, -78, 50, -10] },
  seat: { left: [-58, -70, -34, -6], right: [58, -70, 34, -6] },
};

// Build the rig: all joint positions in LOCAL units + transform info.
export function rig(role, pose = {}) {
  const b = BODY[role]; if (!b) throw Error("obsada: unknown role " + role);
  const seated = !!pose.seat, bend = bender(pose), sc = pose.s ?? 1;
  const bowDrop = clamp(pose.bow ?? 0, 0, 1);
  const neckBase = bend([0, b.neckBase]);
  const nt = bend([0, b.neckTop]);
  const neckTop = [nt[0] + (pose.head ?? 0) * 0 + bowDrop * 4, nt[1] + bowDrop * 10];
  const shL = bend([-b.sh[0], b.sh[1]]), shR = bend([b.sh[0], b.sh[1]]);
  const def = DEFAULT_ARMS[seated ? "seat" : "stand"];
  const L = pose.left ?? def.left, R = pose.right ?? def.right;
  const armL = ik(shL, [L[2], L[3]], b.L1, b.L2, [L[0], L[1]]);
  const armR = ik(shR, [R[2], R[3]], b.L1, b.L2, [R[0], R[1]]);
  // legs
  let knees, feet;
  if (seated) { knees = pose.knees ?? b.seatKnees; feet = pose.feet ?? b.seatFeet; }
  else {
    const st = b.stand;
    knees = pose.knees ?? [[-st.kneeX, st.knee], [st.kneeX, st.knee]];
    feet = pose.feet ?? [[-st.ankleX, st.ankle], [st.ankleX, st.ankle]];
  }
  const hipL = [-b.hipJ[0], b.hipJ[1]], hipR = [b.hipJ[0], b.hipJ[1]];
  const wristAng = (arm, side) => Math.atan2(arm.W[1] - arm.E[1], arm.W[0] - arm.E[0]) / D2R + (side < 0 ? pose.wristL ?? 0 : pose.wristR ?? 0);
  const gripAt = (arm, side, grip) => {
    const g = GRIP_POINT[grip] ?? GRIP_POINT.open, a = wristAng(arm, side) * D2R, flip = side < 0 ? (pose.leftFlip ? -1 : 1) : (pose.rightFlip ? 1 : -1);
    const hs = b.hand / 24, gx = g[0] * hs, gy = g[1] * flip * hs;
    return [arm.W[0] + gx * Math.cos(a) - gy * Math.sin(a), arm.W[1] + gx * Math.sin(a) + gy * Math.cos(a)];
  };
  const gL = pose.leftGrip ?? pose.grip ?? "open", gR = pose.rightGrip ?? pose.grip ?? "open";
  return {
    role, b, seated, sc, x: pose.x ?? 640, y: pose.y ?? 470, bend, neckBase, neckTop, shL, shR, armL, armR, knees, feet, hipL, hipR,
    gripL: gripAt(armL, -1, gL), gripR: gripAt(armR, 1, gR), gL, gR, wristAng,
  };
}

// Screen-space joints for authors (px).
export function joints(role, pose = {}) {
  const r = rig(role, pose), T = q => [f1(r.x + q[0] * r.sc), f1(r.y + q[1] * r.sc)];
  return {
    hip: T([0, 0]), neck: T(r.neckBase), headPivot: T(r.neckTop),
    shoulderL: T(r.armL.S), elbowL: T(r.armL.E), wristL: T(r.armL.W), gripL: T(r.gripL), reachL: r.armL.reach,
    shoulderR: T(r.armR.S), elbowR: T(r.armR.E), wristR: T(r.armR.W), gripR: T(r.gripR), reachR: r.armR.reach,
    kneeL: T(r.knees[0]), kneeR: T(r.knees[1]), ankleL: T(r.feet[0]), ankleR: T(r.feet[1]),
    lengths: { upperArm: r.b.L1, forearm: r.b.L2, hand: r.b.hand },
  };
}

// ── HANDS ──────────────────────────────────────────────────────────────────────────────────────────────────
// Hand space: wrist at (0,0), +x toward the fingertips, thumb on −y. Size ≈ 24 units (scaled per role).
const HAND = {
  open: "M-2 -7.5C3 -9.5 9 -9.5 13 -8.5L21.5 -9.5C25 -9.6 25.3 -6.4 22 -5.8L15.5 -5L24.5 -4C27.8 -3.4 27.6 .2 24.2 .2L16 .3L23.2 3.2C26.2 4.6 25 7.6 21.8 6.8L14.5 5L18.6 8.4C20.6 10.4 18.4 12.6 16 11.2L8 7.8C4 8.6 0 8 -2 7Z",
  pinch: "M-2 -7.5C4 -10 10 -10 15 -8L23.5 -6.5C27 -5.8 27.2 -2.2 24 -1.8L16 -1.2C19 0 20 2.5 18 4.2C19.5 6.6 17.5 8.8 15 8.4C13.8 10.5 11 10.6 9.5 9C5.5 9.6 0 8.8 -2 7Z",
  hold: "M-2 -7.5C4 -10.5 11 -10.5 16 -8.8C21 -7.6 22.5 -3 21.5 1.5C21.6 5.5 19 9 15 9.6C11 10.8 5 10.4 -2 7Z",
  point: "M-2 -7.5C4 -9.5 10 -9.5 15 -7.6L30 -5.8C33.4 -5.2 33.2 -1.6 29.8 -1.4L17 -.4C19.6 1.6 19.2 4.6 16.6 5.2C17.6 7.6 15.6 9.6 13 9.2C10 10.6 4 10 -2 7Z",
  grab: "M-2 -7.5C3 -9.5 9 -9.5 13 -8.5L21 -8C25.5 -6.8 26.5 -2.2 24 .5C26.5 1.8 26.2 5.4 23 6.6C24 9.4 21.5 11.4 18.8 10.4C17 12.4 13.6 12 12.2 9.8C7 10 2 9 -2 7Z",
};
const THUMB = {
  open: "M5 -8C8 -13 12 -16.5 15.5 -16C18 -15.4 17.6 -12.8 15.6 -11.6L11.5 -8.4",
  pinch: "M5 -8C10 -12 16 -12.5 20 -10.5C23.5 -8.8 23.5 -6 21.2 -5.4C17.5 -4.6 13 -6 10 -6.6",
  hold: "M5 -8.5C9.5 -12.5 15 -12.8 18.8 -10.4C21.4 -8.6 20.2 -5.6 17.4 -5.8L11 -5.8",
  point: "M5 -8C9 -11.4 14 -11.8 17.8 -9.6C20.4 -8 19.4 -5.2 16.8 -5.4L11 -5.4",
  grab: "M5 -8C8 -13 12.5 -16 16.5 -15.2C19.2 -14.4 18.6 -11.6 16.4 -10.8L12 -8",
};
const HAND_LINES = {
  open: "", pinch: "M14 2.2Q16 3 17.6 4.2M11 5.6Q13 6.8 14.6 8.2", hold: "M15 -2.4Q18 -1.2 20.8 .6M14 2.4Q17 3.4 19.6 5.6",
  point: "M14 1.6Q15.8 2.6 16.8 4.6", grab: "M15 -1.5Q19 -.5 23.6 .8M14 3Q17.6 4.6 22.4 6.8",
};
export function hand(x, y, angle = 0, size = 1, grip = "open", flip = false, lw = 2.7) {
  const sy = flip ? -1 : 1, g = HAND[grip] ? grip : "open";
  const body = P(HAND[g], SKIN, INK, lw / size * .85) + P(THUMB[g], SKIN, INK, lw / size * .85) + (HAND_LINES[g] ? P(HAND_LINES[g], "none", INK, lw / size * .6) : "");
  return G(`translate(${f1(x)} ${f1(y)}) rotate(${f1(angle)}) scale(${f1(size * 100) / 100} ${f1(size * sy * 100) / 100})`, body);
}

// ── ARM ────────────────────────────────────────────────────────────────────────────────────────────────────
function sides(a, b, ra, rb, capEnd = true) { // tube outline without the start cap (start hides in the torso)
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  return `M${f1(a[0] + nx * ra)} ${f1(a[1] + ny * ra)}L${f1(b[0] + nx * rb)} ${f1(b[1] + ny * rb)}` +
    (capEnd ? `A${f1(rb)} ${f1(rb)} 0 0 0 ${f1(b[0] - nx * rb)} ${f1(b[1] - ny * rb)}` : `M${f1(b[0] - nx * rb)} ${f1(b[1] - ny * rb)}`) +
    `L${f1(a[0] - nx * ra)} ${f1(a[1] - ny * ra)}`;
}
function armSvg(r, side, pose, palette, lw) {
  const arm = side < 0 ? r.armL : r.armR, b = r.b, [rS, rE, rW] = b.armR;
  const grip = side < 0 ? r.gL : r.gR, flipBase = side < 0 ? !!pose.leftFlip : !pose.rightFlip;
  const ang = r.wristAng(arm, side);
  const hs = b.hand / 24;
  let s = hand(arm.W[0], arm.W[1], ang, hs, grip, flipBase, lw);
  const S = arm.S, El = arm.E, W = arm.W;
  // the shoulder end of the upper arm starts a little inside the torso so no cap shows on the chest
  const Sin = [S[0] - side * rS * .35, S[1] + rS * .2];
  const merge = (fill, parts) => parts.map(([pa, pb, ra, rb, cap]) => P(cap === false ? sides(pa, pb, ra, rb) : tube(pa, pb, ra, rb), "none", INK, lw * 2)).join("")
    + parts.map(([pa, pb, ra, rb, cap]) => P(tube(pa, pb, ra, rb, cap !== false), fill, "none", 0)).join("");
  if (b.sleeve >= 1) {
    const Wc = [lerp(El[0], W[0], 1.05), lerp(El[1], W[1], 1.05)];
    s += merge(palette.sleeve, [[Sin, El, rS, rE, false], [El, Wc, rE, rW + 1.3]]);
    const dx = W[0] - El[0], dy = W[1] - El[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, rr = rW + 1.3;
    const ci = [lerp(El[0], W[0], .88), lerp(El[1], W[1], .88)];
    s += P(`M${f1(ci[0] + nx * rr)} ${f1(ci[1] + ny * rr)}Q${f1(ci[0] + dx / L * 2)} ${f1(ci[1] + dy / L * 2)} ${f1(ci[0] - nx * rr)} ${f1(ci[1] - ny * rr)}`, "none", palette.cuffLine ?? INK, lw * .7);
    // elbow crease on the inside of the bend
    const u1 = [(S[0] - El[0]), (S[1] - El[1])], u2 = [(W[0] - El[0]), (W[1] - El[1])];
    const cr = u1[0] * u2[1] - u1[1] * u2[0], dot = (u1[0] * u2[0] + u1[1] * u2[1]) / (Math.hypot(...u1) * Math.hypot(...u2) || 1);
    if (dot > -.85) {
      const bis = [u1[0] / Math.hypot(...u1) + u2[0] / Math.hypot(...u2), u1[1] / Math.hypot(...u1) + u2[1] / Math.hypot(...u2)], bl = Math.hypot(...bis) || 1;
      const c0 = [El[0] + bis[0] / bl * rE * .9, El[1] + bis[1] / bl * rE * .9];
      s += P(`M${f1(c0[0])} ${f1(c0[1])}l${f1(-bis[0] / bl * 6 + u2[0] / Math.hypot(...u2) * 4)} ${f1(-bis[1] / bl * 6 + u2[1] / Math.hypot(...u2) * 4)}`, "none", palette.cuffLine ?? INK, lw * .6);
    }
  } else {
    // short sleeve (Marta's jacket): skin arm, a wide sleeve with an open hem over the upper arm
    s += merge(SKIN, [[[lerp(S[0], El[0], .45), lerp(S[1], El[1], .45)], El, rS - 3.5, rE - 1, false], [El, W, rE - 1, rW]]);
    const H = [lerp(S[0], El[0], b.sleeve), lerp(S[1], El[1], b.sleeve)];
    const dx = El[0] - S[0], dy = El[1] - S[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, rh = rS + 2;
    const Sx = [S[0] - side * rS * .5, S[1] + rS * .3];
    s += P(poly([[Sx[0] + nx * rS, Sx[1] + ny * rS], [H[0] + nx * rh, H[1] + ny * rh], [H[0] - nx * rh, H[1] - ny * rh], [Sx[0] - nx * rS, Sx[1] - ny * rS]]), palette.sleeve, "none", 0);
    s += P(`M${f1(Sx[0] + nx * rS)} ${f1(Sx[1] + ny * rS)}L${f1(H[0] + nx * rh)} ${f1(H[1] + ny * rh)}Q${f1(H[0] + dx / L * 4)} ${f1(H[1] + dy / L * 4)} ${f1(H[0] - nx * rh)} ${f1(H[1] - ny * rh)}L${f1(Sx[0] - nx * rS)} ${f1(Sx[1] - ny * rS)}`, "none", INK, lw);
    s += P(`M${f1(lerp(S[0], H[0], .55) + nx * rh * .2)} ${f1(lerp(S[1], H[1], .55) + ny * rh * .2)}l${f1(dx / L * 8)} ${f1(dy / L * 8)}`, "none", palette.fold ?? INK, lw * .6);
  }
  return s;
}

// ── OUTFITS / TORSO ────────────────────────────────────────────────────────────────────────────────────────
function torsoSvg(r, pose, lw) {
  const { role, bend, b } = r;
  const T = a => a.map(bend);
  const tw = clamp(pose.twist ?? 0, -1, 1);
  const patient = pose.outfit === "patient";
  const sw = b.sh[0], sy = b.sh[1], nb = b.neckBase, hw = b.hipW, ww = b.waist;
  let s = "";
  if (patient) {
    const body = T([[-sw + 2, sy - 2], [-14, nb - 2], [14, nb - 2], [sw - 2, sy - 2], [sw - 2, sy + 30], [ww + 4, -50], [hw + 2, 8], [0, 12], [-hw - 2, 8], [-ww - 4, -50], [-sw + 2, sy + 30]]);
    s += P(smooth(body, true, .55), GOWN, INK, lw);
    const v = T([[-14, nb - 1], [0, nb + 24], [14, nb - 1]]);
    s += P(line(v), "none", INK, lw * .8);
    for (const q of T([[-26, -110], [22, -96], [-12, -70], [28, -52], [-28, -34], [8, -24], [-4, -100], [16, -126]])) s += E(q[0], q[1], 1.6, 1.6, "#9DB5B0");
    return s;
  }
  if (role === "pawel") {
    // white tee (behind), shirt panels open over it, collar, buttons
    s += P(smooth(T([[-26, nb + 2], [26, nb + 2], [34, -40], [36, 8], [-36, 8], [-34, -40]]), true, .4), TEE, INK, lw);
    s += P(smooth(T([[-14, nb + 1], [0, nb + 13], [14, nb + 1]]), false), "none", INK, lw * .8);
    const pl = 9 + tw * 5, pr = 11 - tw * 5; // placket edges move with the twist
    const left = T([[-sw + 8, sy - 5], [-sw - 2, sy + 4], [-sw - 3, sy + 24], [-hw - 4, -60], [-hw - 3, 10], [-pl - 8, 14], [-pl - 4, -60], [-pl, nb + 26], [-15, nb + 2]]);
    const right = T([[sw - 8, sy - 5], [sw + 2, sy + 4], [sw + 3, sy + 24], [hw + 4, -60], [hw + 3, 10], [pr + 8, 14], [pr + 4, -60], [pr, nb + 26], [15, nb + 2]]);
    s += P(smooth(left, true, .35), NAVY, INK, lw) + P(smooth(right, true, .35), NAVY, INK, lw);
    // collar flaps
    const cl = T([[-15, nb - 4], [-23, nb + 2], [-20, nb + 22], [-pl + 1, nb + 26], [-12, nb + 6]]);
    const cr = T([[15, nb - 4], [23, nb + 2], [20, nb + 22], [pr - 1, nb + 26], [12, nb + 6]]);
    s += P(poly(cl), NAVY, "#7E8AA0", lw * .7) + P(poly(cr), NAVY, "#7E8AA0", lw * .7);
    for (const yy of [-112, -82, -52, -22]) { const q = bend([pr + 5.5, yy]); s += E(q[0], q[1], 2.1, 2.1, "#E8ECF2"); }
    // chest pocket hint
    const pk = T([[-36, -118], [-20, -118], [-21, -100], [-35, -100]]);
    s += P(line(pk), "none", "#56627A", lw * .6);
    return s;
  }
  if (role === "marta") {
    // light dress top with round neckline; sage open jacket
    s += P(smooth(T([[-sw + 6, sy + 2], [-14, nb], [14, nb], [sw - 6, sy + 2], [ww + 2, -46], [hw - 4, -6], [-hw + 4, -6], [-ww - 2, -46]]), true, .45), DRESS, INK, lw);
    s += P(smooth(T([[-15, nb], [-8, nb + 10], [0, nb + 13], [8, nb + 10], [15, nb]]), false), "none", INK, lw * .8);
    const fl = 13 - tw * 4, fr = 13 + tw * 4;
    const left = T([[-sw, sy], [-sw - 4, sy + 26], [-ww - 9, -60], [-hw - 3, -2], [-fl - 8, 2], [-fl - 1, -60], [-fl - 2, nb + 20], [-16, nb]]);
    const right = T([[sw, sy], [sw + 4, sy + 26], [ww + 9, -60], [hw + 3, -2], [fr + 8, 2], [fr + 1, -60], [fr + 2, nb + 20], [16, nb]]);
    s += P(smooth(left, true, .4), SAGE, INK, lw) + P(smooth(right, true, .4), SAGE, INK, lw);
    // lapel folds
    s += P(line(T([[-16, nb + 1], [-fl - 6, nb + 30]])), "none", SAGE_DARK, lw * .7) + P(line(T([[16, nb + 1], [fr + 6, nb + 30]])), "none", SAGE_DARK, lw * .7);
    return s;
  }
  // clerk: white blouse with collar, grey-blue cardigan, ID badge
  s += P(smooth(T([[-sw + 4, sy + 2], [-14, nb], [14, nb], [sw - 4, sy + 2], [ww + 2, -46], [hw - 4, 6], [-hw + 4, 6], [-ww - 2, -46]]), true, .45), "#FFFFFF", INK, lw);
  const left = T([[-sw, sy], [-sw - 4, sy + 24], [-ww - 8, -60], [-hw - 3, 8], [-4, 12], [-3, -60], [-8, nb + 34], [-15, nb]]);
  const right = T([[sw, sy], [sw + 4, sy + 24], [ww + 8, -60], [hw + 3, 8], [4, 12], [3, -60], [8, nb + 34], [15, nb]]);
  s += P(smooth(left, true, .4), CLERK_CARDI, INK, lw) + P(smooth(right, true, .4), CLERK_CARDI, INK, lw);
  for (const yy of [-84, -60, -36, -12]) { const q = bend([6, yy]); s += E(q[0], q[1], 1.9, 1.9, "#8C99A3"); }
  // rounded collar
  s += P(smooth(T([[-16, nb - 2], [-22, nb + 6], [-14, nb + 15], [-1, nb + 10]]), false), "#FFFFFF", INK, lw * .85);
  s += P(smooth(T([[16, nb - 2], [22, nb + 6], [14, nb + 15], [1, nb + 10]]), false), "#FFFFFF", INK, lw * .85);
  // ID badge on the screen-left chest
  const bd = T([[-34, -108], [-18, -108], [-18, -88], [-34, -88]]);
  s += P(poly(bd), "#FFFFFF", INK, lw * .7) + P(line(T([[-32, -103], [-20, -103]])), "none", GREEN, lw * 1.1) + P(line(T([[-31, -96], [-22, -96]])), "none", "#9AA4AE", lw * .6);
  return s;
}

// ── LEGS ───────────────────────────────────────────────────────────────────────────────────────────────────
function shoeSvg(a, side, kind, lw, role, heelOut = 0, scale = 1) {
  const [x, y] = a, o = side * 3;
  const big = role === "pawel" ? 1.15 : 1;
  const w = 15 * big * scale, h = 8 * scale;
  let s = "";
  if (kind === "sock" || heelOut > 0) {
    // sock foot seen from the front
    const lift = kind === "sock" ? 0 : heelOut * 12;
    s += P(`M${f1(x - w * .8 + o)} ${f1(y + 4 - lift)}C${f1(x - w + o)} ${f1(y + h + 2 - lift)} ${f1(x + w + o)} ${f1(y + h + 2 - lift)} ${f1(x + w * .8 + o)} ${f1(y + 4 - lift)}L${f1(x + 7)} ${f1(y - 6 - lift)}L${f1(x - 7)} ${f1(y - 6 - lift)}Z`, SOCK, INK, lw * .9);
  }
  if (kind !== "sock") {
    const tall = role === "marta" ? 5 : 7;
    s += P(`M${f1(x - w + o)} ${f1(y + h)}C${f1(x - w - 2 + o)} ${f1(y + 1)} ${f1(x - w * .6 + o)} ${f1(y - tall)} ${f1(x + o * .3)} ${f1(y - tall)}C${f1(x + w * .6 + o)} ${f1(y - tall)} ${f1(x + w + 2 + o)} ${f1(y + 1)} ${f1(x + w + o)} ${f1(y + h)}Z`, SHOE, INK, lw * .9);
    if (role === "marta") s += P(`M${f1(x - w * .55 + o)} ${f1(y - tall + 4)}Q${f1(x + o)} ${f1(y + 1)} ${f1(x + w * .55 + o)} ${f1(y - tall + 4)}`, "none", SKIN, lw * .9);
  }
  return s;
}

function legsSvg(r, pose, lw) {
  const { role, b, seated, knees, feet, hipL, hipR } = r;
  const patient = pose.outfit === "patient";
  const shoes = pose.shoes ?? ["shoe", "shoe"], heel = pose.heelOut ?? [0, 0];
  let s = "";
  const skirt = role === "marta" && !patient;
  const trouserFill = role === "clerk" ? CLERK_TROUSERS : role === "pawel" ? TROUSERS : patient ? GOWN : SKIN;
  const hips = [hipL, hipR];
  if (seated) {
    // shins (behind the knee caps), then feet
    const shins = [], thighs = [];
    for (let i = 0; i < 2; i++) {
      const K = knees[i], A = feet[i];
      const rk = role === "pawel" ? 19 : role === "clerk" ? 17 : 15, ra = role === "pawel" ? 15.5 : role === "clerk" ? 14 : 9;
      shins.push({ d: tube(K, [A[0], A[1] - 2], rk, ra), fill: skirt || patient ? SKIN : trouserFill });
      thighs.push({ d: tube(hips[i], K, role === "pawel" ? 27 : 24, role === "pawel" ? 21 : 18), fill: skirt ? DRESS : trouserFill });
    }
    s += union(shins, lw);
    if (!skirt && !patient) for (let i = 0; i < 2; i++) { // trouser hems
      const A = feet[i], rr = role === "pawel" ? 16 : 14.5;
      s += P(`M${f1(A[0] - rr)} ${f1(A[1] - 6)}Q${f1(A[0])} ${f1(A[1] - 2)} ${f1(A[0] + rr)} ${f1(A[1] - 6)}`, "none", INK, lw * .7);
    }
    for (let i = 0; i < 2; i++) s += shoeSvg([feet[i][0], feet[i][1] + 2], i ? 1 : -1, shoes[i], lw, role, heel[i], feet[i][1] > 168 ? 1.06 : 1);
    if (skirt || patient) {
      // ONE skirt outline across both thighs, hem resting on both knees
      const [K1, K2] = knees, hemY = Math.max(K1[1], K2[1]) + 34;
      const d = smooth([[-b.hipW + 2, -14], [-b.hipW - 2, 2], [K1[0] - 24, K1[1] - 4], [K1[0] - 27, hemY - 3], [K1[0] - 8, hemY + 3],
        [(K1[0] + K2[0]) / 2, hemY - 1], [K2[0] + 8, hemY + 3], [K2[0] + 27, hemY - 3], [K2[0] + 24, K2[1] - 4], [b.hipW + 2, 2], [b.hipW - 2, -14]], true, .7);
      s += P(d, patient ? GOWN : DRESS, INK, lw);
      // fabric over two thighs: knee crests + a soft fold between the knees
      const mid = (K1[0] + K2[0]) / 2;
      s += P(`M${f1(mid)} ${f1(K1[1] - 22)}Q${f1(mid - 1)} ${f1(hemY - 14)} ${f1(mid + 1)} ${f1(hemY - 3)}`, "none", "#B9B6A8", lw * .7);
      s += P(`M${f1(K1[0] - 10)} ${f1(K1[1] - 6)}q${f1(8)} -5 ${f1(16)} 0M${f1(K2[0] - 6)} ${f1(K2[1] - 6)}q8 -5 16 0`, "none", "#CFCBBD", lw * .6);
    } else {
      s += union([{ d: smooth([[-b.hipW, -16], [b.hipW, -16], [b.hipW + 4, 10], [0, 16], [-b.hipW - 4, 10]], true, .6), fill: trouserFill }].concat(thighs), lw);
      for (let i = 0; i < 2; i++) { const K = knees[i]; s += P(`M${f1(K[0] - 9)} ${f1(K[1] + 6)}q9 5 18 0`, "none", role === "clerk" ? "#465063" : "#B8B5AA", lw * .6); }
    }
    return s;
  }
  // standing
  const legs = [];
  for (let i = 0; i < 2; i++) {
    const H = hips[i], K = knees[i], A = feet[i];
    const r0 = role === "pawel" ? 22 : 19, r1 = role === "pawel" ? 18 : 15, r2 = role === "pawel" ? 16 : skirt ? 8 : 13;
    if (skirt || patient) legs.push({ d: tube([K[0], K[1] - 10], A, 12, 8), fill: SKIN });
    else legs.push({ d: tube(H, K, r0, r1), fill: trouserFill }, { d: tube(K, A, r1, r2), fill: trouserFill });
  }
  if (!skirt && !patient) legs.unshift({ d: smooth([[-b.hipW + 10, -16], [b.hipW - 10, -16], [b.hipW - 6, 14], [0, 22], [-b.hipW + 6, 14]], true, .6), fill: trouserFill });
  s += union(legs, lw);
  if (!skirt && !patient) for (let i = 0; i < 2; i++) { s += P(`M${f1(hips[i][0] * .3)} 20L${f1(lerp(hips[i][0], knees[i][0], .9))} ${f1(knees[i][1] - 20)}`, "none", "none", 0); }
  for (let i = 0; i < 2; i++) s += shoeSvg([feet[i][0], feet[i][1] + 2], i ? 1 : -1, shoes[i], lw, role, heel[i]);
  if (skirt || patient) {
    const hem = role === "marta" ? 122 : 130;
    s += P(smooth([[-b.waist - 2, -40], [-b.hipW - 2, 6], [-b.hipW - 12, hem - 4], [-20, hem + 3], [0, hem], [20, hem + 3], [b.hipW + 12, hem - 4], [b.hipW + 2, 6], [b.waist + 2, -40]], true, .6), patient ? GOWN : DRESS, INK, lw);
    s += P(`M-12 ${hem - 40}Q-14 ${hem - 18} -16 ${hem}M14 ${hem - 34}Q15 ${hem - 16} 17 ${hem}`, "none", "#CFCBBD", lw * .6);
  }
  return s;
}

// ── PERSON ─────────────────────────────────────────────────────────────────────────────────────────────────
export function person(role, pose = {}) {
  const r = rig(role, pose), lw = 2.7 * (pose.line ?? 1);
  const parts = pose.parts ?? "all";
  const palette = role === "pawel" ? { sleeve: NAVY, cuffLine: "#7E8AA0" } : role === "marta" ? { sleeve: pose.outfit === "patient" ? GOWN : SAGE, fold: SAGE_DARK } : { sleeve: CLERK_CARDI };
  if (pose.outfit === "patient") palette.sleeve = GOWN;
  let s = "";
  if (parts === "all" || parts === "body") {
    if (pose.legs !== false) s += legsSvg(r, pose, lw);
    // neck
    const nb = r.neckBase, nt = r.neckTop;
    s += P(tube([nb[0], nb[1] + 6], nt, r.b.neckR, r.b.neckR - 1), SKIN, INK, lw);
    s += torsoSvg(r, pose, lw);
    // head on the neck axis
    const headPose = { ...pose, line: pose.line };
    s += G(`translate(${f1(nt[0])} ${f1(nt[1])}) rotate(${f1(pose.tilt ?? 0)})`, headSvg(role, headPose));
  }
  const longSleeve = r.b.sleeve >= 1 || pose.outfit === "patient";
  const bb = pose.outfit === "patient" && role === "marta" ? { ...r, b: { ...r.b, sleeve: .5 } } : r;
  if (parts === "all" || parts === "arms" || parts === "left") s += armSvg(bb, -1, pose, palette, lw);
  if (parts === "all" || parts === "arms" || parts === "right") s += armSvg(bb, 1, pose, palette, lw);
  return G(`translate(${f1(r.x)} ${f1(r.y)}) scale(${f1(r.sc * 1000) / 1000})`, s);
}

// Head only (model sheet, close-ups): x,y = neck pivot on screen, s scale. Same params as person().
export function head(role, pose = {}) {
  return G(`translate(${f1(pose.x ?? 0)} ${f1(pose.y ?? 0)}) scale(${f1((pose.s ?? 1) * 1000) / 1000}) rotate(${f1(pose.tilt ?? 0)})`, headSvg(role, pose));
}

// ── OLA ────────────────────────────────────────────────────────────────────────────────────────────────────
// Sleeping baby under a blanket with ONE wide green stripe. x,y = centre of the head; s scale; angle deg;
// breath 0..1 lifts the blanket; blanket:false draws the head only; facing 1 = face toward screen-right.
export function ola(pose = {}) {
  const x = pose.x ?? 0, y = pose.y ?? 0, s = pose.s ?? 1, br = clamp(pose.breath ?? 0, 0, 1), lw = 2.4 * (pose.line ?? 1), fc = pose.facing ?? 1;
  let g = "";
  // head
  g += E(0, 0, 21, 19, SKIN, INK, lw);
  g += E(-fc * 15, 3, 5, 6.5, SKIN, INK, lw * .8); // ear on the far cheek side
  g += E(fc * 9, 7, 5, 3, BLUSH);
  // little lock of hair
  g += P(`M${-fc * 4} -18q${fc * 6} -7 ${fc * 10} -2q${-fc * 6} -1 ${-fc * 5} 5`, "none", INK, lw * .85);
  g += P(`M${-fc * 12} -14q${fc * 4} -4 ${fc * 8} -2`, "none", INK, lw * .6);
  // closed lids
  for (const ex of [fc * 2, fc * 13]) g += P(`M${ex - 4} 1q4 3.5 8 0`, "none", INK, lw * .85);
  g += P(`M${fc * 10} 11q${fc * 2} 1.5 ${fc * 4} 0`, "none", INK, lw * .7);
  if (pose.blanket !== false) {
    const lift = br * 3;
    g += P(`M-44 18C-30 ${f1(10 - lift)} 24 ${f1(8 - lift)} 52 ${f1(16 - lift * .5)}L56 44C24 54 -22 54 -48 44Z`, "#FBFAF3", INK, lw);
    g += P(`M-44 ${f1(28 - lift * .7)}C-14 ${f1(18 - lift)} 24 ${f1(18 - lift)} 54 ${f1(28 - lift * .6)}L55 ${f1(38 - lift * .4)}C24 ${f1(30 - lift * .8)} -16 ${f1(31 - lift * .8)} -46 ${f1(39 - lift * .5)}Z`, SAGE, "none");
    g += P(`M-44 18C-30 ${f1(10 - lift)} 24 ${f1(8 - lift)} 52 ${f1(16 - lift * .5)}`, "none", INK, lw);
  }
  return G(`translate(${f1(x)} ${f1(y)}) rotate(${f1(pose.angle ?? 0)}) scale(${f1(s * 1000) / 1000})`, g);
}

// ── SOFA POSES ─────────────────────────────────────────────────────────────────────────────────────────────
// Hip centres and scale for the living room (scenes 15–20). Continuity with scenes 18/19 SPEC: hips
// Marta (427,490), Paweł (800,490), s 1.16 — r1 bodies are larger in local units, so on screen the parents
// fill the frame from ≈ y 165 (Paweł's fringe) / 180 (Marta's bun line) to the floor at ≈ y 690.
export const SOFA = {
  floorY: 692, seatY: 494, s: 1.28,
  marta: { x: 427, y: 490, s: 1.28 },
  pawel: { x: 800, y: 490, s: 1.28 },
};
const SOFA_POSES = {
  // 18/59 → 19/0 handoff (r1): Marta has URLOP and ZASIŁEK on her knees, eyes on the corner under Paweł's print;
  // Paweł bows from the hips over the stack, right elbow resting on it at ≈ (871,453) px, right wrist back toward
  // the chest, left thumb+index pinch the short edge of ZASIŁEK at ≈ (761,452) px. Both shoes are on the floor.
  przekazanie: {
    marta: { seat: true, bow: .3, lean: 3, head: .3, nod: .6, gaze: .55, gazeDown: .7, brow: -.6, smile: -.2,
      left: [-62, -58, -42, -22], right: [62, -58, 48, -20], leftGrip: "pinch", rightGrip: "pinch", knees: [[-18, 36], [20, 36]], feet: [[-22, 150], [22, 150]] },
    pawel: { seat: true, bow: .8, lean: 10, twist: -.3, head: -.3, nod: .7, gaze: -.3, gazeDown: .8, brow: -.7, smile: -.35,
      left: [-62, -40, -56, -38], right: [56, -29, 18, -88], leftGrip: "pinch", rightGrip: "open", wristR: -20, shoes: ["sock", "sock"],
      knees: [[-52, 36], [60, 32]], feet: [[-60, 150], [76, 160]] },
  },
  // board pose (kanapa-przed-fala): Marta holds two prints on her lap, Paweł reaches into the stack, shoe dangling in his right hand.
  plansza: {
    marta: { seat: true, bow: .3, head: .25, nod: .6, gaze: .2, gazeDown: .8, brow: -.8, smile: -.3,
      left: [-62, -60, -44, -22], right: [62, -60, 46, -20], leftGrip: "pinch", rightGrip: "pinch" },
    pawel: { seat: true, bow: .45, lean: 6, twist: -.3, head: -.3, nod: .55, gaze: -.4, gazeDown: .7, brow: -.8, smile: -.4,
      left: [-40, -60, -40, -6], right: [96, -50, 104, 2], leftGrip: "grab", rightGrip: "hold", shoes: ["shoe", "sock"],
      feet: [[-60, 150], [76, 160]] },
  },
  // neutral settle (scene 15 end): hands on knees, looking at each other.
  siad: {
    marta: { seat: true, head: .5, gaze: .6, left: [-56, -56, -30, -16], right: [56, -56, 32, -16] },
    pawel: { seat: true, head: -.5, gaze: -.6, left: [-62, -56, -46, -18], right: [62, -56, 50, -18], shoes: ["shoe", "shoe"] },
  },
};
// sofaPose('marta'|'pawel', variant='przekazanie'|'plansza'|'siad', overrides) → full pose object for person()
export function sofaPose(role, variant = "przekazanie", over = {}) {
  const base = SOFA[role], v = SOFA_POSES[variant]?.[role];
  if (!base || !v) throw Error(`sofaPose: unknown ${role}/${variant}`);
  return JSON.parse(JSON.stringify({ ...base, ...v, ...over }));
}

export const obsada = { person, head, hand, ola, rig, joints, sofaPose, SOFA, headGuides, GRIP_POINT };
