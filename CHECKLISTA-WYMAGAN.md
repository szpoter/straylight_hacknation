# Checklista wymagań zadania ZUS: co mamy, czego brakuje

**Stan na 22.11.2026, commit `e3f7a89` (`main` = `origin/main`).** Wymagania pochodzą z [treści zadania ZUS](Materiały%20hackathonowe/ZUS%20-%20Pełna%20treść%20zadania%20konkursowego.pdf) (numery stron w nawiasach) i [regulaminu](Materiały%20hackathonowe/ZUS%20-%20Regulamin%20zadania%20konkursowego.pdf). [Instrukcja dla jury i materiały](README.md).

**Jak sprawdzono.** Każdą pozycję porównano z kodem w `app/` na tym commicie. Uruchomiono `npm test`, `tsc`, `npm run lint` i `npm run build`. Sprawdzono odpowiedzi tras produkcji https://straylight-hacknation.vercel.app. Ekran `/sprawdz` przeszedł test w Chrome (komputer i 390 px) z dwoma skanami z zestawu. Czego nie sprawdzono w tym przeglądzie, opisano wprost jako „nie sprawdzono”.

Legenda:
- ✅ zrobione i sprawdzone
- 🟡 częściowo albo z ograniczeniem
- ❌ brak
- ⚠️ ryzyko, które może kosztować punkty albo naruszać regulamin

---

## 0. Do zrobienia przed oddaniem (najważniejsze)

| # | Co | Dlaczego | Status |
|---|---|---|---|
| 1 | **Deklaracja AI w procesie twórczym jest niepełna** | Zadanie s. 16 wymaga wskazania zakresu użycia AI. README i slajd 6 wymieniają tylko Codex i ElevenLabs. 66 commitów w repozytorium ma współautora „Claude” (Anthropic, Claude Code) | ⚠️ Dopisać Claude Code do README i slajdu 6 |
| 2 | **Film w otwartym repozytorium (link)** | Zadanie s. 14 | 🟡 Film jest gotowy (60 s, `plans/film/v1/przewodnik-rodzica-1080p.mp4`), ale leży w prywatnym repo. Potrzebny publicznie dostępny link |
| 3 | **Akta spraw ZUS w Git** | Zadanie s. 11–12: dokumentów nie wolno kopiować ani rozpowszechniać | ⚠️ Git śledzi 87 PDF-ów z `Materiały hackathonowe/Sprawy`. Jury trzeba dać czystą kopię bez akt i bez historii (README to zaznacza) |
| 4 | **Licencje mediów** | Regulamin § 4 ust. 2 | ⚠️ Pochodzenie `app/public/media/hero-family.mp4` i `app/assets/*.jpg` nie jest opisane w repo. Do potwierdzenia przez zespół |
| 5 | **README nie wspomina `/sprawdz`** | Zadanie s. 14–15: test jury na sprawach z zestawu | 🟡 Ekran działa, ale instrukcja w README prowadzi tylko do kalkulatora, profilu i panelu. Warto dopisać krok z `/sprawdz` |
| 6 | **Ścieżka „Mój plan” przy mniejszej szerokości** | Zadanie s. 14: interfejs w pełni responsywny | ⚠️ Zespół zgłosił, że ścieżka odjeżdża z linii przy mniejszej rozdzielczości. Nie naprawiono i nie zdiagnozowano |
| 7 | **Jakość odpowiedzi czatu** | Zadanie s. 15: jury praktycznie testuje demo | ⚠️ Zespół zgłasza słabe odpowiedzi modelu. Wcześniejsza próba: na „Ile trwa urlop ojcowski?” brak „14 dni”. W tym przeglądzie czatu nie testowano |
| 8 | **3 pliki testów zespołu padają** | Zadanie s. 15: przegląd kodu | 🟡 `g7-eval`, `opportunities`, `rest-contract`. Padają tak samo na czystym `origin/main` sprzed `e3f7a89` |
| 9 | **Stare ekrany próbne są publiczne** | Zadanie s. 15: przegląd kodu i demo | 🟡 `/demo/polaczenia` (ekran próby bez stylów), `/profil/sprawa-testowa` (przykład Alicji z wynikiem na sztywno), `/app`, `/app/kamil`, `/app/chorobowe`, `/zusik`, `/zusik/kamil` działają. Poprzednia wersja checklisty podawała, że przekierowują do planu — to nieprawda od commita `14c019f` |

