# Zusik · Etap 1, krok 1 · Plan wdrożenia dla Opusa

**Wynik do pokazania Julianowi.** Marta otwiera chroniony Vercel Preview i uruchamia próbę. Zusik znajduje właściwy fragment testowy w Qdrant, Sherlock układa po polsku pytanie o wybór, a LangGraph zapisuje w Neon miejsce, w którym czeka na Martę. Zamykamy kartę, wdrażamy tę samą wersję aplikacji jeszcze raz i otwieramy ten sam adres. Marta widzi to samo pytanie, wybiera „Kolejno”, odświeża i widzi „Wybrano kolejno”. Druga osoba pod tym samym adresem widzi pustą sprawę.

To odbiór **pierwszego wiersza** [specyfikacji etapu 1](TECH-SPEC-AGENT.md). Treść i nazwisko w próbie są fikcyjne. Właściwy korpus prawny, kwoty, terminy, OCR i eksport wniosku należą do następnych kroków.

## 1. Co przygotowuje Julian lub administrator zespołu

Wystarczy dostęp zespołowy do czterech usług i repozytorium Git. Można użyć istniejących kont. Osoba zakładająca zasoby zapisuje sekrety w menedżerze haseł i w docelowym środowisku. Opus dostaje nazwy zmiennych, nazwę gałęzi i dostęp do chronionego Preview. Wartości kluczy, adresy połączeniowe z hasłem i cookies nie trafiają do rozmowy, zrzutów ekranu ani Git.

| Gdzie | Co tworzymy | Po czym poznajemy gotowość |
|---|---|---|
| Sherlock by CloudFerro | Projekt zespołu i jeden klucz API projektu | Klucz widzi identyfikator Bielika w katalogu i pozwala wysłać wiadomość |
| Qdrant Cloud | Klaster Managed Cloud, jedna kolekcja, klucz instalacyjny i klucz odczytu dla aplikacji | Dwa zapytania po polsku znajdują dwa różne oczekiwane wpisy |
| Neon | Projekt Postgres, stała gałąź Preview, baza i dwa połączenia o różnych uprawnieniach | Migracja przechodzi, a aplikacja może zapisać i odczytać checkpoint |
| Vercel | Projekt połączony z repozytorium i jedna gałąź Git do prób | Chroniony adres gałęzi działa po kolejnym wdrożeniu z tą samą bazą |

### Sherlock · Model do rozmowy

