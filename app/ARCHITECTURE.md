# Zusik · architektura aplikacji `app/`

**Stan z 21.11.2026.** `app/` jest docelowym miejscem aplikacji Zusika. Wchodzi tu tylko kod produkcyjny: przejrzany, z testami i bez eksperymentów. Prototypy powstają poza nią: maskotka w `maskotka_kod/`, makiety w `Przewodnik-Rodzica.html` i `ui/`. Kod przenosimy do `app/` dopiero po akceptacji.

**Źródła prawdy:** treść i zachowanie ekranów opisują [SPEC.md](../SPEC.md), [SPEC-PO-LOGOWANIU.md](../SPEC-PO-LOGOWANIU.md) i [SPEC-PANEL-ADMINISTRACYJNY.md](../SPEC-PANEL-ADMINISTRACYJNY.md). Agent i dane: [TECH-SPEC-AGENT.md](../TECH-SPEC-AGENT.md). Wygląd: [DESIGN.md](../DESIGN.md). Tokeny z DESIGN.md są w `src/app/globals.css`: obszar rodzica czyta je jako `@theme` Tailwinda v4, strona główna i logowanie (`[data-site]`) jako zmienne CSS w CSS Modules. Wyjątek to panel administracyjny: ma układ z sekcji 14 speca i tokeny z [DESIGN.md](../DESIGN.md) (CSS Modules w `features/admin/admin.module.css`, kroje Literata i Inter przez `next/font/google`). Wartości, które aplikacja już stosuje (urlop ojcowski, warunki zasiłku chorobowego, wzór ZAM, źródła wiedzy, sprawy liczone regułą ojcowską), panel czyta z kodu przez `lib/admin/catalog.ts` i oznacza „W aplikacji”. Parametry z rejestru `lib/admin/parameter-changes.ts` (wymiar ojcowski, stawki, kwota świadczenia rodzicielskiego, próg płatnika, płaca minimalna, statusy formularzy) da się zmienić w panelu naprawdę: szkic, „Sprawdź zmianę” na prawdziwej regule, publikacja od daty i wpis w historii. Jeden widok (`features/admin/parameter-change-view.tsx`) obsługuje je wszystkie. Reguły (`lib/rules/paternity.ts`, `rates.ts`, `payer.ts`, `arrears.ts`) biorą wartość z harmonogramu w `lib/rules/parameters.ts` na dzień zdarzenia, a bez harmonogramu działają na wartościach z kodu (`DEFAULTS`). Nowy zmienny parametr: wpis w `RULE_PARAMETERS` i `DEFAULTS` oraz `ChangeSpec` w rejestrze. Wersje są zapisane w podpisanym ciasteczku sesji demo, więc zmiana jurora nie trafia do innych, a kolejna sesja zaczyna od wartości z kodu (SPEC-PANEL §10). Organizacje wsparcia edytuje się tak samo w sesji demo (`lib/admin/support-edits.ts`, `support-store.ts`, ciasteczko `zusik_support`). Wdrożenie produkcyjne przeniesie ten sam stan do bazy. Pozostałe parametry ze specu i część wpisów historii są przykładowe (`features/admin/mock-data.ts`), oznaczone „Ze specyfikacji”.

## Stos

Next.js 16 (App Router, folder `src/`), React 19, TypeScript strict, npm, Node 24. Backend działa w Node.js na Vercelu. Graf rozmowy obsługuje LangGraph.js z `PostgresSaver` na Neon. Odpowiedzi modelu waliduje Zod. Z Bielikiem w Sherlock (CloudFerro) łączy się Vercel AI SDK z dostawcą OpenAI-compatible. Wyszukiwanie to Qdrant Cloud z Cloud Inference (`intfloat/multilingual-e5-small`, 384 wymiary). Style: Tailwind CSS v4, kroje Literata i Inter przez `next/font/google`. Testy uruchamia Vitest.

## Podział na warstwy

Ruch idzie w jedną stronę: **trasa → funkcja → biblioteka domenowa → usługi zewnętrzne**. Niższa warstwa nie importuje wyższej.

