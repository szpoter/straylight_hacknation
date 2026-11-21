import { AnimatedSvg } from "./AnimatedSvg";
// app/: zamiast Tailwinda klasy maskotki z mascot.css, pod klasą "babelek" na <svg>
import "./mascot.css";
import { DetailsBehind, DetailsFront } from "./details";
import { VIEWBOX } from "./geometry";
import { Arms, Body, Face, Highlights, Shadow } from "./parts";
import type { BabelekProps } from "./types";

/**
 * Bąbelek, the app's mascot (called Zusik in the product): a living soap bubble drawn as hand-built
 * geometric SVG. Static by default (plain server-rendered SVG, no client JavaScript). With `animated`,
 * the same drawing is handed to a small client component that brings it to life (see AnimatedSvg).
 */
export function Babelek({ size, className, title, animated = false, frame = "tight", ...motion }: BabelekProps) {
  const svgProps = {
    viewBox: VIEWBOX[frame],
    style: size === undefined ? undefined : { width: size },
    className: className ? `babelek ${className}` : "babelek",
    ...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true }),
  };
  const drawing = (
    <>
      <Shadow />
      {/* stage: moves the whole character for hops and the entrance; character: floats, nods, shrinks */}
      <g data-part="stage">
        <g data-part="character" className="origin-bottom transform-fill">
          <Arms />
          {animated && <DetailsBehind />}
          <Body />
          <Highlights />
          {animated && <DetailsFront />}
          <Face />
        </g>
      </g>
    </>
  );

  return animated ? (
    <AnimatedSvg {...svgProps} {...motion}>
      {drawing}
    </AnimatedSvg>
  ) : (
    <svg {...svgProps}>{drawing}</svg>
  );
}
