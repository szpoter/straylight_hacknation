"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { startDemoSession } from "./demo-session";
import { AUTH_PATHS, flowHref, type Flow } from "./flow";
import { InfoIcon } from "./icons";
import { QrPlaceholder } from "./qr-placeholder";
import styles from "./auth.module.css";

// Ekran 4 z ui/NIKODEM.md: kod QR (grafika zastępcza), pięć kroków, licznik od 5:00.
// Po upływie czasu „Kod wygasł” i „Wygeneruj nowy kod”. Dalej prowadzi przycisk
// „Symuluj zeskanowanie kodu”, na komputerze także Spacja. Krok „Udostępnij dane” pomijamy.

const QR_LIFETIME_S = 5 * 60;

const STEPS = [
  "Otwórz aplikację mObywatel na telefonie.",
  "Na dolnym pasku aplikacji wybierz „Kod QR”.",
  "Wybierz „Zeskanuj kod QR”.",
  "Skieruj aparat telefonu na kod widoczny na ekranie.",
  "Potwierdź logowanie w aplikacji.",
];

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function MObywatelPanel({ flow }: { flow: Flow }) {
  const router = useRouter();
  const [generation, setGeneration] = useState(0);
  const [remaining, setRemaining] = useState(QR_LIFETIME_S);
  const [scanned, setScanned] = useState(false);
  const expired = remaining === 0;

  useEffect(() => {
    const deadline = Date.now() + QR_LIFETIME_S * 1000;
    const id = window.setInterval(() => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) window.clearInterval(id);
    }, 250);
    return () => window.clearInterval(id);
  }, [generation]);

  const regenerate = () => {
    setRemaining(QR_LIFETIME_S);
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
        <div className={styles.qrFrame} data-expired={expired || undefined}>
          <QrPlaceholder seed={7 + generation * 7919} className={styles.qr} />
          {expired ? (
            <div className={styles.qrExpired}>
              <p className={styles.qrExpiredTitle}>Kod wygasł</p>
              <Button variant="secondary" size="sm" onClick={regenerate}>
                Wygeneruj nowy kod
              </Button>
            </div>
          ) : null}
        </div>

        {expired ? (
          <p className={styles.timer}>Wygeneruj nowy kod, żeby się zalogować.</p>
        ) : (
          <p className={styles.timer} role="timer" aria-live="off">
            Kod QR wygaśnie za <strong className={styles.timerValue}>{formatTime(remaining)}</strong>
          </p>
        )}
        <p className="visually-hidden" role="status">
          {expired ? "Kod QR wygasł. Wygeneruj nowy kod." : ""}
        </p>

        {/* Po kliknięciu przycisk zostaje w kolorze akcji do czasu przejścia, scan() ignoruje kolejne kliknięcia */}
        <Button className={styles.scanButton} onClick={scan} disabled={expired} aria-disabled={scanned || undefined}>
          {scanned ? "Logowanie…" : "Symuluj zeskanowanie kodu"}
        </Button>
        {expired ? null : (
          <p className={styles.shortcut} aria-hidden="true">
            albo naciśnij <kbd className={styles.kbd}>Spacja</kbd>
          </p>
        )}
      </div>

      <div className={styles.steps}>
        <h2 className={styles.stepsTitle}>Jak się zalogować</h2>
        <ol className={styles.stepList}>
          {STEPS.map((step, index) => (
            <li key={step} className={styles.step}>
              <span className={styles.stepNumber} aria-hidden="true">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
        <p className={styles.hint}>
          <InfoIcon className={styles.hintIcon} />
          <span>
            W wersji demonstracyjnej telefon nie jest potrzebny. Kod niczego nie zawiera, a skanowanie zastępuje
            przycisk pod kodem.
          </span>
        </p>
      </div>
    </div>
  );
}
