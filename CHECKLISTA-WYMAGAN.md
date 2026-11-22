# Checklista wymagań zadania ZUS: co mamy, czego brakuje

**Stan na 22.11.2026, ok. 04:00, commit `24c98da` (main).** Źródła wymagań: `Materiały hackathonowe/ZUS - Pełna treść zadania konkursowego.pdf` (dalej „zadanie”, numery stron z PDF) i `ZUS - Regulamin zadania konkursowego.pdf` („regulamin”). Stan sprawdziłem w kodzie `app/`, na produkcji https://straylight-hacknation.vercel.app (wszystkie trasy odpowiadają 200) i w testach (`npm test`: 41 plików, 402 testy, wszystkie zielone). Ekranów nie przeklikałem w przeglądarce, więc wygląd i RWD trzeba jeszcze sprawdzić ręcznie.

Legenda:
- ✅ zrobione
- 🟡 częściowo albo tylko w jednym miejscu
- ❌ brak
- ⚠️ ryzyko, które może kosztować punkty

---

## 0. Najważniejsze braki (do zrobienia przed oddaniem)

| # | Co | Dlaczego ważne | Status |
|---|---|---|---|
| 1 | **Opis i tytuł projektu** (README w katalogu głównym repo albo osobny dokument) | Wymóg formalny (zadanie s. 14). W katalogu głównym repo nie ma README; `app/README.md` jest techniczny | ❌ |
| 2 | **Prezentacja, maks. 10 slajdów** | Wymóg formalny (s. 14) | ❌ nie ma w repo |
| 3 | **Film do 3 minut** w otwartym repozytorium, z linkiem | Wymóg formalny (s. 14) | ❌ nie ma w repo |
| 4 | **Zrzuty ekranu** | Wymóg formalny (s. 14) | ❌ nie ma w repo |
| 5 | **Lista funkcji opartych na AI** w opisie | Wymóg formalny (s. 14) i pkt 9 (s. 16) | ❌ w opisie nie ma (szkic poniżej, sekcja 6) |
| 6 | **Zakres użycia AI przy tworzeniu projektu** (np. Claude Code, Codex) | Pkt 9 (s. 16): AI w procesie twórczym jest dozwolone, ale trzeba podać, w jakim zakresie go użyto | ❌ |
| 7 | **Lista rozwiązań zewnętrznych w prezentacji** | Regulamin § 4 ust. 1 | 🟡 jest tylko dla panelu admina (`ZGLOSZENIE-PANEL-ADMINISTRACYJNY.md`). Pełny szkic w sekcji 7 |
| 8 | ⚠️ **Akta spraw ZUS są w repozytorium Git** (`Materiały hackathonowe/Sprawy/*.pdf` są śledzone) | Zadanie s. 11–12: „Udostępnionych przez ZUS dokumentów nie wolno kopiować ani rozpowszechniać”. Jury dostanie dostęp do repo | ⚠️ przed udostępnieniem repo usunąć je z repo **i z historii** albo oddać jury czyste repo |
| 9 | **Test na przykładowych wnioskach z zestawu ZUS**: upload albo wybór PDF, sprawdzenie ubezpieczenia i kalkulatora | Zadanie s. 14 i 15: jury użyje wniosków z zestawu i sprawdzi wyliczenia | 🟡 szczegóły w sekcji 3 |

---

## 1. Funkcje merytoryczne (zadanie s. 12–13, „Narzędzie powinno zapewnić”)

