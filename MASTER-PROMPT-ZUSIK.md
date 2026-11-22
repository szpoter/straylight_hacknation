# Zusik od pytania rodzica do sprawdzalnej odpowiedzi

## Polecenie startowe dla Opusa lub Codexa

Jesteś prowadzącym wdrożenie w repozytorium HackNation. Wykonaj ten dokument od audytu do próby na produkcji. Zacznij od aktualnego `main` i krótkiego zestawienia „działa / wymaga sprawdzenia / brakuje”. Wznawiaj pracę od pierwszego niespełnionego warunku. Zweryfikowane już elementy zachowaj. Pisz do Juliana po polsku, w kodzie stosuj angielskie nazwy. Rozstrzygaj lokalne, odwracalne decyzje samodzielnie. Przy rzeczywistej decyzji architektonicznej przedstaw pomiar, dwie opcje i jedno pytanie.

**Wynik dla rodzica.** Po przejściu z landingu przez logowanie demonstracyjne rodzic może opisać nową sprawę własnymi słowami, dopytać „a jeśli jednak…”, zmienić temat, odświeżyć stronę i zapytać „skąd to wiesz?”. Odpowiedź informacyjna prowadzi do konkretnej jednostki oficjalnego źródła. Indywidualny wynik, termin i formularz korzystają ze sprawdzonych danych sprawy i istniejącego kodu reguł. Rozmowa o innym świadczeniu podczas wypełniania ZAM nie może sama zmienić szkicu. W obszarze rodzica użyj istniejącego języka wizualnego i jednego czatu. Panel administracyjny służy do pracy z wersjami reguł, źródłami i podglądem. Sprawdź granice wersji roboczej i opublikowanej.

**Dowód uogólnienia.** Dodanie zatwierdzonego publicznego dokumentu ma wymagać dokumentu, metadanych, wersji i importu. Przy pierwszym pytaniu o ten dokument nie wolno modyfikować routera, promptu, listy świadczeń, słownika lub odpowiedzi modelu pod konkretny przykład. Pokaż dwa różne sformułowania, dopytanie po odświeżeniu i odpowiedź po usunięciu właściwego źródła w izolowanej kopii. Prawidłowe „brakuje podstawy” także jest wynikiem.

## Punkt odniesienia i granice

Ścieżka demonstracyjna prowadzi od landingu przez logowanie do onboardingu na `/start`, a dalej do planu rodziny na `/plan`. Wersja panelu scalona w `e456df1` wprowadziła też `/dokumenty`, `/wsparcie` i `/profil`. Sprawdź ruch sieciowy po zapytaniu z każdej powierzchni. W szczególności kliknij pionek na planie oraz przycisk w szczegółach dokumentu. Przełącz zakładki i otwórz ponownie ten sam kontekst. Wątek dotyczący planu lub przystanku powinien wrócić po odświeżeniu i być odizolowany od drugiego planu rodziny. Osobno sprawdź ogólny wątek na `/app/rozmowa` oraz historie trzech przykładowych spraw. Dane demonstracyjne rodziny i stan akt sprawy mają odrębne źródła. Zweryfikuj, które dane użytkownik rzeczywiście przekazał do sprawy. Bieżący mechanizm wyszukuje kandydatów w treści aktywnych pakietów, a znalezioną podstawę weryfikuje zapytaniem do Qdrant. Oceń, czy wybrany fragment odpowiada na konkretny aspekt pytania.

