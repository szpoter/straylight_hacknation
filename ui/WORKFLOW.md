# Jak projektujemy Przewodnik Rodzica

Każda osoba prowadzi własną rozmowę z agentem i utrzymuje jeden UI spec swojego obszaru. Pliki poniżej zawierają kolejkę sekcji, referencje na pierwszą rozmowę i gotowy prompt startowy.

| Osoba | UI spec i odpowiedzialność | Komu przekazuje wynik |
| --- | --- | --- |
| Nikodem | [Strona publiczna, logowanie i pobieranie danych](NIKODEM.md) | Maciejowi przekazuje stan po wczytaniu profilu lub wejście w ręczne uzupełnianie. Od Juliana bierze wygląd Zusika i rozmowy do filmu. |
| Maciej | [Widoki rodzica po zalogowaniu](MACIEJ.md) | Julianowi przekazuje kontekst dziecka, sprawy i zmienianego pola oraz miejsce otwarcia panelu. |
| Julian | [Zusik, czat i treści generowane](JULIAN.md) | Nikodem dostaje kadry do filmu, Maciej dostaje bąbelek, panel i format proponowanej korekty. |

## Jedna runda = jeden element

1. **Rozmowa.** Osoba wybiera sekcję, np. „pierwsza wiadomość z podaniem źródła”. Agent czyta jej spec funkcjonalny, [DESIGN.md](../DESIGN.md) i właściwy wiersz [listy inspiracji](../inspiracjeelementowistron.md). Ustala z osobą, co rodzic ma zauważyć najpierw i jaką jedną rzecz ma móc zrobić.
2. **Poszukiwanie.** Agent otwiera 2–4 konkretne przykłady z różnych produktów lub systemów. W mapie są też galerie i repozytoria. Z galerii prowadzi do konkretnego ekranu, z repozytorium do demonstracji, nagrania lub dokładnego przykładu. Przy płatnej lub niedostępnej referencji dobiera publicznie dostępną alternatywę.
3. **Rekomendacja do obejrzenia.** Przy każdym linku agent podaje dokładne miejsce lub moment, element wart przejęcia i koszt dla rodzica, np. „na telefonie dodatkowe rozwinięcie ukrywa termin”. Na koniec wskazuje jeden kierunek i tłumaczy, dlaczego pasuje do tej sprawy. Osoba otwiera linki i może wybrać także połączenie dwóch pomysłów.
4. **Decyzja właściciela.** Agent czeka na wybór albo uwagi. Gdy osoba chce kolejnej rundy, szuka na nowo pod jej kryterium. Dopiero po wyraźnym zatwierdzeniu zapisuje plan w pliku tej osoby pod nazwą elementu. Późniejsza korekta aktualizuje ten sam wpis wraz z datą. Wskazówki startowe w tych plikach mają status propozycji.
5. **Przekazanie do Claude Design.** Po akceptacji elementów osoba przekazuje DESIGN.md, swój UI spec i referencje. Claude Design najpierw tworzy wspólną planszę kontrolek, następnie klikalne sceny z zaakceptowanych wpisów. Wszyscy używają tej samej planszy, polskich tekstów i wspólnego przykładowego dziecka. Zmiana wspólnej kontrolki wraca do DESIGN.md.

### Wpis do UI specu po akceptacji

| Pole | Co zapisuje agent |
| --- | --- |
| Element, właściciel, data, status | Jedna nazwa używana również na planszy prototypu. Status „Uzgodnione” nadaje decyzja właściciela. |
| Cel, treść i hierarchia | Pierwsza rzecz widoczna dla rodzica, właściwy polski tekst, nazwa przycisku, przykład na fikcyjnych danych. |
| Referencje i wybór | Bezpośrednie linki do obejrzanych przykładów, konkretny zapożyczony detal i poprawka właściciela. |
| Wygląd i zachowanie | Układ desktop i telefon, komponenty i kolory z DESIGN.md, stan wejścia, akcja, rezultat, powrót. Opisać mające zastosowanie błędy, czekanie, klawiaturę i ograniczenie ruchu. |
| Odbiór i przekazanie | Jedna czynność do przeklikania, oczekiwany efekt, nazwa następnej sceny oraz dane lub stan, które musi zachować. |

### Wspólny odbiór prototypu

Na jednym przykładzie przechodzimy od „Sprawdź moją sytuację” przez logowanie demo i onboarding do planu dziecka, otwieramy szkic przez „Dokończ z Zusikiem”, poprawiamy pole i wracamy do dokumentu. Oglądamy ten przebieg na komputerze i na wąskim telefonie, a przy klawiaturze ekranowej sprawdzamy widoczność pola i głównej akcji. Każdy właściciel porównuje swoje ekrany z zatwierdzonymi referencjami. Przy przejściach animowanych do przeglądu dołącza krótkie nagranie. [Uzgodnione zakładki panelu administracyjnego](../SPEC-PANEL-ADMINISTRACYJNY.md) mają osobny zakres.
