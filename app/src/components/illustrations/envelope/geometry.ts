/**
 * Geometry of the "sent" envelope, measured from design/envelope/reference.jpg (2048 × 2048 JPEG,
 * three keyframes side by side). Units: the envelope is 170 wide, as in the brief, so at the default
 * size one unit is one CSS pixel. In the reference one unit is ≈ 3.385 px.
 * Origin: the envelope's top-left corner (top edge = the flap's fold line), y grows downward.
 */

export type Point = readonly [number, number];

/** Envelope body: 170 × 131 (the reference is 1.3:1, the brief said about 170 × 110). */
export const ENVELOPE = {
  width: 170,
  height: 131,
  /** corner radius, measured on the closed envelope (≈ 32 px in the reference) */
  radius: 9.5,
  /** every outline (≈ 8 px in the reference) */
  stroke: 2.4,
};

const { width: W, height: H, radius: R } = ENVELOPE;
/** Where the diagonals leave a rounded corner: the middle (45°) of its arc. */
const CORNER_INSET = R - R / Math.SQRT2;
const HINGE_LEFT: Point = [CORNER_INSET, CORNER_INSET];
const HINGE_RIGHT: Point = [W - CORNER_INSET, CORNER_INSET];

/** The flap is as deep open (tip above the top edge) as closed (tip below it). */
export const FLAP = {
  depth: 87,
  /** rounding of the tip (≈ 22 px in the reference) */
  tipRadius: 6.6,
};

/** The front pocket's V opening, from the top corners down to a rounded notch. */
const POCKET = {
  vertex: [W / 2, 71] as Point,
  /** rounding of the notch (≈ 54 px in the reference) */
  radius: 15.8,
};

/** The letter: an A4 portrait sheet, 112 wide, centred over the envelope. */
export const LETTER = {
  x: (W - 112) / 2,
  width: 112,
  height: 112 * Math.SQRT2,
  radius: 7,
  /** top edge at the start (above the envelope) and when fully inside */
  startTop: -79,
  endTop: 6,
  /** text lines: distance from the sheet's top, start and end (from the sheet's left edge) */
  lines: [
    [24.4, 17.7, 66.5],
    [35.9, 17.7, 94.5],
    [47.4, 17.7, 94.5],
    [59.1, 17.7, 66.5],
  ] as const,
  lineWidth: 4.3,
};

/** Round stamp on the closed flap, with a tick (points relative to the stamp's centre). */
export const STAMP = {
  center: [W / 2, 71.6] as Point,
  radius: 25.3,
  tick: [
    [-12.5, 0.4],
    [-4.3, 8.5],
    [12.1, -8.8],
  ] as const,
  tickWidth: 5.8,
};

/** Drawing area: room for the open flap above and the 4 px "sent" nudge to the right. */
export const VIEW_BOX = { x: -6, y: -90, width: 182, height: 224 };

const fmt = (n: number) => +n.toFixed(2);
const pt = ([x, y]: Point) => `${fmt(x)} ${fmt(y)}`;

/**
 * Rounds the corner at `corner` between straight edges coming from `from` and going to `to`.
 * Returns where the arc starts and ends and the SVG arc command between them.
 */
function fillet(from: Point, corner: Point, to: Point, radius: number) {
  const ax = from[0] - corner[0];
  const ay = from[1] - corner[1];
  const bx = to[0] - corner[0];
  const by = to[1] - corner[1];
  const la = Math.hypot(ax, ay);
  const lb = Math.hypot(bx, by);
  const angle = Math.acos(Math.max(-1, Math.min(1, (ax * bx + ay * by) / (la * lb))));
  // a nearly straight corner (the flap passing the fold line) needs no rounding
  const cut = angle > Math.PI - 1e-3 ? 0 : radius / Math.tan(angle / 2);
  const start: Point = [corner[0] + (ax / la) * cut, corner[1] + (ay / la) * cut];
  const end: Point = [corner[0] + (bx / lb) * cut, corner[1] + (by / lb) * cut];
  // turning clockwise on screen (y down) is SVG's positive sweep
  const sweep = -ax * by + ay * bx > 0 ? 1 : 0;
  return { start, end, arc: `L ${pt(start)} A ${radius} ${radius} 0 0 ${sweep} ${pt(end)}` };
}

const notch = fillet(HINGE_RIGHT, POCKET.vertex, HINGE_LEFT, POCKET.radius);

/** Inside of the envelope, seen through the opening. No outline: the pocket and flap draw the edges. */
export const BACK_PATH = `M 0 ${R} A ${R} ${R} 0 0 1 ${R} 0 H ${W - R} A ${R} ${R} 0 0 1 ${W} ${R} V ${H - R}
  A ${R} ${R} 0 0 1 ${W - R} ${H} H ${R} A ${R} ${R} 0 0 1 0 ${H - R} Z`;

/** Front pocket: the rounded body without its top, cut by the V opening. */
export const POCKET_PATH = [
  `M ${pt(HINGE_LEFT)} A ${R} ${R} 0 0 0 0 ${R}`,
  `V ${H - R} A ${R} ${R} 0 0 0 ${R} ${H} H ${W - R} A ${R} ${R} 0 0 0 ${W} ${H - R}`,
  `V ${R} A ${R} ${R} 0 0 0 ${pt(HINGE_RIGHT)}`,
  notch.arc,
  "Z",
].join(" ");

/** Bottom flap's folds: from the bottom corners up to where the notch's rounding begins. */
export const FOLDS_PATH = [
  `M ${pt([CORNER_INSET, H - CORNER_INSET])} L ${pt(notch.end)}`,
  `M ${pt([W - CORNER_INSET, H - CORNER_INSET])} L ${pt(notch.start)}`,
].join(" ");

/** Height of the flap's tip for a fold progress: 0 open (tip up), 1 closed (tip down). */
export const flapTip = (fold: number) => -FLAP.depth * Math.cos(Math.PI * fold);

/**
 * The flap as a filled shape: the fold line with its rounded corners, then the two sides to the tip.
 * Open, the corners lie inside the triangle; closed, they round off the envelope's top corners.
 */
export function flapPath(tipY: number) {
  const tip = fillet(HINGE_RIGHT, [W / 2, tipY], HINGE_LEFT, FLAP.tipRadius);
  return `M ${pt(HINGE_LEFT)} A ${R} ${R} 0 0 1 ${R} 0 H ${W - R} A ${R} ${R} 0 0 1 ${pt(HINGE_RIGHT)} ${tip.arc} Z`;
}

/** Only the two sides of the open flap: the fold line itself is not drawn while it is open. */
export function flapSides(tipY: number) {
  const tip = fillet(HINGE_RIGHT, [W / 2, tipY], HINGE_LEFT, FLAP.tipRadius);
  return `M ${pt(HINGE_RIGHT)} ${tip.arc} L ${pt(HINGE_LEFT)}`;
}

/** The stamp's tick as one stroke, so it can be drawn from start to end. */
export const TICK_PATH =
  "M " + STAMP.tick.map(([x, y]) => pt([STAMP.center[0] + x, STAMP.center[1] + y])).join(" L ");
