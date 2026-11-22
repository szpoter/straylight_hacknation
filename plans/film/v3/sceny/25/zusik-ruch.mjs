// Film instance of the app mascot (Bąbelek / Zusik) with the layers the static <Babelek/> cannot show:
// open mouth (`answering`), pupils + catchlights in both axes, a body tilt, and the `reading` book
// (body flowing into SHAPES.book, `detail-book` with spine, lines and the page).
// Geometry is imported 1:1 from the app sources; only the clock is replaced: every value is a pure
// function of the arguments (no requestAnimationFrame, no random waves, no blinking, no float).
// Shared by scenes 25 and 26 (author b24).
import {
  ARM_OUTLINES, BODY, CRESCENT, DOTS, EYES, FACE_ORIGIN, MOUTH, MOUTH_OPEN, SHADOW, outlinePath, subdivide,
} from "../../../../../app/src/components/mascot/babelek/geometry.ts";
import { BODY_POINTS, BOOK, SHAPES, smoothPath } from "../../../../../app/src/components/mascot/babelek/shapes.ts";
import { tuckArm } from "../../../../../app/src/components/mascot/babelek/travel.ts";

// Colours of the app theme (fill-babelek-*; same values as the film's index.html).
export const C = { fill: "#a3dab3", rim: "#338c5c", ink: "#1e3d5c", shine: "#ffffff", shadow: "#d1d1d1" };
// useStateAnimation.ts: catchlights travel this share of the pupils' way.
export const CATCHLIGHT_SHARE = 0.2;
// useStateAnimation.ts READ: the eyes run along a line while reading.
export const READ = { from: -26, to: 12, lines: [-16, -6] };
// AnimatedSvg.tsx DETAILS.appearFrom: book details fade in over the last quarter of the morph.
const APPEAR_FROM = 0.75;
const FINE_PIECES = 4;
const TIGHT = { x: 320, y: 294, size: 1408 };
// Body tilt pivots on the ground under the body centre (pose.ts POSE.ground), so the lean keeps Zusik on the floor.
export const PIVOT = [1023.5, 1531];

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smoothstep = (t) => { const x = clamp01(t); return x * x * (3 - 2 * x); };
const mix = (a, b, t) => a + (b - a) * t;
const n = (v) => (Math.round(v * 100) / 100).toString();
const fmt = (pts) => pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L ");

/** Screen mapping of the tight frame box: centre (cx, cy), edge `size` px (same as zestaw.mjs k.zusik). */
export function frameMap(cx, cy, size, tilt = 0) {
  const s = size / TIGHT.size, ox = cx - size / 2 - TIGHT.x * s, oy = cy - size / 2 - TIGHT.y * s;
  const a = (tilt * Math.PI) / 180, cos = Math.cos(a), sin = Math.sin(a);
  const rot = ([x, y]) => {
    const dx = x - PIVOT[0], dy = y - PIVOT[1];
    return [PIVOT[0] + dx * cos - dy * sin, PIVOT[1] + dx * sin + dy * cos];
  };
  return {
    s,
    outer: `translate(${n(ox)} ${n(oy)}) scale(${s.toFixed(6)})`,
    tiltAttr: tilt ? `rotate(${n(tilt)} ${PIVOT[0]} ${PIVOT[1]})` : "",
    /** reference point → screen px (with tilt) */
    toScreen: (p) => { const [x, y] = tilt ? rot(p) : p; return [ox + x * s, oy + y * s]; },
  };
}

const fineArms = {
  left: subdivide(ARM_OUTLINES.left, FINE_PIECES),
  right: subdivide(ARM_OUTLINES.right, FINE_PIECES),
};

function eye(side, look) {
  const { white, pupil, catchlight, lid } = EYES[side];
  const [lx, ly] = look;
  return `<g>
      <circle cx="${white.cx}" cy="${white.cy}" r="${white.r}" fill="${C.shine}"/>
      <ellipse cx="${n(pupil.cx + lx)}" cy="${n(pupil.cy + ly)}" rx="${pupil.rx}" ry="${pupil.ry}" fill="${C.ink}"/>
      <circle cx="${n(catchlight.cx + lx * CATCHLIGHT_SHARE)}" cy="${n(catchlight.cy + ly * CATCHLIGHT_SHARE)}" r="${catchlight.r}" fill="${C.shine}"/>
      <path d="${lid}" fill="${C.fill}"/>
    </g>`;
}

/**
 * One frame of the mascot.
 * opt.look   [x, y] pupil offset in reference units (catchlights follow 1/5)
 * opt.mouth  0–1 one talking opening: mouth-open opacity and scaleY (0.2 → 1) from the top of the shape
 * opt.tilt   degrees, clockwise, character only (the shadow stays level)
 * opt.morph  0–1(+) progress into SHAPES.book (spring overshoot allowed)
 * opt.page   false: do not draw `book-page` here (scene 26 draws it on top in screen space)
 * opt.parts  "all" (default) | "body" (everything but the face) | "face" (only the face, same transforms)
 */
