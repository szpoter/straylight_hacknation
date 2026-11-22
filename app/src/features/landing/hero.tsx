import type { ReactNode } from "react";
import { ButtonLink } from "@/components/ui/button";
import { HeroVisual } from "./hero-visual";
import { NotepadLines } from "./notepad-lines";
import styles from "./hero.module.css";

// Scena jak na granola.ai (pomiary 1440 × 900): dwa ekrany. Po lewej hero, a pod nim sekcja
// z trzema wierszami na liniach notatnika. Po prawej okno z filmem przyklejone przez jedną
// wysokość ekranu, potem odjeżdża razem z drugą sekcją. Kolory i kroje z DESIGN.md.
// Twarda spacja trzyma jednoliterowe spójniki przy następnym słowie.
const NBSP = " ";

const FEATURES: { icon: ReactNode; text: ReactNode }[] = [
  {
    icon: <DataIcon />,
    text: (
      <>
        <strong>Dane z{NBSP}profilu rodziny</strong> pomagają uzupełnić szkic wniosku
      </>
    ),
  },
  {
    icon: <PlaceIcon />,
    text: (
      <>
        <strong>Wiesz, gdzie złożyć wniosek:</strong> w{NBSP}ZUS, u{NBSP}pracodawcy czy w{NBSP}urzędzie
      </>
    ),
  },
  {
    icon: <CalendarIcon />,
    text: (
      <>
        <strong>Terminy liczone za Ciebie</strong>, ze źródłem przy każdym z{NBSP}nich
      </>
    ),
  },
];

export function Hero() {
  return (
    <div className={styles.hero}>
      <div className={styles.scene}>
        <section className={styles.intro} aria-labelledby="hero-title">
          <a className={styles.badge} href="#agent">
            <span className={styles.badgeTag}>Nowe</span>
            <span className={styles.badgeText}>Agent AI pomoże z{NBSP}wnioskiem</span>
            <ArrowRightIcon className={styles.badgeArrow} />
          </a>

          <h1 id="hero-title" className={styles.title}>
            Co Ci przysługuje i{NBSP}co musisz załatwić?
          </h1>

          <div className={styles.lead}>
            <p>Zasiłki, urlopy i{NBSP}terminy.</p>
            <p>Wszystko w{NBSP}jednym planie.</p>
          </div>

          <div className={styles.cta}>
            <ButtonLink href="/logowanie" variant="primary" className={styles.button}>
              Otwórz profil Oli
              <ArrowRightIcon />
            </ButtonLink>
            <ButtonLink href="/app/rozmowa" variant="secondary">Rozmawiaj z Zusikiem</ButtonLink>
            <p className={styles.note}>
              <SourceIcon />
              <span>Na podstawie informacji ZUS i{NBSP}gov.pl</span>
            </p>
          </div>
        </section>

        <div className={styles.visualLayer}>
          <div className={styles.sticky}>
            <div className={styles.visualSlot}>
              <HeroVisual />
            </div>
          </div>
        </div>

        <section id="formalnosci" className={styles.features} aria-labelledby="features-title">
          <h2 id="features-title" className={styles.featuresTitle}>
            Formalności po kolei, bez zgadywania.
          </h2>
          <NotepadLines>
            <ul className={styles.rows}>
              {FEATURES.map((feature, index) => (
                <li key={index} className={styles.row}>
                  <span className={styles.rowIcon} aria-hidden="true">
                    {feature.icon}
                  </span>
                  <span>{feature.text}</span>
                </li>
              ))}
            </ul>
          </NotepadLines>
        </section>
      </div>
    </div>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 8h10m0 0L9 4m4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SourceIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="m8.5 12.2 2.4 2.4 4.6-5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Ikony wierszy: proste rysunki kreską, 50 × 50 jak w źródle.
function DataIcon() {
  return (
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
      <path d="M14 9h15l8 8v24H14z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M29 9v8h8" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M19 25h13M19 30h13M19 35h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="M4 21h8m0 0-3-3m3 3-3 3"
        stroke="var(--color-primary)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlaceIcon() {
  return (
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
      <path d="M9 20 25 10l16 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 20v18M38 20v18M19 24v10M25 24v10M31 24v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 40h34" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="40" cy="11" r="5" fill="var(--color-tertiary)" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none">
      <rect x="9" y="12" width="32" height="28" rx="4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 20h32M17 8v7M33 8v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path
        d="m19 30 4 4 8-9"
        stroke="var(--color-primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
