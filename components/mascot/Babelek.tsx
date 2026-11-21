import { AnimatedSvg } from "./AnimatedSvg";
import { VIEWBOX } from "./geometry";
import { Arms, Body, Face, Highlights, Shadow } from "./parts";
import type { BabelekProps } from "./types";

/**
 * Bąbelek, the app's mascot: a living soap bubble drawn as hand-built geometric SVG.
 * Static by default (plain server-rendered SVG, no client JavaScript). With `animated`, the same
 * drawing is handed to a small client component that brings it to life (see AnimatedSvg).
 */
export function Babelek({ size, className, title, animated = false, frame = "tight", travel, heading }: BabelekProps) {
  const svgProps = {
    viewBox: VIEWBOX[frame],
    style: size === undefined ? undefined : { width: size },
    className,
    ...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true }),
  };
  const drawing = (
    <>
      <Shadow />
      <g data-part="character">
        <Arms />
        <Body />
        <Highlights />
        <Face />
      </g>
    </>
  );

  return animated ? (
    <AnimatedSvg {...svgProps} travel={travel} heading={heading}>
      {drawing}
    </AnimatedSvg>
  ) : (
    <svg {...svgProps}>{drawing}</svg>
  );
}
