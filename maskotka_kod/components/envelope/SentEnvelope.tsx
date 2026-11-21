"use client";

import {
  animate,
  motion,
  motionValue,
  useReducedMotion,
  useTransform,
  type AnimationSequence,
  type MotionValue,
} from "motion/react";
import { useEffect, useId, useState } from "react";
import {
  BACK_PATH,
  ENVELOPE,
  FOLDS_PATH,
  LETTER,
  POCKET_PATH,
  STAMP,
  TICK_PATH,
  VIEW_BOX,
  flapPath,
  flapSides,
  flapTip,
} from "./geometry";

/**
 * Colors: DESIGN.md tokens (CSS variables from the app's globals.css). The illustration sits on the
 * `secondary` green band, so the envelope is warm (tertiary) instead of the reference's green, drawn in
 * the ink color like the folder, and the green stamp is the one strong accent.
 * `--envelope-paper` (and `--envelope-line`, `--envelope-stamp`) on any parent recolor it.
 */
const PAPER = "var(--envelope-paper, var(--color-tertiary))";
const COLOR = {
  paper: PAPER,
  // do weryfikacji: the inside is the paper mixed with white, 55 % as measured in the reference
  inside: `color-mix(in srgb, ${PAPER} 55%, var(--color-background))`,
  line: "var(--envelope-line, var(--color-on-surface))",
  stamp: "var(--envelope-stamp, var(--color-primary))",
  tick: "var(--color-on-primary)",
  letter: "var(--color-surface)",
  letterLine: "var(--color-outline)",
};

/** Everything that moves, at the first frame (letter above the open envelope) and the last (sealed). */
const START = { letter: LETTER.startTop, fold: 0, stampOpacity: 0, stampDrop: -30, stampScale: 1.15, stampTurn: 0, tick: 0 };
const END = { letter: LETTER.endTop, fold: 1, stampOpacity: 1, stampDrop: 0, stampScale: 1, stampTurn: -8, tick: 1 };
type Pose = typeof START;
type Values = { [K in keyof Pose]: MotionValue<number> } & { nudge: MotionValue<number>; opacity: MotionValue<number> };

/** "Sent": the envelope moves this far right and back once it is sealed. */
const NUDGE = 4;
/** One loop, in seconds. */
const LOOP = 5;
/**
 * The brief's last step (4.2–5.0 s) fades out and brings the first frame back. The loop is played from
 * 4.7 s, the moment the first frame fades back in, so the jump to the start happens while nothing shows.
 */
const FADE_IN = LOOP - 4.7;

/** The brief's timeline, in seconds. Each value has a single step: the sequence holds it before and after. */
function timeline(v: Values, loop: boolean): AnimationSequence {
  const t = loop ? FADE_IN : 0;
  const sequence: AnimationSequence = [
    // 0.5–1.5: the letter slides down into the envelope, behind its front
    [v.letter, END.letter, { at: t + 0.5, duration: 1, ease: "easeInOut" }],
    // 1.5–2.1: the flap turns over the top edge and closes
    [v.fold, END.fold, { at: t + 1.5, duration: 0.6, ease: "easeInOut" }],
    // 2.1–2.6: the stamp falls and, landing, shrinks from 1.15 to 1 and turns −8°
    [v.stampOpacity, END.stampOpacity, { at: t + 2.1, duration: 0.12 }],
    [v.stampDrop, END.stampDrop, { at: t + 2.1, duration: 0.3, ease: "easeIn" }],
    [v.stampScale, END.stampScale, { at: t + 2.4, duration: 0.2, ease: "easeOut" }],
    [v.stampTurn, END.stampTurn, { at: t + 2.4, duration: 0.2, ease: "easeOut" }],
    // 2.5–2.9: the tick is drawn from start to end
    [v.tick, END.tick, { at: t + 2.5, duration: 0.4, ease: "easeInOut" }],
    // 2.9–4.2: pause; at its start the envelope nudges right and back, as if sent
    [v.nudge, [0, NUDGE, 0], { at: t + 3, duration: 0.7, times: [0, 0.35, 1], ease: ["easeOut", "easeInOut"] }],
  ];
  if (loop) {
    // 4.7–5.0 (played first): the first frame fades in; 4.2–4.7: everything fades out
    const fadeOut = (t + 4.2) / LOOP;
    sequence.push([v.opacity, [0, 1, 1, 0], { at: 0, duration: LOOP, times: [0, FADE_IN / LOOP, fadeOut, 1] }]);
  }
  return sequence;
}

function setPose(v: Values, pose: Pose) {
  for (const key of Object.keys(pose) as (keyof Pose)[]) v[key].set(pose[key]);
  v.nudge.set(0);
  v.opacity.set(1);
}

export type SentEnvelopeProps = {
  /** Width (px or any CSS length); the height follows. At 182 px (default) the envelope is 170 px wide, as in the brief. */
  size?: number | string;
  className?: string;
  /** Accessible name. Without it the drawing is decorative (aria-hidden). */
  title?: string;
  /** Play the animation (default). Off, it shows the final frame. Reduced motion also shows the final frame. */
  animated?: boolean;
  /** Repeat the 5 s loop (default). Off, it plays once (3.7 s) and stays on the final frame. */
  loop?: boolean;
  /** Show one moment of the loop, in seconds (for storyboards and screenshots). */
  at?: number;
};

