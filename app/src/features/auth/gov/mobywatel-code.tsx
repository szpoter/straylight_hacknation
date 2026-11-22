"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { startDemoSession } from "../demo-session";
import { AUTH_PATHS, flowHref, type Flow } from "../flow";
import { QrPlaceholder } from "../qr-placeholder";
import styles from "./gov.module.css";

// „Aplikacja mObywatel”: kod QR, licznik 5:00 z paskiem i pięć kroków jak na zrzucie z login.gov.pl.
// W demo skanowanie zastępuje kliknięcie w kod QR (albo Spacja), podpowiedź jest w pasku demo.
// Po upływie czasu „Kod QR wygasł” i „Wygeneruj nowy kod”.

const LIFETIME_S = 5 * 60;

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function MObywatelCode({ flow }: { flow: Flow }) {
  const router = useRouter();
  const [generation, setGeneration] = useState(0);
  const [remaining, setRemaining] = useState(LIFETIME_S);
  const [scanned, setScanned] = useState(false);
  const expired = remaining === 0;

  useEffect(() => {
    const deadline = Date.now() + LIFETIME_S * 1000;
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) window.clearInterval(id);
    }, 250);
    return () => window.clearInterval(id);
  }, [generation]);

  const regenerate = () => {
    setRemaining(LIFETIME_S);
    setGeneration((g) => g + 1);
  };

  const scan = useCallback(() => {
    if (expired || scanned) return;
    setScanned(true);
    startDemoSession(flow.origin, flow.entry);
    // replace: po zalogowaniu przycisk „wstecz” w przeglądarce nie wraca do kodu QR.
    router.replace(flowHref(AUTH_PATHS.loading, flow));
  }, [expired, scanned, flow, router]);

  // Skrót Spacja, o ile fokus nie stoi na elemencie, który sam obsługuje Spację.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== " " || event.repeat || event.defaultPrevented) return;
      const target = event.target instanceof Element ? event.target : null;
      if (target?.closest("a, button, input, textarea, select, summary, [contenteditable], [role='button']")) return;
      event.preventDefault();
      scan();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [scan]);

  return (
    <div className={styles.qrLayout}>
      <div className={styles.qrPanel}>
        <div className={styles.qrFrame}>
          <button
            type="button"
            className={styles.qrButton}
            onClick={scan}
            disabled={expired}
            aria-label={scanned ? "Logowanie…" : "Zasymuluj zeskanowanie kodu QR w aplikacji mObywatel"}
          >
            <QrPlaceholder seed={7 + generation * 7919} size={41} quiet={0} marked={false} className={styles.qr} />
          </button>
          {expired ? (
            <div className={styles.qrExpired}>
              <p className={styles.qrExpiredTitle}>Kod QR wygasł</p>
              <button type="button" className={styles.regenerate} onClick={regenerate}>
                Wygeneruj nowy kod
              </button>
            </div>
          ) : null}
        </div>

        <p className={styles.timer} role="timer" aria-live="off">
          Kod QR wygaśnie za: <strong>{formatTime(remaining)}</strong>
        </p>
        <div className={styles.progress} aria-hidden="true">
          <div className={styles.progressBar} style={{ transform: `scaleX(${remaining / LIFETIME_S})` }} />
        </div>
        <p className="visually-hidden" role="status">
          {expired ? "Kod QR wygasł. Wygeneruj nowy kod." : ""}
        </p>
      </div>

      <ol className={styles.steps}>
        <Step n={1}>Zaloguj się do aplikacji mObywatel.</Step>
        <Step n={2}>
          W dolnym menu aplikacji wybierz przycisk <strong>Kod QR.</strong>
        </Step>
        <Step n={3}>
          Wybierz przycisk <strong>Zeskanuj kod QR.</strong>
        </Step>
        <Step n={4}>Zeskanuj aplikacją kod QR z tego ekranu.</Step>
        <Step n={5}>
          W aplikacji wybierz przycisk <strong>Udostępnij dane</strong>, aby przejść do usługi.
        </Step>
      </ol>
    </div>
  );
}

function Step({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className={styles.step}>
      <span className={styles.stepNumber} aria-hidden="true">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}
