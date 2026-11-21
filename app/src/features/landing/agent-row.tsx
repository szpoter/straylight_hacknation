"use client";

import { useScroll, useTransform } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";
import { ZusikScrollEntrance } from "@/components/mascot/ZusikScrollEntrance";
import type { ZusikEntranceObject } from "@/components/mascot/ZusikEntrance";
import styles from "./agent.module.css";

// Jeden rząd sekcji „Poznaj Zusika” jako przypięta scena. Rząd przykleja się w górnej części ekranu:
// dopóki scena trwa, przewijanie nie przesuwa strony, tylko prowadzi animację. Zusik zaczyna
// wlatywać, gdy rząd wjeżdża od dołu, ląduje chwilę po przypięciu i zmienia się w przedmiot,
// a reszta sceny daje mu czas na „pracę”. Potem rząd odjeżdża.
// Tekst pojawia się, gdy rząd wjedzie na ekran (data-phase: "static" bez JS i przy ograniczeniu
// ruchu, "idle" ukryty, "active" wejście). Przy ograniczeniu ruchu nie ma przypięcia (CSS).
export function AgentRow({
  side,
  object,
  title,
  children,
}: {
  /** Po której stronie stoi Zusik. Wpływa od tej samej krawędzi ekranu. */
  side: "left" | "right";
  object: ZusikEntranceObject;
  title: ReactNode;
  children: ReactNode;
}) {
  const track = useRef<HTMLDivElement>(null);
  const row = useRef<HTMLDivElement>(null);
  // Postęp sceny: od chwili, gdy góra rzędu wjeżdża na 75% wysokości ekranu (Zusik rusza, zanim
  // rząd się przypnie), do dołu toru u dołu ekranu. Rząd przypina się mniej więcej w połowie tej
  // drogi (ok. 0,6); ZusikScrollEntrance ląduje przy 0,5 swojego postępu, więc przesuwamy to na
  // 0,66 drogi, czyli chwilę po przypięciu. Reszta to czas na „pracę” przedmiotu, zanim rząd odjedzie.
  const { scrollYProgress } = useScroll({ target: track, offset: ["start 75%", "end end"] });
  const progress = useTransform(scrollYProgress, [0, 0.66, 1], [0, 0.5, 1]);

  useEffect(() => {
    const element = row.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.35) element.dataset.phase = "active";
        else if (!entry.isIntersecting) element.dataset.phase = "idle";
      },
      { threshold: [0, 0.35] },
    );
    // Tekst ukrywamy dopiero po uruchomieniu skryptu, żeby bez JS był widoczny.
    element.dataset.phase = "idle";
    observer.observe(element);
    return () => {
      observer.disconnect();
      element.dataset.phase = "static";
    };
  }, []);

  return (
    <div ref={track} className={styles.track}>
      <div ref={row} className={styles.row} data-side={side} data-phase="static">
        <div className={styles.text}>
          <h3 className={styles.rowTitle}>{title}</h3>
          <p className={styles.rowBody}>{children}</p>
        </div>
        <div className={styles.stage}>
          <ZusikScrollEntrance from={side} object={object} progress={progress} />
        </div>
      </div>
    </div>
  );
}