| Pkt | Wymaganie | Status | Gdzie / co jest | Czego brakuje |
|---|---|---|---|---|
| — | Uprawnienia ustalane indywidualnie: dane z ZUS albo wpisane samodzielnie (data porodu, koniec umowy itp.) (s. 12) | ✅ | Onboarding `/start` buduje plan z odpowiedzi (`features/onboarding`, `lib/plan/build.ts`). Logowanie pozwala wybrać dane z ZUS albo wpisanie ręczne | Profil: zmiana roli lub zmiany pracy w „Moich danych” nie przebudowuje planu (`ui/MACIEJ-TODO.md`) |
| a | Świadczenia w ciąży, także **brak uprawnień**: zasiłek chorobowy | ✅ | Przystanek „Zasiłek chorobowy w ciąży” w planie (`lib/demo/fixtures.ts`, `stop-details.ts`: 30/90 dni, 100%). Sprawa `/app/chorobowe`: ocena dokumentów, w tym wynik „brak ubezpieczenia” (`lib/rules/sickness.ts`, `lib/sickness/*`) | — |
| a | … **świadczenie rehabilitacyjne** | ✅ | Przystanek „Długie zwolnienie: świadczenie rehabilitacyjne” w etapie Ciąża (`lib/demo/fixtures.ts`, opis w `stop-details.ts`): po 270 dniach zasiłku, najdłużej 12 mies., orzecznik ZUS, 90%/75%, w ciąży 100%, wyłączenia, wniosek. Źródła: UZ art. 18–19, rozporządzenie zał. 5, Poradnik s. 25. Wzmianka też w opisie zasiłku chorobowego w ciąży. Dodatkowo odpowiedzi czatu | Kalkulator tego świadczenia nie liczy (tylko informacja) |
| a | … **zasiłek w wysokości zasiłku macierzyńskiego** (upadłość lub likwidacja pracodawcy, naruszenie prawa przy zwolnieniu) | ✅ / 🟡 | Przystanek „Gdy pracodawca upadnie albo zostanie zlikwidowany” (tylko dla pracownic, nie dla drugiego rodzica ani adopcji): do porodu zasiłek w wysokości macierzyńskiego (100%), po porodzie zasiłek macierzyński, wypłaca ZUS, lista dokumentów z § 17. Źródła: UZ art. 30–31, 47, 61, rozporządzenie § 15 i 17. Naruszenie prawa przy zwolnieniu opisane zgodnie z ustawą (art. 30 ust. 1 pkt 2: zasiłek macierzyński po porodzie). Treść zadania (s. 4) łączy je też z zasiłkiem przed porodem, ale ustawa tego nie przewiduje | Brak opcji w kalkulatorze (kalkulator: Maciej) |
| b | Kalkulator zasiłku macierzyńskiego **dla obojga rodziców**: okres i kwota, liczba dzieci, wiek, „Za życiem” | ✅ | `/kalkulator`, `features/calculator/`, `lib/rules/maternity.ts`: 1–5+ dzieci, „Za życiem” 65/67, wcześniak/szpital, martwe urodzenie, 81,5% albo 100/70 z porównaniem, wypłaty miesiąc po miesiącu, terminy | Zgon dziecka po porodzie (min. 7 dni od zgonu) jest nieobsłużony (`ui/KALKULATOR.md`) |
| c | Kalkulator przy **łączeniu pracy z urlopem rodzicielskim** | ✅ | Praca na ¼ lub ½ etatu, wydłużenie urlopu, niższa stawka, limity 82/86/130/134 tyg. | Łączenie z pracą u niepracowników oznaczone „do weryfikacji” |
| d | Symulacja, gdy **oboje rodzice** korzystają z uprawnień | ✅ | Przejęcie macierzyńskiego, rodzicielski kolejno albo razem, 9 tyg. nieprzenoszalne, ojcowski, drugi rodzic nieubezpieczony. Dodatkowo sprawa Marty i Pawła na `/app` (`lib/marta/case.ts`) | — |
| e, j | Kalkulator dla **rodziców adopcyjnych i rodziny zastępczej (niezawodowej)** (pkt e i j się powtarzają) | ✅ | `EventKind = birth \| adoption \| foster`: adopcja do 14 lat, piecza do 7 lat (10 przy odroczeniu), min. 9 tyg. | Skracanie urlopu przy dziecku blisko granicy wieku: „do weryfikacji” |
| f | Kalkulator z **indywidualną podstawą wymiaru**, symulacja **konkretnej sprawy z zestawu** | ✅ / 🟡 | Podstawa: znana z decyzji lub Z-3, średnia albo 12 miesięcy. 3 gotowe sprawy z zestawu (`lib/plan/benefit-presets.ts`) z porównaniem do kwot z decyzji ZUS co do grosza (testy) | Tylko 3 sprawy do wyboru, jury może wziąć inną. Brak odczytu podstawy z wgranego PDF (sekcja 3) |
| — | Rekomendacja: **jeden zintegrowany kalkulator** z opcjami (s. 13) | ✅ | Jeden `BenefitCalculator` | — |
| g | **Dokumenty, terminy, sposób złożenia**, z rozróżnieniem: wypłaca płatnik (>20 ubezpieczonych) albo ZUS | 🟡 | Przystanki z „Co przygotować” i „Jak złożyć”, terminy z dat. Formularze w „Dokumentach” z kanałami PUE / pracodawca / e-mail / ePUAP. Przystanek „Pracodawca przekaże Z-3”. Reguła progu płatnika `lib/rules/payer.ts` | `payer.ts` używa tylko panel admina. **Rodzic nie dostaje pytania „ilu ubezpieczonych ma pracodawca”** ani ukierunkowania, gdzie złożyć dokumenty |
| h | **Zagrożenia i ryzyka** utraty prawa albo zmiany wymiaru lub kwoty | ✅ | Przystanek „Co może odebrać albo obniżyć zasiłek” w etapie Ciąża (I trymestr): umowa dla pozoru (decyzja o niepodleganiu), podwyżka wynagrodzenia w ciąży (ZUS ustala niższą podstawę), brak ubezpieczenia chorobowego w dniu porodu (dobrowolne przy zleceniu i firmie, bez zgłoszenia wstecz, wyjątki z art. 30), zaległości w składkach (art. 2a). Ostrzeżenie na sprawie zasiłku macierzyńskiego i ojcowskiego, gdy w onboardingu wybrano „Własna działalność” albo „Inna umowa” (`employmentRisk` w `lib/plan/build.ts`). Wcześniejsze ostrzeżenia zostają: zmiana pracy, koniec umowy, świadczenie rodzicielskie, ochrona w ciąży. Testy w `tests/onboarding-build.test.ts` | Pozorną *działalność gospodarczą* wymienia treść zadania, ale korpus (Poradnik) opisuje tylko umowę o pracę i zlecenia, więc w tekście jej nie ma. W planach adopcji i pieczy nie ma etapu Ciąża, więc nie ma też przystanku z ryzykami |
| i | **Organizacje charytatywne**: śmierć dziecka, wcześniak, poronienie, ciężko chore dziecko | ✅ | `/wsparcie`, 6 fundacji z datą weryfikacji (`lib/support/organizations.ts`), edycja w panelu admina, wejście z planu i z panelu przystanku | — |

