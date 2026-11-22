// v3 · ujęcie 19 (36–38 s, klatki filmu 1080–1139) · autor bloku b19 · modele r1.
// Fala papierów spod łokcia Pawła → suchy klik w lokalnej 52 (globalna 1132) → ostry oryginalny Zusik od 53.
// Start = k.sofaPose(rola,"przekazanie") (ten sam kadr co plansza obsady r1, 18/59 → 19/0).
// Narzędzia: Anime.js (krzywe + stagger startów fali), Scene.js (zgięcie rogu i łuk prowadzącego arkusza),
// Planck.js (lot luźnych kartek po oderwaniu), wszystko liczone z numeru klatki → deterministycznie.
import { cubicBezier } from '../../../montaz/node_modules/animejs/dist/modules/easings/cubic-bezier/index.js';
import { stagger } from '../../../montaz/node_modules/animejs/dist/modules/utils/stagger.js';
import { Vec2, World } from '../../../montaz/node_modules/planck/dist/planck.mjs';
import { SceneItem } from '../../../montaz/node_modules/scenejs/dist/scene.esm.js';

export const FREEZE = 52;           // lokalna klatka kliku = globalna 1132
export const ZUSIK = { x: 640, y: 325, size: 270 };

const inOut = cubicBezier(.45, 0, .45, 1);
const slip = cubicBezier(.3, .02, .2, 1);
const outQ = cubicBezier(.2, .7, .3, 1);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const prog = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
const mix = (a, b, t) => a + (b - a) * t;
const r1 = n => Math.round(n * 10) / 10;

// keys: [[frame, v0, v1, ...], ...] → eased values at f
function track(f, keys, ease = inOut) {
  if (f <= keys[0][0]) return keys[0].slice(1);
  for (let i = 1; i < keys.length; i++) {
    if (f <= keys[i][0]) {
      const a = keys[i - 1], b = keys[i], t = ease(prog(f, a[0], b[0]));
      return a.slice(1).map((v, j) => mix(v, b[j + 1], t));
    }
  }
  return keys.at(-1).slice(1);
}

// ── POSES (local units of the r1 model, relative to the hips) ────────────────────────────────────────────
// Paweł · lewa ekranowa ręka: szczypie krótki brzeg ZASIŁKU, ciągnie w lewo (4–9), puszcza na 30, goni róg.
const PAWEL_L = [[0, -62, -40, -56, -38], [4, -62, -40, -58, -38], [9, -70, -38, -78, -36], [13, -71, -38, -80, -35],
  [22, -76, -36, -86, -32], [30, -90, -34, -104, -26], [36, -100, -36, -118, -24], [51, -104, -44, -124, -34]];
// prawy łokieć zostaje na stosie; na 14–18 lekko się unosi i pozwala kartce wyjść spod rękawa
const PAWEL_R = [[0, 56, -29, 18, -88], [13, 56, -29, 18, -88], [18, 57, -35, 20, -92], [30, 58, -33, 22, -90], [51, 58, -33, 22, -90]];
// Marta · prawa ekranowa ręka zostaje na kolanie do 29, potem podchodzi od dołu i spóźnia się pod rogiem
const MARTA_R = [[0, 62, -58, 48, -20], [29, 62, -58, 48, -20], [35, 80, -40, 80, -20], [39, 86, -34, 112, -18], [51, 88, -44, 118, -50]];

function poses(f) {
  const k = Math.min(f, FREEZE);
  const look = inOut(prog(k, 24, 29)), turn = inOut(prog(k, 26, 36)), up = inOut(prog(k, 38, 50));
  const pTurn = inOut(prog(k, 14, 24)), pUp = inOut(prog(k, 36, 48)), effort = inOut(prog(k, 4, 10));
  const R = track(k, MARTA_R);
  const marta = {
    lean: 3 + 4 * turn - 11 * up, bow: .3 + .08 * turn - .06 * up, twist: .18 * turn,
    head: .3 + .12 * turn - .1 * up, nod: mix(.6, .2, up), gaze: mix(.55, .95, look) - .2 * up, gazeDown: mix(.7, .05, up),
    brow: mix(-.6, -.95, look), smile: -.2 - .15 * look, mouth: .32 * up,
    right: R, rightGrip: k < 30 ? 'pinch' : 'open',
  };
  const L = track(k, PAWEL_L), Rp = track(k, PAWEL_R);
  const pawel = {
    bow: .8 - .24 * pUp, lean: 10 - 3 * pTurn + 9 * pUp, twist: -.3 - .1 * pTurn,
    head: -.3 - .14 * pTurn + .24 * pUp, nod: mix(.7, .22, pUp), gaze: -.3 - .55 * pTurn - .1 * pUp, gazeDown: mix(.8, .05, pUp),
    brow: -.7 - .25 * pUp + .15 * effort * (1 - pTurn), smile: -.35 - .1 * pUp, mouth: .05 * effort + .38 * pUp,
    left: L, leftGrip: k < 30 ? 'pinch' : 'open', right: Rp,
  };
  return { marta, pawel };
}

