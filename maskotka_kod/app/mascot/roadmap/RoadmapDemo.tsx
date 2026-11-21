"use client";

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { useState } from "react";
import { Babelek } from "@/components/mascot/Babelek";

const STEPS = ["Krok 1", "Krok 2", "Krok 3", "Krok 4", "Krok 5"];

/** Horizontal position of a step marker, in % of the track width. */
const stepPosition = (step: number) => 8 + (84 * step) / (STEPS.length - 1);

/** A move takes a base time plus a little per step, with a soft start and stop. */
const MOVE = { baseSeconds: 0.5, secondsPerStep: 0.18 };
/** Speed (track % per second) at which Bąbelek is a full drop; slower moves stretch it less. */
const FULL_DROP_SPEED = 60;
/** The drop follows the speed through a spring: it forms as Bąbelek speeds up and wobbles back on arrival. */
const SETTLE = { stiffness: 170, damping: 13 };

/**
 * Demo: Bąbelek sits at the current step of a roadmap. When the step changes it glides there and,
 * like in the hero, the faster it goes the more it stretches into a drop.
 */
export function RoadmapDemo() {
  const [current, setCurrent] = useState(0);
  const reduceMotion = useReducedMotion();

  const position = useMotionValue(stepPosition(0));
  const left = useTransform(position, [0, 100], ["0%", "100%"]);

  const velocity = useVelocity(position);
  const speed = useTransform(velocity, [-FULL_DROP_SPEED, 0, FULL_DROP_SPEED], [1, 0, 1]);
  const travel = useSpring(speed, SETTLE);

  // face where it is going; keep the last direction while standing still
  const heading = useMotionValue(0);
  useMotionValueEvent(velocity, "change", (value) => {
    if (value > 0) heading.set(0);
    else if (value < 0) heading.set(180);
  });

  function goTo(step: number) {
    if (step === current || step < 0 || step >= STEPS.length) return;
    setCurrent(step);
    if (reduceMotion) {
      position.jump(stepPosition(step));
      return;
    }
    const seconds = MOVE.baseSeconds + MOVE.secondsPerStep * Math.abs(step - current);
    animate(position, stepPosition(step), { duration: seconds, ease: "easeInOut" });
  }

  return (
    <section className="flex flex-col gap-8">
      <div className="relative h-64">
        <div className="absolute inset-x-[8%] bottom-12 h-1 rounded-full bg-slate-200" aria-hidden />
        {STEPS.map((label, step) => (
          <button
            key={label}
            type="button"
            onClick={() => goTo(step)}
            aria-current={step === current ? "step" : undefined}
            style={{ left: `${stepPosition(step)}%` }}
            className="absolute bottom-0 flex -translate-x-1/2 flex-col items-center gap-2 text-sm text-slate-600"
          >
            <span
              className={`size-7 rounded-full border-4 ${
                step === current
                  ? "border-babelek-rim bg-babelek-fill"
                  : step < current
                    ? "border-babelek-rim bg-babelek-rim"
                    : "border-slate-300 bg-white"
              }`}
            />
            {label}
          </button>
        ))}
        <motion.div style={{ left, x: "-50%" }} className="absolute bottom-16 w-28">
          <Babelek animated travel={travel} heading={heading} title="Bąbelek" className="h-auto w-full" />
        </motion.div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => goTo(current - 1)}
          disabled={current === 0}
          className="rounded-full border border-slate-300 px-5 py-2 disabled:opacity-40"
        >
          Wstecz
        </button>
        <button
          type="button"
          onClick={() => goTo(current + 1)}
          disabled={current === STEPS.length - 1}
          className="rounded-full bg-babelek-rim px-5 py-2 text-white disabled:opacity-40"
        >
          Dalej
        </button>
      </div>
    </section>
  );
}
