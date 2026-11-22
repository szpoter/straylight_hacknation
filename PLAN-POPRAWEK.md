# Plan poprawek do 100% wymagań zadania ZUS

**Stan na 22.11.2026, commit `8733f14`.** Plan domyka pozycje, które w [CHECKLISTA-WYMAGAN.md](CHECKLISTA-WYMAGAN.md) mają status 🟡, ❌ albo ⚠️. Numery w nawiasach kwadratowych wskazują wiersz checklisty, np. [0.6] to sekcja 0, punkt 6, a [1.h] to sekcja 1, punkt h.

## Co zrobiono od poprzedniej wersji planu (`e6d09b5`)

Te zadania z poprzedniej wersji są zamknięte i wypadły z planu:

- **Reguła prawa do zasiłku macierzyńskiego** (dawne 1.1): `lib/rules/maternity-eligibility.ts`, `case-maternity.ts`, `case-assessment.ts`.
- **Zestaw spraw bez akt** (dawne 1.2): `lib/cases/zestaw.ts`, 10 spraw (6 odmów, 4 przyznania), zgodność z decyzjami 10/10. Te same sprawy są w panelu admina, gdzie testy wychodzą 26/26 (`8733f14`).
- **Ekran `/sprawdz` z instrukcją** (dawne 1.3, 1.6). Wejście jest w Profilu, a parametr `?sprawa=` otwiera wskazaną sprawę.
- **Upload skanu z OCR i potwierdzeniem faktów** (dawne 1.4): `lib/cases/read-case.ts`. Panel admina czyta PDF w sprawach testowych.
- **Kalkulator, sprawy z zestawu** (dawne 1.5, częściowo): 7 spraw w `lib/plan/benefit-presets.ts` (`15d003b`).
- **Płatnik czy ZUS** (dawne 2.1): w kalkulatorze („kto wypłaca zasiłek?”), z progiem z panelu.
- **Zaświadczenie o zadłużeniu, e-ZLA, eZUS** (dawne 2.2–2.4): Profil → Konto eZUS.
- **Link do PIP** (dawne 2.5): `SRC.pip` wskazuje adres z zadania.
- **Kalkulator czyta parametry z panelu** (dawne 2.7, częściowo): `maternityParametersOn`.
- **Panel → ekrany rodzica** (dawne 2.8): `/wsparcie`, próg płatnika i próg zadłużenia biorą wartości z panelu.
- **Część RWD** (dawne 3.7): `1362f50` (układy przy zmianie szerokości) i `df25eb4` (kroki sprawy testowej na telefonie).

## Zasady dla każdej poprawki

- **Źródło przed tekstem.** Każde zdanie o prawie musi mieć podstawę w korpusie (`app/corpus/publiczne/fragments.jsonl`) albo na zus.pl lub gov.pl. Wzór: `lib/demo/stop-details.ts` (pole `uwagi` na rozbieżności).
- **Kod liczy, model mówi.** Kwoty, terminy i rozstrzygnięcia o prawie liczy `lib/rules`. Każda nowa reguła ma test w `app/tests/`.
- **Akt ZUS nie kopiujemy.** Ze spraw z zestawu bierzemy tylko fakty i liczby, bez danych osobowych i bez plików (zadanie s. 11–12).
- **Kalkulator należy do Macieja.** Zadania oznaczone **[Maciej]** wymagają jego zgody i to on decyduje o sposobie wykonania.
- **Odbiór każdego zadania:** `npm test`, `npx tsc --noEmit`, `npm run lint` i `npm run build` przechodzą (z katalogu `app/`). Potem przeklikanie na komputerze i przy szerokości 390 px.

Rozmiar zadań: S to do 2 godzin, M to pół dnia, L to dzień lub więcej.

---

## Etap 1. Przed oddaniem: zgłoszenie i regulamin

Zadania z sekcji 0 checklisty. Pierwsze trzy wymagają decyzji albo materiałów zespołu.

### 1.1 Pełna deklaracja AI i rozwiązań zewnętrznych (S) [0.1], [6], [7], [8 § 4 ust. 1]

- README („Gdzie działa AI” i opis pracy nad projektem) oraz slajd 6 prezentacji: dopisać **Claude Code** (Anthropic) obok Codex i ElevenLabs.
- Slajd 6: dopisać **PLLuM**, drugi model czatu od `1e6143c`.
- Slajd 6: dopisać źródła zdjęć i wideo ze strony głównej (zależy od 1.3).
- **Odbiór:** wykaz na slajdzie 6 zgadza się z sekcją 7 checklisty, a w sekcji 6 nie ma już „brakuje”.

### 1.2 Publiczny link do filmu (S, zespół) [0.2], [4]

- Film `plans/film/v1/przewodnik-rodzica-1080p.mp4` wrzucić do otwartego repozytorium albo serwisu z publicznym linkiem i wpisać link do README.

### 1.3 Licencje mediów (S, zespół) [0.4], [8 § 4 ust. 2]

