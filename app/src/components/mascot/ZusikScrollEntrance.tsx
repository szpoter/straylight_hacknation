"use client";

import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  type MotionValue,
} from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Babelek } from "./Babelek";
import { LANDING } from "./travel";
import type { ZusikState } from "./types";
import type { ZusikEntranceObject } from "./ZusikEntrance";

// Wejście Zusika sterowane przewijaniem (tylko w app/, dla sekcji „Poznaj Zusika”). To samo co
// ZusikEntrance — kropla wpływa od krawędzi ekranu i w chwili zatrzymania od razu staje się
// przedmiotem — ale położenie kropli wynika z postępu przewijania (`progress`, 0–1), a nie z czasu.
// Przewijanie w górę cofa kroplę; po cofnięciu za punkt lądowania przedmiot wraca do kropli.
// Przemiana i „praca” przedmiotu po wylądowaniu biegną już w czasie (stany Babelka).

/** Ten sam podział co w ZusikEntrance: ołówek i kalkulator pracują raz, teczka otwiera się sama raz. */
const OBJECTS: Record<ZusikEntranceObject, { state: ZusikState; once: boolean }> = {
  folder: { state: "folder", once: false },
  pencil: { state: "writing", once: true },
  calculator: { state: "calculating", once: true },
};

/**
 * Odcinki postępu: lot od `start` do `land`, potem przedmiot. Powrót do kropli dopiero poniżej
 * `unland`, żeby na granicy nic nie migało.
 */
const SCRUB = { start: 0.04, land: 0.5, unland: 0.44 };

/** Odległość startu jak w ZusikEntrance: ok. 60% szerokości ekranu, ale zawsze spoza ekranu. */
const FLIGHT = { distance: 0.6, margin: 0.15 };

const DEFAULT_SIZE = "clamp(200px, 24vw, 260px)";

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
/** Szybki start, miękkie hamowanie (jak lot w ZusikEntrance). */
const easeOut = (t: number) => 1 - (1 - t) ** 2;

function startDistance(element: HTMLElement, from: "left" | "right") {
  const { left, right, width } = element.getBoundingClientRect();
  const screen = window.innerWidth;
  const offScreen = (from === "right" ? screen - left : right) + width * FLIGHT.margin;
  return Math.max(FLIGHT.distance * screen, offScreen);
}

export function ZusikScrollEntrance({
  from,
  object,
  progress,
  size = DEFAULT_SIZE,
  className,
  title,
}: {
  from: "left" | "right";
  object: ZusikEntranceObject;
  /** Postęp przewijania przez scenę, 0–1. */
  progress: MotionValue<number>;
  size?: number | string;
  className?: string;
  title?: string;
}) {
  const place = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const sign = from === "right" ? 1 : -1;
  const distance = useRef(0);
  // przed pierwszym pomiarem Zusik czeka pełną szerokość ekranu dalej, na pewno poza widokiem
  const x = useMotionValue<number | string>(`${sign * 100}vw`);
  const travel = useMotionValue(1);
  const heading = useMotionValue(from === "right" ? 180 : 0);
  const [landed, setLanded] = useState(false);

  const follow = (value: number) => {
    if (reduceMotion) return;
    const flight = clamp01((value - SCRUB.start) / (SCRUB.land - SCRUB.start));
    x.set(sign * distance.current * (1 - easeOut(flight)));
    if (value >= SCRUB.land) setLanded(true);
    else if (value < SCRUB.unland) setLanded(false);
  };

  useMotionValueEvent(progress, "change", follow);

  // pomiar odległości startu (i po zmianie rozmiaru okna), potem ustawienie według bieżącego postępu
  useEffect(() => {
    const element = place.current;
    if (!element || reduceMotion) return;
    const measure = () => {
      distance.current = startDistance(element, from);
      follow(progress.get());
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
    // follow czyta tylko refy i motion values; pomiar wystarczy przy zmianie strony i ruchu
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from, reduceMotion, progress]);

  // lądowanie: kropla osiada, a kształt przepływa w przedmiot; powrót: przedmiot znów jest kroplą
  useEffect(() => {
    if (reduceMotion) return;
    const settling = animate(travel, landed ? 0 : 1, landed ? LANDING.settle : LANDING.transition);
    return () => settling.stop();
  }, [landed, reduceMotion, travel]);

  // ograniczenie ruchu: bez lotu i przemiany, od razu przedmiot na miejscu
  useEffect(() => {
    if (!reduceMotion) return;
    x.jump(0);
    travel.jump(0);
  }, [reduceMotion, x, travel]);

  const { state, once } = OBJECTS[object];

  return (
    <div ref={place} className={className} style={{ width: size }}>
      <motion.div style={{ x }}>
        <Babelek
          animated
          travel={travel}
          heading={heading}
          state={landed || reduceMotion ? state : "available"}
          once={once}
          toward={from === "right" ? 180 : 0}
          title={title}
          className="block h-auto w-full"
        />
      </motion.div>
    </div>
  );
}
