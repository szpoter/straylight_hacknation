// 26 · Skąd Zusik to wie (50–52 s, film frames 1500–1559). Author b24.
// 0 = 25/59. 1–7: the same mascot flows into the `reading` book (app spring MORPH.into, sampled from f).
// 8–12: the right page (`book-page`) swings out, its outer lower corner reaching the start of the reference link.
// 12–18: the same light page unfolds into the source card (150,182)–(1130,552) rx 35; the rest of the shot sinks
// into mint. 19–29: the mint rule grows under "jednocześnie". 30–59: still. Pure function of f.
import { BOOK } from "../../../../../app/src/components/mascot/babelek/shapes.ts";
import { MASCOT, LOOK_LINK, layout25, linkMarkup, scene as scene25 } from "../25/scene.mjs";
import { C, READ, frameMap, zusikFilm } from "../25/zusik-ruch.mjs";

const INK = "#283754", MUTED = "#5E697F", SURFACE = "#F5FAF7", OUTLINE = "#D4D7DD", MINT = "#A6D0B8";
export const CARD = { x0: 150, y0: 182, x1: 1130, y1: 552, rx: 35 };
export const RULE = { x: 227, y: 429, w: 273, h: 7 };
// First sentence of kp-art182-1a-par6 (app/corpus/marta/fragments.jsonl), split after "mogą" and "oboje".
export const QUOTE = ["„Z urlopu rodzicielskiego mogą", "jednocześnie", " korzystać oboje", "pracownicy – rodzice dziecka.”"];
export const PUBLISHER = "Sejm RP · Dz.U. 2026 poz. 1245";
const CORNER_TARGET = [514, 494]; // just above-left of the link's first letter (518, 519; cap top ≈ 496)

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const span = (f, a, b) => clamp01((f - a) / (b - a));
const smooth = (t) => { const x = clamp01(t); return x * x * (3 - 2 * x); };
const easeOut = (t) => 1 - (1 - t) ** 3;
const softLand = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : (1 - Math.exp(-3.41 * t)) / (1 - Math.exp(-3.41)));
const mix = (a, b, t) => a + (b - a) * t;
const n = (v) => (Math.round(v * 100) / 100).toString();
const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
const mixColor = (a, b, t) => "#" + hex(a).map((v, i) => Math.round(mix(v, hex(b)[i], t)).toString(16).padStart(2, "0")).join("");

/** App MORPH.into spring (stiffness 140, damping 14, mass 1) from rest, sampled at film time; settled exactly at f=18. */
export function morphAt(f) {
  if (f <= 1) return 0;
  const t = (f - 1) / 30, w0 = Math.sqrt(140), z = 14 / (2 * w0), wd = w0 * Math.sqrt(1 - z * z);
  const x = 1 - Math.exp(-z * w0 * t) * (Math.cos(wd * t) + ((z * w0) / wd) * Math.sin(wd * t));
  return mix(x, 1, smooth(span(f, 13, 18)));
}

function lookAt26(f) {
  if (f <= 8) return LOOK_LINK;
  const back = smooth(span(f, 8, 11)); // READ.backSeconds, to the start of a line
  const read = span(f, 11, 18); // one line, linear as in the app
  const start = [mix(LOOK_LINK[0], READ.from, back), mix(LOOK_LINK[1], READ.lines[1], back)];
  return [mix(start[0], READ.to, read), mix(start[1], READ.lines[1], read)];
}