// ── PAPERS ───────────────────────────────────────────────────────────────────────────────────────────────
// Scene.js: łuk i podwinięty róg prowadzącego arkusza (spód ZASIŁKU zabiera go spod łokcia).
const leadBend = new SceneItem({ 0: { bend: 0, curl: 0 }, 4: { bend: 0, curl: 0 }, 10: { bend: -.55, curl: .05 }, 13: { bend: -.7, curl: .1 },
  18: { bend: -.35, curl: .25 }, 23: { bend: -.2, curl: .7 }, 30: { bend: .2, curl: .55 }, 36: { bend: .35, curl: .5 }, 44: { bend: .55, curl: .65 }, 52: { bend: .6, curl: .8 } });
const val = (item, f, key) => item.getNowFrame(Math.min(f, FREEZE)).get(key);
// pozycja [x,y,kąt,w,h] prowadzącego arkusza — dolny druk spod ZASIŁKU, kończy grzbietem przy (640,~330) za Zusikiem
const LEAD = [[0, 826, 462, 8, 100, 126], [4, 826, 462, 8, 100, 126], [9, 815, 456, 5, 100, 126], [13, 806, 452, 2, 100, 126],
  [18, 758, 450, -6, 102, 128], [23, 690, 458, -12, 104, 130], [30, 636, 440, -18, 106, 132], [36, 606, 396, -20, 110, 136],
  [43, 612, 364, -8, 116, 142], [52, 640, 334, 7, 124, 150]];
// arkusz B (następny w stosie, w 0–18 schowany dokładnie pod prowadzącym) popchnięty rogiem prowadzącego, sunie po kolanach Marty
const SHEET_B = [[0, 826, 462, 8, 100, 126], [19, 826, 462, 8, 100, 126], [26, 690, 484, -6, 100, 124], [35, 548, 500, -15, 100, 124], [52, 488, 512, -20, 102, 126]];

// Fala: arkusze wychodzą kolejno z teczki/stosu (Anime.js stagger od środka) i rozkładają się wachlarzem na oba uda.
// [cel x, y, kąt, w, h, opcje] — gęsty pas między y≈360 a 620, twarze rodziców (y<330) zostają wolne.
const FAN = [
  [560, 420, -16, 104, 128, { bend: .4 }], [712, 402, 12, 106, 130, { bend: -.3 }], [470, 452, -24, 108, 132, { curl: .5 }],
  [800, 430, 18, 108, 132, { fold: .6 }], [612, 470, -6, 112, 136, { bend: .2 }], [378, 418, -32, 100, 124, { bend: .5 }],
  [904, 400, 24, 102, 126, { curl: .4 }], [520, 540, -18, 116, 140, { fold: .5 }], [700, 520, 8, 118, 142, { bend: -.2 }],
  [318, 500, -38, 104, 128, { curl: .6 }], [968, 470, 32, 106, 130, { bend: .4 }], [430, 592, -26, 120, 140, { bend: .3 }],
  [846, 560, 20, 120, 142, { curl: .3 }], [610, 600, -4, 124, 136, { fold: .4 }], [1000, 560, 38, 110, 132, { bend: -.3 }],
  [282, 590, -42, 110, 132, { curl: .4 }],
];
const fanStart = stagger([32, 46], { from: 'center', total: FAN.length, ease: 'inQuad' });
const FAN_START = FAN.map((_, i) => Math.round(fanStart({}, i, [])));
const ORIGIN = [748, 470];

