# Porównanie lokalnego Bielika i PLLuM

Pomiar z 2026-11-21T21:48:13.223Z. Oba modele wykonały te same trzy zadania po kolei na lokalnym endpointcie Ollamy. Skrypt używa funkcji produkcyjnych `generateAnswer` i `validateAnswer`. Każde pytanie dostaje od dwóch do trzech jawnie wskazanych publicznych fragmentów korpusu `marta-v1`. Identyczny skrót promptu w dwóch wierszach oznacza ten sam prompt systemowy, pytanie, fragmenty i instrukcję.

Temperatura 0,1. Limit wyjścia 700 tokenów. Limit jednej próby wynosi 40.0 s, a wspólny budżet generatora z ewentualną ponowną próbą 45.0 s. Pomiar obejmuje oczekiwanie na odpowiedź modelu, w tym ewentualne ładowanie wag. Nie uwzględnia czasu Qdrant, Neon i sieci do Vercela. Jedna obserwacja na parę model–pytanie nie wystarcza do oszacowania p95.

| Model | Zadanie | Czas | Generacja | Stan surowy → zweryfikowany | Cytaty zgodne / zwrócone | Brakujące źródła | Odbiór | Skrót promptu |
|---|---|---:|---|---|---:|---|---|---|
| SpeakLeash/bielik-11b-v3.1-instruct:Q4_K_M | odpis | 14.2 s | ok | answered → answered | 2 / 2 | — | PASS | c215fc722216 |
| SpeakLeash/bielik-11b-v3.1-instruct:Q4_K_M | termin | 16.9 s | ok | answered → insufficient_evidence | 2 / 3 | kp-art182-1d-par1 | FAIL | e948cfd2c23e |
| SpeakLeash/bielik-11b-v3.1-instruct:Q4_K_M | brak-podstawy | 2.7 s | ok | insufficient_evidence → insufficient_evidence | 0 / 0 | — | PASS | cdef0cc70627 |
| hf.co/mradermacher/PLLuM-12B-chat-2512-GGUF:Q4_K_M | odpis | 45.0 s | timeout | — → — | 0 / 0 | rozp-2025-322-par15-ust2-pkt1, rozp-2025-322-par22 | FAIL | c215fc722216 |
| hf.co/mradermacher/PLLuM-12B-chat-2512-GGUF:Q4_K_M | termin | 13.0 s | ok | answered → answered | 2 / 2 | — | PASS | e948cfd2c23e |
| hf.co/mradermacher/PLLuM-12B-chat-2512-GGUF:Q4_K_M | brak-podstawy | 6.1 s | ok | answered → answered | 1 / 2 | — | FAIL | cdef0cc70627 |

Odbiór sprawdza spodziewany stan modelu przed walidacją i po niej, treść odpowiedzi, obecność wymaganych identyfikatorów oraz poprawność wskazanych cytatów według walidatora aplikacji. Przy braku podstawy nie może pojawić się żadne twierdzenie. Dla odpisu wymagane są zarówno reguła załącznika, jak i wyjątek dotyczący akt osobowych. Liczba 0 / 0 oznacza brak przytoczonego cytatu.

## Zestaw pytań

- **odpis**. Kadry mają już odpis aktu dziecka w moich aktach osobowych. Czy do wniosku o urlop rodzicielski mam dołączyć drugi? Fragmenty: `rozp-2025-322-par15-ust2-pkt1`, `rozp-2025-322-par22`, `rozp-2025-322-par15-ust2-pkt2`.
- **termin**. Ile dni wcześniej trzeba złożyć wniosek o urlop rodzicielski i do kogo go składam? Fragmenty: `kp-art182-1d-par1`, `rozp-2025-322-par15-ust2-pkt2`.
- **brak-podstawy**. Czy na podstawie tych przepisów można odmówić zasiłku chorobowego z powodu samego kodu B na zwolnieniu? Fragmenty: `rozp-2025-322-par15-ust2-pkt1`, `rozp-2025-322-par22`.

## Wyniki modeli

- **SpeakLeash/bielik-11b-v3.1-instruct:Q4_K_M**. Odbiór 2/3, ukończone generacje w budżecie 3/3.
- **hf.co/mradermacher/PLLuM-12B-chat-2512-GGUF:Q4_K_M**. Odbiór 1/3, ukończone generacje w budżecie 2/3.

W próbie bez podstawy model hf.co/mradermacher/PLLuM-12B-chat-2512-GGUF:Q4_K_M opublikował twierdzenie mimo dostarczenia wyłącznie przepisów o dokumentach do wniosku urlopowego. Walidator zaakceptował dosłowny cytat z `rozp-2025-322-par15-ust2-pkt1`. To błąd trafności źródła. W tej próbie sama kontrola zgodności cytatu z fragmentem nie zatrzymała odpowiedzi.

Powtórzenie z katalogu app: `node --import tsx scripts/zusik-eval-local-models.ts`. Modele muszą istnieć pod nazwami podanymi w tabeli. Skrypt nadpisuje wyłącznie ten raport.
