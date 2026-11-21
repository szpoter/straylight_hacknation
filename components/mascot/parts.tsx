/**
 * Presentational parts of Bąbelek, in paint order (back to front).
 * Every part is its own element with a `data-part` name, so later states can animate parts independently.
 * (`data-part` instead of `id`: several mascots can share one page, and ids must be unique.)
 */
import { ARM_LEFT, ARM_RIGHT, BODY, CRESCENT, DOTS, EYES, FACE_ORIGIN, MOUTH, SHADOW, type EyeSide } from "./geometry";

/** Flat grey ellipse on the ground; the gap above it makes the bubble levitate. */
export function Shadow({ className = "" }: { className?: string }) {
  return <ellipse data-part="shadow" {...SHADOW} className={`fill-babelek-shadow ${className}`} />;
}

/** Two rim-coloured drops; drawn behind the body so their base disappears into the rim. */
export function Arms() {
  return (
    <>
      <path data-part="arm-left" d={ARM_LEFT} className="fill-babelek-rim" />
      <path data-part="arm-right" d={ARM_RIGHT} className="fill-babelek-rim" />
    </>
  );
}

/** The bubble itself: one closed path, filled, then outlined by the rim (same path, thick stroke). */
export function Body() {
  return (
    <>
      <path data-part="body" d={BODY.d} className="fill-babelek-fill" />
      <path data-part="rim" d={BODY.d} fill="none" strokeWidth={BODY.rimWidth} className="stroke-babelek-rim" />
    </>
  );
}

/** Crescent highlight (a thick round-capped arc) and three small dots. */
export function Highlights() {
  return (
    <g data-part="highlights">
      <path
        data-part="highlight"
        d={CRESCENT.d}
        fill="none"
        strokeWidth={CRESCENT.width}
        strokeLinecap="round"
        className="stroke-babelek-shine"
      />
      {DOTS.map(({ name, ...dot }) => (
        <ellipse key={name} data-part={`dot-${name}`} {...dot} className="fill-babelek-shine" />
      ))}
    </g>
  );
}

/** Eye white, pupil and catchlight, cut at the bottom by a body-coloured lower lid. */
function Eye({ side }: { side: EyeSide }) {
  const { white, pupil, catchlight, lid } = EYES[side];
  return (
    <g data-part={`eye-${side}`}>
      <circle data-part="eye-white" {...white} className="fill-babelek-shine" />
      <ellipse data-part="pupil" {...pupil} className="fill-babelek-ink" />
      <circle data-part="catchlight" {...catchlight} className="fill-babelek-shine" />
      <path data-part="lid" d={lid} className="fill-babelek-fill" />
    </g>
  );
}

/** Eyes and mouth, positioned relative to the face origin (see geometry.ts). */
export function Face() {
  return (
    <g data-part="face" transform={`translate(${FACE_ORIGIN.x} ${FACE_ORIGIN.y})`}>
      <Eye side="left" />
      <Eye side="right" />
      <path
        data-part="mouth"
        d={MOUTH.d}
        fill="none"
        strokeWidth={MOUTH.width}
        strokeLinecap="round"
        className="stroke-babelek-ink"
      />
    </g>
  );
}
