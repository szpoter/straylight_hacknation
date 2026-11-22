# RAPORT: 800+ i becikowe (stan prawny na 22.11.2026)

Zakres: formularze `800plus` i `becikowe` w aplikacji hackathonowej (wyzwanie ZUS). Porównanie z `forms-current.json`.
Źródła sprawdzone 22.11.2026. Każde twierdzenie ma źródło. Czego nie dało się potwierdzić, oznaczam **NIEZWERYFIKOWANE**.

Katalog roboczy: `/private/tmp/claude-501/-Users-bartus-Desktop-hacknation/231c7caf-a229-480f-ae1d-957ac0f63514/scratchpad/research/benefits/`

---

## A. `800plus` – świadczenie wychowawcze 800+

### A1. Nazwa, symbol, podstawa prawna

- **Symbol wniosku dla rodzica: SW-R.** ZUS pisze: „SW-R – jeśli jesteś matką albo ojcem dziecka, SW-O – jeśli sprawujesz pieczę zastępczą (…) albo jesteś opiekunem prawnym, albo opiekunem faktycznym, SW-D – jeśli jesteś dyrektorem placówki”. Źródło: https://www.zus.pl/swiadczenia/swiadczenia-dla-rodzin/swiadczenie-wychowawcze-800-plus
- **„SW-1” to symbol archiwalnego wniosku papierowego, który składało się w gminie przed 2022 r.** Na gov.pl leży plik „wzór wniosku o SW obowiązujący do okresu 2018/2019”. Pobrałem go: ma 9 stron, w stopce „wersja: SW-1(2)”, nie ma pól AcroForm. Źródło: https://www.gov.pl/attachment/58708549-5a1a-474c-a74a-b9a55e2d272a. Kopia lokalna: `800plus/archiwalny-SW-1-2018-2019/wzor_SW_do_2018-2019.pdf`. Od 2022 r. wnioski przyjmuje ZUS i tylko elektronicznie (ten sam link ZUS wyżej). **Nazwa „SW-1” w aplikacji jest więc błędna.**
- **Ustawa:** ustawa z dnia 11 lutego 2016 r. o pomocy państwa w wychowywaniu dzieci. Aktualny tekst jednolity to **Dz.U. 2026 poz. 508**, obwieszczenie Marszałka Sejmu z 27.03.2026. Źródła: https://api.sejm.gov.pl/eli/acts/DU/2026/508 oraz PDF https://api.sejm.gov.pl/eli/acts/DU/2026/508/text.pdf. Według metadanych ELI ostatni akt zmieniający to Dz.U. 2026 poz. 203, który wszedł w życie 5.03.2026, a więc przed tekstem jednolitym. Źródło: https://api.sejm.gov.pl/eli/acts/DU/2016/195
  - Strona ZUS z 800+ nadal powołuje starszy tekst jednolity, Dz.U. 2024 poz. 1576. W ELI ma on status „wygaśnięcie aktu”. Źródło: https://api.sejm.gov.pl/eli/acts/search?title=pomocy%20pa%C5%84stwa%20w%20wychowywaniu%20dzieci
- **Rozporządzenia ze wzorem wniosku nie ma.** Zakres danych we wniosku określa sama ustawa w art. 13 ust. 3 (Dz.U. 2026 poz. 508, s. 10–11). Poprzednie rozporządzenie o zakresie informacji we wniosku, Dz.U. 2019 poz. 1177, ma w ELI status „uznany za uchylony”. Źródło: https://api.sejm.gov.pl/eli/acts/DU/2019/1177. Formularz istnieje tylko jako kreator w systemach elektronicznych. ZUS pisze: „Wniosek SW o świadczenie z programu Rodzina 800+ można utworzyć i złożyć jedynie za pomocą kreatora. System nie umożliwia ręcznego wypełnienia formularza.” Źródło: https://www.zus.pl/portal/pomoc/kub0024.html

### A2. Kto, do kogo, terminy, warunki

