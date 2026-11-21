/**
 * Shapes Zusik can turn into: an open book (reading), a folder (searching), a calculator (calculating),
 * a pencil (writing), a tick (confirming), and liquid "?" and "!" (waiting, attention).
 *
 * Every outline is resampled to the same number of points, evenly along its length, clockwise from the
 * top, so the body can flow into a shape point by point. Coordinates are in the 2048 px reference space,
 * with the shapes standing on the same ground as the body (its bottom is at y 1531).
 */
import { BODY_OUTLINE, FACE_ORIGIN, subdivide, type Point } from "./geometry";

/** Points per outline. Enough for smooth curves and gently rounded corners. */
export const OUTLINE_POINTS = 96;

export type ShapeName = "book" | "folder" | "calculator" | "pencil" | "tick" | "question" | "exclamation";

export type Shape = {
  /** The outline, resampled to OUTLINE_POINTS points. */
  points: Point[];
  /** Where the face sits on the shape, and how big it is (1 = as on Zusik). */
  face: { x: number; y: number; scale: number };
  /** Width of the ground shadow compared with Zusik's. */
  shadow: number;
};

// ---------- outline helpers ----------

const lerp = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Signed area; positive for an outline that runs clockwise on screen (y down). */
const area = (points: Point[]) =>
  points.reduce((sum, [x, y], i) => {
    const [nx, ny] = points[(i + 1) % points.length];
    return sum + x * ny - nx * y;
  }, 0) / 2;

/** `count` points evenly spaced along a closed polyline. */
function resample(points: Point[], count: number): Point[] {
  const closed = [...points, points[0]];
  const lengths = closed.slice(1).map((p, i) => Math.hypot(p[0] - closed[i][0], p[1] - closed[i][1]));
  const total = lengths.reduce((a, b) => a + b, 0);
  const result: Point[] = [];
  let segment = 0;
  let walked = 0;
  for (let k = 0; k < count; k++) {
    const target = (k * total) / count;
    while (segment < lengths.length - 1 && walked + lengths[segment] < target) walked += lengths[segment++];
    result.push(lerp(closed[segment], closed[segment + 1], Math.min(1, (target - walked) / lengths[segment])));
  }
  return result;
}

/** Points on a circular arc around `centre`, from one angle to another (degrees, y down), ends included. */
function arc(centre: Point, radius: number, from: number, to: number, steps: number): Point[] {
  return Array.from({ length: steps + 1 }, (_, k) => {
    const angle = ((from + ((to - from) * k) / steps) * Math.PI) / 180;
    return [centre[0] + radius * Math.cos(angle), centre[1] + radius * Math.sin(angle)] as Point;
  });
}

/** Clockwise, evenly resampled, starting at the point straight above the centre, like Zusik's own outline. */
function normalise(points: Point[]): Point[] {
  const clockwise = area(points) < 0 ? [...points].reverse() : points;
  const even = resample(clockwise, OUTLINE_POINTS * 4);
  const cx = even.reduce((s, p) => s + p[0], 0) / even.length;
  const cy = even.reduce((s, p) => s + p[1], 0) / even.length;
  const top = even.reduce((best, p, i) => {
    const off = Math.abs(Math.atan2(p[1] - cy, p[0] - cx) + Math.PI / 2);
    return off < best.off ? { i, off } : best;
  }, { i: 0, off: Infinity }).i;
  return resample([...even.slice(top), ...even.slice(0, top)], OUTLINE_POINTS);
}

