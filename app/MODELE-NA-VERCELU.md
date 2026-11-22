# Lokalne modele odpowiedzi dla Vercela

## Działająca konfiguracja z Neonem

Vercel wysyła publiczne zadanie RAG do prywatnego schematu `zusik_model`. LaunchAgent użytkownika na Macu utrzymuje wychodzące połączenie TLS z Neonem i przekazuje zadanie do Ollamy na `127.0.0.1:11434`. Komputer musi być aktywny, użytkownik zalogowany, a Ollama uruchomiona. Stałe połączenie i odczyty mogą utrzymywać aktywny compute Neon.

Domyślny model to lokalny Bielik. Serwerowa zmienna `ZUSIK_RAG_MODEL=pllum` wybiera PLLuM dla odpowiedzi na podstawie dowodów, a `hosted` wybiera skonfigurowany model Sherlock. Po zmianie zmiennej w Vercelu wykonaj ponowny deploy. Aktualne poświadczenia Sherlock i rola `zusik_runtime` nadal obsługują aplikację.

Kolejka przyjmuje pytanie, które dokładnie odpowiada wynikowi ponownej projekcji na publiczny wzorzec, oraz fragmenty wczytane z tego samego zatwierdzonego korpusu. Projekcje, które przy drugim przebiegu zmieniają treść, obsługuje dotychczasowa ścieżka hostowana z pierwszą publiczną projekcją. Do tabeli trafiają tylko losowy UUID, wybrany model, publiczny prompt oraz tymczasowe pola wyniku i dzierżawy. Akta, oryginalne pytanie, identyfikatory sesji i rozmowy pozostają poza kolejką.

Worker pobiera zadanie atomowo, odnawia 9-sekundową dzierżawę i może ponowić pracę najwyżej raz. Dla Bielika i PLLuM wynik wygasa po 42 sekundach. Odczytany wynik aplikacja usuwa od razu. Osierocone wpisy usuwa kolejny odbiór lub zapis. Oczekiwanie na wolnego workera trwa około 3,5 sekundy, a próba lokalnego Bielika lub PLLuM ma limit 38 sekund. Wczesna awaria pozostawia czas na hostowanego Bielika. Po późnej awarii aplikacja używa dotychczasowej ścieżki cytatu źródłowego lub informuje o niedostępności. Model lokalny i hostowany dzielą budżet 45 sekund i przechodzą ten sam walidator cytatów.

### Qwen 3.8 27B w Preview

W obu wejściach czatu można wybrać **Qwen 3.8 27B (LM Studio)** do sformułowania odpowiedzi z publicznych źródeł. Do modelu trafiają zatwierdzona publiczna wersja pytania i fragmenty źródeł. Wygenerowane twierdzenia i cytaty przechodzą ten sam walidator co odpowiedzi polskich modeli. Przy awarii użytkownik może ponowić próbę. Gdy reguła zwraca sam przepis, aplikacja może odpowiedzieć bez wywoływania modelu.

Przy ręcznym wyborze Qwena pełna generacja trwa do 90 s. Aplikacja czeka na kolejkę do 100 s, a zadanie wygasa po 105 s od wstawienia. Worker odnawia dzierżawę co 3 s. Upływ czasu generacji kończy próbę. Przy aktualizacji zatrzymaj poprzedni proces Qwena w Preview przed uruchomieniem nowego workera.

Na bazie **Preview** z rolami aplikacji i workera zastosuj migrację `app/workers/queue.sql`. W chronionym pliku JSON na Macu (prawa `0600`) ustaw `url` na adres połączenia do tej samej bazy dla roli `zusik_model_worker` z weryfikacją TLS. Jeżeli lokalne LM Studio wymaga tokenu, dodaj `lmStudioToken`. Włącz serwer LM Studio pod `127.0.0.1:1234` i sprawdź, czy `GET /v1/models` wymienia `qwen/qwen3.8-27b`. Z katalogu `app`, z zainstalowanymi zależnościami i Node 24, uruchom osobny proces:

```sh
node --import tsx workers/ollama.mjs "$HOME/.config/zusik/preview-worker.json" --lmstudio-qwen-27b
```