1. Wykonaj `git status --short --branch`, sprawdź worktree i `git pull --ff-only origin main` na właściwej gałęzi. Zapisz SHA. Zachowaj lokalne zmiany. Odczytaj `CLAUDE.md`, `app/AGENTS.md`, `TECH-SPEC-AGENT.md`, `SPEC-PO-LOGOWANIU.md` (zwłaszcza sekcję o czacie), `SPEC-PANEL-ADMINISTRACYJNY.md`, `DESIGN.md`, `app/ARCHITECTURE.md`, `app/corpus/README.md`, manifesty i workflow Vercela. Dokument projektowy opisuje intencję. Stan wdrożenia ustal z kodu, działającej strony i odpowiedzi serwera.
2. Przy pullu bazowym `a3da387` manifesty zawierały 23 fragmenty Marty, 487 publicznych i 5 oferty. To 515 wpisów. Sprawdź aktualne liczby, daty obowiązywania, liczbę unikalnych źródeł i faktyczne wersje po stronie Qdrant. Prywatne akta, skany, tekst rozmowy, dane rodziny i publiczne akty mają różne uprawnienia. Sprawdź każdy odbiornik danych osobno, również kolejkę w Neon, telemetrykę i zapasowy model.
3. Pracuj na stosie projektu: Next.js z katalogu `app/`, Node z `package.json`, Qdrant, Neon/Postgres, istniejące grafy LangGraph, lokalny worker modeli i skonfigurowany dostawca zapasowy. Zapisz faktyczny backend osobno dla każdej operacji. Nie wyciągaj wniosku „lokalny Bielik” z nazwy wyświetlanej w UI.
4. Utrzymuj małą tabelę prac w bieżącym czacie: zadanie, właściciel, zależność, SHA, dowód, wynik, następny krok. Po istotnej zmianie build i commit `type(scope): opis`. Wprowadzaj poprawki oparte na obserwowanej przyczynie. Zachowaj pozostałe zmiany zespołu. Po dwóch nieudanych próbach tej samej naprawy opisz konkretny bloker zgodnie z instrukcjami repo.

## Praca równoległa

Jako prowadzący przydziel pracę narzędziem subagentów dostępnym w danym środowisku. W Codex użyj `spawn_agent`, wymieniaj informacje przez `send_message`, następnie zbierz raporty. W Claude Code użyj jego dostępnego narzędzia Agent. Dziel większe fale stosownie do liczby slotów. Oddzielne czaty użytkownika otwieraj na jego wyraźne polecenie dla niezależnego, trwalszego zadania. W Codex użyj wtedy `create_thread`, przekaż SHA i brief, odbierz wynik przez `wait_threads`. W środowisku bez tych narzędzi wykonaj te same zlecenia kolejno. Tylko prowadzący integruje całość i publikuje.

| Zlecenie do przekazania | Właściciel i skill do odczytania | Warunek przekazania wyniku |
| --- | --- | --- |
| Prześledź trzy rzeczywiste wejścia od kliknięcia do zapisu. Zlokalizuj pierwszą warstwę, w której znika poprawna informacja. Początkowo tylko odczyt. | Diagnosta · `ecc:agent-architecture-audit`, przy konkretnym błędzie `ecc:agent-introspection-debugging` | Ścieżka symboli, oczekiwany wynik, obserwacja, hipoteza i próba, która ją obala |
| Zinwentaryzuj źródła i zaimplementuj ogólne wyszukiwanie oraz granicę prywatności. Posiadasz `lib/rag`, integrację w `lib/zusik` i ich testy. | Inżynier RAG · `ecc:iterative-retrieval`, `ecc:knowledge-ops` | Pytanie o nowy dokument dociera do źródła w zwykłym API. Wrażliwe dane nie opuszczają uprawnionego kontekstu |
| Odtwórz drogę rodzica i urzędnika. Posiadasz nawigację, komponenty i test kliknięć. | Inżynier UI · `ecc:click-path-audit`, `ecc:browser-qa` | Próba na dwóch szerokościach ekranu, właściwy wątek, zachowany szkic i działający link do źródła |
| Przygotuj zbiór ukrytych przypadków z korpusu i oceń oba buildy. Frazy testowe zachowaj do zakończenia strojenia. | Niezależny ewaluator · `ecc:ai-regression-testing`, `ecc:benchmark-methodology` | Wyniki przed i po, przyczyny porażek, przykłady odrzuceń i koszt jakościowy |
| Sprawdź konfigurację równoważną produkcji, zwykłe testy uprawnień, stan baz i możliwość powrotu do poprzedniej wersji. | Prowadzący wydanie · `ecc:production-audit`, `ecc:deployment-patterns` | Zgodność hashy, CI, przejście przez publiczny alias i powtórka w świeżej sesji |

