/**
 * All numbers that define Bąbelek's base pose.
 *
 * Coordinates are in the pixel space of the reference image design/mascot/base.jpg (2048 × 2048),
 * so the drawing can be compared with it 1:1. Shapes were fitted by least squares to edges measured
 * in the reference (see docs/mascot/01-design-spec.md, §3); typical error is below 1 px at this scale.
 */
import type { BabelekFrame } from "./types";

export type Point = readonly [x: number, y: number];
type Circle = { cx: number; cy: number; r: number };
type Ellipse = { cx: number; cy: number; rx: number; ry: number };

/** Both frames are square, so width and height of the SVG are always equal. */
export const VIEWBOX: Record<BabelekFrame, string> = {
  reference: "0 0 2048 2048",
  // character x 341–1707, y 311–1685 (top includes the float lift), plus a small margin
  tight: "320 294 1408 1408",
};

/** Centre of the body's bounding box. The widest row of the body (y ≈ 1000) is centred on this x. */
export const BODY_CENTER = { x: 1023.5, y: 933 };

/** One cubic Bézier segment: [first control point, second control point, end point]. */
type Curve = readonly [Point, Point, Point];

/** A closed outline: a start point, cubic segments, and optionally one straight corner before closing. */
export type Outline = { start: Point; curves: readonly Curve[]; corner?: Point };

/**
 * SVG path data of an outline. `move` can displace every point (anchors and control points alike);
 * that is how the fluid animation deforms the shapes. Every variant keeps the same commands.
 */
export function outlinePath({ start, curves, corner }: Outline, move = (point: Point) => point): string {
  const fmt = (point: Point) => move(point).map((v) => v.toFixed(1)).join(" ");
  const commands = [`M ${fmt(start)}`, ...curves.map((curve) => `C ${curve.map(fmt).join(" ")}`)];
  if (corner) commands.push(`L ${fmt(corner)}`);
  return `${commands.join(" ")} Z`;
}

/**
 * Body outline = centreline of the rim. The fill and the rim (a stroke) share this one path.
 * Five anchors, clockwise from the top: right, lower right, lower left, left. The body is fluid, so it
 * is deliberately not symmetric: the bottom sags about 50 px left of the centre line.
 */
export const BODY_OUTLINE: Outline = {
  start: [1009.4, 367.5], // top
  curves: [
    [[1261.9, 363.2], [1475.4, 581.7], [1544.2, 791.9]], // → right
    [[1634.5, 1068], [1515.7, 1239.9], [1396.1, 1342.3]], // → lower right
    [[1182.8, 1524.9], [868.2, 1548.5], [672.8, 1412.2]], // → lower left (the bottom)
    [[480.1, 1277.7], [427.4, 1004.2], [507.8, 770]], // → left
    [[578.4, 564.3], [764.3, 371.6], [1009.4, 367.5]], // → back to the top
  ],
};

export const BODY = { d: outlinePath(BODY_OUTLINE), rimWidth: 64.5 };

/** Splits a cubic that starts at `from` into two cubics at parameter `t` (de Casteljau). */
function splitCurve(from: Point, [c1, c2, to]: Curve, t: number): [Curve, Curve] {
  const lerp = (a: Point, b: Point): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const [a, b, c] = [lerp(from, c1), lerp(c1, c2), lerp(c2, to)];
  const [ab, bc] = [lerp(a, b), lerp(b, c)];
  const middle = lerp(ab, bc);
  return [
    [a, ab, middle],
    [bc, c, to],
  ];
}

/**
 * The same outline with every curve split into `pieces` shorter curves. The shape is identical, but
 * the shorter control handles let a warp (the fluid motion) follow the curve much more faithfully.
 */
export function subdivide(outline: Outline, pieces: number): Outline {
  const curves: Curve[] = [];
  let from = outline.start;
  for (const curve of outline.curves) {
    let rest = curve;
    for (let left = pieces; left > 1; left--) {
      const [head, tail] = splitCurve(from, rest, 1 / left);
      curves.push(head);
      [from, rest] = [head[2], tail];
    }
    curves.push(rest);
    from = rest[2];
  }
  return { ...outline, curves };
}

/**
 * Arms: drops hanging from the body edge. Each one starts on the body edge at y ≈ 990, leaves it
 * tangentially (so the join with the rim is seamless), bulges outward, rounds off at the tip and
 * comes back up into the notch where it meets the body. The corner closes it through a point deep
 * inside the body, so the closing edge is always hidden behind the body.
 * The arms are near mirror images, but the leaning body meets them at different heights
 * (notch at y ≈ 1210 left, ≈ 1190 right), so each has its own outline.
 */
