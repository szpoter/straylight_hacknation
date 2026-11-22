# 06 · Walidacja na losowej sprawie, wydanie i odtworzenie wyniku

**Pytanie odbiorowe:** gdy juror wgra dowolny pakiet pod zmienioną nazwą do pustego czatu, czy wynik odpowiada dokumentom, czy rachunek się zgadza i czy ZUSik właściwie reaguje na lukę w dowodach? W tym pliku „zaliczone” dotyczy określonej wersji aplikacji, źródeł, parametrów i zestawu testowego.

## Zanim zacznie się strojenie

1. Opiekun zbioru buduje prywatne wzorce według [procedury anotacji](01-zakres-i-wzorce.md). Grupuje identyczne pliki, ponowne złożenia, powiązane strony i sprawy tej samej rodziny. Grupa zawsze trafia do jednego zbioru. Sprawdza, które oryginały oglądali już autorzy obecnych scenariuszy i parserów.
2. W zbiorze **roboczym** poprawiamy błędy, w **walidacyjnym** wybieramy wersję, ostatnia **próba odłożona** zostaje u innego testera. Cel planistyczny to około 60/13/13 unikatowych pakietów. Opiekun koryguje liczebność do całych grup, dba o różny tytuł, długość, odmowy i trudne warianty. Publikuje rzeczywiste liczebności. Już znanych oryginałów nie opisujemy jako ślepej próby. Gdy rzadki typ występuje tylko raz, dodajemy niezależny przykład syntetyczny i ujawniamy ograniczenie.
3. Losowanie z utrwalonym ziarnem wykonuje osoba przygotowująca test; zbiór i klucz pozostają prywatne. Każdy pakiet trafia finalnie do pełnego przebiegu regresji. Jeśli zespół dostroił aplikację po obejrzeniu odłożonego błędu, następny pomiar na tym przykładzie jest regresją. Jako nową próbę wykorzystujemy nadal niewidziane rodziny albo nowe syntetyczne dokumenty zweryfikowane przez drugą osobę.
4. Dla każdej rodziny przygotować dwa pytania bez podpowiedzi nazwy świadczenia, jedno o konkretną kwotę lub okres i naturalny follow-up, np. „dlaczego?”, „od kiedy?”, „co mam dołączyć?”. Oddzielnie ocenić zadanie „wyjaśnij załączoną decyzję” i „policz na podstawie wniosku”. W drugim trybie wyłączyć decyzję i końcowe rozliczenie z wejścia; uwzględniać wcześniejsze zdarzenia będące legalnym dowodem historii.

## Warstwy testu i kolejność wykonania

| Kolejność i właściciel | Próba | Co zapisać przy rozbieżności |
|---|---|---|
| 1. QA dokumentów | Lokalny odczyt oryginalnego pakietu, z zachowaniem kolejności. Parser oznacza każdą stronę i tabelę. Dla próbki z każdego typu porównać ręcznie krytyczne cyfry, wiersze i kolumny. | ID, numer strony, typ pola, oczekiwane/otrzymane wyłącznie w prywatnym raporcie, wersja czytnika. |
| 2. Backend danych | Do tego samego kontraktu wprowadzić fakty kontrolnie ręcznie i z lokalnego OCR. Porównać osobę, tytuł, płatnika, źródło i datę. Podmienić kolejność załączników i język miesiąca. | Pierwsza różnica przed rozstrzygnięciem. Ułatwia odróżnienie błędu odczytu od błędu w regule. |
| 3. Właściciel reguł | Uruchomić reguły na ręcznie zatwierdzonych faktach. Porównać decyzję i okresy osobno dla każdego świadczenia, a następnie rachunek. | Kod reguły, wersja, krok rachunku, skala kwoty, rozbieżność groszy, źródło i dzień odniesienia. |
| 4. Czat i UI | Użyć normalnego przycisku załącznika w świeżej sesji. Brak profilu, właściwy profil oraz celowo inny profil demonstracyjny. Po pierwszym wyniku dodać dowód, skorygować datę, odświeżyć, zapytać o rachunek i otworzyć stronę źródłową. | Czy pierwszy i następny wynik powstały z właściwej wersji faktów, czy wskazany numer strony i dokument się zgadzają, czy UI jasno rozróżniło nową wersję. |
| 5. Niezależny tester | Lokalnie odtworzyć właściwy build i przetworzyć wszystkich 86 unikatów. W nowej sesji losowo wybrane sprawy przejść także ręcznie do ostatniej odpowiedzi. Na Preview/produkcji automaty używają wyłącznie odpowiedników syntetycznych. | Wersja aplikacji, wersja prawa i OCR, rozmiar prób, wyniki z mianownikami i beztreściowe kody błędów. Powody każdego nierozstrzygniętego przypadku. |

