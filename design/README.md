# Design: indeks

Ten folder jest **jedynym źródłem prawdy o wyglądzie** Przewodnika Rodzica i zastępuje `DESIGN.md`. Opisuje język wizualny przeniesiony z istniejącej strony: rytm, skale, zasady i budowę elementów, bez brandingu. Paletę wzięliśmy z maskotki Zusika i palety ZUS. System spełnia WCAG 2.1 AA.

Gotowy przykład użycia: [przyklad.html](przyklad.html). Otwórz go w przeglądarce.

## Statusy

Każda wartość i zasada w tym folderze ma jeden z pięciu statusów.

| Status | Znaczenie | Jak traktować |
| --- | --- | --- |
| `wykryte` | Zmierzone w computed styles strony źródłowej (sama strona, pseudo-elementy, stany). | Używaj bez zmian. |
| `wykryte (CSS var)` | Wartość jest zdefiniowana w zmiennych CSS źródła, ale nie zaobserwowano jej użycia na stronach publicznych. | Używaj w opisanej roli. Rola jest zwykle wywnioskowana. |
| `zespół` | Wartość z materiałów zespołu: tokeny maskotki (`maskotka_kod/app/globals.css`) albo paleta ZUS (`maskotka_kod/docs/mascot/01-design-spec.md`). | Używaj bez zmian. Zmiana wymaga zmiany także w maskotce. |
| `wywnioskowane` | Nasza interpretacja albo decyzja projektu (np. kolor tekstu zmieniony dla AA) zbudowana z wykrytych wartości. | Używaj. Zmienia je tylko decyzja zespołu. |
| `do weryfikacji` | Niepewne albo niezmierzone. | Używaj, ale wypisz w opisie zmiany. Lista do sprawdzenia: [zrodla.md §3](zrodla.md#3-lista-do-weryfikacji). |

Oprócz statusów danych są dwie **etykiety procesu**. Dotyczą decyzji zespołu, nie pochodzenia wartości.

| Etykieta | Znaczenie |
| --- | --- |
| `do omówienia` | Propozycja czeka na rozmowę zespołu. Agent jej nie wdraża. |
| `uzgodnione` | Zespół zatwierdził; wpis zawiera datę i osobę. |

## Który plik czytać

| Zadanie | Czytaj |
| --- | --- |
| **Każda praca nad UI** | ten README, [zasady-agenta.md](zasady-agenta.md) |
| Nowy ekran lub sekcja | dodatkowo [kierunek.md](kierunek.md), [layout.md](layout.md), [tokeny.md](tokeny.md), [komponenty.md](komponenty.md) |
| Zmiana kolorów, typografii, odstępów | [tokeny.md](tokeny.md) |
| Przycisk, karta, pole, modal, nagłówek, stopka | [komponenty.md](komponenty.md), [tokeny.md](tokeny.md) |
| Układ strony, siatka, responsywność | [layout.md](layout.md) |
| Cokolwiek, co się rusza | [motion.md](motion.md) |
| Efekt „zlewających się” przycisków | [gooey.md](gooey.md), [motion.md](motion.md) |
| Aktualizacja tego folderu, weryfikacja wartości | [zrodla.md](zrodla.md) |

## Kolejność czytania przy nowym ekranie

1. **[zasady-agenta.md](zasady-agenta.md)**: twarde reguły i procedura.
2. **[kierunek.md](kierunek.md)**: charakter stylu oraz zasady „rób / nie rób”.
3. **[layout.md](layout.md)**: wybór wzorca sekcji i kontenerów.
4. **[komponenty.md](komponenty.md)**: budowa elementów.
5. **[tokeny.md](tokeny.md)**: wartości. Blok CSS z §9 to jedyne miejsce, skąd biorą się liczby.
6. **[motion.md](motion.md)** i **[gooey.md](gooey.md)**: tylko jeśli coś się rusza.

## Najważniejsze w pięciu punktach

1. **Biel, płaskie elementy z ramką 2 px i paleta Zusika.** Przycisk główny wygląda jak Zusik: mięta w zielonej obwódce, granatowy tekst. Bez cieni i bez dolnej krawędzi.
2. **Stany kontrolek zmieniają się natychmiast.** Ruch mają tylko ilustracje, nagłówek i tła przy przewijaniu.
3. **Tekst tylko w parach spełniających AA.** Granat na mięcie, linki w granacie ZUS, żadnego tekstu na zieleni ani niebieskim ZUS.
4. **Wartości wyłącznie z tokenów.** Brak tokenu oznacza pytanie albo oznaczenie „do weryfikacji”, nie zgadywanie.
5. **Animacje dostarcza zespół.** Do tego czasu agent buduje stan końcowy bez ruchu ([motion.md §5](motion.md#5-animacje-dostarczane-przez-zespół)).
