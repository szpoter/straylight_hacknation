/**
 * Fluid body motion: Bąbelek's outline flows like a drop of liquid.
 *
 * The motion is a warp of the drawing plane: every point is pushed along its direction from the body
 * centre, by an amount that depends only on that direction, plus a sideways lean that depends on height.
 * Body, rim and arms are warped alike, so the arms ride on the moving body and always stay attached.
 * On top of a gentle breathing and lean, random waves travel along the outline: from the top down both
 * sides, from the bottom up, or once around the body. Distances are in viewBox units, times in seconds.
 */
import { BODY_CENTER, DOTS, outlinePath, type Outline, type Point } from "./geometry";

type Range = readonly [min: number, max: number];

export const FLUID = {
  /** Squash and stretch of the top and the bottom. */
  breathe: { amount: 10, seconds: 4 },
  /** The bottom sways sideways (the top a little the other way); two periods, so it never quite repeats. */
  lean: { amount: 30, seconds: [9, 5.3] as const },
  waves: {
    /** A new wave starts after a random pause, so waves overlap and the body is never still. */
    pause: [0.9, 2.2] as Range,
    /** How long a wave takes to travel. */
    seconds: [2.4, 4] as Range,
    /** How far it pushes the outline at its peak. */
    amount: [12, 22] as Range,
    /** Angular width of the bulge, in degrees. */
    width: [26, 40] as Range,
    /** Sometimes a wave pushes the outline in instead of out. */
    dentChance: 0.3,
  },
  /** Highlights are reflections on the surface, so they move with it, a bit less. */
  highlightShare: 0.7,
};

/**
 * One bulge (or dent, when `amount` is negative) travelling along the outline.
 * Angles are in degrees around the body centre, with y pointing down: 0° right, 90° bottom, 270° top.
 */
export type Pulse = { start: number; seconds: number; from: number; travel: number; width: number; amount: number };

const TOP = 270;
const BOTTOM = 90;
const TAU = 2 * Math.PI;
/** The lean acts below y 1220 (most at the bottom), the counter-lean above y 700 (most at the top). */
const LEAN = { from: 1220, bottom: 1531, counterFrom: 700, top: 335, counter: 0.3 };

export const between = ([min, max]: Range, random = Math.random) => min + random() * (max - min);
const smoothstep = (t: number) => t * t * (3 - 2 * t);
/** Signed difference of two angles, in (-180, 180]. */
const angleDiff = (a: number, b: number) => ((((a - b) % 360) + 540) % 360) - 180;

/** A new random wave starting at `now`: top to bottom down both sides, bottom to top, or once around. */
export function randomWave(now: number, random = Math.random): Pulse[] {
  const { seconds, amount, width, dentChance } = FLUID.waves;
  const sign = random() < dentChance ? -1 : 1;
  const pulse = { start: now, seconds: between(seconds, random), width: between(width, random), amount: sign * between(amount, random) };
  const jitter = between([-20, 20], random);
  const kind = random();
  if (kind < 0.4) {
    return [{ ...pulse, from: TOP + jitter, travel: 180 }, { ...pulse, from: TOP + jitter, travel: -180 }];
  }
  if (kind < 0.6) {
    return [{ ...pulse, from: BOTTOM + jitter, travel: 180 }, { ...pulse, from: BOTTOM + jitter, travel: -180 }];
  }
  const direction = random() < 0.5 ? -1 : 1;
  return [{ ...pulse, from: between([0, 360], random), travel: direction * between([200, 320], random) }];
}

/** Whether a pulse is still running at `time`. */
export const isRunning = (pulse: Pulse, time: number) => time < pulse.start + pulse.seconds;

/** Outward push of one pulse at `angle`: it fades in and out while its peak glides along the outline. */
function pulseAt(pulse: Pulse, angle: number, time: number): number {
  const progress = (time - pulse.start) / pulse.seconds;
  if (progress <= 0 || progress >= 1) return 0;
  const peak = pulse.from + pulse.travel * smoothstep(progress);
  const distance = angleDiff(angle, peak) / pulse.width;
  return pulse.amount * Math.sin(Math.PI * progress) * Math.exp(-distance * distance);
}

/** How far a point is pushed at `time` by the breathing, the lean and the running pulses. */
export function fluidOffset([x, y]: Point, time: number, pulses: readonly Pulse[]): Point {
  const theta = Math.atan2(y - BODY_CENTER.y, x - BODY_CENTER.x);
  const angle = (theta * 180) / Math.PI;

  let radial = FLUID.breathe.amount * Math.cos(2 * theta) * Math.sin((TAU * time) / FLUID.breathe.seconds);
  for (const pulse of pulses) radial += pulseAt(pulse, angle, time);

  const [slow, fast] = FLUID.lean.seconds;
  const sway = FLUID.lean.amount * (0.7 * Math.sin((TAU * time) / slow) + 0.3 * Math.sin((TAU * time) / fast));
  const below = Math.max(0, (y - LEAN.from) / (LEAN.bottom - LEAN.from));
  const above = Math.max(0, (LEAN.counterFrom - y) / (LEAN.counterFrom - LEAN.top));
  const lean = sway * (below ** 1.5 - LEAN.counter * above);

  return [radial * Math.cos(theta) + lean, radial * Math.sin(theta)];
}

/** Path data of an outline (the body or an arm) warped by the fluid motion at `time`. */
export function fluidPath(outline: Outline, time: number, pulses: readonly Pulse[]): string {
  return outlinePath(outline, (point) => {
    const [dx, dy] = fluidOffset(point, time, pulses);
    return [point[0] + dx, point[1] + dy];
  });
}

/** Points that drag each highlight along (keys are `data-part` names): the middle of the crescent and each dot's centre. */
export const HIGHLIGHT_ANCHORS: Readonly<Record<string, Point>> = {
  highlight: [826, 544],
  ...Object.fromEntries(DOTS.map((dot) => [`dot-${dot.name}`, [dot.cx, dot.cy] as const])),
};
