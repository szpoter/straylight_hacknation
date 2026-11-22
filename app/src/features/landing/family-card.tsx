"use client";

import { useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { BalanceScale } from "@/components/illustrations/balance/BalanceScale";
import { SentEnvelope } from "@/components/illustrations/envelope/SentEnvelope";
import { FolderCards } from "@/components/illustrations/folder/FolderCards";
import styles from "./families.module.css";

// Karta w zielonym bloku „Dla rodziców”. W spoczynku ilustracja stoi na pierwszej klatce.
// Najechanie na kartę gra jeden pełny obieg, który kończy się z powrotem na pierwszej klatce
// (bez pętli). Kolejne najechanie w trakcie obiegu nic nie robi, żeby nic nie szarpało.
// Przy ograniczeniu ruchu ilustracja zostaje na pierwszej klatce.
export type IllustrationKind = "folder" | "balance" | "envelope";

/** Długość jednego obiegu w sekundach (pętle komponentów: teczka 4,5, waga 5, koperta 5). */
const PLAY_SECONDS: Record<IllustrationKind, number> = { folder: 4.5, balance: 5, envelope: 5 };

function Illustration({ kind, playing }: { kind: IllustrationKind; playing: boolean }) {
  if (kind === "folder") return playing ? <FolderCards size={200} cycle /> : <FolderCards size={200} at={0} />;
  if (kind === "envelope") return playing ? <SentEnvelope size={172} cycle /> : <SentEnvelope size={172} at={0} />;
  return playing ? (
    <BalanceScale className={styles.balance} loop={false} />
  ) : (
    <BalanceScale className={styles.balance} time={0} />
  );
}

export function FamilyCard({ kind, title, text }: { kind: IllustrationKind; title: string; text: string }) {
  const reduceMotion = useReducedMotion();
  /** Numer obiegu: 0 to spoczynek przed pierwszym najechaniem, każdy kolejny to nowe odtworzenie. */
  const [run, setRun] = useState(0);
  const startedAt = useRef(-Infinity);

  function play() {
    if (reduceMotion || performance.now() - startedAt.current < PLAY_SECONDS[kind] * 1000) return;
    startedAt.current = performance.now();
    setRun((count) => count + 1);
  }

  return (
    <li className={styles.card} onPointerEnter={play}>
      <div className={styles.art}>
        {/* Nowy klucz to nowy obieg od pierwszej klatki */}
        <Illustration key={run} kind={kind} playing={run > 0} />
      </div>
      <h3 className={styles.cardTitle}>{title}</h3>
      <p className={styles.cardText}>{text}</p>
    </li>
  );
}
