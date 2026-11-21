# Lokalny Bielik i PLLuM dla Vercela

## Działająca konfiguracja z Neonem

Vercel wysyła publiczne zadanie RAG do prywatnego schematu `zusik_model`. LaunchAgent użytkownika na Macu utrzymuje wychodzące połączenie TLS z Neonem i przekazuje zadanie do Ollamy na `127.0.0.1:11434`. Komputer musi być aktywny, użytkownik zalogowany, a Ollama uruchomiona. Stałe połączenie i odczyty mogą utrzymywać aktywny compute Neon.

Domyślny model to lokalny Bielik. Serwerowa zmienna `ZUSIK_RAG_MODEL=pllum` wybiera PLLuM dla całego wdrożenia, a `hosted` wybiera skonfigurowany model Sherlock. Po zmianie zmiennej w Vercelu wykonaj ponowny deploy. Aktualne poświadczenia Sherlock i rola `zusik_runtime` nadal obsługują aplikację.

Kolejka przyjmuje pytanie, które dokładnie odpowiada wynikowi ponownej projekcji na publiczny wzorzec, oraz fragmenty wczytane z tego samego zatwierdzonego korpusu. Projekcje, które przy drugim przebiegu zmieniają treść, obsługuje dotychczasowa ścieżka hostowana z pierwszą publiczną projekcją. Do tabeli trafiają tylko losowy UUID, wybrany model, publiczny prompt oraz tymczasowe pola wyniku i dzierżawy. Akta, oryginalne pytanie, identyfikatory sesji i rozmowy pozostają poza kolejką.

Worker pobiera zadanie atomowo, odnawia 9-sekundową dzierżawę i może ponowić pracę najwyżej raz. Po 42 sekundach wynik wygasa. Odczytany wynik aplikacja usuwa od razu. Osierocone wpisy usuwa kolejny odbiór lub zapis. Oczekiwanie na wolnego workera trwa około 3,5 sekundy, a cała próba lokalna ma limit 38 sekund. Wczesna awaria pozostawia czas na hostowanego Bielika. Po późnej awarii aplikacja używa dotychczasowej ścieżki cytatu źródłowego lub informuje o niedostępności. Model lokalny i hostowany dzielą budżet 45 sekund i przechodzą ten sam walidator cytatów.

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

Zadaj świeże pytanie „Kiedy złożyć wniosek o urlop rodzicielski?” i otwórz logi funkcji dla tego wywołania. Wpis `rag_model_attempt` podaje `attemptId`, `backend`, `status` i czas. Na Macu sprawdź ten sam UUID w `~/Library/Application Support/ZusikModel/attempts.log`. Para `backend=local-bielik` lub `local-pllum`, `status=ok` po stronie Vercela i `state=generated` po stronie Maca potwierdza inferencję. `fallback=hosted` lub `source_only` wyjaśnia obsługę awarii. O publikacji odpowiedzi po walidacji informują pola `citations` i `quoteReason` w zdarzeniu `zusik_ask`. Powtórzenie tego samego requestId może odtworzyć zapisaną odpowiedź.

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
