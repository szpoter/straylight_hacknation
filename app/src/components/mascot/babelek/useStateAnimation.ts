"use client";

import { useMotionValue, type MotionValue, type useAnimate } from "motion/react";
import { useEffect, useMemo, type RefObject } from "react";
import { MOUTHS, type Point } from "./geometry";
import { raiseToward } from "./pose";
import type { ShapeName } from "./shapes";
import type { ZusikState } from "./types";

type Animate = ReturnType<typeof useAnimate>[1];
type Side = "left" | "right";
type Step = { duration: number; ease?: "easeOut" | "easeInOut" | "linear"; delay?: number };

/**
 * Values the frame loop reads to pose the body (see AnimatedSvg). Arms are a raise in degrees
 * (0 = hanging, positive = outward and up); distances are in viewBox units.
 */
export type Pose = {
  armLeft: MotionValue<number>;
  armRight: MotionValue<number>;
  /** 0–1: the body droops toward the ground. */
  sag: MotionValue<number>;
  /** 0–1: the circling bulge of the "checking" state. */
  orbit: MotionValue<number>;
  /** 0–1: leaning toward the related UI. */
  lean: MotionValue<number>;
  /** 0–1: how lively the idle waves are. */
  calm: MotionValue<number>;
  /** Lift of the whole character (up is positive): hops and the entrance. */
  lift: MotionValue<number>;
  /** Sideways offset of the whole character: the shake. */
  shift: MotionValue<number>;
  /** The shape Zusik is turning into, and how far (0 = Zusik, 1 = the shape). */
  shape: MotionValue<ShapeName | null>;
  morph: MotionValue<number>;
};

export function usePose(): Pose {
  const armLeft = useMotionValue(0);
  const armRight = useMotionValue(0);
  const sag = useMotionValue(0);
  const orbit = useMotionValue(0);
  const lean = useMotionValue(0);
  const calm = useMotionValue(1);
  const lift = useMotionValue(0);
  const shift = useMotionValue(0);
  const shape = useMotionValue<ShapeName | null>(null);
  const morph = useMotionValue(0);
  return useMemo(
    () => ({ armLeft, armRight, sag, orbit, lean, calm, lift, shift, shape, morph }),
    [armLeft, armRight, sag, orbit, lean, calm, lift, shift, shape, morph],
  );
}

/* State animation settings. Distances are in viewBox units (pixels of the 2048 px reference), times in seconds. */

const SPRING = { type: "spring", stiffness: 170, damping: 18 } as const;
const LOOK: Step = { duration: 0.35, ease: "easeOut" };
/** Catchlights move this share of the pupils' way, because the light does not move. */
export const CATCHLIGHT_SHARE = 0.2;
/** Flowing into a shape (a little jelly overshoot) and back. */
const MORPH = {
  into: { type: "spring", stiffness: 140, damping: 14 },
  back: { type: "spring", stiffness: 170, damping: 18 },
  between: { duration: 0.25, ease: "easeIn" },
} as const;
/** Shapes held for the whole state. */
const HELD_SHAPES: Partial<Record<ZusikState, ShapeName>> = {
  reading: "book",
  searching: "folder",
  calculating: "calculator",
  writing: "pencil",
};
/** Shapes shown for a moment as the state begins, before Zusik returns and acts the state out. */
const ACCENTS: Partial<Record<ZusikState, { shape: ShapeName; hold: number }>> = {
  confirming: { shape: "tick", hold: 1 },
  waiting: { shape: "question", hold: 1.3 },
  attention: { shape: "exclamation", hold: 0.7 },
};
/** Lower lids lifted (negative = up): smiling eyes when confirming, a worried look when something failed. */
const LIDS = { happy: -34, worried: -12 };
/** Eyes resting up and to the side, switching sides now and then (checking, searching, calculating). */
const THINK = { looks: [[-20, -22], [6, -20]] as const, seconds: 1.6 };
/** Reading: the eyes run along lines. */
const READ = { from: -26, to: 12, lines: [-16, -6], lineSeconds: 0.9, backSeconds: 0.2 };
/** While working, the idle waves calm down. */
const BUSY_CALM = 0.35;
/** Talking: the open mouth opens and closes irregularly. */
const TALK = { scaleY: [0.2, 1, 0.45, 0.85, 0.3, 0.95, 0.2], seconds: 1.1 };
/** Confirming: a squash-and-stretch nod, smiling eyes and a wide smile for a moment. */
const NOD = { scaleY: [1, 0.9, 1.05, 0.97, 1], seconds: 0.7, hold: 1.6 };
/** Waiting: calmer after a while without typing, and a gentle hop now and then as a reminder. */
const WAIT = { patientAfter: 6, hopAfter: 14, patientCalm: 0.5, hop: 100 };
/** Needs attention: arms droop, one "no-no" shake, then the arm on the fix's side points at it. */
const ATTENTION = { droop: -8, shake: [0, -28, 28, -16, 10, 0], shakeSeconds: 0.6, pointAfter: 0.7 };
/** Invitation: look at the bubble, hop, and wave once. */
const INVITE = { hop: 120, wave: [0, 110, 80, 120, 85, 115, 0], waveSeconds: 2.2, lookSeconds: 2.4 };
const HOP = { seconds: 0.55 };