## 2. Symulacje integracji (zadanie s. 13–14, „Narzędzie powinno zapewnić możliwość”)

| Wymaganie | Status | Gdzie / co jest | Czego brakuje |
|---|---|---|---|
| Logowanie przez **mObywatela** (symulacja) | ✅ | `/logowanie`, `/logowanie/mobywatel`, też login.gov.pl i aplikacja ZUS | — |
| **Pobranie danych z ZUS** (ubezpieczenie albo jego brak) albo wpisanie własnych (symulacja) | ✅ | Wybór przy logowaniu. Profil → „Moje konto w ZUS (symulacja eZUS)”, „Odśwież dane” (`features/family/profile/ZusAccount.tsx`) | Dane na sztywno (`profile/data.ts`). „Odśwież” niczego nie zmienia |
| **Zadłużenie składkowe na dzień powstania prawa**, zwłaszcza dla działalności (symulacja zaświadczenia i kwoty) | 🟡 | Wiersz „Zadłużenie składkowe: Brak” w profilu. Reguła art. 2a z progiem 1% płacy minimalnej (`lib/rules/arrears.ts`) działa w sprawie Kamila (ojcowski, działalność) | **Brak symulacji wystawienia zaświadczenia z kwotą zadłużenia.** Brak wariantu „jest zadłużenie” w widoku rodzica |
| Podgląd zaświadczeń **e-ZLA** (symulacja) | 🟡 | Wiersz e-ZLA w profilu. Sprawa `/app/chorobowe` czyta e-ZLA z demonstracyjnego pakietu | Brak osobnej listy zwolnień (daty, kod „B”, lekarz) |
| Połączenie z **PUE/eZUS**: pytanie do ZUS, podgląd konta | ✅ | „Zapytaj ZUS” i dane konta w profilu, kanał PUE przy wysyłce wniosków | Wiadomość nie trafia do korespondencji (TODO backend) |
| **Wypełnienie wniosków o urlopy i świadczenia**, przesłanie do pracodawcy lub ZUS (wnioski o urlopy trzeba było zaprojektować) | ✅ | `/dokumenty`: wnioski o urlop macierzyński, ojcowski, rodzicielski (zaprojektowane), ZAM, 800+, becikowe, ZCNA, zgłoszenie urodzenia, POZ. Przebieg: szkic → sprawdzenie → zatwierdzenie → wysyłka w symulacji. Wypełniony **oficjalny ZAM z 24.10.2026** jako PDF (`/app/kamil`, `lib/forms/zam-fill.ts`) | — |
| Wniosek o **odpis aktu urodzenia** (zupełny lub skrócony) | ✅ | Formularz „Wniosek o wydanie odpisu aktu urodzenia” (skrócony, zupełny, wielojęzyczny) w `lib/demo/forms.ts`, przystanek „Zamów odpis”, link do gov.pl w stopce | — |
| Informacje o podmiotach wsparcia | ✅ | jak pkt i | — |
| **Linki** do zus.pl, gov.pl/web/rodzina/urlop-rodzicielski, pip.gov.pl/…/rodzicielstwo | ✅ | Stopka strony głównej (`features/landing/site-footer.tsx`) ma dokładnie te 3 adresy. Źródła przy przystankach i w kalkulatorze | W planie (`fixtures.ts`) link do PIP prowadzi na stronę główną pip.gov.pl |
| **Panel administracyjny**: zmiana parametrów (stawki, wymiary) przy zmianach prawa | ✅ / 🟡 | `/admin`: reguły, „Przygotuj zmianę”, sprawdzenie na sprawach testowych, publikacja od daty, historia, organizacje wsparcia (`ZGLOSZENIE-PANEL-ADMINISTRACYJNY.md`) | ⚠️ **Kalkulator rodzica nie czyta jeszcze parametrów z panelu.** Przejście `lib/rules/maternity-schedule.ts` jest gotowe, ale nie jest podpięte (właściciel kalkulatora: Maciej). Zmiana stawki w panelu nie zmieni wyniku w `/kalkulator`. Dokumenty i wsparcie po stronie rodzica też nie czytają panelu. Upload PDF w „Sprawach testowych” jest atrapą |

