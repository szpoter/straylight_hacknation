# Od PDF-u do faktów, które rodzic może sprawdzić

Rodzic wybiera formularz albo pełny pakiet skanów bezpośrednio w oknie rozmowy. Widzi czego dotyczy sprawa, z jakiego miejsca pochodzi dana oraz co wymaga poprawienia. Wyjściem tego etapu jest zestaw zweryfikowanych faktów do oceny prawa i kwoty, wraz z listą stron nieodczytanych lub celowo pominiętych. Wgranie dokumentu do czatu oznacza wybranie go w aplikacji. Proponowany odczyt wykonuje się w przeglądarce.

## Od czego zaczynamy

| Miejsce w obecnym repozytorium | Co wykorzystać | Gdzie kończy się istniejąca obsługa |
|---|---|---|
| [Odczyt dokumentu Kamila](../../app/src/features/kamil/read-document.ts), [współrzędne słów](../../app/src/lib/ocr/words.ts) | PDF.js, polski Tesseract, słowa z pozycjami na stronie | Ścieżka aktu urodzenia skanuje do 3 stron, tworzy kopię podglądu każdej z nich i uruchamia worker OCR na pojedynczy obraz. |
| [Czytnik chorobowego](../../app/src/features/sickness/read-file.ts), [sprawdzanie stron](../../app/src/features/sickness/sickness-import.tsx), [parser](../../app/src/lib/sickness/read.ts) | Odczyt warstwy tekstowej, OCR przy jej braku, podgląd i ręczna korekta | Limit 6 stron działa też w schemacie usługi. Parser rozpoznaje tekst o zdefiniowanej strukturze demonstracyjnej. Import zapisuje tylko wybrane, potwierdzone strony w reprezentacji tej ścieżki. |
| [Serwis chorobowy](../../app/src/lib/sickness/service.ts), [endpoint](../../app/src/app/api/zusik/sickness/route.ts) | Wersjonowanie, walidacja żądania, powrót do sprawy | Ma własne kategorie dokumentów, ograniczenie wielkości żądania i numerów stron. Nowy kontrakt pakietu musi obsłużyć źródła ze stron 7–74. |
| [Lokalny indeks akt](../../app/scripts/private-case-index.py) | Na komputerze testera PDFKit i Vision wydobywają tekst i numer strony. SQLite pomaga odnaleźć materiał do ręcznego opisu i porównać błędy OCR. | Kod wymaga macOS i operuje na prywatnym katalogu. Wdrożenie na Vercelu nie może zależeć od obecności tego komputera, bazy SQLite ani Ollamy. |
| [Zasoby OCR](../../app/scripts/copy-ocr-assets.mjs), [opis wdrożenia](../../app/ARCHITECTURE.md) | Istnieją worker PDF, worker OCR i polski model dostarczane przez aplikację | Próba odbiorowa musi objąć zimne otwarcie i pobranie zasobów z rzeczywistego demo. |

W zwykłej rozmowie działa [lokalny czytnik całego PDF](../../app/src/features/chat/read-case-pdf.ts) i [wyszukiwanie fragmentów](../../app/src/features/chat/find-case-passages.ts). Obecne granice to 128 stron i 20 MiB. Czytnik próbuje uzyskać tekst, a na stronach z ubogą warstwą tekstową uruchamia OCR. Przy dalszej pracy zachować ten punkt wejścia oraz testy specjalistycznych formatów. Następny krok to strukturalne dane z dokumentu z oznaczeniem pochodzenia i roli każdej strony. Zmiana samego limitu w jednym miejscu nadal zostawiłaby parser demonstracyjny, limit w API i ryzyko utraty dalszych stron.

## Kolejność wdrożenia

### 1. Spis plików i stron

- Przy wyborze pliku utworzyć identyfikator dokumentu w obrębie `CaseFile`. Na urządzeniu wyliczyć skrót pliku do wykrycia identycznych bajtów. Pliki o różnej treści i identycznej nazwie dostają osobne identyfikatory. Powtórzony plik nie dubluje przychodu, urlopu ani historii świadczeń.
- Sprawdzić nagłówek pliku, typ, odczytywalność, szyfrowanie, liczbę stron i budżet pamięci przed renderowaniem. Przy pliku chronionym poprosić o odblokowany egzemplarz. Przy uszkodzonym pozwolić ponowić wybór bez utraty poprzednich ustaleń. Zmierzyć wielkości i rozdzielczości dostępnych akt przed ustawieniem granic. Wszystkie PDF-y z korpusu powinny mieścić się w zwykłej ścieżce.
- Zacząć od PDF, następnie umożliwić dołączanie pojedynczych skanów PNG/JPEG jako kolejnych dokumentów tej samej sprawy. Zostawić dotychczasowe typy plików w starych scenariuszach. Przy pierwszym PDF-ie założyć niezależną sprawę. Przy kolejnym pozwolić wskazać „dołącz do tej sprawy” albo „rozpocznij nową”.
- Rejestr każdej strony ma numer od 1, identyfikator dokumentu i stan: oczekuje, odczytana, potrzebny odczyt ręczny, pusta, wyłączona z podanym powodem. Wynik musi rozliczać wszystkie strony, także po przerwaniu procesu. Interfejs pokazuje np. „Odczytano 19 z 47 stron”.

