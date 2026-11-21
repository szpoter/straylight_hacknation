# Zusik · architektura aplikacji `app/`

**Stan z 21.11.2026.** `app/` jest docelowym miejscem aplikacji Zusika. Wchodzi tu tylko kod produkcyjny: przejrzany, z testami i bez eksperymentów. Prototypy powstają poza nią: maskotka w `maskotka_kod/`, makiety w `Przewodnik-Rodzica.html` i `ui/`. Kod przenosimy do `app/` dopiero po akceptacji.

**Źródła prawdy:** treść i zachowanie ekranów opisują [SPEC.md](../SPEC.md), [SPEC-PO-LOGOWANIU.md](../SPEC-PO-LOGOWANIU.md) i [SPEC-PANEL-ADMINISTRACYJNY.md](../SPEC-PANEL-ADMINISTRACYJNY.md). Agent i dane: [TECH-SPEC-AGENT.md](../TECH-SPEC-AGENT.md). Wygląd: [design/](../design/README.md). Wygląd nie jest jeszcze gotowy, więc większość ekranów w `app/` nie ma stylów i pokazuje samo zachowanie. Wyjątek to panel administracyjny: ma układ z sekcji 14 speca i tokeny z [DESIGN.md](../DESIGN.md) (CSS Modules w `features/admin/admin.module.css`, kroje Literata i Inter przez `next/font/google`). Dane panelu są przykładowe (`features/admin/mock-data.ts`), dopóki nie powstanie `lib/rules`.

## Stos

Next.js 16 (App Router, folder `src/`), React 19, TypeScript strict, npm, Node 24. Backend działa w Node.js na Vercelu. Graf rozmowy obsługuje LangGraph.js z `PostgresSaver` na Neon. Odpowiedzi modelu waliduje Zod. Z Bielikiem w Sherlock (CloudFerro) łączy się Vercel AI SDK z dostawcą OpenAI-compatible. Wyszukiwanie to Qdrant Cloud z Cloud Inference (`intfloat/multilingual-e5-small`, 384 wymiary). Testy uruchamia Vitest.

## Podział na warstwy

Ruch idzie w jedną stronę: **trasa → funkcja → biblioteka domenowa → usługi zewnętrzne**. Niższa warstwa nie importuje wyższej.

| Warstwa | Folder | Co tam jest | Czego tam nie ma |
|---|---|---|---|
| Trasy | `src/app/` | Strony i endpointy `route.ts`: odczyt sesji, walidacja wejścia, wywołanie domeny, odpowiedź HTTP | Logika biznesowa, SQL, wywołania dostawców |
| Funkcje | `src/features/<obszar>/` | Komponenty i hooki jednego obszaru produktu, np. kalkulatora albo czatu | Kod współdzielony przez kilka obszarów |
| UI wspólne | `src/components/` | `ui/`: elementy z design systemu (po akceptacji `design/`). `mascot/`: Bąbelek przeniesiony z `maskotka_kod/components/mascot` | Dane i wywołania API |
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
│  │  ├─ (parent)/                obszar po zalogowaniu · SPEC-PO-LOGOWANIU.md
│  │  │  ├─ start/                pierwsza rozmowa i ekran główny z wyborem dziecka
│  │  │  ├─ mapa/                 cztery etapy, karta sprawy, ostrzeżenia
│  │  │  ├─ kalkulator/           „Ile czasu i jaki zasiłek?”
│  │  │  ├─ dokumenty/            „Dokumenty i wnioski”, statusy, „Dokończ z Zusikiem”
│  │  │  ├─ profil/               profil rodziny, konto ZUS, przykładowa sprawa
│  │  │  └─ wsparcie/             widok „Wsparcie” i sprawy spoza ZUS
│  │  ├─ admin/                   ✅ panel na danych przykładowych · SPEC-PANEL-ADMINISTRACYJNY.md
│  │  │  ├─ page.tsx              ✅ logowanie administratora, bez rejestracji (actions.ts: zaloguj, wyloguj)
│  │  │  └─ (panel)/              widoki za logowaniem, sidebar; każda strona woła requireAdmin()
│  │  │     ├─ reguly/            ✅ kafle, parametry w grupach, panel boczny parametru
│  │  │     ├─ tresci/            treści i źródła (miejsce w menu, bez widoku)
│  │  │     ├─ sprawy-testowe/    ✅ kafle-filtry, lista z wyszukiwaniem, szczegóły
│  │  │     ├─ zmiany/            ✅ „Przygotuj zmianę”: formularz, wpływ na rodzinę, sprawdzenie
│  │  │     └─ historia/          ✅ tabela publikacji, panel boczny wpisu
│  │  ├─ api/zusik/               ✅ etap 1 krok 1: POST start/resume, GET state, POST session
│  │  └─ demo/polaczenia/         ✅ ekran próby (tymczasowy, do usunięcia po etapie 1)
│  ├─ features/                   landing · onboarding · family · journey-map · calculator · chat · documents · support · admin
│  ├─ components/                 ui/ · mascot/
│  └─ lib/
│     ├─ admin/                   ✅ logowanie panelu: hash scrypt, podpisana sesja z wygaśnięciem (server.ts: cookies)
│     ├─ zusik/                   ✅ agent: graf, sesja, Qdrant, Sherlock, magazyn spraw z dzierżawą
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
| Później | `features/*` i trasy `(public)`, `(parent)`, `admin` | Po akceptacji `design/` i makiet w `ui/` |
| Później | `lib/ocr` | Po decyzji o zakresie danych dopuszczonych do OCR |

## Zasady stałe

- **Dane osobowe.** Klucze dostawców istnieją wyłącznie w backendzie. Logi zapisują identyfikatory operacji, czasy i kody błędów, nigdy treść akt. Do dostawców trafiają tylko publiczne fragmenty i fikcyjny profil.
- **Właściciel sprawy.** Każdy odczyt i zapis sprawdza właściciela po stronie serwera. Identyfikator wątku nigdy nie przychodzi z przeglądarki.
- **Model proponuje, kod liczy.** Kwoty i terminy liczą funkcje w `lib/rules`. Model tylko formułuje tekst i wybiera dozwolone narzędzie.
- **Idempotencja.** Powtórzone żądanie z tym samym kluczem nie tworzy drugiego szkicu, przypomnienia ani wysyłki.
- **Wartości wyglądu** pochodzą tylko z `design/tokeny.md`. Czat Zusika ma osobny styl z `ui/JULIAN.md`.

## Wdrożenie

Ustawienia projektu w Vercelu: **Root Directory `app`**, Framework Next.js, `npm ci`, `npm run build`, Node 24. Uwaga: [PLAN-ETAP-1-KROK-1.md](../PLAN-ETAP-1-KROK-1.md) podaje jeszcze `maskotka_kod`. Obowiązuje `app`. Nazwy zmiennych i polecenia operatora opisuje [README.md](README.md).

## Otwarte decyzje

1. **RLS na tabelach prywatnych.** Spec agenta wymaga RLS osobno dla operacji i roli. Krok 1 ma jedną rolę runtime, a właściciela sprawdza w kodzie. RLS dodamy razem z tabelą szkiców w kroku 4.
2. **Nazwy URL** po polsku (`/mapa`, `/kalkulator`). Do potwierdzenia z zespołem przed pierwszym ekranem.
3. **Przeniesienie maskotki** z `maskotka_kod/components/mascot` do `src/components/mascot` po zakończeniu prac nad animacją.