## 3. Test jury na przykładowych wnioskach (zadanie s. 14 i 15)

> „na stronie powinna być możliwość przetestowania wybranych załączonych przykładów (formularze w pdf) tak, aby zweryfikować czy osoba posiada ubezpieczenie oraz umożliwić sprawdzenie kalkulatora” · „zostaną użyte niektóre z zamieszczonych przykładowych wniosków oraz sprawdzona zostanie poprawność wyliczeń” · „Strona powinna mieć możliwość uploadu/wyboru wybranych wniosków”.

| Element | Status | Uwagi |
|---|---|---|
| **Wybór** sprawy z zestawu w kalkulatorze | 🟡 | 3 sprawy (pracownica 81,5%, działalność 81,5%, pensja poniżej minimum) zgodne z decyzjami co do grosza. Zestaw ma ok. 90 spraw |
| **Upload** PDF do sprawdzenia ubezpieczenia | 🟡 | `/app/chorobowe` przyjmuje plik, ale automatycznie rozpoznaje tylko strony „ZUSIK DEMO / 1”. Dla innego dokumentu rodzic sam wpisuje ustalenia (`lib/sickness/read.ts`). `/app/kamil` czyta tylko odpis aktu urodzenia (OCR) |
| Upload PDF z zestawu (ZAM, Z-3, decyzja) → podstawa → kalkulator | ❌ | Nie ma odczytu podstawy z wgranego dokumentu do kalkulatora |
| Jasna instrukcja dla jury „jak przetestować” (które sprawy, gdzie kliknąć) | ❌ | Jest tylko dla panelu admina |
| Sprawy z decyzją **odmowną** (brak ubezpieczenia, zadłużenie, umowa dla pozoru) do przetestowania | ❌ | Gotowe sprawy w kalkulatorze to tylko przyznania |

## 4. Wymagania formalne (zadanie s. 14)