Proces rezerwuje tylko zadania `qwen-27b`. Generację zleca przez `POST /api/v1/chat` z `reasoning: "off"` i `store: false`. Akceptuje odpowiedź po sprawdzeniu identyfikatora instancji. Kod i komunikat o niedostępności można sprawdzić, zatrzymując wyłącznie ten proces i ponawiając pytanie wymagające generacji. [API modeli LM Studio](https://lmstudio.ai/docs/developer/openai-compat/models) · [Parametry generacji i identyfikator instancji](https://lmstudio.ai/docs/developer/rest/chat)

### Zadania planera i weryfikatora

Każdy nowy worker akceptuje trzy rodzaje zadań. Wcześniejsze rekordy kolejki mają rodzaj `answer_evidence`. Serwer rozwiązuje identyfikatory wcześniejszego fragmentu i kandydatów w aktywnych publicznych pakietach. Do planera przekazuje publiczny aspekt, listę brakujących pól oraz tekst wybranych jednostek. Weryfikator w tym wydaniu porównuje wskazaną publiczną jednostkę z innymi jednostkami korpusu. Odpowiedź każdego modelu musi przejść walidację schematu, a wskazane dowody muszą należeć do przekazanej listy.

Po zastosowaniu addytywnej migracji `workers/queue.sql` uruchom nowego workera na stagingu. Stary proces odczytuje tylko zadania odpowiedzi. Ustawienie `ZUSIK_PLANNER_MODEL` lub `ZUSIK_VERIFIER_MODEL` na `bielik` albo `pllum` włącza wybraną rolę. Brak wartości lub `off` pozostawia decyzję grafowi. Każda operacja dodatkowa wymaga co najmniej 9 sekund do końca budżetu. Po wyczerpaniu limitu aplikacja zachowuje decyzję deterministyczną. Ślad `rag_model_attempt` zawiera rodzaj, identyfikator próby, rzeczywisty backend i czas.

W odizolowanej bazie z nowym workerem wykonaj `node --env-file=.env.local --import tsx scripts/zusik-smoke-queue.mts --roles` po ustawieniu obu ról. Polecenie sprawdza zwrócone narzędzie i werdykt. Do pomiaru samych modeli uruchom na porcie 11439 dodatkową Ollamę z jedną rezydentną instancją i kontekstem 4096. Następnie wykonaj:

```sh
OLLAMA_HOST=127.0.0.1:11439 OLLAMA_MAX_LOADED_MODELS=1 OLLAMA_NUM_PARALLEL=1 OLLAMA_CONTEXT_LENGTH=4096 ollama serve
# W osobnym terminalu w app/
node --import tsx scripts/zusik-eval-local-models.ts --roles
```

Raport `corpus/local-model-roles.json` zachowuje opóźnienia, raportowaną pamięć procesu modelu oraz wynik schematu i sprawdzeń merytorycznych. Pomiar zimny obejmuje ponowne załadowanie modelu po potwierdzeniu zwolnienia przez Ollamę. Cache dyskowy systemu może być ciepły. Przy trzech obserwacjach p95 jest największym czasem w grupie.

### Wyniki na Macu 22 listopada 2026

Oba modele otrzymały po trzy zimne i trzy ciepłe próby każdego zadania na publicznych fragmentach. Przypadek generatora obejmował regułę dołączenia odpisu oraz wyjątek dla dokumentu w aktach. Planner miał otworzyć źródło wcześniejszej odpowiedzi, a weryfikator wykryć brak podstawy w dokumencie o innej przesłance. Pierwsze 36 prób zapisano w `corpus/local-model-roles.json`. Po doprecyzowaniu instrukcji i ograniczeniu identyfikatorów do przekazanych dowodów powtórzono 24 próby ról pomocniczych. Ich wyniki zapisano w `corpus/local-model-routing.json`. Powtórzenie drugiej serii wymaga dodatkowej flagi `--supplementary` obok `--roles`.

| Zadanie i model | Poprawna treść | Zimny p50 / p95 | Ciepły p50 / p95 |
|---|---:|---:|---:|
| Odpowiedź z wyjątkiem, Bielik | 6/6 | 56,38 / 66,55 s | 34,95 / 39,10 s |
| Odpowiedź z wyjątkiem, PLLuM | 0/6 | 14,05 / 18,14 s | 6,88 / 7,48 s |
| Planner, Bielik | 0/6 | 3,07 / 3,22 s | 1,81 / 1,92 s |
| Planner, PLLuM | 6/6 | 4,31 / 5,29 s | 1,84 / 1,94 s |
| Weryfikator, Bielik | 0/6 | 3,08 / 3,17 s | 1,13 / 1,19 s |
| Weryfikator, PLLuM | 6/6 | 3,40 / 3,42 s | 0,65 / 0,66 s |

Wszystkie odpowiedzi bezpośrednie spełniły schemat JSON. W każdej roli powtarzano jeden przypadek. Wnioski uzasadniają Bielika do generowania odpowiedzi z wyjątkami oraz PLLuM do dalszych prób planowania i kontroli dowodów. Bielik ukończył trzy z sześciu odpowiedzi w budżecie 38 sekund. W tych warunkach obie dodatkowe role pozostają domyślnie wyłączone.

Mac miał 48 GiB pamięci. Ollama z kontekstem 4096 raportowała około 7,26 GiB dla Bielika i 7,53 GiB dla PLLuM. W próbce wspólnej rezydencji Bielik miał kontekst 32768 i zajmował około 12,56 GiB, a PLLuM 7,53 GiB. W chwili próbki system raportował 1,39 GiB wolnej pamięci.

Osobny worker używał prywatnego gniazda testowej bazy PostgreSQL. PLLuM prawidłowo wybrał wcześniejszy cytat w 4,84 s, lecz dwie następne próby planowania przekroczyły budżet 9 s. Weryfikacja przeszła w 4,83 i 4,43 s. Po zatrzymaniu workera aplikacja zakończyła oczekiwanie po 3,71 s i uzyskała zwalidowaną odpowiedź hostowaną z cytatem `kp-art182-1d-par1` po 9,76 s od startu. Przebiegi oraz stan pamięci są w `tests/fixtures/zusik-acceptance/results/model-worker.json`. W pierwszej próbie Bielik z gramatyką odpowiedzi zwrócił HTTP 400 przy inicjalizacji samplera. Po przywróceniu dotychczasowego sposobu generowania z walidacją JSON oba modele odpowiedziały przez testowy worker i podały prawidłowy cytat. Bielik potrzebował 20,91 s, a PLLuM 20,47 s. Powtarzalny odbiór całej pary ról przez Preview pozostaje otwarty.

### Instalacja i odbiór

Z katalogu `app` z zależnościami z lockfile i Node 24 wykonaj kolejno:

```sh
node --env-file=.env.local --import tsx workers/install-queue.mts
python3 workers/install-launch-agent.py
node --env-file=.env.local --import tsx scripts/zusik-smoke-queue.mts
node --env-file=.env.local --import tsx scripts/zusik-smoke-queue.mts --outage
```

Instalator używa `MIGRATION_DATABASE_URL`, zachowuje istniejące hasła i sprawdza uprawnienia ról. Konto aplikacji może zlecać, odczytywać i usuwać zadanie według losowego UUID. Osobna rola workera może wyłącznie pobierać, odnawiać i kończyć zadania w kolejce. Konfiguracja workera jest w pliku `~/Library/Application Support/ZusikModel/worker.json` z prawami 0600. Ponów instalację po zmianach workera, promptu systemowego lub ścieżki Node. Instalacja LaunchAgenta obejmuje bieżącego użytkownika macOS.

W teście awarii jedno zadanie pozostaje w otwartej transakcji, niewidoczne dla workera. Próba przechodzi przez rzeczywisty fallback przy zachowaniu dostępności pozostałych zadań. Oba testy używają wyłącznie stałego publicznego pytania.

### Potwierdzenie próby produkcyjnej

W Chrome otwórz DevTools → Network, a następnie zadaj w czacie świeże pytanie „Kiedy złożyć wniosek o urlop rodzicielski?”. W żądaniu `ask` otwórz Response. W ostatnim wierszu strumienia odczytaj `body.retrieval.backend`, `attemptId` i `quoteReason`. Wartość `local-bielik` lub `local-pllum` oraz ten sam identyfikator w zdarzeniu `generated` w dzienniku Maca potwierdzają lokalną inferencję. Pole `quoteReason` informuje, kiedy aplikacja wybrała dosłowny cytat. Identyfikatory w `top`, `evidence` i `turn.citations` pozwalają prześledzić fragment ze zbioru trafień do końcowej odpowiedzi.

Dziennik funkcji Vercel zawiera także zdarzenia `rag_model_attempt` z czasem i ewentualnym `fallback`. Powtórzenie tego samego requestId może odtworzyć zapisaną odpowiedź. W takim przypadku `retrieval` ma wartość `null`.

```sh
launchctl print "gui/$(id -u)/pl.zusik.model-worker"
tail -n 10 "$HOME/Library/Application Support/ZusikModel/attempts.log"
```

## Alternatywna konfiguracja z własną domeną

Dla poniższego wariantu ustaw `ZUSIK_RAG_MODEL=hosted`, aby aplikacja użyła wskazanego endpointu zgodnego z OpenAI.

Aplikacja na Vercelu wywołuje jeden wybrany model czatu zgodny z OpenAI Chat Completions. Wektory dla Qdrant nadal liczy ten sam model embeddingowy co przy imporcie. Działający adres hostowanego Bielika można zachować do czasu odbioru laptopa na Preview.

1. Na Macu sprawdź listę faktycznie pobranych modeli: `lms ls` dla LM Studio lub `ollama list`. Plik z rozszerzeniem `.incomplete` oznacza trwające pobieranie. Przy imporcie GGUF w LM Studio użyj kompletnego pliku i wariantu instrukcyjnego/chat. Sprawdź warunki licencji wybranego wydania.
2. W LM Studio wybierz model, **Developer → Start Server**. W ustawieniach serwera włącz uwierzytelnianie i utwórz token API. Użyj portu 1234 i nasłuchu na loopback. Wywołanie `GET http://127.0.0.1:1234/v1/models` z nagłówkiem `Authorization: Bearer <lokalny token>` zwraca dokładne ID do ustawienia w aplikacji. Sprawdź krótką odpowiedź z `POST /v1/chat/completions` dla tego ID. W Ollamie domyślny port to 11434. Produkcyjny przykład poniżej dotyczy LM Studio.
3. Dla domeny obsługiwanej przez Twój Cloudflare skonfiguruj aplikację **Access → Applications → Add an application → Self-hosted** dla całego hosta, np. `modele.twojadomena.pl`. W **Access controls → Service credentials → Service Tokens** wygeneruj token dla Vercela. W polityce aplikacji wybierz **Service Auth** i ten konkretny service token. Zastosuj politykę przed opublikowaniem hosta.
4. W Cloudflare Zero Trust utwórz nazwany Cloudflare Tunnel. Zainstaluj `cloudflared` na Macu według instrukcji jego konfiguratora i uruchom konektor. W trasie publicznej wskaż host z poprzedniego kroku i usługę HTTP `http://127.0.0.1:1234`. Najpierw z zewnętrznej sieci sprawdź, że anonimowe `GET /v1/models` nie zwraca listy modeli. W próbie z oboma nagłówkami Access oraz tokenem LM Studio lista ma zawierać dokładne ID.
5. W **Vercel → projekt straylight-hacknation → Settings → Environment Variables** wybierz najpierw **Preview**. Ustaw poniższe wartości wyłącznie po stronie serwera. Zachowaj poprzednie ustawienia dostawcy w menedżerze sekretów na wypadek powrotu.

   | Nazwa | Wartość |
   |---|---|
   | SHERLOCK_BASE_URL | https://modele.twojadomena.pl/v1 |
   | SHERLOCK_MODEL | dokładny identyfikator z /v1/models |
   | SHERLOCK_API_KEY | token API lokalnego LM Studio |
   | MODEL_TUNNEL_ORIGIN | https://modele.twojadomena.pl (sam origin, bez końcowego ukośnika) |
   | CF_ACCESS_CLIENT_ID | identyfikator Service Token |
   | CF_ACCESS_CLIENT_SECRET | sekret Service Token |

6. Zbuduj nowe Preview. W `/app` zadaj pytanie o dwa warianty, otwórz cytat i sprawdź wywołanie modelu w logu LM Studio. Odpowiedź awaryjna oparta na cytacie sama nie potwierdza inferencji. Przełącz identyfikator na drugi pobrany model, jeśli chcesz porównać jakość i czas; dla każdego uruchom ten sam eval. Wybierz konfigurację spełniającą kryteria i dopiero wtedy przenieś wartości do zakresu **Production** i wdróż ponownie.
7. Na czas pokazu Mac musi być aktywny, podłączony do zasilania i Internetu, z działającym serwerem i tunelem. Powrót do hostowanego dostawcy wymaga przywrócenia jego adresu, ID i klucza oraz ponownego wdrożenia. Ustawienia tokenu tunelu są ograniczone w kodzie do jednego originu HTTPS.

[Serwer LM Studio](https://lmstudio.ai/docs/developer/core/server) · [Uwierzytelnianie LM Studio](https://lmstudio.ai/docs/developer/core/authentication) · [Tokeny usługowe Cloudflare](https://developers.cloudflare.com/cloudflare-one/access-controls/service-credentials/service-tokens/) · [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/)

## Wariant dla Ollamy już działającej na Macu

Na tym laptopie lokalny Bielik odpowiedział przez OpenAI-compatible API na porcie 11434. Dla tego wariantu skieruj trasę tunelu do `http://127.0.0.1:11434`, ustaw w opcjach originu **HTTP Host Header** na `localhost`. Ogranicz przekazywaną ścieżkę do `^/v1/(models|chat/completions)$` i pozostaw domyślną odpowiedź 404 dla pozostałych ścieżek. Polityka Access ma nadal obejmować cały hostname. Pozwala to wywołać czat bez publikowania interfejsu zarządzania Ollamą. Wartość `SHERLOCK_API_KEY=ollama` zaspokaja klienta SDK; autoryzację zapewnia Cloudflare Access. Ustaw `SHERLOCK_MODEL=SpeakLeash/bielik-11b-v3.1-instruct:Q4_K_M` lub `hf.co/mradermacher/PLLuM-12B-chat-2512-GGUF:Q4_K_M` dla lokalnie sprawdzonego PLLuM. Oba modele mogą być zainstalowane w jednej Ollamie. Zmieniasz tylko ID modelu i wykonujesz nowy deploy.

[OpenAI compatibility w Ollamie](https://docs.ollama.com/api/openai-compatibility) · [Ustawienia originu Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/configure-tunnels/origin-configuration/)
