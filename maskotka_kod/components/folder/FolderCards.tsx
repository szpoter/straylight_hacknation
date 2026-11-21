"use client";

import { useAnimationFrame, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { BACK_PATH, CARD, CARD_LINES, FAN, STROKE, TICK, VIEWBOX, flapPath } from "./geometry";
import { FINAL_POSE, FINAL_TIME, LOOP, cardTransform, folderTransform, poseAt, type Pose } from "./timeline";

export type FolderCardsProps = {
  /** Width (px or any CSS length); the height follows. At 200 px the folder is 180 px wide, as in the brief. */
  size?: number | string;
  className?: string;
  /** Accessible name. Without it the drawing is decorative (aria-hidden). */
  title?: string;
  /** Play the animation (default). Off, it shows the final frame. Reduced motion also shows the final frame. */
  animated?: boolean;
  /** Repeat the 4.5 s loop (default). Off, it plays once (2.6 s) and stays on the final frame. */
  loop?: boolean;
  /** Show one moment of the loop, in seconds (for storyboards and screenshots). */
  at?: number;
};

/**
 * Colors: DESIGN.md tokens (CSS variables from the app's globals.css). The illustration sits on the
 * `secondary` green band, so the folder is warm (manila) instead of green, and the green tick is the one
 * strong accent.
 */
const COLOR = {
  ink: "var(--color-on-surface)",
  // do weryfikacji: ZUS amber from DESIGN.md (Colors); only its pastel version is a token (tertiary)
  back: "#fab856",
  flap: "var(--color-tertiary)",
  card: "var(--color-surface)",
  line: "var(--color-outline)",
  tick: "var(--color-primary)",
};

/** The elements that move, so every frame can update them without re-rendering React. */
type Parts = {
  folder: SVGGElement | null;
  flap: SVGPathElement | null;
  cards: (SVGGElement | null)[];
  tick: SVGPathElement | null;
};

/** The attributes that change during the loop, for one pose. Used for the first render and for every frame. */
function attributesFor(pose: Pose) {
  return {
    folder: folderTransform(pose.breathe),
    flap: flapPath(pose.flap),
    cards: pose.cards.map((card, index) => cardTransform(index, card)),
    // the tick is drawn with a dash that grows along it; hidden entirely before it starts (round caps)
    tickOffset: (1 - pose.tick).toFixed(3),
    tickOpacity: pose.tick > 0 ? "1" : "0",
  };
}

function paint(parts: Parts, pose: Pose) {
  const attributes = attributesFor(pose);
  parts.folder?.setAttribute("transform", attributes.folder);
  parts.flap?.setAttribute("d", attributes.flap);
  parts.cards.forEach((card, index) => card?.setAttribute("transform", attributes.cards[index]));
  parts.tick?.setAttribute("stroke-dashoffset", attributes.tickOffset);
  parts.tick?.setAttribute("opacity", attributes.tickOpacity);
}

/**
 * A folder that opens, lets three cards rise into a fan, ticks the middle one, then tidies them away.
 * Hand-built SVG (see geometry.ts); the timing is a pure function of time (see timeline.ts) and Motion's
 * frame loop applies it. The clock only runs while the drawing is on screen.
 */
export function FolderCards({ size, className, title, animated = true, loop = true, at }: FolderCardsProps) {
  const svg = useRef<SVGSVGElement>(null);
  const parts = useRef<Parts>({ folder: null, flap: null, cards: [], tick: null });
  const elapsed = useRef(0);
  const reduceMotion = useReducedMotion();
  const inView = useInView(svg);
  const moving = animated && at === undefined;
  const playing = moving && !reduceMotion && inView;

  // the first render is the same on the server and the client: the loop's start when moving, otherwise a still
  const first = attributesFor(at !== undefined ? poseAt(at) : moving ? poseAt(0) : FINAL_POSE);

  useEffect(() => {
    if (moving && reduceMotion) paint(parts.current, FINAL_POSE);
  }, [moving, reduceMotion]);

  useAnimationFrame((_, delta) => {
    if (!playing || (!loop && elapsed.current >= FINAL_TIME)) return;
    elapsed.current += delta / 1000;
    paint(parts.current, poseAt(loop ? elapsed.current % LOOP : Math.min(elapsed.current, FINAL_TIME)));
  });

  return (
    <svg
      ref={svg}
      viewBox={VIEWBOX}
      style={size === undefined ? undefined : { width: size }}
      className={className}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
    >
      {/* folder: breathes around the middle of its bottom edge (the origin) */}
      <g
        ref={(element) => {
          parts.current.folder = element;
        }}
        data-part="folder"
        transform={first.folder}
        stroke={COLOR.ink}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      >
        <path data-part="back" d={BACK_PATH} fill={COLOR.back} />

        {/* cards sit between the back wall and the flap; each is drawn around its pivot (see CARD) */}
        {FAN.map((card, index) => (
          <g
            key={card.name}
            ref={(element) => {
              parts.current.cards[index] = element;
            }}
            data-part={`card-${card.name}`}
            transform={first.cards[index]}
          >
            <rect x={CARD.x} y={CARD.y} width={CARD.width} height={CARD.height} rx={CARD.radius} fill={COLOR.card} />
            <g stroke={COLOR.line} strokeWidth={CARD_LINES.width} strokeLinecap="round">
              {CARD_LINES.rows.map((row) => (
                <line key={row.y} x1={row.from} x2={row.to} y1={row.y} y2={row.y} />
              ))}
            </g>
            {card.name === "middle" && (
              <path
                ref={(element) => {
                  parts.current.tick = element;
                }}
                data-part="tick"
                d={TICK.path}
                fill="none"
                stroke={COLOR.tick}
                strokeWidth={TICK.width}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1 1"
                strokeDashoffset={first.tickOffset}
                opacity={first.tickOpacity}
              />
            )}
          </g>
        ))}

        <path
          ref={(element) => {
            parts.current.flap = element;
          }}
          data-part="flap"
          d={first.flap}
          fill={COLOR.flap}
        />
      </g>
    </svg>
  );
}
