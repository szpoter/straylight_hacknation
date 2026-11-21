"use client";

import {
  useAnimate,
  useAnimationFrame,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, type ComponentProps } from "react";
import { FLUID, HIGHLIGHT_ANCHORS, between, fluidOffset, isRunning, keystrokeRipple, randomWave, type Pulse } from "./fluid";
import { ARM_OUTLINES, BODY, FACE_ORIGIN, SHADOW, outlinePath, subdivide, type Outline, type Point } from "./geometry";
import { armTurn, bendArm, sagWarp } from "./pose";
import { BODY_POINTS, BOOK, CALCULATOR, DOT, SHAPES, smoothPath, type ShapeName } from "./shapes";
import { travelShadow, travelWarp, tuckArm } from "./travel";
import type { BabelekProps } from "./types";
import { calculatingOnce, lookAt, useStateAnimation, usePose, writingOnce } from "./useStateAnimation";

/* Idle life settings. Distances are in viewBox units (pixels of the 2048 px reference), times in seconds.
   The fluid body has its own settings in fluid.ts, the travelling drop in travel.ts, the shapes in
   shapes.ts, the states in useStateAnimation.ts. */

/** Gentle bobbing; the shadow shrinks and fades a little while the bubble is up. */
const FLOAT = { lift: 24, seconds: 3.2, shadowScale: 0.92, shadowOpacity: 0.75 };
/** Blink by squashing the eyeballs; random pauses, sometimes a double blink. */
const BLINK = { pause: [2.5, 6] as const, seconds: 0.22, closed: 0.1, doubleChance: 0.25 };
/**
 * Glances while available: pupils move to a target and back. Targets keep both pupils inside their
 * eye whites (safe maximum: left 35, right 16, up 42 px).
 */
const GLANCE = {
  pause: [4, 9] as const,
  hold: [0.8, 1.6] as const,
  targets: [[-28, 0], [13, -2], [-24, -18], [10, -12], [0, -24]] as const,
};
/** While travelling as a drop or turned into a shape, the idle waves calm down to this share. */
const WAVES_WHEN_SHAPED = 0.4;
/** Leaning toward the related UI is a small travelling drop in that direction. */
const LEAN_AMOUNT = 0.16;
/** Hops and the entrance: their vertical speed becomes a stretch, and the landing a squash. */
const HOP = { fullDropSpeed: 2500, settle: { stiffness: 220, damping: 14 } };
/** The entrance starts this far below the mascot's place and springs up into it. */
const ENTRANCE = { from: -1900, spring: { type: "spring", stiffness: 60, damping: 12, delay: 0.2 } } as const;
/** Each arm curve is split into this many pieces before warping, so body and arms bend exactly alike. */
const FINE_PIECES = 4;
/** The details of a shape (pages, keys…) and how they move once the shape has formed. */
const DETAILS = {
  /** They fade in over the last part of the change into the shape. */
  appearFrom: 0.75,
  /** They are not warped like the body, so they wait until a travelling drop has settled below this `travel`. */
  settledBelow: 0.3,
  /** A page turns every `cycle` seconds and takes `turn` seconds. */
  page: { cycle: 1.6, turn: 0.7 },
  /** The folder's index cards pop up one after another. */
  cards: { lift: 70, cycle: 1.5 },
  /** The calculator shows a new number (and presses a key) every `tick` seconds. */
  calculator: { tick: 0.2, values: ["0", "4", "42", "426", "4 260", "8 520", "2 130", "2 130,5"], keys: [4, 0, 8, 2, 6, 1, 7, 3, 5] },
  /** The pencil scribbles: sideways and up-down at two speeds. */
  scribble: { size: [28, 14], speed: [19, 29] },
  /** The dot of "?" and "!" drips out of the stroke. */
  drip: { seconds: 0.45 },
};

type Range = readonly [min: number, max: number];

