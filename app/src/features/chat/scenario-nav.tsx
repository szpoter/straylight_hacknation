import Link from "next/link";
import s from "./scenario-nav.module.css";

const scenarios = [
  { id: "ogolna", href: "/app/rozmowa", label: "Rozmowa ogólna", detail: "Pytania o świadczenia i dokumenty" },
  { id: "marta", href: "/app", label: "Marta i Paweł", detail: "Urlop rodzicielski", action: "Porównaj warianty urlopu" },
  { id: "kamil", href: "/app/kamil", label: "Kamil", detail: "Zasiłek za okres ojcowski", action: "Przygotuj wniosek o urlop ojcowski" },
  { id: "chorobowe", href: "/app/chorobowe", label: "Chorobowe w ciąży", detail: "Ocena prawa do zasiłku", action: "Sprawdź chorobowe w ciąży" },
] as const;

export type Scenario = (typeof scenarios)[number]["id"];

export function ScenarioShortcuts() {
  return (
    <nav className={s.shortcuts} aria-label="Rozpocznij sprawę">
      {scenarios.map(scenario => "action" in scenario && (
        <Link href={scenario.href} key={scenario.id}>{scenario.action}</Link>
      ))}
    </nav>
  );
}

export function ScenarioNav({ current }: { current: Scenario }) {
  return (
    <nav className={s.bar} aria-label="Wybór sprawy demonstracyjnej">
      <span className={s.brand}>Przewodnik Rodzica</span>
      <ScenarioMenu current={current} />
    </nav>
  );
}

export function ScenarioMenu({ current, label = "Sprawy demo" }: { current: Scenario; label?: string }) {
  return (
    <details className={s.menu}>
      <summary>{label}</summary>
      <div className={s.links}>
        {scenarios.map(({ id, href, label, detail }) => (
          <Link href={href} key={id} aria-current={id === current ? "page" : undefined}>
            <strong>{label}</strong>
            <span>{detail}</span>
          </Link>
        ))}
      </div>
    </details>
  );
}