| Wymaganie | Status | Uwagi |
|---|---|---|
| Szczegółowy opis i tytuł projektu | ❌ | Tytuł roboczy: „Zusik · Przewodnik Rodzica”. Do napisania (np. skill `hackathon-readme`) |
| Prezentacja, maks. 10 slajdów | ❌ | |
| Film do 3 minut, link w otwartym repozytorium (może być częścią aplikacji) | ❌ | Na stronie głównej jest `public/media/hero-family.mp4`, ale to wideo w tle, a nie film o projekcie |
| Repozytorium kodu | ✅ / ⚠️ | GitHub `szpoter/straylight_hacknation` (prywatne). Trzeba dać jury dostęp. Zobacz ⚠️ akta ZUS w pkt 0.8 |
| Zrzuty ekranu | ❌ | |
| Link do demo jako strony internetowej | ✅ | https://straylight-hacknation.vercel.app (Vercel, deploy z `main`) |
| W pełni responsywny interfejs (komputer i telefon) | 🟡 | Kod ma warianty mobilne (pionowa ścieżka, panel od dołu, dolny pasek). **Telefonu nikt jeszcze nie sprawdził wizualnie** (`ui/MACIEJ-TODO.md` pkt 16). Do sprawdzenia: `/`, `/logowanie`, `/start`, `/plan`, `/kalkulator`, `/dokumenty`, `/profil`, `/wsparcie`, `/app*`, `/admin` przy 390 px |
| Materiały graficzne | 🟡 | Maskotka Bąbelek, ilustracje, wideo na stronie głównej. Nie zebrano ich do zgłoszenia |
| Wskazanie funkcji opartych na AI | ❌ | Szkic w sekcji 6 |

## 5. Wymagania techniczne (zadanie s. 15)

| Wymaganie | Status | Uwagi |
|---|---|---|
| Nowoczesna aplikacja webowa RWD | ✅ / 🟡 | RWD do sprawdzenia (sekcja 4) |
| Frontend React/Next.js (preferowany) | ✅ | Next.js 16, React 19, TypeScript strict |
| Backend JS/Python/C# | ✅ | Node.js (trasy API Next.js), skrypty Python |
| Integracja przez REST API | ✅ | `app/src/app/api/`: `zusik`, `zusik/ask`, `zusik/session`, `zusik/state`, `zusik/marta`, `zusik/marta/pdf`, `zusik/sickness`, `kamil` |
| Działa w warunkach testowych, potencjał produkcyjny | ✅ | Testy zielone (402). Sesje podpisane, właściciel sprawy sprawdzany po stronie serwera, klucze tylko na serwerze (`app/ARCHITECTURE.md`). Lint i build nie były uruchamiane w tej sesji |
| Przejrzysta struktura kodu (jury przegląda repo) | 🟡 | `app/` jest uporządkowane. ⚠️ W katalogu głównym leży dużo plików roboczych: `maskotka_kod/`, `PLAN-*.md`, `MASTER-PROMPT-ZUSIK.md`, `Przewodnik-Rodzica.html`, `ui/*-prompt*.md`, `inspiracjeelementowistron.md`. W `app/` są dwie kopie maskotki (`components/mascot/*` i `components/mascot/babelek/*`) oraz ekran próby `/demo/polaczenia` oznaczony do usunięcia. Do decyzji: posprzątać albo opisać w README |

## 6. Funkcje AI: szkic do opisu (wymóg s. 14 i pkt 9)

| Funkcja | AI? | Jak |
|---|---|---|
| Czat Zusik: odpowiedzi z przypisami do przepisów | ✅ AI | Model Bielik (Sherlock, CloudFerro) przez Vercel AI SDK. Wyszukiwanie w Qdrant (embeddingi `multilingual-e5-small`) po korpusie KP, ustawy zasiłkowej, rozporządzeń i Poradnika ZUS. Sprawdzone na produkcji: odpowiedź z cytatem z rozporządzenia, ok. 24 s. ⚠️ Na pytanie „Ile trwa urlop ojcowski?” odpowiedź nie podała „14 dni”, tylko wymogi wniosku. Jakość odpowiedzi warto przetestować przed demo |
| Prowadzenie spraw w rozmowie (Marta, Kamil, chorobowe) | ✅ AI + reguły | LangGraph, model formułuje tekst i wybiera narzędzie, a **kwoty i terminy liczy kod** (`lib/rules`) |
| Odczyt odpisu aktu urodzenia (OCR) | 🟡 ML | Tesseract.js (model LSTM, polski) w przeglądarce. To rozpoznawanie tekstu, nie generatywne AI, więc trzeba je tak opisać |
| Kalkulator, plan, terminy, panel admina | ❌ bez AI | Deterministyczne reguły z testami. Warto to podkreślić jako zaletę |

## 7. Rozwiązania zewnętrzne (regulamin § 4 ust. 1): szkic listy do prezentacji