- Ustalić pochodzenie `app/public/media/hero-family.mp4` i `app/assets/*.jpg`, zapisać źródło i licencję (np. w README albo `app/public/media/ZRODLA.md`).
- Jeśli licencja nie pozwala na użycie, podmienić plik.
- Opisać w README, że ekrany mObywatela i login.gov.pl to symulacja wyglądu.

### 1.4 Czysta kopia repozytorium dla jury (S) [0.3], [4], [8]

- Przygotować kopię kodu bez `Materiały hackathonowe/Sprawy/` i bez historii Git. Sprawdzić, że build przechodzi na tej kopii.
- Testy nie mogą czytać PDF-ów akt. Sprawdzić `grep -r "Sprawy/" app/tests app/src`.

### 1.5 `/sprawdz` w README (S) [0.5], [3 instrukcja]

- W „Jak sprawdzić projekt” dopisać krok: Profil → „Sprawdź sprawę z zestawu ZUS”, wybór sprawy albo „Wgraj PDF sprawy”. Dodać, czego się spodziewać: werdykt z przypisem, OCR trwa ok. 25 s, daty z kratek trzeba czasem wpisać.

---

## Etap 2. Kompletność i UX (25% oceny)

### 2.1 Ścieżka „Mój plan” przy mniejszej szerokości (M) [0.6], [4 RWD], [5 RWD]

- Zespół zgłosił, że ścieżka odjeżdża z linii. Commit `1362f50` zmienił `VerticalPath.tsx` (`max-w-[48vw]` dla etykiet), ale nie wiadomo, czy to usunęło problem.
- Najpierw odtworzyć zgłoszenie w Chrome przy 320, 360, 390, 768 i 1024 px (skrypt `app/scripts/responsive-browser.mjs`). Potem zdiagnozować i naprawić. Animacje ścieżki należą do zespołu, więc zmieniamy tylko układ.
- **Odbiór:** zrzuty dla tych szerokości, punkty i etykiety leżą na linii.

### 2.2 Jakość odpowiedzi czatu (M) [0.7], [6]

- Dopisać 15–20 typowych pytań rodzica z oczekiwanym faktem do `corpus/publiczne/eval.json`, m.in.:
  - ile trwa urlop ojcowski, macierzyński i rodzicielski;
  - ile procent i termin wniosku o 81,5%;
  - kto wypłaca;
  - zadłużenie;
  - świadczenie rehabilitacyjne;
  - upadłość pracodawcy.
- Uruchomić ocenę `npx tsx scripts/zusik-eval-public.ts` dla obu modeli (Bielik i PLLuM) i dopisać polecenie do `package.json`.
- Poprawić przepisanie zapytania (`lib/rag/public-query.ts`, `lib/zusik/retrieval-context.ts`) dla pytań o długość urlopu.
- **Odbiór:** właściwy fragment w pierwszej piątce dla ≥ 18/20 pytań, a odpowiedź o urlopie ojcowskim zawiera „14 dni” lub „2 tygodnie” z przypisem.

### 2.3 Stare ekrany próbne (M) [0.9], [5 struktura]

Publicznie działają `/demo/polaczenia`, `/profil/sprawa-testowa`, `/app`, `/app/rozmowa`, `/app/sprawy`, `/app/kamil`, `/app/chorobowe`, `/zusik`, `/zusik/kamil` i `/app/kalkulator`.

- Ustalić z zespołem, które z nich są potrzebne. Panel admina linkuje do `/app/kamil` („Pokaż oczami rodzica”), a profil do `/app/chorobowe` przez `/profil/przyklad-ubezpieczenia`.
- `/demo/polaczenia` usunąć (`ARCHITECTURE.md` każe go usunąć po etapie 1).
- `/profil/sprawa-testowa` (przykład Alicji z wynikiem na sztywno, `TestCaseWizard.tsx`, `TEST_FIELDS`) zastąpić przekierowaniem do `/sprawdz` albo jasno oznaczyć jako przykład bez odczytu.
- Pozostałe nieużywane trasy przekierować do `/plan`.
- Zaktualizować `app/ARCHITECTURE.md`.
- **Odbiór:** w aplikacji nie ma ekranu, który udaje odczyt dokumentu, a każda działająca trasa ma wejście z interfejsu.

### 2.4 Ryzyka dopasowane do sytuacji (M) [1.h], [9 związek z wyzwaniem]

- Ostrzeżenia zależne od sytuacji (działalność, inna umowa, zmiana pracy, świadczenie rodzicielskie) działają tylko w planach z onboardingu, a onboarding jest wyłączony (`/start` → `/plan`, `Onboarding.tsx` nieużyty).
- Wariant bez onboardingu: pokazać ryzyka na `/sprawdz` przy własnych faktach i w kalkulatorze przy wyniku [Maciej]. Przystanek z ryzykami w planie Oli przenieść albo podlinkować z etapu, który nie jest zwinięty.
- Wariant z onboardingiem łączy się z 2.5.
- **Odbiór:** juror bez wpisywania adresu trafia na ostrzeżenie właściwe dla działalności z zadłużeniem i dla zmiany pracy w ciąży.