Każde zlecenie zawiera ścieżki plików, kryteria odbioru i zakaz cofania zmian innych osób. Umowy na wspólnych typach ustala jeden właściciel. Ewaluator ujawnia deweloperowi klasę błędu, a po naprawie dodaje nową, niewidzianą próbę. Przy porównaniu dwóch agentów programistycznych użyj `ecc:agent-eval`. Jakość produktu mierz na odpowiedziach i skutkach działań Zusika.

## Etap 1 · Odtwórz aktualne zachowanie

- Zobacz, co naprawdę robi przycisk z landingu, obie dostępne drogi demonstracyjnego logowania, ekran `/start`, nowa rozmowa, `/app`, `/app/kamil`, `/app/chorobowe` i podgląd z panelu. Odnotuj aktywną sesję i rodzaj sprawy za pomocą syntetycznych identyfikatorów. Rozróżnij logowanie demonstracyjne, podpisaną sesję sprawy i sesję administratora.
- Prześledź POST `/api/zusik/ask`, `AskService.ask`, `projectQuestion`, `resolveFollowUp`, `qdrantKnowledgeSearch`, `assembleEvidence`, `publicQueueEvidence`, generator, walidację twierdzeń, zapis tury, strumień i render cytatu. Porównaj widoczny tekst z końcową odpowiedzią API i zapisem po F5. Ustal, które komunikaty są odręczną odpowiedzią, które wynikiem narzędzia, a które cytatem awaryjnym.
- Rozpisz osobno ścieżkę OCR → potwierdzenie pól → reguła/kalkulator → termin → szkic → oryginalny formularz → eksport. Dla odmowy prawa wskaż dane i regułę, które przesądziły wynik. Prześledź również przypadki cofnięcia dokumentu, brakującej strony, podwójnego kliknięcia i powrotu do przerwanej sprawy.
- Do każdego istotnego defektu zapisz objaw, co najmniej jeden odtwarzalny test z fikcyjnymi danymi, pierwszy błędny wynik, odsyłacz do pliku/symbolu, wpływ na rodzica i kryterium naprawy. Odróżnij „sprawdziłem w kodzie”, „odtworzyłem w API”, „odtworzyłem na produkcji” i „hipoteza”.

## Etap 2 · Zbadaj korpus i zbuduj drogę dla nowego tematu

