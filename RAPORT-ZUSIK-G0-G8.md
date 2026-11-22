# Próby wdrożenia Zusika

## G0 · stan początkowy z 22 listopada 2026

Lokalny commit na początku pracy to `93e7cb88957759120e28aff9f683ab269fcf8872`. Zdalny `main` odczytany z GitHuba wskazywał `c2c6b2cfc359eacb6d2f8a221476b3033fd5fc62`, przodka lokalnego commita. Dwa lokalne commity dodawały plan oraz niezależny pomiar API w CI. Zespół edytował również `zusik-acceptance.ts`, `ZusikFab.tsx` i `PlanProvider.tsx`.

Node 24.14.1, Next 16.4.6, React 19.3.0, LangGraph 1.7.5, pg 8.23.1, Zod 4.6.7. Testy bazowe przeszły 333/333. Skonfigurowana lokalnie kolekcja wiedzy to `zusik_marta_v1`.

| Pakiet | Wersja początkowa | Fragmenty | SHA-256 pliku manifestu |
|---|---|---:|---|
| marta | marta-v1 | 23 | 8ac4a1d42a2e9b999b9875d837cd6b57cba10e40a35f2d1ba8353afdded7e4da |
| publiczne | rodzina-2026-11-v1 | 487 | 81041ab75af6e888c7d3e52ee22f015ebc0c86d44b690f542896ab8fd4585d61 |
| oferta | programy-2026-11-v2 | 5 | 9c5cbde14144a989b7a9ffbea7b7a16a66f0f599b4022ddec588e3c13cc4e0d2 |

| Reprodukcja | Pierwsza błędna decyzja lub brak | Właściciel | Próba odbioru | Poprawka do sprawdzenia |
|---|---|---|---|---|
| „Mój syn od stycznia będzie w żłobku” | `publicQuestion` zamienia opis planowanej opieki w pytanie o konkretny okres i kończy wyszukiwanie | Graf | Pierwsza odpowiedź zawiera źródło dotyczące opieki instytucjonalnej | Oddzielić odkrywanie możliwości od oceny historycznego prawa |
| „na czyje konto?” po tej turze | `resolveFollowUp` zwraca null. W pakiecie oferta v2 brak ustępu o odbiorcy | Graf i wiedza | Odczyt historii z serwera, pytanie bez nazwy programu, cytat o adresacie przelewu | Odzyskać podmiot z poprzedniego dowodu i wyszukać nowy aspekt |
| Brak fragmentu o odbiorcy w bazie | `answerQuestion` przy pustych dowodach kończy turę bez odczytu strony urzędowej | Wyszukiwanie | Inna kolekcja, ten sam dialog, rzeczywisty GET i cytat z sekcji ZUS | Kontrolowany odczyt z zatwierdzonej strony |
| Zmiana Wsparcie → Profil podczas otwartego czatu | Zespół lokalnie dodał `followsPage`. Dotychczasowy test czeka na zakończenie nawigacji przed kliknięciem | UI | Opóźniona nawigacja i kontrola tytułu otwartego panelu | Zweryfikować lokalną poprawkę osobnym testem |

Ścieżka informacji biegnie z `POST /api/zusik/ask` do `AskService`. Lokalna projekcja i resolver historii wybierają publiczną treść zapytania. Wyszukiwanie w Qdrant wykonuje `rag/retrieve.ts`, a `zusik/qdrant.ts` obsługuje osobną sondę. Serwer porównuje hash trafienia z lokalnym manifestem, dobiera załączone wyjątki, waliduje cytaty, zapisuje odpowiedź JSON w `ask_turns` i zwraca wynik strumieniem. Odczyt stanu po odświeżeniu korzysta z tej samej tabeli. `graph.ts` steruje sondą z wyborem opcji, a sprawa Marty ma osobny checkpoint. Kamil i chorobowe mają osobne serwisy. Panel administracyjny ma widoki treści, reguł, zmian, historii i spraw testowych.

## Pierwszy działający przebieg

Dwa osobne logowania demo otworzyły rozmowę rodzica. Wersja oferty to `programy-2026-11-v3`. W obu próbach odświeżenie otworzyło historię z serwera. Pytanie uzupełniające nie zawierało nazwy programu.

> **Rodzic** — Syn od stycznia będzie chodził do żłobka. Z czego możemy skorzystać?
>
> **Zusik** — Warto sprawdzić świadczenie „Aktywnie w żłobku”. Czy wybrana placówka jest wpisana do rejestru żłobków?
>
> **Rodzic po F5** — na czyje konto?
>
> **Fragment odpowiedzi ZUS** — „Świadczenie to przekazujemy na rachunek bankowy podmiotu, który prowadzi żłobek”.

