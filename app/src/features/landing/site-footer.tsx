import type { ReactNode } from "react";
import styles from "./site-footer.module.css";

// Stopka strony głównej. Treść według SPEC.md („Po bento — wejście do demo i stopka”) i wymagań
// z treści zadania ZUS (s. 13–16):
// - przekierowania do informacji o uprawnieniach na www.zus.pl, w ministerstwie i w PIP,
// - informacje o podmiotach wspierających w szczególnych sytuacjach (np. śmierć dziecka),
// - odpis aktu urodzenia (rejestr stanu cywilnego na gov.pl),
// - wskazanie, które funkcje działają z AI,
// - logowanie przez mObywatel i pobieranie danych z ZUS są wyłącznie symulowane.
// Linki zewnętrzne otwierają się w nowej karcie, z ikoną i informacją dla czytnika ekranu.
const NBSP = " ";

const OFFICIAL = [
  { label: "ZUS: zasiłek macierzyński", href: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/komu-przysluguje" },
  { label: "ZUS: wnioski i informacje", href: "https://www.zus.pl" },
  { label: "Ministerstwo Rodziny, Pracy i Polityki Społecznej: urlop rodzicielski", href: "https://www.gov.pl/web/rodzina/urlop-rodzicielski" },
  { label: "Państwowa Inspekcja Pracy: prawa rodziców", href: "https://www.pip.gov.pl/dla-pracodawcow/porady-prawne/rodzicielstwo" },
  { label: "gov.pl: odpis aktu urodzenia", href: "https://www.gov.pl/web/cyfryzacja/rejestr-stanu-cywilnego" },
];

const SUPPORT = [
  { label: "Fundacja Ernesta: wsparcie po stracie dziecka", href: "https://fundacjaernesta.pl/jak-pomagamy/" },
];

const GUIDE = [
  { label: "Poznaj Zusika", href: "#agent" },
  { label: "Urlop w liczbach", href: "#liczby" },
  { label: "Zaloguj się", href: "/logowanie" },
  { label: "Zarejestruj się", href: "/rejestracja" },
];

export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <p className={styles.brandName}>
              <BrandMark />
              Przewodnik Rodzica
            </p>
            <p className={styles.brandText}>
              Formalności, zasiłki i{NBSP}urlopy związane z{NBSP}rodzicielstwem w{NBSP}jednym planie.
            </p>
            <p className={styles.demo}>
              Wersja demonstracyjna. Logowanie przez mObywatel i{NBSP}pobranie danych z{NBSP}ZUS są
              symulowane, a{NBSP}dane w{NBSP}przykładach są fikcyjne.
            </p>
          </div>

          <nav className={styles.columns} aria-label="Stopka">
            <LinkGroup title="Oficjalne informacje">
              {OFFICIAL.map((link) => (
                <li key={link.href}>
                  <ExternalLink href={link.href}>{link.label}</ExternalLink>
                </li>
              ))}
            </LinkGroup>
            <LinkGroup title="Pomoc w trudnej sytuacji">
              {SUPPORT.map((link) => (
                <li key={link.href}>
                  <ExternalLink href={link.href}>{link.label}</ExternalLink>
                </li>
              ))}
              <li className={styles.note}>
                Bezpłatne wsparcie dla rodziców po stracie dziecka lub w{NBSP}innej trudnej sytuacji
                okołoporodowej.
              </li>
            </LinkGroup>
            <LinkGroup title="Przewodnik">
              {GUIDE.map((link) => (
                <li key={link.href}>
                  <a className={styles.link} href={link.href}>
                    {link.label}
                  </a>
                </li>
              ))}
            </LinkGroup>
          </nav>
        </div>

        <div className={styles.bottom}>
          <p>
            <strong>Funkcje oparte na AI:</strong> asystent Zusik wyszukuje odpowiedzi w{NBSP}materiałach
            ZUS ze wskazaniem źródła i{NBSP}pomaga przygotować szkic wniosku. Kwoty i{NBSP}terminy liczy
            kalkulator według przepisów, nie model AI.
          </p>
          <p>
            Projekt konkursowy HackNation 2026, zadanie ZUS. To nie jest oficjalny serwis ZUS. © 2026 Zespół
            Straylight
          </p>
        </div>
      </div>

      <p className={styles.wordmark} aria-hidden="true">
        Przewodnik Rodzica
      </p>
    </footer>
  );
}

function LinkGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={styles.group}>
      <h2 className={styles.groupTitle}>{title}</h2>
      <ul className={styles.list}>{children}</ul>
    </div>
  );
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className={styles.link} href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <svg className={styles.external} width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M4.5 2.5h5v5M9.5 2.5 3 9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="visually-hidden"> (otwiera się w nowej karcie)</span>
    </a>
  );
}

function BrandMark() {
  // Logo jak w nawigacji: duże koło (rodzic) i małe (dziecko); na zielonym tle duże jest białe
  return (
    <svg className={styles.mark} width="28" height="28" viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="var(--color-on-primary)" />
      <circle cx="20.5" cy="19.5" r="6.5" fill="var(--color-tertiary)" stroke="var(--color-primary)" strokeWidth="2" />
    </svg>
  );
}
