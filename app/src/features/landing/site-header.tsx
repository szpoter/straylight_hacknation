"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
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
            <Logo className={styles.logo} />
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
            <ButtonLink href="/rejestracja" variant="ghost" size="sm" className={styles.register}>
              Zarejestruj się
            </ButtonLink>
            <ButtonLink href="/logowanie" variant="primary" size="sm">
              Zaloguj się
            </ButtonLink>
          </div>
        </div>
      </header>
    </>
  );
}
