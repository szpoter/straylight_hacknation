# Plan poprawek do 100% wymagań zadania ZUS

**Stan na 22.11.2026, commit `e6d09b5`.** Ten plan domyka wszystko, co w [CHECKLISTA-WYMAGAN.md](CHECKLISTA-WYMAGAN.md) ma status 🟡, ❌ albo ⚠️. Pomija sprawy formalne zgłoszenia (opis, prezentacja, film, zrzuty ekranu, lista AI i rozwiązań zewnętrznych), bo zespół już je przygotowuje.

## Zasady dla każdej poprawki

- **Źródło przed tekstem.** Każde zdanie o prawie musi mieć podstawę w korpusie (`app/corpus/publiczne/fragments.jsonl`) albo na zus.pl lub gov.pl. Bez źródła tekst nie wchodzi do aplikacji. Wzór: `lib/demo/stop-details.ts` (pole `uwagi` na rozbieżności).
- **Kod liczy, model mówi.** Kwoty, terminy i rozstrzygnięcia o prawie liczy `lib/rules`. Każda nowa reguła ma test w `app/tests/`.
- **Akt ZUS nie kopiujemy.** Ze spraw z zestawu bierzemy tylko liczby i fakty potrzebne do wyliczenia, bez danych osobowych i bez plików (zadanie s. 11–12). Tak samo zrobiono w `lib/plan/benefit-presets.ts`.
- **Kalkulator należy do Macieja.** Zadania oznaczone **[Maciej]** wymagają jego zgody i to on decyduje o sposobie wykonania. Ten plan opisuje tylko, czego brakuje względem wymagań.
- **Odbiór każdego zadania:** `npm test`, `npx tsc --noEmit`, `npm run lint` i `npm run build` przechodzą (z katalogu `app/`). Potem przeklikanie na komputerze i przy szerokości 390 px.

Rozmiar zadań: S to do 2 godzin, M to pół dnia, L to dzień lub więcej.

---

## Etap 1. Test jury na sprawach z zestawu (zadanie s. 14–15)

Jury wybierze sprawy z zestawu, sprawdzi, czy osoba ma ubezpieczenie, i porówna wyliczenia z decyzjami. Strona ma przyjmować upload albo wybór wniosku. Ważny fakt: **wszystkie 87 PDF-ów w `Materiały hackathonowe/Sprawy/` to skany bez warstwy tekstu.** Odczyt wymaga OCR, który już jest w aplikacji (Tesseract.js, polski model, `features/kamil/read-document.ts`).

### 1.1 Reguła „czy osoba ma prawo do zasiłku macierzyńskiego” (L)

Dziś nie ma jednej reguły, która rozstrzyga prawo do zasiłku macierzyńskiego. Są tylko fragmenty: `sickness.ts`, `arrears.ts`, `paternity.ts`.

- Nowy plik `app/src/lib/rules/maternity-eligibility.ts` z funkcją `assessMaternityEligibility(facts)`. Na wejściu dostaje fakty:
  - tytuł ubezpieczenia;
  - rodzaj ubezpieczenia chorobowego (obowiązkowe albo dobrowolne);
  - okresy ubezpieczenia chorobowego;
  - zdarzenie i jego datę (poród, przyjęcie dziecka, wiek dziecka, rodzina zastępcza zawodowa albo nie);
  - koniec zatrudnienia i jego przyczynę (śmierć, upadłość lub likwidacja pracodawcy, wyrok o naruszeniu prawa, umowa przedłużona do porodu);
  - zadłużenie składkowe na dzień powstania prawa i datę spłaty.