/** Pupil offset for looking toward `direction` (degrees, y down), kept inside the eye whites. */
export function lookOffset(direction: number): Point {
  const angle = (direction * Math.PI) / 180;
  const [cos, sin] = [Math.cos(angle), Math.sin(angle)];
  return [(cos >= 0 ? 13 : 30) * cos, (sin <= 0 ? 26 : 12) * sin];
}

/** Moves the pupils, and the catchlights a little. */
export function lookAt(animate: Animate, [x, y]: Point, step: Step) {
  return Promise.all([
    animate("[data-part=pupil]", { x, y }, step),
    animate("[data-part=catchlight]", { x: x * CATCHLIGHT_SHARE, y: y * CATCHLIGHT_SHARE }, step),
  ]);
}

const sideOf = (direction: number): Side => (Math.cos((direction * Math.PI) / 180) >= 0 ? "right" : "left");

/** A hop: up and back down. The frame loop turns its speed into a stretch and a landing squash. */
export const hop = (animate: Animate, pose: Pose, height: number) =>
  animate(pose.lift, [0, height, 0], { duration: HOP.seconds, ease: ["easeOut", "easeIn"] });

type Options = {
  enabled: boolean;
  state: ZusikState;
  toward: number;
  inviting: boolean;
  animate: Animate;
  pose: Pose;
  /** Time (performance.now, seconds) of the last keystroke, for the waiting state. */
  lastKeystrokeRef: RefObject<number>;
};

