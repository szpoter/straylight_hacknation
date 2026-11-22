# ZUSik · plan wdrożenia analizy sprawy wgranej do czatu

**Docelowa próba:** juror wchodzi do zwykłego czatu w nowej sesji i wybiera dowolny konkursowy PDF. ZUSik rozpoznaje, o co wnioskuje dana osoba, ustala jej ubezpieczenie na właściwy dzień, odpowiada osobno dla każdego świadczenia i okresu, a tam, gdzie ma wystarczające dane, pokazuje wyliczenie kwoty. Na pytanie „skąd to wiesz?” otwiera dowód i wyjaśnia regułę. Przy braku danych podaje dokładnie, co trzeba uzupełnić. Dołączenie brakującego zaświadczenia aktualizuje tę samą sprawę.

**Pierwsze zadanie zespołu:** na stanowisku z aktami znaleźć sprawę odmowną z udokumentowanym brakiem ubezpieczenia oraz sprawę przyznaną z pełnymi danymi płacowymi. Dwie osoby uzgadniają wzorzec z dokumentów, a następnie wykonawcy przeprowadzają obie sprawy od spinacza w czacie aż do decyzji i rachunku. Rozszerzanie o pozostałe rodziny zaczyna się po tym, jak oba wyniki da się odtworzyć bez użycia końcowej decyzji ZUS.

## Dokumenty wykonawcze

| Plik | Kto powinien zacząć od tego pliku | Rezultat |
|---|---|---|
| [01 · Zakres i wzorce z akt](01-zakres-i-wzorce.md) | Osoba produktowa + osoba znająca świadczenia | Granica wymagań ZUS, sposób anotacji, niezależne wyniki oczekiwane i dobór rodzin. |
| [02 · Dokumenty i OCR](02-dokumenty-i-ocr.md) | Frontend / odczyt dokumentów | Obsługa wielostronicowych skanów i tabel. Każdy istotny odczyt można sprawdzić na konkretnej stronie. |
| [03 · Profil i dane ZUS](03-profil-i-dane-zus.md) | Backend / właściciel danych | Słownik, pochodzenie oraz datowanie danych, symulacja konta ZUS, rozstrzyganie konfliktów i oddzielenie rodziny z PDF od konta jurora. |
| [04 · Reguły i kalkulator](04-reguly-i-kalkulator.md) | Właściciel reguł + recenzent merytoryczny | Rozstrzygnięcia według tytułu i okresu, podstawa z danych płacowych, kwota, termin, płatnik i ślad rachunku. |
| [05 · Czat i odpowiedź](05-czat-i-odpowiedz.md) | Frontend + backend rozmowy | Wgranie pliku, pytania uzupełniające, korekty, wyjaśnienia, wznowienie i izolacja kolejnych spraw. |
| [06 · Testy, pomiar i wydanie](06-testy-i-wydanie.md) | Niezależny tester + osoba wydająca demo | Próba na odłożonej części zbioru, regresja, dokładność w groszach, sprawdzenie telefonu i możliwość cofnięcia wydania. |
| [07 · Inwentarz 86 unikalnych pakietów](07-inwentarz-spraw.csv) | Opiekun zbioru | 86 anonimowych ID dla 87 PDF-ów. Długość, liczba kopii i robocze tematy ułatwiają wybór prób. |

## Co już mamy i co trzeba połączyć

Punktem odniesienia jest lokalny stan projektu z 22.11.2026, z bieżącymi pracami zespołu obok commita 4b51692. Plan dotyczy istniejącej aplikacji webowej i uzupełnia [wcześniejszy plan agenta](../../PLAN-TECHNICZNY-ZUSIK.md). Lista kontrolna zespołu pomaga znaleźć przypadki brzegowe. O wymaganiu konkursowym rozstrzyga [brief ZUS, rozdziały 3, 4 i 6](../../Materiały%20hackathonowe/ZUS%20-%20Pełna%20treść%20zadania%20konkursowego.pdf).

