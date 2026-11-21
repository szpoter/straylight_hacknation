"use client";

import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform, useVelocity } from "motion/react";
import { useEffect, useRef } from "react";
import { Zusik } from "@/components/mascot/Zusik";

/** Przejście trwa chwilę plus trochę za każde 100 px drogi, z miękkim startem i końcem. */
const MOVE = { baseSeconds: 0.55, secondsPer100px: 0.12, maxSeconds: 1.8 };
/** Ten sam sprężynowy „opad” kropli co w demo maskotka_kod/app/mascot/roadmap. */
const SETTLE = { stiffness: 170, damping: 13 };

/**
 * Bąbelek-pionek. Stoi (lewituje) nad podestem pionka; gdy pionek zmienia pole, płynie tam,
 * po drodze zmieniając się w kroplę (`travel`, `heading` z komponentu maskotki).
 * Przy ograniczonym ruchu pojawia się od razu na nowym polu.
 *
 * `x` i `y` to środek dołu Bąbelka; `unit` dotyczy tylko `x` (px na komputerze, % na telefonie).
 */
export function TravellingZusik({
  x,
  y,
  unit = "px",
  size,
  fullDropSpeed,
  children,
}: {
  x: number;
  y: number;
  unit?: "px" | "%";
  size: number;
  /** Prędkość (jednostki `x` na sekundę), przy której Bąbelek jest pełną kroplą. */
  fullDropSpeed: number;
  /** Dymek lub inne elementy przyklejone do Bąbelka. */
  children?: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const px = useMotionValue(x);
  const py = useMotionValue(y);
  const left = useTransform(px, (v) => `${v}${unit}`);

  const vx = useVelocity(px);
  const vy = useVelocity(py);
  const speed = useTransform(() => Math.min(1, Math.hypot(vx.get(), vy.get() * (unit === "%" ? 0.15 : 1)) / fullDropSpeed));
  const travel = useSpring(speed, SETTLE);

  const heading = useMotionValue(0);
  useMotionValueEvent(vx, "change", () => {
    const dx = vx.get();
    const dy = vy.get() * (unit === "%" ? 0.15 : 1);
    if (Math.hypot(dx, dy) > fullDropSpeed * 0.05) heading.set((Math.atan2(dy, dx) * 180) / Math.PI);
  });

  const first = useRef(true);
  useEffect(() => {
    if (first.current || reduce) {
      first.current = false;
      px.jump(x);
      py.jump(y);
      return;
    }
    const distance = Math.hypot((x - px.get()) * (unit === "%" ? 4 : 1), y - py.get());
    const duration = Math.min(MOVE.maxSeconds, MOVE.baseSeconds + (MOVE.secondsPer100px * distance) / 100);
    const a = animate(px, x, { duration, ease: "easeInOut" });
    const b = animate(py, y, { duration, ease: "easeInOut" });
    return () => {
      a.stop();
      b.stop();
    };
  }, [x, y, unit, reduce, px, py]);

  return (
    <motion.div className="pointer-events-none absolute z-20" style={{ left, top: py, x: "-50%", y: "-100%" }}>
      <div className="relative">
        <Zusik size={size} animated travel={travel} heading={heading} toward={90} />
        {children}
      </div>
    </motion.div>
  );
}