---

## 1. Funkcje merytoryczne (zadanie s. 12–13, „Narzędzie powinno zapewnić”)

| Pkt | Wymaganie | Status | Gdzie / co jest | Ograniczenia |
|---|---|---|---|---|
| — | Uprawnienia według indywidualnej sytuacji, z danych ZUS albo wpisanych (s. 12) | 🟡 | Jedna rodzina demonstracyjna (Ola, `DEFAULT_PLAN_ID`), z symulowanym importem. Własne dane wpisuje się w kalkulatorze (podstawa, oboje rodzice, data) i na `/sprawdz` (fakty ubezpieczenia) | `/start` przekierowuje do `/plan`. Komponent onboardingu (`features/onboarding/Onboarding.tsx`) nie jest nigdzie użyty, więc nie da się zbudować planu dla innej rodziny |
| a | Zasiłek chorobowy w ciąży, także brak uprawnień | ✅ | Przystanek „Zasiłek chorobowy w ciąży” (30/90 dni, 100%, 270 dni). Ocena dokumentów z wynikiem „brak ubezpieczenia”: `/profil/przyklad-ubezpieczenia` (wejście z Profil → Konto eZUS → Zwolnienia e-ZLA) i `/app/chorobowe` | W planie Oli etap Ciąża jest zwinięty jako „Za Tobą” |
| a | Świadczenie rehabilitacyjne | ✅ | Przystanek „Długie zwolnienie: świadczenie rehabilitacyjne”: po 270 dniach, najdłużej 12 mies., orzecznik ZUS, 90%/75%, w ciąży 100%. Źródła: UZ art. 18–19, rozporządzenie zał. 5, Poradnik s. 25 | Tylko informacja, bez wyliczenia |
| a | Zasiłek w wysokości zasiłku macierzyńskiego | ✅ | Przystanek „Gdy pracodawca upadnie albo zostanie zlikwidowany” (UZ art. 30–31, 47, 61; rozporządzenie § 15, 17). Reguła na `/sprawdz` rozstrzyga art. 30 (upadłość, likwidacja, śmierć pracodawcy, wyrok, umowa przedłużona do porodu); sprawa z zestawu „Łód_3” jest zgodna z decyzją | Kalkulator nie liczy kwoty tego zasiłku. Ustawa (art. 30 ust. 3) nie obejmuje przypadku naruszenia prawa, który wymienia treść zadania (s. 4); opisano to zgodnie z ustawą |
| b | Kalkulator dla obojga rodziców: okres i kwota, liczba dzieci, wiek, „Za życiem” | ✅ | `/kalkulator` (`features/calculator`, `lib/rules/maternity.ts`): 1–5+ dzieci, „Za życiem”, wcześniak i szpital, martwe urodzenie, 81,5% albo 100/70 z porównaniem, wypłaty miesiąc po miesiącu, terminy | Zgon dziecka po porodzie: reguła `birthLeaveWindow` to obsługuje, ale formularz kalkulatora nie ma tego pola |
| c | Łączenie pracy z urlopem rodzicielskim | ✅ | Praca na część etatu: dłuższy urlop, niższy zasiłek, limity tygodni | Dla niepracowników kalkulator oznacza wynik „do weryfikacji” |
| d | Oboje rodzice korzystają z uprawnień | ✅ | Przejęcie urlopu macierzyńskiego, rodzicielski kolejno albo razem, 9 tygodni nieprzenoszalnych, ojcowski, drugi rodzic nieubezpieczony | Część stawek przy przejęciu oznaczona w wyniku „do weryfikacji” |
| e, j | Rodzice adopcyjni i niezawodowa rodzina zastępcza (pkt e i j się powtarzają) | ✅ | Kalkulator: adopcja do 14 lat, piecza do 7 (10 przy odroczeniu), min. 9 tyg. `/sprawdz`: granice wieku i wyłączenie zawodowej rodziny zastępczej | Wiek kilku dzieci przyjętych razem trzeba potwierdzić (komunikat w wyniku) |
| f | Indywidualna podstawa i symulacja sprawy z zestawu | ✅ | Podstawa: z decyzji, średnia albo 12 miesięcy. 3 sprawy z kwotami (`lib/plan/benefit-presets.ts`) zgodne z decyzjami co do grosza (testy). Odczyt PDF w kalkulatorze (`CasePdf`) proponuje kwotę oznaczoną jako „podstawa wymiaru” | Na skanach kwota często nie zostaje rozpoznana; wtedy wpisuje się ją ręcznie |
| — | Jeden zintegrowany kalkulator (rekomendacja, s. 13) | ✅ | Jeden `BenefitCalculator` | — |
| g | Dokumenty, terminy, sposób złożenia; płatnik albo ZUS | ✅ | Kalkulator: „kto wypłaca zasiłek?” dla każdego rodzica (`Payer`, reguła art. 61 z progiem z panelu). Przystanki: co przygotować, jak złożyć, termin. Wnioski z odbiorcą i kanałem | Liczbę ubezpieczonych u płatnika podaje rodzic |
| h | Zagrożenia i ryzyka utraty lub obniżenia świadczeń | 🟡 | Przystanek „Co może odebrać albo obniżyć zasiłek”: umowa dla pozoru, podwyżka w ciąży, brak ubezpieczenia w dniu porodu, zaległości w składkach. `/sprawdz` pokazuje odmowy z tych powodów na sprawach z zestawu | Ostrzeżenia dopasowane do sytuacji (działalność, inna umowa, zmiana pracy, świadczenie rodzicielskie) działają tylko w planach z onboardingu, a onboarding jest wyłączony. Przystanek z ryzykami jest w zwiniętym etapie Ciąża |
| i | Organizacje charytatywne | ✅ | `/wsparcie`: 6 fundacji z datą weryfikacji, dane z edycji panelu admina (`supportOrganizations`) | — |

