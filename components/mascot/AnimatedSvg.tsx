"use client";

import { useAnimate, useAnimationFrame, useReducedMotion, type MotionValue } from "motion/react";
import { useEffect, useRef, type ComponentProps } from "react";
import { FLUID, HIGHLIGHT_ANCHORS, between, fluidOffset, isRunning, randomWave, type Pulse } from "./fluid";
import { ARM_OUTLINES, BODY_OUTLINE, FACE_ORIGIN, SHADOW, outlinePath, subdivide, type Outline, type Point } from "./geometry";
import { travelShadow, travelWarp, tuckArm } from "./travel";

/* Idle life settings. Distances are in viewBox units (pixels of the 2048 px reference), times in seconds.
   The fluid body motion has its own settings in fluid.ts, the travelling drop in travel.ts. */

/** Gentle bobbing; the shadow shrinks and fades a little while the bubble is up. */
const FLOAT = { lift: 24, seconds: 3.2, shadowScale: 0.92, shadowOpacity: 0.75 };
/** Blink by squashing the eyeballs; random pauses, sometimes a double blink. */
const BLINK = { pause: [2.5, 6] as const, seconds: 0.22, closed: 0.1, doubleChance: 0.25 };
/**
 * Glances: pupils move to a target and back. Targets keep both pupils inside their eye whites
 * (safe maximum: left 35, right 16, up 42 px). The catchlights move much less, because the light does not move.
 */
const GLANCE = {
  pause: [4, 9] as const,
  hold: [0.8, 1.6] as const,
  catchlightShare: 0.2,
  targets: [[-28, 0], [13, -2], [-24, -18], [10, -12], [0, -24]] as const,
};
/** While travelling as a drop, the idle waves calm down to this share, so the drop keeps a clean shape. */
const WAVES_IN_FULL_DROP = 0.4;
/** Each curve is split into this many pieces before warping, so body and arms bend exactly alike. */
const FINE_PIECES = 4;

type Range = readonly [min: number, max: number];
type Step = { duration: number; ease: "easeOut" | "easeInOut"; delay?: number };

/** An outline the frame loop rewrites: its resting shape, a finer copy to warp, and for arms their root. */
type Shape = { element: SVGElement; rest: Outline; fine: Outline; root?: Point };

/** Everything the frame loop touches, plus the running waves. */
type LiveState = {
  shapes: Shape[];
  highlights: (readonly [SVGElement, Point])[];
  face: SVGElement | null;
  shadow: SVGElement | null;
  pulses: Pulse[];
  nextWave: number;
};

export type AnimatedSvgProps = ComponentProps<"svg"> & {
  /** How far the mascot has turned into a travelling drop: 0 normal, 1 full drop, below 0 a landing squash. */
  travel?: MotionValue<number>;
  /** Direction of travel in degrees, with y pointing down: 0 right, 90 down, 180 left. */
  heading?: MotionValue<number>;
};

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

/**
 * The mascot's <svg>, brought to life: it floats, its body flows like a drop of liquid, it blinks and
 * glances around, and it can turn into a travelling drop (`travel`, `heading`). Parts are found by their
 * `data-part` names, so the drawing is the same server-rendered markup as the static mascot.
 * With reduced motion it keeps the calm base pose.
 */