1. Przejrzyj źródła urzędowe, ich sekcje, negacje, wyjątki, powiązania z aktem nadrzędnym, datę sprawy i numer strony. Wyszukaj częste duplikaty poradnik–ustawa. Dla każdego pakietu sprawdź liczbę punktów, wersję, identyfikatory i digest w fizycznej kolekcji czytanej przez aplikację. Poprzednie wdrożenie czytało inną kolekcję niż lokalny import.
2. Wybierz próbkę z kilku aktów i programów. Zmierz, ile błędów powoduje nierozpoznanie tematu, ile wybór jednego pakietu, ile utrata wyjątku, a ile niepoprawna interpretacja poprawnego cytatu. Sprawdź też preset, który rozpoznaje jedno słowo z pytania i przysłania lepszy wynik z innego pakietu.
3. Zaprojektuj wspólne wejście do wiedzy publicznej. Rozróżnij pytanie informacyjne, dopytanie, źródła poprzedniej odpowiedzi, polecenie zmiany dokumentu i operację na danych sprawy. Te rodzaje czynności są stabilne, a wiedza o świadczeniach ma pochodzić z dokumentów. W przypadku niskiej pewności między dwoma tematami zapytaj o jedną różnicującą informację.
4. Jako punkt odniesienia uruchom wyszukiwanie po treści, tytułach i nagłówkach wszystkich aktywnych pakietów. Porównaj ze ścieżką semantyczną i z połączeniem list wyników. Dwóch zapytań do tego samego indeksu wektorowego nie opisuj jako BM25 + dense. Jeśli porównujesz RRF lub reranking, zapisz kolejność przed i po, koszt oraz wyniki osobno dla parafraz i dokładnych numerów artykułów. Zwiększenie liczby fragmentów w prompcie również wymaga pomiaru.
5. Zinterpretuj tekst użytkownika w zaufanym środowisku. Na granicy z zewnętrznym dostawcą dopuszczaj publiczne pojęcia, identyfikatory i tekst ze zweryfikowanych źródeł według kontraktu. Sprawdź to na rzeczywistych argumentach wszystkich providerów, również podczas ponowienia i przełączenia na API. Sam filtr cyfr i nazw własnych nie wystarcza. Wariant z lokalnymi embeddingami porównuj dopiero po sprawdzeniu zgodności modelu i przestrzeni wektorowej z indeksem.
6. Numer fragmentu i pasujący hash potwierdzają pochodzenie. Osobno oceń, czy tekst rzeczywiście odpowiada na pytanie i zachowuje przesłanki, wyjątki i terminy. Ustal sposób reagowania na słabe trafienie, rozbieżne źródła, brak danych rodzica i przerwę u dostawcy. Przejście na tryb cytatu pozostaw widoczne w diagnostyce. Odpowiedź o braku podstawy nie jest decyzją o odmowie świadczenia.
7. Wprowadź test rozszerzenia korpusu. Wstaw do izolowanego manifestu nową jednostkę publiczną lub fikcyjny przepis jawnie oznaczony jako fixture. Uruchom normalną ścieżkę aplikacji, potwierdź właściwy cytat, następnie pomiń jednostkę w kopii testowej i potwierdź zmianę odpowiedzi. Materiały testowe pozostają poza publiczną bazą ZUS.

## Etap 3 · Pamięć, obliczenia i interfejs

- Zapisuj minimalny kontekst wcześniej zweryfikowanej tury wraz z identyfikatorem sprawy i wersją źródła. Przy „a co, jeśli…” odzyskaj odniesienie i wyszukaj ponownie. Przy „skąd to wiesz?” odtwórz rzeczywiście użyty cytat. Sprawdź zmianę tematu bez słów „zmień temat”, korektę faktu, pytanie po przerwie, prośbę o wyjaśnienie poprzedniej odpowiedzi i dwa wątki tej samej przeglądarki.
- Sprawdź idempotentny zapis, dwie karty, zapytanie w toku, odświeżenie i zerwanie połączenia w momencie zapisu. Zapisana wersja reguły, danych i dokumentu musi odpowiadać wynikowi, który zobaczył rodzic. Zmiany opublikowane w panelu przetestuj względem daty sprawy. Użyj izolowanej konfiguracji dla testów publikowania.
- Pozostaw ustalanie kwot i dat w testowalnym kalkulatorze. Model może wyjaśnić wynik i zapytać o brakujące dane. Dla trzech oryginalnych spraw porównaj stan przed i po rozmowie, kompletność pól, oryginalny wzór dokumentu, wymagane załączniki i uzasadnienie odmowy. Nie przypisuj eksportowi PDF skutku złożenia w eZUS.
- Kliknij cały przepływ w Chrome na desktopie i przy szerokości 390 px. Zbadaj klawiaturę, fokus po zwinięciu, sygnalizację rzeczywistych czynności, strumień zweryfikowanej odpowiedzi i zachowanie po F5. W sprawach Kamila i chorobowego rodzic powinien widzieć jeden chronologiczny wątek. Oceniaj funkcje z pełnej specyfikacji po zalogowaniu oddzielnie od ekranów faktycznie wdrożonych.

## Etap 4 · Niezależna ewaluacja i diagnoza porażek

