"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import styles from "./hero.module.css";

// Linie notatnika co 80 px pod wierszami sekcji. Gdy sekcja wjedzie na ekran, każda linia
// wysuwa się od lewej i prawej krawędzi do środka, kolejne z małym opóźnieniem.
// Nadmiarowe linie obcina kontener, więc liczba wystarcza także na wysokie ekrany.
const LINE_COUNT = 12;

export function NotepadLines({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={styles.lines} data-visible={visible}>
      <div className={styles.lineLayer} aria-hidden="true">
        {Array.from({ length: LINE_COUNT }, (_, index) => (
          <span key={index} className={styles.line} style={{ "--i": index } as CSSProperties} />
        ))}
      </div>
      {children}
    </div>
  );
}