export const ARM_OUTLINES: Readonly<Record<"left" | "right", Outline>> = {
  left: {
    start: [439.8, 990],
    curves: [
      [[446.1, 1075.7], [341.4, 1119], [341.4, 1271.8]], // outer edge, bulging out to x 341
      [[341.4, 1317.4], [400.7, 1353.6], [446.5, 1313.8]], // round tip
      [[483.8, 1281.3], [459.4, 1245.9], [488.1, 1204.8]], // inner edge up into the notch
    ],
    corner: [562.6, 1098.2], // hidden inside the body
  },
  right: {
    start: [1607.7, 986],
    curves: [
      [[1599.3, 1068.7], [1706.7, 1113.2], [1706.7, 1268.2]], // outer edge, bulging out to x 1707
      [[1706.7, 1317.2], [1639.6, 1351.5], [1596.2, 1304.5]], // round tip
      [[1564.8, 1270.5], [1591.3, 1246.2], [1554.1, 1184.2]], // inner edge up into the notch
    ],
    corner: [1487.2, 1072.8], // hidden inside the body
  },
};

export const ARM_LEFT = outlinePath(ARM_OUTLINES.left);
export const ARM_RIGHT = outlinePath(ARM_OUTLINES.right);

/** Ground shadow, centred under the body centre line with a ≈ 65 px gap below the body. */
export const SHADOW: Ellipse = { cx: 1025.4, cy: 1641.2, rx: 337.7, ry: 44 };

/** Main highlight: a thick round-capped arc on the upper left, roughly concentric with the body. */
export const CRESCENT = {
  d: "M 667.9 718.2 C 753.7 542.8 902 502.1 973.2 497.7",
  width: 76.8,
};

/** Small highlights: a slightly tall oval on the left, two round dots on the lower right. */
export const DOTS: readonly (Ellipse & { name: string })[] = [
  { name: "left", cx: 615.7, cy: 853.6, rx: 37, ry: 42.6 },
  { name: "right-upper", cx: 1427.6, cy: 1105.7, rx: 24.3, ry: 24.3 },
  { name: "right-lower", cx: 1298.5, cy: 1262.9, rx: 32, ry: 32 },
];

/**
 * Face origin: the midpoint between the two eye centres, placed relative to the body centre
 * (the face sits a little right of the body's centre line). Eyes and mouth below are relative to it.
 */
export const FACE_ORIGIN = { x: BODY_CENTER.x + 24.5, y: BODY_CENTER.y - 90.3 };

export type EyeSide = "left" | "right";

type EyeGeometry = {
  /** Round eye white. */
  white: Circle;
  /** Nearly round pupil, nudged toward the nose. */
  pupil: Ellipse;
  /** Catchlight in the pupil's upper left; it overlaps the pupil edge and merges with the eye white. */
  catchlight: Circle;
  /**
   * Lower lid: a body-coloured shape whose top edge is the soft curve that cuts the eye off at the
   * bottom (almost flat on the outer side, dipping toward the nose). It also clips the pupil.
   */
  lid: string;
};

export const EYES: Record<EyeSide, EyeGeometry> = {
  left: {
    white: { cx: -159.9, cy: 1.1, r: 135.8 },
    pupil: { cx: -121.1, cy: 8.8, rx: 76.3, ry: 84.1 },
    catchlight: { cx: -170.3, cy: -43.6, r: 25.8 },
    lid: "M -297.5 37.9 C -215.5 24.6 -133.5 52.8 -51.5 95.7 L -51.5 144.9 L -297.5 144.9 Z",
  },
  right: {
    white: { cx: 159.9, cy: -1.1, r: 135.5 },
    pupil: { cx: 141.4, cy: 5.7, rx: 77.5, ry: 83.7 },
    catchlight: { cx: 93, cy: -47.5, r: 25.7 },
    lid: "M 50.5 95.1 C 132.8 52.6 215.2 21.3 297.5 34.9 L 297.5 142.4 L 50.5 142.4 Z",
  },
};

/** Closed calm smile: a shallow symmetric curve with round caps, centred under the eyes. */
export const MOUTH = {
  d: "M -78.6 156.6 C -29 195.5 36.5 194 78.6 156.6",
  width: 27.5,
};