| Warstwa | Folder | Co tam jest | Czego tam nie ma |
|---|---|---|---|
| Trasy | `src/app/` | Strony i endpointy `route.ts`: odczyt sesji, walidacja wejścia, wywołanie domeny, odpowiedź HTTP | Logika biznesowa, SQL, wywołania dostawców |
| Funkcje | `src/features/<obszar>/` | Komponenty i hooki jednego obszaru produktu, np. kalkulatora albo czatu | Kod współdzielony przez kilka obszarów |
| UI wspólne | `src/components/` | `ui/`: elementy z DESIGN.md (przyciski, karty wyboru, pola, panel, zakładki, etykiety). `shell/`: pasek z selektorem dziecka, dolny pasek, bąbelek Zusika. `mascot/`: statyczny zastępnik Zusika do czasu przeniesienia Bąbelka | Dane i wywołania API |
| Domena | `src/lib/` | Czysty TypeScript bez Reacta. Każdy moduł ma testy w `tests/` | Komponenty, `next/headers` (poza `lib/zusik/server.ts` i `lib/admin/server.ts`) |
| Dane wejściowe | `corpus/`, `public/` | Manifest źródeł RAG, wzory druków, pliki modelu OCR | Prywatne akta konkursowe (nigdy w repo) |
| Operacje | `scripts/` | Migracje, seed, import korpusu. Uruchamiane ręcznie przez operatora | Kod wykonywany przez aplikację |

## Mapa folderów

Puste foldery mają `.gitkeep`. Są zarezerwowane, nic w nich jeszcze nie ma.

```text
app/
├─ src/
│  ├─ app/                        trasy (URL po polsku, kod po angielsku)
│  │  ├─ (public)/                strona główna: hero, sytuacje, pytania, film, liczby, stopka · SPEC.md
│  │  ├─ (auth)/logowanie/        symulacja mObywatela i wczytanie danych · SPEC.md „Po kliknięciu…”
│  │  ├─ (parent)/                ✅ UI obszaru po zalogowaniu (dane demo) · SPEC-PO-LOGOWANIU.md, ui/MACIEJ.md
│  │  │  ├─ start/                onboarding z Zusikiem (bez paska kart)
│  │  │  └─ (tabs)/               pasek kart, selektor dziecka, dolny pasek, bąbelek Zusika
│  │  │     ├─ plan/              „Mój plan”: ścieżka z pionkiem, najbliższa sprawa, kalkulator
│  │  │     ├─ dokumenty/         „Dokumenty i wnioski”, [id] = szczegóły i przebieg sprawy
│  │  │     ├─ profil/            profil rodziny, konto ZUS, sprawa-testowa/
│  │  │     └─ wsparcie/          widok „Wsparcie”
│  │  ├─ admin/                   ✅ panel na danych przykładowych · SPEC-PANEL-ADMINISTRACYJNY.md
│  │  │  ├─ page.tsx              ✅ logowanie administratora, bez rejestracji (actions.ts: zaloguj, wyloguj)
│  │  │  └─ (panel)/              widoki za logowaniem, sidebar; każda strona woła requireAdmin()
│  │  │     ├─ reguly/            ✅ kafle, parametry w grupach, panel boczny parametru
│  │  │     ├─ tresci/            ✅ źródła wiedzy Zusika z manifestów korpusu
│  │  │     ├─ sprawy-testowe/    ✅ kafle-filtry, lista z wyszukiwaniem, szczegóły
│  │  │     ├─ zmiany/            ✅ „Przygotuj zmianę”: formularz, wpływ na rodzinę, sprawdzenie
│  │  │     └─ historia/          ✅ tabela publikacji, panel boczny wpisu
│  │  ├─ api/zusik/               ✅ etap 1 krok 1: POST start/resume, GET state, POST session
│  │  └─ demo/polaczenia/         ✅ ekran próby (tymczasowy, do usunięcia po etapie 1)
│  ├─ features/                   ✅ onboarding · family · journey-map · calculator · documents · support; dalej landing · chat · admin
│  ├─ components/                 ui/ · mascot/
│  └─ lib/
│     ├─ admin/                   ✅ logowanie (auth.ts, server.ts), katalog wartości z kodu (catalog.ts, scenarios.ts), wersje parametrów (rule-versions.ts, rule-store.ts, change-checks.ts, parameter-changes.ts), zmiany organizacji wsparcia (support-edits.ts, support-store.ts)
│     ├─ zusik/                   ✅ agent: graf, sesja, Qdrant, Sherlock, magazyn spraw z dzierżawą
│     ├─ demo/                    ✅ typy i dane fikcyjne widoków rodzica (do podmiany na API)
│     ├─ plan/                    ✅ reguła pionka, najbliższa sprawa, model statusów
│     ├─ support/                 ✅ organizacje wsparcia (zadanie s. 13 pkt i), dane ze stron organizacji z datą weryfikacji
│     ├─ rules/                   reguły świadczeń w TS: daty, kwoty, zaokrąglenia, ID reguły
│     ├─ rag/                     podział źródeł, import, wyszukiwanie hybrydowe, cytaty po ID
│     ├─ cases/                   szkic sprawy: fakty ze źródłem, wersja, klucz operacji
│     ├─ forms/                   wniosek z szablonu HTML i ZAM w pdf-lib
│     ├─ ocr/                     PDF.js i Tesseract.js (polski) w Web Workerze
│     └─ db/                      wspólne połączenie i schemat (dziś w lib/zusik)
├─ corpus/                        manifest źródeł publicznych: URL, data pobrania, okres obowiązywania
├─ public/forms/  public/ocr/     wzory druków, pliki modelu OCR
├─ scripts/                       ✅ zusik:migrate, zusik:seed-probe
└─ tests/                         ✅ testy Vitest
```