/** Everything the frame loop touches, plus the running waves. */
type LiveState = {
  outline: SVGElement[];
  arms: { element: SVGElement; rest: Outline; fine: Outline; side: "left" | "right" }[];
  highlights: (readonly [SVGElement, Point])[];
  highlightsGroup: SVGElement | null;
  face: SVGElement | null;
  stage: SVGElement | null;
  shadow: SVGElement | null;
  details: Partial<Record<"book" | "folder" | "calculator" | "pencil" | "dot" | "closedFolder", SVGElement | null>>;
  page: SVGElement | null;
  cards: SVGElement[];
  digits: SVGElement | null;
  press: SVGElement | null;
  pulses: Pulse[];
  nextWave: number;
  time: number;
  /** When the current shape finished forming (for page turns, the dot's drip). */
  formedAt: number | null;
};

type MotionProps = Omit<BabelekProps, "size" | "className" | "title" | "animated" | "frame">;
export type AnimatedSvgProps = ComponentProps<"svg"> & MotionProps;

/** Runs `action` over and over with a random pause before each run. Returns a function that stops it. */
function repeatWithPauses(pause: Range, action: () => Promise<unknown>) {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const schedule = () => {
    timer = setTimeout(async () => {
      await action();
      if (!stopped) schedule();
    }, between(pause) * 1000);
  };
  schedule();
  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}

const translate = ([x, y]: Point) => `translate(${x.toFixed(1)} ${y.toFixed(1)})`;
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const smoothstep = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
/** Which detail group belongs to a shape ("?" and "!" share the dot). */
const detailOf = (shape: ShapeName | null) =>
  shape === "question" || shape === "exclamation" ? "dot" : shape === "tick" ? null : shape;

/** A Motion value that keeps the direction of `velocity` (up = 270, down = 90) after it stops. */
function useVerticalHeading(velocity: MotionValue<number>) {
  const heading = useMotionValue(270);
  useMotionValueEvent(velocity, "change", (value) => {
    if (value > 0) heading.set(270);
    else if (value < 0) heading.set(90);
  });
  return heading;
}

/**
 * The mascot's <svg>, brought to life: it floats, its body flows like a drop of liquid, it blinks and
 * glances around, it can travel as a drop (`travel`, `heading`), and it acts out the assistant states,
 * sometimes by turning into a book, a folder, a calculator, a pencil, a tick, "?" or "!".
 * Parts are found by their `data-part` names, so the drawing is the same server-rendered markup as the
 * static mascot. With reduced motion it keeps the calm base pose.
 */