- Wynik: `przysługuje`, `nie przysługuje`, `wstrzymany do spłaty` albo `brak danych` (z pytaniem o brakujący fakt). Do tego uzasadnienie i identyfikatory przepisów z korpusu.
- Podstawa: UZ art. 29 (`uz-29-1`, `uz-29-2`), art. 30 (`uz-30-1`, `uz-30-2`), art. 2a (`uz-2a-1`, `uz-2a-2`). Część o zadłużeniu woła istniejące `assessArrears`. Próg 1% płacy minimalnej idzie z harmonogramu panelu (`parameters.ts`), więc zmiana w panelu działa od razu.
- Testy `app/tests/maternity-eligibility.test.ts`, co najmniej po jednym przypadku na każdą gałąź:
  - poród w okresie ubezpieczenia;
  - poród dzień po ustaniu umowy;
  - upadłość w ciąży;
  - umowa przedłużona do porodu;
  - zleceniobiorca bez dobrowolnego chorobowego;
  - działalność z zadłużeniem poniżej i powyżej progu;
  - spłata przed i po 6 miesiącach;
  - adopcja dziecka w wieku 13 i 15 lat;
  - zawodowa rodzina zastępcza.
- **Odbiór:** każda gałąź zwraca poprawny status i niepustą listę `lawIds`.

### 1.2 Zestaw spraw testowych do wyboru: fakty bez akt (M)

- Nowy plik `app/src/lib/cases/zestaw.ts`. Dla 10–15 spraw z zestawu wpisujemy tylko fakty potrzebne regule z 1.1 i kalkulatorowi oraz wynik z decyzji ZUS. Identyfikator to skrót tytułu pliku bez nazwiska, np. „Sprawa 14: działalność, odmowa, zadłużenie”.
- Obowiązkowo także sprawy z **odmową**. Na podstawie tytułów plików w zestawie to:
  - brak ubezpieczenia w ciąży (Dagmara Chrz_2);
  - brak ubezpieczenia na dzień porodu (Ewa Łód_5);
  - brak zgłoszenia do ubezpieczeń (Helena Gd_5);
  - zadłużenie przy działalności lub współpracy (Joanna Wa I_5, Justyna Wa I_4, Piotr Cho_5);
  - umowa dla pozoru (Krystyna Zab_3);
  - zlecenie bez chorobowego (Małgorzata Rze_3);
  - matka nie podlega ubezpieczeniom (Paulina Po_7);
  - szósta część urlopu rodzicielskiego (Tomasz Po_11).
  
  Każdą przed wpisaniem trzeba otworzyć i sprawdzić fakty oraz kwoty z decyzji.
- Test, który dla każdej sprawy porównuje wynik reguły z wynikiem decyzji.
- **Odbiór:** zgodność 100% albo różnica opisana w polu `uwagi` sprawy z wyjaśnieniem.

### 1.3 Ekran „Sprawdź ubezpieczenie i zasiłek na przykładzie” (M)

- Trasa `/sprawdz` w obszarze rodzica (z paskiem kart) albo zakładka w Profilu w miejsce dzisiejszego przykładu Alicji (zob. 4.4). Ekran ma dwa wejścia:
  1. **Wybierz sprawę z zestawu**: lista z 1.2. Po wyborze widać fakty, werdykt reguły z przypisami i wynik decyzji ZUS obok siebie, ze znacznikiem „zgodne”. Przy sprawie z kwotami jest przycisk „Policz w kalkulatorze”, który otwiera `/kalkulator` z wczytaną sprawą (zob. 1.5).
  2. **Wgraj PDF**: przepływ z 1.4.
- **Odbiór:** juror w trzech kliknięciach dochodzi od listy spraw do werdyktu z przypisem do artykułu.

### 1.4 Upload skanu z zestawu: OCR i potwierdzenie pól (L)