// ---- page → card polygon -------------------------------------------------------------------
const SIDE_POINTS = 40;
function resample(poly, count) { // open polyline → count points from first to last (inclusive of first only)
  const seg = poly.slice(1).map((p, i) => Math.hypot(p[0] - poly[i][0], p[1] - poly[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  const out = [];
  let k = 0, walked = 0;
  for (let i = 0; i < count; i++) {
    const target = (i * total) / count;
    while (k < seg.length - 1 && walked + seg[k] < target) walked += seg[k++];
    const t = seg[k] ? (target - walked) / seg[k] : 0;
    out.push([mix(poly[k][0], poly[k + 1][0], t), mix(poly[k][1], poly[k + 1][1], t)]);
  }
  return out;
}
const arcPts = (cx, cy, r, a0, a1, steps = 8) =>
  Array.from({ length: steps + 1 }, (_, i) => { const a = ((a0 + ((a1 - a0) * i) / steps) * Math.PI) / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });
const { x0, y0, x1, y1, rx } = CARD;
// Four sides, clockwise from the top-left, each = straight edge + the rounded corner after it.
const CARD_SIDES = [
  [[x0 + rx, y0], [x1 - rx, y0], ...arcPts(x1 - rx, y0 + rx, rx, -90, 0).slice(1)],
  [[x1, y0 + rx], [x1, y1 - rx], ...arcPts(x1 - rx, y1 - rx, rx, 0, 90).slice(1)],
  [[x1 - rx, y1], [x0 + rx, y1], ...arcPts(x0 + rx, y1 - rx, rx, 90, 180).slice(1)],
  [[x0, y1 - rx], [x0, y0 + rx], ...arcPts(x0 + rx, y0 + rx, rx, 180, 270).slice(1)],
].map((side) => resample(side, SIDE_POINTS));

/** The right page in screen space, swung out by `a` (0–1) toward the link. */
function pageAt(map, a) {
  const pts = BOOK.page.map((p) => map.toScreen(p));
  const corner = map.toScreen(BOOK.page[6]);
  const d = [CORNER_TARGET[0] - corner[0], CORNER_TARGET[1] - corner[1]];
  const outer = BOOK.page[6][0] - BOOK.spine;
  const warp = (ref, scr) => {
    const w = clamp01((ref[0] - BOOK.spine) / outer), v = clamp01((ref[1] - 644) / (1384 - 644));
    return [scr[0] + d[0] * w * a, scr[1] + d[1] * w * v * a];
  };
  return {
    points: pts.map((s, i) => warp(BOOK.page[i], s)),
    lines: BOOK.lines.map(([lx0, lx1, ly]) => [warp([lx0, ly], map.toScreen([lx0, ly])), warp([lx1, ly], map.toScreen([lx1, ly]))]),
  };
}
const PAGE_SIDES = (p) => [p.slice(0, 5), p.slice(4, 7), p.slice(6, 11), [p[10], p[0]]].map((side) => resample(side, SIDE_POINTS));
const pathOf = (pts) => "M" + pts.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L") + "Z";

function cardContent(rule) {
  return `<g fill="${INK}">
      <text x="225" y="269" font-family="Inter,sans-serif" font-size="29" fill="${MUTED}">${PUBLISHER}</text>
      <g font-family="Domine,Georgia,serif" font-size="47" letter-spacing="-0.6">
        <text x="225" y="353">${QUOTE[0]}</text>
        <text x="225" y="416"><tspan textLength="275" lengthAdjust="spacingAndGlyphs">${QUOTE[1]}</tspan>${QUOTE[2]}</text>
        <text x="225" y="475">${QUOTE[3]}</text>
      </g>
    </g>
    ${rule > 0.002 ? `<rect x="${RULE.x}" y="${RULE.y}" width="${n(RULE.w * rule)}" height="${RULE.h}" rx="3.5" fill="${MINT}"/>` : ""}`;
}

export function scene(f) {
  if (f === 0) return scene25(59);
  const F = Math.min(f, 30); // 30–59 identical
  const morph = morphAt(F);
  const swing = smooth(span(F, 8, 12));
  const unfold = smooth(span(F, 12, 18));
  const mint = smooth(span(F, 11, 18));
  const rule = softLand(span(F, 19, 29));
  const cy = MASCOT.cy + MASCOT.drop;
  const map = frameMap(MASCOT.cx, cy, MASCOT.size, MASCOT.tilt);

  // under the card: shot 25 layout + the mascot as a book (hidden under mint from 18 on)
  // (the face stays above the page, as in the app where `book-page` lies under the face)
  const fade = (s) => (mint > 0 ? `<g opacity="${n(1 - mint)}">${s}</g>` : s);
  const zOpt = { look: lookAt26(F), tilt: MASCOT.tilt, morph, page: false };
  const under = mint < 1
    ? `${layout25(1)}${mint > 0 ? `<rect width="1280" height="720" fill="${SURFACE}" opacity="${n(mint)}"/>` : ""}
       ${fade(zusikFilm(MASCOT.cx, cy, MASCOT.size, zOpt))}`
    : `<rect width="1280" height="720" fill="${SURFACE}"/>`;
  // The face over the page fades out while the page swings toward the viewer (9–12); below, the face drawn
  // with the body stays, so the lifting page covers the right eye instead of passing under it.
  const over = (1 - mint) * (1 - smooth(span(F, 9, 12)));
  const face = over > 0.005 ? `<g opacity="${n(over)}">${zusikFilm(MASCOT.cx, cy, MASCOT.size, { ...zOpt, parts: "face" })}</g>` : "";

  // the page: same opacity rule as `detail-book` (AnimatedSvg DETAILS.appearFrom 0.75)
  const shown = smooth((Math.min(1, morph) - 0.75) / 0.25);
  let page = "", clip = "";
  if (F >= 18) {
    page = `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" rx="${rx}" fill="#FFFFFF" stroke="${OUTLINE}" stroke-width="2"/>`;
  } else if (shown > 0.005) {
    const p = pageAt(map, swing);
    const from = PAGE_SIDES(p.points);
    const poly = from.flatMap((side, k) => side.map((pt, i) => [mix(pt[0], CARD_SIDES[k][i][0], unfold), mix(pt[1], CARD_SIDES[k][i][1], unfold)]));
    const d = pathOf(poly);
    const sw = mix(22 * map.s, 2, unfold);
    page = `<g${shown < 1 ? ` opacity="${shown.toFixed(2)}"` : ""}>
        <path d="${d}" fill="${mixColor(C.fill, "#ffffff", unfold)}" stroke="${mixColor(C.rim, OUTLINE, unfold)}" stroke-width="${n(sw)}" stroke-linejoin="round"/>
        ${unfold < 0.99 ? `<g stroke="${C.rim}" stroke-width="${n(20 * map.s)}" stroke-linecap="round" opacity="${n(0.45 * (1 - unfold))}">
          ${p.lines.map(([a, b]) => `<line x1="${n(a[0])}" y1="${n(a[1])}" x2="${n(b[0])}" y2="${n(b[1])}"/>`).join("")}</g>` : ""}
      </g>`;
    clip = d;
  }
  const textOn = smooth(span(F, 16, 18));
  const content = textOn > 0
    ? (clip ? `<defs><clipPath id="s26-karta"><path d="${clip}"/></clipPath></defs>
        <g clip-path="url(#s26-karta)" opacity="${n(textOn)}">${cardContent(rule)}</g>`
      : cardContent(rule))
    : "";
  return `${under}${page}${face}${content}${linkMarkup(1)}`;
}
