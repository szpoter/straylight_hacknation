# Panel administracyjny · materiał do zgłoszenia

Do opisu projektu i prezentacji. Szczegóły i decyzje: [SPEC-PANEL-ADMINISTRACYJNY.md](SPEC-PANEL-ADMINISTRACYJNY.md) §15. Stan na 22.11.2026.

## W jednym zdaniu

Panel pozwala osobie odpowiedzialnej za zasady wyliczania świadczeń zmienić parametr bez wdrażania nowej wersji aplikacji: sprawdzić skutek na przykładowej rodzinie i sprawach testowych, opublikować zmianę od wskazanej daty i udokumentować ją w historii (wymóg z treści zadania, s. 13).

## Co robi

| Funkcja | Opis |
| --- | --- |
| Reguły świadczeń | Katalog parametrów w 8 grupach. Każdy ma wartość, datę, stan i podstawę z linkiem. Etykieta „W aplikacji” oznacza wartość, którą aplikacja rodzica naprawdę stosuje: panel czyta ją z kodu reguł. |
| Przygotuj zmianę | Dla 15 parametrów: wymiar ojcowski, stawki 100% / 70% / 81,5%, próg płatnika, płaca minimalna i statusy 8 formularzy. Szkic, wpływ na przykładową sprawę „Obecnie / Po zmianie”, „Sprawdź zmianę” na prawdziwej regule (przypadki na granicy, dzień przed zmianą, sprawa spoza zakresu, sprawy sprzed daty bez zmian), publikacja od daty. Dla wymiaru ojcowskiego „Pokaż oczami rodzica” otwiera sprawę rodzica z wartością ze szkicu, oznaczoną jako podgląd. |
| Sprawy testowe | 13 spraw syntetycznych (8 o prawie do zasiłku ojcowskiego, 5 o kwocie zasiłku) liczonych na żywo regułą, z oczekiwanym wynikiem, zgodnością i uzasadnieniem. Wyszukiwanie odporne na polskie znaki. |
| Historia zmian | Kto, kiedy, od jakiej daty, poprzednia i nowa wartość, podstawa, wynik sprawdzenia. Wycofanie zmiany zaplanowanej na przyszłość. |
| Treści i źródła | Akty prawne i strony ZUS, z których odpowiada asystent, oraz organizacje wsparcia (fundacje dla rodziców po stracie, wcześniaków, ciężko chorych dzieci, w żałobie), z datą weryfikacji i ostrzeżeniem po 6 miesiącach. |

## Jak przetestować (około 3 minut)

1. Otwórz `/admin` i kliknij „Zaloguj się”. W demo login i hasło są już wpisane.
2. W „Sprawach testowych” otwórz K-06 i sprawdź przyczynę odmowy. W K-08 porównaj odpowiedź dla brakujących informacji. Możesz też odczytać lokalny PDF i rozwinąć tekst z wybranej strony.
3. W „Regułach świadczeń” wybierz stawkę uśrednioną i przygotuj zmianę z 81,5% na 90% od 1 stycznia 2027 r. Wpisz podstawę demonstracji, zapisz szkic, sprawdź i zaplanuj zmianę. Wybierz przyszłą datę, jeśli dzień demonstracji jest późniejszy.
4. W tej samej przeglądarce otwórz logowanie rodzica i wybierz „Importuj dane i otwórz plan”. W kalkulatorze wczytaj przykład pracownicy z podstawą 5 608,85 zł. Ustaw datę porodu na dzień wejścia zmiany w życie. Początkowa stawka dzienna wynosi 168,27 zł. Dla dni sprzed zmiany nadal wynosi 152,37 zł.
5. W „Historii zmian” można przywrócić wartości początkowe sesji testowej.

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

## Zakres demonstracji

Kalkulator rodzica i zapisane wyliczenia w planie korzystają z opublikowanego harmonogramu tej sesji. Stawka wypłaty może zmienić się w trakcie miesiąca. W „Dokumentach” można sprawdzić status druków ZUS, a wycofanie ZAM blokuje przygotowanie nowego przekazania. Widok „Wsparcie” korzysta z opublikowanych wpisów o organizacjach.

Panel testów pokazuje tekst odczytany z PDF. Ocena reguł korzysta z danych wskazanego scenariusza testowego. Do przeniesienia potwierdzonej podstawy z własnego PDF służy kalkulator rodzica.
