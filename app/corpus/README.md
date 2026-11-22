# Wiedza Zusika

| Pakiet | Wersja | Fragmenty | Przeznaczenie |
| --- | --- | ---: | --- |
| `marta` | `marta-v1` | 23 | Urlop rodzicielski pracownika, wniosek do pracodawcy i wyjątki w załącznikach |
| `publiczne` | `rodzina-2026-11-v1` | 487 | Akty prawne z materiałów konkursowych, poradnik rodziców ZUS, instrukcje chorobowego i ZAM |
| `oferta` | `programy-2026-11-v4` | 387 | 800+, Dobry Start, trzy warianty Aktywnego Rodzica, rodzicielstwo, chorobowe, opieka i formularze |

[Inwentarz materiałów](materialy.json) rozlicza wszystkie 95 plików merytorycznych, organizacyjnych i akt. Oryginalne 87 plików akt spraw pozostaje poza wspólnym indeksem. Ich kopie zawierają 86 różnych dokumentów. Cztery wyciągi konkursowe mają odpowiedniki ze zbioru ELI. Sumy SHA-256 identyfikują pliki źródłowe, a strony PDF i jednostki redakcyjne prowadzą do konkretnych przepisów. Materiał szkoleniowy o stawkach i czasie świadczeń ma odsyłacze do źródeł ustawowych.

