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
  /** Subtle idle float. Off by default; never runs when the user prefers reduced motion. */
  float?: boolean;
  frame?: BabelekFrame;
};