- Ponowne użycie `ocrImage` i `pdfjs` z `features/kamil/read-document.ts`. Plik nie opuszcza przeglądarki, tak jak dziś.
- Ekstrakcja kandydatów z tekstu OCR przez wzorce po etykietach druków (Z-3, ZAM, decyzja, poświadczenie ubezpieczenia):
  - PESEL zamaskowany w widoku;
  - data porodu lub przyjęcia;
  - tytuł ubezpieczenia;
  - okres podlegania ubezpieczeniu chorobowemu;
  - „podstawa wymiaru”;
  - kwota zadłużenia.
  
  Każde pole pokazujemy z podglądem strony i wymagamy potwierdzenia albo poprawki. Tak samo działa tryb ręczny w `features/sickness/sickness-import.tsx`.
- Gdy OCR nie rozpozna pola, użytkownik wpisuje je sam. Werdykt zawsze liczy reguła z 1.1.
- **Najpierw spike (S):** OCR 5 różnych skanów, pomiar czasu i trafności pól. Jeśli trafność jest za niska, zostaje wariant „wgraj, zobacz stronę, wpisz pola z podpowiedzią, gdzie ich szukać”. Ten wariant też spełnia wymóg uploadu.
- Ten sam moduł zastępuje atrapę „Wgraj PDF” w panelu admina (`features/admin/cases-view.tsx:113–127`).
- **Odbiór:** na 3 wybranych skanach z zestawu przepływ kończy się werdyktem zgodnym z decyzją. Odczyt nie wysyła pliku na serwer (test jak `kamil-ocr.test.ts`).

### 1.5 Kalkulator: więcej spraw z zestawu i wczytanie sprawy z zewnątrz [Maciej] (M)

Brakuje względem wymagań (zadanie s. 13 pkt f, s. 15):
- 3 gotowe sprawy to mało, bo jury wybiera z całego zestawu;
- nie da się wczytać sprawy z 1.3 lub 1.4, czyli podstawy z dokumentu.

Rozwiązanie zależy od Macieja. Od strony zestawu dane będą gotowe w `lib/cases/zestaw.ts`.

### 1.6 Instrukcja testu w aplikacji (S)

- Krótka sekcja „Jak przetestować” na ekranie z 1.3, nie dokument zgłoszeniowy: które sprawy wybrać, gdzie jest kalkulator, gdzie panel admina, co jest symulacją.
- **Odbiór:** osoba spoza zespołu przechodzi test bez pomocy.

---

## Etap 2. Luki w funkcjach z zadania (s. 12–14)

### 2.1 Pkt g: gdzie złożyć dokumenty, płatnik czy ZUS (M)

Reguła `benefitPayer` (`lib/rules/payer.ts`, art. 61) działa tylko w panelu admina. Rodzic nie dostaje ukierunkowania.

- W onboardingu (`features/onboarding/flow.ts`) przy „Umowa o pracę” dochodzi pytanie: „Ilu pracowników zgłasza Twój pracodawca do ubezpieczenia chorobowego?” z odpowiedziami „do 20”, „więcej niż 20”, „nie wiem”. Przy danych z ZUS odpowiedź jest podpowiedziana z profilu (dziś: „do 20 ubezpieczonych”).
- Budowanie planu (`lib/plan/build.ts`) woła `benefitPayer` i dopisuje do spraw zasiłkowych (`zasilek-macierzynski`, `chorobowy-ciaza`, `z3`) notatkę ze źródłem:
  - „Zasiłek wypłaci ZUS. Pracodawca przekaże Z-3.” albo „Zasiłek wypłaci pracodawca.”;
  - przy działalności zawsze „Zasiłek wypłaci ZUS”;
  - przy „nie wiem” pytanie z `PayerResult.question`.
- Przystanek `z3` ma się pokazywać tylko wtedy, gdy wypłaca ZUS i osoba jest pracownikiem.
- W „Dokumentach” kanał wysyłki ma być podpowiedziany zgodnie z płatnikiem (`lib/demo/forms.ts`, `CHANNEL_LABEL`).
- Testy w `onboarding-build.test.ts` dla trzech wariantów i działalności.
- **Odbiór:** dwa plany różniące się tylko odpowiedzią o liczbie pracowników pokazują różnego płatnika i różny zestaw spraw.