## 2. Symulacje integracji (zadanie s. 13–14, „Narzędzie powinno zapewnić możliwość”)

| Wymaganie | Status | Gdzie / co jest | Ograniczenia |
|---|---|---|---|
| Logowanie przez mObywatela (symulacja) | ✅ | `/logowanie`, `/logowanie/mobywatel`; także login.gov.pl i aplikacja ZUS | — |
| Pobranie danych z ZUS albo wpisanie własnych (symulacja) | ✅ | Symulowany import rodziny Oli, „Odśwież dane rodziny” w Profil → Konto eZUS. Własne dane: kalkulator i `/sprawdz` | Jeden profil demonstracyjny |
| Zadłużenie składkowe na dzień powstania prawa (symulacja zaświadczenia i kwoty) | ✅ | Profil → Konto eZUS → „Przykładowe zaświadczenie o zadłużeniu”: wariant 0 albo 200 zł na 02.11.2026, wynik reguły art. 2a z progiem z panelu. `/sprawdz`: zadłużenie w sprawach z zestawu i we własnych faktach | Dwa warianty kwoty |
| Podgląd e-ZLA (symulacja) | ✅ | Profil → Konto eZUS → „Zwolnienia e-ZLA”: okresy i kod B z fikcyjnego pakietu | Bez danych lekarza |
| Połączenie z PUE/eZUS: pytanie, dane konta | ✅ | Profil → Konto eZUS: odświeżenie danych, „Zapytaj ZUS” z korespondencją w sesji demo | Korespondencja tylko w tej sesji przeglądarki |
| Wypełnienie wniosków o urlopy i świadczenia, przesłanie do pracodawcy lub ZUS | ✅ | `/dokumenty`: 11 wzorów — urlop macierzyński przed porodem, ojcowski, rodzicielski, łączenie rodzicielskiego z pracą (zaprojektowane), ZAM, zgłoszenie dziecka do ubezpieczenia zdrowotnego, 800+ (SW-R), becikowe (SR-2), zgłoszenie urodzenia, odpis aktu, deklaracja POZ. Wypełniony PDF do pobrania dla 9 z 11: oficjalne wzory ZAM (z 24.10.2026), SR-2 i POZ oraz pisma dla wniosków urlopowych, odpisu i zgłoszenia dziecka do ubezpieczenia. 800+ (tylko kanały elektroniczne) i zgłoszenie urodzenia nie mają PDF. Przekazanie i potwierdzenie w symulacji | Przekazanie jest symulacją |
| Wniosek o odpis aktu urodzenia (zupełny lub skrócony) | ✅ | Wzór „Wniosek o wydanie odpisu aktu urodzenia dziecka” (`lib/demo/forms-civil.ts`), przystanek w planie, link do gov.pl w stopce | — |
| Informacje o podmiotach wsparcia | ✅ | Jak pkt i | — |
| Linki do zus.pl, gov.pl/web/rodzina/urlop-rodzicielski, pip.gov.pl/…/rodzicielstwo | ✅ | Stopka strony głównej ma dokładnie te adresy. Źródło PIP w planie wskazuje stronę z zadania | — |
| Panel administracyjny: zmiana parametrów | ✅ | `/admin`: reguły, przygotowanie zmiany ze sprawdzeniem, publikacja od daty, historia, sprawy testowe (z odczytem PDF), organizacje wsparcia. Opublikowane wartości trafiają do kalkulatora (`maternityParametersOn`), progu płatnika, zaświadczenia o zadłużeniu, `/wsparcie` i `/sprawdz` | Zmiany obowiązują w sesji przeglądarki (podpisane ciasteczko). Wdrożenie produkcyjne wymaga trwałej bazy. Logowanie demo jednym kliknięciem trzeba wyłączyć po konkursie |

