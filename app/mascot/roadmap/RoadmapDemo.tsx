"use client";

import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { useRef, useState } from "react";
import { Babelek } from "@/components/mascot/Babelek";

const STEPS = ["Krok 1", "Krok 2", "Krok 3", "Krok 4", "Krok 5"];

/** Horizontal position of a step marker, in % of the track width. */
const stepPosition = (step: number) => 8 + (84 * step) / (STEPS.length - 1);

/** The move: the drop forms, glides along a small arc, then lands with a jelly wobble. */
const MOVE = {
  formSeconds: 0.3,
  secondsPerStep: 0.35,
  minSeconds: 0.7,
  hop: 36,
  land: { type: "spring", stiffness: 260, damping: 11 },
} as const;

/** Demo: Bąbelek sits at the current step of a roadmap and travels as a drop when the step changes. */
export function RoadmapDemo() {
  const [current, setCurrent] = useState(0);
  const move = useRef(0);
  const reduceMotion = useReducedMotion();

  const position = useMotionValue(stepPosition(0));
  const left = useTransform(position, (value) => `${value}%`);
  const hop = useMotionValue(0);
  const travel = useMotionValue(0);
  const heading = useMotionValue(0);

  async function goTo(step: number) {
    if (step === current || step < 0 || step >= STEPS.length) return;
    const from = current;
    setCurrent(step);
    if (reduceMotion) {
      position.jump(stepPosition(step));
      return;
    }

    const id = ++move.current;
    const seconds = Math.max(MOVE.minSeconds, MOVE.secondsPerStep * Math.abs(step - from));
    heading.set(step > from ? 0 : 180);
    animate(travel, 1, { duration: MOVE.formSeconds, ease: "easeOut" });
    animate(hop, [0, -MOVE.hop, 0], { duration: seconds, ease: "easeInOut" });
    await animate(position, stepPosition(step), { duration: seconds, ease: [0.45, 0, 0.25, 1] });
    // land only if no newer move started meanwhile
    if (id === move.current) animate(travel, 0, MOVE.land);
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
        <motion.div style={{ left, x: "-50%", y: hop }} className="absolute bottom-16 w-28">
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