Next.js, React, TypeScript, Tailwind CSS v4 · Vercel (hosting, CI z GitHub Actions) · Vercel AI SDK (`ai`, `@ai-sdk/openai-compatible`) · Bielik w Sherlock (CloudFerro) · LangGraph.js i LangChain core (+ checkpoint Postgres) · Neon Postgres (`pg`) · Qdrant Cloud z Cloud Inference (`intfloat/multilingual-e5-small`) · Zod · pdf-lib i fontkit (wypełnianie ZAM), czcionki DejaVu · PDF.js (`pdfjs-dist`) · Tesseract.js z modelem `pol` · motion, flubber (animacje maskotki) · Lenis (płynne przewijanie) · Google Fonts przez `next/font` (Literata, Inter, Domine) · Vitest, Playwright-core, `@napi-rs/canvas` (testy) · Ollama (lokalny serwer modeli, `workers/`) · treści: zus.pl, gov.pl, eli.gov.pl (Dziennik Ustaw), strony fundacji. Do uzupełnienia o źródło wideo i zdjęć na stronie głównej (`public/media`, `app/assets`): licencja do potwierdzenia.

## 8. Regulamin: pozostałe punkty

| Punkt | Status | Uwagi |
|---|---|---|
| § 4 ust. 1: autorstwo i wskazanie rozwiązań zewnętrznych w prezentacji | 🟡 | Sekcja 7 |
| § 4 ust. 2: rozwiązanie wolne od wad prawnych, bez naruszania praw osób trzecich | ⚠️ | Sprawdzić licencję wideo i zdjęć (`hero-family.mp4`, `assets/*.jpg`). Akta ZUS w repo (pkt 0.8). Nazwa i wygląd ekranów mObywatel i login.gov.pl to symulacja, warto to opisać |
| Zakaz kopiowania i rozpowszechniania akt ZUS (zadanie s. 12) | ⚠️ | Aplikacja ich nie serwuje: w `public/demo` są tylko pliki fikcyjne, gotowe sprawy w kalkulatorze zawierają same liczby. Ale PDF-y są w Git (pkt 0.8) |
| § 3 ust. 5: po wygranej przekazanie kodu źródłowego **z opisem** | 🟡 | Potrzebny README (pkt 0.1) |

## 9. Kryteria oceny (zadanie s. 16): jak wypadamy

| Kryterium | Waga | Mocne strony | Co podnieść |
|---|---|---|---|
| Związek z wyzwaniem | 25% | Kalkulator zgodny z decyzjami ZUS co do grosza, wszystkie warianty b–f, j, oficjalny ZAM, wnioski urlopowe, cytaty z przepisów | g (płatnik czy ZUS w widoku rodzica). Pkt a i h uzupełnione 22.11 |
| Pomysł | 20% | Plan-ścieżka rodzica od ciąży, asystent z przypisami, „model proponuje, kod liczy” | Pokazać w filmie |
| Oryginalność | 15% | Maskotka, ścieżka 3D, sprawy prowadzone rozmową | — |
| Kompletność i UX | 25% | Pełny przebieg od logowania przez plan i kalkulator do wniosku | Sprawdzić RWD, scalić dwa wejścia (`/app*` i `/plan`), instrukcja testu dla jury, martwe przyciski (sekcja 10) |
| Potencjał wdrożeniowy | 15% | Panel admina z wersjonowaniem od daty, testy, REST, bezpieczeństwo sesji | Podpiąć panel do kalkulatora (Maciej), opis architektury w README |

## 10. Znane niedoróbki UX (z `ui/MACIEJ-TODO.md` i kodu)

- 🟡 Dwa równoległe obszary rodzica: zakładki `/plan`, `/kalkulator`, `/dokumenty`, `/profil` oraz sprawy rozmowy `/app`, `/app/kamil`, `/app/chorobowe`, `/zusik`. Trzeba ustalić jedno wejście i przejścia między nimi.
- 🟡 Profil → „Przetestuj przykładową sprawę”: przykład Alicji ma wynik na sztywno (`profile/data.ts`).
- 🟡 Panel admina → „Wgraj PDF” pokazuje tylko nazwę pliku.
- 🟡 „Odśwież dane” ZUS i „Zapytaj ZUS” nie mają skutku poza komunikatem.
- 🟡 Drugi rodzic w onboardingu nie dostaje spraw macierzyńskich (uproszczenie).
- ⚠️ Zostało `/demo/polaczenia`, ekran próby „do usunięcia po etapie 1”, dostępny publicznie.
- ⚠️ `ADMIN_DEMO_PASSWORD` wpuszcza do `/admin` jednym kliknięciem. Na konkurs to celowe, po konkursie usunąć (`app/README.md`).