- **Kto składa:** matka albo ojciec, jeśli dziecko z nim mieszka i jest na jego utrzymaniu (art. 4 ust. 2 pkt 1 ustawy, Dz.U. 2026 poz. 508). To samo podaje strona ZUS (link w A1).
- **Do kogo:** do ZUS. „Wniosek składa się do Zakładu Ubezpieczeń Społecznych” (art. 13 ust. 2).
- **Kwota:** 800 zł miesięcznie na dziecko do 18. roku życia, bez kryterium dochodowego (art. 5 ust. 1). Za miesiąc urodzenia ZUS liczy kwotę proporcjonalnie do liczby dni i zaokrągla do 10 gr w górę (art. 5 ust. 2). Źródła: ustawa oraz strona ZUS.
- **Termin dla noworodka:** jeśli wniosek wpłynie w ciągu 3 miesięcy od dnia urodzenia, prawo ustala się od miesiąca urodzenia. Wniosek złożony później daje prawo dopiero od miesiąca złożenia (art. 18 ust. 2a). ZUS w FAQ: „Rodzice którym urodziło się dziecko mają 3 miesiące od jego urodzenia na złożenie wniosku (…) otrzymasz świadczenie z wyrównaniem od dnia narodzin dziecka.” Źródło: https://www.zus.pl/swiadczenia/swiadczenia-dla-rodzin/pytania-i-odpowiedzi-swiadczenie-wychowawcze-800-
- **Okres świadczeniowy:** od 1 czerwca do 31 maja (art. 18 ust. 1). Wnioski na kolejny okres ZUS przyjmuje od 1 lutego (art. 21 ust. 3). Wnioski na okres 2026/2027 przyjmowano od 1.02.2026 (FAQ ZUS wyżej). **Wniosek złożony teraz, czyli w listopadzie 2026, obejmuje tylko okres do 31.05.2027.** Na okres 2027/2028 trzeba złożyć nowy wniosek od 1.02.2027. Wynika to z art. 18 ust. 1 i art. 21 ust. 3–5c.
- **Zbieg uprawnień rodziców:** świadczenie dostaje rodzic, który faktycznie sprawuje opiekę. Jeśli opiekują się oboje, dostaje ten, kto pierwszy złoży wniosek (art. 22).
- **PESEL jest obowiązkowy:** „W przypadku wniosków składanych po 31 stycznia 2026 r. obowiązkowe będzie posługiwanie się numerem PESEL”. Źródło: https://www.zus.pl/swiadczenia/swiadczenia-dla-rodzin/swiadczenie-wychowawcze-800-plus/zmiany-w-swiadczeniu-wychowawczym-program-rodzina-800-. Instrukcja Emp@tia mówi to samo: „Podanie numeru PESEL dziecka jest obowiązkowe”. Źródło: https://www.gov.pl/attachment/2a56a1f3-990c-48cd-ae65-c2974e6a3e17 (marzec 2026).
- **Cudzoziemcy spoza UE/EFTA/UK:** od 1.06.2026 muszą spełniać warunek aktywności zawodowej. Obywatele Ukrainy ze statusem UKR muszą złożyć nowy wniosek od 1.02.2026. Rodziców z obywatelstwem polskim lub UE ta zmiana nie dotyczy. Źródło: strona ZUS „Zmiany w świadczeniu wychowawczym” (link wyżej).
- **Decyzja:** przyznanie nie wymaga decyzji. ZUS wysyła „informację” na profil eZUS i e-mail (art. 13a ust. 1–2). Decyzję wydaje tylko przy odmowie, uchyleniu lub zmianie prawa albo przy nienależnie pobranym świadczeniu. Doręcza ją elektronicznie na PUE/eZUS. Odwołanie do Prezesa ZUS przysługuje w 14 dni, potem skarga do WSA w 30 dni. Źródło: strona ZUS (link w A1).

### A3. Kanały złożenia (stan 2026)

Ustawa: „Wniosek i załączniki do wniosku (…) są składane **wyłącznie w postaci elektronicznej** za pomocą: 1) profilu informacyjnego [eZUS]; 2) systemu teleinformatycznego banków krajowych oraz SKOK; 3) systemu teleinformatycznego utworzonego przez ministra właściwego do spraw rodziny [Emp@tia]; 4) systemu wskazanego w informacji w BIP ZUS” (art. 13 ust. 5, Dz.U. 2026 poz. 508).

| Kanał | Ważny? | Logowanie / podpis | Źródło |
|---|---|---|---|
| Papier osobiście / poczta | **NIE** („wyłącznie w postaci elektronicznej”) | – | art. 13 ust. 5; ZUS: „Wniosek możesz złożyć tylko elektronicznie” |
| eZUS (dawniej PUE ZUS) | TAK, wszystkie wnioski SW-R/SW-O/SW-D | Podpis przy wysyłce: kwalifikowany podpis, podpis osobisty, profil zaufany albo „profil PUE”. Logowanie: login i hasło eZUS, kwalifikowany podpis, certyfikat osobisty, profil zaufany / login.gov.pl, aplikacja mobilna ZUS | art. 13 ust. 7 pkt 1; https://www.zus.pl/portal/pomoc/kub0024.html; https://www.zus.pl/portal/pomoc/rejestracja_i_uwierzytelnianie.html |
| mZUS (aplikacja) | TAK, SW-R dla rodzica z PESEL | Konto eZUS | strona ZUS 800+; komunikat ZUS z 2.02.2026: https://www.zus.pl/-/mo%C5%BCna-ju%C5%BC-sk%C5%82ada%C4%87-wnioski-o-800-na-nowy-okres-%C5%9Bwiadczeniowy |
| Bankowość elektroniczna | TAK, SW-R. Lista banków i SKOK jest na stronie ZUS | Dane uwierzytelniające banku. Wniosek „podpisany przy użyciu danych obejmujących imię, nazwisko oraz numer PESEL” jest równoważny podpisowi własnoręcznemu | art. 13 ust. 7 pkt 2 i ust. 9; strona ZUS 800+ |
| Emp@tia (wnioski.empatia.gov.pl) | TAK, SW-R | Profil zaufany, profil osobisty (e-dowód), inny środek identyfikacji z węzła krajowego albo kwalifikowany certyfikat. Adres e-mail musi być zweryfikowany | art. 13 ust. 7 pkt 3; instrukcja Emp@tia z 03.2026 (link wyżej); instrukcja z 12.2023: https://www.gov.pl/attachment/c9dd5d39-34c7-4495-9a8b-6f4e35a59165 |
| ePUAP / pismo ogólne gov.pl | **NIE** (poza katalogiem art. 13 ust. 5) | – | art. 13 ust. 5 |
| mObywatel | **NIE jako kanał złożenia.** ZUS nie wymienia go wśród kanałów | Aplikację można użyć najwyżej do logowania przez login.gov.pl. Dla Emp@tia i eZUS w źródle urzędowym: **NIEZWERYFIKOWANE** | komunikat ZUS z 2.02.2026 (4 kanały: mZUS, eZUS, bank, Emp@tia) |

Jeśli rodzic złoży wniosek przez bank albo Emp@tia, a nie ma konta eZUS, ZUS sam mu je zakłada (art. 13 ust. 5a; strona ZUS). Czy w BIP ZUS wskazano jakiś „inny system” w rozumieniu art. 13 ust. 6: **NIEZWERYFIKOWANE**.

### A4. Oficjalny wzór

