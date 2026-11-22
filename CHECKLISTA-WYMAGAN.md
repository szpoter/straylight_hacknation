# Checklista wymagań zadania ZUS: co mamy, czego brakuje

**Odbiór lokalny 22.11.2026.** Sprawdzono lokalny `main` po pobraniu `origin/main`. Ścieżką rodzica pozostaje jedna rodzina Oli. Produkcja ma osobny cykl wdrożenia. Wymagania pochodzą z konkursowej treści zadania ZUS (s. 11–16) i regulaminu. [Instrukcja jury i materiały](README.md)

Legenda:
- ✅ zrobione
- 🟡 częściowo albo tylko w jednym miejscu
- ❌ brak
- ⚠️ ryzyko, które może kosztować punkty

---

## 0. Stan przed oddaniem

| # | Co | Dlaczego ważne | Status |
|---|---|---|---|
| 1 | **Opis i tytuł projektu** | Zadanie s. 14 | ✅ [README](README.md) |
| 2 | **Prezentacja** | Do 10 slajdów | ✅ [PDF, 6 slajdów](zgloszenie/przewodnik-rodzica.pdf) |
| 3 | **Film** | Do 3 minut i publiczny odnośnik | 🟡 [Film, 60 s](plans/film/v1/przewodnik-rodzica-1080p.mp4). Plik i link lokalny gotowe. Publiczny adres po udostępnieniu przez zespół. |
| 4 | **Zrzuty ekranu** | Zadanie s. 14 | ✅ [Plan, kalkulator i dokumenty na komputerze i telefonie](zgloszenie/) |
| 5 | **Lista funkcji AI** | Zadanie s. 14 i 16 | ✅ W README opisano rozmowę ze źródłami, prowadzenie sprawy, OCR i osobne reguły wyliczeń. |
| 6 | **AI w procesie twórczym** | Zadanie s. 16 | ✅ README i prezentacja opisują użycie Codex oraz ElevenLabs. Zespół potwierdza kompletność deklaracji przed wysyłką. |
| 7 | **Rozwiązania zewnętrzne** | Regulamin § 4 ust. 1 | ✅ Slajd 6 prezentacji. Pochodzenie zdjęć i wideo wymaga potwierdzenia zespołu. |
| 8 | **Akta ZUS w roboczym repozytorium** | Ograniczenie rozpowszechniania, s. 11–12 | ⚠️ Git śledzi 87 PDF-ów spraw. Do przekazania służy odrębna kopia kodu bez historii i akt. Udostępnienie wymaga sprawdzenia praw do mediów. |
| 9 | **Próby jury** | Ubezpieczenie i kalkulator, s. 14–15 | 🟡 Przykłady, PDF i próby odmowne opisano w sekcji 3. Odczyt podstawy ze skanu może wymagać ręcznego potwierdzenia i wpisania kwoty. |

---

## 1. Funkcje merytoryczne (zadanie s. 12–13, „Narzędzie powinno zapewnić”)