### 2.2 Zadłużenie składkowe: symulacja zaświadczenia z kwotą (M)

Wymóg z zadania s. 13: „zasymulować wystawienie zaświadczenia i wysokość zadłużenia”.

- Profil → „Moje konto w ZUS”: przycisk „Wystaw zaświadczenie o stanie rozliczeń (symulacja)”. Otwiera dokument z kwotą zadłużenia na dzień powstania prawa i oceną `assessArrears`: w limicie, wstrzymany do spłaty, termin spłaty i przedawnienie.
- Przy działalności (odpowiedź z onboardingu albo profil demo z firmą) zaświadczenie ma dwa warianty demo: „brak zadłużenia” i „zadłużenie X zł”, do przełączenia w symulacji. Próg liczy reguła na dzień zdarzenia.
- Zaświadczenie da się pobrać jako PDF przez `pdf-lib`, jak ZAM.
- **Odbiór:** dla zadłużenia powyżej 1% płacy minimalnej widać „wstrzymany do spłaty” i datę przedawnienia, a dla zadłużenia poniżej progu „nie wstrzymuje”.

### 2.3 Podgląd e-ZLA (S)

- Profil → konto ZUS: wiersz „e-ZLA” ma się rozwijać w listę zaświadczeń z danymi: okres, kod „B” (ciąża), data wystawienia, wystawca, płatnik. Dane demo zgodne z `/app/chorobowe` i przystankiem „Zasiłek chorobowy w ciąży”.
- Kod „B” trzeba opisać źródłem: Poradnik ZUS s. 24–25 (`poradnik-24-1`, `poradnik-25-3`). Dziś w `stop-details.ts` jest uwaga, że strony ZUS go nie potwierdzają, ale Poradnik potwierdza.
- **Odbiór:** juror widzi listę e-ZLA z kodem i okresem, a liczba dni zgadza się z zasiłkiem chorobowym w planie.

### 2.4 PUE/eZUS: skutki „Odśwież dane” i „Zapytaj ZUS” (S)

- „Zapytaj ZUS” zapisuje wiadomość w korespondencji w „Dokumentach” jako zdarzenie „Wysłano w symulacji”, tak jak obiecuje komunikat (`ZusAccount.tsx:61`). Stan idzie do `PlanProvider` (localStorage).
- „Odśwież dane” zmienia datę pobrania i, jeśli w międzyczasie zmieniono profil, pokazuje różnice.
- **Odbiór:** wysłana wiadomość jest widoczna w „Dokumentach” po odświeżeniu strony.

### 2.5 Link do PIP zgodny z zadaniem (S)

- `lib/demo/fixtures.ts:29` (`SRC.pip`) prowadzi na stronę główną pip.gov.pl. Trzeba ustawić adres wskazany w zadaniu (s. 14): `https://www.pip.gov.pl/dla-pracodawcow/porady-prawne/rodzicielstwo`, tak jak w stopce. Treść opisu zostaje przy źródłach gov.pl, które zespół zweryfikował (`stop-details.ts`, `powrot`, `praca`). Link do PIP dochodzi jako dodatkowe źródło.
- **Odbiór:** w aplikacji nie ma już linku do samej strony głównej pip.gov.pl.

### 2.6 Ryzyka i świadczenia w planach adopcji i pieczy (S)

- Plany `adopcja` i `piecza` nie mają etapu „Ciąża”, więc nie widzą przystanku „Co może odebrać albo obniżyć zasiłek”. W tych planach trzeba dodać wariant przystanku w etapie „Narodziny” (lub „Przyjęcie”), bez akapitu o podwyżce w ciąży i z warunkiem „ubezpieczenie chorobowe w dniu przyjęcia dziecka” (UZ art. 29 ust. 1 pkt 2–3).
- **Odbiór:** test w `onboarding-build.test.ts`: plan adopcji zawiera przystanek z ryzykami, a jego tekst nie mówi o ciąży.