// Twarze w klatce zatrzymania (z marginesem): żaden arkusz fali nie wchodzi wyżej niż broda w tych pasach x.
const FACES = [[352, 548, 342], [728, 918, 352]];
function keepFacesFree(x, y, h) {
  for (const [a, b, chin] of FACES) if (x + 55 > a && x - 55 < b) return Math.max(y, chin + h / 2 - 8);
  return y;
}
function fanSheets(f) {
  const k = Math.min(f, FREEZE);
  return FAN.map(([x, y, a, w, h, o], i) => {
    const s = FAN_START[i];
    if (k < s) return '';
    const dur = 12 + (i % 3) * 3, t = slip(prog(k, s, s + dur)), billow = Math.sin(t * Math.PI);
    const side = x < 640 ? -1 : 1;
    const px = mix(ORIGIN[0], x, t), py = keepFacesFree(px, mix(ORIGIN[1], y, t) - 30 * billow, mix(118, h, t));
    const ang = mix(-3, a, t) + side * 10 * billow;
    const opts = { bend: (o.bend ?? 0) * t + .45 * billow * side, curl: (o.curl ?? 0) * t, fold: (o.fold ?? 0) * t, lift: .5 * billow };
    const skew = side * (6 + (i % 4) * 3) * t;
    return { z: y, svg: `<g transform="translate(${r1(px)} ${r1(py)}) skewX(${r1(skew)}) translate(${r1(-px)} ${r1(-py)})">${K.paper(r1(px), r1(py), mix(96, w, t), mix(118, h, t), r1(ang), opts)}</g>` };
  });
}

// Planck.js: luźne kartki oderwane od brzegów fali (lot liczony raz, przy imporcie modułu).
// [start, skąd x, y, cel x, y w klatce 52, obrót rad/s, w, h] — tory sprawdzone tak, by nie przecinały twarzy.
const LOOSE = [[33, 990, 480, 1095, 215, 2.0, 86, 104], [34, 650, 430, 600, 85, -1.4, 72, 88], [34, 300, 490, 215, 215, -2.2, 82, 100],
  [36, 320, 500, 250, 380, -1.6, 90, 108], [37, 650, 430, 680, 112, 1.2, 66, 80], [38, 1000, 470, 1135, 370, 2.6, 92, 112]].map(([start, ox, oy, tx, ty, spin, w, h]) => {
  const g = 10, T = (FREEZE - start) / 30, p0 = [ox / 100, oy / 100];
  const vx = (tx / 100 - p0[0]) / T, vy = (ty / 100 - p0[1]) / T - .5 * g * T;
  const world = new World({ gravity: new Vec2(0, g) });
  const body = world.createDynamicBody({ position: new Vec2(p0[0], p0[1]), linearVelocity: new Vec2(vx, vy), angularVelocity: spin, angularDamping: .4 });
  const frames = [];
  for (let f = start; f <= FREEZE; f++) { const p = body.getPosition(); frames.push([p.x * 100, p.y * 100, body.getAngle() * 180 / Math.PI]); world.step(1 / 30); }
  return { start, w, h, frames };
});
function looseSheets(f) {
  const k = Math.min(f, FREEZE);
  return LOOSE.map(({ start, w, h, frames }, i) => {
    if (k < start) return '';
    const [x, y, a] = frames[k - start], t = outQ(prog(k, start, start + 10));
    return K.paper(r1(x), r1(y), mix(90, w, t), mix(40, h, t), r1(a), { bend: .5 * Math.sin(t * 2.4) * (i % 2 ? 1 : -1), curl: .3 });
  }).join('');
}

let K; // kit, set per call (scene functions are pure in k)

