import { AnimatedSvg } from "./AnimatedSvg";
import { VIEWBOX } from "./geometry";
import { Arms, Body, Face, Highlights, Shadow } from "./parts";
import type { BabelekProps } from "./types";

/**
 * Bąbelek, the app's mascot: a living soap bubble drawn as hand-built geometric SVG.
 * Static by default (plain server-rendered SVG, no client JavaScript). With `animated`, the same
 * drawing is handed to a small client component that brings it to life (see AnimatedSvg).
 */
export function Babelek({ size, className, title, animated = false, frame = "tight" }: BabelekProps) {
  const Svg = animated ? AnimatedSvg : "svg";
  const a11y = title ? { role: "img", "aria-label": title } : { "aria-hidden": true };

  return (
    <Svg
      viewBox={VIEWBOX[frame]}
      style={size === undefined ? undefined : { width: size }}
      className={className}
      {...a11y}
    >
      <Shadow />
      <g data-part="character">
        <Arms />
        <Body />
        <Highlights />
        <Face />
      </g>
    </Svg>
  );
}
