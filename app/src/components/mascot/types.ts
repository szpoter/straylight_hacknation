import type { MotionValue } from "motion/react";

/**
 * Which part of the drawing canvas the SVG shows.
 * - "tight": a square crop around the character and its shadow (default, for use in the app).
 * - "reference": the full 2048 × 2048 canvas of design/mascot/base.jpg, 1:1 with the reference
 *   (used by the preview page and the visual diff).
 */
export type BabelekFrame = "tight" | "reference";

/**
 * What Zusik (the mascot in the product) is doing. Each value has its own animation:
 * - "available":   1. ready to help; calm idle, glancing around.
 * - "checking":    2. checking something in general; a bulge circles the body.
 * - "reading":     2. reading the draft; Zusik turns into an open book, turns pages and reads along.
 * - "searching":   2. searching the ZUS materials; Zusik turns into a folder whose index cards pop up.
 * - "calculating": 2. running the calculator; Zusik turns into a calculator, digits run, keys light up.
 * - "writing":     3. entering a change into a field; Zusik turns into a pencil and scribbles.
 *                     (To write into a field on screen, move the mascot there while it writes.)
 * - "answering":   4. giving the answer; the mouth talks.
 * - "confirming":  4. confirming a saved change; a quick liquid tick, then a nod and smiling eyes.
 * - "waiting":     5. waiting for the parent; a quick liquid "?", then leans toward the input and ripples
 *                     with every keystroke, calms down when nothing happens, and hops now and then.
 * - "attention":   6. an operation failed; a quick liquid "!", then droops with worried eyes, shakes
 *                     once and points at the fix.
 * - "folder":         Zusik turns into a closed folder (no index cards); its cover opens a little once,
 *                     then the folder stands still and only blinks.
 */
export type ZusikState =
  | "available"
  | "checking"
  | "reading"
  | "searching"
  | "calculating"
  | "writing"
  | "answering"
  | "confirming"
  | "waiting"
  | "attention"
  | "folder";

export type BabelekProps = {
  /** Width in px (number) or any CSS length; height follows the viewBox ratio. Omit to size with CSS. */
  size?: number | string;
  className?: string;
  /** Accessible name. Without it the mascot is treated as decorative (aria-hidden). */
  title?: string;
  /**
   * Idle life: floating, a fluid body, blinking and glancing around. Off by default.
   * Runs in a small client component; with reduced motion the mascot keeps its calm base pose.
   * Everything below needs `animated`.
   */
  animated?: boolean;
  frame?: BabelekFrame;
  /**
   * Travelling drop: how far the mascot has turned into an elongated drop,
   * 0 normal, 1 full drop, below 0 a landing squash. Drive it from an animation or from scroll.
   */
  travel?: MotionValue<number>;
  /** Direction of travel in degrees, with y pointing down: 0 right, 90 down, 180 left. */
  heading?: MotionValue<number>;
  /** The assistant state (default "available"). */
  state?: ZusikState;
  /**
   * Where the related UI is, as a direction in degrees from the mascot (y down: 0 right, 180 left,
   * 270 up): the invitation bubble, the field being changed, the input, or the retry button.
   * Zusik looks, leans, waves or points that way. Default 225 (up and to the left, for a mascot
   * sitting in the bottom-right corner).
   */
  toward?: number;
  /** "available": when this turns true, Zusik greets the invitation (looks, hops, waves once). */
  inviting?: boolean;
  /** "waiting": change this number on every keystroke in the input; Zusik ripples in reply. */
  typingTick?: number;
  /** Flow in from below (as a drop) when the mascot first appears. */
  entrance?: boolean;
  /**
   * "writing" and "calculating": the object does its work one time, then rests (default false: the
   * work loops for as long as the state lasts). The pencil draws three quick strokes one under another
   * and stands still on its tip; the calculator runs its digits and lights two or three keys, then keeps
   * the last value. Afterwards Zusik only blinks. Entering the state again (a state change or a new
   * mount) plays the work again; with reduced motion there is no work at all.
   */
  once?: boolean;
};
