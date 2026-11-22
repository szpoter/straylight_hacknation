// v3 · ujęcie 21 (40–42 s, klatki filmu 1200–1259) · autor bloku b19.
// Ekran importu z aplikacji: pasek demonstracji (auth-shell.tsx), „Marta Lis i Paweł Lis · dane z mObywatela i mZUS”
// (ezus-methods.tsx + ola.ts) i przycisk „Importuj dane i otwórz plan” (open-family-plan.tsx, AppButton).
// Lewy brzeg kapsuły na x=545 = oś tytułu z 20/59. Nacisk 14–17 (najgłębszy 40,57 s), powrót 18–32,
// zielona linia y=641 od kl. 41, +18 px/kl. (302 w 58, 320 w 59 → 338 w 22/0).
import { cubicBezier } from '../../../montaz/node_modules/animejs/dist/modules/easings/cubic-bezier/index.js';

export const BUTTON = { cx: 859, cy: 378, w: 628, h: 104 };
const INK = '#283754', GREEN = '#1A8648', BG = '#F5FAF7', AMBER = '#FCDCAA', QUIET = '#5E697F';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const prog = (f, a, b) => clamp((f - a) / (b - a), 0, 1);
const r2 = n => Math.round(n * 100) / 100;
const approach = cubicBezier(.25, .6, .3, 1);   // grot hamuje na powierzchni (Cursor Flyover)
const snap = cubicBezier(.12, .9, .3, 1);       // Motionmaxxing: najszybszy ruch na początku powrotu

export function lineEnd(f) { return f < 41 ? null : -4 + 18 * (f - 41); }

export function scene(f, k) {
  const a = approach(prog(f, 0, 13)), leave = prog(f, 18, 32);
  // łuk z (1190,505) do (1140,399), potem w dół i znika do 32
  const px = r2(1190 - 50 * a + 18 * leave), py = r2(505 - 106 * a - 14 * Math.sin(Math.PI * a) + 70 * leave * leave);
  const press = cubicBezier(.5, 0, .5, 1)(prog(f, 14, 17)), rel = snap(prog(f, 18, 32));
  const scale = r2(1 - .05 * (f < 18 ? press : 1 - rel));
  const end = lineEnd(f);
  const { cx, cy, w, h } = BUTTON;
  return `<rect width="1280" height="720" fill="${BG}"/>
  <g font-family="Inter,sans-serif" fill="${INK}">
    <rect width="1280" height="72" fill="${AMBER}"/>
    <g transform="translate(48 36)" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"><circle r="13"/><path d="M0 -1v8 M0 -7v.01"/></g>
    <text x="74" y="51" font-size="42">Wersja demonstracyjna · <tspan font-weight="600">nie podawaj prawdziwych danych</tspan></text>
    <text x="80" y="195" font-family="Domine,serif" font-size="60" letter-spacing="-.8">Import danych rodziny Oli</text>
    <text x="80" y="270" font-size="44" fill="${QUIET}"><tspan fill="${INK}" font-weight="500">Marta Lis i Paweł Lis</tspan> · dane z mObywatela i mZUS</text>
    <g transform="translate(${cx} ${cy}) scale(${scale})">
      <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="${h / 2}" fill="${GREEN}"/>
      <text y="15" fill="#FFFFFF" text-anchor="middle" font-size="44" font-weight="500">Importuj dane i otwórz plan</text>
    </g>
    ${leave < 1 ? `<path transform="translate(${px} ${py})" d="M0 0l2 29 7-7 5 12 6-3-5-11 10-1Z" fill="${INK}" stroke="#FFFFFF" stroke-width="2.4" stroke-linejoin="round" opacity="${r2(1 - leave)}"/>` : ''}
    ${end !== null ? `<path d="M-4 641H${end}" fill="none" stroke="${GREEN}" stroke-width="5" stroke-linecap="round"/>` : ''}
  </g>`;
}
