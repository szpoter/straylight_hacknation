"use client";

import { useEffect, useRef } from "react";
import styles from "./hero.module.css";

// Film w głównym oknie hero. Bez dźwięku, w pętli, bez widocznych kontrolek.
// Przy ograniczeniu ruchu film nie startuje sam i zostaje kadr startowy.
export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    video.play().catch(() => {
      // Przeglądarka zablokowała autoodtwarzanie: zostaje kadr startowy.
    });
  }, []);

  return (
    <video
      ref={videoRef}
      className={styles.video}
      src="/media/hero-family.mp4"
      poster="/media/hero-family-poster.jpg"
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
    />
  );
}