// ── ROOM (salon + rodzice + druki na kolanach) ─────────────────────────────────────────────────────────────
function room(f) {
  const k = Math.min(f, FREEZE);
  const { marta: mo, pawel: po } = poses(f);
  const m = K.sofaPose('marta', 'przekazanie', mo), p = K.sofaPose('pawel', 'przekazanie', po);
  const pj = K.joints('pawel', p), pj0 = K.joints('pawel', K.sofaPose('pawel', 'przekazanie'));
  let s = K.salon({ pram: true, breath: .5 + .5 * Math.sin(k / 9) });
  s += K.person('marta', { ...m, parts: 'body' }) + K.person('pawel', { ...p, parts: 'body' });
  s += K.folder(688, 493, 300, -3, 1);
  // arkusz B (z wnętrza teczki)
  const [bx, by, ba, bw, bh] = track(k, SHEET_B, slip);
  const b = K.paper(r1(bx), r1(by), bw, bh, r1(ba), { curl: .2 * prog(k, 19, 35), lift: .4 * Math.sin(Math.PI * prog(k, 19, 45)) });
  // prowadzący arkusz pod ZASIŁKIEM (do 29 pod ZASIŁKIEM i rękawem; potem w warstwie fali)
  const lead = leadSheet(f);
  // ZASIŁEK w szczypcach lewej dłoni: przesuwa się razem z punktem chwytu do 29, potem leży
  const g = k < 30 ? pj.gripL : K.joints('pawel', K.sofaPose('pawel', 'przekazanie', { ...poses(29).pawel })).gripL;
  const dx = g[0] - pj0.gripL[0], dy = g[1] - pj0.gripL[1];
  const pull = inOut(prog(k, 4, 13));
  const zas = K.paper(r1(814 + dx), r1(455 + dy), 100, 126, r1(-3 - 5 * pull), { header: 'ZASIŁEK', curl: .4, lift: k < 30 ? .7 * pull : .2, bend: -.25 * pull });
  // stos pod łokciem: reszta (w kl. 0 schowana pod arkuszem prowadzącym), B, prowadzący, ZASIŁEK — kolejność jak w 18/59
  // (reszta i B leżą dokładnie pod prowadzącym; rysowane od kl. 4, gdy prowadzący rusza — w 0–3 obraz = 18/59)
  s += (k >= 4 ? K.paper(826, 462, 100, 126, r1(8 + 3 * prog(k, 14, 22)), {}) + (k < 30 ? b : '') : '') + (k < 30 ? lead + zas : '');
  // druki Marty na kolanach (ZASIŁEK lekko popchnięty przez arkusz B na 30–40)
  const nudge = inOut(prog(k, 30, 40));
  s += K.paper(388, 478, 88, 112, -8, { header: 'URLOP' }) + K.paper(r1(468 - 6 * nudge), r1(482 + 3 * nudge), 88, 112, r1(6 - 4 * nudge), { header: 'ZASIŁEK' });
  s += K.shoe(690, 676, 0, 1.28) + K.shoe(912, 678, 0, 1.28, { flip: true });
  s += K.person('marta', { ...m, parts: 'left' });
  s += K.sofaFront() + K.person('pawel', { ...p, parts: 'right' });
  // ręce, które sięgają nad papierem: rysowane w warstwie fali (z tym samym rozmyciem po kliku)
  const reach = K.person('pawel', { ...p, parts: 'left' }) + K.person('marta', { ...m, parts: 'right' });
  return { s, front: (k >= 30 ? b : ''), reach, zas: (k >= 30 ? zas : '') };
}

function leadSheet(f) {
  const k = Math.min(f, FREEZE);
  const [x, y, a, w, h] = track(k, LEAD, slip);
  return K.paper(r1(x), r1(y), w, h, r1(a), { bend: val(leadBend, k, 'bend'), curl: val(leadBend, k, 'curl'), lift: .8 * prog(k, 4, 13) * (1 - prog(k, 30, 40)) });
}

// Warstwa fali (ostra po kliku). Kolejność: daleko (wyżej) → blisko (niżej).
function wave(f, extraFront, reach, zas = '') {
  const k = Math.min(f, FREEZE);
  const fan = fanSheets(f).filter(Boolean).sort((p, q) => p.z - q.z);
  const upper = fan.filter(x => x.z < 470).map(x => x.svg).join(''), lower = fan.filter(x => x.z >= 470).map(x => x.svg).join('');
  // arkusze B i prowadzący przechodzą do warstwy fali w kl. 30, gdy już nic z salonu ich nie przykrywa
  return looseSheets(f) + upper + extraFront + lower + (k >= 30 ? leadSheet(f) : '') + zas + reach;
}

function blurOf(f) { return f < FREEZE ? 0 : f === FREEZE ? 1.4 : f === FREEZE + 1 ? 2.2 : 2.6; }

// Pełny kadr bez Zusika (scena 20 używa go do przejścia na miętę).
export function frozenRoom(k, f = 59) {
  K = k;
  const { s, front, reach, zas } = room(f), bl = blurOf(f);
  const defs = bl ? `<defs><filter id="s19-defocus" x="-2%" y="-2%" width="104%" height="104%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${bl}"/></filter></defs>` : '';
  return `${defs}<rect width="1280" height="720" fill="#F5FAF7"/><g${bl ? ' filter="url(#s19-defocus)"' : ''}>${s}</g>${wave(f, front, bl ? `<g filter="url(#s19-defocus)">${reach}</g>` : reach, zas)}`;
}

export function scene(f, k) {
  const base = frozenRoom(k, f);
  return f > FREEZE ? base + k.zusik(ZUSIK.x, ZUSIK.y, ZUSIK.size, 0) : base;
}
