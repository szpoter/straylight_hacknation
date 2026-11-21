/**
 * Geometry of the folder with three cards, measured from design/folder/reference.jpg (2048 × 2048).
 *
 * Units: the folder is 180 wide, as in the animation brief, so at the default size 1 unit = 1 px.
 * In the reference the folder is 801 px wide (outline centre to centre), so 1 unit = 4.45 reference px.
 * Origin: the middle of the folder's bottom edge. y grows downward, so everything above it is negative.
 * Coordinates are on the outline's centre line.
 */

export type Point = readonly [x: number, y: number];

/** Everything that can show up during the loop, plus the outline's half width. */
export const VIEWBOX = "-100 -198 200 200";

/** Outline width: 8 reference px. At the default size it matches the 1.8 px line of the app's icons. */
export const STROKE = 1.8;

/** Corner radius of the folder (36 reference px). */
const RADIUS = 8;

/** Half the folder's width, and the top of the back wall right of the tab. */
const HALF = 90;
const BACK_TOP = -142;

/**
 * Back wall with the tab on its top left. The tab is 16 units tall; its right side is a soft S that
 * starts at x = −34 and lands on the back wall at x = −11 (reference: x 390 → 490, max slope ≈ 1.2).
 */
export const BACK_PATH = [
  `M ${-HALF} -${RADIUS}`,
  `L ${-HALF} -150`,
  `A ${RADIUS} ${RADIUS} 0 0 1 -82 -158`,
  "L -34 -158",
  `C -24.6 -158 -20.4 ${BACK_TOP} -11 ${BACK_TOP}`,
  `L 82 ${BACK_TOP}`,
  `A ${RADIUS} ${RADIUS} 0 0 1 ${HALF} -134`,
  `L ${HALF} -${RADIUS}`,
  `A ${RADIUS} ${RADIUS} 0 0 1 82 0`,
  "L -82 0",
  `A ${RADIUS} ${RADIUS} 0 0 1 ${-HALF} -${RADIUS}`,
  "Z",
].join(" ");

/**
 * Front flap, hinged at the bottom edge. Closed it covers the back wall up to y = −122.5. Tipped open
 * toward the viewer, its top drops to −99 and gets wider (perspective): the reference's open flap is
 * 197 units wide at the top. The bottom edge stays where it is, so the flap stays attached.
 */
const FLAP = {
  closed: { top: -122.5, halfWidth: HALF },
  open: { top: -99, halfWidth: 98.5 },
};

const mix = (from: number, to: number, amount: number) => from + (to - from) * amount;

/**
 * A closed polygon with rounded corners: each corner is cut `radius` units back along both edges and
 * joined with a quadratic curve through the corner. Same commands for every input, so it can animate.
 */
function roundedPolygon(points: readonly Point[], radius: number): string {
  const towards = ([x, y]: Point, [tx, ty]: Point): Point => {
    const length = Math.hypot(tx - x, ty - y);
    return [x + ((tx - x) * radius) / length, y + ((ty - y) * radius) / length];
  };
  const format = ([x, y]: Point) => `${x.toFixed(2)} ${y.toFixed(2)}`;
  const corners = points.map((corner, index) => {
    const before = points[(index + points.length - 1) % points.length];
    const after = points[(index + 1) % points.length];
    return { from: towards(corner, before), corner, to: towards(corner, after) };
  });
  const [first, ...rest] = corners;
  return [
    `M ${format(first.to)}`,
    ...rest.map(({ from, corner, to }) => `L ${format(from)} Q ${format(corner)} ${format(to)}`),
    `L ${format(first.from)} Q ${format(first.corner)} ${format(first.to)}`,
    "Z",
  ].join(" ");
}

/** The flap's outline; `open` goes from 0 (closed) to 1 (tipped toward the viewer). */
export function flapPath(open: number): string {
  const top = mix(FLAP.closed.top, FLAP.open.top, open);
  const half = mix(FLAP.closed.halfWidth, FLAP.open.halfWidth, open);
  return roundedPolygon(
    [
      [-half, top],
      [half, top],
      [HALF, 0],
      [-HALF, 0],
    ],
    RADIUS,
  );
}

/**
 * A card, drawn around its pivot: the middle of its bottom edge, where it turns when the cards fan out.
 * 77.5 × 108 (reference: 345 px wide, the bottom is hidden in the folder), corner radius 5.
 */
export const CARD = { x: -38.75, y: -108, width: 77.5, height: 108, radius: 5 };

/** Lines of "text" on each card: thick grey bars with round ends, 13 units apart, the last one shorter. */
export const CARD_LINES = {
  width: 6,
  rows: [
    { y: -87.6, from: -23.85, to: 23.85 },
    { y: -74.5, from: -23.85, to: 23.85 },
    { y: -61.3, from: -23.85, to: 3.85 },
  ],
};

/** The tick on the middle card, below the lines: a short stroke down, then a long one up. */
export const TICK = { path: "M -10.65 -36.3 L -3.95 -30 L 10.45 -45.1", width: 4.5 };

/**
 * Where each card's pivot sits. Hidden, the cards are stacked in the middle with their tops at −120,
 * just under the closed flap's edge. Open, they form the reference's fan: the middle card upright with
 * its top at −193.5, the side cards 23 units out, 12 units lower and turned by 16.7°.
 * Paint order: left, right, then the middle card on top.
 */
export const CARD_REST_Y = -12;

export const FAN = [
  { name: "left", dx: -23, rise: 61.5, angle: -16.7 },
  { name: "right", dx: 23, rise: 61.5, angle: 16.7 },
  { name: "middle", dx: 0, rise: 73.5, angle: 0 },
] as const;
