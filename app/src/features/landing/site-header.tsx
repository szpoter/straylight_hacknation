"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import styles from "./site-header.module.css";

// Kotwice do sekcji strony głównej, w kolejności na stronie. Nazwy jak tytuły sekcji.
const SECTIONS = [
  { href: "#formalnosci", label: "Formalności" },
  { href: "#dla-rodzicow", label: "Dla rodziców" },
  { href: "#agent", label: "Agent AI" },
  { href: "#liczby", label: "Urlop w liczbach" },
];

export function SiteHeader() {
  // Na samej górze strony pasek nie ma tła ani obrysu. Pigułka pojawia się po przewinięciu.
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <>
      <a className={styles.skip} href="#tresc">
        Przejdź do treści
      </a>
      <header className={styles.header}>
        <div className={styles.bar} data-scrolled={scrolled}>
          <Link href="/" className={styles.brand} aria-label="Przewodnik Rodzica, strona główna">
            <BrandMark />
            <span className={styles.brandName}>Przewodnik Rodzica</span>
          </Link>

          <nav className={styles.nav} aria-label="Sekcje strony">
            <ul className={styles.links}>
              {SECTIONS.map((section) => (
                <li key={section.href}>
                  <a className={styles.link} href={section.href}>
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.actions}>
            <ButtonLink href="/logowanie" variant="primary" size="sm">
              Otwórz profil Oli
            </ButtonLink>
          </div>
        </div>
      </header>
    </>
  );
}

function BrandMark() {
  // Dwa koła: rodzic i dziecko. Kolory z tokenów primary i tertiary.
  return (
    <svg className={styles.mark} width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="var(--color-primary)" />
      <circle className={styles.markChild} cx="20.5" cy="19.5" r="6.5" fill="var(--color-tertiary)" strokeWidth="2" />
    </svg>
  );
}