export function AnimatedSvg({ travel, heading, ...props }: AnimatedSvgProps) {
  const [scope, animate] = useAnimate<SVGSVGElement>();
  const reduceMotion = useReducedMotion();
  const live = useRef<LiveState | null>(null);

  // Every frame: tuck the arms, add the fluid waves, then shape the travelling drop; the face, highlights
  // and shadow follow the same warp.
  useAnimationFrame((ms) => {
    const state = live.current;
    if (!state) return;
    const time = ms / 1000;
    if (time >= state.nextWave) {
      state.pulses.push(...randomWave(time));
      state.nextWave = time + between(FLUID.waves.pause);
    }
    state.pulses = state.pulses.filter((pulse) => isRunning(pulse, time));

    const amount = travel?.get() ?? 0;
    const direction = heading?.get() ?? 0;
    const calm = 1 - (1 - WAVES_IN_FULL_DROP) * Math.min(1, Math.abs(amount));
    const flow = (point: Point, share = 1): Point => {
      const [dx, dy] = fluidOffset(point, time, state.pulses);
      return [point[0] + dx * share * calm, point[1] + dy * share * calm];
    };
    const warp = (point: Point, share = 1) => travelWarp(flow(point, share), amount, direction);

    for (const { element, fine, root } of state.shapes) {
      element.setAttribute("d", outlinePath(fine, (point) => warp(root ? tuckArm(point, root, amount) : point)));
    }
    for (const [element, anchor] of state.highlights) {
      const [x, y] = warp(anchor, FLUID.highlightShare);
      element.setAttribute("transform", translate([x - anchor[0], y - anchor[1]]));
    }
    state.face?.setAttribute("transform", translate(travelWarp([FACE_ORIGIN.x, FACE_ORIGIN.y], amount, direction)));
    const shadow = travelShadow(amount, direction);
    state.shadow?.setAttribute("cx", (SHADOW.cx + shadow.dx).toFixed(1));
    state.shadow?.setAttribute("rx", (SHADOW.rx * shadow.scale).toFixed(1));
  });

  useEffect(() => {
    const svg = scope.current;
    if (reduceMotion || !svg) return;
    let alive = true;

    const find = (part: string) => svg.querySelector<SVGElement>(`[data-part=${part}]`);
    const shape = (part: string, rest: Outline, root?: Point): Shape[] => {
      const element = find(part);
      return element ? [{ element, rest, fine: subdivide(rest, FINE_PIECES), root }] : [];
    };
    live.current = {
      shapes: [
        ...shape("body", BODY_OUTLINE),
        ...shape("rim", BODY_OUTLINE),
        ...shape("arm-left", ARM_OUTLINES.left, ARM_OUTLINES.left.start),
        ...shape("arm-right", ARM_OUTLINES.right, ARM_OUTLINES.right.start),
      ],
      highlights: Object.entries(HIGHLIGHT_ANCHORS).flatMap(([part, anchor]) => {
        const element = find(part);
        return element ? [[element, anchor] as const] : [];
      }),
      face: find("face"),
      shadow: find("shadow"),
      pulses: [],
      nextWave: 0,
    };

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

    const look = (x: number, y: number, step: Step) => {
      const share = GLANCE.catchlightShare;
      return Promise.all([
        animate("[data-part=pupil]", { x, y }, step),
        animate("[data-part=catchlight]", { x: x * share, y: y * share }, step),
      ]);
    };
    const stopGlancing = repeatWithPauses(GLANCE.pause, async () => {
      const [x, y] = GLANCE.targets[Math.floor(Math.random() * GLANCE.targets.length)];
      await look(x, y, { duration: 0.35, ease: "easeOut" });
      if (alive) await look(0, 0, { duration: 0.45, ease: "easeInOut", delay: between(GLANCE.hold) });
    });

    return () => {
      alive = false;
      stopBlinking();
      stopGlancing();
      floating.forEach((controls) => controls.cancel());
      // back to the base pose (matters when reduced motion is switched on while animating)
      const state = live.current;
      live.current = null;
      state?.shapes.forEach(({ element, rest }) => element.setAttribute("d", outlinePath(rest)));
      state?.highlights.forEach(([element]) => element.removeAttribute("transform"));
      state?.face?.setAttribute("transform", translate([FACE_ORIGIN.x, FACE_ORIGIN.y]));
      state?.shadow?.setAttribute("cx", String(SHADOW.cx));
      state?.shadow?.setAttribute("rx", String(SHADOW.rx));
    };
  }, [animate, reduceMotion, scope]);

  // overflow visible: the travelling drop's tail may reach outside the frame
  return <svg ref={scope} overflow="visible" {...props} />;
}