/**
 * A letter slides into an envelope, the flap closes, a green stamp with a tick seals it and the
 * envelope nudges as if sent.
 */
export function SentEnvelope({
  size = VIEW_BOX.width,
  className,
  title,
  animated = true,
  loop = true,
  at,
}: SentEnvelopeProps) {
  const [v] = useState<Values>(() => ({
    letter: motionValue(START.letter),
    fold: motionValue(START.fold),
    stampOpacity: motionValue(START.stampOpacity),
    stampDrop: motionValue(START.stampDrop),
    stampScale: motionValue(START.stampScale),
    stampTurn: motionValue(START.stampTurn),
    tick: motionValue(START.tick),
    nudge: motionValue(0),
    opacity: motionValue(1),
  }));
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const still = at !== undefined;
    if (!still && (reduceMotion || !animated)) {
      setPose(v, END);
      return;
    }
    setPose(v, START);
    const controls = animate(timeline(v, still || loop), loop && !still ? { repeat: Infinity } : {});
    if (still) {
      controls.pause();
      controls.time = (at + FADE_IN) % LOOP;
    }
    return () => controls.stop();
  }, [v, animated, loop, at, reduceMotion]);

  const flap = useTransform(() => flapPath(flapTip(v.fold.get())));
  const sides = useTransform(() => flapSides(flapTip(v.fold.get())));
  // The flap is behind the letter (showing its inside) until it passes the fold line, then in front.
  const flapOpen = useTransform(v.fold, [0.4999, 0.5], [1, 0]);
  const flapClosed = useTransform(v.fold, [0.4999, 0.5], [0, 1]);
  // A round cap would leave a dot before the tick starts, so it appears with the first bit of line.
  const tickShown = useTransform(v.tick, [0, 0.02], [0, 1]);

  const clipId = `envelope-${useId().replace(/[^\w-]/g, "")}`;
  const { stroke } = ENVELOPE;
  const outline = { strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round" } as const;

  return (
    <svg
      viewBox={`${VIEW_BOX.x} ${VIEW_BOX.y} ${VIEW_BOX.width} ${VIEW_BOX.height}`}
      width={size}
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        {/* The letter never shows below the envelope, even where it is longer than the pocket. */}
        <clipPath id={clipId}>
          <rect x={VIEW_BOX.x} y={VIEW_BOX.y} width={VIEW_BOX.width} height={ENVELOPE.height - VIEW_BOX.y} />
        </clipPath>
      </defs>

      <motion.g style={{ opacity: v.opacity }}>
        <motion.g data-part="envelope" style={{ x: v.nudge }}>
          <path data-part="back" d={BACK_PATH} style={{ fill: COLOR.inside }} />

          <motion.g data-part="flap-open" style={{ opacity: flapOpen }}>
            <motion.path d={flap} style={{ fill: COLOR.inside }} />
            <motion.path d={sides} fill="none" style={{ stroke: COLOR.line }} {...outline} />
          </motion.g>

          <g clipPath={`url(#${clipId})`}>
            <motion.g data-part="letter" style={{ y: v.letter }}>
              <rect
                x={LETTER.x}
                width={LETTER.width}
                height={LETTER.height}
                rx={LETTER.radius}
                style={{ fill: COLOR.letter, stroke: COLOR.letterLine }}
                strokeWidth={stroke}
              />
              {LETTER.lines.map(([y, x0, x1]) => (
                <line
                  key={y}
                  x1={LETTER.x + x0}
                  x2={LETTER.x + x1}
                  y1={y}
                  y2={y}
                  strokeWidth={LETTER.lineWidth}
                  strokeLinecap="round"
                  style={{ stroke: COLOR.letterLine }}
                />
              ))}
            </motion.g>
          </g>

          <path data-part="pocket" d={POCKET_PATH} style={{ fill: COLOR.paper, stroke: COLOR.line }} {...outline} />
          <path data-part="folds" d={FOLDS_PATH} fill="none" style={{ stroke: COLOR.line }} {...outline} />

          <motion.path
            data-part="flap-closed"
            d={flap}
            style={{ fill: COLOR.paper, stroke: COLOR.line, opacity: flapClosed }}
            {...outline}
          />

          <motion.g
            data-part="stamp"
            style={{ opacity: v.stampOpacity, y: v.stampDrop, scale: v.stampScale, rotate: v.stampTurn }}
          >
            <circle cx={STAMP.center[0]} cy={STAMP.center[1]} r={STAMP.radius} style={{ fill: COLOR.stamp }} />
            <motion.path
              d={TICK_PATH}
              fill="none"
              strokeWidth={STAMP.tickWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ stroke: COLOR.tick, pathLength: v.tick, opacity: tickShown }}
            />
          </motion.g>
        </motion.g>
      </motion.g>
    </svg>
  );
}
