# Zusik · aplikacja

Produkcyjna aplikacja Next.js. Układ folderów i zasady: [ARCHITECTURE.md](ARCHITECTURE.md). Obecny zakres: etap 1, krok 1 z [PLAN-ETAP-1-KROK-1.md](../PLAN-ETAP-1-KROK-1.md). Ekran próby jest pod `/demo/polaczenia`, celowo bez stylów.

## Polecenia (z katalogu `app/`, Node 24)

| Polecenie | Co robi |
|---|---|
| `npm ci` | Instaluje zależności z lockfile |
| `npm run zusik:migrate` | Neon: schemat `zusik`, tabele checkpointów LangGraph, `demo_cases`, uprawnienia roli runtime. Gdy jest `DATABASE_URL`, sprawdza zapis i odczyt checkpointu tą rolą. Można uruchamiać wielokrotnie |
| `npm run zusik:seed-probe` | Qdrant: tworzy lub sprawdza `zusik_probe_v1` (384, Cosine), zapisuje 2 punkty testowe, sprawdza oba pytania wyszukiwaniem wektorowym |
| `npm run zusik:import-marta` | Qdrant: tworzy lub sprawdza `zusik_marta_v1` (384, Cosine), indeksy payload, wgrywa korpus z `corpus/marta/` (stałe UUID, `wait=true`), porównuje ID i hashe. Odmawia zmiany treści już wgranej wersji. Z `QDRANT_KNOWLEDGE_READ_KEY` sprawdza, że klucz aplikacji czyta i nie może pisać |
| `npm run zusik:eval-marta` | Ocena RAG na `corpus/marta/eval.json` (rzeczywiste Qdrant + Bielik), raport w `corpus/marta/eval-report.md`. `-- --set calibration` dla pytań roboczych, `-- --retrieval-only` bez modelu |
| `npm test` | Testy Vitest z kontrolowanymi dostawcami (sekcja 4 planu) |
| `npm run lint` · `npm run build` | Lint i build. Build nie potrzebuje żadnych sekretów |

## Zmienne środowiskowe (tylko nazwy)

Wartości są w menedżerze haseł i w Vercelu (Preview, zakres gałęzi). Nigdy nie trafiają do Git ani do czatu. Wszystkie są serwerowe, bez `NEXT_PUBLIC_`.

| Zmienna | Gdzie | Sekret |
|---|---|---|
| `SHERLOCK_BASE_URL` (`https://api-sherlock.cloudferro.com/openai/v1`) | Vercel Preview | |
| `SHERLOCK_MODEL` (dokładne `id` z `GET /models`) | Vercel Preview | |
| `SHERLOCK_API_KEY` | Vercel Preview | Tak |
| `QDRANT_URL` | Vercel Preview, operator | |
| `QDRANT_COLLECTION` (`zusik_probe_v1`) | Vercel Preview, operator | |
| `QDRANT_READ_KEY` | Vercel Preview | Tak |
| `DATABASE_URL` (pooled `-pooler`, rola `zusik_runtime`) | Vercel Preview, operator | Tak |
| `SESSION_SIGNING_SECRET` (`openssl rand -base64 32`, ta sama przy redeployu) | Vercel Preview | Tak |
| `QDRANT_KNOWLEDGE_COLLECTION` (`zusik_marta_v1`) | Vercel, operator | |
| `QDRANT_KNOWLEDGE_READ_KEY` (tylko odczyt tej kolekcji) | Vercel | Tak |
| `QDRANT_WRITE_KEY` | Tylko operator | Tak |
| `MIGRATION_DATABASE_URL` (bezpośredni, rola właściciela) | Tylko operator | Tak |
| `ZUSIK_RUNTIME_ROLE` (domyślnie `zusik_runtime`), `QDRANT_EMBED_MODEL` | Opcjonalne | |

Brak zmiennej daje odpowiedź `500 {"error":"config_missing","variable":"<NAZWA>"}`. Odczyt stanu potrzebuje tylko `DATABASE_URL` i `SESSION_SIGNING_SECRET`.

## Vercel

Root Directory `app`, Framework Next.js, `npm ci`, `npm run build`, Node 24. Endpointy działają w Node.js z `maxDuration = 30`. Limit czasu Sherlocka to 8 s, Qdrant 5 s, dzierżawa operacji 90 s.

## Odbiór demo

Wejście rodzica to `/app`. W tej samej sesji można przejść do `/app/kamil` i `/app/chorobowe`. Daty i kwoty obliczają reguły. Zatwierdzony wniosek Marty i druk ZAM można pobrać. Przekazanie jest symulacją. Podgląd oryginałów wgranych przez rodzica jest lokalny w przeglądarce.

- `npm run zusik:acceptance -- https://straylight-hacknation.vercel.app` uruchamia sześć nowych spraw w osobnych profilach Chrome oraz test cytowanej odpowiedzi po F5. Na laptopie wymaga zainstalowanego Google Chrome. Drugi argument, np. `M1,K1,D1,RAG`, wybiera próby.
- [Korpus i polecenia eval](corpus/README.md) opisują źródła, import Qdrant, klucze odczytu i powtarzanie oceny.
- [Instrukcja serwera modeli](MODELE-NA-VERCELU.md) opisuje połączenie Vercela z laptopem. [Lokalny pomiar obu modeli](corpus/local-models.md) dotyczy identycznych promptów ze wskazanymi fragmentami.
- Prywatne akta można przeszukać lokalnie przez `python3 scripts/private-case-index.py search "okres ubezpieczenia" --locations`. Wynik wskazuje dokument przez SHA i numer strony. Wspólna aplikacja na Vercelu korzysta z publicznych przepisów oraz z danych bieżącej sesji.
