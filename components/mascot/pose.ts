/**
 * Pose warps for the state animations: bending the arms and sagging the body.
 * Like the fluid and travel motion, these move points of the outlines; angles are in degrees,
 * distances in viewBox units (pixels of the 2048 px reference).
 */
import { BODY_CENTER, type Point } from "./geometry";

export const POSE = {
  /** The body outline, approximated by an ellipse, to tell how far a point sticks out of the body. */
  body: { rx: 586, ry: 598 },
  /** Over this distance outside the body edge an arm goes from not bending at all to bending fully. */
  bendZone: 140,
  /** Bottom of the body: the sag pivots here, so Zusik droops without leaving the ground. */
  ground: 1531,
  /** A full sag lowers the top by this share of the height and widens the body by this share. */
  sag: { lower: 0.08, widen: 0.05 },
};

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
const smoothstep = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/** How far a point lies outside the body edge (negative inside). */
function outsideBody([x, y]: Point): number {
  const [dx, dy] = [x - BODY_CENTER.x, y - BODY_CENTER.y];
  const angle = Math.atan2(dy, dx);
  const edge = 1 / Math.hypot(Math.cos(angle) / POSE.body.rx, Math.sin(angle) / POSE.body.ry);
  return Math.hypot(dx, dy) - edge;
}

/**
 * Bends an arm like a flexible tentacle: points inside the body stay put (so the arm stays attached),
 * points further out turn around the arm's root by up to `degrees` (positive = clockwise on screen).
 */
export function bendArm(point: Point, root: Point, degrees: number): Point {
  if (degrees === 0) return point;
  const turn = toRadians(degrees) * smoothstep(outsideBody(point) / POSE.bendZone);
  const [dx, dy] = [point[0] - root[0], point[1] - root[1]];
  const [cos, sin] = [Math.cos(turn), Math.sin(turn)];
  return [root[0] + dx * cos - dy * sin, root[1] + dx * sin + dy * cos];
}

/** Sag (0–1): the body droops toward the ground and spreads a little, as in a sigh. */
export function sagWarp([x, y]: Point, amount: number): Point {
  if (amount === 0) return [x, y];
  const lower = 1 - amount * POSE.sag.lower;
  const widen = 1 + amount * POSE.sag.widen;
  return [BODY_CENTER.x + (x - BODY_CENTER.x) * widen, POSE.ground - (POSE.ground - y) * lower];
}

/**
 * Arm angle that makes an arm hanging straight down point toward `direction` (degrees, y down:
 * 0 right, 90 down, 180 left), as a "raise" in degrees outward from the body (0 = hanging).
 */
export function raiseToward(side: "left" | "right", direction: number): number {
  const d = ((direction % 360) + 360) % 360;
  const raise = side === "right" ? 90 - (d > 180 ? d - 360 : d) : d - 90;
  return Math.min(140, Math.max(0, raise));
}

/** On screen the left arm turns clockwise to rise outward, the right arm counter-clockwise. */
export const armTurn = (side: "left" | "right", raise: number) => (side === "left" ? raise : -raise);
