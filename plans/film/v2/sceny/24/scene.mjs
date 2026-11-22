import {mapAtRest} from "../23/scene.mjs";

export function scene(f, k) {
  const map = mapAtRest();
  if (f === 0) return map;

  const t = Math.min(f / 25, 1);
  const move = 1 - (1 - t) ** 3 * (1 + 3 * t);
  const edge = 990 - 563 * move;
  const scale = 1 - .4 * move;
  const enter = Math.max(0, Math.min((f - 13) / 8, 1));
  const bubbleWidth = 1216 - (edge + 55);
  return `<rect width="1280" height="720" fill="#F5FAF7"/>
    <defs>
      <mask id="s24-map" maskUnits="userSpaceOnUse" x="0" y="0" width="1280" height="720">
        <rect width="1280" height="720" fill="white" opacity="${1 - move}"/>
        <rect x="340" y="162" width="652" height="305" fill="white"/>
        <rect x="0" y="468" width="1280" height="109" fill="white"/>
      </mask>
    </defs>
    <g transform="translate(${edge} 325) scale(${scale}) translate(-990 -325)">
      <g mask="url(#s24-map)">${map}</g>
    </g>
    <g opacity="${Math.min(f / 9, 1)}">
      <rect x="${edge}" width="${1280 - edge}" height="720" fill="#FFF"/>
      <path d="M${edge} 0v720" stroke="#D4D7DD" stroke-width="2"/>
    </g>
    ${enter > 0 ? `<g transform="translate(${edge + 55} ${239 + 8 * (1 - enter) ** 2})"
        opacity="${1 - (1 - enter) ** 2}" font-family="Inter,sans-serif">
      <text x="36" y="0" font-size="28" font-weight="600" fill="#283754">Marta</text>
      <path d="M32 34H${bubbleWidth - 32}q32 0 32 32v137q0 10-10 10H32q-32 0-32-32V66q0-32 32-32Z" fill="#E6F3E9"/>
      <text x="36" y="111" font-size="52" font-weight="500" fill="#176343"><tspan>A jeśli weźmiemy</tspan><tspan x="36" dy="64">urlop razem?</tspan></text>
    </g>` : ""}`;
}
