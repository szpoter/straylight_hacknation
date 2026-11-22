# Zusik · Przewodnik Rodzica

Aplikacja webowa, w której rodzic sprawdza, jakie świadczenia rodzicielskie mu przysługują, liczy zasiłek dla obojga rodziców i przygotowuje wnioski do pracodawcy lub ZUS. Odpowiada na zadanie konkursowe ZUS na HackNation 2026.

**[Otwórz demo](https://straylight-hacknation.vercel.app)** · [Zrzuty ekranu](zgloszenie/)

| Komputer | Telefon |
|---|---|
| ![Plan rodziny](zgloszenie/plan.jpg) | ![Plan na telefonie](zgloszenie/plan-telefon.jpg) |
| ![Kalkulator](zgloszenie/kalkulator.jpg) | ![Kalkulator na telefonie](zgloszenie/kalkulator-telefon.jpg) |

Logowanie mObywatelem, pobranie danych rodziny z ZUS i przekazanie wniosku są symulacjami. Wyliczenia kwot, okresów i uprawnień robi prawdziwy kod reguł z testami.

## Problem

Przyszły rodzic musi sam złożyć informacje z ustawy zasiłkowej, Kodeksu pracy, poradnika ZUS i stron gov.pl. Nie wie, czy ma ubezpieczenie chorobowe, ile dostanie przy wariancie 100% lub 81,5%, jak podzielić urlop z drugim rodzicem ani który wniosek składa się u pracodawcy, a który w ZUS. Błąd, np. przerwa w ubezpieczeniu w dniu porodu, wychodzi dopiero w decyzji odmownej.

## Co zbudowaliśmy

- **Plan rodziny.** Ścieżka od ciąży przez narodziny do kolejnych terminów. Przy każdej sprawie: co przygotować, komu złożyć, do kiedy.
- **Jeden kalkulator dla obojga rodziców.** Macierzyński, rodzicielski, ojcowski, wariant 100% lub 81,5%, liczba dzieci, adopcja i rodzina zastępcza, łączenie urlopu z pracą, wskazanie, kto wypłaca zasiłek.
- **Sprawdzenie ubezpieczenia na sprawach z zestawu ZUS.** Ekran `/sprawdz` rozstrzyga prawo do zasiłku regułami i pokazuje przepis, na którym oparto wynik. Można wybrać sprawę z zestawu albo wgrać PDF, który aplikacja odczytuje OCR w przeglądarce.
- **Wnioski.** 11 wzorów, w tym oficjalny ZAM, SR-2 i deklaracja POZ. Dla 9 z nich aplikacja generuje wypełniony PDF.
- **Zusik.** Asystent odpowiada na pytania z przypisami do przepisów i poradnika ZUS.
- **Panel administratora.** Zmiana parametrów (stawki, wymiary urlopów, progi) ze sprawdzeniem na sprawach testowych i publikacją od wskazanej daty.

## Jak sprawdzić projekt

1. **Ubezpieczenie na sprawie z zestawu.** W demo wejdź w **Profil → Sprawdź sprawę z zestawu ZUS**. Wybierz jedną z 10 spraw (6 odmów, 4 przyznania) i porównaj wynik z decyzją ZUS. Możesz też użyć **Wgraj PDF sprawy**: odczyt 14–16 stron trwa ok. 25 s, potem aplikacja proponuje fakty ze wskazaniem strony, a Ty je potwierdzasz.
2. **Kalkulator.** W **Kalkulatorze** rozwiń **Sprawdź przykładową sprawę lub dokument PDF** i wybierz **Pracownica, 81,5% za cały okres**. Dla jednego dziecka urodzonego 3 czerwca 2026 r. i podstawy 5 608,85 zł stawka dzienna wynosi 152,37 zł, a za 28 dni czerwca 4 266,36 zł brutto. Zmień wariant wypłaty i porównaj miesiące.
3. **Wniosek.** Otwórz plan rodziny, wybierz sprawę na ścieżce, w zakładce **Dokumenty** otwórz wniosek, uzupełnij pola i sprawdź podgląd przed przekazaniem.
4. **Symulacje eZUS.** W **Profil → Konto eZUS** są podgląd e-ZLA, przykładowe zaświadczenie o zadłużeniu składkowym (0 zł lub 200 zł) oraz **Zwolnienia e-ZLA → Sprawdź ubezpieczenie na przykładzie** z [fikcyjnym pakietem dokumentów](app/public/demo/sickness/akta-demonstracyjne.pdf).
5. **Zusik.** W profilu wybierz **Otwórz rozmowę z Zusikiem**, zadaj pytanie o urlop lub dołącz fikcyjny PDF i porównaj przypisy ze źródłem.
6. **Panel administratora.** Wejdź na [`/admin`](https://straylight-hacknation.vercel.app/admin) (na czas konkursu logowanie jednym kliknięciem). W **Sprawy testowe** porównaj K-06 (odmowa, brak ubezpieczenia) i K-08 (brak informacji). Instrukcja zmiany parametru: [ZGLOSZENIE-PANEL-ADMINISTRACYJNY.md](ZGLOSZENIE-PANEL-ADMINISTRACYJNY.md).

## Stan funkcji

| Funkcja | Stan | Uwagi |
|---|---|---|
| Kalkulator, okresy i kwoty | Działa | 7 spraw z zestawu: 3 z kwotami zgodnymi z decyzjami co do grosza, 4 z okresami zgodnymi z pismami ZUS (testy) |
| `/sprawdz`, wybór sprawy z zestawu | Działa | Wynik zgodny z decyzją ZUS w 10 z 10 spraw |
| `/sprawdz`, wgranie PDF | Częściowo | OCR odczytuje rolę, okres, tytuł ubezpieczenia, zadłużenie. Daty z kratek i pismo odręczne często trzeba wpisać ręcznie |
| PDF → podstawa w kalkulatorze | Częściowo | Na skanach z zestawu kwota podstawy zwykle nie zostaje rozpoznana i wpisuje się ją ręcznie |
| Plan rodziny | Częściowo | Jedna rodzina demonstracyjna. Własne dane wpisuje się w kalkulatorze i na `/sprawdz` |
| Ostrzeżenia o ryzyku utraty świadczeń | Częściowo | Ogólny przystanek z ryzykami i odmowy na `/sprawdz`. Ostrzeżenia dopasowane do sytuacji rodziny nie są włączone |
| Wnioski i PDF | Działa | 11 wzorów, PDF dla 9. 800+ i zgłoszenie urodzenia bez PDF (tylko kanały elektroniczne) |
| Logowanie mObywatel, import danych, e-ZLA, zaświadczenie o zadłużeniu, przekazanie wniosku | Symulacja | Wygląd i przebieg bez połączenia z systemami państwowymi |
| Panel administratora | Działa w sesji | Zmiany obowiązują w sesji przeglądarki (podpisane ciasteczko). Wdrożenie wymaga trwałej bazy |
| Zusik | Działa, jakość zmienna | Odpowiedzi zależą od modelu i trafienia w korpus. Kwot model nie liczy |

## Wymagania zadania

| Wymaganie (treść zadania) | Gdzie |
|---|---|
| a. Zasiłek chorobowy w ciąży, świadczenie rehabilitacyjne, zasiłek w wysokości macierzyńskiego | Przystanki planu, `app/src/lib/rules/sickness.ts`, `case-maternity.ts`, `/sprawdz` |
| b. Kalkulator okresu i kwoty dla obojga rodziców, liczba dzieci | `app/src/features/calculator/`, `app/src/lib/rules/maternity.ts`, `rates.ts`, `paternity.ts` |
| c. Łączenie pracy z urlopem rodzicielskim | `app/src/lib/rules/parental-work.ts` |
| d. Oboje rodzice korzystają z uprawnień | Kalkulator: przejęcie, rodzicielski kolejno lub razem, 9 tygodni nieprzenoszalnych |
| e, j. Adopcja i niezawodowa rodzina zastępcza | Kalkulator i reguły `/sprawdz` (granice wieku) |
| f. Indywidualna podstawa i symulacja na sprawach z zestawu | `app/src/lib/plan/benefit-presets.ts`, testy w `app/tests/` |
| g. Dokumenty, terminy, płatnik albo ZUS | `app/src/lib/rules/payer.ts`, `app/src/features/documents/` |
| h. Ryzyka utraty lub obniżenia świadczeń | Częściowo, patrz tabela stanu |
| i. Organizacje wsparcia | `/wsparcie`, `app/src/lib/support/` |
| Symulacje: mObywatel, dane z ZUS, zadłużenie, e-ZLA, PUE/eZUS | `app/src/features/auth/`, `app/src/features/family/profile/` |
| Wnioski o urlopy, świadczenia i odpis aktu urodzenia | `app/src/lib/forms/`, `app/src/lib/demo/forms-civil.ts`, `app/public/forms/` |
| Linki do zus.pl, gov.pl, pip.gov.pl | Stopka strony głównej |
| Panel administracyjny do zmiany parametrów | `/admin`, `app/src/lib/admin/`, `app/src/lib/rules/parameters.ts` |
| Test jury: wybór lub upload wniosków PDF | `/sprawdz` i kalkulator |
| RWD, React/Next.js, REST API | Next.js 16, React 19, trasy w `app/src/app/api/` |

## Gdzie działa AI

| Funkcja | Mechanizm |
|---|---|
| Rozmowa z Zusikiem | Model językowy Bielik albo PLLuM (Sherlock, CloudFerro) przez Vercel AI SDK. Wyszukiwanie fragmentów przepisów i poradnika ZUS w Qdrant (`multilingual-e5-small`). Odpowiedź z przypisami |
| Prowadzenie sprawy w rozmowie | LangGraph.js zbiera brakujące fakty. Model pisze tekst, a kwoty, okresy i terminy liczy kod w `app/src/lib/rules` |
| Odczyt dokumentów | PDF.js czyta warstwę tekstową, Tesseract.js (polski model) rozpoznaje skany w przeglądarce. Rodzic potwierdza każdy odczytany fakt |
| Bez AI | Kalkulator, plan, terminy, `/sprawdz` i panel administratora. Wynik daje kod reguł |

**AI w pracy nad projektem.** Claude Code (Anthropic) i Codex (OpenAI) pomagały przy kodzie, testach i materiałach zgłoszeniowych. Głosy w filmie przygotowano w ElevenLabs.

## Rozwiązania zewnętrzne

Zgodnie z § 4 ust. 1 regulaminu:

- **Aplikacja:** Next.js, React, TypeScript, Tailwind CSS, Motion, Flubber, Lenis, kroje Literata, Inter, Domine, DejaVu.
- **AI i dane:** Vercel AI SDK, Bielik, PLLuM, Sherlock (CloudFerro), LangGraph.js, LangChain, Qdrant, multilingual-e5-small, Ollama (opcjonalny lokalny serwer modeli), Neon PostgreSQL, pg, Zod.
- **Dokumenty:** PDF.js, pdf-lib, fontkit, Tesseract.js.
- **Infrastruktura i testy:** Vercel, GitHub Actions, Vitest, Playwright, @napi-rs/canvas.
- **Narzędzia AI:** Claude Code, Codex, ElevenLabs.
- **Treści:** przepisy z Dziennika Ustaw (ELI), poradnik i wzory druków ZUS, gov.pl, PIP, strony organizacji wsparcia. Sprawy w aplikacji to same fakty i liczby z zestawu, bez danych osobowych i bez kopii akt.

## Uruchomienie

Wymagany Node.js 24.

```bash
cd app
npm ci
npm run dev
```

Aplikacja działa pod http://localhost:3000. Kalkulator, plan, `/sprawdz`, wnioski i OCR działają bez kluczy. Zusik i zapis sesji rozmowy wymagają zmiennych środowiskowych (Sherlock, Qdrant, Neon), opisanych w [app/README.md](app/README.md).

```bash
npm test
```

Oczekiwany wynik: `Test Files 79 passed | 1 skipped`, `Tests 696 passed | 9 skipped`.

## Architektura

```mermaid
flowchart LR
  UI["Ekrany<br/>app/src/features"] --> API["REST API<br/>app/src/app/api"]
  UI --> Rules["Reguły świadczeń<br/>app/src/lib/rules"]
  UI --> OCR["OCR w przeglądarce<br/>app/src/lib/ocr"]
  API --> Agent["Zusik, LangGraph<br/>app/src/lib/zusik"]
  Agent --> Rules
  Agent --> LLM["Bielik / PLLuM<br/>Sherlock"]
  Agent --> Q["Qdrant<br/>przepisy i poradnik"]
  Agent --> DB["Neon PostgreSQL<br/>stan rozmowy"]
  Admin["Panel /admin<br/>app/src/lib/admin"] --> Rules
```

Ruch idzie w jedną stronę: trasa, funkcja, biblioteka domenowa, usługa zewnętrzna. Reguły w `app/src/lib/rules` to czysty TypeScript bez Reacta, każdy moduł ma testy w `app/tests`. Szczegóły: [app/ARCHITECTURE.md](app/ARCHITECTURE.md).

## Decyzje

- **Model mówi, kod liczy.** Kwoty, okresy i prawo do zasiłku liczą reguły z testami zgodności z decyzjami ZUS. Model językowy tylko rozmawia i cytuje źródła. Tracimy elastyczność odpowiedzi na nietypowe pytania, zyskujemy wynik, który da się sprawdzić i obronić.
- **Parametry z datą obowiązywania.** Reguły pobierają stawki i wymiary z harmonogramu na dzień zdarzenia (`app/src/lib/rules/parameters.ts`), więc zmiana przepisów to wpis w panelu, a nie nowy kod. W demo harmonogram żyje w sesji przeglądarki, żeby zmiany jednego jurora nie wpływały na innych.
- **OCR w przeglądarce.** Wgrane dokumenty nie opuszczają urządzenia rodzica. Kosztem jest czas odczytu (ok. 25 s dla kilkunastu stron) i niższa jakość na piśmie odręcznym, dlatego każdy fakt rodzic potwierdza ręcznie.

## Co dalej

Trwała baza dla panelu administratora i historii zmian, plan dla dowolnej rodziny z onboardingu wraz z ostrzeżeniami dopasowanymi do sytuacji, lepsze rozpoznawanie podstawy wymiaru na skanach, prawdziwe integracje z PUE/eZUS i mObywatelem.

## Zespół Straylight

| Osoba | Zakres |
|---|---|
| Julian | Agent Zusik, backend, reguły i sprawdzanie spraw |
| Maciej | Widoki rodzica, kalkulator, prezentacja |
| Bartosz | Strona główna, responsywność |
| Nikodem | Panel administratora |
