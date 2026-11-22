"use client";

import { useEffect, useState } from "react";
import { demoCode } from "../demo-random";
import { QrPlaceholder } from "../qr-placeholder";
import { TimerIcon } from "../service-icons";
import styles from "./ezus.module.css";

// Kod QR i ciąg znaków dla aplikacji mobilnej ZUS. W demo tej aplikacji nie da się użyć,
// więc kod tylko odlicza ważność, a po jej upływie zamienia się na nowy (jak na stronie eZUS).

const LIFETIME_S = 2 * 60;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function ZusAppCode() {
  const [generation, setGeneration] = useState(0);
  const [remaining, setRemaining] = useState(LIFETIME_S);

  useEffect(() => {
    const deadline = Date.now() + LIFETIME_S * 1000;
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      if (left === 0) {
        window.clearInterval(id);
        setRemaining(LIFETIME_S);
        setGeneration((g) => g + 1);
        return;
      }
      setRemaining(left);
    }, 250);
    return () => window.clearInterval(id);
  }, [generation]);

  const seed = 4211 + generation * 7919;

  return (
    <div className={styles.zusCard}>
      <div className={styles.codeGrid}>
        <div className={styles.qrSide}>
          <p className={styles.qrLabel}>Zeskanuj kod QR</p>
          <QrPlaceholder seed={seed} size={21} quiet={0} marked={false} className={styles.qr} />
        </div>
        <p className={styles.or}>lub</p>
        <div className={styles.codeSide}>
          <p className={styles.codeLabel}>wprowadź poniższy ciąg znaków w aplikacji:</p>
          <p className={styles.code}>{demoCode(seed)}</p>
        </div>
      </div>
      <p className={styles.expiry} role="timer" aria-live="off">
        <TimerIcon className={styles.timerIcon} />
        <span>
          Kod straci ważność za <strong>{formatTime(remaining)} min</strong>
        </span>
      </p>
    </div>
  );
}
