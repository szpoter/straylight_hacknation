// 25 · Zusik odpowiada Marcie (48–50 s, film frames 1440–1499). Author b24.
// One `answering` mouth opening (0–11), eyes to the reference (18–25), then a 5° lean and the link underline (26–39),
// hold 40–59. Pure function of f; the mascot is the app geometry drawn by zusik-ruch.mjs.
import { zusikFilm } from "./zusik-ruch.mjs";

const INK = "#283754", MUTED = "#5E697F", GREEN = "#1A8648", SURFACE = "#F5FAF7", OUTLINE = "#D4D7DD";
export const ANSWER = ["Oboje możecie korzystać", "z urlopu jednocześnie."];
export const LINK = "Kodeks pracy · art. 182¹a § 6";
export const LINK_POS = { x: 518, y: 519, w: 432, ruleY: 529.5, ruleH: 3 };
// useStateAnimation.ts `answering`: lookAt([0, −4]). SPEC 25: final gaze (+22, +14) toward the link.
export const LOOK_ANSWER = [0, -4], LOOK_LINK = [22, 14];
export const MASCOT = { cx: 241, cy: 328, size: 262, drop: 4, tilt: 5 };

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const span = (f, a, b) => clamp01((f - a) / (b - a));
const smooth = (t) => t * t * (3 - 2 * t);
// LOOK step in the app is easeOut; Motionmaxxing-style power ease out for the eyes.
const easeOut = (t) => 1 - (1 - t) ** 3;
const n = (v) => (Math.round(v * 100) / 100).toString();

/** Pose of the mascot at local frame f (also used by scene 26 for its frame 0). */
export function pose25(f) {
  // mouth: smile at 0, widest at 5, smile again at 11
  const mouth = f <= 5 ? smooth(span(f, 0, 5)) : 1 - smooth(span(f, 5, 11));
  const g = easeOut(span(f, 18, 25));
  const look = [LOOK_ANSWER[0] + (LOOK_LINK[0] - LOOK_ANSWER[0]) * g, LOOK_ANSWER[1] + (LOOK_LINK[1] - LOOK_ANSWER[1]) * g];
  const lean = smooth(span(f, 26, 39));
  return { mouth, look, tilt: MASCOT.tilt * lean, cy: MASCOT.cy + MASCOT.drop * lean, underline: smooth(span(f, 26, 39)) };
}

/** Everything except the mascot (panel, label, answer, link). `rule` 0–1 = underline length. */
export function layout25(rule) {
  return `<rect width="1280" height="720" fill="${SURFACE}"/>
    <rect x="427" width="853" height="720" fill="#FFFFFF"/>
    <path d="M427 0v720" stroke="${OUTLINE}" stroke-width="2"/>
    <g font-family="Inter,sans-serif" fill="${INK}">
      <text x="241" y="529" text-anchor="middle" font-size="25" fill="${MUTED}">Agent AI · RAG</text>
      <text x="518" y="239" font-size="30" font-weight="600" fill="${GREEN}">Zusik</text>
      <g font-family="Domine,Georgia,serif" font-size="49" letter-spacing="-0.9">
        <text x="518" y="331">${ANSWER[0]}</text>
        <text x="518" y="401">${ANSWER[1]}</text>
      </g>
    </g>
    ${linkMarkup(rule)}`;
}

export function linkMarkup(rule) {
  const L = LINK_POS;
  return `<g font-family="Inter,sans-serif">
      <text x="${L.x}" y="${L.y}" textLength="${L.w}" lengthAdjust="spacingAndGlyphs" fill="${GREEN}" font-size="31" font-weight="600">${LINK}</text>
      ${rule > 0 ? `<rect x="${L.x}" y="${L.ruleY}" width="${n(L.w * rule)}" height="${L.ruleH}" rx="1.5" fill="${GREEN}"/>` : ""}
    </g>`;
}

export function scene(f) {
  const p = pose25(f);
  return `${layout25(p.underline)}
    ${zusikFilm(MASCOT.cx, p.cy, MASCOT.size, { look: p.look, mouth: p.mouth, tilt: p.tilt })}`;
}