| Pkt | Wymaganie | Status | Gdzie / co jest | Czego brakuje |
|---|---|---|---|---|
| — | Indywidualna sytuacja rodziny | 🟡 | Symulowany import rodziny Oli oraz ręczne wpisanie danych i podstaw obu rodziców w kalkulatorze | Zgodnie z decyzją właściciela demo ma jedną rodzinę. Oddzielne profile i dawny onboarding są poza aktywną ścieżką. |
| a | Świadczenia w ciąży, także **brak uprawnień**: zasiłek chorobowy | ✅ | Przystanek „Zasiłek chorobowy w ciąży” w planie (`lib/demo/fixtures.ts`, `stop-details.ts`: 30/90 dni, 100%). Przykład w profilu `/profil/przyklad-ubezpieczenia`: ocena dokumentów, w tym wynik „brak ubezpieczenia” (`lib/rules/sickness.ts`, `lib/sickness/*`) | — |
| a | … **świadczenie rehabilitacyjne** | ✅ | Przystanek „Długie zwolnienie: świadczenie rehabilitacyjne” w etapie Ciąża (`lib/demo/fixtures.ts`, opis w `stop-details.ts`): po 270 dniach zasiłku, najdłużej 12 mies., orzecznik ZUS, 90%/75%, w ciąży 100%, wyłączenia, wniosek. Źródła: UZ art. 18–19, rozporządzenie zał. 5, Poradnik s. 25. Wzmianka też w opisie zasiłku chorobowego w ciąży. Dodatkowo odpowiedzi czatu | Kalkulator tego świadczenia nie liczy (tylko informacja) |
| a | … **zasiłek w wysokości zasiłku macierzyńskiego** (upadłość lub likwidacja pracodawcy, naruszenie prawa przy zwolnieniu) | ✅ / 🟡 | Przystanek „Gdy pracodawca upadnie albo zostanie zlikwidowany” (tylko dla pracownic, nie dla drugiego rodzica ani adopcji): do porodu zasiłek w wysokości macierzyńskiego (100%), po porodzie zasiłek macierzyński, wypłaca ZUS, lista dokumentów z § 17. Źródła: UZ art. 30–31, 47, 61, rozporządzenie § 15 i 17. Naruszenie prawa przy zwolnieniu opisane zgodnie z ustawą (art. 30 ust. 1 pkt 2: zasiłek macierzyński po porodzie). Treść zadania (s. 4) łączy je też z zasiłkiem przed porodem, ale ustawa tego nie przewiduje | Brak opcji w kalkulatorze (kalkulator: Maciej) |
| b | Kalkulator zasiłku macierzyńskiego **dla obojga rodziców**: okres i kwota, liczba dzieci, wiek, „Za życiem” | ✅ | `/kalkulator`, `features/calculator/`, `lib/rules/maternity.ts`: 1–5+ dzieci, „Za życiem” 65/67, wcześniak/szpital, martwe urodzenie, 81,5% albo 100/70 z porównaniem, wypłaty miesiąc po miesiącu, terminy | Zgon dziecka po porodzie (min. 7 dni od zgonu) jest nieobsłużony (`ui/KALKULATOR.md`) |
| c | Kalkulator przy **łączeniu pracy z urlopem rodzicielskim** | ✅ | Praca na ¼ lub ½ etatu, wydłużenie urlopu, niższa stawka, limity 82/86/130/134 tyg. | Łączenie z pracą u niepracowników oznaczone „do weryfikacji” |
| d | Symulacja, gdy **oboje rodzice** korzystają z uprawnień | ✅ | Przejęcie macierzyńskiego, rodzicielski kolejno albo razem, 9 tyg. nieprzenoszalne, ojcowski, drugi rodzic nieubezpieczony. Dodatkowo sprawa urlopowa na `/app` (`lib/marta/case.ts`) | — |
| e, j | Kalkulator dla **rodziców adopcyjnych i rodziny zastępczej (niezawodowej)** (pkt e i j się powtarzają) | ✅ | `EventKind = birth \| adoption \| foster`: adopcja do 14 lat, piecza do 7 lat (10 przy odroczeniu), min. 9 tyg. | Skracanie urlopu przy dziecku blisko granicy wieku: „do weryfikacji” |
| f | Indywidualna podstawa i symulacja konkretnej sprawy | ✅ | Kalkulator przyjmuje podstawę z decyzji, średnią lub kwoty miesięczne. Można wczytać jeden z trzech przykładów lub PDF, a następnie potwierdzić rozpoznaną kwotę. | OCR rzeczywistych skanów opisano w sekcji 3. |
| — | Rekomendacja: **jeden zintegrowany kalkulator** z opcjami (s. 13) | ✅ | Jeden `BenefitCalculator` | — |
| g | Dokumenty, terminy i odbiorca świadczenia | ✅ | Rozwiń „kto wypłaca zasiłek?” osobno dla każdego rodzica w kalkulatorze. Podaj liczbę ubezpieczonych albo wybierz działalność. Wniosek ZAM uwzględnia odbiorcę i sposób przekazania. | Rodzic potwierdza rzeczywisty stan u płatnika. |
| h | **Zagrożenia i ryzyka** utraty prawa albo zmiany wymiaru lub kwoty | ✅ | Przystanek „Co może odebrać albo obniżyć zasiłek” w etapie Ciąża (I trymestr): umowa dla pozoru (decyzja o niepodleganiu), podwyżka wynagrodzenia w ciąży (ZUS ustala niższą podstawę), brak ubezpieczenia chorobowego w dniu porodu (dobrowolne przy zleceniu i firmie, bez zgłoszenia wstecz, wyjątki z art. 30), zaległości w składkach (art. 2a). Ostrzeżenie na sprawie zasiłku macierzyńskiego i ojcowskiego, gdy w onboardingu wybrano „Własna działalność” albo „Inna umowa” (`employmentRisk` w `lib/plan/build.ts`). Wcześniejsze ostrzeżenia zostają: zmiana pracy, koniec umowy, świadczenie rodzicielskie, ochrona w ciąży. Testy w `tests/onboarding-build.test.ts` | Pozorną *działalność gospodarczą* wymienia treść zadania, ale korpus (Poradnik) opisuje tylko umowę o pracę i zlecenia, więc w tekście jej nie ma. W planach adopcji i pieczy nie ma etapu Ciąża, więc nie ma też przystanku z ryzykami |
| i | **Organizacje charytatywne**: śmierć dziecka, wcześniak, poronienie, ciężko chore dziecko | ✅ | `/wsparcie`, 6 fundacji z datą weryfikacji (`lib/support/organizations.ts`), edycja w panelu admina, wejście z planu i z panelu przystanku | — |