- **Wzór PDF do druku nie istnieje** i nie jest przewidziany prawem (zob. A1). Wzoru nie ma ani w Dzienniku Ustaw, ani na zus.pl. ZUS publikuje tylko instrukcje w plikach zip/doc, np. „Instrukcja wniosek 800 plus dla rodzica_SW-R_bez koordynacji” (strona ZUS 800+).
- Najlepszym opisem pól jest instrukcja MRPiPS „Instrukcja rejestracji wniosku o świadczenie wychowawcze 800 + (dla matki lub ojca dziecka) – SW-R na PIU Empatia”, **marzec 2026**, 32 strony. Źródło: https://www.gov.pl/attachment/2a56a1f3-990c-48cd-ae65-c2974e6a3e17. Kopia lokalna: `800plus/empatia-instr-1/instrukcja.pdf`. To instrukcja, nie formularz: 0 pól AcroForm.
- Starsze wersje instrukcji pobrałem tylko dla porównania: `800plus/empatia-instr-2/instrukcja.pdf` (12.2021, 21 stron) i `800plus/empatia-instr-3/instrukcja.pdf` (12.2023, 23 strony).

### A5. Wymagane dane, załączniki, opłaty

Treść wniosku według art. 13 ust. 3 ustawy (wersja od 1.02.2026) oraz kreatora SW-R w Emp@tia (instrukcja 03.2026):

1. **Krok 1:** wybór okresu świadczeniowego i oświadczenie, że wnioskodawca jest matką lub ojcem.
   - Dane wnioskodawcy: imię, nazwisko, data urodzenia, adres zamieszkania, stan cywilny, obywatelstwo, PESEL, **adres e-mail, numer telefonu**. Część danych system pobiera z konta lub rejestru PESEL (art. 13 ust. 11).
   - Cudzoziemcy spoza UE/EFTA/UK podają dodatkowo dokument przekroczenia granicy i dokument legalności pobytu.
   - Numer rachunku płatniczego w Polsce, a przy adresie zagranicznym możliwy rachunek w UE/EFTA/UK (art. 13 ust. 3 pkt 4).
2. **Krok 2:**
   - aktywność zawodowa (tylko cudzoziemcy spoza UE/EFTA/UK);
   - czy pracujesz lub pobierasz świadczenia w UE/EFTA/UK (koordynacja), a jeśli tak, zagraniczne identyfikatory;
   - pytania o współmałżonka lub drugiego rodzica (praca, mieszkanie, świadczenia w UE/EFTA/UK);
   - status zawodowy wnioskodawcy i współmałżonka;
   - dane współmałżonka lub drugiego rodzica (nieobowiązkowe);
   - czy złożono wniosek o zagraniczne świadczenie rodzinne.
3. **Krok 3:**
   - wybór dzieci (PESEL obowiązkowy);
   - „Czy dziecko mieszka pod tym samym adresem co Ty?”;
   - dla dzieci cudzoziemców: dokumenty, niepełnosprawność, placówka edukacyjna;
   - oświadczenie, czy za granicą przysługuje świadczenie o podobnym charakterze;
   - pytanie o orzeczenie sądu o opiece naprzemiennej (jeśli tak, załącznik).
4. **Krok 4:** pouczenie i obowiązkowe oświadczenia, w tym o niewystępowaniu okoliczności wyłączających (art. 13 ust. 3 pkt 5) oraz klauzula „Jestem świadomy odpowiedzialności karnej za złożenie fałszywego oświadczenia.” (art. 13 ust. 2a).
5. **Krok 5–6:** podsumowanie, „Zatwierdź dane”, „Zatwierdź i wyślij”. Potwierdzeniem jest UPP/UPO wysłane e-mailem.

**Załączniki:** typowy rodzic z obywatelstwem polskim nie dołącza nic. Załączniki są wymagane tylko w szczególnych sytuacjach: opiekun faktyczny lub prawny, piecza zastępcza, orzeczenie o opiece naprzemiennej, karta pobytu cudzoziemca i inne (art. 13 ust. 4; strona ZUS „Jakie dokumenty dołączyć”).

**Opłaty:** ani ustawa, ani strony ZUS nie przewidują żadnej opłaty. Wyraźnego zapisu „bez opłat” w źródle urzędowym nie znalazłem: **NIEZWERYFIKOWANE**.

### A6. Błędy i nieścisłości w aplikacji (`forms-current.json` → `800plus`)

1. **Zły symbol:** `form.name` = „(SW-1)”, a `fidelity` mówi „wniosku SW-1”. Poprawnie jest **SW-R**. SW-1 to archiwalny druk gminny sprzed 2022 r. (A1). Aplikacja jest też niespójna wewnętrznie, bo `caseInApp.howTo.co` podaje już „SW-R”.
2. **`fidelity`: „do weryfikacji z drukiem”.** Druku nie ma. Istnieje tylko kreator elektroniczny (A1, A4).
3. **`form.channels`: tylko „Przez PUE/eZUS”.** To niepełne. Dla SW-R ważne są eZUS, mZUS, bankowość elektroniczna i Emp@tia (A3). `detailsInApp` wymienia je poprawnie, więc formularz i opis sobie przeczą.
4. **Brak pól wymaganych ustawą** (art. 13 ust. 3 pkt 1 lit. a):
   - **e-mail i telefon wnioskodawcy**: ZUS wysyła na nie wezwania i informację o przyznaniu;
   - obywatelstwo i stan cywilny (w kreatorze zwykle pobierane z PESEL);
   - wybór okresu świadczeniowego (2026/2027);
   - oświadczenie o byciu matką lub ojcem;
   - pytania o koordynację UE/EFTA/UK dla siebie i drugiego rodzica;
   - oświadczenie o świadczeniu za granicą;
   - pytanie o opiekę naprzemienną;
   - oświadczenia z pouczenia i klauzula karna.
