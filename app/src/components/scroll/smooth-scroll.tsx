"use client";

import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useEffect } from "react";

// Płynne przewijanie kółkiem myszy (Lenis), jak w referencji. Lenis przesuwa zwykłe przewijanie okna,
// więc position: sticky, zdarzenia scroll i IntersectionObserver działają bez zmian. Dotyk zostaje
// natywny. Przy ograniczeniu ruchu Lenis się nie włącza. Linki do kotwic przewijają płynnie;
// odstęp na przyklejony pasek nawigacji daje scroll-margin-top w globals.css (Lenis go uwzględnia).
// Blokada przewijania (np. na czas ekranu ładowania): lockScroll / unlockScroll z kluczem.
let lenis: Lenis | null = null;
const locks = new Set<string>();

function applyLock() {
  const locked = locks.size > 0;
  document.documentElement.style.overflow = locked ? "hidden" : "";
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
}

export function lockScroll(key: string) {
  locks.add(key);
  applyLock();
}

export function unlockScroll(key: string) {
  locks.delete(key);
  applyLock();
}

/**
 * Płynnie przewija tak, żeby górna krawędź elementu była `offset` px poniżej góry ekranu
 * (ujemny offset = wyżej). Zwraca obietnicę, która spełnia się po dojechaniu.
 */
export function scrollToElement(element: HTMLElement, offset: number): Promise<void> {
  return new Promise((resolve) => {
    if (lenis) {
      lenis.scrollTo(element, { offset, duration: 0.6, force: true, onComplete: () => resolve() });
      return;
    }
    const top = element.getBoundingClientRect().top + window.scrollY + offset;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
    setTimeout(resolve, reduce ? 0 : 450);
  });
}

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const instance = new Lenis({ autoRaf: true, anchors: true });
    lenis = instance;
    applyLock();
    return () => {
      instance.destroy();
      lenis = null;
    };
  }, []);

  return null;
}
