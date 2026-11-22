# Wnioski w Dokumentach

## Wynik wdrożenia z 22 listopada 2026 r.

Dziesięć spraw z pierwotnego zestawienia prowadzi teraz do właściwych kanałów. Rodzic ma także oddzielne pismo o pracę podczas urlopu rodzicielskiego. Wybór kanału internetowego zapisuje w planie przykładowe potwierdzenie. Przy piśmie papierowym lub wysyłanym e-mailem rodzic pobiera dokument i sam przekazuje go adresatowi.

| Sprawa | Co przygotowuje aplikacja | Ustalenia i źródła |
|---|---|---|
| Zgłoszenie urodzenia | Symulację gov.pl lub mObywatela albo listę na wizytę w USC. Rodzic podpisuje protokół w urzędzie. | [USC i POZ](civil-wdrozenie.md) |
| Urlop macierzyński | Pismo do pracodawcy o część urlopu przed porodem. Po porodzie plan pokazuje informację o rozpoczęciu urlopu. | [Urlopy](leave-wdrozenie.md) |
| Urlop ojcowski | Pismo z wyliczonym ostatnim dniem urlopu, oświadczeniem o wcześniejszym wykorzystaniu i wykazem dokumentów. | [Urlopy](leave-wdrozenie.md) |
| Urlop rodzicielski | Pismo o urlop oraz oddzielny wniosek o łączenie go z pracą. Formularze uwzględniają terminy i dotychczasowe wykorzystanie urlopu. | [Urlopy](leave-wdrozenie.md) |
| Zasiłek macierzyński | Wypełniony druk ZAM. Wybór płatnika decyduje, czy można skorzystać z kanałów bezpośrednich ZUS. | [ZAM i ubezpieczenie](insurance-wdrozenie.md) |
| Ubezpieczenie dziecka | Pismo pracownika do kadr. Zgłoszenie ZCNA do ZUS składa płatnik. | [ZAM i ubezpieczenie](insurance-wdrozenie.md) |
| 800+ | Symulację SW-R w eZUS, mZUS, banku lub Emp@tii. | [Research świadczeń](800plus-becikowe.md) · [Wdrożenie](benefits-wdrozenie.md) |
| Becikowe | Urzędowy wzór SR-2 z odpowiednimi załącznikami na papier albo symulację w Emp@tii. | [Research świadczeń](800plus-becikowe.md) · [Wdrożenie](benefits-wdrozenie.md) |
| Dodatkowy odpis aktu urodzenia | Pismo papierowe do wybranego USC lub symulację online. Wniosek uwzględnia liczbę i rodzaj odpisów oraz podstawę zwolnienia z opłaty. | [USC i POZ](civil-wdrozenie.md) |
| Wybór POZ | Właściwą deklarację lekarza, pielęgniarki lub położnej do podpisu albo symulację złożenia przez IKP. | [USC i POZ](civil-wdrozenie.md) |