5. **Pytanie „Czy dziecko mieszka z Tobą?”** z opcją „Nie” sugeruje, że wniosek można złożyć mimo to. Wspólne zamieszkiwanie i utrzymywanie dziecka to warunek prawa (art. 4 ust. 2 pkt 1). Kreator pyta o coś innego: „Czy dziecko mieszka pod tym samym adresem co Ty?”. Odpowiedź „Nie” powinna wyświetlać ostrzeżenie.
6. **Brak informacji, że wniosek złożony w XI 2026 – I 2027 obejmuje tylko okres do 31.05.2027.** Od 1.02.2027 trzeba złożyć nowy wniosek na 2027/2028 (A2). W przeciwnym razie wypłata ustanie od czerwca 2027.
7. **`detailsInApp.uwagi`** twierdzi, że reguła 3 miesięcy „dotyczy okresu do 31.05.2026”. To nieprawda. Reguła jest stała i ustawowa (art. 18 ust. 2a), więc artykuł z fixtures można zastąpić odwołaniem do ustawy lub FAQ ZUS.
8. Drobne:
   - `caseInApp.source` wskazuje angielską wersję newsa (`/en/-/termin-…`); lepiej użyć stałej strony PL lub FAQ ZUS.
   - Strona ZUS powołuje nieaktualny tekst jednolity (2024 poz. 1576). W aplikacji warto podawać Dz.U. 2026 poz. 508.
   - Brakuje wzmianki, że świadczenie należy się z wyrównaniem, ale tylko przy kompletnym wniosku: braki trzeba uzupełnić w terminie wyznaczonym przez ZUS (art. 19, strona ZUS).
9. Elementy poprawne:
   - 800 zł bez kryterium dochodowego;
   - wyłącznie elektronicznie przez eZUS, mZUS, Emp@tia i bank;
   - 3 miesiące od urodzenia, a później świadczenie od miesiąca wniosku;
   - okres 1.06–31.05;
   - proporcjonalna kwota za miesiąc urodzenia;
   - „Załączniki: Brak” dla typowego rodzica.

### A7. Rekomendacja dla 800+

**(c): bez PDF, symulacja złożenia online (kreator SW-R).** Wyjaśnienie:
- Wniosek papierowy jest prawnie nieskuteczny, bo ustawa wymaga postaci wyłącznie elektronicznej (art. 13 ust. 5). Oficjalnego PDF nie ma.
- Wypełniony „oficjalny” PDF albo pismo dowolne wprowadzałyby w błąd: rodzic mógłby je wydrukować i wysłać.
- Kroki symulacji powinny odpowiadać kreatorowi eZUS/Emp@tia (A5): okres → oświadczenie rodzica → dane i kontakt → pytania o koordynację i drugiego rodzica → dzieci → pouczenie i oświadczenia → podsumowanie.
- Na końcu: deep-linki lub instrukcja do eZUS, mZUS, banku i Emp@tia oraz przypomnienie o terminie 3 miesięcy i o nowym wniosku od 1.02.
- Opcjonalnie można dać PDF typu „ściągawka / podsumowanie danych do wpisania”. Musi mieć wyraźny znak „To nie jest wniosek – nie wysyłaj”.

---

## B. `becikowe` – jednorazowa zapomoga z tytułu urodzenia się dziecka

### B1. Nazwa, symbol, podstawa prawna

- **Nazwa urzędowa:** „Wniosek o ustalenie prawa do jednorazowej zapomogi z tytułu urodzenia się dziecka”.
- **Symbol wzoru ministerialnego: SR-2**, aktualna wersja **SR-2(10)**. Dodatkowe druki:
  - SR-2Z: załącznik, gdy dzieci lub członków rodziny jest więcej niż miejsc na wniosku;
  - ZSR-05: oświadczenie o dochodach nieopodatkowanych PIT na zasadach ogólnych;
  - ZSR-07: oświadczenie o gospodarstwie rolnym.
  - Źródło: strona MRPiPS https://www.gov.pl/web/rodzina/jednorazowa-zapomoga-z-tytulu-urodzenia-sie-dziecka-tzw-becikowe---wzor-wniosku-do-stosowania-od-1-listopada-2021-r. Pozycja na tej stronie: „Wniosek o ustalenie prawa do jednorazowej zapomogi (…) (aktualizacja – według stanu prawnego na 1 czerwca 2026 r.)”. Plik ma last-modified 5.06.2026.
- **Ustawa:** ustawa z dnia 28 listopada 2003 r. o świadczeniach rodzinnych, art. 15b. Aktualny tekst jednolity to **Dz.U. 2026 poz. 1240**, obwieszczenie z 1.09.2026, stan prawny na 5.08.2026. Źródła: https://api.sejm.gov.pl/eli/acts/DU/2026/1240 oraz PDF https://api.sejm.gov.pl/eli/acts/DU/2026/1240/text.pdf. Według metadanych ELI ostatni akt zmieniający to Dz.U. 2026 poz. 203; nowszych nie ma. Źródło: https://api.sejm.gov.pl/eli/acts/DU/2003/2255
- **Rozporządzenie:** Ministra Rodziny i Polityki Społecznej z dnia 6 lipca 2023 r. w sprawie sposobu i trybu postępowania w sprawach o przyznanie świadczeń rodzinnych oraz zakresu informacji, jakie mają być zawarte we wniosku i oświadczeniach, **Dz.U. 2023 poz. 1340**, obowiązujące. Źródło: https://api.sejm.gov.pl/eli/acts/DU/2023/1340
  - **To rozporządzenie nie zawiera wzoru formularza.** Ma 5 stron i 0 załączników z wzorem. Określa tylko zakres informacji: § 2 (treść wniosku) i § 8 (dokumenty dla becikowego).
  - § 13: „Formularze wniosków oraz innych dokumentów (…) udostępnia organ właściwy prowadzący postępowanie”.
  - Wniosek: **SR-2 to wzór ministerialny, zalecany, ale nie obowiązkowy**. Gmina może używać własnej wersji. Kopia lokalna rozporządzenia: `becikowe/rozporzadzenie-DU-2023-1340/D20231340.pdf`.
