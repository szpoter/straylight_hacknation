import { AgentRow } from "./agent-row";
import styles from "./agent.module.css";

// Sekcja „Poznaj Zusika” (kotwica #agent z hero i nawigacji). Trzy rzędy na przemian:
// tekst po jednej stronie, Zusik wpływa z drugiej i zmienia się w przedmiot pasujący do tekstu.
// Możliwości agenta według SPEC.md: szuka w materiałach ZUS ze źródłem, przygotowuje szkic
// wniosku i dopytuje o braki, a kwotę liczy kalkulator według reguł (model jej nie liczy).
const NBSP = " ";

export function AgentSection() {
  return (
    <section id="agent" className={styles.section} aria-labelledby="agent-title">
      <header className={styles.intro}>
        <h2 id="agent-title" className={styles.title}>
          Poznaj Zusika
        </h2>
        <p className={styles.lead}>Asystent AI, który odpowiada na pytania i{NBSP}pomaga z{NBSP}wnioskami.</p>
      </header>

      <AgentRow side="right" object="folder" title="Odpowiada na pytania, ze źródłem">
        Zapytaj o{NBSP}zasady, a{NBSP}Zusik znajdzie właściwy fragment w{NBSP}materiałach ZUS
        i{NBSP}pokaże, skąd pochodzi odpowiedź.
      </AgentRow>

      <AgentRow side="left" object="pencil" title={`Wypełnia wniosek razem z${NBSP}Tobą`}>
        Przenosi dane z{NBSP}Twojego profilu do szkicu i{NBSP}dopytuje o{NBSP}to, czego brakuje, np. od
        kiedy chcesz zacząć urlop.
      </AgentRow>

      <AgentRow side="right" object="calculator" title="Wyjaśnia, skąd wzięła się kwota">
        Zasiłek liczy kalkulator według przepisów, a{NBSP}Zusik prostymi słowami tłumaczy wynik
        i{NBSP}mówi, co może go zmienić.
      </AgentRow>
    </section>
  );
}
