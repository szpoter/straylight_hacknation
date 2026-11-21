# Panel administracyjny Przewodnika Rodzica

**Status dokumentu:** propozycja do omówienia. Panel ma służyć osobie, która odpowiada za zasady wyliczania świadczeń. Po zmianie przepisów powinna móc zmienić parametr, zobaczyć różnicę na przykładowej rodzinie i wskazać, od kiedy rodzice mają otrzymywać nowy wynik.

## Co wynika z zadania ZUS

Regulamin w § 2 ust. 4–5 odsyła do pełnej treści zadania. Opis na s. 14 wskazuje wprost możliwość zmiany parametrów w panelu administracyjnym, m.in. stopy procentowej zasiłku macierzyńskiego i maksymalnego wymiaru. Ma to umożliwić reagowanie na zmiany legislacyjne oraz rozwój funkcjonalności. Na s. 13–15 opisano też testowanie na przykładowych sprawach i dokumentach. Proponowany poniżej układ ekranów, podgląd i sposób publikacji to decyzje produktowe. [Regulamin](Materia%C5%82y%20hackathonowe/ZUS%20-%20Regulamin%20zadania%20konkursowego.pdf) · [Pełna treść zadania, s. 13–16](Materia%C5%82y%20hackathonowe/ZUS%20-%20Pe%C5%82na%20tre%C5%9B%C4%87%20zadania%20konkursowego.pdf)

## Co widzi administrator

Wejście **„Panel administracyjny”** prowadzi do osobnego widoku dla uprawnionej osoby. Pierwszy ekran to **„Reguły świadczeń”**. Obok znajdują się **„Sprawy testowe”** i **„Historia zmian”**. Nawigacja rodzica jest opisana w [specyfikacji aplikacji po zalogowaniu](SPEC-PO-LOGOWANIU.md).

| Widok | Co widać i co można zrobić |
| --- | --- |
| **Reguły świadczeń** | Lista pogrupowana według okresu, którego dotyczy zasiłek, np. urlopu rodzicielskiego lub ojcowskiego. Wiersz pokazuje nazwę parametru, wartość z jednostką, datę obowiązywania i stan wersji. Jeśli zaplanowano zmianę, obok aktualnej wartości widać przyszłą i datę wejścia. Kliknięcie otwiera szczegóły oraz przycisk „Przygotuj zmianę”. |
| **Sprawy testowe** | Administrator wybiera fikcyjną rodzinę lub obsługiwany testowy PDF. Widzi dane wejściowe, oczekiwany rezultat i wynik kalkulatora dla wybranej wersji. Może otworzyć podgląd dokładnie tej sprawy w widoku rodzica. Brak danych, np. podstawy wymiaru, ma własny komunikat z nazwą brakującej informacji. |
| **Historia zmian** | Lista od najnowszej publikacji. Po otwarciu wpisu widać autora, czas publikacji, poprzednią i nową wartość, zakres, datę obowiązywania, uzasadnienie, źródło i wyniki testów z chwili publikacji. Z wpisu można przygotować korektę jako kolejny szkic. |

## Najważniejsza interakcja — „Przygotuj zmianę”

1. **Ustal, co się zmienia.** Nagłówek podaje pełny kontekst, np. „Zasiłek macierzyński za okres urlopu rodzicielskiego · stawka”. Formularz pokazuje bieżącą wartość, pole nowej wartości z jednostką, zakres spraw, datę stosowania, podstawę zmiany z odnośnikiem do źródła i krótkie uzasadnienie. Dla limitu tygodni pokazuje tygodnie. Zapis tworzy **szkic** dostępny administratorowi.
2. **Sprawdź, kto zobaczy różnicę.** Po prawej stronie formularza, a na telefonie pod nim, karta „Wpływ na rodzinę” pokazuje tę samą sprawę w dwóch kolumnach „Obecnie” i „Po zmianie”. Widać okres, stawkę, liczbę dni oraz kwotę lub przyczynę braku uprawnienia. „Pokaż oczami rodzica” otwiera kalkulator z tymi danymi i oznaczeniem „Podgląd szkicu”. Obie wersje korzystają z mechanizmu wyliczeń aplikacji rodzica.
3. **Zweryfikuj granice.** „Sprawdź zmianę” porównuje wynik z oczekiwaniem dla zmienianej grupy, sprawy tuż przed wejściem reguły i przypadku spoza jej zakresu. Dla zmiany maksymalnego wymiaru sprawdza również wniosek dokładnie na limicie oraz taki, który go przekracza. Niezgodność pokazuje konkretną sprawę i różnicę, a szkic pozostaje do poprawy.
4. **Opublikuj od wskazanej daty.** Podsumowanie pokazuje zmianę wartości, datę i rezultaty sprawdzenia. Przycisk podaje skutek, np. „Zaplanuj zmianę od 1 stycznia”. Wersja przechodzi ze stanu **Szkic** do **Zaplanowana** albo **Obowiązuje**. Po zastąpieniu poprzedniej wersji pozostaje ona dostępna jako **Historyczna**.

