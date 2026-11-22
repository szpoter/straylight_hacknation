# Wnioski w „Dokumentach”: research i zadanie dla Codexa

Stan: 22.11.2026. Kod: `app/src/lib/demo/forms.ts` (definicje 10 wniosków), `app/src/features/documents/` (edycja, sprawdzanie, „Przekaż”, PDF), `app/src/lib/forms/application-pdf.ts` (PDF w przeglądarce), `app/src/lib/forms/zam-fill.ts` + `zam-map.ts` (wypełnianie oficjalnego druku ZAM po współrzędnych, wzór dla innych druków).

## Cel

Każdy wniosek ma mieć sens merytoryczny:
- jeśli istnieje **oficjalny druk** → pobrać go do `app/public/forms/`, wypełniać automatycznie z wartości wniosku (jak ZAM) i dawać do pobrania;
- jeśli wniosek to **pismo w dowolnej formie** (np. do pracodawcy) → PDF jako pismo z treścią wymaganą przez przepisy;
- jeśli sprawę załatwia się **tylko online lub osobiście** → bez PDF; kanał online = symulacja wysyłki (potwierdzenie UPP/UPO itp.).

Teraz wszystkie 10 wniosków ma ten sam generyczny PDF „etykieta → wartość” z podpisem (`application-pdf.ts`) i kanały `pue | pracodawca | email | urzad` (`CHANNEL_LABEL` w `forms.ts`). To trzeba zróżnicować.

## Ustalenia potwierdzone

Źródła lokalne: `Materiały hackathonowe/Materiały dla uczestników/` — Kodeks pracy (wyciąg) i rozporządzenie MRPiPS z 11.03.2025 (Dz.U. 2025 poz. 322) w sprawie wniosków związanych z rodzicielstwem.

