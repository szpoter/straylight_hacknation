"use client";

import { useEffect, useRef, useState } from "react";
import { lockScroll, unlockScroll } from "@/components/scroll/smooth-scroll";
import styles from "./page-loader.module.css";

// Ekran ładowania strony głównej, wzorowany na referencji (Desktop/index.html): pełny ekran w kolorze
// marki, logo, cienki pasek postępu, a po załadowaniu kurtyna odjeżdża w górę. U nas kurtyna ma
// pofalowaną dolną krawędź (jak zielony blok niżej), a w logo małe bursztynowe kółko („dziecko”)
// wskakuje do dużego. Po zejściu kurtyny wjeżdża treść hero (html[data-intro], hero.module.css).
//
// Czas: co najmniej 1,4 s, najwyżej 2,6 s (jak w referencji), kurtyna 0,85 s. Czekamy na pełne
// załadowanie strony i na fonty, żeby po zejściu kurtyny nic się nie przestawiało.
// Bez JS kurtyna sama zjeżdża po 3,5 s (animacja w CSS). Przy ograniczeniu ruchu ekran znika szybko,
// bez ruchu. Pokazuje się raz na wejście na stronę, nie przy powrotach w obrębie aplikacji.
const TIMING = { min: 1400, max: 2600, exit: 850 };
const REDUCED_TIMING = { min: 200, max: 2600, exit: 200 };

let shownOnce = false;

type Phase = "loading" | "exiting" | "done";

export function PageLoader() {
  const [phase, setPhase] = useState<Phase>(() => (shownOnce ? "done" : "loading"));
  const exitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (phase !== "loading") return;
    shownOnce = true;
    const root = document.documentElement;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timing = reduce ? REDUCED_TIMING : TIMING;
    const startedAt = performance.now();
    // finished: kurtyna już ruszyła; cancelled: efekt sprzątnięty (np. podwójne uruchomienie w trybie dev)
    let finished = false;
    let cancelled = false;

    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    lockScroll("loader");
    if (!reduce) root.dataset.intro = "hidden";

    const finish = () => {
      if (finished || cancelled) return;
      finished = true;
      unlockScroll("loader");
      if (!reduce) root.dataset.intro = "reveal";
      setPhase("exiting");
      exitTimer.current = setTimeout(() => setPhase("done"), timing.exit);
    };

    const loaded = new Promise<void>((resolve) => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", () => resolve(), { once: true });
    });
    Promise.all([loaded, document.fonts.ready]).then(() => {
      const wait = Math.max(0, timing.min - (performance.now() - startedAt));
      setTimeout(finish, wait);
    });
    const fallback = setTimeout(finish, timing.max);

    return () => {
      cancelled = true;
      clearTimeout(fallback);
      unlockScroll("loader");
    };
  }, [phase]);

  useEffect(() => () => {
    if (exitTimer.current) clearTimeout(exitTimer.current);
  }, []);

  if (phase === "done") return null;

  return (
    <div
      className={styles.loader}
      data-phase={phase}
      role="status"
      aria-live="polite"
      aria-label="Ładowanie Przewodnika Rodzica"
    >
      <div className={styles.content}>
        <div className={styles.mark}>
          <svg className={styles.logo} viewBox="0 0 56 56" width="56" height="56" aria-hidden="true">
            <circle className={styles.parent} cx="24" cy="24" r="20" />
            <circle className={styles.child} cx="41" cy="39" r="13" />
          </svg>
          <span className={styles.name}>Przewodnik Rodzica</span>
        </div>
        <div className={styles.track} aria-hidden="true">
          <div className={styles.fill} />
        </div>
      </div>
      {/* Pofalowana dolna krawędź kurtyny: wisi pod ekranem i widać ją, gdy kurtyna odjeżdża w górę */}
      <svg className={styles.wave} viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 0H1440V30C1360 50 1280 50 1200 30S1040 10 960 30 800 50 720 30 560 10 480 30 320 50 240 30 80 10 0 30Z" />
      </svg>
    </div>
  );
}