| Już działa lub istnieje w kodzie | Najbliższa luka dla jurora | Gdzie podłączyć zmianę |
|---|---|---|
| Dedykowane ścieżki Marty, Kamila i chorobowego, ogólna rozmowa, sesja, historia, praca z cytatami | Dowolny pakiet nie otwiera dziś w zwykłym czacie odrębnej, dowodowej sprawy z wieloma świadczeniami. | [Okno rozmowy](../../app/src/features/chat/case-chat-window.tsx) · [Serwis odpowiedzi](../../app/src/lib/zusik/ask-service.ts) |
| Lokalne PDF.js/Tesseract w aplikacji oraz osobny indeks PDFKit/Vision na Macu | Czytnik chorobowego przyjmuje do 6 stron, czytnik Kamila bierze do 3 stron aktu. Najkrótszy pakiet konkursowy ma 8 stron. Indeks Maca umożliwia przegląd zespołu, a jakość internetowego demo trzeba zmierzyć oddzielnie. | [Czytnik chorobowego](../../app/src/features/sickness/read-file.ts) · [Czytnik odpisu](../../app/src/features/kamil/read-document.ts) · [Indeks](../../app/scripts/private-case-index.py) |
| Profil demonstracyjny, kreator i przykładowe dane | Fakt o zalogowanej rodzinie może dotyczyć innej osoby lub innego dnia. Sprawa jurora potrzebuje własnych osób, tytułów, źródeł i historii. | [Profil Kamila](../../app/src/lib/kamil/profile.ts) · [Dane konta](../../app/src/features/family/profile/data.ts) |
| Reguły ojcowskiego, chorobowego, płatnika, zadłużenia i wersjonowanych stawek. Symulator urlopu umie porównać harmonogramy z podanych stawek. | Brakuje wspólnego przejścia od dokumentów kilku osób przez podstawę z wynagrodzeń do wyniku dla konkretnej rodziny i okresu. | [Reguły](../../app/src/lib/rules/) · [Kalkulator](../../app/src/features/calculator/Calculator.tsx) |
| Publiczny korpus przepisów, testy rozmów i wdrożeń | Trafny cytat o świadczeniu nie potwierdza poprawności decyzji ani kwoty konkretnej osoby. Do istniejących testów dochodzi niezależny pomiar z akt. | [Opis korpusu](../../app/corpus/README.md) · [Wyniki wcześniejszych prób](../../RAPORT-ZUSIK-G0-G8.md) |

## Kolejność prac i warunki przejścia

Numer pliku oznacza obszar odpowiedzialności. Kolejność wdrożenia poniżej pozwala pokazać pierwszy działający przypadek, zanim powstanie obsługa całego zbioru. W małym zespole jedna osoba może pełnić kilka ról. Oczekiwany wynik do oceny obliczeń powinna sprawdzić również osoba inna niż autor reguły.

| Etap | Co dokładnie dostarczyć | Zależność i próba zamykająca |
|---|---|---|
| **0. Punkt odniesienia** | Opiekun zbioru identyfikuje 87 plików, przygotowuje prywatny podział roboczy i odłożony, dwa pierwsze wzorce oraz ich syntetyczne odpowiedniki. Tester nagrywa stan dzisiejszej ścieżki na syntetykach. | Można odtworzyć dane wejściowe i oczekiwane wyjście dla przyznania i odmowy. Odłożone wyniki zna tylko tester. |
| **1. Kontrakt jednej sprawy** | Backend i UI uzgadniają CaseFile, EvidenceFact i DecisionResult, format dat, pieniędzy i identyfikatorów, komendy utworzenia, uzupełnienia, oceny i wznowienia. Wprowadzić próbne fakty ręcznie przez ten sam kontrakt, który później zasili OCR. | Dwa świadczenia i dwie osoby w jednej sesji dają niezależne gałęzie. Zmiana jednego faktu tworzy nową wersję. Istniejące rozmowy nadal się odtwarzają. |
| **2. Pierwsza odmowa od wejścia do odpowiedzi** | Równolegle przygotować prosty odczyt wniosku i poświadczenia, pusty profil importu oraz jedną regułę odmowy. Podłączyć spinacz w ogólnym czacie. Włączyć dowód z numerem strony i pytanie „dlaczego?”. | Ten sam syntetyczny przypadek jako skan działa w przeglądarce. Usunięcie jedynego dowodu odmowy daje pytanie lub ocenę eksperta. Zmiana nazwy pliku nie zmienia wyniku. Potem powtórzyć na prywatnym oryginale. |
| **3. Pierwsza kwota od płacy do wypłaty** | Obsłużyć tabelę płac jednego pracownika, jego tytuł i okresy, wybór podstawy, stawki, dni i zaokrąglenia. Podłączyć częściowe odpowiedzi i korektę w czacie. | Wynik co do grosza zgadza się z niezależnym wzorcem. Po zabraniu danych płacowych zostaje decyzja o prawie z prośbą o wskazany okres wynagrodzeń. Dołożenie drugiego PDF przywraca rachunek. |
| **4. Pełny pakiet i dane konta** | Dokończyć rozpoznanie dokumentów, dowody z tabel, łączenie plików, historię per osoba i tytuł, odczyt danych na właściwy dzień oraz ręczną korektę. Dołączyć scenariusze wielu płatników, e-ZLA, salda i dwóch rodziców. | Pełny 74-stronicowy pakiet przechodzi bez cichego pominięcia stron. Otwarty profil demo innej osoby nie zmienia wyniku. F5, powtórzenie i równoległa edycja zachowują historię. |
| **5. Poszerzanie rodzin** | Dostarczać rodzinami według pliku 04: najpierw podstawowe macierzyńskie/rodzicielskie i ojcowskie, następnie pozostałe tytuły, szczególne okresy, adopcję/pieczę, powrót do pracy i zbiegi. Dla każdej dodać przepisy z datą, kalkulację, odpowiedź i niezależny test od wejścia. | Dla każdej rodziny jest przypadek dodatni, graniczny, brak dokumentu oraz, gdzie ma to zastosowanie, odmowa i przeliczenie po zmianie. W matrycy widnieje też każdy nieobsługiwany wariant. |
| **6. Losowanie i wydanie** | Tester weryfikuje odłożony zbiór, potem wszystkie unikalne pakiety, telefon, dwie sesje i odzyskiwanie po przerwaniu. Osoba wydająca wykonuje próbę na Preview i powrót do poprzedniej wersji na syntetykach. | Raport pokazuje sprawy w pełni zgodne / 86, pokrycie kwot i okresów, uzasadnione braki i błędy. Cel pełnego pokrycia pozostaje otwarty, dopóki w zakresie są błędne kwoty lub nierozstrzygnięte przypadki z kompletnymi dowodami. |