### 2.5 Plan dla innej rodziny niż Ola (L, decyzja zespołu) [1 sytuacja indywidualna]

- Zgodnie z decyzją właściciela demo ma jedną rodzinę. Jeśli zespół chce 100% tego wiersza, trzeba przywrócić onboarding (`features/onboarding/`) jako ścieżkę „Wpisz własne dane” obok importu Oli.
- Bez tej decyzji wiersz zostaje ograniczeniem demo, opisanym w checkliście z uzasadnieniem.

### 2.6 Kalkulator: przypadki brzegowe i podstawa z PDF [Maciej] (M) [1.a], [1.b], [1.f], [3 upload → kalkulator]

Brakuje względem wymagań:
- formularz nie ma pola „zgon dziecka po porodzie”, choć reguła `birthLeaveWindow` to obsługuje (zadanie s. 6);
- kalkulator nie liczy kwoty zasiłku w wysokości zasiłku macierzyńskiego (upadłość pracodawcy);
- `CasePdf` na skanach z zestawu zwykle nie znajduje „podstawy wymiaru” i kwotę wpisuje się ręcznie.

Decyzja i wykonanie: Maciej.

---

## Etap 3. Przegląd kodu i testy (potencjał wdrożeniowy, 15%)

### 3.1 Testy zespołu, które padają (M) [0.8], [5 testy]

- `g7-eval`, `opportunities`, `rest-contract`: ustalić przyczynę (padają tak samo przed `e3f7a89`), naprawić albo opisać jako wymagające usługi zewnętrznej i pomijać bez niej (`skipIf`).
- **Odbiór:** `npm test` bez nieudanych testów.

### 3.2 Katalog główny repo (S, po uzgodnieniu z zespołem) [5 struktura]

- Prototypy i notatki robocze przenieść do `docs/robocze/` albo opisać w README: `maskotka_kod/`, `Przewodnik-Rodzica.html`, `PLAN-*.md`, `MASTER-PROMPT-ZUSIK.md`, `ui/*-prompt*.md`, `inspiracjeelementowistron.md`.
- Dwie kopie maskotki (`components/mascot/*` i `components/mascot/babelek/*`): usunąć duplikat bez zmiany ruchu.
- Przejrzeć `TODO(backend)`, `TODO(julian)`, `TODO(admin)` w `app/src`.

### 3.3 Trwały rejestr zmian panelu (L, opcjonalnie) [2 panel], [9 potencjał]

- Dziś zmiany panelu żyją w podpisanym ciasteczku sesji. Do wdrożenia potrzebna jest baza (Neon PostgreSQL już jest w stosie). Na konkurs wystarczy opis ograniczenia w README.

### 3.4 Przegląd RWD na końcu (M) [4 RWD]

- Po 2.1 i 2.3 sprawdzić przy 390 i 1440 px: `/`, `/logowanie` (trzy metody), `/plan`, `/kalkulator`, `/dokumenty`, `/dokumenty/[id]`, `/profil`, `/wsparcie`, `/sprawdz`, `/admin` z widokami. Do tego Safari albo fizyczny telefon, którego checklista nie sprawdzała.
- **Odbiór:** brak poziomego przewijania, przyciski nad dolnym paskiem dostępne, klawiatura działa.

---

## Kolejność

| Krok | Zadania | Kto / zależność | Rozmiar |
|---|---|---|---|
| 1 | 1.1 deklaracja AI, 1.5 README `/sprawdz` | — | S |
| 2 | 1.2 film, 1.3 licencje mediów | zespół | S |
| 3 | 2.1 ścieżka planu, 2.2 jakość czatu | — | M + M |
| 4 | 2.3 stare ekrany | uzgodnienie z zespołem | M |
| 5 | 3.1 testy | — | M |
| 6 | 2.4 ryzyka, 2.6 kalkulator | Maciej dla kalkulatora | M |
| 7 | 1.4 czysta kopia dla jury | po wszystkich zmianach kodu | S |
| 8 | 3.4 RWD, 3.2 porządek | na końcu | M |
| — | 2.5 plan dla innej rodziny, 3.3 baza panelu | decyzja zespołu | L |

## Definicja „100%”

Plan jest wykonany, gdy w [CHECKLISTA-WYMAGAN.md](CHECKLISTA-WYMAGAN.md) sekcje 0–5 i 8 nie mają ani jednego 🟡, ❌ ani ⚠️. Wyjątek stanowią wpisy świadomie opisane jako ograniczenie demo, z uzasadnieniem (np. symulacje integracji, jedna rodzina, jeśli zespół tak zdecyduje). Do tego wszystkie testy, typy, lint i build przechodzą, a produkcja po deployu odpowiada na wszystkie trasy.