## 2. Symulacje integracji (zadanie s. 13–14, „Narzędzie powinno zapewnić możliwość”)

| Wymaganie | Status | Gdzie / co jest | Czego brakuje |
|---|---|---|---|
| Logowanie przez **mObywatela** (symulacja) | ✅ | `/logowanie`, `/logowanie/mobywatel`, też login.gov.pl i aplikacja ZUS | — |
| **Pobranie danych z ZUS** albo dane własne | ✅ / 🟡 | Import rodziny Oli z mObywatela i mZUS, dane płacowe wpisuje rodzic. Odświeżenie profilu ponawia import. | Symulowany profil demonstracyjny. |
| **Zadłużenie na dzień powstania prawa** | ✅ | Profil → Konto eZUS → zaświadczenie o zadłużeniu. Wariant 0 albo 200 zł na 02.11.2026, kwota i wynik z reguły art. 2a. | Przykład demonstracyjny dla działalności. |
| Podgląd zaświadczeń **e-ZLA** | ✅ | Profil → Konto eZUS → Zwolnienia e-ZLA. Daty i kod B pochodzą z fikcyjnego pakietu PDF. | Nazwiska lekarza nie ma w pakiecie. |
| Połączenie z **PUE/eZUS** | ✅ | Profil pozwala odświeżyć dane, zapisać testowe pytanie i wrócić do korespondencji po przeładowaniu karty. | Korespondencja w sesji demo. |
| **Wypełnienie wniosków o urlopy i świadczenia**, przesłanie do pracodawcy lub ZUS (wnioski o urlopy trzeba było zaprojektować) | ✅ | `/dokumenty`: wnioski o urlop macierzyński, ojcowski, rodzicielski (zaprojektowane), ZAM, 800+, becikowe, ZCNA, zgłoszenie urodzenia, POZ. Przebieg: szkic → sprawdzenie → zatwierdzenie → wysyłka w symulacji. Wypełniony **oficjalny ZAM z 24.10.2026** jako PDF w zakładce Dokumenty | — |
| Wniosek o **odpis aktu urodzenia** (zupełny lub skrócony) | ✅ | Formularz „Wniosek o wydanie odpisu aktu urodzenia” (skrócony, zupełny, wielojęzyczny) w `lib/demo/forms.ts`, przystanek „Zamów odpis”, link do gov.pl w stopce | — |
| Informacje o podmiotach wsparcia | ✅ | jak pkt i | — |
| **Linki** do zus.pl, gov.pl/web/rodzina/urlop-rodzicielski, pip.gov.pl/…/rodzicielstwo | ✅ | Stopka strony głównej (`features/landing/site-footer.tsx`) ma dokładnie te 3 adresy. Źródła przy przystankach i w kalkulatorze | Plan i stopka prowadzą do porad PIP o rodzicielstwie |
| **Panel administracyjny** | ✅ | Podpisany harmonogram danej sesji zasila wyliczenie rodzica, progi płatnika, katalog druków i widok wsparcia. W sprawach testowych działa lokalny odczyt stron PDF. | Zmiany testowe dotyczą przeglądarki jurora. Publikacja ogólnokrajowych parametrów wymaga trwałego rejestru. |

