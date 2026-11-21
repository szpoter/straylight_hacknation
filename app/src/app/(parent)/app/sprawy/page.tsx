import Link from "next/link";
import s from "@/features/sickness/sickness.module.css";

export default function CasesPage() {
  return (
    <main className={s.page}>
      <header className={s.heading}>
        <p>Przewodnik Rodzica</p>
        <h1>Wybierz sprawę</h1>
      </header>
      <nav className={s.card} aria-label="Sprawy demonstracyjne">
        <p>
          <Link href="/app">Marta i Paweł · porównanie urlopów i wniosek do pracodawcy</Link>
        </p>
        <p>
          <Link href="/app/kamil">Kamil · odczyt aktu i ZAM do ZUS</Link>
        </p>
        <p>
          <Link href="/app/chorobowe">Chorobowe w ciąży · ocena dokumentów</Link>
        </p>
      </nav>
    </main>
  );
}