**Co można robić równolegle:** po uzgodnieniu kontraktu programista OCR obsługuje strony, backend wdraża historię faktów i symulację profilu, właściciel reguł liczy na ręcznie potwierdzonych danych, a osoba od UI podłącza kartę wyniku do syntetycznej odpowiedzi. Tester równolegle oznacza pozostałe akta. Integracja po etapach 2 i 3 zawsze prowadzi przez rzeczywisty przycisk w czacie. Każda zmiana implementacji ma własny mały commit i test odbiorowy etapu.

## Przykład oczekiwanego zachowania

Próba jest syntetyczna. Kwoty służą weryfikacji rachunku, a właściwa stawka i liczba dni muszą wynikać z niezależnie ustalonego prawa.

1. Juror ma otwarty demonstracyjny profil innej rodziny. Wrzuca do czatu formularz i poświadczenie ubezpieczenia osoby A. ZUSik otwiera nową sprawę A i podaje, dla kogo i na jaki okres analizuje wniosek. Po sprawdzeniu pozostałych przesłanek potwierdza prawo i wskazuje potrzebę dołączenia danych płacowych od konkretnego płatnika.
2. Juror dołącza zaświadczenie. W tym przykładzie występuje 12 pełnych miesięcy po 6000,00 zł z potwierdzonym potrąceniem po 822,60 zł. Przy uzgodnionej stawce 100% i 14 należnych dniach rodzic widzi **5177,40 zł podstawy miesięcznej, 172,58 zł dziennie i 2416,12 zł brutto za okres**. Otwiera wiersz, z którego pochodzi wartość, oraz opis rachunku.
3. Juror zmienia jedno pole. Czat prosi o potwierdzenie konkretnej osoby i miesiąca, następnie pokazuje, co się zmieniło w podstawie i wypłacie. Poprzednia odpowiedź zachowuje wersję. Pytanie „a gdyby drugi rodzic wziął urlop później?” otwiera symulację bez zmiany dowodów rzeczywistej sprawy.
4. Na osobnej kopii juror usuwa zaświadczenie o ubezpieczeniu i dane symulowanego konta. Czat wskazuje brak dowodu rozstrzygającego za dany dzień. Nie wypełnia luki danymi zalogowanego jurora. W drugiej próbie pełny, potwierdzony brak odpowiedniego tytułu i wyjątków pozwala wyjaśnić odmowę.

## Decyzje projektowe i kwestie otwarte

- **Granica danych.** Plik, obraz strony, pełny tekst OCR, nazwiska i dokument rozstrzygający pozostają na urządzeniu. Do własnego serwera wysyłamy tylko zatwierdzone, potrzebne do obliczeń fakty, identyfikatory ról i lokalizatory. Informacje te wciąż wymagają ograniczenia do właściciela i czasu życia sprawy. Pomiędzy aktywną sprawą a publicznym modelem/RAG przechodzi wyłącznie ogólne zagadnienie. Do oficjalnych źródeł prowadzą linki z wersją przepisu. Szczegóły przechowywania, usuwania i wznowienia podaje plik 05.
- **Zakres użytkownika.** Logowanie, ubezpieczenie, saldo, e-ZLA i konto eZUS są symulacjami zgodnie z briefem. Dane pracodawcy, umowy, płacy, dziecka i drugiego rodzica mają własne źródła. Juror może pracować z jednym wnioskiem lub pełnym pakietem. Wątpliwość co do formatu prezentacji nie blokuje implementacji obu wejść.
- **Prawo i wyjaśnienia.** Wersjonowana reguła rozstrzyga i liczy. Model może pomóc zrozumieć pytanie i objaśnić wynik. Wymuszenie kwoty przy brakujących zarobkach albo ustawienie „ubezpieczony” na podstawie samego logowania dałoby fałszywie pewną odpowiedź. Konkretne luki prawne i odpowiedzialność za ich zamknięcie opisuje plik 04.
- **Ryzyko wykonawcze.** Najwcześniej zmierzyć odczyt polskich tabel z wielu skanów na sprzęcie pokazu i dostępność historycznych danych płacowych. Jeżeli część materiałów potwierdza jedynie prawo, ewaluator może nadal ocenić decyzję. Do obliczeń potrzebuje dodatkowego wzorca. Publiczny wynik zespołu powinien pokazać obie liczby.