### `zglos-urodzenie` — Zgłoszenie urodzenia dziecka
- **Nie ma papierowego wniosku ani wzoru.** W USC kierownik spisuje protokół, który podpisuje rodzic i kierownik; rodzic przynosi tylko dowód osobisty lub paszport ([gov.pl](https://www.gov.pl/web/gov/zglos-urodzenie-dziecka)).
- Online: formularz gov.pl (ePUAP), podpis profilem zaufanym / e-dowodem / podpisem kwalifikowanym; od 1.01.2026 wymagana skrzynka e-Doręczeń. Od 5.03.2026 także w aplikacji mObywatel: Usługi → Załatw sprawę → Rodzina → Zgłoś urodzenie dziecka ([gov.pl/cyfryzacja](https://www.gov.pl/web/cyfryzacja/zglos-urodzenie-dziecka-w-mobywatelu-bez-umawiania-wizyty-w-urzedzie-bez-kolejek)).
- Termin 21 dni od wystawienia karty urodzenia; USC właściwy dla miejsca urodzenia; bezpłatnie; najwyżej 2 imiona.
- **Do zrobienia:** usunąć PDF; kanały: „Formularz na gov.pl” i „mObywatel” (symulacja online) oraz „Osobiście w USC” (bez PDF, lista „co zabrać”). W `stop-details.ts` dopisać mObywatel.

### `urlop-macierzynski` — błąd merytoryczny
- Wniosek istnieje **tylko o część urlopu przed przewidywaną datą porodu** (KP art. 180 § 2, rozp. § 2): zawiera imię i nazwisko oraz datę, od której urlop ma się zacząć; załącznik: **kopia zaświadczenia lekarskiego o przewidywanej dacie porodu**. Najwyżej 6 tygodni przed porodem.
- Po porodzie urlop przysługuje z mocy prawa (art. 180 § 3) — wniosku się nie składa.
- Aplikacja robi odwrotnie: sprawa „aktualna po narodzinach”, „Do kiedy: Po porodzie, przed rozpoczęciem urlopu”, „Załączniki: Brak”, formularz wymaga daty urodzenia dziecka (`fixtures.ts:195`, `forms.ts:108`). Sprawa `macierzynski-przed` (`fixtures.ts:87`) nie ma formularza.
- **Do zrobienia:** przenieść formularz do `macierzynski-przed` (pola: imię i nazwisko, pracodawca, przewidywana data porodu, urlop od — walidacja: najwcześniej 6 tygodni przed terminem; załącznik: zaświadczenie lekarskie). `urlop-macierzynski` zmienić na informację „urlop zaczyna się w dniu porodu, wniosku nie składasz” (bez `doc`). Poprawić testy: `tests/plan-actions.test.ts:12`, `tests/documents-timeline.test.ts:18`, `tests/onboarding-build.test.ts`.

### `urlop-ojcowski` — pismo do pracodawcy (KP art. 182³, rozp. § 17)
- Treść: imię i nazwisko pracownika, **okres od–do** urlopu lub części. Załączniki: odpis skrócony aktu urodzenia (albo kopia) + **oświadczenie, czy korzystał już z urlopu ojcowskiego**. Załączników nie dołącza się, jeśli są w aktach osobowych (§ 22).
- Do 2 tygodni, najwyżej 2 części po min. 1 tydzień, do ukończenia przez dziecko 12 miesięcy; wniosek min. 7 dni przed; postać papierowa lub elektroniczna (e-mail OK).
- **Brakuje w formularzu:** daty końca (wyliczyć: od + 14 albo 7 dni), oświadczenia o wcześniejszym urlopie, wyboru „odpis dołączam / jest w aktach”, walidacji 12 miesięcy i 7 dni.

### `rodzicielski` — pismo do pracodawcy (KP art. 182¹a–182¹e, rozp. § 15–16)
- Treść: imię i nazwisko; **dotychczas wykorzystany urlop rodzicielski/zasiłek i liczba części**; **okres od–do**. Załączniki: odpis skrócony aktu urodzenia (chyba że w aktach); **oświadczenie o drugim rodzicu** (nie korzysta w tym okresie albo w jakim okresie korzysta); kopia zaświadczenia „Za życiem”, jeśli urlop dłuższy.
- 41 tyg. (43 przy ciąży mnogiej; 65/67 z „Za życiem”), po 9 tyg. nieprzenoszalnych dla każdego rodzica, do 5 części, do końca roku, w którym dziecko kończy 6 lat; wniosek min. 21 dni przed.
- Łączenie z pracą to osobny wniosek (§ 16): wymiar ≤ 1/2 etatu, okres łączenia, oświadczenie o łączeniu części z wydłużenia (albo braku zamiaru); min. 21 dni przed.
- **Brakuje w formularzu:** okresu od–do, wcześniejszych części, oświadczenia o drugim rodzicu, załączników; lista tygodni `8,16,24,32,41` jest arbitralna.

### PDF dla pism urlopowych
Zamiast tabeli „etykieta → wartość” — pismo: nadawca, miejscowość i data, adresat (pracodawca), tytuł „Wniosek o udzielenie urlopu …”, treść z podstawą prawną i okresem, oświadczenia, lista załączników, podpis. Kanały: „Do pracodawcy (papier)” i „E-mailem jako PDF”; hint kanału `pracodawca` („przekazuje dane do ZUS”) jest błędny dla urlopów.

## Do zbadania (research nie skończony)

Dla każdego: oficjalna nazwa i symbol, podstawa prawna, kto do kogo, termin, **wszystkie kanały** (papier, PUE/eZUS, mZUS, bank, Emp@tia, gov.pl/ePUAP, mObywatel, IKP), czy istnieje **oficjalny druk PDF** (URL; pobrać i sprawdzić, czy ma pola AcroForm — `PDFDocument.load(...).getForm().getFields()` z `pdf-lib`), wymagane pola i załączniki, opłaty, błędy w obecnej definicji. Cytować źródła (zus.pl, gov.pl, isap.sejm.gov.pl).

- `zasilek-macierzynski` — czy pracownik składa **ZAM** (druk w `app/public/forms/zam-2026-10-24.pdf`, od 24.10.2026 zawiera dawne ZUR/ZAO) do pracodawcy czy ZUS; jeśli ZAM → rozszerzyć `zam-map.ts` o: urlop macierzyński (checkbox + okres), oświadczenie o pełnym wymiarze (81,5%), dane dziecka; współrzędne mierzyć z pozycji tekstu pdf.js jak istniejące sloty.
- `ubezpieczenie-dziecka` — ZUS ZCNA składa **płatnik**, nie rodzic; co pracownik daje pracodawcy (pismo/oświadczenie), termin 7 dni od nadania PESEL. Nazwa „ZUS ZCNA” w formularzu rodzica jest myląca.
- `800plus` — symbol wniosku (aplikacja pisze „SW-1”; w `stop-details.ts` jest „SW-R”); prawdopodobnie **tylko elektronicznie** (PUE/eZUS, mZUS, bank, Emp@tia) → bez PDF, sama symulacja online.
- `becikowe` — oficjalny wzór wniosku (rozporządzenie o świadczeniach rodzinnych), papier w gminie albo online (Emp@tia, gov.pl); próg dochodu i zaświadczenie o opiece od 10. tygodnia ciąży (sprawdzić aktualne wartości 2026).
- `odpis` — zadanie ZUS wprost wymaga symulacji wniosku o odpis (https://www.gov.pl/web/cyfryzacja/rejestr-stanu-cywilnego); online gov.pl (opłata), papier w dowolnym USC; opłaty 2026; czy jest ogólnopolski wzór.
- `poz` — wzór deklaracji wyboru lekarza/pielęgniarki/położnej POZ z rozporządzenia MZ (druk do wypełnienia) albo online przez IKP/mojeIKP.

## Kolejność pracy dla Codexa

1. Dokończyć research powyższych 6 wniosków; wyniki dopisać do tego pliku.
2. W `forms.ts`: rozszerzyć `Channel` o realne kanały (np. `pracodawca`, `email`, `pue`, `mzus`, `bank`, `empatia`, `govpl`, `mobywatel`, `usc`, `gmina`, `przychodnia`, `ikp`) z polem trybu `pdf | online | osobiscie`; do `FormDef` dodać rodzaj PDF (`official` z mapą druku / `letter` z funkcją treści pisma / `none`) i opcjonalne reguły walidacji między polami.
3. `SendStep` (`FormReview.tsx`): kanał `pdf` → pobranie PDF; `online` → symulacja wysyłki z właściwym potwierdzeniem (UPP dla ZUS, UPO dla ePUAP, potwierdzenie w mObywatelu); `osobiscie` → „co zabrać” i „Załatwione w urzędzie”. `CaseDetail.tsx`: przycisk PDF tylko dla wniosków z PDF.
4. Poprawić 10 definicji według ustaleń; pisma urlopowe jako pismo (patrz wyżej); oficjalne druki wypełniać jak ZAM (mapa współrzędnych + test sumy kontrolnej szablonu).
5. Testy: `tests/documents-flow.test.ts`, `tests/application-pdf.test.ts` + nowe dla map druków; sprawdzić w przeglądarce każdy wniosek (wypełnienie → sprawdź → zatwierdź → przekaż każdym kanałem) i obejrzeć wyrenderowane PDF.
6. Na koniec opisać zmiany per wniosek: co ustalono, co zmieniono, źródła.