- **Zaświadczenie lekarskie lub od położnej:** wzór urzędowy określa rozporządzenie Ministra Zdrowia z 14.09.2010 w sprawie formy opieki medycznej nad kobietą w ciąży (…) oraz wzoru zaświadczenia. Tekst jednolity: **Dz.U. 2021 poz. 199**, wzór w załączniku na s. 3. Źródło: https://api.sejm.gov.pl/eli/acts/DU/2021/199. Ustawa odsyła do tych przepisów w art. 15b ust. 6.

### B2. Kto, do kogo, terminy, warunki

- **Kwota:** 1000 zł na jedno żywo urodzone dziecko (art. 15b ust. 1, Dz.U. 2026 poz. 1240).
- **Kto składa:** matka lub ojciec, opiekun prawny albo opiekun faktyczny (art. 15b ust. 2). Wzór SR-2 dopuszcza też opiekuna tymczasowego i opiekuna wskazanego przez władze kraju pochodzenia (art. 3a).
- **Kryterium dochodowe:** **1922,00 zł na osobę** (art. 15b ust. 2). Kwota jest wpisana do ustawy, więc nie podlega gminnej weryfikacji i obowiązuje w całym kraju.
  - Dochód to przeciętny miesięczny dochód członka rodziny z **roku kalendarzowego poprzedzającego okres zasiłkowy** (art. 3 pkt 2a). Okres zasiłkowy trwa od 1.11 do 31.10 (art. 3 pkt 10). Dla wniosków składanych od 1.11.2026 do 31.10.2027 **rokiem bazowym jest 2025**.
  - Uwzględnia się utratę i uzyskanie dochodu (art. 15b ust. 2 w zw. z art. 5 ust. 4–4b).
  - gov.pl upraszcza to do „1 922 zł netto”: https://www.gov.pl/web/gov/uzyskaj-becikowe
- **Opieka medyczna:** matka musiała być pod opieką medyczną nie później niż od 10. tygodnia ciąży do porodu (art. 15b ust. 5). Potwierdza to zaświadczenie lekarskie lub od położnej (ust. 6). Wymóg nie dotyczy opiekunów prawnych i faktycznych ani osób, które przysposobiły dziecko (ust. 7).
  - Według rozporządzenia MZ formą opieki są świadczenia w ramach POZ, AOS lub leczenia szpitalnego, udzielone co najmniej raz w każdym trymestrze (§ 2 rozporządzenia MZ, Dz.U. 2021 poz. 199).
- **Wyłączenia** (art. 15b ust. 4):
  - świadczenie z tytułu urodzenia przysługuje członkowi rodziny za granicą;
  - **osoba samotnie wychowująca dziecko nie ma ustalonych alimentów od drugiego rodzica** na podstawie tytułu wykonawczego. Wyjątki: rodzic nie żyje, ojciec nieznany, powództwo oddalone, sąd zobowiązał jednego rodzica do całkowitego utrzymania, opieka naprzemienna.
- **Termin:** 12 miesięcy od dnia narodzin. Wniosek po terminie organ pozostawia bez rozpoznania (art. 15b ust. 3). Przykład z gov.pl: dziecko urodzone 1.04.2026, wniosek najpóźniej 1.04.2027.
- **Do kogo:** do organu właściwego, czyli wójta, burmistrza lub prezydenta miasta właściwego ze względu na miejsce zamieszkania (art. 3 pkt 11 i art. 20 ustawy; przypis (1) na SR-2).
  - Wniosek składa się „w urzędzie gminy lub miasta” (art. 23 ust. 2). Organ może upoważnić kierownika OPS, dyrektora CUS lub inną jednostkę gminy (art. 20 ust. 3).
  - gov.pl: urząd miasta lub gminy, ośrodek pomocy społecznej albo inne miejsce wyznaczone przez gminę, np. centrum świadczeń.
- **Czas rozpatrzenia:** 1 miesiąc, w sprawach szczególnie skomplikowanych 2 miesiące. Gmina wydaje decyzję administracyjną. Odwołanie do SKO w 14 dni, bezpłatne. Wypłata przelewem albo przekazem pocztowym. Źródło: gov.pl, link wyżej.
- **Dochód:** gmina sama pobiera dane o dochodach z urzędu skarbowego, ZUS, KRUS i rejestrów (art. 23b ust. 1). Wnioskodawca nie wpisuje kwoty dochodu, tylko deklaruje sytuacje szczególne we wniosku (pkt 5 SR-2 oraz załączniki ZSR-05 i ZSR-07). Strona Warszawy: „Dochodów nie trzeba dokumentować, urząd je zweryfikuje sam” (aktualizacja 22.06.2026). Źródło: https://warszawa19115.pl/-/przyznanie-jednorazowej-zapomogi-z-tytulu-urodzenia-sie-dziecka-becikowe

### B3. Kanały złożenia (stan 2026)

Ustawa: wniosek „może być składany drogą elektroniczną za pomocą systemu teleinformatycznego utworzonego przez ministra właściwego do spraw rodziny lub systemu teleinformatycznego wskazanego w informacji w BIP ministra” (art. 23 ust. 3a–3b). Logowanie do systemu ministra odbywa się profilem zaufanym, profilem osobistym, innym środkiem z węzła krajowego albo kwalifikowanym certyfikatem (art. 23 ust. 6a).

