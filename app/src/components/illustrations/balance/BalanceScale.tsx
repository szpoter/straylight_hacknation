"use client";

import { animate, useInView, useMotionValue, useMotionValueEvent, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import {
  BALL,
  BASE_PATH,
  BEAM,
  LOOP,
  PIVOT,
  PIVOT_RADIUS,
  POST,
  REST,
  STROKE,
  VIEWBOX,
  ballCenter,
  hangOffset,
  panPath,
  scaleFrame,
  stringsPath,
  type Point,
  type ScaleFrame,
  type Side,
} from "./balanceScaleModel";

/*
 * Kolory z tokenów DESIGN.md (zmienne jak w app/src/app/globals.css). Referencja ma miętową podstawę
 * i belkę, ale na bloku w kolorze secondary znikały, więc są białe jak szalki: tak waga czyta się
 * na tle strony, karcie i bloku secondary. Każdą grupę można nadpisać zmienną --balance-*,
 * np. --balance-frame: var(--color-secondary) daje wygląd referencji na białym tle.
 */
const PAINT = {
  ink: "var(--balance-ink, var(--color-on-surface))",
  /** podstawa i belka */
  frame: "var(--balance-frame, var(--color-background))",
  /** słupek, za belką i podstawą */
  post: "var(--balance-post, var(--color-secondary))",
  /** szalki i kółko osi */
  paper: "var(--balance-paper, var(--color-background))",
  green: "var(--balance-green, var(--color-primary))",
  amber: "var(--balance-amber, var(--color-tertiary))",
};

const SIDES: Side[] = ["left", "right"];

type BalanceScaleProps = {
  className?: string;
  /** Opis dla czytnika ekranu. Bez niego ilustracja jest dekoracyjna (aria-hidden). */
  title?: string;
  /**
   * Zatrzymuje wagę w danej sekundzie pętli (0–5), np. do podglądu klatek. Bez tej wartości waga
   * się animuje. Przy ograniczonym ruchu stoi w kadrze spoczynkowym (REST: równowaga, oba kółka).
   */
  time?: number;
  /**
   * Powtarza 5-sekundową pętlę od kadru spoczynkowego (domyślnie). Wyłączona: gra jeden pełny obieg
   * od kadru startowego (przechył, samo zielone kółko) i na nim kończy, więc kolejne odtworzenie
   * nie przeskakuje. Dodane w app/ dla strony głównej.
   */
  loop?: boolean;
};

/**
 * Waga z karty „Zaplanuj opiekę i policz zasiłek”. Bursztynowe kółko opada na prawą szalkę,
 * belka kołysze się do równowagi, kółko się unosi i pętla trwa 5 s (przebieg w balanceScaleModel.ts).
 * Animacja rusza od kadru spoczynkowego, pauzuje poza ekranem, a przy ograniczonym ruchu waga stoi.
 * Z loop={false} gra jeden pełny obieg i kończy na kadrze startowym (wersja w app/ dla strony głównej).
 */
export function BalanceScale({ className, title, time, loop = true }: BalanceScaleProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const beamRef = useRef<SVGRectElement>(null);
  const leftPanRef = useRef<SVGGElement>(null);
  const rightPanRef = useRef<SVGGElement>(null);
  const greenRef = useRef<SVGGElement>(null);
  const amberRef = useRef<SVGGElement>(null);

  const inView = useInView(svgRef);
  const reducedMotion = useReducedMotion();
  /** Sekundy odtwarzania od kadru spoczynkowego. Rośnie bez końca, scaleFrame zawija ją do pętli. */
  const elapsed = useMotionValue(0);
  /** Bez pętli: sekunda obiegu od kadru startowego (0) do końca pętli (LOOP, ten sam kadr). */
  const once = useMotionValue(0);

  const draw = useCallback(({ angle, amberLift, amberOpacity, pulse }: ScaleFrame) => {
    beamRef.current?.setAttribute("transform", `rotate(${angle.toFixed(2)} ${PIVOT.x} ${PIVOT.y})`);
    const pans = { left: leftPanRef.current, right: rightPanRef.current };
    for (const side of SIDES) {
      const offset = hangOffset(side, angle);
      pans[side]?.setAttribute("transform", `translate(${offset.x.toFixed(1)} ${offset.y.toFixed(1)})`);
    }
    greenRef.current?.setAttribute("transform", scaleAround(ballCenter("left"), pulse));
    amberRef.current?.setAttribute(
      "transform",
      `translate(0 ${amberLift.toFixed(1)}) ${scaleAround(ballCenter("right"), pulse)}`,
    );
    amberRef.current?.setAttribute("opacity", amberOpacity.toFixed(3));
  }, []);

  useMotionValueEvent(elapsed, "change", (seconds) => draw(scaleFrame(REST + seconds)));
  useMotionValueEvent(once, "change", (seconds) => draw(scaleFrame(seconds)));

  // Rysunek w JSX to kadr spoczynkowy. Bez pętli pierwszy kadr to start, więc ustawiamy go przed
  // pierwszym malowaniem, żeby nowe odtworzenie nie mignęło kadrem spoczynkowym.
  useLayoutEffect(() => {
    if (!loop && time === undefined && !reducedMotion) draw(scaleFrame(once.get()));
  }, [loop, time, reducedMotion, once, draw]);

  useEffect(() => {
    if (time !== undefined || reducedMotion) {
      draw(scaleFrame(time ?? REST));
      return;
    }
    if (!loop) {
      // Jeden obieg: start od przechyłu, pauza poza ekranem, koniec na tym samym kadrze startowym.
      draw(scaleFrame(once.get()));
      if (!inView || once.get() >= LOOP) return;
      const controls = animate(once, LOOP, { duration: LOOP - once.get(), ease: "linear" });
      return () => controls.stop();
    }
    if (!inView) return;
    // Wznawia od miejsca, w którym animacja stanęła poza ekranem.
    const from = elapsed.get();
    const controls = animate(elapsed, from + LOOP, { duration: LOOP, ease: "linear", repeat: Infinity });
    return () => controls.stop();
  }, [time, reducedMotion, inView, elapsed, once, loop, draw]);

  return (
    <svg
      ref={svgRef}
      viewBox={VIEWBOX}
      className={className}
      fill="none"
      stroke={PAINT.ink}
      strokeWidth={STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
    >
      {/* Od tyłu: słupek, podstawa, szalki, belka, oś. Rysunek pokazuje kadr spoczynkowy. */}
      <rect data-part="post" {...POST} rx={POST.width / 2} fill={PAINT.post} />
      <path data-part="base" d={BASE_PATH} fill={PAINT.frame} />

      {SIDES.map((side) => {
        const center = ballCenter(side);
        return (
          <g key={side} ref={side === "left" ? leftPanRef : rightPanRef} data-part={`pan-${side}`}>
            <path data-part="strings" d={stringsPath(side)} />
            <g ref={side === "left" ? greenRef : amberRef} data-part="ball">
              <circle cx={center.x} cy={center.y} r={BALL.radius} fill={side === "left" ? PAINT.green : PAINT.amber} />
            </g>
            {/* Szalka przed kółkiem: przednia ścianka zasłania jego dół */}
            <path data-part="pan" d={panPath(side)} fill={PAINT.paper} />
          </g>
        );
      })}

      <rect data-part="beam" ref={beamRef} {...BEAM} rx={BEAM.height / 2} fill={PAINT.frame} />
      <circle data-part="pivot" cx={PIVOT.x} cy={PIVOT.y} r={PIVOT_RADIUS} fill={PAINT.paper} />
    </svg>
  );
}

/** Skala wokół punktu (SVG skaluje względem początku układu). */
function scaleAround({ x, y }: Point, scale: number): string {
  return `translate(${x} ${y}) scale(${scale.toFixed(4)}) translate(${-x} ${-y})`;
}
