# Panel administracyjny · materiał do zgłoszenia

Do opisu projektu i prezentacji. Szczegóły i decyzje: [SPEC-PANEL-ADMINISTRACYJNY.md](SPEC-PANEL-ADMINISTRACYJNY.md) §15. Stan na 22.11.2026.

## W jednym zdaniu

Panel pozwala osobie odpowiedzialnej za zasady wyliczania świadczeń zmienić parametr bez wdrażania nowej wersji aplikacji: sprawdzić skutek na przykładowej rodzinie i sprawach testowych, opublikować zmianę od wskazanej daty i udokumentować ją w historii (wymóg z treści zadania, s. 13).

## Co robi

| Funkcja | Opis |
| --- | --- |
| Reguły świadczeń | Katalog parametrów w 8 grupach. Każdy ma wartość, datę, stan i podstawę z linkiem. Etykieta „W aplikacji” oznacza wartość, którą aplikacja rodzica naprawdę stosuje: panel czyta ją z kodu reguł. |
| Przygotuj zmianę | Dla łącznego wymiaru zasiłku za okres urlopu ojcowskiego: szkic, wpływ na rodzinę „Obecnie / Po zmianie”, „Sprawdź zmianę” na prawdziwej regule (wniosek na limicie, ponad limit, dzień przed zmianą, druga część, sprawy sprzed daty bez zmian), publikacja od daty. „Pokaż oczami rodzica” otwiera sprawę rodzica z wartością ze szkicu, oznaczoną jako podgląd. |
| Sprawy testowe | 8 spraw syntetycznych liczonych na żywo regułą, z oczekiwanym wynikiem, zgodnością i uzasadnieniem. Wyszukiwanie odporne na polskie znaki. |
| Historia zmian | Kto, kiedy, od jakiej daty, poprzednia i nowa wartość, podstawa, wynik sprawdzenia. Wycofanie zmiany zaplanowanej na przyszłość. |
| Treści i źródła | Akty prawne i strony ZUS, z których odpowiada asystent, z datą pobrania i ostrzeżeniem po 6 miesiącach. |

## Jak przetestować (około 3 minut)

1. Otwórz `/admin` i kliknij „Zaloguj się”. W demo login i hasło są już wpisane.
2. „Reguły świadczeń” → zakładka „Wymiary” → „Zasiłek za okres urlopu ojcowskiego: łączny wymiar” → „Przygotuj zmianę”.
3. Ustaw 1 tydzień od 01.12.2026, wpisz podstawę, kliknij „Zapisz szkic” i „Sprawdź zmianę”. Wszystkie przypadki są zgodne.
4. Kliknij „Zaplanuj zmianę od 01.12.2026”. Zmiana pojawia się w „Historii zmian” z autorem, datą i podstawą.
5. W tej samej przeglądarce otwórz `/app/kamil` i poproś o dwa tygodnie od 8 grudnia. Asystent odpowiada „Zostało Ci 7 dni”, a bez zmiany przyznaje 8–21 grudnia.
6. „Historia zmian” → „Przywróć wartości początkowe”. Kolejna sesja i tak zaczyna od wartości z kodu.

## Sztuczna inteligencja

Panel nie używa AI. Wartości, sprawdzenia i wyniki spraw testowych liczy kod reguł. Panel pokazuje za to, z jakich źródeł korzysta asystent AI aplikacji rodzica (zakładka „Treści i źródła”).

## Rozwiązania zewnętrzne (regulamin § 4 ust. 1)

| Rozwiązanie | Do czego |
| --- | --- |
| Next.js, React | Strony panelu i akcje serwerowe |
| Google Fonts przez `next/font` (Literata, Inter) | Kroje z DESIGN.md, pobierane przy budowaniu i serwowane z aplikacji |
| Vercel | Hosting demo |
| Node.js `crypto`, `zlib` (wbudowane) | Hash hasła (scrypt), podpis sesji i wersji parametrów |
| Treści: zus.pl, Dziennik Ustaw (ELI) | Podstawa prawna i cytaty przy parametrach |

## Bezpieczeństwo i dane

- Konto administratora nadaje operator (zmienne środowiskowe, hasło jako hash scrypt). Nie ma rejestracji. Dostęp sprawdza serwer na każdej stronie panelu.
- Zmiany jurora działają tylko w jego sesji (podpisane ciasteczko). Inni ich nie widzą, a kolejna sesja zaczyna od wartości z kodu. Wdrożenie produkcyjne przeniesie ten sam zapis do bazy.
- Akta spraw udostępnione przez ZUS nie są kopiowane ani dołączane do aplikacji (treść zadania, s. 11–12). Sprawy testowe w panelu są syntetyczne.

## Czego jeszcze nie ma

- Zmiana stawki procentowej i przykład +280 zł: czekają na kalkulator stawek w aplikacji rodzica.
- Odczyt wgranego wniosku PDF w „Sprawach testowych”.
- Zmiana parametrów urlopu rodzicielskiego tym samym mechanizmem.
