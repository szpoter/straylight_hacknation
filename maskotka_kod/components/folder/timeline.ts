/**
 * The folder's 4.5 s loop as a pure function of time: `poseAt(t)` says where every part is at second t.
 * The steps follow the animation brief; distances and angles come from the reference (see geometry.ts).
 */
import { cubicBezier, easeInOut } from "motion/react";
import { CARD_REST_Y, FAN } from "./geometry";

/** Length of one loop in seconds. */
export const LOOP = 4.5;

/** The brief's steps, in seconds from the start of the loop. */
const STEPS = {
  /** 1. The closed folder barely breathes: scale 1 → 1.01 → 1. */
  breathe: { from: 0, to: 0.6, amount: 0.01 },
  /** 2. The flap tips toward the viewer around its bottom edge. */
  flapOpens: { from: 0.6, to: 1.4 },
  /** 3. The cards rise one after another, 0.2 s apart (left, right, then the middle one on top). */
  cardsRise: { from: 1.2, each: 0.8, stagger: 0.2 },
  /** 4. When the middle card has risen, a tick is drawn on it in one quick pen stroke. */
  tick: { from: 2.4, to: 2.6 },
  /** 5. Pause: the cards float 2 units up and back down. */
  hover: { from: 2.6, to: 3.6, lift: 2 },
  /** 6. The cards slide back in and the flap closes; then the loop starts again. */
  cardsSink: { from: 3.6, to: 4.2 },
  flapCloses: { from: 3.95, to: 4.5 },
};

/** Cards rise with a slight overshoot (about 3 %), so they settle instead of stopping dead. */
const RISE_EASE = cubicBezier(0.3, 1.25, 0.5, 1);
/** The fan opens over the last 70 % of the rise, once the cards are clear of the folder's edge. */
const FAN_FROM = 0.3;

export type CardPose = {
  /** How far out of the folder: 0 hidden, 1 risen (a little more while overshooting). */
  out: number;
  /** Extra vertical offset while hovering (negative is up). */
  hover: number;
};

export type Pose = {
  /** Scale of the whole folder around the middle of its bottom edge. */
  breathe: number;
  /** Flap: 0 closed, 1 tipped open. */
  flap: number;
  /** One entry per card, in the order of FAN. */
  cards: readonly CardPose[];
  /** How much of the tick is drawn, 0 to 1. */
  tick: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const between = (time: number, from: number, to: number) => clamp01((time - from) / (to - from));

/** Where everything is at `time` seconds (any number; the loop repeats every LOOP seconds). */
export function poseAt(time: number): Pose {
  const t = ((time % LOOP) + LOOP) % LOOP;
  const { breathe, flapOpens, cardsRise, tick, hover, cardsSink, flapCloses } = STEPS;
  const sinking = easeInOut(between(t, cardsSink.from, cardsSink.to));
  const hovering = -hover.lift * Math.sin(Math.PI * between(t, hover.from, hover.to));

  return {
    breathe: 1 + breathe.amount * Math.sin(Math.PI * between(t, breathe.from, breathe.to)),
    flap: easeInOut(between(t, flapOpens.from, flapOpens.to)) - easeInOut(between(t, flapCloses.from, flapCloses.to)),
    cards: FAN.map((_, index) => {
      const start = cardsRise.from + index * cardsRise.stagger;
      return { out: RISE_EASE(between(t, start, start + cardsRise.each)) - sinking, hover: hovering };
    }),
    tick: easeInOut(between(t, tick.from, tick.to)),
  };
}

/**
 * The final frame: folder open, the cards fanned out, the tick on the middle card. It is the moment the
 * pause starts, when everything has arrived and the cards have not started floating yet.
 */
export const FINAL_TIME = STEPS.hover.from;
export const FINAL_POSE = poseAt(FINAL_TIME);

/** SVG transform of the whole folder (breathing around the bottom edge's middle, the origin). */
export const folderTransform = (breathe: number) => `scale(${breathe.toFixed(4)})`;

/** SVG transform of a card: it rises from the stack and, near the top, turns and slides into the fan. */
export function cardTransform(index: number, { out, hover }: CardPose): string {
  const { dx, rise, angle } = FAN[index];
  const fanned = easeInOut(clamp01((out - FAN_FROM) / (1 - FAN_FROM)));
  const x = dx * fanned;
  const y = CARD_REST_Y - rise * out + hover;
  return `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${(angle * fanned).toFixed(2)})`;
}
