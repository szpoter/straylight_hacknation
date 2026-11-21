import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>Zusik</h1>
      <p>Aplikacja w budowie. Wygląd zostanie dodany po zatwierdzeniu projektu.</p>
      <section aria-labelledby="documents">
        <h2 id="documents">Dokumenty i wnioski</h2>
        <p>Ola · Wniosek o urlop rodzicielski · Szkic · Do pracodawcy</p>
        <p>
          <Link href="/zusik">Dokończ z Zusikiem</Link>
        </p>
      </section>
      <p>
        <Link href="/demo/polaczenia">Próba połączeń (etap 1, krok 1)</Link>
      </p>
    </main>
  );
}
