"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import panelLeft from "../../../assets/Flat_graphic_design_panel_e045dfc5_2K.jpg";
import panelRight from "../../../assets/Tree_branches_against_sky_3d0c33da_2K.jpg";
import { HeroVideo } from "./hero-video";
import styles from "./hero.module.css";

// Ruch powiązany z przewijaniem, odczytany z granola.ai (1440 × 900). Okno jest przyklejone
// (hero.module.css, .sticky), a tu liczymy tylko skalę i przesunięcia. Odległości liczymy
// w wysokościach okna, więc proporcje zostają te same przy innym rozmiarze ekranu:
// - okno z filmem: przez 1 wysokość okna maleje ze 120% do 100% wzorca i wraca na środek,
// - zdjęcie z prawej: 0,11–0,56 wysokości okna wjeżdża za okno i maleje do 75% (przyspiesza),
// - panel z lewej: to samo w 0,22–0,67, czyli chwilę później,
// - oba panele bledną do zera w 0,56–0,89.
// Tylko od 1024 px i bez ograniczenia ruchu. Wartości trafiają do zmiennych CSS w hero.module.css.
const PROPS = ["--p-window", "--p-right", "--p-left", "--p-fade"] as const;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));
const easeIn = (t: number) => t * t * t;
const progress = (y: number, start: number, end: number) => clamp01((y - start) / (end - start));

export function HeroVisual() {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const query = window.matchMedia("(min-width: 1024px) and (prefers-reduced-motion: no-preference)");
    let frame = 0;

    const update = () => {
      frame = 0;
      const y = window.scrollY / window.innerHeight;
      stage.style.setProperty("--p-window", progress(y, 0, 1).toFixed(4));
      stage.style.setProperty("--p-right", easeIn(progress(y, 0.11, 0.56)).toFixed(4));
      stage.style.setProperty("--p-left", easeIn(progress(y, 0.22, 0.67)).toFixed(4));
      stage.style.setProperty("--p-fade", (1 - progress(y, 0.56, 0.89)).toFixed(4));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const start = () => {
      update();
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
    };
    const stop = () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      cancelAnimationFrame(frame);
      frame = 0;
      PROPS.forEach((prop) => stage.style.removeProperty(prop));
    };
    const sync = () => (query.matches ? start() : stop());

    sync();
    query.addEventListener("change", sync);
    return () => {
      query.removeEventListener("change", sync);
      stop();
    };
  }, []);

  return (
    <div className={styles.stage} ref={stageRef}>
      <div className={`${styles.panel} ${styles.panelLeft}`} aria-hidden="true">
        <Image src={panelLeft} alt="" fill sizes="(min-width: 1024px) 380px, 60vw" placeholder="blur" />
      </div>
      <div className={`${styles.panel} ${styles.panelRight}`} aria-hidden="true">
        <Image src={panelRight} alt="" fill sizes="(min-width: 1024px) 530px, 80vw" placeholder="blur" />
      </div>
      <div className={styles.window}>
        <HeroVideo />
      </div>
    </div>
  );
}