1. Zaloguj się do My Portal CloudFerro. Przy nowym koncie potwierdź e-mail, skonfiguruj uwierzytelnianie i dołącz do organizacji lub ją utwórz. Do utworzenia projektu Sherlock potrzebny jest administrator organizacji. Jeśli projekt już istnieje, poproś o dostęp do niego. [Instrukcja założenia projektu](https://docs.cloudferro.com/en/latest/sherlock/How-to-set-up-Sherlock-AI-on-CloudFerro-Cloud.html)
2. Wybierz **Products → Sherlock → Go to product**, następnie wybierz projekt lub utwórz np. `zusik-demo`. W konsoli tego projektu otwórz **Resources → API Keys**, utwórz klucz np. `zusik-preview` i zapisz wartość jako `SHERLOCK_API_KEY`. Sprawdź w projekcie dostęp lub limit wywołań przed próbą. [Klucze Sherlock](https://docs.cloudferro.com/en/latest/sherlock/Sherlock-authentication-API-keys-on-CloudFerro-Cloud.html)
3. Ustaw `SHERLOCK_BASE_URL=https://api-sherlock.cloudferro.com/openai/v1`. Z backendu lub lokalnego terminala wywołaj `GET {SHERLOCK_BASE_URL}/models` z nagłówkiem `Authorization: Bearer <klucz>`. Skopiuj do `SHERLOCK_MODEL` dokładne pole `id` dostępnego Bielika 11B v3.0 Instruct. W dokumentacji występują przykłady z prefiksem wydawcy i bez. Jeśli modelu brak, zapisz blokadę dostępu z nazwą projektu i listą dostępnych modeli czatu do decyzji Juliana. [Katalog i endpoint modeli](https://docs.cloudferro.com/en/latest/sherlock/What-is-Sherlock-on-CloudFerro-Cloud.html)
4. Wyślij krótką wiadomość przez `POST {SHERLOCK_BASE_URL}/chat/completions` z tym modelem. Właściwy przebieg w aplikacji użyje klienta OpenAI-compatible z Vercel AI SDK, który kieruje ruch do Sherlocka. Wystarczy klucz CloudFerro. Potwierdź kod HTTP 200 i niepustą treść odpowiedzi. [Przykład żądania i odpowiedzi](https://docs.cloudferro.com/en/latest/sherlock/Sherlock-chat-completion-endpoint-on-CloudFerro-Cloud/Sherlock-chat-completion-endpoint-on-CloudFerro-Cloud.html)

### Qdrant · Embedding i wyszukiwanie

1. Zaloguj się w Qdrant Cloud, wybierz konto zespołu i utwórz mały klaster Managed Cloud do demo. Skopiuj adres HTTPS REST z ekranu klastra jako `QDRANT_URL`. W zakładce **Inference** sprawdź dostępność hostowanego modelu `intfloat/multilingual-e5-small`. Generuje 384-wymiarowe wektory. Do tego modelu wystarczy dostęp Qdrant. [Założenie klastra](https://qdrant.tech/documentation/cloud/getting-started/) · [Cloud Inference](https://qdrant.tech/documentation/embeddings/qdrant-cloud-inference/)
2. W **Database API Keys** utwórz klucz instalacyjny z uprawnieniem utworzenia kolekcji i zapisu punktów na tym klastrze. Przekaż go skryptowi importującemu jako `QDRANT_WRITE_KEY`. Po utworzeniu kolekcji wystaw osobny klucz **read** dla `zusik_probe_v1`, zapisz jako `QDRANT_READ_KEY`. Oba są kluczami bazy. Aplikacja na Vercelu dostaje tylko drugi. [Uprawnienia kluczy Qdrant](https://qdrant.tech/documentation/cloud/authentication/)
3. Opus przygotuje powtarzalny skrypt inicjalizacji. Utworzy `zusik_probe_v1` z wektorem 384 i odległością `Cosine`. Przy istniejącej kolekcji sprawdzi zgodność konfiguracji. Wstawi dwa punkty przez upsert ze stałymi ID i poczeka na zapis. Payload zawiera `sourceId` i `text`. Przykładowe dane i testy poniżej.

| ID punktu | sourceId | Tekst w kolekcji | Pytanie sprawdzające |
|---|---|---|---|
| 1 | `probe-opieka` | „W tej demonstracji rodzice wybierają, czy chcą opiekować się dzieckiem razem, czy kolejno.” | „Czy opiekę nad dzieckiem możemy zaplanować wspólnie lub na zmianę?” |
| 2 | `probe-rower` | „Stacja naprawy rowerów ma pompkę do opon i zestaw kluczy.” | „Gdzie mogę napompować koło roweru?” |

4. Przy zapisie wyślij `vector: { text, model }`, przy wyszukiwaniu `query: { text, model }`, z tym samym modelem. W hostowanym Cloud Inference Qdrant dobiera prefiks do operacji. Przy obu pytaniach sprawdź pierwsze trafienie z `with_payload` i odczytaj rzeczywiste `sourceId`. Wynik ma pochodzić z zapytania wektorowego, bez filtrowania po oczekiwanym ID. Powtórna inicjalizacja ma nadal dać dwa punkty. [Kontrakt zapisu i wyszukiwania](https://qdrant.tech/documentation/embeddings/qdrant-cloud-inference/)

### Neon · Baza, która zachowuje sprawę

1. W konsoli Neon utwórz lub wybierz projekt zespołu. Przygotuj bazę `zusik` na dedykowanej gałęzi `stage1-step1` od pustej bazy demonstracyjnej. Wybierz region bliski funkcji Vercela. Zachowaj tę samą gałąź i bazę przez cały test, włącznie z ponownym wdrożeniem. [Połączenie z Neon](https://neon.com/docs/get-started-with-neon/connect-neon)
2. Przygotuj rolę właściciela migracji i zwykłą rolę logowania aplikacji `zusik_runtime`. W oknie **Connect** każdorazowo wskaż właściwą gałąź, bazę i rolę. Dla aplikacji włącz **Connection pooling** i skopiuj pełny connection string z hostem zawierającym `-pooler` do `DATABASE_URL`. Dla właściciela wyłącz pooling i zapisz bezpośredni connection string w `MIGRATION_DATABASE_URL`. Zachowaj parametry TLS wygenerowane przez Neon. Ręczna konfiguracja i połączenia SQL nie wymagają klucza API zarządzania kontem Neon. [Połączenia bezpośrednie i pooled](https://neon.com/docs/connect/connection-pooling)
3. Opus przygotuje polecenie migracji uruchamiane jednorazowo dla wskazanej bazy oraz przy zmianie schematu. Na bezpośrednim połączeniu tworzy minimalną tabelę spraw i wykonuje `PostgresSaver.fromConnString(...).setup()` dla schematu używanego przez aplikację. Tabele checkpointów utrzymuje biblioteka. Migracja przyznaje roli runtime dostęp do schematu i potrzebne operacje na tabelach oraz sekwencjach. Potwierdź to faktycznym zapisem i odczytem przez pooled URL. Uruchom migrację drugi raz i sprawdź, że istniejące dane przetrwały. [Implementacja PostgresSaver](https://github.com/langchain-ai/langgraphjs/tree/main/libs/checkpoint-postgres)

## 2. Co ustawiamy na Vercelu

1. Wybierz projekt zespołu powiązany z tym repo lub zaimportuj repo z Git. **Root Directory** ustaw na `maskotka_kod`, **Framework Preset** na Next.js. Użyj npm z istniejącym lockfile, instalacji `npm ci`, komendy `npm run build` i domyślnego wyjścia Next.js. Dobierz obsługiwaną wersję Node LTS zgodną z zależnościami aplikacji i użyj tej samej lokalnie. Endpointy grafu i bazy działają w Node.js. [Ustawienia projektu i katalogu](https://vercel.com/docs/deployments/configure-a-build)
2. Pracuj na gałęzi Git np. `codex/zusik-stage1-probe`. W **Settings → Environment Variables** wybierz **Preview** i tę gałąź. Zapisz poniższe osiem zmiennych po stronie serwera. Dla sekretów zaznacz **Sensitive**. Wszystkie nazwy są prywatne dla backendu, bez prefiksu `NEXT_PUBLIC_`. [Środowiska i zmienne Vercela](https://vercel.com/docs/environment-variables) · [Zmienne wrażliwe](https://vercel.com/docs/environment-variables/sensitive-environment-variables)

| Zmienna Preview | Skąd wziąć wartość | Sekret |
|---|---|---|
| `SHERLOCK_BASE_URL` | Bazowy URL API z sekcji Sherlock, kończy się na `/openai/v1` |  |
| `SHERLOCK_MODEL` | Dokładny identyfikator zwrócony przez `/models` |  |
| `SHERLOCK_API_KEY` | Klucz projektu Sherlock | Tak |
| `QDRANT_URL` | Endpoint HTTPS REST klastra |  |
| `QDRANT_COLLECTION` | `zusik_probe_v1` |  |
| `QDRANT_READ_KEY` | Klucz odczytu kolekcji | Tak |
| `DATABASE_URL` | Pooled connection string roli aplikacji na gałęzi Neon `stage1-step1` | Tak |
| `SESSION_SIGNING_SECRET` | Wygeneruj raz, np. `openssl rand -base64 32`, i zachowaj tę samą wartość przy redeployu | Tak |

3. `QDRANT_WRITE_KEY` i `MIGRATION_DATABASE_URL` są potrzebne operatorowi lokalnie lub w chronionym zadaniu instalacyjnym CI. Skrypt migracji i seed wykonaj przed pierwszym testem funkcji. W repo można zapisać wyłącznie przykładowe nazwy i puste wartości. Brak zmiennej ma powodować czytelny błąd konfiguracji po stronie serwera z nazwą zmiennej.
4. Włącz ochronę Preview dostępną na koncie i nadaj testerowi dostęp do projektu. Wdróż gałąź po ustawieniu zmiennych. Skopiuj **stały adres gałęzi** i oznaczenie deploymentu A. Po zmianie zmiennych uruchom nowe wdrożenie. Cookies są przypisane do hosta, więc test A i B wykonuj przez ten sam adres gałęzi. Zalogowanie testera do chronionego Preview i sesja sprawy Marty to dwa osobne mechanizmy. [Adresy wdrożeń](https://vercel.com/docs/deployments/generated-urls) · [Ochrona dostępu](https://vercel.com/docs/deployment-protection)

## 3. Co dokładnie implementuje Opus

Pracuj w istniejącym `maskotka_kod`. Przeczytaj jego `AGENTS.md`, lokalną dokumentację Next.js i `package.json`. Zanim dodasz pakiety, sprawdź istniejące zależności. Potrzebne są LangGraph.js, `@langchain/langgraph-checkpoint-postgres`, klient PostgreSQL, Zod oraz AI SDK z dostawcą OpenAI-compatible. Qdrant ma dwa proste wywołania REST, do których wystarczy serwerowy `fetch`. Zapisz zgodne wersje w obecnym lockfile.

| Część w katalogu aplikacji | Odpowiedzialność i oczekiwane zachowanie |
|---|---|
| Skrypty inicjalizacji w `scripts/` | Dodaj polecenia npm `zusik:migrate` i `zusik:seed-probe`. Migracja wymaga bezpośredniego URL Neon, seed wymaga klucza zapisu. Skrypty kończą się wynikiem i nazwą operacji. |
| Tabela `demo_cases` | Minimalny szkic sprawy to serwerowy losowy `thread_id` (PK), identyfikator właściciela z unikalnym ograniczeniem dla jednej aktywnej próby na sesję oraz czas utworzenia. Wybór i etap są w stanie grafu. GET odczytuje je z checkpointu. |
| Sesja demo | Wejście na ekran próby zapewnia podpisane ciasteczko z losowym identyfikatorem sesji przed aktywacją przycisku startu. Możesz użyć idempotentnego `POST /api/zusik/session` przy wejściu. Podpis zweryfikuj na serwerze. Na Preview ustaw `HttpOnly; Secure; SameSite=Lax; Path=/`, bez `Domain`. Żądania zapisu przyjmuj z własnego originu. Przeglądarka przesyła wybór, a serwer wyszukuje przypisany do sesji wątek. |
| `lib/zusik/graph.ts` | Skompiluj graf z `PostgresSaver` na runtime URL Neon. Przepływ to `probeProviders → awaitChoice → END`. Pierwszy węzeł wyszukuje fragment o opiece, przekazuje go Sherlockowi i zapisuje `sourceId`, model, treść pytania, status dostawców i losowy znacznik tej próby. Drugi robi `interrupt({question, choices})` i po wznowieniu zapisuje zweryfikowane `choice`. Wszystko przed `interrupt` w drugim węźle musi być bez skutków ubocznych, bo ten węzeł zacznie wykonanie od początku. |
| `app/api/zusik/route.ts` | `POST {action:"start"}` zakłada lub odnajduje sprawę sesji i uruchamia ją tylko raz. `POST {action:"resume", choice:"razem"\|"kolejno", expectedCheckpointId}` sprawdza właściciela, bieżący checkpoint i dozwolony wybór. Następnie wywołuje `graph.invoke(new Command({resume: choice}), config)`. Dla startu, odczytu i wznowienia użyj tego samego `configurable.thread_id`. |
| `app/api/zusik/state/route.ts` | `GET` weryfikuje sesję i wywołuje `graph.getState({configurable:{thread_id}})`. Wyprowadza z wartości i oczekującego przerwania stan `empty`, `awaiting_choice` lub `completed`. Zwraca zminimalizowany widok i `Cache-Control: private, no-store`. Jeśli trwa start, zwróć stan przejściowy. Awarię odczytu zgłoś jako błąd usługi. GET niczego nie tworzy. |
| Prosty ekran np. `/demo/polaczenia` | Jeden przycisk startu, pytanie Marty, dwa przyciski wyboru, potem zapisany wynik. Pod spodem tester widzi skrót sprawy, znacznik próby, identyfikator źródła, stan dostawców i skrót checkpointu. Przy wejściu ekran pobiera stan z serwera, również przy zamknięciu i ponownym otwarciu karty. |

**Kontrakt z modelem.** Przekaż tekst trafienia i polecenie „Zapytaj Martę po polsku, czy wybiera wspólną opiekę, czy opiekę kolejno. Zwróć JSON z jednym polem question”. Backend parsuje odpowiedź przez Zod, np. `{ question: z.string().trim().min(1).max(240) }`. Wartości przycisków pochodzą ze stałej aplikacji. Nie zakładaj natywnej obsługi JSON Schema przez Bielika. Przy błędnym JSON, 429 lub wyczerpaniu krótkiego limitu czasu wyświetl stałe polskie pytanie i oba przyciski, zachowaj status błędu w próbie. Przy braku trafienia lub błędzie Qdrant oznacz brak źródła. Żaden z tych wyników nie zalicza pozytywnego testu integracji. Ustaw jawny timeout żądań krótszy niż limit funkcji i ogranicz ponowienia. [OpenAI-compatible provider](https://ai-sdk.dev/providers/openai-compatible-providers) · [LangGraph interrupt i resume](https://docs.langchain.com/oss/javascript/langgraph/interrupts)

**Ponowienia i utrata procesu.** Użyj unikalnego powiązania sesji ze sprawą i atomowego mechanizmu w Postgres, który dopuszcza jednego wykonawcę danej operacji na wątek. Przykładowo dodaj do wiersza token operacji z wygasającą dzierżawą dłuższą od maksymalnego czasu wywołania. Zajmuj i zwalniaj dzierżawę warunkowo, sprawdzając token. Po przejęciu odczytaj najnowszy checkpoint. Jeśli zawiera oczekiwany rezultat, zwróć go. Jeśli przerwanie nadal czeka, wznów je raz. Start po przerwanym pierwszym uruchomieniu ma kontynuować zapisane wykonanie zgodnie z API trwałego wykonania w zainstalowanej wersji. Dwa zgodne kliknięcia mają zwrócić jeden wynik, a sprzeczny wybór ze starej karty ma dostać 409 i aktualny widok. Zwracaj sukces dopiero po potwierdzonym zapisie. Przy awarii Neon ekran proponuje ponowienie. [Trwały stan grafu](https://docs.langchain.com/oss/javascript/langgraph/persistence) · [Wznowienie zapisanego wykonania](https://docs.langchain.com/oss/javascript/langgraph/durable-execution)

## 4. Kolejność prac i próba odbioru

1. **Lokalnie.** Opus dodaje skrypty, graf, endpointy, ekran i jeden test przepływu. Z katalogu aplikacji uruchamia kolejno `npm ci`, `npm run zusik:migrate`, `npm run zusik:seed-probe`, testy, `npm run lint` oraz `npm run build`. Migracja i seed wskazują zasoby demonstracyjne. Klucze administratora są zbędne przy buildzie i uruchomieniu aplikacji. Gdy dostępy są w przygotowaniu, Opus może ukończyć i sprawdzić kod na kontrolowanych odpowiedziach testowych. Wyniki poniższych prób na Preview raportuje oddzielnie.
2. **Start na wdrożeniu A.** Otwórz stały adres gałęzi. Uruchom próbę z czystej sesji aplikacji. Oczekuj rzeczywistej polskiej odpowiedzi Sherlocka, `probe-opieka` z Qdrant i stanu `awaiting_choice`. Zapisz z odpowiedzi API testowe identyfikatory wątku, znacznika, checkpointu i oczekującego przerwania. Weryfikuj pełne identyfikatory w teście, na ekranie wystarczą skróty. Zapisz czas wywołań i wersję wdrożenia.
3. **F5 przed wyborem.** Wyczyść `localStorage` i `sessionStorage`, zachowując cookie. Przeładuj stronę. W narzędziach sieciowych sprawdź nowy GET stanu. Oczekuj tych samych czterech identyfikatorów, tego samego pytania i dwóch aktywnych przycisków. Log serwera nie powinien pokazać ponownego startu ani wywołań Sherlocka i Qdrant.
4. **Dowód odczytu z Neon po utracie procesu.** Zamknij kartę. Wdróż ponownie ten sam commit na tę samą gałąź. Potwierdź w Vercelu inne ID wdrożenia B oraz przypisanie stałego adresu do B. Otwórz ten adres w dotychczasowej sesji. Pierwszy GET na B ma odtworzyć checkpoint z A i to samo oczekujące przerwanie. Dodatkowo operator odczytuje w Neon rekordy checkpointów dla testowego wątku i potwierdza obecność ID checkpointu z A. Użyj nazwy tabeli z faktycznie zainstalowanej wersji savera. To rozstrzyga, skąd pochodzi stan.
5. **Prawdziwe wznowienie na B.** Kliknij „Kolejno”. Test widzi osobny POST `resume`, ten sam wątek i znacznik, nowy checkpoint, zapisany wybór, koniec grafu i brak oczekującego przerwania. Ponowne F5 pokazuje ten ukończony wynik. Powtórz ten sam POST i zasymuluj dwa jednoczesne kliknięcia na nowej próbie. W każdym przypadku powstaje jeden zaakceptowany wybór. Sprzeczny POST ze starym checkpointem nie może go nadpisać.
6. **Izolacja sesji.** Otwórz ten sam adres w nowym kontekście przeglądarki, zaloguj się do ochrony Vercela, ale bez ciasteczka Marty. GET ma zwrócić pusty stan. Próba przesłania identyfikatora wątku Marty w żądaniu drugiej sesji ma być odrzucona albo zignorowana, bez ujawnienia pytania i wyboru Marty. Uszkodzony podpis cookie również nie daje dostępu.
7. **Kontrolowane awarie.** W testach podstaw kolejno błędny JSON, 429, timeout Sherlocka, brak trafienia Qdrant i błąd zapisu Neon. Pierwsze trzy przypadki pozostawiają przyciski i odróżnialny status dostawcy. Czwarty pokazuje brak źródła. Przy błędzie Neon UI nie potwierdza zapisu. Symuluj też utratę odpowiedzi HTTP po zapisanym wyborze i ponów żądanie. Wystarczy test integracyjny z kontrolowanym błędem, bez celowego wyczerpywania limitu dostawcy.

**Co Opus oddaje.** Jeden chroniony URL gałęzi, SHA commitu, identyfikatory deploymentów A i B, wynik builda i testów oraz poniższą tabelę w raporcie. Wpisuje zaobserwowane wartości. Dla niewykonanych prób podaje konkretny brak dostępu lub błąd. Do raportu wystarczą skrócone identyfikatory i statusy, bez cookies, DSN, nagłówków autoryzacji ani treści akt.

| Pomiar | Start A | F5 na A | Pierwszy GET na B | Po wyborze na B | F5 po wyborze |
|---|---|---|---|---|---|
| Wątek oraz znacznik | zapisz oba | oba te same | oba te same | oba te same | oba te same |
| Checkpoint | zapisz C1 | C1 | C1 | zapisz C2 | C2 |
| Oczekujące przerwanie | zapisz I1 | I1 | I1 | brak | brak |
| Wybór | pusty | pusty | pusty | kolejno | kolejno |
| Nowe wywołania dostawców | Sherlock i Qdrant | 0 | 0 | 0 | 0 |

**Jeśli próba utknie.** Sherlock 401/403 oznacza, że najpierw sprawdzamy klucz i dostęp projektu, a przy błędzie modelu porównujemy ID z katalogiem. W Qdrant sprawdzamy kolejno adres klastra, zakres klucza, obecność dwóch punktów, model i rozmiar wektora. Jeśli A działa, a B otwiera pustą sprawę, porównujemy host, obecność i ważność cookie, wersję sekretu podpisu, gałąź Neon oraz powiązanie sesji z wątkiem. Jeżeli wątek jest ten sam, ale graf zaczyna od początku, sprawdzamy konfigurację savera, zapisany checkpoint i to, czy ekran wykonał GET stanu. Po dwóch nieudanych próbach usunięcia tego samego problemu Opus raportuje wynik i możliwe dalsze działania zgodnie z instrukcjami repozytorium.

## Prompt do przekazania Opusowi

> Wdróż wyłącznie krok 1 etapu 1 Zusika zgodnie z tym dokumentem i sekcją „Etap 1” w TECH-SPEC-AGENT.md. Pracuj w istniejącym projekcie Next.js w maskotka_kod. Zacznij od sprawdzenia konfiguracji repo, dostępnych nazw zmiennych i wersji bibliotek. Następnie przygotuj skrypty inicjalizacji Neon i Qdrant, backend grafu z trwałym checkpointem, chroniony sesją odczyt stanu, ekran próby i testy z sekcji 4. Model ma zadać po polsku pytanie na podstawie odszukanego fragmentu. Po wyborze zapisz wartość w tym samym wątku. Użyj prawdziwych usług w pozytywnej próbie Preview. Wykonaj test pomiędzy deploymentami A i B oraz test izolacji drugiego użytkownika. Oddaj URL, commit i wypełnioną tabelę wyników. Gdy brakuje dostępu, wskaż jedną konkretną czynność dla właściciela konta i dokończ niezależne prace. Nie proś o wklejanie sekretów do czatu. Zachowaj instrukcje repozytorium dotyczące builda, commitów i zakresu zmian.