## 3. Test jury na przykładowych wnioskach (zadanie s. 14–15)

> „na stronie powinna być możliwość przetestowania wybranych załączonych przykładów (formularze w pdf) tak, aby zweryfikować czy osoba posiada ubezpieczenie oraz umożliwić sprawdzenie kalkulatora” · „Strona powinna mieć możliwość uploadu/wyboru wybranych wniosków”.

| Element | Status | Gdzie / wynik |
|---|---|---|
| Wybór sprawy z zestawu: czy osoba ma prawo | ✅ | `/sprawdz` (Profil → „Sprawdź sprawę z zestawu ZUS”): 10 spraw z zestawu (6 odmów, 4 przyznania) jako same fakty, bez danych osobowych. Wynik reguły zgodny z decyzją ZUS w 10/10 (test i Chrome). Przypisy z cytatem przepisu |
| Wybór sprawy z zestawu: kwoty | ✅ | Kalkulator: 3 sprawy z kwotami z decyzji, zgodne co do grosza (testy) |
| Upload PDF do sprawdzenia ubezpieczenia | ✅ / 🟡 | `/sprawdz` → „Wgraj PDF sprawy”: OCR wszystkich stron w przeglądarce (ok. 25 s dla 14–16 stron), podpowiedzi faktów z fragmentem i podglądem strony, potwierdzenie w formularzu. Sprawdzone w Chrome na 2 skanach: umowa dla pozoru — wynik zgodny z ZUS; ojciec z zadłużeniem — odczytano rolę, okres, tytuł i zadłużenie, a ekran pyta o brakujący fakt (ubezpieczenie). Daty z kratek i pisma odręcznego często trzeba wpisać ręcznie |
| Upload PDF → podstawa → kalkulator | 🟡 | Kalkulator → „Sprawdź przykładową sprawę lub dokument PDF” (`CasePdf`): proponuje kwotę opisaną jako „podstawa wymiaru”. Na skanach z zestawu zwykle jej nie znajduje i kwotę wpisuje się ręcznie |
| Sprawy odmowne | ✅ | `/sprawdz`: 6 odmów z zestawu (pozorna umowa, brak ubezpieczenia w dniu porodu, brak ponownego zgłoszenia, zlecenie bez chorobowego, dwa zadłużenia). Panel admina: K-06, K-08 |
| Instrukcja dla jury | 🟡 | README („Jak sprawdzić projekt”) i sekcja „Jak przetestować” na `/sprawdz`. README nie wspomina `/sprawdz` (pkt 0.5) |

