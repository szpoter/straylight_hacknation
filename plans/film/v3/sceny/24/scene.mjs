// 24 · Marta pyta o wspólny urlop (46–48 s, film frames 1380–1439). Author b24.
// The right edge of the "Zgłoś urodzenie Oli" card (x=990 in 23/59) slides to x=427; the white chat panel grows
// from it and Marta's whole question enters at once (14–21). Pure function of f.
// The map is the shared drawing of scenes 22–23 (map at rest: camera 918, trace 1584).
import { drawMap } from "../../../v2/sceny/22/scene.mjs";

const SURFACE = "#F5FAF7", OUTLINE = "#D4D7DD";
// Bubble of the parent's message (app/src/features/chat/zusik.module.css .bubble parent).
const BUBBLE = "#E6F3E9", BUBBLE_INK = "#176343", INK = "#283754";
export const QUESTION = ["A jeśli weźmiemy", "urlop razem?"];

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const n = (v) => (Math.round(v * 100) / 100).toString();

/** Map exactly as 23 leaves it (camera x=918, trace end x=1584, card x=342–990, y=164–464). */
export const mapAtRest = () => drawMap(918, 1584);

/** Edge of the card / panel at local frame f: 990 → 427 over 0–25, zero speed at both ends of the landing. */
export function edgeAt(f) {
  const t = clamp01(f / 25);
  const move = 1 - (1 - t) ** 3 * (1 + 3 * t);
  return { move, edge: 990 - 563 * move, scale: 1 - 0.4 * move };
}

export function scene(f) {
  const map = mapAtRest();
  if (f === 0) return map;
  const { move, edge, scale } = edgeAt(f);
  const enter = clamp01((f - 13) / 8);
  const bubbleWidth = 1216 - (edge + 55);
  return `<rect width="1280" height="720" fill="${SURFACE}"/>
    <defs>
      <mask id="s24-map" maskUnits="userSpaceOnUse" x="0" y="0" width="1280" height="720">
        <rect width="1280" height="720" fill="white" opacity="${n(1 - move)}"/>
        <rect x="340" y="162" width="652" height="305" fill="white"/>
        <rect x="0" y="468" width="1280" height="109" fill="white"/>
      </mask>
    </defs>
    <g transform="translate(${n(edge)} 325) scale(${scale.toFixed(4)}) translate(-990 -325)">
      <g mask="url(#s24-map)">${map}</g>
    </g>
    <g opacity="${n(Math.min(f / 9, 1))}">
      <rect x="${n(edge)}" width="${n(1280 - edge)}" height="720" fill="#FFFFFF"/>
      <path d="M${n(edge)} 0v720" stroke="${OUTLINE}" stroke-width="2"/>
    </g>
    ${enter > 0 ? `<g transform="translate(${n(edge + 55)} ${n(239 + 8 * (1 - enter) ** 2)})"
        opacity="${n(1 - (1 - enter) ** 2)}" font-family="Inter,sans-serif">
      <text x="36" y="0" font-size="28" font-weight="600" fill="${INK}">Marta</text>
      <path d="M32 34H${n(bubbleWidth - 32)}q32 0 32 32v137q0 10-10 10H32q-32 0-32-32V66q0-32 32-32Z" fill="${BUBBLE}"/>
      <text x="36" y="111" font-size="52" font-weight="500" fill="${BUBBLE_INK}"><tspan>${QUESTION[0]}</tspan><tspan x="36" dy="64">${QUESTION[1]}</tspan></text>
    </g>` : ""}`;
}
