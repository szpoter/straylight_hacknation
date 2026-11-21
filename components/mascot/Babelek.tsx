import { VIEWBOX } from "./geometry";
import { Arms, Body, Face, Highlights, Shadow } from "./parts";
import type { BabelekProps } from "./types";

/**
 * Bąbelek, the app's mascot: a living soap bubble drawn as hand-built geometric SVG.
 * Phase 1 renders the base pose. Plain server-renderable SVG; the optional float is CSS only.
 */
export function Babelek({ size, className, title, float = false, frame = "tight" }: BabelekProps) {
  const a11y = title ? { role: "img", "aria-label": title } : { "aria-hidden": true };

  return (
    <svg
      viewBox={VIEWBOX[frame]}
      style={size === undefined ? undefined : { width: size }}
      className={className}
      {...a11y}
    >
      <Shadow className={float ? "origin-center transform-fill motion-safe:animate-babelek-float-shadow" : ""} />
      <g data-part="character" className={float ? "motion-safe:animate-babelek-float" : undefined}>
        <Arms />
        <Body />
        <Highlights />
        <Face />
      </g>
    </svg>
  );
}