## 4. Wymagania formalne (zadanie s. 14)

| Wymaganie | Status | Uwagi |
|---|---|---|
| Szczegółowy opis i tytuł | ✅ | [README](README.md): „Zusik · Przewodnik Rodzica” |
| Prezentacja do 10 slajdów | ✅ | [6 slajdów](zgloszenie/przewodnik-rodzica.pdf) |
| Film do 3 minut w dostępnym, otwartym repozytorium | 🟡 | 60 s; brak publicznego linku (pkt 0.2) |
| Repozytorium kodu | ✅ / ⚠️ | GitHub `szpoter/straylight_hacknation` (prywatne); dla jury czysta kopia (pkt 0.3) |
| Zrzuty ekranu | ✅ | [6 zrzutów](zgloszenie/): plan, kalkulator, dokumenty — komputer i telefon |
| Link do demo jako strony internetowej | ✅ | https://straylight-hacknation.vercel.app — 14 głównych tras odpowiada (200, `/start` → `/plan`) |
| Interfejs w pełni responsywny | 🟡 | `/sprawdz` bez poziomego przewijania przy 390 px (Chrome). Zgłoszony problem ścieżki „Mój plan” przy mniejszej szerokości (pkt 0.6). Safari i fizyczny telefon: nie sprawdzono |
| Materiały graficzne | ✅ / ⚠️ | Zrzuty, film, maskotka; licencje mediów (pkt 0.4) |
| Wskazanie funkcji AI | ✅ | README „Gdzie działa AI”; deklaracja narzędzi do poprawy (pkt 0.1) |

## 5. Wymagania techniczne (zadanie s. 15)

| Wymaganie | Status | Uwagi |
|---|---|---|
| Aplikacja webowa RWD | 🟡 | Jak w sekcji 4 |
| Frontend React/Next.js | ✅ | Next.js 16, React 19, TypeScript strict |
| Backend JavaScript/Python | ✅ | Node.js (trasy API Next.js), skrypty Python |
| REST API | ✅ | `app/src/app/api/`: `v1/sessions`, `v1/[...path]` (GET, POST, PATCH, DELETE), `zusik`, `zusik/ask`, `zusik/session`, `zusik/state`, `zusik/marta`, `zusik/marta/pdf`, `zusik/sickness`, `zusik/sickness/evidence/[id]`, `kamil` |
| Działa w warunkach testowych | ✅ / 🟡 | `tsc`, `npm run lint` i `npm run build` przechodzą. Testy: 685 zaliczonych, 2 nieudane, 9 pominiętych; 3 pliki nie przechodzą (pkt 0.8) |
| Potencjał wdrożeniowy | ✅ | Reguły w kodzie z testami, parametry zmieniane w panelu od daty, sesje podpisane, klucze tylko na serwerze, REST |
| Przejrzysta struktura kodu | 🟡 | README i `app/ARCHITECTURE.md` opisują układ. Stare ekrany i katalogi robocze w repo (pkt 0.9, `maskotka_kod/`, `ui/`, `PLAN-*.md`) |

## 6. Funkcje AI (do opisu, zadanie s. 14 i s. 16)