### 2. Tekst i OCR z kontrolą kosztu

1. Odczytać elementy tekstu wraz ze współrzędnymi i rotacją. Ocenić przydatność tekstu dla obszaru formularza. Skan z cyfrowym numerem strony, nagłówkiem lub pieczątką może mieć warstwę tekstową i nadal wymagać OCR w tabeli.
2. Jeśli tekst nie pozwala odczytać treści, renderować wyłącznie bieżącą stronę lub potrzebny fragment. Użyć polskiego modelu już w aplikacji. Worker żyje przez zadanie, przetwarza strony kolejno, zwalnia bitmapę po stronie i kończy się przy anulowaniu. Przez cały czas da się przewijać rozmowę i zatrzymać odczyt.
3. Dla tabelek zachować położenie słów, linię i kolumnę. Przy liczbach rozpoznawać przecinki dziesiętne, separatory tysięcy i znak kwoty. Przy polach wyboru odróżnić zaznaczenie od pustego pola. Pusty wiersz nie daje zera. Zabezpieczyć daty przed transpozycją dnia i miesiąca. Dla obrotu 90°/180°, dwóch kolumn lub słabego kontrastu uruchomić ograniczoną drugą próbę i potem zaoferować korektę.
4. Zapisywać lokalnie postęp w zakresie sesji, sprawy i skrótu pliku. Odświeżenie pozwala ponownie wskazać ten sam PDF i dokończyć brakujące strony. Przy braku IndexedDB zaoferować pracę bez zapisu lokalnego i wyjaśnić konieczność ponownego wskazania pliku po odświeżeniu.
5. Rozdzielić przejście po wszystkich stronach od dokładnego odczytu tabel. Można pokazać pierwsze potwierdzone pola wcześniej. Dopóki pozostałe strony mogą zawierać aneks, korektę albo warunek odmowy, komunikat jest wstępny. Jeśli odczyt strony się nie powiedzie, użytkownik widzi numer i może oznaczyć ją jako nieistotną dopiero po sprawdzeniu podglądu.

### 3. Rozpoznanie dokumentów i roli strony

Grupować strony w dokumenty według nagłówków, identyfikatorów formularzy, oznaczeń kontynuacji, powtarzających się kolumn i dat. Zachować oryginalną kolejność i numerację. Brak nagłówka na stronie 2 nie oznacza nowego dokumentu. Użytkownik może rozdzielić lub scalić grupę, wskazać osobę i płatnika. Pewność typu dokumentu i pewność odczytu wartości to dwa osobne wskazania.

| Rodzina dokumentu | Co odczytać w pierwszej kolejności | Szczególny przypadek |
|---|---|---|
| Wniosek o świadczenie lub urlop, w tym ZAM i historyczne wzory | Rodzaj żądania, osoba i rola, daty wnioskowane, data złożenia, wariant, wskazane części urlopu | Okres, o który ktoś wnioskuje, nie przesądza o okresie przyznanym. Jedna teczka może zawierać kilka wniosków. |
| Potwierdzenie ubezpieczenia i zaświadczenie płatnika, np. Z-3, Z-3a oraz wcześniejsze wzory | Tytuł, płatnik, okres podlegania, ewentualne przerwy, warunki zatrudnienia, wiersze wynagrodzeń i składki | Rozróżnić miesiąc należny i miesiąc wypłaty. Nagłówki przeniesione z wcześniejszej strony muszą pozostać przypisane właściwym kolumnom. |
| e-ZLA i dokumentacja zdarzenia | Początek i koniec niezdolności, kod, data zdarzenia, odpowiednie potwierdzenie | Brak kodu, załącznika albo czytelnej daty daje pytanie. Nie uzupełniać pola z nazwy pliku. |
| Akt, zaświadczenie szpitalne, dokument adopcji lub pieczy | Zdarzenie i data, dziecko, daty hospitalizacji, stosunek do wnioskodawcy, inne przesłanki wyłącznie dla danej reguły | Przy wieloraczkach każda oś zdarzeń ma własną osobę. Przy pobytach szpitalnych zachować rozłączne przedziały. |
| Historia wcześniejszych wypłat, urlopów, zmian zatrudnienia i zadłużenia | Okresy wcześniejszego wykorzystania, korekty, płatnik, saldo i data, której dotyczy | Rozgraniczyć wcześniejszą prawomocną historię od rozstrzygnięcia właśnie ocenianej sprawy. |
| Decyzja końcowa, podsumowanie ustalonej kwoty, zrzut z rozstrzygnięciem | Lokalna etykieta do porównania po samodzielnym obliczeniu. Rozdzielić wiersze historii od bieżącego wyniku także na mieszanej stronie. | Końcowe „przyznano/odmówiono”, kwoty i daty wyniku, streszczenie oraz sugestie z nazwy pliku wyłączyć z wejścia reguł. Niejasna rola wymaga weryfikacji. |
| Inny dokument lub strona nieczytelna | Numer, propozycja typu, możliwość zaznaczenia fragmentu i ręcznego wpisania | Nieznany typ pozostaje widoczny, a jego wpływ na kompletność jest jawny. |

