import Link from "next/link";
import s from "./scenario-nav.module.css";

const scenarios = [
  { id: "marta", href: "/app", label: "Marta i Paweł", detail: "Urlop rodzicielski" },
  { id: "kamil", href: "/app/kamil", label: "Kamil", detail: "Zasiłek za okres ojcowski" },
  { id: "chorobowe", href: "/app/chorobowe", label: "Chorobowe w ciąży", detail: "Ocena prawa do zasiłku" },
] as const;

export function ScenarioNav({ current }: { current: (typeof scenarios)[number]["id"] }) {
  return (
    <nav className={s.bar} aria-label="Wybór sprawy demonstracyjnej">
      <span className={s.brand}>Przewodnik Rodzica</span>
      <details className={s.menu}>
        <summary>Sprawy demo</summary>
        <div className={s.links}>
          {scenarios.map(({ id, href, label, detail }) => (
            <Link href={href} key={id} aria-current={id === current ? "page" : undefined}>
              <strong>{label}</strong>
              <span>{detail}</span>
            </Link>
          ))}
        </div>
      </details>
    </nav>
  );
}
