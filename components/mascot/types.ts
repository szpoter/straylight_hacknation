import type { MotionValue } from "motion/react";

/**
 * Which part of the drawing canvas the SVG shows.
 * - "tight": a square crop around the character and its shadow (default, for use in the app).
 * - "reference": the full 2048 × 2048 canvas of design/mascot/base.jpg, 1:1 with the reference
 *   (used by the preview page and the visual diff).
 */
export type BabelekFrame = "tight" | "reference";

export type BabelekProps = {
  /** Width in px (number) or any CSS length; height follows the viewBox ratio. Omit to size with CSS. */
  size?: number | string;
  className?: string;
  /** Accessible name. Without it the mascot is treated as decorative (aria-hidden). */
  title?: string;
  /**
   * Idle life: floating, a fluid body, blinking and glancing around. Off by default.
   * Runs in a small client component; with reduced motion the mascot keeps its calm base pose.
   */
  animated?: boolean;
  frame?: BabelekFrame;
  /**
   * Travelling drop (needs `animated`): how far the mascot has turned into an elongated drop,
   * 0 normal, 1 full drop, below 0 a landing squash. Drive it from an animation or from scroll.
   */
  travel?: MotionValue<number>;
  /** Direction of travel in degrees, with y pointing down: 0 right, 90 down, 180 left. */
  heading?: MotionValue<number>;
};
