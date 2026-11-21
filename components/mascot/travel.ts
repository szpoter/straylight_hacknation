/**
 * Travel shape: while Bąbelek moves from one place to another it turns into an elongated drop.
 *
 * `amount` 0 is the normal mascot, 1 a full drop: the front stays round, the back is pulled out into
 * a tapering tail, the body gets a little thinner and shifts forward, and the arms tuck into the body.
 * Negative amounts squash it along the heading instead (used for a jelly-like landing).
 * `heading` is the direction of travel in degrees, with y pointing down: 0 right, 90 down, 180 left.
 * Like the fluid motion, it is a warp of the drawing plane, so body, rim, arms and face stay together.
 */
import { BODY_CENTER, type Point } from "./geometry";

export const TRAVEL = {
  /** Body radius used to measure distances (≈ half the body width at the reference scale). */
  radius: 590,
  /** How far the back is pulled out into a tail, as a share of the radius. */
  stretch: 0.8,
  /** How much thinner the drop is across the heading. */
  thin: 0.22,
  /** How much the tail narrows toward its end. */
  taper: 0.7,
  /** How far the whole drop leans forward, as a share of the radius. */
  lead: 0.25,
  /** Landing squash (negative amounts): shorter along the heading, wider across it. */
  squash: 0.35,
  /** The arms are fully tucked into the body once the drop is this far formed. */
  armsGoneAt: 0.5,
};

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Where a point ends up when the mascot is `amount` of the way to a drop heading in `heading` degrees. */
export function travelWarp([x, y]: Point, amount: number, heading: number): Point {
  if (amount === 0) return [x, y];
  const [cos, sin] = [Math.cos(toRadians(heading)), Math.sin(toRadians(heading))];
  const [dx, dy] = [x - BODY_CENTER.x, y - BODY_CENTER.y];
  let along = dx * cos + dy * sin; // positive = in front of the centre
  let across = -dx * sin + dy * cos;

  if (amount > 0) {
    // 0 at the centre line, 1 at the back edge; squared, so the round head flows smoothly into the tail
    const back = Math.max(0, -along / TRAVEL.radius) ** 2;
    along += amount * TRAVEL.radius * (TRAVEL.lead - TRAVEL.stretch * back);
    across *= (1 - amount * TRAVEL.thin) * (1 - amount * TRAVEL.taper * back);
  } else {
    along *= 1 + amount * TRAVEL.squash;
    across *= 1 - amount * TRAVEL.squash * 0.8;
  }
  return [BODY_CENTER.x + along * cos - across * sin, BODY_CENTER.y + along * sin + across * cos];
}

/** Arms tuck into the body as the drop forms: every arm point slides toward the arm's root. */
export function tuckArm([x, y]: Point, root: Point, amount: number): Point {
  const t = Math.min(1, Math.max(0, amount / TRAVEL.armsGoneAt));
  const keep = 1 - t * t * (3 - 2 * t);
  return [root[0] + (x - root[0]) * keep, root[1] + (y - root[1]) * keep];
}

/**
 * The ground shadow follows the drop: it slides under the drop's middle and stretches with it
 * (only the part of the heading that runs along the ground counts).
 */
export function travelShadow(amount: number, heading: number) {
  const ground = Math.abs(Math.cos(toRadians(heading)));
  const shift = amount > 0 ? amount * TRAVEL.radius * (TRAVEL.lead - TRAVEL.stretch / 2) : 0;
  return {
    dx: shift * Math.cos(toRadians(heading)),
    scale: 1 + amount * ground * (amount > 0 ? TRAVEL.stretch / 2 : TRAVEL.squash),
  };
}
