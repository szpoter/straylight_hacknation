# Zusik · aplikacja

Produkcyjna aplikacja Next.js. Układ folderów i zasady: [ARCHITECTURE.md](ARCHITECTURE.md). Obecny zakres: etap 1, krok 1 z [PLAN-ETAP-1-KROK-1.md](../PLAN-ETAP-1-KROK-1.md). Ekran próby jest pod `/demo/polaczenia`, celowo bez stylów.

## Polecenia (z katalogu `app/`, Node 24)

| Polecenie | Co robi |
|---|---|
| `npm ci` | Instaluje zależności z lockfile |
| `npm run zusik:migrate` | Neon: schemat `zusik`, tabele checkpointów LangGraph, `demo_cases`, uprawnienia roli runtime. Gdy jest `DATABASE_URL`, sprawdza zapis i odczyt checkpointu tą rolą. Można uruchamiać wielokrotnie |
| `npm run zusik:seed-probe` | Qdrant: tworzy lub sprawdza `zusik_probe_v1` (384, Cosine), zapisuje 2 punkty testowe, sprawdza oba pytania wyszukiwaniem wektorowym |
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
| `QDRANT_WRITE_KEY` | Tylko operator | Tak |
| `MIGRATION_DATABASE_URL` (bezpośredni, rola właściciela) | Tylko operator | Tak |
| `ZUSIK_RUNTIME_ROLE` (domyślnie `zusik_runtime`), `QDRANT_EMBED_MODEL` | Opcjonalne | |

Brak zmiennej daje odpowiedź `500 {"error":"config_missing","variable":"<NAZWA>"}`. Odczyt stanu potrzebuje tylko `DATABASE_URL` i `SESSION_SIGNING_SECRET`.

## Vercel

Root Directory `app`, Framework Next.js, `npm ci`, `npm run build`, Node 24. Endpointy działają w Node.js z `maxDuration = 30`. Limit czasu Sherlocka to 8 s, Qdrant 5 s, dzierżawa operacji 90 s.
