// v3 · ujęcie 20 (38–40 s, klatki filmu 1140–1199) · autor bloku b19 · modele r1 + oryginalny Zusik z zestawu.
// 0–5: dokładnie obraz 19/59 (wywołanie sceny 19). 6–15 mięta #E4F2E9 zastępuje salon, jedno osiadanie (sx/sy).
// 16–21 źrenice w prawo. 22–44 przejazd do lewej trzeciej i odsłanianie „Przewodnik” / „Rodzica” od x=545.
// 45–59 wszystko stoi.
import { cubicBezier } from '../../../montaz/node_modules/animejs/dist/modules/easings/cubic-bezier/index.js';
import { scene as scene19, frozenRoom, ZUSIK } from '../19/scene.mjs';

export const TITLE = { x: 545, base1: 344, base2: 432, size: 88, ink: '#283754', mint: '#E4F2E9' };
export const END = { x: 367, y: 358, size: 310 };

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const prog = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
const softLand = cubicBezier(.3, 0, .25, 1);   // Motionmaxxing „softLand”: szybki start, miękkie dojście
const recover = cubicBezier(.4, 0, .3, 1);
const travelEase = cubicBezier(.5, 0, .15, 1); // przyhamowanie do pełnego zatrzymania w 44
const r2 = n => Math.round(n * 100) / 100;

export function zusikState(f) {
  const land = softLand(prog(f, 6, 15)), rec = recover(prog(f, 15, 21)), travel = travelEase(prog(f, 22, 44));
  const squash = .04 * land * (1 - rec);
  return {
    x: r2(ZUSIK.x + (END.x - ZUSIK.x) * travel),
    y: r2(ZUSIK.y + 40 * land - 7 * rec),
    size: r2(ZUSIK.size + (END.size - ZUSIK.size) * travel),
    sx: r2(1 + squash), sy: r2(1 - squash),
    look: r2(recover(prog(f, 16, 21))),
    travel, mint: land,
  };
}

// Napis jedzie razem z Zusikiem: początek wierszy stoi zawsze w stałej odległości od jego prawego obrysu
// (x = środek + 0,574·ramka → 545 przy (367, 310)), a maska rośnie od „P”/„R” w prawo. Zusik nigdy nie zakrywa liter.
export const TITLE_GAP = (TITLE.x - END.x) / END.size;
export function title(reveal, z) {
  const x = r2(z ? z.x + TITLE_GAP * z.size : TITLE.x), w = r2(640 * reveal);
  return `<defs><clipPath id="s20-title"><rect x="${r2(x - 4)}" y="230" width="${w}" height="230"/></clipPath></defs>
  <g clip-path="url(#s20-title)" font-family="Domine,serif" font-size="${TITLE.size}" font-weight="400" letter-spacing="-1.76" fill="${TITLE.ink}">
    <text x="${x}" y="${TITLE.base1}">Przewodnik</text><text x="${x}" y="${TITLE.base2}">Rodzica</text></g>`;
}

export function scene(f, k) {
  if (f < 6) return scene19(59, k);
  const z = zusikState(f);
  const room = z.mint < 1 ? frozenRoom(k, 59) : '';
  return `${room}<rect width="1280" height="720" fill="${TITLE.mint}" opacity="${r2(z.mint)}"/>`
    + (z.travel > 0 ? title(z.travel, z) : '')
    + k.zusik(z.x, z.y, z.size, z.look, { sx: z.sx, sy: z.sy });
}
