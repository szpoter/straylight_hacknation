"use client";

import { useEffect, useRef, type ReactNode } from "react";

// Wielki nagłówek, który przy przewijaniu zjeżdża w dół i chowa się pod blok poniżej
// (jak „For the doers” na granola.ai). Ruch jest równomierny na odcinku pół wysokości ekranu:
// start, gdy góra obszaru nagłówka jest na 0,383 wysokości ekranu, koniec 0,117 nad krawędzią
// (dopasowane do pomiarów granola.ai przy 1440 × 900). Wartość trafia do zmiennej --sink (0–1),
// przesunięcie robi CSS.
const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function SinkingHeading({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const heading = ref.current;
    const area = heading?.parentElement;
    if (!heading || !area) return;
    const query = window.matchMedia("(prefers-reduced-motion: no-preference)");
    let frame = 0;

    const update = () => {
      frame = 0;
      const viewport = window.innerHeight;
      const top = area.getBoundingClientRect().top;
      const progress = clamp01((0.383 * viewport - top) / (0.5 * viewport));
      heading.style.setProperty("--sink", progress.toFixed(4));
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
      heading.style.removeProperty("--sink");
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
    <h2 ref={ref} id={id} className={className}>
      {children}
    </h2>
  );
}