## Kolejność wypełniania (wg TECH-SPEC-AGENT.md „Etap 1”)

| Krok | Moduły | Warunek wejścia do `app/` |
|---|---|---|
| 1 ✅ kod | `lib/zusik`, `api/zusik`, `demo/polaczenia`, `scripts/` | Testy, lint i build zielone. Próba na Preview czeka na dostęp do usług |
| 2 | `lib/rag`, `corpus/` | Trzy pytania trafiają we właściwy fragment, pytanie spoza korpusu daje „brak podstawy” |
| 3 | `lib/rules` (`parental-leave.ts`), rozszerzenie grafu | 11.01.2027 → 6860 zł, 28 dni razem lub 56 dni kolejno |
| 4 | `lib/cases`, `lib/forms`, `features/documents` | Dwa kliknięcia dają jeden szkic, termin Marty przy wspólnym starcie to 21.12.2026 |
| UI ✅ | `features/*` i trasy `(parent)` na danych demo | Typy, lint, testy i build zielone. Podłączenie API: miejsca oznaczone `TODO(backend)` |
| Później | Trasy `(public)` (Bartek), `admin` (Nikodem), panel czatu (Julian, `TODO(julian)`) | Według ich UI speców |
| Później | `lib/ocr` | Po decyzji o zakresie danych dopuszczonych do OCR |

## Zasady stałe

- **Dane osobowe.** Klucze dostawców istnieją wyłącznie w backendzie. Logi zapisują identyfikatory operacji, czasy i kody błędów, nigdy treść akt. Do dostawców trafiają tylko publiczne fragmenty i fikcyjny profil.
- **Właściciel sprawy.** Każdy odczyt i zapis sprawdza właściciela po stronie serwera. Identyfikator wątku nigdy nie przychodzi z przeglądarki.
- **Model proponuje, kod liczy.** Kwoty i terminy liczą funkcje w `lib/rules`. Model tylko formułuje tekst i wybiera dozwolone narzędzie.
- **Idempotencja.** Powtórzone żądanie z tym samym kluczem nie tworzy drugiego szkicu, przypomnienia ani wysyłki.
- **Wartości wyglądu** pochodzą tylko z tokenów DESIGN.md (`globals.css`). Wartości spoza tokenów mają w kodzie dopisek „do weryfikacji”. Czat Zusika ma osobny styl z `ui/JULIAN.md`.

## Wdrożenie

Ustawienia projektu w Vercelu: **Root Directory `app`**, Framework Next.js, `npm ci`, `npm run build`, Node 24. Uwaga: [PLAN-ETAP-1-KROK-1.md](../PLAN-ETAP-1-KROK-1.md) podaje jeszcze `maskotka_kod`. Obowiązuje `app`. Nazwy zmiennych i polecenia operatora opisuje [README.md](README.md).

## Otwarte decyzje

1. **RLS na tabelach prywatnych.** Spec agenta wymaga RLS osobno dla operacji i roli. Krok 1 ma jedną rolę runtime, a właściciela sprawdza w kodzie. RLS dodamy razem z tabelą szkiców w kroku 4.
2. **Nazwy URL** po polsku: `/start`, `/plan`, `/dokumenty`, `/profil`, `/wsparcie`. Kalkulator jest sekcją `/plan#kalkulator`, bo według specu leży pod mapą.
3. **Przeniesienie maskotki** z `maskotka_kod/components/mascot` do `src/components/mascot` po zakończeniu prac nad animacją.