## 3. Test jury na przykładowych wnioskach (zadanie s. 14 i 15)

> „na stronie powinna być możliwość przetestowania wybranych załączonych przykładów (formularze w pdf) tak, aby zweryfikować czy osoba posiada ubezpieczenie oraz umożliwić sprawdzenie kalkulatora” · „zostaną użyte niektóre z zamieszczonych przykładowych wniosków oraz sprawdzona zostanie poprawność wyliczeń” · „Strona powinna mieć możliwość uploadu/wyboru wybranych wniosków”.

| Element | Status | Uwagi |
|---|---|---|
| **Wybór** sprawy z zestawu | ✅ | Trzy zanonimizowane przykłady są dostępne w kalkulatorze. Testy porównują wartości z decyzjami co do grosza. |
| **Upload** PDF do sprawdzenia ubezpieczenia | 🟡 | Profil → Konto eZUS → Zwolnienia e-ZLA → Sprawdź ubezpieczenie. Istniejący moduł obsługuje potwierdzanie ustaleń i brak ubezpieczenia. Czat ogólny czyta także własny PDF na urządzeniu. Samo zwolnienie nie wystarcza do rozstrzygnięcia dowolnej sprawy. |
| Upload PDF → podstawa → kalkulator | 🟡 | PDF tekstowy z jednoznaczną kwotą przeszedł cały przebieg w Chrome. W lokalnej próbie na konkursowym skanie rozpoznano tekst na 16 z 16 stron, ale program nie wskazał pewnej podstawy. W takim przypadku juror porównuje treść z decyzją i wpisuje kwotę ręcznie. |
| Instrukcja dla jury | ✅ | [Kroki i wynik kontrolny](README.md). |
| Sprawy odmowne | ✅ / 🟡 | Panel K-06 pokazuje brak ubezpieczenia, K-08 brak informacji. W profilu działa fikcyjny przykład zadłużenia i odrębny przykład oceny chorobowego. Nie zweryfikowano wszystkich odmów z pakietu konkursowego. |

## 4. Wymagania formalne (zadanie s. 14)

| Wymaganie | Status | Uwagi |
|---|---|---|
| Szczegółowy opis i tytuł | ✅ | [README](README.md) |
| Prezentacja do 10 slajdów | ✅ | [6 slajdów w PDF](zgloszenie/przewodnik-rodzica.pdf) |
| Film do 3 minut w otwartym repozytorium | 🟡 | Gotowy plik i odnośnik w README. Publiczny dostęp potwierdzi właściciel przy oddaniu. |
| Repozytorium kodu | ✅ / ⚠️ | GitHub `szpoter/straylight_hacknation` (prywatne). Przed przekazaniem dostępu przygotować publiczne repo z oddzielnej kopii dla jury (pkt 0.8). |
| Zrzuty ekranu | ✅ | [6 zrzutów z lokalnego demo](zgloszenie/) |
| Link do demo jako strony internetowej | ✅ | https://straylight-hacknation.vercel.app (Vercel, deploy z `main`) |
| Responsywność na komputerze i telefonie | 🟡 | Próba w Chrome obejmowała 14 tras przy 390 i 1440 px, w tym przekierowania. Sprawdzono także rozwinięty wynik kalkulatora. Odbiór na fizycznym urządzeniu i w Safari pozostaje otwarty. |
| Materiały graficzne | ✅ / ⚠️ | Zrzuty i film są podlinkowane w README. Licencje mediów do potwierdzenia. |
| Wskazanie funkcji AI | ✅ | Sekcja „Gdzie działa AI” w README. |

