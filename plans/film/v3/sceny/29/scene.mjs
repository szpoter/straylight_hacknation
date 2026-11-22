// 29 · Do kogo trafi wniosek? (56–58 s, film frames 1680–1739). Author b24.
// 0 = 28/59 (scene28(59) is the starting picture). 1–18: the whole sheet pulls back to scale 0.82, offset (115.2, 51),
// so it spans x=201–1079, y=41–684. 3–12: the "Odbiorca" row below the files is revealed left → right.
// 18–59: still under "do kogo". Pure function of f.
import { scene as scene28 } from "../28/scene.mjs";

const INK = "#283754", MUTED = "#5E697F", GREEN = "#1A8648", SURFACE = "#F5FAF7", MINT = "#A6D0B8";
// app/src/features/chat/case-data.ts: { label: "Pracodawca", value: OLA.employer } (OLA.employer = "Studio Lipa").
export const RECIPIENT_LABEL = "Odbiorca";
export const RECIPIENT = "Pracodawca · Studio Lipa";
// Row in sheet coordinates (28 leaves y ≥ 560 free under the file rows at y = 436–544).
export const ROW = { x: 140, y: 566, w: 982, h: 160, rx: 14 };
export const PULL = { scale: 0.82, dx: 115.2, dy: 51 };

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const span = (f, a, b) => clamp01((f - a) / (b - a));
const smooth = (t) => t * t * (3 - 2 * t);
// Motionmaxxing softLand (expoOut 3.41) – long braking tail, so the camera dies out under "do kogo".
const softLand = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : (1 - Math.exp(-3.41 * t)) / (1 - Math.exp(-3.41)));
const n = (v) => (Math.round(v * 1000) / 1000).toString();

export function recipientRow(reveal) {
  const R = ROW;
  return `<defs><clipPath id="s29-odbiorca"><rect x="${R.x - 2}" y="${R.y - 2}" width="${n((R.w + 4) * reveal)}" height="${R.h + 4}"/></clipPath></defs>
      <g clip-path="url(#s29-odbiorca)" font-family="Inter,sans-serif">
        <rect x="${R.x}" y="${R.y}" width="${R.w}" height="${R.h}" rx="${R.rx}" fill="${SURFACE}" stroke="${MINT}" stroke-width="2"/>
        <path d="M${R.x + 2.5} ${R.y + 26}V${R.y + R.h - 26}" stroke="${GREEN}" stroke-width="5" stroke-linecap="round"/>
        <text x="${R.x + 40}" y="${R.y + 50}" font-size="28" font-weight="500" fill="${MUTED}">${RECIPIENT_LABEL}</text>
        <text x="${R.x + 38}" y="${R.y + 124}" font-size="62" font-weight="600" letter-spacing="-0.8" fill="${INK}">${RECIPIENT}</text>
      </g>`;
}

export function scene(f) {
  const draft = scene28(59);
  if (f === 0) return draft;
  const F = Math.min(f, 18); // 18–59 identical
  const p = softLand(smooth(span(F, 0, 18)));
  const reveal = smooth(span(F, 3, 12));
  const s = 1 - (1 - PULL.scale) * p;
  return `<rect width="1280" height="720" fill="${SURFACE}"/>
    <g transform="translate(${n(PULL.dx * p)} ${n(PULL.dy * p)}) scale(${n(s)})">
      ${draft}
      ${recipientRow(reveal)}
    </g>`;
}
