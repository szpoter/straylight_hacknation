# Przewodnik Rodzica — wspólny wygląd

Punkt wyjścia dla trzech osób projektujących w Claude Design. Na pierwszym ekranie rodzic ma móc przeczytać, czego dotyczy sprawa, jaki ma termin i co może zrobić dalej. Jasne powierzchnie i spokojna typografia zostawiają miejsce na te informacje. Zieleń wyróżnia działanie. Zusik dodaje ciepła w ilustracji i w języku. Ten sam zestaw kontrolek obowiązuje również w panelu administracyjnym.

## Skąd pochodzą kolory

| Próbka źródłowa | Odczyt | Jak jej używamy |
| --- | --- | --- |
| Zieleń znaku ZUS | **#009C44**. Odczyt pełnych, nieprzezroczystych pikseli z oficjalnego PNG w sRGB. | Detal w ilustracji i większe pola graficzne. Biały tekst na tej zieleni ma kontrast 3,60:1. [Plik znaku ZUS](https://bip.zus.pl/documents/10182/1002218/logoZUSnoweRozwiniecie.png/38ba4a38-a94f-4515-93c4-a4734719f9a5?t=1499845953889) |
| Granat publikacji ZUS | **#08406E**. Próbka z dolnego pasa pierwszej strony PDF po renderowaniu do RGB. | Punkt odniesienia dla linków i informacji pochodzących ze źródła urzędowego. [Poradnik dla rodziców, ZUS 2026, okładka](Materia%C5%82y%20hackathonowe/Materia%C5%82y%20dla%20uczestnik%C3%B3w/Poradnik%20dla%20rodzic%C3%B3w%2C%20ZUS%202026.pdf) |

## Paleta produktu

Kolory poniżej są propozycją zespołową do prototypu. W kolumnie „Para” pierwszy kolor jest tłem, drugi tekstem. Wiersze można bezpośrednio odwzorować na zmienne motywu shadcn/ui.

| Rola i tokeny | Para | Użycie |
| --- | --- | --- |
| Strona · `background / foreground` | #F8FAF5 / #21342D | Ciepłe tło i tekst podstawowy, kontrast 12,54:1. |
| Powierzchnia · `card / card-foreground` | #FFFFFF / #21342D | Formularz, panel czatu, karta dokumentu. Tekst pomocniczy `muted-foreground` #52645B na bieli ma 6,30:1. |
| Główna akcja · `primary / primary-foreground` | #176343 / #FFFFFF | Przejście do kolejnego kroku, kontrast 7,24:1. Hover #125538, wciśnięcie #10472F. |
| Wybór · `accent / accent-foreground` | #E6F3E9 / #176343 | Wybrany plan, kafel odpowiedzi, wiadomość rodzica. Zawsze dodatkowo podpis, zaznaczenie lub ikona. |
| Informacja · `info / info-foreground` | #E8F2F9 / #1E5479 | Źródło, trwa weryfikacja. Link w tekście ma podkreślenie. |
| Uwaga · `warning / warning-foreground` | #FFF2DB / #7C4C13 | Brak pola, zbliżający się termin. Podajemy datę lub następną czynność. |
| Błąd · `error-surface / destructive` | #FDEDEF / #9E3039 | Błąd pola lub wysyłki. Komunikat mówi, co poprawić, i zostaje przy polu. |

Separator kart `border` ma kolor #D8E2DA. Obramowanie edytowalnej kontrolki `input` to #688073 (4,26:1 na bieli). Fokus `ring` to granat #08406E, obrys 2 px z odstępem 2 px i jasnym podkładem także na ciemnym przycisku. Dla zwykłego tekstu sprawdzamy co najmniej 4,5:1, dla istotnych granic kontrolek i wskaźników 3:1 względem sąsiadującego tła. [WCAG 2.2, wymagania kontrastu](https://www.w3.org/TR/WCAG22/#contrast-minimum)

## Typografia i rytm

Jedna rodzina **Source Sans 3** z polskimi znakami, zastępczo systemowy sans-serif. Tekst 16/24 px, opis Hero 20/30, nagłówek Hero 48/52 na komputerze i 36/40 na telefonie. Nagłówki sekcji 28/34, etykiety 16/20, dopiski 14/20. Kwoty w porównaniu mają cyfry o stałej szerokości. Akapit do około 65 znaków w wierszu. Odstępy 4, 8, 12, 16, 24, 32 i 48 px. Na telefonie 16 px od brzegu. Pola i przyciski mają promień 10 px, karty 16 px. Cień rezerwujemy dla powierzchni unoszących się nad treścią.

## Jedne kontrolki dla całego produktu

**Rekomendacja:** przyjąć anatomie i stany shadcn/ui jako bazę prototypu. Semantyczne zmienne pozwalają zmienić jeden token we wszystkich widokach, a pola, etykiety i opisy błędów można składać według wspólnego wzorca. Mapa etapów, animacja Zusika i podgląd zmienionego pola wymagają własnych kompozycji z tych samych elementów. Decyzję o bibliotece w kodzie można podjąć po ocenie prototypu. [Motywy shadcn/ui](https://ui.shadcn.com/docs/theming) · [Katalog komponentów](https://ui.shadcn.com/docs/components)

| Komponent | Wspólna reguła | Przykład w produkcie |
| --- | --- | --- |
| Button | Główny ma zielone wypełnienie, drugorzędny białe tło, widoczny obrys i ciemny tekst. Link służy do nawigacji w treści. Wysokość min. 44 px, minimum 44 × 44 px dla akcji ikonowej. Etykieta nazywa skutek. | „Sprawdź moją sytuację”, „Pokaż mój plan”, „Zastosuj zmianę”. Jedna główna akcja w obrębie zadania. |
| Field, Input, Textarea, Select | Widoczna etykieta nad polem, opis i błąd pod nim. Placeholder pokazuje przykład. Te same odstępy i obramowanie w formularzu, kalkulatorze i polu wiadomości. | „Początek urlopu”, „Zapytaj Zusika…”. |
| Radio Group, Checkbox, Tabs | Jeden wybór ma wskaźnik wyboru, wiele wyborów ma pola zaznaczenia, zakładki zmieniają widok. Kafle są klikalne na całej powierzchni. | Sytuacja rodzinna, wybór dokumentów, „Moja sytuacja / Mój plan”. |
| Karta, status, panel | Tytuł, istotna wartość i jedna następna czynność. Status ma tekst i symbol. Panel boczny dziedziczy nagłówek, przyciski i fokus. | „Do uzupełnienia”, „Szkic”, źródło odpowiedzi agenta. |

Każdy element interaktywny ma stan spoczynku, hover, fokus i wciśnięcie. Jeśli akcja czeka na wynik, zachowuje szerokość i pokazuje komunikat, np. „Wczytujemy dane…”. Gdy jest niedostępna, powód znajduje się przy kontrolce. Klawiatura, powiększenie tekstu i ograniczenie ruchu mają pozwalać dokończyć ten sam krok. Przy wsparciu po stracie stosujemy spokojny widok bez celebracji. Nowy wariant wspólnej kontrolki najpierw uzgadniamy tutaj, a potem wykorzystujemy w makietach.