| Funkcja | AI? | Jak działa |
|---|---|---|
| Rozmowa z Zusikiem | AI | Model językowy Bielik albo PLLuM (wybór od commita `1e6143c`) przez Vercel AI SDK; wyszukiwanie w Qdrant (`multilingual-e5-small`) po przepisach i Poradniku ZUS; odpowiedź z przypisami. Jakość odpowiedzi: pkt 0.7 |
| Prowadzenie sprawy w rozmowie | AI + reguły | LangGraph; model formułuje tekst, kwoty i terminy liczy kod (`lib/rules`) |
| Odczyt dokumentów (OCR) | Uczenie maszynowe | PDF.js (warstwa tekstu) i Tesseract.js z polskim modelem w przeglądarce: czat, kalkulator, `/sprawdz`, panel admina. Rozpoznawanie tekstu, nie generatywne AI |
| Kalkulator, plan, terminy, `/sprawdz`, panel admina | Bez AI | Wyniki liczy kod według przepisów, z testami zgodności z decyzjami ZUS. Model nie liczy kwot |
| Praca nad projektem | AI | README i slajd 6: Codex, ElevenLabs. Brakuje Claude Code (pkt 0.1) |

## 7. Rozwiązania zewnętrzne (regulamin § 4 ust. 1)

Wykaz na slajdzie 6: Next.js, React, TypeScript, Tailwind CSS, Motion, Flubber, Lenis, fonty Literata, Inter, Domine, DejaVu · Vercel AI SDK, Bielik, Sherlock / CloudFerro, LangGraph.js, LangChain, Qdrant, multilingual-e5-small, Ollama · Neon PostgreSQL, pg, Zod, PDF.js, pdf-lib, fontkit, Tesseract.js · Vercel, GitHub Actions, Vitest, Playwright, @napi-rs/canvas · Codex, ElevenLabs · treści: ZUS, gov.pl, PIP, Dziennik Ustaw (ELI), strony organizacji wsparcia.

Brakuje na slajdzie: **PLLuM** (drugi model czatu od `1e6143c`), **Claude Code** (narzędzie AI przy kodzie), źródła zdjęć i wideo ze strony głównej.

## 8. Regulamin

| Punkt | Status | Uwagi |
|---|---|---|
| § 4 ust. 1: autorstwo, wskazanie rozwiązań zewnętrznych w prezentacji | 🟡 | Slajd 6 jest, ale niekompletny (sekcja 7) |
| § 4 ust. 2: brak wad prawnych i naruszeń praw osób trzecich | ⚠️ | Licencje mediów (pkt 0.4); akta ZUS w repo (pkt 0.3); ekrany mObywatel i login.gov.pl to symulacja wyglądu — warto to opisać |
| Zakaz kopiowania i rozpowszechniania akt (zadanie s. 12) | ⚠️ | Aplikacja serwuje tylko pliki fikcyjne (`public/demo`), a sprawy w kalkulatorze i na `/sprawdz` to same fakty i liczby. PDF-y akt są jednak w Git (pkt 0.3) |
| § 3 ust. 5: kod z opisem | ✅ | README, `app/README.md`, `app/ARCHITECTURE.md` |

## 9. Kryteria oceny (zadanie s. 16)

| Kryterium | Waga | Mocne strony | Co podnieść |
|---|---|---|---|
| Związek z wyzwaniem | 25% | Pkt a–j pokryte; kalkulator i `/sprawdz` zgodne z decyzjami ZUS; oficjalne wzory wniosków | Ostrzeżenia dopasowane do sytuacji (pkt h) |
| Pomysł | 20% | Plan rodziny od ciąży, „model mówi, kod liczy”, przypisy do przepisów | Pokazać w filmie |
| Oryginalność | 15% | Maskotka, ścieżka 3D, sprawy prowadzone rozmową | — |
| Kompletność i UX | 25% | Przebieg od logowania przez plan, kalkulator i wniosek | Ścieżka przy mniejszej szerokości, jakość czatu, stare ekrany próbne |
| Potencjał wdrożeniowy | 15% | Panel z wersjonowaniem od daty, testy, REST | Trwały rejestr zmian panelu, zielone wszystkie testy |