Do diagnozy porównać cztery zapisy tej samej próby: **wzorzec → fakty odczytane → wynik reguł → to, co widzi rodzic**. Pierwsza różnica wskazuje zespół odpowiedzialny. Wysłanie do modelu większej liczby stron nie naprawi błędu rachunkowego.

## Próby, które łatwo przeoczyć

| Wejście lub zdarzenie | Oczekiwany efekt |
|---|---|
| PDF nazwany „przyznano”, dokumenty świadczą o czymś innym; syntetyczna notatka ze sprzeczną instrukcją dla asystenta | Nazwa, instrukcja i tekst z końcową decyzją nie sterują własną oceną. W trybie wyjaśnienia cudzej decyzji odpowiedź wprost przypisuje wynik ZUS i podaje źródło. |
| Brak aktualnego poświadczenia i brak kwoty pensji, ale jest historia zakończonego zatrudnienia | Każdy brak oceniać osobno dla właściwej daty. Pytanie lub prośba o dokument mają być konkretne. Brak rekordu nie oznacza braku ubezpieczenia, a brak pensji nie oznacza świadczenia 0 zł. |
| Dwie osoby o tym samym imieniu, dwie umowy u różnych płatników, okresy częściowo zachodzą i zmienia się etat | Przed przypisaniem spornych danych czat doprecyzowuje osobę lub tytuł. Jedna pensja nie trafia do dwóch podstaw. |
| Czytelna decyzja, nieczytelna cyfra w tabeli wynagrodzeń na końcu, przecinek lub przesunięta kolumna | Aplikacja może wyjaśnić decyzję. Przy własnym obliczeniu pokazuje pole i źródło do poprawy. Potwierdzenie właściwej cyfry zmienia wynik i ślad rachunku. |
| Pakiet HN-072, dokumenty w odwrotnej kolejności, zdjęcie do góry nogami, duplikat HN-018 i dwa załączniki partiami | Równoważne zestawy dowodów prowadzą do tego samego wyniku. Jest postęp, anulowanie, identyfikacja brakującej strony i bezpieczne ponowienie. |
| Data wniosku przed zmianą parametrów, późniejsza data wypłaty, zmiana wersji prawa w trakcie rozmowy | Wynik odnosi się do prawidłowej daty i pokazuje wersję reguł. Ponowne otwarcie zapisanego wyniku wyjaśnia, na czym był oparty. |
| Dwie karty zmieniają tę samą kwotę; spóźniony streaming poprzedniej odpowiedzi; F5; utrata lokalnego oryginału | Kolejność wersji i klucz operacji eliminują podwójne przeliczenie. Użytkownik widzi obecny wynik. Jeśli podgląd dowodu wymaga ponownego wskazania pliku, czat o tym mówi i wiąże go z właściwą sprawą. |
| Profil Kamila/Marty otwarty, juror wgrywa inną rodzinę; potem wylogowanie i nowy użytkownik na tym samym urządzeniu | Żadnych dat, dochodów, cytatów ani nazw dokumentów z poprzedniej sprawy w nowej. Oddzielnie sprawdzić historię, podgląd strony i eksport. |
| Ten sam komplet faktów przy niedostępności modelu, Qdrant, zewnętrznej strony lub bazy zapisu | Wynik deterministyczny jest spójny tam, gdzie stan i reguła są dostępne. Przy brakującym zapisie interfejs oznacza brak utrwalenia i pozwala ponowić. Brak podstawy źródłowej jest jawny. |

## Jak liczyć i kiedy pozwolić jury użyć wersji

**Proponowane progi zespołu, wymagające pomiaru.** W każdym raporcie obowiązuje para licznik/mianownik, zarówno ogółem, jak i dla rodziny, a także oddzielnie dla danych kompletnych, brakujących i spornych. Punkt końcowy mierzymy po faktycznej rozmowie.

| Miara | Mianownik | Próg docelowy dla deklaracji obsługi losowej sprawy |
|---|---|---|
| Przetworzenie i kompletność | 87 przesłań i 2008 stron unikatowych pakietów | 87/87 plików przyjętych albo rozpoznanych jako kopia, stan końcowy dla 2008/2008 stron. Widoczna awaria odczytu nie zalicza jakości treści. |
| Trafność decyzji i dat | Wszystkie gałęzie ze zweryfikowanym wzorcem decyzji i odpowiednio okresu | 100% zgodnych decyzji i dokładnych granic okresów w ogłaszanym zakresie. Dodatkowe wymyślone świadczenie lub pominięty wynik oblewa sprawę. |
| Kwota | Wszystkie kwoty o zgodnej jednostce, typie i okresie, sprawdzone niezależnie | Zgodność co do 1 grosza w sensie identycznych wartości groszowych. Raportuje się także liczbę spraw bez wzorca kwoty i z nierozwiązaną rozbieżnością. |
| Poprawność prośby o dane lub oceny eksperta | Wszystkie przypadki testowe ze znanym brakiem albo konfliktem | Właściwy status, wskazane konkretne pole, okres i osoba. Zero definitywnych rozstrzygnięć bez dowodu. |
| Pokrycie automatyczne | Wszystkie gałęzie wzorcowe, które ekspert uznał za automatycznie rozstrzygalne | Każde zbędne pytanie, unsupported i przerwanie liczyć oddzielnie. Do osiągnięcia pełnego zakresu każda taka gałąź kończy się właściwym wynikiem przy kompletnych danych. |
| Wskazanie dowodu i źródła reguły | Wszystkie ważne twierdzenia o prawie i danych osoby w próbie | Dowód przenosi do prawidłowej strony/pola lub oznaczonego wpisu profilu, a przepis do wersji obejmującej okres. Każda kwota ma rachunek. |
| Prywatność i powtarzalność | Próby dwóch sesji, ponowienia i niedostępności usług | Zero treści akt w logach, wektorach publicznych i zewnętrznych zapytaniach, zero pomieszanych osób, zero zmiany kwoty po identycznym ponowieniu. |