Pełna odpowiedź rozróżnia też klub dziecięcy i dziennego opiekuna. Kolejne F5 odtworzyło cytat z tej samej wersji. [ZUS, sekcja „Komu wypłacamy świadczenie aktywnie w żłobku”](https://www.zus.pl/aktywnyrodzic/wiadczenie-aktywnie-w-zlobku)

| Próba przez zwykłe API | Fragmenty oferty | Fragment o odbiorcy w top 5 | Odczyty WWW w drugiej turze | Czas drugiej tury |
|---|---:|---|---:|---:|
| [Pełna baza](app/tests/fixtures/zusik-acceptance/results/nursery-corpus.jsonl) | 8 | pozycja 1, `zlobek-odbiorca` | 0 | 212 ms |
| [Baza z luką](app/tests/fixtures/zusik-acceptance/results/nursery-official-live.jsonl) | 7 | brak | 1 GET do ZUS | 537 ms |

Druga próba pobrała akapit z oficjalnej strony 22 listopada 2026 o 01:02:56 UTC. SHA-256 treści wynosi `5d7c209924dbe5e4c5f567d3764287385edb31473c816065e2dbdab05134d387`. Powtórzenie w przeglądarce mogło już użyć cache. Pomiar kosztu dostawcy jest niedostępny. Oba testy używały kompilacji produkcyjnej uruchomionej lokalnie, z rzeczywistymi Neon i Qdrant Cloud.

## Integracja i próby przed wydaniem

W trakcie prac zespół zaktualizował panel administracyjny. Commit scalający `b436d23` zawiera zdalny `d4d5e848b1fdd8055b4f057c5c69ea0bfa00c822`. Lokalne poprawki trzech plików wymienionych w G0 brały udział w testach.

| Obszar | Co sprawdzono |
|---|---|
| G0 | Publiczny stan bazowy zaliczył 11/11 dotychczasowych scenariuszy Chrome i 8/8 tur API. Celowo opóźniona zmiana Wsparcie → Profil ujawniła osobny błąd bazowy. Na punkcie odniesienia Marta przeszła 20/20 pytań i 6/6 prób negatywnych, zbiór publiczny 11/11. [Zapis bazowy](app/tests/fixtures/zusik-acceptance/results/g0-evidence.jsonl) |
| G2 | Graf steruje wyszukaniem wątku żłobka i odczytem ZUS przy luce. Zapis zakończonej tury poprzedza pokazanie zweryfikowanej odpowiedzi. Osobny zapis korekt wieku dziecka zablokował automatyczny filtr. Ta część pamięci pozostaje niepotwierdzona. |
| G3–G4 | Wyszukiwanie sprawdza identyfikatory i hashe z bazy oraz łączy ranking słów i wektorów. W powtórce o areszcie art. 12 znalazł się na pierwszym miejscu i zachował wyjątek dotyczący odpłatnej pracy. Odczyt WWW pobrał również stronę Dobrego Startu przez link w urzędowym katalogu. |
| G5 | Polecenie operatora `node --env-file=.env.local --import tsx scripts/zusik-review-sources.ts` uruchomione z katalogu app sprawdza katalog i zapisuje zmiany do przeglądu w panelu Treści. Dwa przebiegi z pięcioma linkami nie utworzyły duplikatów. Codzienny harmonogram wymaga konfiguracji operatora. |
| G6 | Chrome 390×844 i 1440×900. Wszystkie 6/6 wejść w trzy sprawy przetrwało F5, a 2/2 wolne rozmowy użyły API. Sprawdzono scenariusze Marty i Kamila wraz z PDF. Odczyt chorobowego sprawdzono również z konfiguracją konta udostępniającą jego źródła. |
| G7 | Niezależny zestaw obejmuje 68 przypadków. SHA-256 wejść `51ca95e212e91b7541369e327e70d467ed14ab6e02e590f2cadc9387e6b63781`. Polecenie z app to `node --import tsx scripts/zusik-eval-g7.ts <adres-aplikacji> g7`. Zwraca niezerowy kod przy niespełnieniu progu. |

## Wydanie i wycofanie

Publiczny alias to [straylight-hacknation.vercel.app](https://straylight-hacknation.vercel.app). Publiczne próby G0 dotyczą zastanego wydania. Nowe wersje materiałów mają osobne kolekcje fizyczne. Do przywrócenia poprzedniej wersji operator wybiera jej wdrożenie oraz odpowiadające mu kolekcję i klucz odczytu. Następnie w świeżej sesji sprawdza odpowiedź, historię po F5 i szkic PDF. Wcześniejsze cytaty mają w zapisanej turze własną treść i wersję.

Obecne klucze aplikacji zwracają 403 dla nowych kolekcji stagingowych. Lokalny czytnik z ograniczeniem do zapytań i odczytu wskazanych punktów umożliwił sprawdzenie rzeczywistych danych. Zdalne Preview potrzebuje uprawnienia odczytu do przypisanej mu wersji. Zastosowanie klucza administracyjnego w aplikacji ujawniłoby zbyt szerokie uprawnienia.

## Szerszy katalog, niezależna próba źródła i modele

Rozszerzenie po obu próbach żłobkowych dało kolekcję `zusik_test_family_20261122_v4`. Operator potwierdził 897/897 UUID i hashy. Na wynik składa się 387 fragmentów z 26 dokumentów oferty, 487 fragmentów publicznych i 23 Marty. Po przerwaniu importu oferty przy 16/387 wznowienie dopisało 371 fragmentów, kolejne uruchomienie dopisało 0. Dziesięć aktywnych kart zawiera źródła, warunki i braki. RKO ma status archiwalny. Macierz pokrywa 94 ze 112 pól, 12 oznaczono jako niedotyczące i 6 jako luki. Luki obejmują łączenie świadczeń oraz część wyłączeń rodzicielskich. [Macierz i lokalizatory](app/corpus/pokrycie.md)

W niezależnej próbie na zamrożonym `da524af0cbe7b2792d7234a8446a7ceaa02f1832` operator dodał jeden nowy materiał ZUS o świadczeniu wspierającym i kolejności uzyskania decyzji WZON. Źródło zajęło pierwsze miejsce w 3/4 rozmów, pełną poprawną odpowiedź uzyskano w 2/4. Na pytanie „Mam już decyzję WZON. Kiedy wysłać wniosek o świadczenie wspierające?” aplikacja przeszła na temat urlopu. W kolejnym przypadku przytoczyła odpowiedni dokument, ale pominęła skutek złożenia wniosku przed uzyskaniem ostatecznej decyzji. Wycofanie usunęło dokument z 4/4 rankingów. Po celowym odłączeniu ZUS trzy próby zakończyły się HTTP 503, a czwarta powtórzyła błąd wyboru tematu. **G3 pozostaje czerwone.** [Surowe próby i niezależna ocena](app/tests/fixtures/zusik-acceptance/results/g3-extension.json)

Na tym samym Macu po zmianie instrukcji PLLuM zwrócił właściwy plan w 6/6 i ocenę dowodu w 6/6 powtórzeń. Każda rola miała po jednym trudnym przypadku powtórzonym na zimno i na ciepło. P95 planu wyniósł 5288/1942 ms, oceny 3423/664 ms (zimny/ciepły). W teście generowania Bielik zachował wyjątek i obie podstawy 6/6, lecz tylko 3/6 odpowiedzi zmieściło się w budżecie 38 s. Przy wyłączonym workerze rzeczywisty dostawca zapasowy zakończył sprawdzaną turę z cytatem po 9759 ms. Dodatkowe role są opcjonalne, a awaria lub przekroczenie budżetu pozostawia wybór po stronie aplikacji. Host roboczy nie zapewnia stałej dostępności. [Konfiguracja i pomiary](app/MODELE-NA-VERCELU.md)

Na lokalnym stagingu v4 pierwszy komunikat o pracy aplikacji przy otwarciu tematu żłobka przyszedł po 10 ms, ostatnie sprawdzone zdanie po 459 ms. Dla pytania „na czyje konto?” czasy wyniosły 3 ms i 186 ms. W każdym przypadku pierwsze zdanie odpowiedzi pojawiło się po zakończeniu zapisu. Są to pojedyncze próby strumienia, osobne od pomiaru modeli i obu przebiegów v3.

GitHub Actions zespołu opublikowało wydanie z `d4d5e848b1fdd8055b4f057c5c69ea0bfa00c822`, następnie zgłosiło błąd w syntetycznej próbie na produkcji. Kandydat rozwijany tutaj ma SHA `c230d946e4278ff394f5a13ff8c41b5a8f11374c`. Pełne Preview Vercela i przełączenie publicznego aliasu wymagają zielonych bramek. [Przebieg zespołu](https://github.com/szpoter/straylight_hacknation/actions/runs/44969805258)

Po negatywnej próbie G3 wróciliśmy w lokalnym teście do działającej pary aplikacja–kolekcja v3. Oba warianty Marty z PDF przeszły ponownie (2/2, 4082 i 4076 ms). Powtórka rozmowy o żłobku po F5 zwróciła zapisany cytat i zaliczyła oba kroki. Na produkcji zespół nie musiał cofać kandydata, ponieważ pozostał lokalny.