### 2.7 Kalkulator a panel admina i przypadki brzegowe [Maciej] (M)

Brakuje względem wymagań (zadanie s. 13, panel administracyjny):
- kalkulator nie czyta parametrów opublikowanych w panelu, choć przejście `lib/rules/maternity-schedule.ts` jest gotowe;
- nie ma opcji zasiłku w wysokości zasiłku macierzyńskiego (upadłość pracodawcy);
- nie ma zgonu dziecka po porodzie (najmniej 7 dni od zgonu, zadanie s. 6).

Decyzja i wykonanie: Maciej.

### 2.8 Panel admina a ekrany rodzica (M)

- „Wsparcie” (`features/support/SupportView.tsx`) czyta organizacje z `lib/support/organizations.ts`, a nie z edycji panelu (`lib/admin/support-store.ts`, ciasteczko `zusik_support`). Trzeba zrobić `wsparcie/page.tsx` jako komponent serwerowy, który czyta edycje (wzór: `admin/(panel)/tresci/page.tsx`) i przekazuje listę do widoku.
- Próg płatnika (2.1) i próg zadłużenia (2.2) w widoku rodzica mają brać `effectiveSchedule()` (`lib/admin/rule-store.ts`), tak jak robi to `/app/kamil`.
- **Odbiór:** zmiana organizacji w panelu i zmiana progu płatnika widać w tej samej przeglądarce po stronie rodzica (zgodnie z `ZGLOSZENIE-PANEL-ADMINISTRACYJNY.md`, „Czego jeszcze nie ma”).

---

## Etap 3. Spójność aplikacji rodzica (kompletność i UX, 25% oceny)

### 3.1 Jedno wejście do aplikacji rodzica (M)

Dziś działają obok siebie dwa obszary rodzica:
- zakładki `/plan`, `/kalkulator`, `/dokumenty`, `/profil`, `/wsparcie`;
- sprawy rozmowy `/app`, `/app/kamil`, `/app/chorobowe`, `/app/sprawy`, `/zusik`, `/zusik/kamil`.

Do zrobienia:
- ustalić jedno wejście po logowaniu (propozycja: `/plan`);
- sprawy rozmowy podpiąć jako akcje przystanków (np. „Wniosek ZAM z Zusikiem” przy zasiłku, „Ocena dokumentów” przy chorobowym w ciąży) i w panelu Zusika (`ZusikFab`);
- `/app/sprawy` zastąpić ekranem z 1.3;
- `/zusik*` to starsze ekrany. Sprawdzić, czy są jeszcze potrzebne, a jeśli nie, przekierować je.

**Odbiór:** z każdej strony obszaru rodzica da się dojść do każdej funkcji bez wpisywania adresu ręcznie.

### 3.2 Profil przebudowuje plan (M)

- Zmiana „Rola w planie” albo „Zmiana pracy przed porodem” w „Moich danych” ma przebudować plan z `plan.origin` (`features/family/profile/MyData.tsx` → `PlanProvider`). Postęp rodzica zostaje, czyli łatki przystanków.
- Szkice wniosków dotknięte zmianą dostają oznaczenie „Sprawdź po zmianie danych” (`ui/MACIEJ-TODO.md` pkt 15).
- **Odbiór:** zmiana pracy na „Tak” dodaje ostrzeżenie w planie bez ponownego onboardingu.

### 3.3 Drugi rodzic: przejęcie części urlopu macierzyńskiego (M)

- Dziś drugi rodzic nie dostaje żadnej sprawy macierzyńskiej. Trzeba dodać sprawę warunkową „Przejęcie części urlopu macierzyńskiego” z warunkami z zadania s. 7: po 14 tygodniach matki albo wcześniej przy hospitalizacji, niezdolności do samodzielnej egzystencji, zgonie matki lub porzuceniu dziecka. Źródła: KP art. 180 (korpus `kp`) i Poradnik.
- **Odbiór:** plan drugiego rodzica zawiera tę sprawę jako warunkową, z przypisem.

