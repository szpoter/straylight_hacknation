# Wiedza Zusika

| Pakiet | Wersja | Fragmenty | Przeznaczenie |
| --- | --- | ---: | --- |
| `marta` | `marta-v1` | 23 | Urlop rodzicielski pracownika, wniosek do pracodawcy i wyjątki w załącznikach |
| `publiczne` | `rodzina-2026-11-v1` | 487 | Akty prawne z materiałów konkursowych, poradnik rodziców ZUS, instrukcje chorobowego i ZAM |
| `oferta` | `programy-2026-11-v2` | 5 | Informacje o 800+, Dobrym Starcie i Aktywnym Rodzicu |

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

## Ewaluacja

```sh
node --env-file=.env.local --import tsx scripts/zusik-eval-marta.ts
node --env-file=.env.local --import tsx scripts/zusik-eval-public.ts
```

Pierwsze polecenie mierzy 20 rzeczywistych zapytań, 6 prób negatywnych i efekt usunięcia § 22 z kontekstu. Sprawdza surowy Hit@5, kompletność po dodaniu wyjątków, cytaty i zmianę odpowiedzi po usunięciu podstawy. Drugie sprawdza 10 pytań o podstawy i katalog oraz pytanie spoza zakresu. Sześć prób wymaga także rzeczywistej generacji i zweryfikowanego cytatu. Wiersz oznaczony jako `retrieval` mierzy wyłącznie wyszukiwanie. Oba skrypty zapisują raport i zwracają błąd procesu przy niespełnieniu kryteriów odbiorowych.

Treść pytania rodzica jest interpretowana lokalnie. Wyszukiwarka i model otrzymują ogólne sformułowanie zagadnienia. Model dostaje kandydatów z aktywnej wersji. Dla określonych zagadnień dodatkowa kontrola wymaga faktycznego trafienia w przepis albo w odsyłającą do niego instrukcję. W trybie cytatu użytkownik widzi oznaczony, dosłowny tekst znalezionego przepisu lub instrukcji. Szczegółowe ustalenie uprawnienia i sporządzenie dokumentu odbywa się w scenariuszu sprawy.


## Pytania o jeden dokument na laptopie

W katalogu `app` znajdź dokument przez `python3 scripts/private-case-index.py search "okres ubezpieczenia" --locations`. Skopiuj pełny `sha256` z wyniku. Następnie uruchom `python3 scripts/private-case-index.py ask --sha SHA256_DOKUMENTU` i wpisz pytanie. Numer strony i dosłowny cytat pochodzą z wybranego dokumentu. Wyszukiwanie FTS przeszukuje lokalny indeks w trybie odczytu. Do lokalnego Bielika pod `127.0.0.1:11434` trafia pytanie i maksymalnie po jednym fragmencie z trzech stron. Model powinien być zainstalowany w Ollamie jako `SpeakLeash/bielik-11b-v3.1-instruct:Q4_K_M`. Gdy usługa jest wyłączona, pole `matching_pages` pozwala samodzielnie otworzyć właściwe strony.