| Kanał | Ważny? | Logowanie / podpis | Źródło |
|---|---|---|---|
| Papier osobiście (urząd gminy/miasta, OPS, inne miejsce wyznaczone przez gminę) | **TAK** | Własnoręczny podpis | art. 23 ust. 2; gov.pl, zakładka „W urzędzie” |
| Poczta (najlepiej list polecony) | **TAK** | Własnoręczny podpis | gov.pl, zakładka „Listownie”; MRPiPS: „w tradycyjnej formie papierowej w urzędzie lub za pośrednictwem poczty”: https://www.gov.pl/web/rodzina/informacje-ogolne-swiadczenia-rodzinne |
| **Emp@tia** (eWnioski) | **TAK** | Profil zaufany lub podpis kwalifikowany (gov.pl). Ustawa dopuszcza też e-dowód i inne środki z węzła krajowego. Korespondencja z urzędu trafia do skrzynki w Emp@tia | art. 23 ust. 3a, 6a; gov.pl, zakładka „Przez internet”; strona główna https://empatia.gov.pl/ („eWnioski: 800+, Aktywny Rodzic, 300+, KDR, becikowe, świadczenie rodzicielskie i inne”) |
| ePUAP | **Wątpliwy / niezalecany.** MRPiPS i gov.pl nie wymieniają ePUAP dla becikowego. Od 1.01.2026 korespondencja przez ePUAP „będzie skuteczna jedynie w przypadkach, gdy wskazują na to przepisy szczególne”, a podstawowym kanałem są e-Doręczenia. Czy BIP ministra nadal wskazuje ePUAP jako system z art. 23 ust. 3a: **NIEZWERYFIKOWANE** | – | https://www.gov.pl/web/cyfryzacja/od-nowego-roku-e-doreczenia-podstawowym-kanalem-komunikacji-z-urzedami-co-to-oznacza-dla-obywateli (10.12.2025) |
| mObywatel / mobywatel.gov.pl | Warszawa podaje „przez portal Emp@tia lub na stronie mobywatel.gov.pl” i wymaga skrzynki e-Doręczeń od 1.01.2026. Ogólnopolsko: **NIEZWERYFIKOWANE** | Profil zaufany lub podpis kwalifikowany (Warszawa) | strona Warszawy, link w B2 |
| Bankowość elektroniczna | **Brak potwierdzenia.** Ustawa nie wymienia banków (inaczej niż przy 800+). MRPiPS podaje tylko Emp@tia i papier: **NIEZWERYFIKOWANE / raczej NIE** | – | art. 23 ust. 3a; strona MRPiPS wyżej |
| eZUS / mZUS | **NIE.** Becikowe nie jest świadczeniem ZUS | – | art. 23 ust. 2 (gmina) |

Wyjaśnienie uwagi z aplikacji: strona gov.pl „Uzyskaj becikowe” nie jest sprzeczna. Ma trzy zakładki: „Przez internet” (Emp@tia), „W urzędzie” i „Listownie” (wydruk HTML strony, 22.11.2026).

### B4. Oficjalny wzór

1. **SR-2, wniosek główny.** URL: https://www.gov.pl/attachment/20ec64a0-3df1-49dc-9884-369596f3818e (plik `Wniosek_-_wydruk_SR-2.pdf`). Kopia lokalna: `becikowe/SR-2/SR-2.pdf`.
   - **7 stron, A4.**
   - **AcroForm: 1 pole, wyłącznie `PDFSignature "Tomasz Jędrzej Pactwa"`**, czyli podpis elektroniczny wydawcy. **Pól do wypełnienia jest 0.** To druk do ręcznego wypełniania („Wypełniaj WIELKIMI LITERAMI”, „Pola wyboru zaznaczaj V lub X”).
2. **SR-2Z, załącznik:** https://www.gov.pl/attachment/9735eb79-f017-4773-b18e-cf48c0c54581, `becikowe/SR-2Z/SR-2Z.pdf`. 3 strony, 0 pól. Opis na stronie MRPiPS: „bez zmian”.
3. **ZSR-05, oświadczenie o dochodach nieopodatkowanych:** https://www.gov.pl/attachment/cebc7b91-986a-45cf-89d6-62ad94f5b2a9, `becikowe/ZSR-05/ZSR-05.pdf`. 3 strony, 0 pól. Aktualizacja 05.06.2023.
4. **ZSR-07, oświadczenie o gospodarstwie rolnym:** https://www.gov.pl/attachment/0caccb30-b8bf-4709-80cb-e3393506dc36, `becikowe/ZSR-07/ZSR-07.pdf`. 1 strona, 0 pól.
5. **Wzór zaświadczenia lekarskiego lub od położnej** (wzór urzędowy w Dz.U.): załącznik na s. 3 w Dz.U. 2021 poz. 199. PDF: https://api.sejm.gov.pl/eli/acts/DU/2021/199/text.pdf, `becikowe/zaswiadczenie-MZ-DU-2021-199/D20210199.pdf`. 3 strony; 2 pola AcroForm, oba to podpisy (`PDFSignature`); pól do wypełnienia 0. Zaświadczenie wystawia lekarz lub położna, nie rodzic.
6. Wzoru samego wniosku **nie ma w Dzienniku Ustaw** od rozporządzenia z 2023 r. (B1).

### B5. Zawartość formularza SR-2(10), załączniki, opłaty