Opublikować osobno **liczbę w pełni zgodnych pakietów / 86**, liczbę częściowych, nieocenialnych i wymagających człowieka. Sprawa z dwoma dobrymi okresami i błędnym trzecim jest częściowa. Poprawna prośba o dokument może zaliczyć scenariusz braków, ale nie powiększa licznika automatycznie wyliczonych kwot. Zespół może wcześniej pokazać ograniczone demo z wykazem obsługiwanych rodzin.

**Wydajność.** Zmierzyć w Chrome na komputerze oraz Safari/Chrome na telefonie, na zimnym i rozgrzanym workerze. Zapisać czas do pierwszej informacji o postępie, czas do pierwszego użytecznego pytania i całkowity czas, szczyt pamięci, przerwania. Oddzielić 8, około 20, 52 i 74 strony. Początkowy cel UX to informacja o postępie w 2 s od wyboru oraz ukończenie największego pakietu na urządzeniu demonstracyjnym bez zamrożenia interfejsu. Przed pokazem zespół ustala budżet całej operacji na podstawie zmierzonego P95 i faktycznego czasu prezentacji. Niespełniony budżet oznacza odsłonięcie wyników etapami lub ręczne uzupełnienie; tester rejestruje to osobno.

## Automatyzacja i wydanie

- **Istnieje:** z katalogu app uruchomić npm run typecheck, npm test, npm run lint, npm run build. Dla prywatnego narzędzia uruchomić python3.12 tests/private-case-index.test.py. Z dotychczasowych prób zachować Martę, Kamila, chorobowe, rozmowę ogólną i wznowienie. [Skrypty npm](../../app/package.json) · [Testy prywatnego indeksu](../../app/tests/private-case-index.test.py) · [Poprzednie próby aplikacji](../../RAPORT-ZUSIK-G0-G8.md)
- **Do wdrożenia:** skrypt testera uruchamia zwykły czat na lokalnym adresie dla prywatnej próby, umożliwia podanie manifestu i ziarna, przyjmuje tylko lokalną ścieżkę, zapisuje prywatny raport poza repo i odmawia zdalnego hosta przy prawdziwych plikach. Syntetyczną część dodać do istniejących scenariuszy Playwright/API. Kod wyjścia różny od zera przy rozbieżności z progiem lub pominięciu wymaganej próby. Nazwy proponowanych poleceń i hostów nie mogą udawać gotowej automatyzacji.
- **Preview na osobnej gałęzi:** nowa funkcja pod przełącznikiem, zmiany schematu addytywne i kompatybilne z dotychczasową sesją. Sprawdzić desktop i telefon, upload z normalnej karty, tryb prywatny, korektę, drugi dokument, wynik i „Dlaczego?”. Potwierdzić sprawy przykładowe bez uruchomionego komputera autora. Bieżący CI publikuje produkcję przy pushu do main, a dopiero potem uruchamia część testów. Próbę rozszerzonego czatu wykonać przed przełączeniem ruchu. [Workflow](../../.github/workflows/vercel-deploy.yml)
- **Wycofanie:** zachować poprzedni build i powiązaną wersję reguł/źródeł. Wyłączyć wejście do nowego przebiegu, zachować możliwość odczytu wcześniej zapisanych wyników zgodnie z ich wersją i polityką retencji. Test cofnięcia obejmuje dawne rozmowy i nową sprawę w toku. Wykonać próbę na Preview.
- **Gotowość do pokazu:** jedna osoba spoza implementacji losuje pakiet, uruchamia nową rozmowę, wgrywa go, prosi o podstawę i koszt, zmienia istotny fakt i wskazuje numer strony uzasadniającej nową odpowiedź. Zespół przedstawia liczniki wraz z nierozstrzygniętymi przypadkami i ograniczeniami wydajności na rzeczywistym urządzeniu.
