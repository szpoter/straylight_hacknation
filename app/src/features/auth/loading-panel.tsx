"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { AuthScreen } from "./auth-shell";
import { setDemoData, startDemoSession, useDemoSession } from "./demo-session";
import { AUTH_PATHS, type Flow } from "./flow";
import { AlertIcon, CheckIcon } from "./icons";
import styles from "./auth.module.css";

// Ekran 5 z ui/NIKODEM.md: „Wczytujemy przykładowe dane z ZUS…” przez ok. 2 s.
// Sukces prowadzi dalej (na razie ekran zastępczy /start). Po „Przetestuj błąd pobierania
// danych” rodzic zostaje zalogowany w demo i ma „Spróbuj ponownie” oraz „Wpisz dane samodzielnie”.

const ITEMS = [
  "Tożsamość potwierdzona w mObywatel",
  "Ubezpieczenie chorobowe",
  "Tytuł i okres ubezpieczenia",
];

const STEP_MS = 700;
const FINISH_MS = 2100;

type Phase = "loading" | "error";

export function LoadingPanel({ flow }: { flow: Flow }) {
  const router = useRouter();
  const session = useDemoSession();
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<Phase>("loading");
  const [done, setDone] = useState(1);
  // Symulowany błąd dotyczy tylko pierwszej próby. „Spróbuj ponownie” kończy się sukcesem.
  const failThisAttempt = flow.simulateError && attempt === 0;

  // Wejście z pominięciem kodu QR (np. odświeżenie po zamknięciu karty) też zaczyna sesję demo.
  useEffect(() => {
    if (session === null) startDemoSession(flow.origin, flow.entry);
  }, [session, flow.origin, flow.entry]);

  useEffect(() => {
    if (phase !== "loading") return;
    const timers: number[] = [];
    if (!failThisAttempt) {
      timers.push(window.setTimeout(() => setDone(2), STEP_MS));
      timers.push(window.setTimeout(() => setDone(3), STEP_MS * 2));
    }
    timers.push(
      window.setTimeout(() => {
        if (failThisAttempt) {
          setPhase("error");
          return;
        }
        setDemoData("zus");
        router.replace(AUTH_PATHS.afterLogin);
      }, FINISH_MS),
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [phase, attempt, failThisAttempt, router]);

  const retry = () => {
    setDone(1);
    setPhase("loading");
    setAttempt((a) => a + 1);
  };

  const enterManually = () => {
    setDemoData("manual");
    router.replace(AUTH_PATHS.afterLogin);
  };

  if (phase === "error") {
    return (
      <AuthScreen
        service="Dane z ZUS"
        title="Nie udało się wczytać danych z ZUS"
        lead="Logowanie przez mObywatel się udało, więc zostajesz w wersji demonstracyjnej. Spróbuj ponownie albo wpisz dane samodzielnie."
      >
        <div role="alert">
          <ProgressList done={1} failed />
        </div>
        <div className={styles.actions}>
          <Button onClick={retry}>Spróbuj ponownie</Button>
          <Button variant="secondary" onClick={enterManually}>
            Wpisz dane samodzielnie
          </Button>
        </div>
        <p className={styles.footnote}>
          Ten błąd wywołał link „Przetestuj błąd pobierania danych”. Ponowna próba się uda.
        </p>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      service="Dane z ZUS"
      title="Wczytujemy przykładowe dane z ZUS…"
      lead="To potrwa chwilę. Dane pochodzą z fikcyjnego profilu, nie z prawdziwego konta."
    >
      <div role="status" aria-live="polite">
        <ProgressList done={done} />
      </div>
    </AuthScreen>
  );
}

function ProgressList({ done, failed = false }: { done: number; failed?: boolean }) {
  return (
    <ul className={styles.progress}>
      {ITEMS.map((label, index) => {
        const state = index < done ? "done" : failed ? "failed" : index === done ? "active" : "waiting";
        return (
          <li key={label} className={styles.progressItem} data-state={state}>
            <span className={styles.progressMark} aria-hidden="true">
              {state === "done" ? <CheckIcon /> : state === "failed" ? <AlertIcon /> : null}
            </span>
            <span className={styles.progressLabel}>{label}</span>
            <span className={styles.progressState}>
              {state === "done"
                ? "Gotowe"
                : state === "failed"
                  ? "Nie wczytano"
                  : state === "active"
                    ? "Wczytujemy…"
                    : "Czeka"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
