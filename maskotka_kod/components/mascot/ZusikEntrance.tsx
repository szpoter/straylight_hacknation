"use client";

import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Babelek } from "./Babelek";
import { LANDING } from "./travel";
import type { ZusikState } from "./types";

type Side = "left" | "right";

/** The objects Zusik can arrive as. */
export type ZusikEntranceObject = "folder" | "pencil" | "calculator";

export type ZusikEntranceProps = {
  /** The screen edge Zusik flows in from ("right": it flies to the left). */
  from: Side;
  /** What Zusik turns into the moment it stops. */
  object: ZusikEntranceObject;
  /** false → true starts the entrance; true → false puts Zusik back at the start at once, so it can play again. */
  play: boolean;
  /** Width (px or any CSS length); the height follows. Default: 200 px on phones up to 260 px on wide screens. */
  size?: number | string;
  className?: string;
  /** Accessible name. Without it Zusik is decorative (aria-hidden). */
  title?: string;
};

/**
 * The assistant state that shows each object. The pencil and the calculator do their work one time and
 * rest (`once`); the closed folder opens its cover one time by itself.
 */
const OBJECTS: Record<ZusikEntranceObject, { state: ZusikState; once: boolean }> = {
  folder: { state: "folder", once: false },
  pencil: { state: "writing", once: true },
  calculator: { state: "calculating", once: true },
};

/** The flight: in seconds and shares of the screen width. */
const FLIGHT = {
  /** Distance from the start to Zusik's place: about 60 % of the screen, but always far enough to start off screen. */
  distance: 0.6,
  /** Extra room past the screen edge at the start, as a share of Zusik's width (the drop's nose leads a little). */
  margin: 0.15,
  seconds: 1.1,
  /** Fast start, soft braking that lasts until the landing (ease-out quad), so the drop never just waits. */
  ease: [0.5, 1, 0.89, 1] as const,
  /** Near the end of the flight the drop lands and becomes the object (see LANDING in travel.ts). */
  landAt: 1.0,
};

const DEFAULT_SIZE = "clamp(200px, 24vw, 260px)";

/**
 * Zusik flows in from the edge of the screen as a drop and, as it stops, spreads straight into an object
 * (a folder, a pencil, a calculator), without showing the plain bubble in between. Then the object's state
 * plays. The component takes the size of Zusik's place; the flight is only a transform, so the page layout
 * never moves. The drop starts off screen, so an ancestor has to clip horizontal overflow (overflow-x: clip).
 * With reduced motion there is no flight and no change: Zusik is the object right away.
 */
export function ZusikEntrance(props: ZusikEntranceProps) {
  // every change of `play` (or of the edge) mounts a fresh flight: false → true starts from the beginning,
  // true → false resets Zusik (position, drop, shape) at once, without animating back
  return <Flight key={`${props.play}-${props.from}`} {...props} />;
}

/** How far from its place the flight starts, in px. */
function startDistance(element: HTMLElement, from: Side) {
  const { left, right, width } = element.getBoundingClientRect();
  const screen = window.innerWidth;
  const offScreen = (from === "right" ? screen - left : right) + width * FLIGHT.margin;
  return Math.max(FLIGHT.distance * screen, offScreen);
}

function Flight({ from, object, play, size = DEFAULT_SIZE, className, title }: ZusikEntranceProps) {
  const place = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const sign = from === "right" ? 1 : -1;
  // before the flight Zusik waits a full screen width away, surely out of sight
  const x = useMotionValue<number | string>(`${sign * 100}vw`);
  const travel = useMotionValue(1);
  const heading = useMotionValue(from === "right" ? 180 : 0);
  const [landed, setLanded] = useState(false);
  const still = play && Boolean(reduceMotion);

  // the flight: from off screen to Zusik's place, as a full drop
  useEffect(() => {
    const element = place.current;
    if (!play || reduceMotion || !element) return;
    x.jump(sign * startDistance(element, from));
    const flight = animate(x, 0, { duration: FLIGHT.seconds, ease: FLIGHT.ease });
    const timer = setTimeout(() => setLanded(true), FLIGHT.landAt * 1000);
    return () => {
      flight.stop();
      clearTimeout(timer);
    };
  }, [play, reduceMotion, from, sign, x]);

  // landing: the drop settles while the shape forms. Babelek starts the shape in its own effect, which
  // runs before this one in the same commit, so both start in the same frame (see LANDING).
  useEffect(() => {
    if (!landed) return;
    const settling = animate(travel, 0, LANDING.settle);
    return () => settling.stop();
  }, [landed, travel]);

  // reduced motion: no flight and no change, Zusik is the object in its place at once
  useEffect(() => {
    if (!still) return;
    x.jump(0);
    travel.jump(0);
  }, [still, x, travel]);

  return (
    <div ref={place} className={className} style={{ width: size }}>
      <motion.div style={{ x }}>
        <Babelek
          animated
          travel={travel}
          heading={heading}
          state={landed || still ? OBJECTS[object].state : "available"}
          once={OBJECTS[object].once}
          // the pencil looks at the text beside it: Zusik stands on the side it came from
          toward={from === "right" ? 180 : 0}
          title={title}
          className="block h-auto w-full"
        />
      </motion.div>
    </div>
  );
}
