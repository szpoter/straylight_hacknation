# Panel administracyjny Przewodnika Rodzica

Specyfikacja panelu, rozwinięta 21.11.2026 na podstawie pełnej treści zadania konkursowego ZUS, załącznika ZUS z wymiarami i wyciągu z Kodeksu pracy. Panel ma służyć osobie, która odpowiada za zasady wyliczania świadczeń: po zmianie przepisów zmienia parametr, widzi różnicę na przykładowej rodzinie i wskazuje, od kiedy rodzice dostają nowy wynik. Nawigacja rodzica: [SPEC-PO-LOGOWANIU.md](SPEC-PO-LOGOWANIU.md). Oznaczenia: **[ZUS s. X]** wymóg lub fakt z opisu zadania, **[Zał.]** załącznik ZUS „Maksymalny czas trwania zasiłków, wysokość, podstawa wymiaru”, **[Kp art. X]** wyciąg z Kodeksu pracy, **[SPEC]** ustalone wcześniej w tym pliku lub w innych specach zespołu, **[P]** propozycja do decyzji, **[D]** decyzja podjęta przy wdrożeniu 21–22.11.2026. Co już działa w `app/`, opisuje [sekcja 15](#15-stan-wdrożenia-22112026).

## 1. Po co jest panel

Zadanie wymaga, żeby narzędzie pozwalało w panelu administracyjnym zmieniać parametry, np. stopę procentową zasiłku macierzyńskiego i maksymalny wymiar, w razie zmian legislacyjnych albo przy dodawaniu i usprawnianiu funkcji **[ZUS s. 13]**. Jury będzie testować demo na przykładowych wnioskach i sprawdzać poprawność wyliczeń, a strona ma pozwalać na upload lub wybór wniosków **[ZUS s. 14–15]**. Potencjał wdrożeniowy to 15% oceny **[ZUS s. 16]**.

Z tego wynikają trzy zadania panelu:
1. **Zmienić regułę** bez zmiany kodu i zobaczyć skutek na przykładowej rodzinie.
2. **Sprawdzić wyliczenia** na sprawach testowych ZUS z oczekiwanym wynikiem.
3. **Udokumentować zmianę**: kto, kiedy, od jakiej daty, na jakiej podstawie.

Przykład z samego zadania, który dobrze pokazuje sens panelu: od 24 października 2026 r. formularze ZUR i ZAO połączono z ZAM, a Z-3b zlikwidowano **[ZUS s. 12, przypisy 3–5]**. To zmiana, którą administrator powinien wprowadzić datą obowiązywania, bez wdrożenia nowej wersji aplikacji.

## 2. Nawigacja

**[SPEC, uzgodnione]** Trzy zakładki: „Reguły świadczeń” (domyślna), „Sprawy testowe”, „Historia zmian”.

**[P]** Zawartość z sekcji 3–5 tej rozpiski mieści się w tych trzech zakładkach jako grupy wewnątrz „Reguł świadczeń”. Alternatywa: czwarta zakładka „Treści i źródła” na sekcję 5 (pytanie A w sekcji 12).

**[D]** Wybrana alternatywa: czwarta zakładka „Treści i źródła” pokazuje źródła wiedzy Zusika z manifestów korpusu (sekcja 5, ostatni akapit). Katalog formularzy i warunki zostają grupami w „Regułach świadczeń”.

## 3. Reguły świadczeń · parametry wyliczeń

Każdy parametr ma: nazwę w języku administratora, wartość z jednostką, zakres spraw, datę obowiązywania, stan wersji (Szkic, Zaplanowana, Obowiązuje, Historyczna), podstawę prawną z odnośnikiem i miejsca użycia w aplikacji rodzica **[SPEC]**. Lista jest pogrupowana według okresu, którego dotyczy zasiłek. Jeśli zaplanowano zmianę, obok aktualnej wartości widać przyszłą i datę wejścia **[SPEC]**.

> ⚠️ **Do potwierdzenia u mentorów ZUS:** minimalna podstawa wymiaru zasiłku na 2026 r. (sekcja 3.5). Wartość 4 147,10 zł jest naszym wyliczeniem, nie pochodzi z materiałów ZUS.

Wartości pochodzą z opisu zadania **[ZUS s. X]**, z załącznika ZUS „Maksymalny czas trwania zasiłków, wysokość, podstawa wymiaru” **[Zał.]** i z wyciągu z Kodeksu pracy w materiałach konkursowych **[Kp art. X]**.

### 3.1 Stawki (procent podstawy wymiaru)

| Parametr | Wartość | Źródło | Gdzie działa u rodzica |
| --- | ---: | --- | --- |
| Zasiłek macierzyński za okres urlopu macierzyńskiego, na warunkach macierzyńskiego, uzupełniającego i ojcowskiego | 100% | ZUS s. 9 | Kalkulator, plan |
| Zasiłek macierzyński za okres urlopu rodzicielskiego | 70% | ZUS s. 9 | Kalkulator, przykład +280 zł |
| Stawka uśredniona przy wniosku matki do 21 dni po porodzie, za macierzyński i rodzicielski łącznie | 81,5% | ZUS s. 9, Zał. | Kalkulator, wariant wypłaty |
| Wyjątek od stawki uśrednionej: 9 tygodni rodzicielskiego dla drugiego rodzica | 70% | Zał. | Kalkulator, podział opieki |
| Termin wniosku o stawkę uśrednioną | 21 dni od porodu | ZUS s. 9 | Plan, przypomnienie |
| Zasiłek chorobowy w ciąży (e-ZLA z kodem „B”) | 100% | ZUS s. 4 | Świadczenia w ciąży |
| Zasiłek w wysokości zasiłku macierzyńskiego (utrata pracy w ciąży) | 100% | ZUS s. 4 | Świadczenia w ciąży |

### 3.2 Wymiary i limity okresów

| Parametr | Wartość | Źródło |
| --- | --- | --- |
| Urlop macierzyński według liczby dzieci z jednego porodu | 1 dziecko: 20 tyg. · 2: 31 tyg. · 3: 33 tyg. · 4: 35 tyg. · 5 i więcej: 37 tyg. | ZUS s. 5, Zał. |
| Urlop na warunkach macierzyńskiego według liczby dzieci przyjętych jednocześnie | jak wyżej: 20 / 31 / 33 / 35 / 37 tyg. | Zał. |
| Minimalny okres na warunkach macierzyńskiego | 9 tygodni | Zał. |
| Część macierzyńskiego wykorzystywana osobiście przez matkę | 14 tygodni | ZUS s. 5, 7 |
| Najwcześniejszy start macierzyńskiego przed porodem | 6 tygodni | ZUS s. 5 |
| Martwe urodzenie lub zgon przed 8. tygodniem życia | 8 tygodni, min. 7 dni od zgonu | ZUS s. 6 |
| Zgon po 8. tygodniu życia | 7 dni od zgonu | ZUS s. 6 |
| Uzupełniający urlop macierzyński | jednorazowo, bezpośrednio po macierzyńskim, 1 tydzień za każdy tydzień pobytu dziecka w szpitalu; reguły wymiaru w tabeli 3.2a | ZUS s. 8, Zał., Kp art. 180² |
| Pula urlopu rodzicielskiego | 41 tygodni (jedno dziecko) / 43 tygodnie (więcej) | ZUS s. 7, Kp art. 182¹ᵃ |
| Część nieprzenoszalna na rodzica | 9 tygodni | ZUS s. 7, Kp art. 182¹ᵃ |
| Pula rodzicielskiego przy zaświadczeniu „Za życiem” | 65 tygodni (jedno dziecko) / 67 tygodni (więcej) | Zał., Kp art. 182¹ᵃ |
| Maksymalna liczba części urlopu rodzicielskiego | 5 | ZUS s. 7 |
| Termin wykorzystania rodzicielskiego | do końca roku kalendarzowego, w którym dziecko kończy 6 lat | ZUS s. 6–7 |
| Urlop ojcowski | 14 dni, jednorazowo albo 2 części po min. 7 dni | ZUS s. 8 |
| Termin ojcowskiego | do 12 miesięcy życia dziecka; przy adopcji 12 miesięcy od uprawomocnienia, nie dłużej niż do 14 lat dziecka | ZUS s. 8 |
| Na warunkach macierzyńskiego, rodzina zastępcza | do 7 lat dziecka, do 10 przy odroczeniu obowiązku szkolnego | ZUS s. 9 |
| Na warunkach macierzyńskiego, przysposobienie | do 14 lat dziecka | ZUS s. 9 |
| Łączenie rodzicielskiego z pracą: wymiar pracy | maks. połowa pełnego wymiaru czasu pracy | ZUS s. 9, Kp art. 182¹ᵉ |
| Łączenie z pracą: wydłużenie | liczba tygodni łączenia × wymiar pracy; niepełny tydzień udzielany w dniach | Kp art. 182¹ᶠ |
| Łączenie z pracą: górny limit urlopu | 82 tyg. (jedno dziecko) / 86 tyg. (więcej); przy „Za życiem” 130 / 134 tyg. | Kp art. 182¹ᶠ |

#### 3.2a Uzupełniający urlop macierzyński

| Przypadek | Wymiar | Źródło |
| --- | --- | --- |
| Urodzenie przed 28. tygodniem ciąży | 1 tydzień za każdy tydzień w szpitalu, do 15. tygodnia po porodzie | Zał. |
| Masa urodzeniowa ≤ 1000 g | jak wyżej, do 15. tygodnia | Zał. |
| Przed 28. tygodniem i ≤ 1000 g | jak wyżej, do 15. tygodnia | Zał. |
| Po 28. i przed 37. tygodniem, masa > 1000 g | 1 tydzień za każdy tydzień w szpitalu, do 8. tygodnia po porodzie | Zał. |
| Po 37. tygodniu, hospitalizacja min. 2 kolejne dni między 5. a 28. dniem po porodzie | 1 tydzień za każdy tydzień, od 5. dnia do 8. tygodnia po porodzie | Zał. |
| Więcej niż jedno dziecko | według najniższej masy urodzeniowej i najdłuższej hospitalizacji | Zał., Kp art. 180² |
| Liczenie | okresy pobytu w szpitalu sumuje się, niepełny tydzień zaokrągla w górę | Zał., Kp art. 180² |

Progi tej tabeli (28. tydzień, 37. tydzień, 1000 g, 8 i 15 tygodni, 5. i 28. dzień) są osobnymi parametrami. Dzięki temu zmiana jednego progu nie wymaga zmiany algorytmu.

### 3.3 Warunki prawa do zasiłku chorobowego

| Parametr | Wartość | Źródło |
| --- | --- | --- |
| Okres wyczekiwania, ubezpieczenie obowiązkowe | 30 dni | ZUS s. 3 |
| Okres wyczekiwania, ubezpieczenie dobrowolne | 90 dni | ZUS s. 3 |
| Wynagrodzenie chorobowe od pracodawcy | 33 dni w roku, 14 dni po 50. roku życia | ZUS s. 3–4 |
| Okres zasiłkowy | 270 dni, także po ustaniu ubezpieczenia w ciąży | ZUS s. 4, Zał. |
| Sumowanie okresów niezdolności | wlicza się poprzednie okresy, jeśli przerwa ≤ 60 dni; wyjątek: nowa niezdolność w ciąży nie dolicza okresów sprzed przerwy | Zał. |

### 3.4 Kto wypłaca (kierowanie rodzica)

| Parametr | Wartość | Źródło |
| --- | --- | --- |
| Próg płatnika uprawnionego do wypłaty zasiłków | powyżej 20 ubezpieczonych | ZUS s. 1, przypis 1 |
| Dzień ustalenia liczby ubezpieczonych | 30 listopada poprzedniego roku | ZUS s. 1, przypis 1 |

Od tego parametru zależy, czy plan rodzica mówi „złóż u pracodawcy”, czy „złóż w ZUS” **[ZUS s. 13, pkt g]**.

### 3.5 Podstawa wymiaru zasiłku

| Parametr | Wartość | Źródło |
| --- | --- | --- |
| Pomniejszenie o składki społeczne finansowane przez ubezpieczonego | 13,71% | Zał. |
| Okres do średniej, pracownik | 12 pełnych miesięcy kalendarzowych przed miesiącem choroby; przy krótszym zatrudnieniu pełne miesiące nieprzerwanego ubezpieczenia | Zał. |
| Okres do średniej, osoba niebędąca pracownikiem | przeciętny miesięczny przychód z 12 miesięcy przed miesiącem choroby | Zał. |
| Choroba w 1. lub 2. miesiącu pracy | wynagrodzenie z umowy uzupełnione do pełnego miesiąca | Zał. |
| Przerwa między zasiłkami | krótsza niż 1 miesiąc: podstawa poprzedniego zasiłku; co najmniej 1 miesiąc: nowa podstawa | Zał. |
| Płaca minimalna 2026 (do minimalnej podstawy) | 4 806 zł brutto | Zał. |
| Minimalna podstawa 2026 | ⚠️ **WARTOŚĆ NIEPEWNA, wymaga dopytania mentorów ZUS.** Roboczo 4 147,10 zł, wyliczone przez nas (4 806 zł − 13,71%). Załącznik zapowiada tę wartość, ale jej nie podaje. Nie używać w demo jako potwierdzonej. | Zał. (brak wartości) |
| Maks. podstawa dobrowolnej składki chorobowej 2026 | 23 550,00 zł | Zał. |
| Limit podstawy zasiłku dla niebędących pracownikami | 20 321,30 zł | Zał. |
| Składniki kwartalne | 1/12 kwot wypłaconych za 4 poprzednie kwartały | Zał. |
| Składniki roczne | 1/12 kwoty wypłaconej za poprzedni rok | Zał. |
| Niepełny miesiąc | przepracowane < 1/2 czasu pracy: miesiąc wyłączony; ≥ 1/2: wynagrodzenie uzupełniane | Zał. |

Kwoty roczne (płaca minimalna, limity podstawy) zmieniają się co roku, więc mają datę obowiązywania jak każdy parametr.

**[P] Typy pól i walidacja:** procent (0–100, jedno miejsce po przecinku), tygodnie, dni, miesiące, lata, liczba całkowita (części, próg ubezpieczonych), data. Panel nie pozwala zapisać wartości z niewłaściwą jednostką ani poza zakresem.

## 4. Reguły świadczeń · dokumenty, terminy, warunki

### 4.1 Katalog formularzy

Każdy formularz ma: symbol, nazwę dla rodzica, kto składa i do kogo, dla jakiego okresu lub świadczenia, datę obowiązywania od–do, link do wzoru na zus.pl **[ZUS s. 12]**.

| Formularz | Stan według zadania | Źródło |
| --- | --- | --- |
| ZAM | obowiązuje; od 24.10.2026 obejmuje też dawne ZUR i ZAO | ZUS s. 6, 12 |
| ZUR | zlikwidowany od 24.10.2026 | ZUS s. 12 |
| ZAO | zlikwidowany od 24.10.2026 | ZUS s. 12 |
| Z-3, Z-3a | obowiązują | ZUS s. 3, 6, 12 |
| Z-3b | zlikwidowany od 24.10.2026 | ZUS s. 12 |
| ZAS-12, ZAS-53 | obowiązują | ZUS s. 3, 12 |
| e-ZLA (kod „B” dla ciąży) | obowiązuje | ZUS s. 3 |
| Wnioski urlopowe do pracodawcy | projektujemy sami | ZUS s. 13 |
| Wniosek o odpis aktu urodzenia | symulacja | ZUS s. 14 |

Zmiana formularza (np. likwidacja ZUR) ma ten sam przebieg co zmiana parametru: szkic, podgląd u rodzica, sprawdzenie, publikacja od daty **[P]**. Szkice rodziców oparte na wycofanym formularzu dostają oznaczenie „Sprawdź po zmianie” **[SPEC-PO-LOGOWANIU, wzorzec]**.

### 4.2 Dokumenty dodatkowe

Lista dokumentów, które wpływają na prawo lub wymiar: zaświadczenie o martwym urodzeniu, zaświadczenie „Za życiem”, zaświadczenie ze szpitala do uzupełniającego urlopu, prawomocny wyrok przy naruszeniu przepisów przy rozwiązaniu umowy **[ZUS s. 4, 6]**. Przy każdym: kiedy jest potrzebny i na co wpływa.

### 4.3 Terminy w planie rodzica

Terminy z podstawą i zdarzeniem, od którego się liczą **[SPEC]**. **[P]** Administrator edytuje wartość, zdarzenie bazowe i podstawę, a plan rodzica przelicza daty.

| Termin | Wartość | Zdarzenie bazowe | Źródło |
| --- | --- | --- | --- |
| Wniosek matki o stawkę 81,5% | do 21 dni | po porodzie | ZUS s. 9 |
| Wniosek o urlop rodzicielski | min. 21 dni | przed rozpoczęciem urlopu | Kp art. 182¹ᵈ |
| Wniosek o łączenie rodzicielskiego z pracą | min. 21 dni | przed podjęciem pracy | Kp art. 182¹ᵉ |
| Odpowiedź pracodawcy o odmowie łączenia | 7 dni | od otrzymania wniosku | Kp art. 182¹ᵉ |
| Wniosek o uzupełniający urlop macierzyński | min. 21 dni | przed końcem urlopu macierzyńskiego | Kp art. 180² |
| Wniosek ojca o część urlopu macierzyńskiego | min. 14 dni | przed rozpoczęciem części | Kp art. 180 |
| Rezygnacja matki z części macierzyńskiego | min. 7 dni | przed powrotem do pracy | Kp art. 180 |
| Wniosek o urlop ojcowski | min. 7 dni | przed rozpoczęciem urlopu | Kp art. 182³ |
| Zgłoszenie urodzenia | 21 dni | od wystawienia karty urodzenia | SPEC |

### 4.4 Sytuacje szczególne (warunki, nie liczby)

**[P]** Lista warunków z opisem i podstawą, edytowalna tekstowo, bez zmiany algorytmu: przejęcie macierzyńskiego przez ojca przed 14 tygodniami (orzeczenie o niezdolności do samodzielnej egzystencji, szpital, zgon lub porzucenie dziecka przez matkę) **[ZUS s. 7]**, zasiłek w wysokości macierzyńskiego po utracie pracy w ciąży (upadłość, likwidacja, śmierć pracodawcy, naruszenie przepisów z wyrokiem) **[ZUS s. 4]**, ojciec przy nieubezpieczonej matce **[ZUS s. 7–8]**.

## 5. Treści i źródła

| Grupa | Co zawiera | Źródło |
| --- | --- | --- |
| Ryzyka utraty lub obniżenia świadczeń | Umowa lub działalność dla pozoru, podwyższenie podstawy składek w ciąży, brak ubezpieczenia chorobowego w dniu porodu (niezgłoszenie, rozwiązanie umowy, zakończenie działalności). Każde z opisem i podstawą. | ZUS s. 9–10, pkt h s. 13 |
| Ochrona pracownicza | Zakaz wypowiedzenia, przedłużenie umowy na czas określony do porodu, wyłączenie dla osób niebędących pracownikami. | ZUS s. 10 |
| Organizacje wsparcia | Nazwa, komu pomaga, w jakiej sytuacji (śmierć dziecka, przedwczesny poród, poronienie, ciężka choroba dziecka), kontakt, link. Wyłącznie podmioty o charakterze charytatywnym. Data ostatniej weryfikacji. | ZUS s. 13 pkt i, s. 14 |
| Linki do źródeł oficjalnych | zus.pl, MRPiPS (urlop rodzicielski), PIP (rodzicielstwo). Data sprawdzenia linku. | ZUS s. 14 |
| Liczby na stronie publicznej | Wartości bento (np. 340,3 tys. osób) ze źródłem i okresem danych. | SPEC |

**[P]** Przy organizacjach i linkach panel pokazuje ostrzeżenie, gdy data weryfikacji jest starsza niż 6 miesięcy.

**[P, rozszerzenie]** Źródła wiedzy agenta: lista materiałów ZUS, z których Zusik odpowiada (poradnik 2026, wyciąg przepisów), z datą wersji. Zadanie wymaga wskazania, które funkcje używają AI **[ZUS s. 14]**, więc panel pokazuje, na jakich materiałach odpowiada agent.

## 6. Sprawy testowe

| Element | Opis | Źródło |
| --- | --- | --- |
| Zestawy ZUS | Kilkadziesiąt spraw z dokumentami i informacją, czy świadczenie przyznano. W repo: `Materiały hackathonowe/Sprawy`, ok. 70 plików PDF, m.in. martwe urodzenie, bliźnięta, skrajny wcześniak, „Za życiem”, łączenie z pracą, adopcja, rodzina zastępcza, odmowy (brak ubezpieczenia, umowa dla pozoru, zadłużenie, 6. część rodzicielskiego). | ZUS s. 11 |
| Wybór lub upload | Wybór gotowej sprawy albo wgranie testowego PDF (ZAM, Z-3, Z-3a, poświadczenie ubezpieczenia, zrzuty z systemu ZUS, ZAS-12). | ZUS s. 12, 14–15 |
| Widok sprawy | Dane wejściowe odczytane z dokumentów, oczekiwany rezultat, wynik kalkulatora dla wybranej wersji reguł, zgodność. | SPEC |
| Podgląd oczami rodzica | Ta sama sprawa w widoku rodzica. | SPEC |
| Brakujące dane | Komunikat z nazwą brakującej informacji, np. podstawy wymiaru. | SPEC |
| Uruchom wszystkie | **[P]** Jedno kliknięcie przelicza wszystkie sprawy na bieżącej lub szkicowej wersji reguł. Wynik: liczba zgodnych i niezgodnych, lista niezgodnych z różnicą. | P |
| Profile symulacji | **[P]** Dla każdej sprawy dane symulowane wymagane przez zadanie: stan ubezpieczenia, zadłużenie składkowe na dzień powstania prawa (zwłaszcza działalność gospodarcza), podgląd e-ZLA, dane konta PUE/eZUS. | ZUS s. 13 |
| Ochrona danych | Dokumentów ZUS nie wolno kopiować ani rozpowszechniać, wyłącznie na użytek HackNation. Sprawy nie są publiczne poza demo. | ZUS s. 11–12 |

## 7. Przygotuj zmianę

**[SPEC]**

1. **Ustal, co się zmienia.** Nagłówek podaje pełny kontekst, np. „Zasiłek macierzyński za okres urlopu rodzicielskiego · stawka”. Formularz pokazuje bieżącą wartość, pole nowej wartości z jednostką, zakres spraw, datę stosowania, podstawę zmiany z odnośnikiem do źródła i krótkie uzasadnienie. Dla limitu tygodni pokazuje tygodnie. Zapis tworzy **szkic** dostępny administratorowi.
2. **Sprawdź, kto zobaczy różnicę.** Po prawej stronie formularza, a na telefonie pod nim, karta „Wpływ na rodzinę” pokazuje tę samą sprawę w dwóch kolumnach „Obecnie” i „Po zmianie”. Widać okres, stawkę, liczbę dni oraz kwotę lub przyczynę braku uprawnienia. „Pokaż oczami rodzica” otwiera kalkulator z tymi danymi i oznaczeniem „Podgląd szkicu”. Obie wersje korzystają z mechanizmu wyliczeń aplikacji rodzica.
3. **Zweryfikuj granice.** „Sprawdź zmianę” porównuje wynik z oczekiwaniem dla zmienianej grupy, sprawy tuż przed wejściem reguły i przypadku spoza jej zakresu. Dla zmiany maksymalnego wymiaru sprawdza również wniosek dokładnie na limicie oraz taki, który go przekracza. Niezgodność pokazuje konkretną sprawę i różnicę, a szkic pozostaje do poprawy.
4. **Opublikuj od wskazanej daty.** Podsumowanie pokazuje zmianę wartości, datę i rezultaty sprawdzenia. Przycisk podaje skutek, np. „Zaplanuj zmianę od 1 stycznia”. Wersja przechodzi ze stanu **Szkic** do **Zaplanowana** albo **Obowiązuje**. Po zastąpieniu poprzedniej wersji pozostaje ona dostępna jako **Historyczna**.

Doprecyzowanie **[P]**, jakie sprawdzenia uruchamia „Sprawdź zmianę” dla każdego typu:

| Typ zmiany | Sprawdzane przypadki |
| --- | --- |
| Stawka | Sprawa w zakresie zmiany, sprawa dzień przed datą obowiązywania, sprawa spoza zakresu, okres przecinający datę zmiany |
| Wymiar lub limit | Wniosek dokładnie na limicie, wniosek ponad limit, bliźnięta (wspólna pula), łączenie z pracą |
| Termin | Zdarzenie bazowe w dniu zmiany i dzień wcześniej |
| Formularz | Szkice rodziców oparte na wycofanym formularzu, kierowanie płatnik / ZUS |
| Próg płatnika | Płatnik z 20 i z 21 ubezpieczonymi |

## 8. Historia zmian

Według SPEC: lista od najnowszej, autor, czas publikacji, poprzednia i nowa wartość, zakres, data obowiązywania, uzasadnienie, źródło, wyniki testów z chwili publikacji, korekta jako nowy szkic **[SPEC]**.

**[P]** Dodatkowo: filtr po grupie (stawki, wymiary, formularze, treści), oznaczenie zmian zaplanowanych na przyszłość, możliwość wycofania zaplanowanej zmiany przed datą wejścia.

## 9. Jak zmiana trafia do aplikacji rodzica

**[SPEC]**

- **Kalkulator i plan.** Regułę dobieramy według zdarzenia określonego w jej podstawie i właściwych przepisów przejściowych. Dla okresu przecinającego datę zmiany test musi pokazać sposób rozliczenia obu części albo zachowania dotychczasowych zasad. Gdy nowy limit wpływa na zaplanowany urlop, rodzic widzi przy tym okresie akcję „Sprawdź mój wariant”.
- **Zapisane sprawy.** Zapisany wariant zachowuje datę i wersję wyliczenia. Jeśli zmiana go dotyczy, „Porównaj z nowym wyliczeniem” pokazuje różnicę przed zapisaniem nowego wariantu. Dokument wysłany zachowuje treść z chwili wysyłki i powiązane potwierdzenie.
- **Zusik.** Wyjaśnia wynik zwrócony przez kalkulator. Przy pytaniu „Skąd ta kwota?” korzysta ze stawki, okresu i źródła przypisanych do wersji użytej w tej sprawie.

## 10. Dostęp i bezpieczeństwo

**[SPEC]** Dostęp do odczytu i publikacji sprawdzany po stronie serwera. Podgląd tylko na fikcyjnych rodzinach i testowych dokumentach. Ponowienie publikacji zapisuje zmianę raz. Konflikt dwóch zmian tej samej reguły pokazuje aktualną wersję.

**[P]** Role: „Redaktor” przygotowuje szkic, „Zatwierdzający” publikuje (zasada dwóch osób). W demo jedno konto ma obie role, żeby jury przeszło całą ścieżkę samo.

**[SPEC]** Sesja demonstracyjna jury jest odizolowana, kolejna startuje z wartościami początkowymi.

## 11. Zakres pierwszej wersji

| Obowiązkowe w demo | Rozszerzenie po konkursie |
| --- | --- |
| Pełna ścieżka zmiany dla stawki procentowej i maksymalnego wymiaru **[ZUS s. 13, SPEC]** | Pozostałe parametry z sekcji 3 edytowalne w tym samym przebiegu |
| Katalog parametrów z sekcji 3 do odczytu, z wartościami i źródłem | Katalog formularzy z datami obowiązywania (sekcja 4.1) |
| Sprawy testowe: wybór, upload PDF, oczekiwany wynik, zgodność **[ZUS s. 14–15]** | „Uruchom wszystkie” i profile symulacji w panelu |
| Historia z publikacją i jej podstawą | Treści i źródła (sekcja 5), źródła wiedzy agenta |
| Przykład +280 zł, przypadek spoza zakresu, przekroczenie limitu tygodni **[SPEC]** | Role redaktor / zatwierdzający |

## 12. Warunki odbioru dla jury

1. Zmiana stawki rodzicielskiej z 70% na 75% daje +280 zł w przykładowej sprawie (200 zł podstawy dziennie, 28 dni) **[SPEC]**.
2. Przypadek spoza zakresu zmiany zachowuje poprzedni wynik **[SPEC]**.
3. Zmiana maksymalnego wymiaru: wniosek na limicie przechodzi, ponad limit pokazuje przyczynę **[SPEC]**.
4. Wybrana sprawa ZUS lub wgrany PDF daje stan ubezpieczenia, kwotę i okres albo przyczynę braku prawa, zgodne z oczekiwanym wynikiem **[ZUS s. 14–15]**.
5. W historii widać publikację z autorem, datą i podstawą prawną **[SPEC]**.
6. Panel działa na telefonie i komputerze **[ZUS s. 14]**.

### Przykład do pokazania jury [SPEC]

Fikcyjna sprawa ma ustaloną dzienną podstawę 200 zł i obejmuje 28 dni jednego okresu. Na potrzeby demonstracji administrator zmienia stawkę z 70% na 75%. Są to założenia symulacji. Widok od razu pozwala wyjaśnić rodzicowi, skąd wzięła się różnica.

| W kalkulatorze rodzica | Obecnie | Po zmianie |
| --- | ---: | ---: |
| Zasiłek za dzień | 140 zł | 150 zł |
| Zasiłek za 28 dni | 3 920 zł | 4 200 zł |
| Różnica za cały okres | — | **+280 zł** |

Jury może opublikować zmianę w odizolowanej sesji demonstracyjnej, otworzyć ten sam przypadek od strony rodzica i zobaczyć 4 200 zł wraz z podstawą obliczenia. Drugi przypadek, poza zakresem zmiany, nadal pokazuje swój poprzedni wynik. Kolejna sesja demonstracyjna startuje z wartościami początkowymi.

### Zakres i warunki odbioru z pierwotnej wersji [SPEC]

- Administrator przechodzi pełną ścieżkę dla dwóch rodzajów parametrów wskazanych przez ZUS — stawki procentowej i maksymalnego wymiaru okresu. Nowy wariant wykorzystujący istniejący sposób liczenia można skonfigurować w jego zakresie. Wprowadzenie nowego algorytmu wymaga osobnej implementacji i spraw testowych.
- Publikacja wymaga poprawnej jednostki i wartości, uzupełnionego źródła, jednoznacznego okresu i zgodnych wyników testów. Przy konflikcie dwóch zmian tej samej reguły administrator widzi aktualną wersję do porównania. Ponowienie publikacji zapisuje zmianę tylko raz.
- Dostęp do odczytu panelu i publikacji sprawdzany jest po stronie serwera. Podgląd wykorzystuje wyłącznie fikcyjne rodziny i testowe dokumenty. Konto rodzica ma dostęp do własnego planu i opublikowanego wyniku właściwego dla danej sprawy.
- Demonstrację uznajemy za kompletną, gdy jury może odtworzyć różnicę **+280 zł**, sprawdzić przypadek poza zakresem zmiany, sprawdzić przekroczenie limitu tygodni oraz odnaleźć publikację i jej podstawę w historii.

## 13. Pytania do decyzji

| Pytanie | Rekomendacja | Decyzja [D] |
| --- | --- | --- |
| A. Gdzie trafiają treści i źródła z sekcji 5? | Jako grupa w „Regułach świadczeń”, bez czwartej zakładki, żeby nie ruszać uzgodnionej nawigacji. Alternatywa: zakładka „Treści i źródła”. | Czwarta zakładka „Treści i źródła” ze źródłami wiedzy Zusika. |
| B. Skąd prowadzi wejście do panelu? | Link „Panel administracyjny” w stopce strony publicznej i osobne logowanie demo dla administratora, oznaczone jako wersja demonstracyjna. | Bez linku ze strony publicznej. Wejście tylko przez adres `/admin`, który pokazuje logowanie bez rejestracji. Bez etykiety „Wersja demo” na logowaniu i w panelu. W demo login i hasło są już wpisane. |
| C. Które parametry są edytowalne w demo? | Wszystkie z sekcji 3 widoczne, pełna ścieżka zmiany dla stawek i wymiarów, reszta do odczytu. | Pełna ścieżka dla łącznego wymiaru zasiłku za okres urlopu ojcowskiego (niepracownik). Stawki dołączą po kalkulatorze w aplikacji rodzica. Reszta do odczytu. |
| D. Czy katalog formularzy wchodzi do demo? | Tak, w trybie do odczytu z przykładem ZUR i ZAO połączonych z ZAM od 24.10.2026, bo to realna zmiana z treści zadania. | Tak, do odczytu. Wzór ZAM z 24.10.2026 pochodzi z kodu aplikacji. |
| E. Role w demo | Jedno konto z obiema rolami, w opisie projektu wzmianka o zasadzie dwóch osób przy wdrożeniu. | Jedno konto `admin` z obiema rolami. |
| F. Minimalna podstawa wymiaru 2026 | ⚠️ **Niepewne, dopytać mentorów ZUS** (stoisko lub Discord). Załącznik zapowiada wartość, ale jej nie podaje. Do czasu odpowiedzi 4 147,10 zł traktujemy wyłącznie jako roboczą wartość z naszego wyliczenia. | Bez zmian, nadal do dopytania. |

## 14. Układ ekranów

**Uzgodnione 21.11.2026 (Nikodem).** Dotyczy rozmieszczenia kafli i kart. Kolory, typografia i detale wizualne ustalamy w Claude Design według DESIGN.md. Wzór prostoty układu: [Stack, Responsive Bootstrap 4 Admin Template](https://dribbble.com/shots/3559667-Stack-Responsive-Bootstrap-4-Admin-Template): sidebar po lewej, pasek u góry, treść w kartach na siatce 12 kolumn.

### Decyzje

| Pytanie | Decyzja |
| --- | --- |
| L1. Nawigacja | Lewy sidebar. Pozycje „Reguły świadczeń”, „Sprawy testowe”, „Historia zmian” w kolejności ze SPEC, a pod nimi „Treści i źródła” **[D]**. Na dole sidebaru „Wyloguj się”. |
| L2. Kafle podsumowania | Rząd 4 małych kafli u góry w „Regułach świadczeń” i „Sprawach testowych”. W „Sprawach” kafle działają jako filtry. |
| L3. Lista parametrów | Jedna karta z tabelą i zakładkami grup: Stawki, Wymiary, Uzupełniający, Chorobowy, Kto wypłaca, Podstawa, Terminy, Formularze. |
| L4. Szczegóły parametru | Panel boczny z wartością, historią i podstawą. „Przygotuj zmianę” otwiera pełny ekran z dwiema kolumnami. |
| L5. Historia zmian | Tabela i panel boczny ze szczegółami wpisu. |

### Szkielet panelu

```
┌───────────┬──────────────────────────────────────────────┐
│ PANEL     │ Pasek: nazwa widoku · konto (login)          │
│ ADMIN     ├──────────────────────────────────────────────┤
│           │                                              │
│ Reguły    │            treść widoku (karty)              │
│ świadczeń │                                              │
│ Sprawy    │                                              │
│ testowe   │                                              │
│ Historia  │                                              │
│ zmian     │                                              │
│ Treści i  │                                              │
│ źródła    │                                              │
│ [Wyloguj] │                                              │
└───────────┴──────────────────────────────────────────────┘
```

### Logowanie (`/admin`) [D]

```
┌──────────────────────────────────────────┐
│                                          │  białe tło strony
│          Panel Administratora            │  szeryf, ciemna zieleń, pośrodku
│                                          │  między górną krawędzią a kartą
│        ┌──────────────────────┐          │
│        │ Logowanie admin.     │          │  karta w kolorze secondary,
│        │ Zaloguj się          │          │  tekst w kolorze tuszu
│        │ Login   [admin    ]  │          │
│        │ Hasło   [•••• Pokaż] │          │  w demo pola są już wypełnione
│        │ [   Zaloguj się   ]  │          │
│        └──────────────────────┘          │
└──────────────────────────────────────────┘
```

Bez rejestracji, bez linku do strony głównej i bez etykiety „Wersja demo”. Mieści się bez przewijania na typowych laptopach i telefonach. Po zalogowaniu `/admin` przekierowuje do „Reguł świadczeń”.

### Reguły świadczeń (widok startowy)

```
┌──────────┬──────────┬──────────┬──────────┐
│Obowiązują│Zaplanow. │ Szkice   │ Sprawy   │  ← 4 małe kafle (po 3/12)
│  liczba  │ liczba · │  liczba  │ zgodne / │
│          │ najbliż. │          │ wszystkie│
│          │ data     │          │          │
├──────────┴──────────┴──────────┼──────────┤
│ Parametry (8/12)               │ Najbliż- │
│ [Stawki][Wymiary][Uzupełn.]... │ sze zmia-│
│ nazwa · wartość · od · stan    │ ny (4/12)│
│                                ├──────────┤
│                                │ Ostatnie │
│                                │ publikac.│
└────────────────────────────────┴──────────┘
```

Kliknięcie wiersza otwiera panel boczny ze szczegółami parametru i przyciskiem „Przygotuj zmianę”. **[D]** Każdy parametr ma etykietę „W aplikacji” (wartość czytana z kodu aplikacji rodzica) albo „Ze specyfikacji” (aplikacja jeszcze jej nie liczy). Panel boczny pokazuje też link do źródła i jego brzmienie.

### Przygotuj zmianę

```
┌────────────────────────┬─────────────────┐
│ Formularz zmiany (7/12)│ Wpływ na rodzinę│
│ obecna → nowa wartość  │ (5/12)          │
│ zakres, data, podstawa │ Obecnie │ Po zm.│
│ uzasadnienie           │ [Pokaż oczami   │
│                        │  rodzica]       │
├────────────────────────┴─────────────────┤
│ Wyniki „Sprawdź zmianę” (12/12): tabela  │
├──────────────────────────────────────────┤
│ Pasek akcji: Zapisz szkic · Sprawdź ·    │
│ Zaplanuj zmianę od …                     │
└──────────────────────────────────────────┘
```

### Sprawy testowe

```
┌──────────┬──────────┬──────────┬───────────┐
│Wszystkie │ Zgodne   │Niezgodne │Brak danych│ ← 4 kafle = filtry
├──────────┴──┬───────┴──────────┴───────────┤
│ Lista spraw │ Szczegóły sprawy (8/12)      │
│ (4/12)      │ Dane wejściowe │ Oczekiwany  │
│ szukaj      │                │ vs wynik    │
│ [Wgraj PDF] │ [Pokaż oczami rodzica]       │
└─────────────┴──────────────────────────────┘
```

### Historia zmian

```
┌──────────────────────────────┬───────────┐
│ Tabela publikacji            │ Panel     │
│ data · parametr · stara →    │ boczny ze │
│ nowa · autor · stan          │ szczegóła-│
│                              │ mi wpisu  │
└──────────────────────────────┴───────────┘
```

### Telefon

- Sidebar chowa się pod ikoną menu.
- 4 kafle układają się w siatkę 2 × 2.
- Karty idą jedna pod drugą w kolejności z widoku komputerowego (lewa kolumna, potem prawa).
- „Przygotuj zmianę”: formularz, wpływ na rodzinę, wyniki. Pasek akcji przypięty do dołu ekranu.
- Panele boczne otwierają się na całą szerokość ekranu, z przyciskiem „Zamknij”.

## 15. Stan wdrożenia (22.11.2026)

Panel działa w `app/` pod `/admin` (produkcja: https://straylight-hacknation.vercel.app/admin). Szczegóły techniczne: [app/ARCHITECTURE.md](app/ARCHITECTURE.md).

### Co działa

| Obszar | Stan | Uwagi |
| --- | --- | --- |
| Logowanie (§10, §13 B) | ✅ | Login i hash hasła (scrypt) ze zmiennych `ADMIN_LOGIN` i `ADMIN_PASSWORD_HASH`, nadawanych przez operatora. Sesja 8 h w podpisanym ciasteczku, dostęp sprawdzany po stronie serwera na każdej stronie panelu. `ADMIN_DEMO_PASSWORD` wypełnia formularz w demo. |
| Reguły świadczeń (§3, §4) | ✅ | Etykieta „W aplikacji” oznacza wartości czytane z kodu: stawki 100% / 70% / 81,5% (art. 31), kwota świadczenia rodzicielskiego 1000 zł, do której podwyższa się zasiłek (art. 31 ust. 3a, art. 17c ust. 5 ustawy o świadczeniach rodzinnych), ojcowski (14 dni, 2 części), cztery przepisy ustawy zasiłkowej z oceny chorobowego (w tym 100% w ciąży, art. 11 ust. 2 pkt 1), próg płatnika, płaca minimalna z progiem zadłużenia, katalog 8 formularzy z datami (zadanie s. 12) i wzór ZAM z 24.10.2026. Pozostałe wartości mają etykietę „Ze specyfikacji”. |
| Zmiana parametru (§7) | ✅ 28 parametrów | Jeden mechanizm (`app/src/lib/admin/parameter-changes.ts`) dla: łącznego wymiaru ojcowskiego, trzech stawek, kwoty świadczenia rodzicielskiego, liczb kalkulatora rodzica (urlop macierzyński dla 1–5 dzieci, urlop rodzicielski 41/43 i „Za życiem” 65/67 tygodni, część wyłączna 9 tygodni, termin wniosku o 81,5%, pomniejszenie podstawy o 13,71%), progu płatnika (art. 61), płacy minimalnej i statusów 8 formularzy. Szkic, wpływ „Obecnie / Po zmianie”, „Sprawdź zmianę” na prawdziwej regule, publikacja od daty, wpis w historii. Wymiar ojcowski trafia do sprawy Kamila w aplikacji rodzica (sprawdzone na produkcji), a „Pokaż oczami rodzica” otwiera ją z wartością ze szkicu na 30 minut. Pozostałe parametry zmieniają reguły gotowe dla ekranów rodzica, które jeszcze z nich nie korzystają. |
| Sprawy testowe (§6) | ✅ 16 spraw syntetycznych | Sprawa Kamila w 8 wariantach (K-01…K-08, w tym 14 dni naraz z ubezpieczeniem potwierdzonym na koncie ZUS), 5 spraw z kwotą zasiłku (R-01…R-05, w tym zaokrąglenie do grosza i podstawa wyliczona z Z-3) i 3 z podwyższeniem do kwoty świadczenia rodzicielskiego (R-06…R-08, w tym część miesiąca), liczone na żywo regułą. Oczekiwane kwoty policzone ręcznie, niezależnie od kodu reguły. Wszystkie mają komplet danych i na wartościach początkowych są zgodne (16/16). Status „Brak danych” z nazwą brakującej informacji reguła nadal zwraca, gdy fakt zniknie (pilnuje tego test). Sprawa, której wynik zmieniła opublikowana zmiana, ma status „Do aktualizacji” z nazwą tej zmiany zamiast „Niezgodna”. Parametry „Ze specyfikacji” mają podstawę z korpusu: link do aktu i dosłowny cytat (Kp art. 180², 182³, ustawa zasiłkowa art. 4, 8). |
| Historia zmian (§8) | ✅ | Publikacje z sesji z autorem, godziną, podstawą i wynikiem sprawdzenia. Wycofanie zaplanowanej zmiany. Wpisy przykładowe są oznaczone. |
| Treści i źródła (§5) | ✅ | Pakiety wiedzy Zusika z manifestów korpusu i ostrzeżeniem po 6 miesiącach od pobrania. Organizacje wsparcia (zadanie s. 13 pkt i): 6 fundacji z KRS, opisem i kontaktem ze strony organizacji, datą weryfikacji 22.11.2026 i ostrzeżeniem po 6 miesiącach (`app/src/lib/support/organizations.ts`). Edycja w sesji demo: zmiana opisu i kontaktu, potwierdzenie weryfikacji, dodanie fundacji lub stowarzyszenia (KRS, strona https, co najmniej jedna sytuacja), wycofanie z listy, cofnięcie zmian. |
| Kto wypłaca i zadłużenie (§3.4, §3.5) | ✅ reguły | `lib/rules/payer.ts` (art. 61: płatnik powyżej 20 ubezpieczonych na 30 listopada poprzedniego roku, inaczej ZUS) i `lib/rules/arrears.ts` (art. 2a: zadłużenie powyżej 1% płacy minimalnej wstrzymuje świadczenie do spłaty, przedawnienie po 6 miesiącach). W panelu jako „W aplikacji”. Ekrany rodzica jeszcze z nich nie korzystają. |
| Telefon i komputer (§12 pkt 6) | ✅ | |

### Decyzje wdrożeniowe [D]

- Reguła bierze wartość obowiązującą w pierwszym dniu okresu, za który rodzic wnioskuje (§9). Bez opublikowanej zmiany działa jak dotąd.
- Wymiar ojcowski można ustawić na 1–4 tygodnie. Aplikacja przyjmuje części po tydzień lub dwa, najwyżej dwie.
- Zmiana obowiązuje najwcześniej od jutra. Zmian wstecz panel nie przyjmuje.
- „Sprawdź zmianę” zależy od typu parametru (§7). Limit: wniosek na limicie, ponad limit, ten sam wniosek dzień przed zmianą, druga część urlopu. Stawka: sprawa w zakresie, dzień przed zmianą, sprawa spoza zakresu (inny rodzaj zasiłku), okres przecinający datę zmiany liczony w dwóch częściach. Próg płatnika: próg i próg+1 od daty zmiany, próg+1 dzień przed, działalność zawsze ZUS. Płaca minimalna: zadłużenie równe 1% nie wstrzymuje, o grosz wyższe wstrzymuje. Formularz: status w dniu zmiany i dzień wcześniej. Zawsze: sprawy testowe sprzed daty zmiany bez zmian (§12 pkt 2) i uzupełniona podstawa. Sprawy w zakresie zmiany, których wynik się zmienia, panel pokazuje jako informację. Nie blokują one publikacji, ale po publikacji ich oczekiwany wynik trzeba zaktualizować.
- Stawki liczone w groszach: podstawa dzienna × stawka, zaokrąglenie do grosza, razy liczba dni (`app/src/lib/rules/rates.ts`).
- Podwyższenie (art. 31 ust. 3a i 3c): zasiłek niższy niż kwota świadczenia rodzicielskiego (1000 zł, art. 17c ust. 5 ustawy o świadczeniach rodzinnych) podwyższa się do tej kwoty, za część miesiąca proporcjonalnie, 1/30 za dzień (art. 31 ust. 5 z art. 11 ust. 4). Porównuje się zasiłek po potrąceniu zaliczki na podatek (poradnik ZUS, s. 20), więc reguła przyjmuje tę kwotę jako daną. Zaliczki na podatek nie liczy. Decyduje kwota obowiązująca w pierwszym dniu zasiłku w danym miesiącu.
- Sprawdzenie wymiarów urlopu: wartość od dnia zmiany i bez zmian dzień wcześniej oraz spójność. Urlop macierzyński nie krótszy niż dla mniejszej i nie dłuższy niż dla większej liczby dzieci. Urlop rodzicielski mieści dwie części wyłączne, dla jednego dziecka nie dłuższy niż dla więcej dzieci, „Za życiem” nie krótszy niż bez zaświadczenia. Niespójny wymiar blokuje publikację.
- Sprawdzenie kwoty świadczenia rodzicielskiego: zasiłek równy nowej kwocie nie dostaje podwyższenia, o 1 zł niższy dostaje 1 zł, ten sam zasiłek dzień przed zmianą liczy się ze starą kwotą, część miesiąca proporcjonalnie.
- Próg zadłużenia nie ma osobnej wartości: zmienia się razem z płacą minimalną.
- Wersje parametrów i zmiany organizacji wsparcia są zapisane w podpisanych ciasteczkach sesji. Zmiana jurora nie trafia do innych, a kolejna sesja zaczyna od wartości z kodu (§10). „Przywróć wartości początkowe” w historii robi to od razu. Przy wdrożeniu produkcyjnym ten sam stan trafi do bazy.
- Akta spraw ZUS (`Materiały hackathonowe/Sprawy`) nie są czytane ani dołączane do aplikacji (ZUS s. 11–12).

### Warunki odbioru (§12)

| Warunek | Stan |
| --- | --- |
| 1. +280 zł po zmianie stawki | ✅ W panelu: stawka rodzicielska 70% → 75% daje +280 zł dla podstawy 200 zł i 28 dni, liczone regułą `rates.ts`. Kalkulator rodzica podłączy tę samą regułę. |
| 2. Przypadek spoza zakresu zachowuje wynik | ✅ Dla wszystkich zmienianych parametrów. |
| 3. Limit: na limicie przechodzi, ponad limit pokazuje przyczynę | ✅ |
| 4. Sprawa ZUS lub wgrany PDF daje wynik zgodny z oczekiwanym | ⏳ Wybór spraw syntetycznych działa. Wgrany PDF nie jest jeszcze odczytywany. |
| 5. Historia z autorem, datą i podstawą | ✅ |
| 6. Telefon i komputer | ✅ |

### Do zrobienia

1. Kalkulator rodzica (zespół): liczby z `MATERNITY_PARAMETERS` są już w `RULE_PARAMETERS`. `maternityParametersOn(schedule, dzień)` z `app/src/lib/rules/maternity-schedule.ts` zwraca je w jednostkach kalkulatora (bez harmonogramu dokładnie `MATERNITY_PARAMETERS`, pilnuje tego test). Do podpięcia w `maternity.ts` (`paramsOf`) i na stronie `/kalkulator` z harmonogramem z `effectiveSchedule()`. Wtedy zmiana z panelu będzie widoczna u rodzica, a „Pokaż oczami rodzica” zadziała też dla stawek i wymiarów.
2. Parametry urlopu rodzicielskiego (21 dni, 5 części, 287 dni): przenieść wartości z `app/src/lib/marta/case.ts` do `app/src/lib/rules/parameters.ts`.
3. Odczyt wgranego wniosku w „Sprawach testowych” albo odesłanie do odczytu dokumentów w aplikacji rodzica.
4. Przy wdrożeniu produkcyjnym: wersje i organizacje w bazie zamiast ciasteczka oraz role redaktora i zatwierdzającego.
5. Ekran „Wsparcie” rodzica (zespół): korzystać z `supportOrganizations()` z `app/src/lib/admin/support-store.ts`, żeby zmiany organizacji z panelu były widoczne u rodzica.

Materiał do opisu projektu i prezentacji: [ZGLOSZENIE-PANEL-ADMINISTRACYJNY.md](ZGLOSZENIE-PANEL-ADMINISTRACYJNY.md).