## 5. Wymagania techniczne (zadanie s. 15)

| Wymaganie | Status | Uwagi |
|---|---|---|
| Nowoczesna aplikacja webowa RWD | ✅ / 🟡 | Chrome 390 i 1440 px sprawdzony; zakres w sekcji 4 |
| Frontend React/Next.js (preferowany) | ✅ | Next.js 16, React 19, TypeScript strict |
| Backend JS/Python/C# | ✅ | Node.js (trasy API Next.js), skrypty Python |
| Integracja przez REST API | ✅ | `app/src/app/api/`: `zusik`, `zusik/ask`, `zusik/session`, `zusik/state`, `zusik/marta`, `zusik/marta/pdf`, `zusik/sickness`, `kamil` |
| Działa w warunkach testowych | ✅ | Lokalna kompilacja produkcyjna, TypeScript, lint i 532 testy Vitest (58 plików). Konto testowe panelu i przepływ PDF sprawdzone w Chrome. |
| Przejrzysta struktura kodu | ✅ | README wskazuje ekrany, REST, reguły, testy, materiały i dokumentację. Dawny ekran próby przekierowuje do planu. |

## 6. Funkcje AI w opisie projektu (wymóg s. 14 i pkt 9)

| Funkcja | AI? | Jak |
|---|---|---|
| Czat Zusik: odpowiedzi z przypisami do przepisów | ✅ AI | Model Bielik (Sherlock, CloudFerro) przez Vercel AI SDK. Wyszukiwanie w Qdrant (embeddingi `multilingual-e5-small`) po korpusie KP, ustawy zasiłkowej, rozporządzeń i Poradnika ZUS. W poprzedniej weryfikacji produkcji: odpowiedź z cytatem z rozporządzenia, ok. 24 s. ⚠️ Na pytanie „Ile trwa urlop ojcowski?” odpowiedź nie podała „14 dni”, tylko wymogi wniosku. Jakość odpowiedzi warto przetestować przed demo |
| Prowadzenie spraw w rozmowie (Marta, Kamil, chorobowe) | ✅ AI + reguły | LangGraph, model formułuje tekst i wybiera narzędzie, a **kwoty i terminy liczy kod** (`lib/rules`) |
| Odczyt odpisu aktu urodzenia (OCR) | 🟡 ML | Tesseract.js (model LSTM, polski) w przeglądarce. To rozpoznawanie tekstu, nie generatywne AI, więc trzeba je tak opisać |
| Kalkulator, plan, terminy, panel admina | ❌ bez AI | Deterministyczne reguły z testami. Warto to podkreślić jako zaletę |

## 7. Rozwiązania zewnętrzne ujęte w prezentacji

Next.js, React, TypeScript, Tailwind CSS v4 · Vercel (hosting, CI z GitHub Actions) · Vercel AI SDK (`ai`, `@ai-sdk/openai-compatible`) · Bielik w Sherlock (CloudFerro) · LangGraph.js i LangChain core (+ checkpoint Postgres) · Neon Postgres (`pg`) · Qdrant Cloud z Cloud Inference (`intfloat/multilingual-e5-small`) · Zod · pdf-lib i fontkit (wypełnianie ZAM), czcionki DejaVu · PDF.js (`pdfjs-dist`) · Tesseract.js z modelem `pol` · motion, flubber (animacje maskotki) · Lenis (płynne przewijanie) · Google Fonts przez `next/font` (Literata, Inter, Domine) · Vitest, Playwright-core, `@napi-rs/canvas` (testy) · Ollama (lokalny serwer modeli, `workers/`) · treści: zus.pl, gov.pl, eli.gov.pl (Dziennik Ustaw), strony fundacji. Do uzupełnienia o źródło wideo i zdjęć na stronie głównej (`public/media`, `app/assets`): licencja do potwierdzenia.