/** Points along a cubic Bézier (without its end point). */
function bezierPoints(from: Point, c1: Point, c2: Point, to: Point, count: number): Point[] {
  return Array.from({ length: count }, (_, k) => {
    const t = k / count;
    const u = 1 - t;
    return [
      u * u * u * from[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * to[0],
      u * u * u * from[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * to[1],
    ] as Point;
  });
}

/** Outline of a thick stroke along an open polyline, with round caps (for the tick and the "?"). */
function strokeOutline(path: Point[], width: number): Point[] {
  const half = width / 2;
  const normal = (i: number): Point => {
    const a = path[Math.max(0, i - 1)];
    const b = path[Math.min(path.length - 1, i + 1)];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return [-(b[1] - a[1]) / length, (b[0] - a[0]) / length];
  };
  const side = (sign: number) => path.map((p, i) => [p[0] + sign * half * normal(i)[0], p[1] + sign * half * normal(i)[1]] as Point);
  // a half circle round the end of the stroke, from one side to the other
  const cap = (centre: Point, from: Point, steps = 10): Point[] => {
    const start = (Math.atan2(from[1] - centre[1], from[0] - centre[0]) * 180) / Math.PI;
    return arc(centre, half, start, start - 180, steps).slice(1, -1);
  };
  const left = side(1);
  const right = side(-1).reverse();
  return [...left, ...cap(path[path.length - 1], left[left.length - 1]), ...right, ...cap(path[0], right[right.length - 1])];
}

/** A rounded rectangle as a polyline (corner radius r). */
function roundedRect(x0: number, y0: number, x1: number, y1: number, r: number): Point[] {
  const corner = (cx: number, cy: number, start: number) =>
    Array.from({ length: 6 }, (_, k) => {
      const angle = start + (Math.PI / 2) * (k / 5);
      return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as Point;
    });
  return [
    ...corner(x1 - r, y0 + r, -Math.PI / 2),
    ...corner(x1 - r, y1 - r, 0),
    ...corner(x0 + r, y1 - r, Math.PI / 2),
    ...corner(x0 + r, y0 + r, Math.PI),
  ];
}

/** Zusik's own outline (the rim centreline), as points. */
export const BODY_POINTS: Point[] = normalise(
  subdivide(BODY_OUTLINE, 8).curves.flatMap((curve, i, curves) => {
    const from = i === 0 ? BODY_OUTLINE.start : curves[i - 1][2];
    return bezierPoints(from, curve[0], curve[1], curve[2], 6);
  }),
);

/**
 * Closed path through the points: a smooth curve (Catmull-Rom turned into cubic Béziers).
 * Used for the body while it is animated, so it can flow into any of the shapes.
 */
export function smoothPath(points: readonly Point[]): string {
  const n = points.length;
  const at = (i: number) => points[(i + n) % n];
  const fmt = (p: Point) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
  let d = `M ${fmt(points[0])}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1: Point = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: Point = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${fmt(c1)} ${fmt(c2)} ${fmt(p2)}`;
  }
  return `${d} Z`;
}

// ---------- the shapes ----------

/** Open book, facing us: two slightly curved pages meeting at the spine (x 1024). */
export const BOOK = {
  spine: 1024,
  /** The right page, from the spine round to the spine (its mirror image is the left page). */
  page: [
    [1024, 660], [1200, 604], [1370, 588], [1560, 604], [1716, 644],
    [1722, 1010], [1716, 1384], [1560, 1352], [1370, 1342], [1200, 1372], [1024, 1440],
  ] as Point[],
  /** Text lines on each page, below the face: [x from, x to, y]. */
  lines: [[1110, 1600, 1150], [1110, 1560, 1215], [1110, 1600, 1280]] as const,
};
const bookOutline: Point[] = [
  ...BOOK.page.slice(0, -1),
  ...[...BOOK.page].reverse().slice(0, -1).map(([x, y]) => [2 * BOOK.spine - x, y] as Point),
];

/** Folder with a tab on its top left; index cards peek out of its top edge. */
export const FOLDER = {
  body: [420, 640, 1630, 1462] as const,
  cards: [[930, 1120], [1150, 1340], [1370, 1560]] as const,
  cardTop: 540,
};
const folderOutline: Point[] = [
  [1024, 640], [1560, 640], [1610, 650], [1630, 700], [1632, 1050], [1630, 1410], [1600, 1452], [1560, 1462],
  [1024, 1464], [490, 1462], [450, 1452], [420, 1410], [416, 1050], [420, 680], [430, 600], [470, 566],
  [800, 566], [850, 590], [880, 630], [920, 640],
];

/** Calculator standing upright: a display at the top, the face, then a 3 × 3 keypad. */
export const CALCULATOR = {
  body: [630, 420, 1470, 1500] as const,
  display: [710, 480, 1390, 650] as const,
  keys: { columns: [830, 1050, 1270], rows: [1150, 1260, 1370], r: 40 },
};

/** Pencil, tip down to the left, at 35° below the horizontal; the eraser end up to the right. */
export const PENCIL = { centre: [1040, 1010] as Point, angle: 145, length: 1520, width: 420, tipLength: 430 };
/** A point on the pencil: `along` its axis (toward the tip is positive) and `across` it. */
export const pencilPoint = (along: number, across: number): Point => {
  const a = (PENCIL.angle * Math.PI) / 180;
  return [PENCIL.centre[0] + along * Math.cos(a) - across * Math.sin(a), PENCIL.centre[1] + along * Math.sin(a) + across * Math.cos(a)];
};
/** The graphite tip, where the pencil writes. */
export const PENCIL_TIP = pencilPoint(PENCIL.length / 2, 0);
const pencilOutline: Point[] = (() => {
  const [half, w] = [PENCIL.length / 2, PENCIL.width / 2];
  const shoulder = half - PENCIL.tipLength;
  // the rounded eraser end, from the (0, w) side round to the (0, -w) side
  const eraser = Array.from({ length: 9 }, (_, k) => {
    const angle = Math.PI / 2 + (Math.PI * k) / 8;
    return pencilPoint(-half + w + w * Math.cos(angle), w * Math.sin(angle));
  });
  return [pencilPoint(half, 0), pencilPoint(shoulder, w), pencilPoint(0, w), ...eraser, pencilPoint(0, -w), pencilPoint(shoulder, -w)];
})();

/**
 * Tick: a 300 px thick stroke from (600, 930) down to the corner (880, 1250) and up to (1470, 600), with
 * round ends and a rounded outer corner. Built directly: the inner corner is where the two inner edges meet.
 */
const tickOutline: Point[] = [
  [487, 1029], // outer edge of the short arm, at its start
  ...arc([880, 1250], 150, 138.8, 42.2, 8), // rounded outer corner
  [1581, 701], // outer edge of the long arm, at its end
  ...arc([1470, 600], 150, 42.2, -137.8, 10).slice(1, -1), // round end of the long arm
  [1359, 499], // inner edge of the long arm
  [882, 1024], // inner corner
  [713, 831], // inner edge of the short arm
  ...arc([600, 930], 150, -41.2, -221.2, 10).slice(1, -1), // round end of the short arm
];

/** The dot under "?" and "!": a separate round drop that drips out of the stroke down to its place. */
export const DOT = { centre: [1024, 1400] as Point, r: 130, dripFrom: 1150 };

/** Question mark: a hook curling from the left over the top, down into the stem. */
const questionOutline = strokeOutline(
  [
    ...bezierPoints([690, 720], [690, 380], [1360, 380], [1360, 700], 14),
    ...bezierPoints([1360, 700], [1360, 900], [1030, 880], [1030, 1110], 10),
    [1030, 1110] as Point,
  ],
  290,
);

/** Exclamation mark: a bar wider at the top, rounded at both ends. */
const exclamationOutline: Point[] = [
  ...Array.from({ length: 9 }, (_, k) => {
    const angle = Math.PI + (Math.PI * k) / 8;
    return [1024 + 190 * Math.cos(angle), 560 + 190 * Math.sin(angle)] as Point;
  }),
  [1190, 760], [1140, 1080],
  ...Array.from({ length: 9 }, (_, k) => {
    const angle = (Math.PI * k) / 8;
    return [1024 + 120 * Math.cos(angle), 1110 + 120 * Math.sin(angle)] as Point;
  }),
  [908, 1080], [858, 760],
];

const make = (outline: Point[], face: Shape["face"], shadow: number): Shape => ({ points: normalise(outline), face, shadow });

export const SHAPES: Record<ShapeName, Shape> = {
  book: make(bookOutline, { x: FACE_ORIGIN.x - 24, y: FACE_ORIGIN.y, scale: 0.95 }, 1.25),
  folder: make(folderOutline, { x: FACE_ORIGIN.x, y: FACE_ORIGIN.y + 40, scale: 0.95 }, 1.1),
  calculator: make(roundedRect(...CALCULATOR.body, 110), { x: FACE_ORIGIN.x - 8, y: FACE_ORIGIN.y + 20, scale: 0.85 }, 0.8),
  pencil: make(pencilOutline, { x: 1150, y: 880, scale: 0.5 }, 1.1),
  tick: make(tickOutline, { x: 1240, y: 800, scale: 0.45 }, 1),
  question: make(questionOutline, { x: 1025, y: 470, scale: 0.42 }, 0.6),
  exclamation: make(exclamationOutline, { x: 1024, y: 580, scale: 0.45 }, 0.5),
};