- **Nagłówek:** nazwa i adres organu właściwego (gmina/dzielnica, kod, miejscowość, ulica, numer domu i lokalu).
- **Część I:**
  1. **Dane wnioskodawcy:** imię, nazwisko, PESEL, data urodzenia, seria i numer dokumentu (tylko bez PESEL), obywatelstwo, stan cywilny (panna, kawaler, zamężna, żonaty, rozwiedziona, rozwiedziony, w separacji, wdowa, wdowiec). Adres zamieszkania: gmina/dzielnica, kod, miejscowość, ulica, numer domu i mieszkania. Telefon nieobowiązkowy. **E-mail obowiązkowy przy wniosku elektronicznym.**
  2. **Dzieci, na które składany jest wniosek** (do 4, kolejne na SR-2Z): nazwisko, imię, PESEL (lub dokument), data urodzenia, obywatelstwo.
  3. **Członkowie rodziny** (do 6, kolejne na SR-2Z): PESEL, nazwisko, imię, pokrewieństwo, dokument (bez PESEL). Wpisuje się wnioskodawcę, dzieci z wniosku, małżonka lub drugiego rodzica oraz pozostałe dzieci do 25 lat na utrzymaniu. Na formularzu jest definicja rodziny z art. 3 pkt 16.
  4. **Organ, do którego płacone są składki zdrowotne:** ZUS, KRUS, Brak, Inny (nazwa i adres).
  5. **Dochody:**
     - 5.1 łączna kwota alimentów płaconych na rzecz innych osób oraz rok;
     - 5.2 TAK/NIE: dochody nieopodatkowane PIT na zasadach ogólnych (przy TAK dołącza się ZSR-05) oraz dochody z gospodarstwa rolnego (przy TAK ZSR-07);
     - 5.3 utrata dochodu: nastąpiła / nie nastąpiła;
     - 5.4 uzyskanie dochodu: nastąpiło / nie nastąpiło.
- **Część II, pouczenia i oświadczenia:**
  - kto jest uprawniony (obywatele i kategorie cudzoziemców);
  - terminy (12 miesięcy) i wyłączenia (alimenty, świadczenie za granicą);
  - **numer rachunku bankowego/SKOK**, wypełniany tylko przy wypłacie na rachunek;
  - oświadczenia: dane są prawdziwe, wnioskodawca zna warunki, za granicą nie przysługuje świadczenie z tytułu urodzenia;
  - obowiązek informowania o zmianach;
  - klauzula odpowiedzialności karnej;
  - **lista dołączonych dokumentów** (pozycje 1–4);
  - miejscowość, data, **podpis wnioskodawcy**.
- **Załączniki:**
  - zaświadczenie lekarskie lub od położnej według wzoru MZ (art. 15b ust. 6; gov.pl). Wzór zawiera dane kobiety, informację „pozostawała pod opieką medyczną od … tygodnia ciąży do porodu”, terminy wizyt w każdym trymestrze oraz podpis i numer PWZ lekarza lub położnej;
  - ZSR-05 lub ZSR-07, jeśli dotyczy;
  - dokumenty o utracie lub uzyskaniu dochodu (art. 23 ust. 4d);
  - u osoby samotnie wychowującej: tytuł alimentacyjny albo dokument wyjątku, np. akt zgonu, odpis zupełny aktu urodzenia przy nieznanym ojcu, orzeczenie o oddaleniu powództwa, orzeczenie o opiece naprzemiennej (§ 5 pkt 5–10 w zw. z § 8 rozporządzenia 2023/1340);
  - u cudzoziemca karta pobytu (§ 3 rozporządzenia).
  - Oświadczenia składa się w oryginale, inne dokumenty w kopii (§ 14).
- **Opłaty:** brak. Warszawa: „za złożenie wniosku nie płaci się opłat”. Odwołanie do SKO jest bezpłatne (gov.pl). Ogólnopolskiego przepisu o zwolnieniu z opłaty nie sprawdzałem: **NIEZWERYFIKOWANE**.

### B6. Błędy i nieścisłości w aplikacji (`forms-current.json` → `becikowe`)

1. **`form.channels`: tylko „Do urzędu przez ePUAP”.** To błąd i wprowadza w błąd. Oficjalne kanały to:
   - **Emp@tia** (online);
   - **papier osobiście** w urzędzie gminy/miasta lub OPS;
   - **poczta** (B3).
   ePUAP od 1.01.2026 nie jest podstawowym kanałem korespondencji z urzędami (e-Doręczenia), a MRPiPS i gov.pl nie wymieniają go dla becikowego.
2. **Pole „Dochód na osobę w rodzinie (miesięcznie, netto)” jako wymagane pole wniosku.** Takiego pola nie ma ani w SR-2, ani w § 2 rozporządzenia. Gminę dochód wylicza sama z danych skarbowych (art. 23b). Liczy się średni miesięczny dochód z **2025 r.**, a nie bieżący. W aplikacji może to być pytanie kontrolne o kwalifikowalność, ale nie pole wniosku. W zamian trzeba zebrać pola 3, 4 i 5.1–5.4 SR-2.
3. **Podpowiedź „Próg: 1922 zł na osobę — do weryfikacji w gminie”.** Próg jest ustawowy i jednolity w całym kraju (art. 15b ust. 2, tekst jednolity 2026), więc nie wymaga weryfikacji w gminie. Gmina może najwyżej przyznać **dodatkowe**, własne świadczenie na podstawie uchwały (art. 22a).
4. **Brak warunku alimentów u osoby samotnie wychowującej** (art. 15b ust. 4 pkt 2) ani w `form`, ani w `detailsInApp`. To częsta przyczyna odmowy, którą gov.pl wyraźnie opisuje.
5. **Brak pól wymaganych przez wniosek** (§ 2 rozporządzenia 2023/1340; SR-2):
   - nazwa i adres organu właściwego (gminy);
   - data urodzenia, obywatelstwo i stan cywilny wnioskodawcy;
   - e-mail (obowiązkowy online), telefon;
   - obywatelstwo dziecka;
   - **skład rodziny** (PESEL, imię, nazwisko, pokrewieństwo);
   - **organ składek zdrowotnych**;
   - alimenty płacone innym;
   - pytania o dochody nieopodatkowane, gospodarstwo rolne, utratę i uzyskanie dochodu;
   - oświadczenia, klauzula karna, lista załączników, miejscowość, data, podpis.