## 8. Regulamin: pozostałe punkty

| Punkt | Status | Uwagi |
|---|---|---|
| § 4 ust. 1 · autorstwo i rozwiązania zewnętrzne | ✅ / 🟡 | Slajd 6 zawiera wykaz techniczny. Zespół potwierdza zakres wkładu twórców i prawa do mediów. |
| § 4 ust. 2: rozwiązanie wolne od wad prawnych, bez naruszania praw osób trzecich | ⚠️ | Sprawdzić licencję wideo i zdjęć (`hero-family.mp4`, `assets/*.jpg`). Akta ZUS w repo (pkt 0.8). Nazwa i wygląd ekranów mObywatel i login.gov.pl to symulacja, warto to opisać |
| Zakaz kopiowania i rozpowszechniania akt ZUS (zadanie s. 12) | ⚠️ | Aplikacja ich nie serwuje: w `public/demo` są tylko pliki fikcyjne, gotowe sprawy w kalkulatorze zawierają same liczby. Ale PDF-y są w Git (pkt 0.8) |
| § 3 ust. 5 · kod z opisem | ✅ / 🟡 | README z instrukcją i architekturą gotowe. Przekazanie dostępu należy do właściciela. |

## 9. Kryteria oceny (zadanie s. 16): jak wypadamy

| Kryterium | Waga | Mocne strony | Co podnieść |
|---|---|---|---|
| Związek z wyzwaniem | 25% | Kalkulator zgodny z decyzjami ZUS co do grosza, wszystkie warianty b–f, j, oficjalny ZAM, wnioski urlopowe, cytaty z przepisów | Płatnik jest widoczny w kalkulatorze; ograniczenia przypadków brzegowych opisano w sekcji 1 |
| Pomysł | 20% | Plan-ścieżka rodzica od ciąży, asystent z przypisami, „model proponuje, kod liczy” | Film i prezentacja w README |
| Oryginalność | 15% | Maskotka, ścieżka 3D, sprawy prowadzone rozmową | — |
| Kompletność i UX | 25% | Pełny przebieg od logowania przez plan i kalkulator do wniosku | Odbiór na urządzeniu fizycznym; instrukcja jury w README |
| Potencjał wdrożeniowy | 15% | Panel admina z wersjonowaniem od daty, testy, REST, bezpieczeństwo sesji | Trwały rejestr publikowanych zmian przed wdrożeniem poza konkursem |

## 10. Przegląd znanych uwag UX

| Pozycja | Wynik |
|---|---|
| Wejście rodziny i osobne sprawy | ✅ Rodzic zaczyna od planu Oli. Profil otwiera rozmowę i wyraźnie oznaczony przykład testowy. Stare adresy Kamila i chorobowego przekierowują do planu. |
| Przykład Alicji | ✅ Dawny adres prowadzi do profilu Oli. Odmowę i brak informacji porównuje się w panelu na podstawie reguł. |
| „Wgraj PDF” w panelu | ✅ Odczytuje strony PDF lokalnie, również przez OCR. Juror może rozwinąć tekst każdej strony. |
| „Odśwież dane” i „Zapytaj ZUS” | ✅ Profil ponawia import, a korespondencję z demonstracji można odczytać po odświeżeniu karty. |
| Osobny onboarding drugiego rodzica | Decyzja właściciela: zachować jeden profil rodziny Oli. Kalkulator obsługuje uprawnienia obojga rodziców. |
| Ekran próby `/demo/polaczenia` | ✅ Przekierowuje do planu. Przekierowanie jest objęte testem. |
| Dostęp do panelu po konkursie | ⚠️ Właściciel wyłącza demonstracyjne logowanie jednym kliknięciem po zakończeniu pokazu. |