export function AnimatedSvg({
  travel,
  heading,
  state = "available",
  toward = 225,
  inviting = false,
  typingTick,
  entrance = false,
  once = false,
  ...props
}: AnimatedSvgProps) {
  const [scope, animate] = useAnimate<SVGSVGElement>();
  const reduceMotion = useReducedMotion();
  const live = useRef<LiveState | null>(null);
  const pose = usePose();
  const stateRef = useRef(state);
  const towardRef = useRef(toward);
  const lastKeystrokeRef = useRef(0);
  const enters = useRef(entrance); // only the value at mount matters
  const enabled = !reduceMotion;

  useEffect(() => {
    stateRef.current = state;
    towardRef.current = toward;
  }, [state, toward]);
  const onceRef = useRef(once);
  useEffect(() => {
    onceRef.current = once;
  }, [once]);

  // hops and the entrance: vertical speed → stretch, landing → squash
  const liftVelocity = useVelocity(pose.lift);
  const hopSpeed = useTransform(liftVelocity, [-HOP.fullDropSpeed, 0, HOP.fullDropSpeed], [1, 0, 1]);
  const hopTravel = useSpring(hopSpeed, HOP.settle);
  const hopHeading = useVerticalHeading(liftVelocity);

  useStateAnimation({ enabled, state, toward, inviting, animate, pose, lastKeystrokeRef, travel, once });

  // a keystroke while waiting: a ripple on the side facing the input
  const firstTick = useRef(typingTick);
  useEffect(() => {
    if (typingTick === undefined || typingTick === firstTick.current) return;
    lastKeystrokeRef.current = performance.now() / 1000;
    const state = live.current;
    state?.pulses.push(...keystrokeRipple(state.time, towardRef.current));
  }, [typingTick]);

  // Every frame: flow into the current shape, add the fluid waves, droop, lean, hop and travel; the arms,
  // face, highlights, details, stage and shadow follow.
  useAnimationFrame((ms) => {
    const state = live.current;
    if (!state) return;
    const time = (state.time = ms / 1000);
    const amount = travel?.get() ?? 0;
    const [shapeName, morph] = [pose.shape.get(), pose.morph.get()];
    const shape = shapeName ? SHAPES[shapeName] : null;
    const shaped = shape ? morph : 0;
    const calm = pose.calm.get() * (1 - (1 - WAVES_WHEN_SHAPED) * Math.min(1, Math.max(Math.abs(amount), shaped)));
    if (time >= state.nextWave) {
      if (calm > 0.15) state.pulses.push(...randomWave(time).map((pulse) => ({ ...pulse, amount: pulse.amount * calm })));
      state.nextWave = time + between(FLUID.waves.pause);
    }
    state.pulses = state.pulses.filter((pulse) => isRunning(pulse, time));
    if (shaped > 0.97 && state.formedAt === null) state.formedAt = time;
    if (shaped < 0.6) state.formedAt = null;

    const [orbit, sag, lean, lift] = [pose.orbit.get(), pose.sag.get(), pose.lean.get(), pose.lift.get()];
    const [hop, hopDirection, direction] = [hopTravel.get(), hopHeading.get(), heading?.get() ?? 0];
    const flow = (point: Point, share = 1): Point => {
      const [dx, dy] = fluidOffset(point, time, state.pulses, calm, orbit);
      return [point[0] + dx * share, point[1] + dy * share];
    };
    const warp = (point: Point): Point => {
      let p = sagWarp(point, sag);
      p = travelWarp(p, lean * LEAN_AMOUNT, towardRef.current);
      p = travelWarp(p, hop, hopDirection);
      return travelWarp(p, amount, direction);
    };

    // body and rim: Zusik's outline, flowing into the shape
    const outline = BODY_POINTS.map((point, i) => {
      const target = shape ? shape.points[i] : point;
      return warp(flow([mix(point[0], target[0], shaped), mix(point[1], target[1], shaped)]));
    });
    const d = smoothPath(outline);
    state.outline.forEach((element) => element.setAttribute("d", d));

    // arms: bent by the pose, tucked in while travelling or shaped; they also fade while Zusik takes on
    // a shape, since their roots may lie outside a slim shape such as "!"
    const raise = { left: pose.armLeft.get(), right: pose.armRight.get() };
    const tuck = Math.max(amount, shaped);
    const armsShown = (1 - smoothstep(shaped / 0.5)).toFixed(2);
    for (const { element, fine, side } of state.arms) {
      const root = ARM_OUTLINES[side].start;
      const posed = (point: Point) => tuckArm(bendArm(point, root, armTurn(side, raise[side])), root, tuck);
      element.setAttribute("d", outlinePath(fine, (point) => warp(flow(posed(point)))));
      element.setAttribute("opacity", armsShown);
    }

    // highlights ride on the surface and fade while Zusik is a shape
    for (const [element, anchor] of state.highlights) {
      const [x, y] = warp(flow(anchor, FLUID.highlightShare));
      element.setAttribute("transform", translate([x - anchor[0], y - anchor[1]]));
    }
    state.highlightsGroup?.setAttribute("opacity", (1 - smoothstep(shaped / 0.6)).toFixed(2));

    // the face moves to its place on the shape and shrinks if the shape is slim
    const faceAt = shape ? warp([mix(FACE_ORIGIN.x, shape.face.x, shaped), mix(FACE_ORIGIN.y, shape.face.y, shaped)]) : warp([FACE_ORIGIN.x, FACE_ORIGIN.y]);
    const faceScale = shape ? mix(1, shape.face.scale, shaped) : 1;
    state.face?.setAttribute("transform", `${translate(faceAt)} scale(${faceScale.toFixed(3)})`);

    // details of the shape: shown once it has formed, each with its own little motion
    const active = detailOf(shapeName);
    const settled = 1 - smoothstep(Math.abs(amount) / DETAILS.settledBelow); // landing straight into a shape
    const visible = smoothstep((shaped - DETAILS.appearFrom) / (1 - DETAILS.appearFrom)) * settled;
    for (const [name, element] of Object.entries(state.details)) {
      element?.setAttribute("opacity", (name === active ? visible : 0).toFixed(2));
    }
    const since = state.formedAt === null ? 0 : time - state.formedAt;
    if (active === "book") {
      const turn = smoothstep((since % DETAILS.page.cycle) / DETAILS.page.turn);
      const flip = Math.cos(Math.PI * turn);
      state.page?.setAttribute("transform", `translate(${BOOK.spine} 0) scale(${flip.toFixed(3)} 1) translate(${-BOOK.spine} 0)`);
    }
    if (active === "folder") {
      state.cards.forEach((card, k) => {
        const wave = Math.max(0, Math.sin(2 * Math.PI * (time / DETAILS.cards.cycle - k / state.cards.length)));
        card.setAttribute("transform", `translate(0 ${(-DETAILS.cards.lift * wave * wave).toFixed(1)})`);
      });
    }
    if (active === "calculator") {
      const { tick, values, keys } = DETAILS.calculator;
      // with `once`: the digits run one time from when it formed, then the last value stays (calculatingOnce)
      const oneRun = onceRef.current ? calculatingOnce(since, tick, values.length) : null;
      const step = oneRun ? oneRun.step : Math.floor(time / tick);
      if (state.digits) state.digits.textContent = values[step % values.length];
      const key = keys[step % keys.length];
      state.press?.setAttribute("cx", String(CALCULATOR.keys.columns[key % 3]));
      state.press?.setAttribute("cy", String(CALCULATOR.keys.rows[Math.floor(key / 3)]));
      state.press?.setAttribute("opacity", (0.7 * (oneRun ? oneRun.press : 1 - (time / tick - step))).toFixed(2));
    }
    if (active === "dot") {
      const drip = smoothstep(since / DETAILS.drip.seconds);
      state.details.dot?.setAttribute("cy", mix(DOT.dripFrom, DOT.centre[1], drip).toFixed(1));
      state.details.dot?.setAttribute("r", (DOT.r * mix(0.4, 1, drip)).toFixed(1));
    }

    // stage: hops, the shake, and the pencil's scribble
    const scribble = active === "pencil" ? visible : 0;
    const [sx, sy] = DETAILS.scribble.size;
    const [vx, vy] = DETAILS.scribble.speed;
    // with `once`: three strokes from when it formed, then the pencil stands still (writingOnce)
    const [wx, wy] = onceRef.current ? writingOnce(since) : [sx * Math.sin(vx * time), sy * Math.sin(vy * time)];
    state.stage?.setAttribute("transform", translate([pose.shift.get() + scribble * wx, -lift + scribble * wy]));

    const travelled = travelShadow(amount, direction);
    const high = 1 - Math.max(0, lift) / 1600; // smaller while hopping
    const wide = shape ? mix(1, shape.shadow, shaped) : 1;
    state.shadow?.setAttribute("cx", (SHADOW.cx + travelled.dx + pose.shift.get()).toFixed(1));
    state.shadow?.setAttribute("rx", (SHADOW.rx * travelled.scale * high * wide).toFixed(1));
    state.shadow?.setAttribute("ry", (SHADOW.ry * high).toFixed(1));
    state.shadow?.setAttribute("fill-opacity", clamp01(1 + lift / 400).toFixed(2)); // fades in during the entrance
  });

  useEffect(() => {
    const svg = scope.current;
    if (!enabled || !svg) return;
    let alive = true;

    const find = (part: string) => svg.querySelector<SVGElement>(`[data-part=${part}]`);
    const arm = (side: "left" | "right") => {
      const element = find(`arm-${side}`);
      const rest = ARM_OUTLINES[side];
      return element ? [{ element, rest, fine: subdivide(rest, FINE_PIECES), side }] : [];
    };
    live.current = {
      outline: [find("body"), find("rim")].filter((element) => element !== null),
      arms: [...arm("left"), ...arm("right")],
      highlights: Object.entries(HIGHLIGHT_ANCHORS).flatMap(([part, anchor]) => {
        const element = find(part);
        return element ? [[element, anchor] as const] : [];
      }),
      highlightsGroup: find("highlights"),
      face: find("face"),
      stage: find("stage"),
      shadow: find("shadow"),
      details: {
        book: find("detail-book"),
        folder: find("detail-folder"),
        calculator: find("detail-calculator"),
        pencil: find("detail-pencil"),
        dot: find("detail-dot"),
        // the closed folder's cover; it opens from useStateAnimation ("folder")
        closedFolder: find("detail-closed-folder"),
      },
      page: find("book-page"),
      cards: [...svg.querySelectorAll<SVGElement>("[data-part=folder-card]")],
      digits: find("calc-digits"),
      press: find("calc-press"),
      pulses: [],
      nextWave: 0,
      time: 0,
      formedAt: null,
    };

    if (enters.current) {
      pose.lift.jump(ENTRANCE.from);
      animate(pose.lift, 0, ENTRANCE.spring);
    }

    const loop = { repeat: Infinity, ease: "easeInOut", duration: FLOAT.seconds } as const;
    const floating = [
      animate("[data-part=character]", { y: [0, -FLOAT.lift, 0] }, loop),
      animate("[data-part=shadow]", { scale: [1, FLOAT.shadowScale, 1], opacity: [1, FLOAT.shadowOpacity, 1] }, loop),
    ];

    const blink = () =>
      animate("[data-part=eyeball]", { scaleY: [1, BLINK.closed, 1] }, { duration: BLINK.seconds, ease: "easeInOut" });
    const stopBlinking = repeatWithPauses(BLINK.pause, async () => {
      await blink();
      if (alive && Math.random() < BLINK.doubleChance) await blink();
    });

    // glancing around belongs to the calm "available" state; other states direct the eyes themselves
    const stopGlancing = repeatWithPauses(GLANCE.pause, async () => {
      if (stateRef.current !== "available") return;
      const target = GLANCE.targets[Math.floor(Math.random() * GLANCE.targets.length)] as Point;
      await lookAt(animate, target, { duration: 0.35, ease: "easeOut" });
      if (alive && stateRef.current === "available") {
        await lookAt(animate, [0, 0], { duration: 0.45, ease: "easeInOut", delay: between(GLANCE.hold) });
      }
    });

    return () => {
      alive = false;
      stopBlinking();
      stopGlancing();
      floating.forEach((controls) => controls.cancel());
      // back to the base pose (matters when reduced motion is switched on while animating)
      const state = live.current;
      live.current = null;
      if (!state) return;
      state.outline.forEach((element) => element.setAttribute("d", BODY.d));
      state.arms.forEach(({ element, rest }) => {
        element.setAttribute("d", outlinePath(rest));
        element.removeAttribute("opacity");
      });
      state.highlights.forEach(([element]) => element.removeAttribute("transform"));
      state.highlightsGroup?.removeAttribute("opacity");
      state.face?.setAttribute("transform", translate([FACE_ORIGIN.x, FACE_ORIGIN.y]));
      state.stage?.removeAttribute("transform");
      Object.values(state.details).forEach((element) => element?.setAttribute("opacity", "0"));
      for (const [name, value] of Object.entries({ cx: SHADOW.cx, rx: SHADOW.rx, ry: SHADOW.ry, "fill-opacity": 1 })) {
        state.shadow?.setAttribute(name, String(value));
      }
    };
  }, [animate, enabled, scope, pose]);

  // overflow visible: a travelling drop's tail, a hop or the entrance may reach outside the frame
  return <svg ref={scope} overflow="visible" {...props} />;
}