export function zusikFilm(cx, cy, size, opt = {}) {
  const look = opt.look ?? [0, 0];
  const mouth = clamp01(opt.mouth ?? 0);
  const tilt = opt.tilt ?? 0;
  const shaped = opt.morph ?? 0;
  const m = frameMap(cx, cy, size, tilt);
  const book = SHAPES.book;

  const bodyD = shaped === 0 ? BODY.d
    : smoothPath(BODY_POINTS.map((p, i) => [mix(p[0], book.points[i][0], shaped), mix(p[1], book.points[i][1], shaped)]));
  const armsShown = 1 - smoothstep(shaped / 0.5);
  const arms = ["left", "right"].map((side) => {
    const root = ARM_OUTLINES[side].start;
    const d = shaped === 0 ? outlinePath(ARM_OUTLINES[side]) : outlinePath(fineArms[side], (p) => tuckArm(p, root, shaped));
    return armsShown > 0.005 ? `<path d="${d}" fill="${C.rim}"${armsShown < 1 ? ` opacity="${armsShown.toFixed(2)}"` : ""}/>` : "";
  }).join("");
  const hl = 1 - smoothstep(shaped / 0.6);
  const highlights = hl > 0.005 ? `<g${hl < 1 ? ` opacity="${hl.toFixed(2)}"` : ""}>
      <path d="${CRESCENT.d}" fill="none" stroke-width="${CRESCENT.width}" stroke-linecap="round" stroke="${C.shine}"/>
      ${DOTS.map((d) => `<ellipse cx="${d.cx}" cy="${d.cy}" rx="${d.rx}" ry="${d.ry}" fill="${C.shine}"/>`).join("")}
    </g>` : "";

  const details = smoothstep((Math.min(1, shaped) - APPEAR_FROM) / (1 - APPEAR_FROM));
  const lines = (mirror) => BOOK.lines.map(([x0, x1, y]) => mirror
    ? `<line x1="${2 * BOOK.spine - x0}" y1="${y}" x2="${2 * BOOK.spine - x1}" y2="${y}"/>`
    : `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}"/>`).join("");
  const pageInside = opt.page !== false
    ? `<path d="M ${fmt(BOOK.page)} Z" stroke-width="22" stroke-linejoin="round" fill="${C.fill}" stroke="${C.rim}"/>
       <g stroke="${C.rim}" stroke-width="20" stroke-linecap="round" opacity="0.45">${lines(false)}</g>` : "";
  const detailBook = details > 0.005 ? `<g opacity="${details.toFixed(2)}">
      <line x1="${BOOK.spine}" y1="690" x2="${BOOK.spine}" y2="1410" stroke-width="22" stroke-linecap="round" stroke="${C.rim}"/>
      <g stroke="${C.rim}" stroke-width="20" stroke-linecap="round" opacity="0.45">${lines(false)}${lines(true)}</g>
      ${pageInside}
    </g>` : "";

  const fx = mix(FACE_ORIGIN.x, book.face.x, shaped), fy = mix(FACE_ORIGIN.y, book.face.y, shaped);
  const fs = mix(1, book.face.scale, shaped);
  const open = mouth > 0.001
    ? `<path d="${MOUTH_OPEN}" fill="${C.ink}" transform="translate(0 166) scale(1 ${n(0.2 + 0.8 * mouth)}) translate(0 -166)"${mouth < 1 ? ` opacity="${Math.min(1, mouth / 0.3).toFixed(2)}"` : ""}/>` : "";
  const face = `<g transform="translate(${n(fx)} ${n(fy)})${fs !== 1 ? ` scale(${fs.toFixed(3)})` : ""}">
      ${eye("left", look)}${eye("right", look)}
      ${open}
      <path d="${MOUTH.d}" fill="none" stroke-width="${MOUTH.width}" stroke-linecap="round" stroke="${C.ink}"/>
    </g>`;

  const wide = mix(1, book.shadow, shaped);
  const parts = opt.parts ?? "all";
  if (parts === "face") return `<g transform="${m.outer}"><g${m.tiltAttr ? ` transform="${m.tiltAttr}"` : ""}>${face}</g></g>`;
  return `<g transform="${m.outer}">
      <ellipse cx="${SHADOW.cx}" cy="${SHADOW.cy}" rx="${n(SHADOW.rx * wide)}" ry="${SHADOW.ry}" fill="${C.shadow}"/>
      <g${m.tiltAttr ? ` transform="${m.tiltAttr}"` : ""}>
        ${arms}
        <path d="${bodyD}" fill="${C.fill}"/>
        <path d="${bodyD}" fill="none" stroke-width="${BODY.rimWidth}" stroke="${C.rim}"/>
        ${highlights}
        ${detailBook}
        ${parts === "body" ? "" : face}
      </g>
    </g>`;
}