### 3.4 Sprawa testowa Alicji z wynikiem na sztywno (S)

- `features/family/profile/TestCaseWizard.tsx` z danymi `TEST_FIELDS` udaje odczyt PDF. Trzeba ją zastąpić ekranem z 1.3 albo jasno oznaczyć jako przykład bez odczytu.
- **Odbiór:** w aplikacji nie ma ekranu, który udaje odczyt dokumentu.

### 3.5 Błędy w danych demo (S)

- `features/family/profile/data.ts:10`: „Umowa o pracę · od 1 marca 2021” przeczy profilowi logowania i `PARENT_PROFILE` („1 marca 2025 r.”, `fixtures.ts:624`, `demo-session.ts:19`). Trzeba ujednolicić i dopisać ten wiersz do testu `profile-consistency.test.ts`.
- `data.ts:18–19`: „Średnia z 12 miesięcy 7 894,20 zł” i „Szacowana podstawa 6 812,40 zł” są niespójne, bo 7 894,20 × (1 − 13,71%) = **6 811,91 zł**. Trzeba poprawić kwotę albo liczyć ją regułą, i dodać test.
- `TEST_FIELDS` (`data.ts`): podstawa 6 812,40 zł jest powtórzona. Zniknie razem z 3.4.
- **Odbiór:** testy pilnują zgodności wszystkich wierszy konta ZUS z profilem.

### 3.6 Jakość odpowiedzi czatu (M)

- Na produkcji pytanie „Ile trwa urlop ojcowski?” dostało odpowiedź o wymogach wniosku, bez „14 dni”, po ok. 24 s.
- Trzeba dopisać 15–20 typowych pytań rodzica z oczekiwanym faktem do `corpus/publiczne/eval.json` (format istnieje) i uruchomić ocenę skryptem `scripts/zusik-eval-public.ts` (`npx tsx scripts/zusik-eval-public.ts`; w `package.json` jest dziś tylko `zusik:eval-marta`, warto dopisać analogiczne polecenie). Pytania obejmują m.in.:
  - ile trwa urlop ojcowski, macierzyński i rodzicielski;
  - ile procent;
  - termin wniosku o 81,5%;
  - kto wypłaca;
  - zadłużenie;
  - świadczenie rehabilitacyjne;
  - upadłość pracodawcy.
- Poprawki w przepisaniu zapytania (`lib/rag/public-query.ts`, `lib/zusik/retrieval-context.ts`) dla pytań o długość urlopu, które dziś trafiają w fragment o wniosku.
- **Odbiór:** raport oceny pokazuje właściwy fragment w pierwszej piątce dla ≥ 18/20 pytań (próg jak w `PLAN-WDROZENIA-ETAP-3-4.md`), a odpowiedź na pytanie o urlop ojcowski zawiera „14 dni” lub „2 tygodnie” z przypisem.

### 3.7 Przegląd RWD przy 390 px i 1440 px (M)

- Ekrany:
  - `/`, `/logowanie` (i trzy metody logowania);
  - `/start`, `/plan` (ścieżka pionowa, panel od dołu);
  - `/kalkulator`;
  - `/dokumenty`, `/dokumenty/[id]`;
  - `/profil`, `/wsparcie`;
  - `/app`, `/app/kamil`, `/app/chorobowe`;
  - `/admin` i jego pięć widoków;
  - nowy `/sprawdz`.
- Na każdym trzeba sprawdzić: brak poziomego przewijania, czytelność tabel kalkulatora i panelu, dostęp do przycisków nad dolnym paskiem, działanie klawiatury.
- Każdą usterkę poprawiamy osobnym commitem.
- **Odbiór:** lista ekranów odhaczona dla obu szerokości.

