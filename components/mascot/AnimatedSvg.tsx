"use client";

import { useAnimate, useAnimationFrame, useReducedMotion } from "motion/react";
import { useEffect, useRef, type ComponentProps } from "react";
import { FLUID, HIGHLIGHT_ANCHORS, between, fluidOffset, fluidPath, isRunning, randomWave, type Pulse } from "./fluid";
import { ARM_OUTLINES, BODY_OUTLINE, outlinePath, subdivide, type Outline, type Point } from "./geometry";

/* Idle life settings. Distances are in viewBox units (pixels of the 2048 px reference), times in seconds.
   The fluid body motion has its own settings in fluid.ts. */

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

type Range = readonly [min: number, max: number];
type Step = { duration: number; ease: "easeOut" | "easeInOut"; delay?: number };

/** Each curve is split into this many pieces before warping, so body and arms bend exactly alike. */
const FINE_PIECES = 4;

/** Elements the fluid motion rewrites every frame, plus its running waves. */
type FluidState = {
  shapes: { element: SVGElement; rest: Outline; fine: Outline }[];
  highlights: (readonly [SVGElement, Point])[];
  pulses: Pulse[];
  nextWave: number;
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

/**
 * The mascot's <svg>, brought to life: it floats, its body flows like a drop of liquid, it blinks and
 * glances around. Parts are found by their `data-part` names, so the drawing is the same
 * server-rendered markup as the static mascot. With reduced motion it keeps the calm base pose.
 */
export function AnimatedSvg(props: ComponentProps<"svg">) {
  const [scope, animate] = useAnimate<SVGSVGElement>();
  const reduceMotion = useReducedMotion();
  const fluid = useRef<FluidState | null>(null);

  // Fluid body: every frame, warp the body, rim and arms with the running waves and drag the highlights along.
  useAnimationFrame((ms) => {
    const state = fluid.current;
    if (!state) return;
    const time = ms / 1000;
    if (time >= state.nextWave) {
      state.pulses.push(...randomWave(time));
      state.nextWave = time + between(FLUID.waves.pause);
    }
    state.pulses = state.pulses.filter((pulse) => isRunning(pulse, time));
    for (const { element, fine } of state.shapes) element.setAttribute("d", fluidPath(fine, time, state.pulses));
    for (const [element, anchor] of state.highlights) {
      const [dx, dy] = fluidOffset(anchor, time, state.pulses).map((v) => (v * FLUID.highlightShare).toFixed(1));
      element.setAttribute("transform", `translate(${dx} ${dy})`);
    }
  });

  useEffect(() => {
    const svg = scope.current;
    if (reduceMotion || !svg) return;
    let alive = true;

    const find = (part: string) => svg.querySelector<SVGElement>(`[data-part=${part}]`);
    const shape = (part: string, rest: Outline) => {
      const element = find(part);
      return element ? [{ element, rest, fine: subdivide(rest, FINE_PIECES) }] : [];
    };
    fluid.current = {
      shapes: [
        ...shape("body", BODY_OUTLINE),
        ...shape("rim", BODY_OUTLINE),
        ...shape("arm-left", ARM_OUTLINES.left),
        ...shape("arm-right", ARM_OUTLINES.right),
      ],
      highlights: Object.entries(HIGHLIGHT_ANCHORS).flatMap(([part, anchor]) => {
        const element = find(part);
        return element ? [[element, anchor] as const] : [];
      }),
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
      const state = fluid.current;
      fluid.current = null;
      state?.shapes.forEach(({ element, rest }) => element.setAttribute("d", outlinePath(rest)));
      state?.highlights.forEach(([element]) => element.removeAttribute("transform"));
    };
  }, [animate, reduceMotion, scope]);

  return <svg ref={scope} {...props} />;
}