/** Plays the animation of the current assistant state (and the invitation greeting). */
export function useStateAnimation({ enabled, state, toward, inviting, animate, pose, lastKeystrokeRef }: Options) {
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const running: { stop: () => void }[] = [];
    const timers: ReturnType<typeof setTimeout>[] = [];
    const run = <T extends { stop: () => void }>(controls: T) => (running.push(controls), controls);
    const to = (value: MotionValue<number>, target: number) => run(animate(value, target, SPRING));
    const later = (seconds: number, action: () => void) =>
      timers.push(setTimeout(() => alive && action(), seconds * 1000));
    const arm = (side: Side) => (side === "left" ? pose.armLeft : pose.armRight);
    const side = sideOf(toward);

    /** Flow into a shape; from another shape, first back into Zusik. */
    const become = async (shape: ShapeName) => {
      if (pose.shape.get() !== shape && pose.morph.get() > 0.05) await run(animate(pose.morph, 0, MORPH.between));
      if (!alive) return;
      pose.shape.set(shape);
      run(animate(pose.morph, 1, MORPH.into));
    };
    const unshape = () => run(animate(pose.morph, 0, MORPH.back));

    /** Eyes that rest up and to the side, switching now and then. */
    const think = async () => {
      for (let i = 0; alive; i++) {
        await lookAt(animate, THINK.looks[i % THINK.looks.length] as Point, LOOK);
        await new Promise((resolve) => setTimeout(resolve, THINK.seconds * 1000));
      }
    };

    // every state starts from the calm defaults and overrides what it needs
    to(pose.armLeft, 0);
    to(pose.armRight, 0);
    to(pose.sag, 0);
    to(pose.orbit, 0);
    to(pose.lean, 0);
    to(pose.calm, 1);
    run(animate("[data-part=mouth]", { d: MOUTHS.smile }, { duration: 0.3 }));
    run(animate("[data-part=mouth-open]", { opacity: 0, scaleY: 0.2 }, { duration: 0.15 }));
    run(animate("[data-part=lid]", { y: 0 }, SPRING));
    if (state !== "available") lookAt(animate, [0, 0], LOOK);

    const held = HELD_SHAPES[state];
    const accent = ACCENTS[state];
    if (held) become(held);
    else if (accent) {
      become(accent.shape);
      later(accent.hold, unshape);
    } else unshape();
    // the state's own acting starts once a short accent is over
    const after = accent ? accent.hold + 0.3 : 0;

    switch (state) {
      case "checking": {
        to(pose.orbit, 1);
        to(pose.calm, BUSY_CALM);
        think();
        break;
      }
      case "reading": {
        to(pose.calm, BUSY_CALM);
        (async () => {
          for (let line = 0; alive; line++) {
            const y = READ.lines[line % READ.lines.length];
            await lookAt(animate, [READ.from, y], { duration: READ.backSeconds, ease: "easeInOut" });
            if (alive) await lookAt(animate, [READ.to, y], { duration: READ.lineSeconds, ease: "linear" });
          }
        })();
        break;
      }
      case "searching":
      case "calculating": {
        to(pose.calm, BUSY_CALM);
        think();
        break;
      }
      case "writing": {
        to(pose.calm, BUSY_CALM);
        lookAt(animate, lookOffset(toward), LOOK);
        break;
      }
      case "answering": {
        lookAt(animate, [0, -4], LOOK);
        run(animate("[data-part=mouth-open]", { opacity: 1 }, { duration: 0.15 }));
        run(animate("[data-part=mouth-open]", { scaleY: TALK.scaleY }, { duration: TALK.seconds, repeat: Infinity }));
        break;
      }
      case "confirming": {
        later(after, () => {
          run(animate("[data-part=character]", { scaleY: NOD.scaleY }, { duration: NOD.seconds }));
          run(animate("[data-part=lid]", { y: LIDS.happy }, SPRING));
          run(animate("[data-part=mouth]", { d: MOUTHS.wide }, { duration: 0.3 }));
        });
        later(after + NOD.hold, () => {
          run(animate("[data-part=lid]", { y: 0 }, SPRING));
          run(animate("[data-part=mouth]", { d: MOUTHS.smile }, { duration: 0.4 }));
        });
        break;
      }
      case "waiting": {
        lastKeystrokeRef.current = performance.now() / 1000;
        later(after, () => {
          to(pose.lean, 1);
          lookAt(animate, lookOffset(toward), LOOK);
        });
        let patient = false;
        const check = setInterval(() => {
          const quiet = performance.now() / 1000 - lastKeystrokeRef.current;
          if (quiet > WAIT.hopAfter) {
            run(hop(animate, pose, WAIT.hop));
            lastKeystrokeRef.current = performance.now() / 1000;
          } else if (quiet > WAIT.patientAfter !== patient) {
            patient = !patient;
            to(pose.calm, patient ? WAIT.patientCalm : 1);
          }
        }, 500);
        running.push({ stop: () => clearInterval(check) });
        break;
      }
      case "attention": {
        later(after, () => {
          to(pose.sag, 1);
          to(pose.armLeft, ATTENTION.droop);
          to(pose.armRight, ATTENTION.droop);
          lookAt(animate, [0, 12], LOOK);
          run(animate("[data-part=lid]", { y: LIDS.worried }, SPRING));
          run(animate("[data-part=mouth]", { d: MOUTHS.worried }, { duration: 0.3 }));
          run(animate(pose.shift, ATTENTION.shake, { duration: ATTENTION.shakeSeconds, delay: 0.2 }));
        });
        later(after + ATTENTION.pointAfter + ATTENTION.shakeSeconds, () => {
          to(arm(side), raiseToward(side, toward));
          lookAt(animate, lookOffset(toward), LOOK);
        });
        break;
      }
      case "available":
        break;
    }

    return () => {
      alive = false;
      running.forEach((controls) => controls.stop());
      timers.forEach(clearTimeout);
    };
  }, [enabled, state, toward, animate, pose, lastKeystrokeRef]);

  // the invitation greeting: look at the bubble, hop, and wave once
  useEffect(() => {
    if (!enabled || !inviting || state !== "available") return;
    const arm = sideOf(toward) === "left" ? pose.armLeft : pose.armRight;
    lookAt(animate, lookOffset(toward), LOOK);
    const controls = [
      hop(animate, pose, INVITE.hop),
      animate(arm, INVITE.wave, { duration: INVITE.waveSeconds, ease: "easeInOut", delay: 0.2 }),
    ];
    const back = setTimeout(() => lookAt(animate, [0, 0], LOOK), INVITE.lookSeconds * 1000);
    return () => {
      controls.forEach((c) => c.stop());
      clearTimeout(back);
    };
  }, [enabled, inviting, state, toward, animate, pose]);
}
