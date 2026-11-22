import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftIcon } from "./icons";
import styles from "./auth.module.css";

export function AuthShell({ aside, children }: { aside?: ReactNode; children: ReactNode }) {
  return (
    <div className={styles.shell} data-site>
      <a className={styles.skip} href="#tresc">
        Przejdź do treści
      </a>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Przewodnik Rodzica, strona główna">
          <BrandMark />
          <span className={styles.brandName}>Przewodnik Rodzica</span>
        </Link>
        {aside ? <div className={styles.headerAside}>{aside}</div> : null}
      </header>
      <main id="tresc" className={styles.main}>
        {children}
      </main>
    </div>
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

function BrandMark() {
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
