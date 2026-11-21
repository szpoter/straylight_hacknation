"use client";

import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { useRef } from "react";
import { Babelek } from "@/components/mascot/Babelek";

/** Part of the section's scroll in which Bąbelek crosses the screen (before and after, it rests). */
const CROSSING = [0.1, 0.9];
/** Scroll speed (section progress per second) that turns Bąbelek into a full drop. */
const FULL_DROP_SPEED = 0.7;
/** When the scroll stops, the drop springs back into shape with a little wobble. */
const SETTLE = { stiffness: 170, damping: 13 };

/**
 * Demo hero: while the page scrolls through this tall section, Bąbelek crosses the screen from left to
 * right (back when scrolling up). The faster the scroll, the more it stretches into a drop.
 */
export function HeroScrollDemo() {
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });

  const left = useTransform(scrollYProgress, CROSSING, ["10%", "90%"]);

  const velocity = useVelocity(scrollYProgress);
  const speed = useTransform(() => {
    const progress = scrollYProgress.get();
    const crossing = progress > CROSSING[0] && progress < CROSSING[1];
    return crossing ? Math.min(1, Math.abs(velocity.get()) / FULL_DROP_SPEED) : 0;
  });
  const travel = useSpring(speed, SETTLE);

  // face where it is going; keep the last direction while standing still
  const heading = useMotionValue(0);
  useMotionValueEvent(velocity, "change", (value) => {
    if (value > 0) heading.set(0);
    else if (value < 0) heading.set(180);
  });

  return (
    <section ref={section} className="relative h-[300vh]">
      <div className="sticky top-0 flex h-screen flex-col justify-between overflow-hidden px-4 py-10">
        <div className="mx-auto flex max-w-3xl flex-col gap-3 text-center">
          <h1 className="text-3xl font-semibold sm:text-5xl">Bąbelek przeprowadzi Cię krok po kroku</h1>
          <p className="text-slate-600">Przewiń w dół: Bąbelek przepłynie na drugą stronę ekranu.</p>
        </div>
        <motion.div style={{ left, x: "-50%" }} className="absolute bottom-[12vh] w-[clamp(110px,16vw,220px)]">
          <Babelek animated travel={travel} heading={heading} title="Bąbelek" className="h-auto w-full" />
        </motion.div>
      </div>
    </section>
  );
}
