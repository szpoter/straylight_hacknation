import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon, InfoIcon } from "./icons";
import styles from "./auth.module.css";

type AuthShellProps = {
  aside?: ReactNode;
  /** Tekst paska demo zamiast domyślnego, np. podpowiedź, jak przejść dalej na tym ekranie. */
  demoNote?: ReactNode;
  /** Stopka pod treścią (ekrany eZUS mają stopkę strony głównej). */
  footer?: ReactNode;
  /** Klasa <main> zamiast domyślnej karty na środku, gdy ekran ma własny układ. */
  mainClassName?: string;
  className?: string;
  children: ReactNode;
};

// Rama ścieżki demo. Na każdym ekranie nazwa przewodnika i stały pasek
// „Wersja demonstracyjna · nie podawaj prawdziwych danych” (ui/NIKODEM.md, punkt 6).
export function AuthShell({ aside, demoNote, footer, mainClassName, className, children }: AuthShellProps) {
  return (
    <div className={className ? `${styles.shell} ${className}` : styles.shell} data-site>
      <a className={styles.skip} href="#tresc">
        Przejdź do treści
      </a>
      <DemoBar>{demoNote}</DemoBar>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Przewodnik Rodzica, strona główna">
          <BrandMark />
          <span className={styles.brandName}>Przewodnik Rodzica</span>
        </Link>
        {aside ? <div className={styles.headerAside}>{aside}</div> : null}
      </header>
      <main id="tresc" className={mainClassName ?? styles.main}>
        {children}
      </main>
      {footer}
    </div>
  );
}

/** Stały pasek o symulacji. Bez treści pokazuje „Wersja demonstracyjna · nie podawaj prawdziwych danych”. */
export function DemoBar({ children }: { children?: ReactNode }) {
  return (
    <p className={styles.demoBar} role="note">
      <InfoIcon className={styles.demoBarIcon} />
      <span>
        {children ?? (
          <>
            Wersja demonstracyjna · <strong>nie podawaj prawdziwych danych</strong>
          </>
        )}
      </span>
    </p>
  );
}

type AuthScreenProps = {
  /** Usługa, w której rodzic jest na tym kroku, np. „eZUS” albo „login.gov.pl”. */
  service: string;
  title: ReactNode;
  lead?: ReactNode;
  back?: { href: string; label?: string };
  wide?: boolean;
  children?: ReactNode;
};

/** Jedna karta na środku ekranu: usługa, nagłówek, opis i treść kroku. */
export function AuthScreen({ service, title, lead, back, wide, children }: AuthScreenProps) {
  return (
    <div className={styles.screen} data-wide={wide || undefined}>
      {back ? (
        <Link href={back.href} className={styles.back}>
          <ArrowLeftIcon className={styles.backIcon} />
          {back.label ?? "Wróć"}
        </Link>
      ) : null}
      <section className={styles.card} aria-labelledby="auth-title">
        <p className={styles.service}>
          <span className={styles.serviceDot} aria-hidden="true" />
          {service}
          <span className={styles.serviceDemo}>· symulacja</span>
        </p>
        <h1 id="auth-title" className={styles.title}>
          {title}
        </h1>
        {lead ? <p className={styles.lead}>{lead}</p> : null}
        {children}
      </section>
    </div>
  );
}

export function BrandMark() {
  // Ten sam znak co w nagłówku strony głównej: rodzic i dziecko.
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="var(--color-primary)" />
      <circle
        cx="20.5"
        cy="19.5"
        r="6.5"
        fill="var(--color-tertiary)"
        stroke="var(--color-background)"
        strokeWidth="2"
      />
    </svg>
  );
}