Przed strojeniem ustal na piśmie zbiór odniesienia, publiczne źródła oczekiwanych faktów i progi. Proponowany pierwszy zestaw wydaniowy obejmuje 30 pytań z udokumentowaną odpowiedzią z co najmniej 8 działów, 10 pytań bez podstawy lub myląco podobnych, 8 rozmów po trzy tury i 3 pełne sprawy proceduralne. Wśród prób uwzględnij potoczny opis bez nazwy świadczenia, sprawę wymagającą dwóch źródeł, cofnięty dokument i pytanie o datę obowiązywania normy. Zachowaj nieujawnioną część do odbioru. Grupuj pytania według jednostki prawnej i rodziny parafraz, by podobne zdania nie znalazły się po obu stronach podziału. Podaj mianowniki, pominięcia i wyniki dla każdego pakietu.

| Pomiar | Sposób liczenia | Proponowana bramka pierwszego wydania ogólnego |
| --- | --- | --- |
| Trafienie wyszukiwania | Pytania z choć jednym akceptowalnym ID w surowym top 5 przed dodaniem powiązań | ≥ 27/30, z wynikami osobno dla dotychczas nieobsługiwanych tematów |
| Poprawna odpowiedź | Trafny fakt, istotne przesłanki i właściwa jednostka. Dosłowny cytat sprawdź automatem, znaczenie niezależną oceną | ≥ 27/30 oraz zero błędnych decyzji indywidualnych |
| Powstrzymanie się od zgadywania | Brak potwierdzonej podstawy lub jedno celne pytanie. Odnotuj też nadmierne odmowy na zestawie pozytywnym | 10/10 prób negatywnych bez stanowczego, nieuzasadnionego twierdzenia |
| Pamięć i izolacja | Wszystkie tury wątku po F5 mają właściwe odniesienie. Ten sam tekst w pustej sprawie rodzi inne, uzasadnione zachowanie | 8/8 rozmów i zero danych z innej sprawy |
| Formalności | Kwota, termin, stan i dokument sprawdzone także poza tekstem czatu | 3/3 scenariusze, brak automatycznej mutacji po pytaniu informacyjnym |
| Koszt i czas | p50/p95 do pierwszej informacji o pracy i do końca, liczba wywołań, udział zastępstw, błędów i prób bez modelu | Porównaj z bazowym SHA na tym samym zestawie i z limitem trasy Vercel. Każde pogorszenie uzasadnij wynikiem jakości |

Przykładowy zapis jednego pomiaru: identyfikator próby, SHA, identyfikator poprzedniej tury, pakiet i wersja, oczekiwane ID, surowe top 5, ID po uzupełnieniu, cytowane ID, wynik semantyczny, faktyczny backend, przyczyna trybu cytatu, czas, wynik po F5. Na produkcji używaj danych syntetycznych. W telemetrii zwykłych użytkowników przechowuj minimalne identyfikatory i metryki. Raportuj również przypadki „trafienie jest, odpowiedź błędna” i „poprawny wynik dał cytat awaryjny”. Powtórz najtrudniejsze przypadki trzykrotnie. Oceniaj skutki przerwy w Neon, braku workera i błędu Qdrant przez kontrolowane zależności w środowisku testowym.

## Etap 5 · Wydanie i powrót do przypadku rodzica

Zacznij powtórkę z poprzedniego wydania od osobnej sesji ogólnej. Poniższy zestaw ćwiczy osiem tur przez rzeczywisty endpoint bez klucza operatora. Ocenia surowy wynik Qdrant, końcowy cytat, fakt oraz zachowanie przy braku podstawy. Pytania z tego pliku są teraz jawne, więc dla kolejnego wydania dobierz również nowy ukryty zestaw.

```sh
cd app
node --import tsx scripts/zusik-eval-conversations.ts https://straylight-hacknation.vercel.app
```

