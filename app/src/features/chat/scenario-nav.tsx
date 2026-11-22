import { chatStarters } from "@/lib/zusik/conversation";
import Link from "next/link";
import s from "./scenario-nav.module.css";

const scenarios = [
  { id: "ogolna", href: "/app/rozmowa", label: "Rozmowa ogólna", detail: "Pytania o świadczenia i dokumenty" },
  { id: "marta", href: "/app", label: "Marta i Paweł", detail: "Urlop rodzicielski" },
  { id: "kamil", href: "/app/kamil", label: "Kamil", detail: "Zasiłek za okres ojcowski" },
  { id: "chorobowe", href: "/app/chorobowe", label: "Chorobowe w ciąży", detail: "Ocena prawa do zasiłku" },
] as const;

export type Scenario = (typeof scenarios)[number]["id"];

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


export function ChatStarters({ onSelect, disabled }: { onSelect: (prompt: string) => void; disabled: boolean }) {
  return (
    <div className={s.shortcuts} role="group" aria-label="Zacznij od pytania">
      {chatStarters.map(({ label, prompt }) => (
        <button type="button" key={label} disabled={disabled} onClick={() => onSelect(prompt)}>{label}</button>
      ))}
    </div>
  );
}