Pakiet publiczny obejmuje m.in. art. 6 ust. 1, art. 7, art. 11 ust. 2 pkt 1 i art. 13 ust. 1 ustawy zasiłkowej oraz § 33 rozporządzenia o dokumentach zasiłkowych. Manifesty podają datę weryfikacji i wersję każdej publikacji. Sprawy spoza zweryfikowanego okresu wymagają sprawdzenia przepisów właściwych dla daty sprawy. [Ustawa zasiłkowa](https://eli.gov.pl/eli/DU/2026/854/ogl) · [Rozporządzenie o dokumentach zasiłkowych](https://eli.gov.pl/eli/DU/2026/1316/ogl) · [Katalog świadczeń dla rodzin ZUS](https://www.zus.pl/swiadczenia/swiadczenia-dla-rodzin)

## Import

W katalogu aplikacji wykonaj poniższe polecenia po ustawieniu lokalnych `QDRANT_URL`, `QDRANT_WRITE_KEY`, `QDRANT_COLLECTION` i `QDRANT_READ_KEY`. Osobną kolekcję produkcyjną wybiera komplet `QDRANT_KNOWLEDGE_COLLECTION` i `QDRANT_KNOWLEDGE_READ_KEY`. Klucz zapisu jest potrzebny tylko operatorowi.

```sh
node --env-file=.env.local --import tsx scripts/zusik-import-marta.ts --corpus=marta
node --env-file=.env.local --import tsx scripts/zusik-import-marta.ts --corpus=publiczne
node --env-file=.env.local --import tsx scripts/zusik-import-marta.ts --corpus=oferta
```

Opcja `--collection=nazwa` wskazuje drugą fizyczną kolekcję przy migracji. Importer wysyła brakujące punkty w partiach po 16, po czym porównuje wszystkie identyfikatory i hashe z manifestem. Wznowienie polecenia po awarii uzupełnia brakującą partię. Zmiana treści istniejącego fragmentu wymaga nadania nowej wersji. Aplikacja filtruje wersję przy każdym wyszukiwaniu. Stara sonda wybiera wyłącznie dokumenty bez pola `corpusVersion`.

## Wydanie v4

Kolekcja stagingowa `zusik_test_family_20261122_v4` zawiera 897 punktów. Odczyt 22 listopada 2026 r. potwierdził deterministyczny UUID, ID fragmentu i SHA-256 każdego punktu. Po wymuszonym przerwaniu procesu zostało 16 z 387 punktów oferty. Wznowienie dopisało 371. Ponowny import wszystkich trzech pakietów dopisał 0 punktów. Odczyt operatora potwierdził sumy wersji i wymiary domyślnego wektora 384, metrykę Cosine oraz indeksy słów kluczowych dla `corpusVersion`, `logicalId` i `topic`. Identyfikator modelu w Qdrant Cloud Inference to `intfloat/multilingual-e5-small`. Usługa nie podała rewizji wag w odpowiedzi importera. Produkcyjny czytnik nadal jest ograniczony do poprzedniej kolekcji.

| Pakiet | Punkty | Początek digestu ID i hashy |
| --- | ---: | --- |
| Marta | 23 | `62ad9dea11189bcc` |
| Publiczne | 487 | `4a5492908873b2bb` |
| Oferta | 387 | `a4f16ab2053f7081` |

W aplikacji [karty programów](opportunities.json) odwołują się do ID dowodów przy warunkach, kanałach i konfliktach. [Macierz pokrycia](pokrycie.md) prowadzi do konkretnych sekcji urzędowych. [Rejestr aktualnych druków](forms.json) podaje daty i SHA-256 oryginałów ZAM i Z-15.

## Ewaluacja

### Pierwsza próba „Aktywnie w żłobku”

Pakiet zachowuje pełną treść artykułu ZUS w postaci migawki HTML. Manifest podaje hash całej pobranej strony. Rejestr zawiera osobny hash migawki, datę publikacji, datę sprawdzenia i podstawę prawną. Daty obowiązywania poszczególnych warunków wymagają osobnego sprawdzenia dla spraw historycznych. [Rejestr publikacji](official-sources.json) · [Zapis artykułu](oferta/snapshots/zus-aktywnie-w-zlobku.html)

| Aspekt | Fragment | Sekcja ZUS i zakres |
| --- | --- | --- |
| Forma opieki | `zlobek-opieka` | „Na kogo przysługuje świadczenie”, akapit 1, placówka lub opiekun w rejestrze |
| Wiek | `zlobek-wiek` | „Na kogo przysługuje świadczenie”, akapity 4 i 5, górna granica z wyjątkiem i warunek rozpoczęcia |
| Adresat przelewu | `zlobek-odbiorca` | „Komu wypłacamy świadczenie aktywnie w żłobku”, akapit 1, podmiot prowadzący placówkę albo dzienny opiekun |

W wydaniu v3 próba obejmowała wyłącznie trzy powyższe fragmenty. Wydanie v4 włącza m.in. warunek kosztu pobytu, okres, dokumenty oraz kolizje świadczeń. [Macierz źródeł](pokrycie.md). [Strona ZUS](https://www.zus.pl/aktywnyrodzic/wiadczenie-aktywnie-w-zlobku)

Do odtworzenia pierwotnej próby użyj źródeł w wersji Git `28ed4f6` i dwóch fizycznych kolekcji testowych. Druga pomija dokładnie jeden fragment. Ponowne wywołanie tych samych poleceń sprawdza ID i hashe oraz powinno wykazać zapis zera nowych punktów.

```sh
node --env-file=.env.local --import tsx scripts/zusik-import-marta.ts --corpus=oferta --collection=zusik_test_nursery_20261122_full
node --env-file=.env.local --import tsx scripts/zusik-import-marta.ts --corpus=oferta --collection=zusik_test_nursery_20261122_gap --omit-test-fragment=zlobek-odbiorca
```

### Pozostałe pakiety

```sh
node --env-file=.env.local --import tsx scripts/zusik-eval-marta.ts
node --env-file=.env.local --import tsx scripts/zusik-eval-public.ts
```

Pierwsze polecenie mierzy 20 rzeczywistych zapytań, 6 prób negatywnych i efekt usunięcia § 22 z kontekstu. Sprawdza surowy Hit@5, kompletność po dodaniu wyjątków, cytaty i zmianę odpowiedzi po usunięciu podstawy. Drugie sprawdza 10 pytań o podstawy i katalog oraz pytanie spoza zakresu. Sześć prób wymaga także rzeczywistej generacji i zweryfikowanego cytatu. Wiersz oznaczony jako `retrieval` mierzy wyłącznie wyszukiwanie. Oba skrypty zapisują raport i zwracają błąd procesu przy niespełnieniu kryteriów odbiorowych.

Treść pytania rodzica jest interpretowana lokalnie. Wyszukiwarka i model otrzymują ogólne sformułowanie zagadnienia. Model dostaje kandydatów z aktywnej wersji. Dla określonych zagadnień dodatkowa kontrola wymaga faktycznego trafienia w przepis albo w odsyłającą do niego instrukcję. W trybie cytatu użytkownik widzi oznaczony, dosłowny tekst znalezionego przepisu lub instrukcji. Szczegółowe ustalenie uprawnienia i sporządzenie dokumentu odbywa się w scenariuszu sprawy.


## Pytania o jeden dokument na laptopie

W katalogu `app` znajdź dokument przez `python3 scripts/private-case-index.py search "okres ubezpieczenia" --locations`. Skopiuj pełny `sha256` z wyniku. Następnie uruchom `python3 scripts/private-case-index.py ask --sha SHA256_DOKUMENTU` i wpisz pytanie. Numer strony i dosłowny cytat pochodzą z wybranego dokumentu. Wyszukiwanie FTS przeszukuje lokalny indeks w trybie odczytu. Do lokalnego Bielika pod `127.0.0.1:11434` trafia pytanie i maksymalnie po jednym fragmencie z trzech stron. Model powinien być zainstalowany w Ollamie jako `SpeakLeash/bielik-11b-v3.1-instruct:Q4_K_M`. Gdy usługa jest wyłączona, pole `matching_pages` pozwala samodzielnie otworzyć właściwe strony.