6. **Pole „Czy masz zaświadczenie… od 10. tygodnia ciąży?” (radio).** Formularz o to nie pyta. Zaświadczenie według wzoru MZ trzeba **dołączyć**. Aplikacja powinna traktować je jako załącznik z checklisty i opisać, co musi zawierać (wizyta w każdym trymestrze). Odpowiedź „Nie” powinna blokować wniosek z ostrzeżeniem, chyba że wnioskodawcą jest opiekun lub rodzic adopcyjny.
7. **Brak wzmianki o oficjalnym wzorze SR-2** (`fidelity`: „Wzór gminy może się różnić”). Istnieje wzór ministerialny SR-2(10) aktualny na 1.06.2026 (B4). Gminy mogą mieć własne wersje (§ 13), ale SR-2 jest punktem odniesienia.
8. **`detailsInApp.uwagi`** mówi o „dwóch sprzecznych wariantach” gov.pl. To nie sprzeczność, tylko trzy zakładki tej samej strony (B3). Kanał online istnieje i jest nim Emp@tia.
9. Elementy poprawne:
   - 1000 zł;
   - 1922 zł;
   - 12 miesięcy, a wniosek po terminie nie jest rozpatrywany;
   - opieka od 10. tygodnia, z wyjątkiem opiekunów i przysposabiających;
   - gmina albo OPS;
   - decyzja zwykle w ciągu miesiąca;
   - wypłata przelewem lub przekazem pocztowym.

### B7. Rekomendacja dla becikowego

**(a) wypełniony oficjalny PDF SR-2 + (c) ścieżka online (Emp@tia, symulowana lub z linkiem).** Wyjaśnienie:
- Złożenie papierowe osobiście lub pocztą jest w pełni ważne. Istnieje aktualny wzór ministerialny SR-2(10).
- Wypełniony SR-2 z checklistą załączników to realna wartość dla rodzica: druk, podpis, wysyłka.
- **SR-2 nie ma pól AcroForm.** Trzeba nałożyć tekst według współrzędnych (np. pdf-lib `drawText`) albo wygenerować wierną replikę.
- Oryginał zawiera podpis elektroniczny wydawcy. Każda modyfikacja go unieważni. Do druku to nie przeszkadza, ale lepiej usunąć pole podpisu lub spłaszczyć dokument.
- Dołączyć SR-2Z, gdy dzieci jest więcej niż 4 lub członków rodziny więcej niż 6. ZSR-05 i ZSR-07 tylko wtedy, gdy przy pkt 5.2 zaznaczono TAK.
- Zaświadczenia MZ aplikacja nie wypełnia. Najwyżej może przygotować wzór z danymi matki do wydrukowania dla lekarza lub położnej.
- Równolegle opcja „Złóż online przez Emp@tia” (profil zaufany, e-dowód, podpis kwalifikowany) z tymi samymi danymi.
- **(b) pismo dowolne odradzam.** Ustawa i rozporządzenie wymagają konkretnej treści (§ 2), a gminy udostępniają własne formularze (§ 13). Pismo dowolne zwiększa ryzyko wezwania do uzupełnienia. To moja ocena, nie przepis.

---

## C. Pobrane pliki (każdy w osobnym katalogu)

| Ścieżka (względem `research/benefits/`) | Co to | Strony | AcroForm |
|---|---|---|---|
| `becikowe/SR-2/SR-2.pdf` | Wzór MRPiPS: wniosek SR-2(10), stan na 1.06.2026 | 7 | 1 pole, tylko podpis wydawcy; 0 do wypełnienia |
| `becikowe/SR-2Z/SR-2Z.pdf` | Załącznik SR-2Z | 3 | 0 |
| `becikowe/ZSR-05/ZSR-05.pdf` | Oświadczenie o dochodach nieopodatkowanych | 3 | 0 |
| `becikowe/ZSR-07/ZSR-07.pdf` | Oświadczenie o gospodarstwie rolnym | 1 | 0 |
| `becikowe/zaswiadczenie-MZ-DU-2021-199/D20210199.pdf` | Dz.U. 2021 poz. 199, wzór zaświadczenia lekarskiego na s. 3 | 3 | 2 pola, oba to podpisy; 0 do wypełnienia |
| `becikowe/rozporzadzenie-DU-2023-1340/D20231340.pdf` | Dz.U. 2023 poz. 1340 (bez wzoru) | 5 | 2 pola, oba to podpisy |
| `800plus/empatia-instr-1/instrukcja.pdf` | Instrukcja SW-R w Emp@tia, 03.2026 (aktualna) | 32 | 0 |
| `800plus/empatia-instr-2/instrukcja.pdf` | Instrukcja SW-R w Emp@tia, 12.2021 (archiwalna) | 21 | – |
| `800plus/empatia-instr-3/instrukcja.pdf` | Instrukcja SW-R w Emp@tia, 12.2023 (archiwalna) | 23 | – |
| `800plus/archiwalny-SW-1-2018-2019/wzor_SW_do_2018-2019.pdf` | Archiwalny druk gminny SW-1(2), nieaktualny | 9 | 0 |
| `legal/DU_2026_508.pdf` | Tekst jednolity ustawy o pomocy państwa w wychowywaniu dzieci | 26 | – |
| `legal/DU_2026_1240.pdf` | Tekst jednolity ustawy o świadczeniach rodzinnych | 41 | – |

Wyciągi tekstowe użyte w analizie leżą obok plików (`*.txt`, `html/*.txt`).
