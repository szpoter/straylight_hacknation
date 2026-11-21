import Link from "next/link";

// Strona publiczna należy do zakresu Bartka. Tymczasowo linki do widoków po zalogowaniu.
export default function Home() {
  return (
    <main className="mx-auto max-w-page px-gutter-mobile py-section-mobile md:px-gutter-desktop">
      <h1 className="font-serif text-display">Zusik</h1>
      <p className="mt-4 text-lead text-on-surface-variant">Strona główna w budowie.</p>
      <ul className="mt-8 flex flex-col gap-2 underline underline-offset-4">
        <li><Link href="/start">Onboarding po zalogowaniu</Link></li>
        <li><Link href="/plan">Mój plan</Link></li>
        <li><Link href="/demo/polaczenia">Próba połączeń (etap 1, krok 1)</Link></li>
      </ul>
    </main>
  );
}