Z katalogu `app/` odtwórz zależności, uruchom `npm run typecheck`, `npm run lint`, `npm test` i `npm run build`. Uruchom istniejące evale zgodnie z `app/corpus/README.md` z lokalnymi kluczami. Raport generowany przez skrypt oznacz datą, SHA kodu i wersją korpusu. Zrób próbę na lokalnym produkcyjnym buildzie. Importuj nową wersję wiedzy przed przełączeniem aplikacji i zweryfikuj odczyt dokładnie tym zakresem uprawnień, którego używa Vercel. Poprzednią wersję zachowaj do wycofania.

Scal z najnowszym `main` bez force push. Zobacz logi konkretnego SHA w GitHub Actions, potem sprawdź publiczny alias Vercela. Uruchom `npm run zusik:acceptance -- https://straylight-hacknation.vercel.app`. Ręcznie przejdź od landingu do czatu, zadaj nieujawnione wcześniej pytanie, odśwież czat, dopytaj bez nazwy tematu, otwórz cytat. Zachowaj publiczne ID fragmentu, stronę lub nagłówek i wynik próby kontrolnej w pustej sprawie. Przy regresji ogranicz nową ścieżkę lub wróć do znanej pary wersji aplikacji i korpusu. Zadbaj o odczyt starszych rozmów i formularzy. Zakończ raportem z działającym adresem, wynikami z mianownikami, rozbieżnościami i jednym przykładem, który Julian może wkleić.

## Kiedy użyć wskazanych projektów

| Projekt | Zastosowanie i decyzja |
| --- | --- |
| [Claude-BugHunter](https://github.com/elementalsouls/Claude-BugHunter) | W audycie własnego kodu wykorzystaj dyscyplinę raportowania: zakres, konkretny objaw, dowód, wpływ, poprawka i ponowny test. Sprawdź statycznie granice danych i zwykłymi testami regresji uprawnienia własnej aplikacji. Zakres użycia tego repo obejmuje metodykę dokumentowania usterek. |
| [Firecrawl](https://github.com/firecrawl/firecrawl) | Kandydat do okresowej aktualizacji wybranych publicznych stron ZUS. Zrób pilota na kilku stronach, porównaj z ich oryginałem, oceń nagłówki, wyjątki, listy i stabilność cytatów. Zachowaj URL, datę, wersję, hash i legalne źródło PDF. Importuj po walidacji. Awaria crawlerów ma wpływać na świeżość kolejnej wersji, a nie na dostępność istniejącego czatu. |
| [OpenVINO](https://github.com/openvinotoolkit/openvino) | Opcjonalny eksperyment wydajnościowy na zgodnym hoście inferencji. Najpierw sprawdź sprzęt, format modeli i etap odpowiedzialny za p95. Porównaj obecny worker oraz alternatywę na tych samych polskich pytaniach, z tą samą walidacją cytatów. Dodaj zależność dopiero przy widocznej korzyści. |
| [Plannotator](https://github.com/backnotprop/plannotator) | Lokalny przegląd tego planu, różnic kodu i uwag do UI. Gdy narzędzie jest dostępne, załaduj dokument do lokalnej adnotacji, wróć z uwagami do właścicieli etapów. Wspólny stan pracy przechowuj w repo i rozmowie prowadzącego. Dostępność adnotatora nie blokuje testów. |

Wzoruj projekt eksperymentu na praktyce inżynieryjnej. Anthropic rozdziela wyszukiwanie, kontekst fragmentów i reranking, a w ewaluacjach agentów zaleca ocenę rezultatu i wielokrotne próby. Qdrant dokumentuje łączenie rankingów. Microsoft udostępnia narzędzia do porównań wariantów RAG. Liczby opublikowane dla cudzych danych są hipotezą do sprawdzenia na języku polskim i aktach ZUS. [Contextual Retrieval](https://www.anthropic.com/research/contextual-retrieval) · [Demystifying evals for AI agents](https://www.anthropic.com/research/demystifying-evals-for-ai-agents) · [Qdrant Hybrid Queries](https://qdrant.tech/documentation/search/hybrid-queries/) · [Microsoft BenchmarkQED](https://microsoft.github.io/benchmark-qed/)
