"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import styles from "./example-card.module.css";

// Karta „Moja sytuacja / Mój plan” z SPEC.md. Fikcyjny przypadek, bez własnej akcji.
// Zakładki według W3C APG Tabs: strzałki z zawijaniem, Home/End, panel zmienia się od razu.
const TABS = [
  { key: "situation", label: "Moja sytuacja" },
  { key: "plan", label: "Mój plan" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function ExampleCard() {
  const [active, setActive] = useState<TabKey>("plan");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const baseId = useId();
  const tabId = (key: TabKey) => `${baseId}-tab-${key}`;
  const panelId = (key: TabKey) => `${baseId}-panel-${key}`;

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = TABS.findIndex((tab) => tab.key === active);
    let next: number | null = null;
    if (event.key === "ArrowRight") next = (current + 1) % TABS.length;
    if (event.key === "ArrowLeft") next = (current - 1 + TABS.length) % TABS.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = TABS.length - 1;
    if (next === null) return;
    event.preventDefault();
    setActive(TABS[next].key);
    tabRefs.current[next]?.focus();
  }

  return (
    <section className={styles.card} aria-label="Przykład: plan rodzica po narodzinach dziecka">
      <div className={styles.chrome}>
        <span className={styles.dots} aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span className={styles.example}>Przykład</span>
      </div>

      <div className={styles.body}>
        <p className={styles.context}>Po narodzinach dziecka</p>

        <div role="tablist" aria-label="Widok przykładu" className={styles.tabs} onKeyDown={onKeyDown}>
          {TABS.map((tab, index) => {
            const selected = tab.key === active;
            return (
              <button
                key={tab.key}
                ref={(node) => {
                  tabRefs.current[index] = node;
                }}
                type="button"
                role="tab"
                id={tabId(tab.key)}
                aria-selected={selected}
                aria-controls={panelId(tab.key)}
                tabIndex={selected ? 0 : -1}
                className={styles.tab}
                onClick={() => setActive(tab.key)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Oba panele w jednej komórce siatki: karta nie zmienia wysokości przy przełączaniu */}
        <div className={styles.panels}>
          <div
            role="tabpanel"
            id={panelId("situation")}
            aria-labelledby={tabId("situation")}
            tabIndex={0}
            className={styles.panel}
            data-active={active === "situation"}
          >
            <blockquote className={styles.quote}>
              „Urodziła nam się córka. Pracuję na etacie i{" "}chcę wziąć urlop ojcowski.”
            </blockquote>
            <ul className={styles.facts}>
              <li>Narodziny w{" "}Polsce</li>
              <li>Praca na etacie</li>
              <li>Urlop ojcowski</li>
            </ul>
          </div>

          <div
            role="tabpanel"
            id={panelId("plan")}
            aria-labelledby={tabId("plan")}
            tabIndex={0}
            className={styles.panel}
            data-active={active === "plan"}
          >
            <ol className={styles.plan}>
              <li className={styles.item} data-kind="required">
                <span className={styles.marker} aria-hidden="true" />
                <div>
                  <p className={styles.kind}>Do załatwienia</p>
                  <p className={styles.text}>
                    <strong>Zgłoś urodzenie córki.</strong> Online lub w{" "}USC, w{" "}ciągu 21 dni od
                    wystawienia karty urodzenia.
                  </p>
                  <ExternalLink href="https://www.gov.pl/web/gov/zglos-urodzenie-dziecka">
                    Zgłoszenie urodzenia
                  </ExternalLink>
                </div>
              </li>
              <li className={styles.item} data-kind="optional">
                <span className={styles.marker} aria-hidden="true" />
                <div>
                  <p className={styles.kind}>Jeśli chcesz wziąć urlop ojcowski</p>
                  <p className={styles.text}>
                    <strong>Złóż wniosek u{" "}pracodawcy</strong> co najmniej 7 dni przed rozpoczęciem
                    urlopu.
                  </p>
                  <ExternalLink href="https://www.gov.pl/web/rodzina/urlop-ojcowski">Urlop ojcowski</ExternalLink>
                </div>
              </li>
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a className={styles.source} href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path
          d="M4.5 2.5h5v5M9.5 2.5 3 9"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="visually-hidden"> (otwiera się w nowej karcie)</span>
    </a>
  );
}