## Przykład do pokazania jury

Fikcyjna sprawa ma ustaloną dzienną podstawę 200 zł i obejmuje 28 dni jednego okresu. Na potrzeby demonstracji administrator zmienia stawkę z 70% na 75%. Są to założenia symulacji. Widok od razu pozwala wyjaśnić rodzicowi, skąd wzięła się różnica.

| W kalkulatorze rodzica | Obecnie | Po zmianie |
| --- | ---: | ---: |
| Zasiłek za dzień | 140 zł | 150 zł |
| Zasiłek za 28 dni | 3 920 zł | 4 200 zł |
| Różnica za cały okres | — | **+280 zł** |

Jury może opublikować zmianę w odizolowanej sesji demonstracyjnej, otworzyć ten sam przypadek od strony rodzica i zobaczyć 4 200 zł wraz z podstawą obliczenia. Drugi przypadek, poza zakresem zmiany, nadal pokazuje swój poprzedni wynik. Kolejna sesja demonstracyjna startuje z wartościami początkowymi.

## Jak zmiana trafia do aplikacji rodzica

- **Kalkulator i plan.** Regułę dobieramy według zdarzenia określonego w jej podstawie i właściwych przepisów przejściowych. Dla okresu przecinającego datę zmiany test musi pokazać sposób rozliczenia obu części albo zachowania dotychczasowych zasad. Gdy nowy limit wpływa na zaplanowany urlop, rodzic widzi przy tym okresie akcję „Sprawdź mój wariant”.
- **Zapisane sprawy.** Zapisany wariant zachowuje datę i wersję wyliczenia. Jeśli zmiana go dotyczy, „Porównaj z nowym wyliczeniem” pokazuje różnicę przed zapisaniem nowego wariantu. Dokument wysłany zachowuje treść z chwili wysyłki i powiązane potwierdzenie.
- **Zusik.** Wyjaśnia wynik zwrócony przez kalkulator. Przy pytaniu „Skąd ta kwota?” korzysta ze stawki, okresu i źródła przypisanych do wersji użytej w tej sprawie.

## Zakres pierwszej wersji i warunki odbioru

- Administrator przechodzi pełną ścieżkę dla dwóch rodzajów parametrów wskazanych przez ZUS — stawki procentowej i maksymalnego wymiaru okresu. Nowy wariant wykorzystujący istniejący sposób liczenia można skonfigurować w jego zakresie. Wprowadzenie nowego algorytmu wymaga osobnej implementacji i spraw testowych.
- Publikacja wymaga poprawnej jednostki i wartości, uzupełnionego źródła, jednoznacznego okresu i zgodnych wyników testów. Przy konflikcie dwóch zmian tej samej reguły administrator widzi aktualną wersję do porównania. Ponowienie publikacji zapisuje zmianę tylko raz.
- Dostęp do odczytu panelu i publikacji sprawdzany jest po stronie serwera. Podgląd wykorzystuje wyłącznie fikcyjne rodziny i testowe dokumenty. Konto rodzica ma dostęp do własnego planu i opublikowanego wyniku właściwego dla danej sprawy.
- Demonstrację uznajemy za kompletną, gdy jury może odtworzyć różnicę **+280 zł**, sprawdzić przypadek poza zakresem zmiany, sprawdzić przekroczenie limitu tygodni oraz odnaleźć publikację i jej podstawę w historii.