Nazwy przykładowych potwierdzeń odpowiadają usługom. Wniosek do ZUS przez eZUS ma UPP, odpis przez gov.pl ma UPP na skrzynce do e-Doręczeń, a zgłoszenie urodzenia ma potwierdzenie wysłania. Emp@tia określa potwierdzenie w eWnioskach jako UPO. [ZUS](https://www.zus.pl/-/16-sierpnia-to-ostatni-dzien-na-skladanie-wnioskow-o-swiadczenie-postojowe) · [Odpis aktu](https://www.gov.pl/web/gov/uzyskaj-odpis-aktu-stanu-cywilnego-urodzenia-malzenstwa-zgonu) · [Zgłoszenie urodzenia](https://www.gov.pl/web/gov/zglos-urodzenie-dziecka) · [Instrukcja Emp@tii](https://empatia.gov.pl/documents/d/empatia/instrukcja-ewnioski_v14)

### Odbiór

Produkcyjna wersja lokalna przeszła 35 scenariuszy w Chrome na danych fikcyjnych. Sprawdzono 11 formularzy i wszystkie 33 połączenia formularza z kanałem, a także dwa dodatkowe warianty deklaracji POZ. Test wpisuje dane, zatwierdza wniosek, weryfikuje pobrany PDF lub przykładowe potwierdzenie i odczytuje historię po odświeżeniu strony. Wydruki ZAM dla obu wyborów stawki sprawdzono również po położeniu znaków na stronach 2 i 5.

Skrypt można uruchomić z katalogu `app` poleceniem `node --import tsx scripts/documents-browser.ts http://127.0.0.1:3419`, podając adres działającej aplikacji. Pełny zestaw Vitest przeszedł 514 testów. Sprawdzono też TypeScript oraz produkcyjną kompilację Next.js.

---

## Pierwotne zadanie i stan przed wdrożeniem

### Cel

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

### Pytania do sprawdzenia na początku projektu

Dla każdego: oficjalna nazwa i symbol, podstawa prawna, kto do kogo, termin, **wszystkie kanały** (papier, PUE/eZUS, mZUS, bank, Emp@tia, gov.pl/ePUAP, mObywatel, IKP), czy istnieje **oficjalny druk PDF** (URL; pobrać i sprawdzić, czy ma pola AcroForm — `PDFDocument.load(...).getForm().getFields()` z `pdf-lib`), wymagane pola i załączniki, opłaty, błędy w obecnej definicji. Cytować źródła (zus.pl, gov.pl, isap.sejm.gov.pl).

- `zasilek-macierzynski` — czy pracownik składa **ZAM** (druk w `app/public/forms/zam-2026-10-24.pdf`, od 24.10.2026 zawiera dawne ZUR/ZAO) do pracodawcy czy ZUS; jeśli ZAM → rozszerzyć `zam-map.ts` o: urlop macierzyński (checkbox + okres), oświadczenie o pełnym wymiarze (81,5%), dane dziecka; współrzędne mierzyć z pozycji tekstu pdf.js jak istniejące sloty.
- `ubezpieczenie-dziecka` — ZUS ZCNA składa **płatnik**, nie rodzic; co pracownik daje pracodawcy (pismo/oświadczenie), termin 7 dni od nadania PESEL. Nazwa „ZUS ZCNA” w formularzu rodzica jest myląca.
- `800plus` — symbol wniosku (aplikacja pisze „SW-1”; w `stop-details.ts` jest „SW-R”); prawdopodobnie **tylko elektronicznie** (PUE/eZUS, mZUS, bank, Emp@tia) → bez PDF, sama symulacja online.
- `becikowe` — oficjalny wzór wniosku (rozporządzenie o świadczeniach rodzinnych), papier w gminie albo online (Emp@tia, gov.pl); próg dochodu i zaświadczenie o opiece od 10. tygodnia ciąży (sprawdzić aktualne wartości 2026).
- `odpis` — zadanie ZUS wprost wymaga symulacji wniosku o odpis (https://www.gov.pl/web/cyfryzacja/rejestr-stanu-cywilnego); online gov.pl (opłata), papier w dowolnym USC; opłaty 2026; czy jest ogólnopolski wzór.
- `poz` — wzór deklaracji wyboru lekarza/pielęgniarki/położnej POZ z rozporządzenia MZ (druk do wypełnienia) albo online przez IKP/mojeIKP.

### Pierwotna kolejność prac

1. Dokończyć research powyższych 6 wniosków; wyniki dopisać do tego pliku.
2. W `forms.ts`: rozszerzyć `Channel` o realne kanały (np. `pracodawca`, `email`, `pue`, `mzus`, `bank`, `empatia`, `govpl`, `mobywatel`, `usc`, `gmina`, `przychodnia`, `ikp`) z polem trybu `pdf | online | osobiscie`; do `FormDef` dodać rodzaj PDF (`official` z mapą druku / `letter` z funkcją treści pisma / `none`) i opcjonalne reguły walidacji między polami.
3. `SendStep` (`FormReview.tsx`): kanał `pdf` → pobranie PDF; `online` → symulacja wysyłki z właściwym potwierdzeniem (UPP dla ZUS, UPO dla ePUAP, potwierdzenie w mObywatelu); `osobiscie` → „co zabrać” i „Załatwione w urzędzie”. `CaseDetail.tsx`: przycisk PDF tylko dla wniosków z PDF.
4. Poprawić 10 definicji według ustaleń; pisma urlopowe jako pismo (patrz wyżej); oficjalne druki wypełniać jak ZAM (mapa współrzędnych + test sumy kontrolnej szablonu).
5. Testy: `tests/documents-flow.test.ts`, `tests/application-pdf.test.ts` + nowe dla map druków; sprawdzić w przeglądarce każdy wniosek (wypełnienie → sprawdź → zatwierdź → przekaż każdym kanałem) i obejrzeć wyrenderowane PDF.
6. Na koniec opisać zmiany per wniosek: co ustalono, co zmieniono, źródła.

## Wynik researchu: 800+ i becikowe (gotowe)

Pełny raport ze źródłami: [`800plus-becikowe.md`](800plus-becikowe.md).

- `800plus`: wniosek **SW-R** (nie „SW-1”, to archiwalny druk gminny). **Tylko elektronicznie** (art. 13 ust. 5 ustawy, Dz.U. 2026 poz. 508): eZUS, mZUS, bankowość, Emp@tia; ePUAP i mObywatel nie. Oficjalnego PDF brak (kreator) → **bez PDF, symulacja online**. Wniosek w 3 mies. od urodzenia = świadczenie od urodzenia (reguła stała). Brakuje pól e-mail i telefon; „Nie mieszka z Tobą” powinno ostrzegać.
- `becikowe`: wzór **SR-2** (gov.pl: https://www.gov.pl/attachment/20ec64a0-3df1-49dc-9884-369596f3818e, 7 stron, bez pól AcroForm → wypełniać nakładką jak ZAM). Kanały: papier/poczta do gminy lub OPS, **Emp@tia** (nie „ePUAP”). Usunąć pole „Dochód na osobę” (gmina liczy sama, rok bazowy 2025); próg 1922 zł jest w ustawie. Dodać warunek alimentów dla samotnie wychowujących, skład rodziny; zaświadczenie lekarskie (wzór Dz.U. 2021 poz. 199) jako załącznik, nie pytanie.

## Wynik researchu: odpis i POZ (gotowe)

Pełny raport ze źródłami: [`odpis-poz.md`](odpis-poz.md).

- `odpis`: **ogólnopolskiego wzoru wniosku nie ma** (tylko e-usługa gov.pl i formularze poszczególnych USC). Kanały: e-usługa gov.pl (profil zaufany / e-dowód, odbiór osobiście, pocztą lub na **e-Doręczenia**), papier osobiście/pocztą w **dowolnym USC**. **ePUAP nie działa od 1.01.2026**, e-mail nieważny. Opłaty: skrócony 22 zł, zupełny 33 zł, wielojęzyczny 22 zł (tylko papier); do sprawy w ZUS/świadczeń bezpłatnie (podać cel); pierwszy skrócony z urzędu gratis. Dodać: wybór USC, miejsce urodzenia, cel, tytuł uprawnienia (rodzic), adres, odbiór e-Doręczenia; usunąć wymagany PESEL wnioskodawcy; poprawić źródła. → **symulacja e-usługi gov.pl** (wymóg zadania) + opcjonalnie pismo PDF do USC oznaczone jako pomocnicze.
- `poz`: wzór z rozporządzenia MZ **Dz.U. 2020 poz. 1143** (osobne deklaracje: lekarz, pielęgniarka, położna; PDF z Dz.U. bez pól AcroForm → nakładka jak ZAM). Kanały: **IKP** na koncie dziecka (wymaga zgłoszenia dziecka do ubezpieczenia) albo papier w przychodni; ePUAP i e-mail PDF błędne. **Lekarz jest polem obowiązkowym**; dodać adres dziecka i przedstawiciela, „który raz w roku”; usunąć PESEL opiekuna. Bezpłatnie (2 zmiany w roku, kolejna 80 zł). Odpis skrócony nie zawiera PESEL — poprawić podpowiedź „PESEL z odpisu”. Nie używać DOCX z gov.pl/web/zdrowie (wzór sprzed 2018).

## Wynik researchu: zasiłek macierzyński (ZAM) i ubezpieczenie dziecka (ZCNA) (gotowe)

Pełny raport ze źródłami: [`zam-zcna.md`](zam-zcna.md). **Research wszystkich 10 wniosków jest zakończony** — sekcja „Do zbadania” wyżej jest już nieaktualna; krok 1 z „Kolejności pracy” jest zrobiony.

- `zasilek-macierzynski`: plik `app/public/forms/zam-2026-10-24.pdf` = aktualny ZAM z zus.pl (ten sam SHA-256). ZUS ma też wariant **„Wypełnij i wydrukuj” z 85 polami AcroForm** — lista pól: [`zam-wypelnij-pola.txt`](zam-wypelnij-pola.txt); wypełnianie przez pola jest prostsze niż mapa współrzędnych. Pracownica składa wniosek **u pracodawcy** (przy progu ≤ 20 pracodawca w 7 dni przekazuje do ZUS z Z-3; > 20 pracodawca wypłaca sam). Przy ≤ 20 może też sama złożyć ZAM przez **eZUS** (symulacja online); mZUS nie ma ZAM. 81,5%: pisemny wniosek do 21 dni po porodzie. Brakuje: adresu (przekaz pocztowy!), NIP płatnika, miejsca urodzenia i PESEL dziecka, danych drugiego rodzica, okresów od–do, oświadczenia „Za życiem”, ścieżki „macierzyński + deklaracja pełnego wymiaru”; „4 lub więcej” łączy 35 i 37 tyg.; odpis wymagany tylko przy > 20. „E-mailem jako PDF” przy ≤ 20 wątpliwy. → **wypełniony ZAM + symulacja eZUS**.
- `ubezpieczenie-dziecka`: **ZCNA składa pracodawca**, nie rodzic (art. 67 ust. 3–3a ustawy o świadczeniach opieki zdrowotnej). Rodzic informuje pracodawcę w 7 dni (forma dowolna, e-mail OK); pracodawca ma 7 dni na ZCNA. Rodzic nie ma kanału online, może sprawdzić zgłoszenie w mZUS/eZUS. Dane: PESEL, imię, nazwisko, data urodzenia rodzica i dziecka, kod pokrewieństwa 11, wspólne gospodarstwo. Wariant ZCNA „Wypełnij i wydrukuj” ma 59 pól AcroForm ([`zcna-wypelnij-pola.txt`](zcna-wypelnij-pola.txt)). → **pismo do kadr z danymi do ZCNA** (+ opcjonalnie wstępnie wypełniony ZCNA), bez symulacji online; zmienić nazwę wniosku.
