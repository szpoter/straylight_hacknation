// 30 · Papiery wracają na miejsce (58–60 s, film frames 1740–1799). Author b24.
// 0 = 29/59. 1–35: Marta's whole sheet recedes around (640, 360). 10–27: two demo forms come up from the bottom edge
// on the same axis (tilt ±5° at the edge → 0° in depth), the nearest one largest. 23–36: the original static Zusik
// (k.zusik) rises in front and covers the stack; full silhouette with shadow from 36. 36–56: settle, gaze to the front.
// 56–59: one pose, centre (640, 360), frame 315 × 315, look 0 (identical frames). Pure function of f.
import { scene as scene29 } from "../29/scene.mjs";

const SURFACE = "#F5FAF7";
export const FINAL = { cx: 640, cy: 360, size: 315 };
// Headings from app/src/lib/demo/forms-civil.ts (name) and forms-leave.ts (name), one field label each.
const FORMS = [
  { start: 10, lines: ["Zgłoszenie urodzenia dziecka"], field: "Placówka lub miejsce porodu", angle: -5 },
  { start: 14, lines: ["Wniosek o udzielenie", "urlopu ojcowskiego"], field: "Imię i nazwisko ojca", angle: 5 },
];

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const ease = (f, a, b) => { const t = clamp01((f - a) / (b - a)); return t * t * (3 - 2 * t); };
const n = (v) => (Math.round(v * 1000) / 1000).toString();

function form(f, { start, lines, field, angle }) {
  if (f < start) return "";
  const distance = 1 - ease(f, start, start + 14);
  const y = 345 + 627 * distance;
  const scale = 0.12 + 0.42 * (1 - ease(f, 26, 36)) + 0.8 * distance;
  return `<g transform="translate(640 ${n(y)}) rotate(${n(angle * distance)}) scale(${n(scale)})">
    <rect x="-350" y="-156" width="700" height="312" rx="12" fill="#FFFFFF" stroke="#D4D7DD" stroke-width="3"/>
    <path d="M-306 -118h58" stroke="#1A8648" stroke-width="6" stroke-linecap="round"/>
    <g font-family="Domine,Georgia,serif" font-size="42" fill="#283754">
      ${lines.map((line, i) => `<text x="-306" y="${-52 + i * 47}">${line}</text>`).join("")}
    </g>
    <text x="-306" y="58" font-family="Inter,sans-serif" font-size="25" fill="#5E697F">${field}</text>
    <rect x="-306" y="75" width="608" height="40" rx="5" fill="${SURFACE}" stroke="#D4D7DD" stroke-width="2"/>
  </g>`;
}

export function scene(f, k) {
  if (f === 0) return scene29(59);
  const F = Math.min(f, 56); // 56–59: one identical pose
  const scale = 1 - 0.66 * ease(F, 0, 25) - 0.26 * ease(F, 25, 35);
  const stack = F < 36
    ? `<g transform="translate(640 360) scale(${n(scale)}) translate(-640 -360)">${scene29(59)}</g>${FORMS.map((s) => form(F, s)).join("")}`
    : ""; // from 36 the whole stack (≤ 107 px wide) is behind the body; dropped so 56–59 are the mascot alone
  const rise = ease(F, 23, 36);
  const settle = ease(F, 36, 56);
  const mascot = F > 23 ? k.zusik(FINAL.cx, 918 - 566 * rise + 8 * settle, FINAL.size, -0.34 * (1 - settle)) : "";
  return `<rect width="1280" height="720" fill="${SURFACE}"/>${stack}${mascot}`;
}