---

## Etap 4. Porządek w kodzie (jury przegląda repozytorium, s. 15)

### 4.1 Usunięcie kodu tymczasowego (S)

- `/demo/polaczenia` (`app/src/app/demo/polaczenia/`): ekran próby oznaczony w `ARCHITECTURE.md` do usunięcia po etapie 1. Jest publicznie dostępny. Usunąć go albo zasłonić flagą.
- Zaktualizować `app/ARCHITECTURE.md` (mapa folderów i „Kolejność wypełniania”) do stanu faktycznego.

### 4.2 Jedna kopia maskotki (M)

- Dziś są dwie kopie: `components/mascot/*` i `components/mascot/babelek/*`. Trzeba scalić je w jedną i usunąć nieużywane pliki (sprawdzić importy).
- Maskotka należy do zespołu od animacji, więc nie zmieniamy ruchu, tylko usuwamy duplikat.

### 4.3 Katalog główny repo (S)

- Prototypy i notatki robocze trzeba przenieść do `docs/robocze/` albo opisać w README:
  - `maskotka_kod/`;
  - `Przewodnik-Rodzica.html`;
  - `PLAN-*.md`, `MASTER-PROMPT-ZUSIK.md`;
  - `ui/*-prompt*.md`;
  - `inspiracjeelementowistron.md`.
- Ruszamy to dopiero po uzgodnieniu z zespołem, bo z tych plików korzystają.

### 4.4 Martwe pliki i TODO (S)

- Przejrzeć `TODO(backend)`, `TODO(julian)` i `TODO(admin)` w `app/src`. Każde trzeba zrobić, opisać jako ograniczenie demo albo usunąć.
- Usunąć puste foldery z `.gitkeep`, jeśli nic do nich nie trafi (`lib/db`, `lib/cases` przed 1.2).

---

## Kolejność i zależności

| Krok | Zadania | Zależy od | Rozmiar |
|---|---|---|---|
| 1 | 3.5 błędy danych demo, 2.5 link PIP, 4.1 usunięcie ekranu próby | — | S |
| 2 | 1.1 reguła prawa do zasiłku | — | L |
| 3 | 1.2 zestaw spraw (z odmowami) | 1.1 | M |
| 4 | 1.3 ekran „Sprawdź” i 1.6 instrukcja | 1.2 | M |
| 5 | Spike OCR, potem 1.4 upload | 1.3 | S, potem L |
| 6 | 2.1 płatnik czy ZUS, 2.2 zaświadczenie o zadłużeniu, 2.8 panel → rodzic | 1.1 (zadłużenie) | M + M + M |
| 7 | 2.3 e-ZLA, 2.4 eZUS, 2.6 ryzyka w adopcji | — | S |
| 8 | 3.1 jedno wejście, 3.4 Alicja | 1.3 | M |
| 9 | 3.2 profil → plan, 3.3 drugi rodzic | — | M |
| 10 | 3.6 jakość czatu | — | M |
| 11 | 1.5 i 2.7 kalkulator | decyzja Macieja, dane z 1.2 | M |
| 12 | 4.2–4.4 porządek, na końcu 3.7 RWD dla wszystkiego | wszystko | M |

Kroki 2–5 to najważniejsza ścieżka, bo jury wprost zapowiedziało test na sprawach z zestawu. Kroki 1, 7, 9 i 10 można robić równolegle.

## Definicja „100%”

Plan jest wykonany, gdy w [CHECKLISTA-WYMAGAN.md](CHECKLISTA-WYMAGAN.md) sekcje 1, 2, 3, 5 i 10 nie mają ani jednego 🟡, ❌ ani ⚠️. Jedyny wyjątek to wpisy świadomie opisane jako ograniczenie demo, z uzasadnieniem. Do tego wszystkie testy, typy, lint i build przechodzą, a produkcja po deployu odpowiada na wszystkie trasy.
