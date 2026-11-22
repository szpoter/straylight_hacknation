import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import promoPhoto from "../../../../assets/login-promo.jpg";
import { BrandMark, DemoBar } from "../auth-shell";
import authStyles from "../auth.module.css";
import styles from "./gov.module.css";

// Rama ekranów login.gov.pl i „Aplikacja mObywatel”: lewa kolumna z treścią i stopką,
// po prawej przyklejony panel ze zdjęciem (od 1024 px). Pasek demo zostaje na górze.
// Zamiast godła i logotypu gov.pl jest nazwa przewodnika (ui/NIKODEM.md, punkt 6).

const FOOTER_LINKS = ["Polityka cookies", "Klauzula informacyjna", "Deklaracja dostępności", "Kontakt"];

export function GovShell({ demoNote, children }: { demoNote?: ReactNode; children: ReactNode }) {
  return (
    <div className={styles.page} data-site>
      <a className={authStyles.skip} href="#tresc">
        Przejdź do treści
      </a>
      <DemoBar>{demoNote}</DemoBar>
      <div className={styles.layout}>
        <div className={styles.column}>
          <header className={styles.header}>
            <Link href="/" className={styles.brand} aria-label="Przewodnik Rodzica, strona główna">
              <span className={styles.brandMark}>
                <BrandMark />
              </span>
              <span className={styles.brandName}>Przewodnik Rodzica</span>
            </Link>
          </header>

          <main id="tresc" className={styles.main}>
            {children}
          </main>

          <footer className={styles.footer}>
            <ul className={styles.footerLinks} aria-label="Informacje o usłudze (niedostępne w wersji demonstracyjnej)">
              {FOOTER_LINKS.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          </footer>
        </div>

        <aside className={styles.promo} aria-labelledby="promo-title">
          {/* Panel jest widoczny od 1024 px, więc na telefonie zdjęcie się nie pobiera (ładowanie leniwe) */}
          <div className={styles.promoMedia} aria-hidden="true">
            <Image
              className={styles.promoImage}
              src={promoPhoto}
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 1px"
              placeholder="blur"
            />
            <div className={styles.promoShade} />
          </div>
          <h2 id="promo-title" className={styles.promoTitle}>
            Zamień kody SMS na powiadomienia w aplikacji mObywatel
          </h2>
          <p className={styles.promoText}>
            Potwierdzaj logowanie do profilu zaufanego, zmiany na koncie i podpisywanie dokumentów jednym przyciskiem
            w telefonie - wygodnie i bezpiecznie.
          </p>
          <span className={styles.promoButton} aria-disabled="true" title="Niedostępne w wersji demonstracyjnej">
            Dowiedz się więcej
          </span>
        </aside>
      </div>
    </div>
  );
}