### 4. Kandydat → potwierdzony fakt

Każdy kandydat `EvidenceFact` odnosi się do typu pola ze słownika profilu, osoby/roli, płatnika lub dziecka, wartości i jednostki, dnia lub okresu obowiązywania, źródła i wersji odczytu. Lokalny odsyłacz zawiera dokument, stronę od 1 i prostokąt lub zakres wierszy. Przykład syntetyczny: wiersz z miesiącem, składnikiem, kwotą w groszach i liczbą dni wynagrodzenia ma cztery odsyłacze do tej samej linii. Dzięki temu użytkownik może poprawić jedną błędną cyfrę bez ponownego przepisywania formularza.

- Układać potwierdzenie według wpływu na wynik. Najpierw osoba, świadczenie, okres i ubezpieczenie, następnie składniki podstawy. Dane czytelne można zatwierdzić zbiorczo po przejrzeniu źródeł. Dla sprzeczności, niepewnej daty granicznej, zaznaczenia i dwuznacznego odczytu kwoty pokazać oba odczyty lub wycinek oraz żądać rozstrzygnięcia.
- Ścieżka korekty zachowuje poprzednią wartość, przyczynę i źródło zmiany. Wpis z klawiatury otrzymuje pochodzenie „deklaracja” albo „ręcznie potwierdzone z tej strony”. Odmienny dowód i późniejszy dokument korygujący są osobnymi faktami. Klasyfikację rozstrzyga mechanizm uzgadniania danych w etapie profilu.
- Serwer własnej aplikacji przyjmuje dokładnie dozwolone typowane pola i odwołania do dowodów potrzebne dla reguł. Treść OCR, obrazy, nazwy plików, identyfikatory urzędowe i cytaty z akt pozostają na urządzeniu. Własne dane profilu i założenia symulacji mają inne oznaczenia. Rejestr publicznych źródeł prawnych, wyszukiwanie internetowe i model do objaśnień dostają wyłącznie publiczny temat.
- Zapisywać porcje kandydatów pod identyfikatorem importu. Publikacja potwierdzonego zestawu jest atomowa i zależna od wersji sprawy. Retry nie dopisuje tych samych miesięcy ponownie. Konflikt wersji pokazuje aktualną zmianę i zachowuje lokalne poprawki. Anulowanie usuwa niezatwierdzoną partię i przywraca poprzedni stan sprawy. Usunięcie dokumentu unieważnia fakty wyłącznie z tego źródła oraz zależne wyniki.

## Próba odbiorowa odczytu

| Próba | Warunek zaliczenia |
|---|---|
| Formularz tekstowy, skan, plik mieszany, obrócona tabela, nieczytelne pole | Odczyt identyfikuje źródło każdego pola. Słaba jakość powoduje korektę. Błędna kwota nie przechodzi do pewnego wyniku bez sygnału. |
| Pełny korpus oraz syntetyczny dokument z korektą na stronie 74 | Liczba zarejestrowanych stron zgadza się z PDF. Końcowa korekta wpływa na wynik po potwierdzeniu. Każda pominięta strona ma widoczne uzasadnienie. |
| Dwa jednakowe PDF-y oraz zmieniony plik o tej samej nazwie | Pierwsze dwa traktowane jako jedno źródło. Trzeci przedstawia różnice i nie podmienia potajemnie danych. |
| Zmieniona nazwa pliku, odłączona ostatnia decyzja, podmieniona wyłącznie kwota w decyzji | Niezależny wynik z tych samych danych wejściowych pozostaje ten sam. Zniknięcie strony z rzeczywistym składnikiem podstawy daje właściwy brak. |
| Wyczerpana pamięć, brak miejsca, uśpienie telefonu, anulowanie, refresh podczas OCR | Rodzic widzi ostatnią zapisaną stronę, może wznowić lub wybrać plik ponownie. Po jednym zatwierdzeniu powstaje jedna wersja. |
| Sesja A i B, usunięcie sprawy, rejestr ruchu sieciowego i serwerowego | Podgląd obcej strony jest niedostępny. Dane i miniatury znikają po usunięciu lub wygaśnięciu. W żądaniach do modelu, analityce i logach nie ma zawartości akt. |

Mierzyć osobno liczbę poprawnie sklasyfikowanych stron, dokładność wartości krytycznych względem ręcznego oznaczenia, udział pól wymagających ręcznej korekty oraz czas do pierwszych pól i końca pełnego pakietu. Podać wyniki dla krótkiego, medianowego i najdłuższego pliku na telefonie i komputerze, z zimnym i rozgrzanym OCR. Każdy błąd danych krytycznych zaakceptowany po cichu cofa daną rodzinę do weryfikacji. Prywatne oznaczenia akt i raporty per plik zostają u testera, w repo jedynie syntetyczne regresje i agregaty.
