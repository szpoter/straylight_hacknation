# RAPORT: `zasilek-macierzynski` i `ubezpieczenie-dziecka` (stan prawny na 22.11.2026)

Zakres: research bez zmian w repozytorium. Persona: pracownica na umowie o pracę, pracodawca zgłasza do ubezpieczenia chorobowego nie więcej niż 20 osób, więc zasiłek wypłaca ZUS. Wariant z pracodawcą, który zgłasza ponad 20 osób, omawiam osobno. Dziecko (Ola) urodziło się 10.11.2026 (`app/src/lib/demo/fixtures.ts:3`).

Oznaczenia źródeł lokalnych (wszystkie z folderu „Materiały hackathonowe/Materiały dla uczestników”, numery stron według PDF):
- **[UZ]** wyciąg z ustawy zasiłkowej (Dz.U. 2026 poz. 854 ze zm.),
- **[ROZP]** rozporządzenie MRPiPS z 27.09.2026 (Dz.U. 2026 poz. 1316) o informacjach i dokumentach,
- **[RW]** rozporządzenie MRPiPS z 11.03.2025 (Dz.U. 2025 poz. 322) o wnioskach pracowniczych,
- **[KP]** wyciąg z Kodeksu pracy,
- **[POR]** Poradnik dla rodziców, ZUS 2026,
- **[ZAD]** treść zadania (scratchpad/zadanie.txt),
- **[ZAM]** druk ZAM 24.10.2026 z repozytorium (`app/public/forms/zam-2026-10-24.pdf`).

Uwaga o [POR]: poradnik powstał przed reformą. W podstawie prawnej podaje rozporządzenie z 8.12.2015 ([POR] s. 41), opisuje druk Z-3b ([POR] s. 27, 30, 36) i każe „okazać pracodawcy” odpis skrócony ([POR] s. 35). Te fragmenty są nieaktualne po 24.10.2026 (zob. niżej). Pierwszeństwo mają [UZ], [ROZP] i strony zus.pl datowane na 24.10.2026.

---

## FORMULARZ 1: `zasilek-macierzynski`

### 1. Nazwa, symbol, podstawa prawna
- Oficjalny druk: **ZAM, „Wniosek o zasiłek macierzyński”**, wersja z aktualizacją z **24 października 2026 r.** Obejmuje okresy urlopu macierzyńskiego (albo urlopu na warunkach urlopu macierzyńskiego), rodzicielskiego, uzupełniającego urlopu macierzyńskiego i ojcowskiego ([ZAM] s. 1; https://www.zus.pl/-/wniosek-zas-54-1).
- Od 24.10.2026 druki ZUR i ZAO połączono z ZAM i zlikwidowano. Zlikwidowano też Z-3b ([ZAD] s. 12, przypisy 3–5). Lista wzorów ZUS dla zasiłku macierzyńskiego pokazuje dziś tylko ZAM, Z-3 i Z-3a (aktualizacja 24.10.2026), ZAS-55, ZAS-26, ZAS-33 itd. Nie ma na niej ZUR, ZAO ani Z-3b (https://www.zus.pl/wzory-formularzy/zasilki/zasilek-macierzynski, pobrano 22.11.2026).
- Podstawa prawna:
  - art. 30a ust. 1 i art. 31 ust. 1–3, 3f, 3g, 4 [UZ] s. 8–9: wariant 81,5%;
  - art. 61 ust. 1–3 [UZ] s. 19: kto wypłaca (płatnik przy ponad 20 ubezpieczonych, ZUS przy najwyżej 20);
  - art. 61b ust. 1, 3, 4, 4a, 5, 5a [UZ] s. 20–21: forma wniosku, treść, załączniki, 7 dni na przekazanie; brzmienie obowiązuje od 1.07.2026;
  - art. 64 ust. 1 [UZ] s. 22: termin wypłaty;
  - [ROZP] § 12, § 13 (s. 3) oraz załącznik nr 6 (s. 15–16): zakres danych wniosku; załącznik nr 2 (s. 12): Z-3;
  - art. 184 [KP] s. 10.
- Repozytorium: plik `zam-2026-10-24.pdf` ma SHA-256 `45597ebb…c639`. **To identyczny plik jak obecny „Pobierz i drukuj” na zus.pl** (pobrano 22.11.2026, `Last-Modified: 23.10.2026`). Ma 7 stron (5 stron wniosku i 2 strony INFORMACJI) i **0 pól AcroForm**. Plik jest aktualny.
- Na tej samej stronie ZUS jest wariant **„Wypełnij i wydrukuj”**: ten sam nakład („zam. nr 2965/26(E)”), **85 pól AcroForm** i warstwa XFA, `Last-Modified: 26.10.2026`. Pliki wzoru e-formularza w eZUS zaktualizowano 20.11.2026 (https://www.zus.pl/-/wniosek-zas-54-1).

### 2. Kto wypełnia, komu składa, termin
- Wypełnia i podpisuje **ubezpieczona (matka)** ([ZAM] s. 5: „Data / Podpis”).
- **Pracodawca zgłasza najwyżej 20 osób (persona, ZUS wypłaca):**
  - Pracownica składa wniosek **u pracodawcy**. Pracodawca przekazuje do ZUS wniosek i dokumenty razem z zaświadczeniem **Z-3** „niezwłocznie, nie później niż w terminie 7 dni od dnia ich otrzymania” (art. 61b ust. 5 [UZ] s. 21; art. 61 ust. 3 [UZ] s. 19).
  - ZUS: „jeżeli jesteś pracownikiem odpowiedni wniosek i pozostałe dokumenty dostarcz do swojego płatnika składek i poinformuj o tym ZUS osobiście lub przez płatnika składek, który komplet dokumentów przekaże do ZUS” (https://www.zus.pl/-/jak-uzyskac-zasilek-macierzynski-z-tytulu-urodzenia-dziecka, zakładka „Osobiście”).
  - ZUS wypłaca zasiłek najpóźniej w 30 dni od wyjaśnienia ostatniej okoliczności (art. 64 ust. 1 [UZ] s. 22).
- **Pracodawca zgłasza ponad 20 osób:** płatnik sam ustala prawo do zasiłku i wypłaca go w terminach wypłaty wynagrodzeń. Wniosek trafia wyłącznie do pracodawcy, bez Z-3 i bez udziału ZUS (art. 61 ust. 1 pkt 1, art. 64 ust. 1 [UZ]; [POR] s. 35). Odmowę można zaskarżyć wnioskiem do ZUS o decyzję (art. 63 [UZ] s. 22).
- Próg „20” dotyczy liczby osób **zgłoszonych do ubezpieczenia chorobowego** według stanu na **30 listopada poprzedniego roku**, a nie liczby zatrudnionych (art. 61 ust. 2 [UZ] s. 19; https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/postepowanie-w-sprawie-zasilkow/platnicy-zasilku).
- **Reguła 21 dni (81,5%):** ubezpieczona matka „nie później niż 21 dni po porodzie” składa **pisemny** wniosek o zasiłek za okres urlopu macierzyńskiego i rodzicielskiego w pełnym wymiarze. Wyłączone są 9 tygodni zarezerwowane dla ojca (art. 30a ust. 1, art. 31 ust. 3 [UZ] s. 8–9). Według ZUS warunek spełnia też wniosek za sam urlop macierzyński z deklaracją pełnego urlopu rodzicielskiego (https://www.zus.pl/pl/swiadczenia/zasilki/zasilek-macierzynski/wysokosc, strona z 4.02.2026; checkbox „Informuję, że zamierzam skorzystać z pełnego wymiaru…” w [ZAM] s. 2). Wniosek o sam urlop rodzicielski można wtedy złożyć później, 21 dni przed jego rozpoczęciem (ta sama strona; art. 182¹d § 1 [KP] s. 6).
- Dla porodu 10.11.2026 termin to **1.12.2026**. W aplikacji jest dobrze.
- Data złożenia wniosku u pracodawcy liczy się dla terminu. Z-3 zawiera „datę złożenia wniosku o zasiłek macierzyński” ([ROZP] zał. 2 pkt 12, s. 12).
- Wyjątki od 81,5%:
  - 9 tygodni drugiego rodzica zawsze płatne 70% (art. 31 ust. 3f);
  - jeśli żaden dzień urlopu rodzicielskiego nie przypada w 1. roku życia dziecka, za urlop rodzicielski przysługuje 70% (art. 31 ust. 3g), a za urlop macierzyński jednorazowe wyrównanie do 100% na wniosek (art. 31 ust. 4) ([UZ] s. 9).
- Roszczenie przedawnia się po 6 miesiącach od ostatniego dnia okresu zasiłku (art. 67 ust. 1 [UZ] s. 23).

### 3. Kanały składania (stan na dziś)
| Kanał | Kto może | Uwagi / źródło |
|---|---|---|
| Papier osobiście albo pocztą **do pracodawcy** | rodzic | Podstawowa ścieżka pracownicy przy obu progach. Przy progu do 20 pracodawca przekazuje dokumenty do ZUS (art. 61b ust. 5 [UZ]; strona ZUS „Jak uzyskać…”, zakładki „Osobiście” i „Pocztą”). |
| Postać elektroniczna (np. e-mail) **do pracodawcy**, gdy płatnikiem zasiłku jest pracodawca (ponad 20) | rodzic | Art. 61b ust. 1 pkt 1 [UZ] s. 20: „w postaci papierowej lub w postaci elektronicznej – jeżeli płatnikiem zasiłku jest płatnik składek”. |
| E-mail do pracodawcy, gdy zasiłek wypłaca ZUS (do 20) | rodzic | **NIEZWERYFIKOWANE.** Art. 61b ust. 1 pkt 2 dla wniosku wypłacanego przez ZUS przewiduje tylko papier albo dokument elektroniczny podpisany QES, podpisem zaufanym, podpisem osobistym lub potwierdzony w systemie ZUS, wysłany na ESP lub adres do e-doręczeń ZUS. Ust. 5a pozwala płatnikowi przekazać do ZUS elektroniczne kopie wniosku. Niepodpisany PDF wysłany e-mailem nie jest formą wymienioną w ustawie. Bezpieczniej: podpisany oryginał albo eZUS. |
| **PUE/eZUS, usługa „Złożenie dokumentu ZAM”** | rodzic, **tylko gdy zasiłek wypłaca ZUS** | ZUS: „Z tej formy złożenia wniosku możesz skorzystać jeśli zasiłek będzie wypłacał ZUS”. Podpis: certyfikat kwalifikowany, profil zaufany, profil PUE/eZUS albo podpis osobisty (e-dowód) (https://www.zus.pl/-/jak-uzyskac-zasilek-macierzynski-z-tytulu-urodzenia-dziecka, zakładka „Przez Internet”). ZUS dodaje, że pracownica, która wystąpiła o urlop do pracodawcy, „nie musi składać wniosku ZAM” (tamże). Z-3 i tak wystawia pracodawca. |
| ESP ZUS (ePUAP) albo e-Doręczenia ZUS | rodzic, gdy ZUS wypłaca | Art. 61b ust. 1 pkt 2 [UZ] s. 20. |
| Placówka ZUS (papier) | rodzic, gdy ZUS wypłaca | Ta sama strona ZUS (zakładka „Osobiście”). Dla pracownicy ZUS wskazuje jednak drogę przez płatnika. |
| PUE/eZUS (profil płatnika): Z-3, Z-3a, przekazanie wniosku | **tylko płatnik** | „Płatnik składek ma możliwość złożenia do ZUS dokumentu Z-3, Z-3a za pośrednictwem PUE/eZUS” (strona ZUS „Jak uzyskać…”). |
| **mZUS** | nie ma takiej usługi | Strona mZUS (z 28.07.2025) wymienia wnioski 800+, Aktywny Rodzic i 300+. **ZAM nie jest dostępny** (https://www.zus.pl/pl/mzus). |
| e-mail `mama@zus.pl` | kontakt, nie kanał składania | Wymieniony jako kanał kontaktu z ekspertami ([POR] s. 40). |

Logowanie do eZUS: konto założone przez login.gov.pl (profil zaufany, bankowość, mObywatel, e-Dowód, eID) albo potwierdzone podczas e-wizyty lub w placówce (https://www.zus.pl/baza-wiedzy/o-portalu-pue-/jak-zarejestrowac-konto-na-pue).

### 4. Wzór urzędowy
- **Tak, istnieje: ZAM.** URL strony: https://www.zus.pl/-/wniosek-zas-54-1.
  - „Pobierz i drukuj” (plik z repozytorium, bez pól): https://www.zus.pl/documents/10182/4223950/ZAM_pobierz+i+drukuj.pdf/f1ad7e3f-0eaa-fdbc-20ec-5b07ab59566a?t=1792761767460
  - „Wypełnij i wydrukuj” (85 pól AcroForm i XFA): https://www.zus.pl/documents/10182/4223950/ZAM_wypelnij_i_wydrukuj.pdf/4e4534c6-e7cd-b934-9c5e-aab4d64f3f20?t=1793008198611
- **Plik w repozytorium jest aktualny** (hash zgodny z zus.pl na 22.11.2026).
- **Komu pracownica składa ZAM:** pracodawcy, który przy progu do 20 przekazuje go do ZUS z Z-3. Alternatywnie, tylko gdy zasiłek wypłaca ZUS, sama przez eZUS.
- **Czy pracownica potrzebuje ZAM:** prawnie nie musi.
  - [ZAD] s. 6: pracownica składa pracodawcy wniosek o urlop macierzyński, a gdy planuje bezpośrednio po nim urlop rodzicielski, może złożyć jeden wniosek. ZAM składa „kobieta, która nie jest pracownikiem” albo zleceniobiorczyni.
  - ZUS: pracownica, która wystąpiła o urlop do pracodawcy, nie musi składać ZAM (strona „Jak uzyskać…”, zakładka „Przez Internet”).
  - [POR] s. 35: przy dużym płatniku wariant zasiłku „zwykle można wskazać na formularzu przez niego udostępnionym”.
  - Dla 81,5% potrzebny jest jednak **pisemny wniosek w 21 dni** (art. 30a [UZ]) z danymi z [ROZP] zał. 6. ZAM jest najpełniejszym gotowym nośnikiem tych danych: ma checkbox deklaracji, sekcję drugiego rodzica i dane płatnika. Można go użyć zamiast pisma odręcznego.

### 5. Wymagane dane, załączniki, opłaty
**Dane** (art. 61b ust. 3 [UZ]; [ROZP] zał. 6 s. 15–16; [ZAM] s. 1–5):
- dane ubezpieczonej: imię, nazwisko, PESEL (albo dokument i data urodzenia) oraz **adres zamieszkania**; telefon dobrowolny;
- **dane płatnika: NIP** (albo REGON, PESEL lub dokument), nazwa i adres;
- rodzaj świadczenia i **okres** (urlop macierzyński i/lub rodzicielski, od–do, która część);
- podstawa: urodzenie dziecka;
- **dane dziecka:** imię, nazwisko, PESEL (jeśli nadany), data i **miejsce** urodzenia. Druk ZAM nie ma osobnej kratki na PESEL dziecka, jest tylko pole tekstowe „imię i nazwisko oraz datę i miejsce urodzenia” ([ZAM] s. 3). PESEL wymagają [ROZP] § 13 ust. 3 i zał. 6 pkt 5 oraz strona ZUS „Niezbędne dokumenty”;
- oświadczenie o zaświadczeniu „Za życiem” (art. 61b ust. 4a [UZ]; zał. 6 pkt 9);
- informacja o pełnym wymiarze urlopów i o tym, że co najmniej 1 dzień urlopu rodzicielskiego przypadnie w 1. roku życia dziecka (zał. 6 pkt 15; [ZAM] s. 2);
- informacja, czy drugi rodzic skorzysta z zasiłku za urlop rodzicielski, i w jakim okresie (zał. 6 pkt 14; [ZAM] s. 5);
- **dane drugiego rodzica:** imię, nazwisko, PESEL (zał. 6 pkt 6; [ZAM] s. 5). Strona ZUS „Niezbędne dokumenty – zasiłek macierzyński” z 24.10.2026 wymienia „imię i nazwisko drugiego rodzica dziecka wraz z numerem PESEL” jako wymagane do zasiłku za okres urlopu macierzyńskiego (https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/niezbedne-dokumenty);
- rachunek bankowy (zał. 6 pkt 17). W ZAM pole jest dobrowolne; bez niego zasiłek przychodzi **przekazem pocztowym na adres z wniosku** ([ZAM] s. 2);
- miejscowość, data, podpis (zał. 6 pkt 18) oraz oświadczenie o prawdziwości danych ([ZAM] s. 5).

**Załączniki:**
- **Do 20 (ZUS wypłaca):** odpisu skróconego aktu urodzenia **nie przedstawia się**. Przekazuje się dane dziecka i rodzica, a ZUS sam pobiera odpis z rejestru stanu cywilnego. Jeśli mu się to nie uda, wzywa do dostarczenia odpisu w co najmniej 14 dni ([ROZP] § 13 ust. 2–4, s. 3). **Z-3 wystawia i wysyła pracodawca**; to nie jest załącznik od matki (art. 61 ust. 3 [UZ]; [ROZP] § 3 ust. 2 i zał. 2). Zaświadczenie „Za życiem”: wystarczy oświadczenie (art. 61b ust. 4a [UZ]).
  - Strona ZUS „Jak uzyskać…” nadal mówi o odpisie skróconym albo kopii, „na Twój wniosek oddział ZUS sam może uzyskać odpis”. Jest niedatowana i wygląda na niezaktualizowaną. Nowsza strona „Niezbędne dokumenty” z 24.10.2026 i [ROZP] wymagają już tylko danych dziecka.
- **Ponad 20 (pracodawca wypłaca):** wymagany jest **odpis skrócony aktu urodzenia** (albo zagraniczny akt), bo wyjątek z [ROZP] § 13 ust. 2 dotyczy tylko sytuacji, gdy płatnikiem jest ZUS (§ 13 ust. 1 pkt 2). [POR] s. 35: „okazać pracodawcy do wglądu skrócony odpis”.
  - Do wniosku o **urlop rodzicielski** na podstawie KP dołącza się odpis albo jego kopię niezależnie od progu ([RW] § 15 ust. 2 pkt 1, s. 8), chyba że jest już w aktach osobowych ([RW] § 22, s. 10). To dotyczy formularza `rodzicielski`, nie zasiłku.
- **Opłaty:** brak. Żadne z przejrzanych źródeł ZUS nie przewiduje opłaty. Brak przepisu o opłacie skarbowej: **NIEZWERYFIKOWANE** w ustawie o opłacie skarbowej.

### 6. Porównanie z aplikacją (`forms-current.json` → `zasilek-macierzynski`)
Błędy i miejsca wprowadzające w błąd:
1. **Brak adresu zamieszkania** we wniosku. Wymagają go art. 61b ust. 3 pkt 1 [UZ], zał. 6 pkt 3 i ZAM. Skutek jest poważny, bo aplikacja oferuje „Przekazem pocztowym”, a przekaz idzie właśnie na adres z wniosku ([ZAM] s. 2).
2. **Brak NIP i REGON płatnika.** Jest tylko pole tekstowe „Pracodawca”, a ustawa wymaga NIP (art. 61b ust. 3 pkt 2 [UZ]; zał. 6 pkt 1–2; [ZAM] s. 1).
3. **Brak miejsca urodzenia dziecka** w polach formularza ([ROZP] § 13 ust. 3, zał. 6 pkt 5; [ZAM] s. 3). `prepare` o nim wspomina, ale formularz go nie zbiera.
4. **Brak danych drugiego rodzica** (imię, nazwisko, PESEL) i pytania, czy drugi rodzic skorzysta z urlopu rodzicielskiego (zał. 6 pkt 6 i 14; [ZAM] s. 5; ZUS „Niezbędne dokumenty”). `detailsInApp` mówi, że trzeba je podać, ale formularz ich nie ma. Aplikacja jest tu niespójna sama ze sobą.
5. **Brak okresów (od–do)** urlopu macierzyńskiego i rodzicielskiego oraz brak sformułowania deklaracji z warunkiem „co najmniej jeden dzień urlopu rodzicielskiego w pierwszym roku życia” (zał. 6 pkt 7 i 15; [ZAM] s. 2). Pytanie „Tak/Nie” nie oddaje drugiej ścieżki z art. 30a, czyli wniosku za urlop macierzyński z deklaracją (ZUS „Wysokość”).
6. Podpowiedź „„Tak” — 81,5% podstawy za cały czas” upraszcza za bardzo. 9 tygodni drugiego rodzica zawsze płatne jest 70% (art. 31 ust. 3f). Gdy żaden dzień urlopu rodzicielskiego nie wypada w 1. roku życia dziecka, za urlop rodzicielski przysługuje 70%, a za macierzyński wyrównanie do 100% (art. 31 ust. 3g i 4 [UZ]).
7. **Brak oświadczenia „Za życiem”** (art. 61b ust. 4a [UZ]; zał. 6 pkt 9). Ono wydłuża urlop rodzicielski do 65 lub 67 tygodni ([ZAM] s. 6).
8. **Brak daty, podpisu i oświadczenia o prawdziwości danych** (zał. 6 pkt 18; [ZAM] s. 5).
9. Opcja „4 lub więcej” w polu `liczba_dzieci` łączy dwa różne wymiary urlopu: 4 dzieci to 35 tygodni, 5 i więcej to 37 tygodni (art. 180 § 1 [KP] s. 3; [ZAM] s. 6). Drobne, ale nieścisłe.
10. `fidelity: „Uproszczony układ wniosku składanego przez pracodawcę”` jest mylące. **Wniosek składa pracownica**, a pracodawca go przekazuje razem z Z-3 (art. 61b ust. 5 [UZ]). Brakuje też nazwy oficjalnego druku: **ZAM (wersja 24.10.2026)**.
11. Kanał **„E-mailem jako PDF”**: przy progu do 20 (persona) to nie jest forma wymieniona w art. 61b ust. 1 pkt 2 [UZ] (NIEZWERYFIKOWANE, czy pracodawca może przyjąć skan). Przy progu ponad 20 jest dopuszczalny (art. 61b ust. 1 pkt 1). Aplikacja **pomija kanał eZUS „Złożenie dokumentu ZAM”**, dostępny, gdy zasiłek wypłaca ZUS.
12. `howTo.doKogo`: „zatrudnia do 20 osób” to skrót myślowy. Liczą się osoby zgłoszone do ubezpieczenia chorobowego według stanu na 30.11 poprzedniego roku, w tym np. zleceniobiorcy z chorobowym (art. 61 ust. 2 [UZ]; ZUS „Płatnicy zasiłku”). Warto dodać, że pracodawca ma **7 dni** na przekazanie (art. 61b ust. 5).
13. `howTo.zalaczniki: „Brak — we wniosku podajesz dane Oli”` jest poprawne dla progu do 20 ([ROZP] § 13 ust. 2–3). **Dla progu ponad 20 to błąd**: potrzebny jest odpis skrócony (§ 13 ust. 1 pkt 2). Aplikacja powinna zmieniać tę informację w zależności od progu. W `uwagi` jest też nieścisłość: przy uzupełniającym urlopie macierzyńskim, gdy wypłaca ZUS, odpisu też się nie przedstawia ([ROZP] § 27 ust. 2 w zw. z § 13 ust. 2–4). Wymagane jest za to zaświadczenie ze szpitala (§ 26 pkt 4).

Co jest poprawne:
- termin 1.12.2026;
- skutek przekroczenia terminu (100%, potem 70%; ZUS „Wysokość”);
- konieczność Z-3 przy wypłacie przez ZUS;
- dolna granica: zasiłek po zaliczce na podatek jest podwyższany do 1000 zł, czyli kwoty świadczenia rodzicielskiego (art. 31 ust. 3a [UZ]; ZUS „Wysokość”, sekcja o podwyższeniu);
- źródło `niezbedne-dokumenty` (aktualne, z 24.10.2026).

### 7. Rekomendacja
**Rekomenduję kombinację (a) i (c).**
- **(a) Wypełniony urzędowy ZAM** (wersja 24.10.2026) jako główny artefakt do wydruku i podpisu, oddawany **pracodawcy**.
  - Uzasadnienie: art. 30a wymaga pisemnego wniosku w 21 dni. ZAM pokrywa dokładnie zakres zał. 6 [ROZP]. Pracodawca przy progu do 20 przekazuje go do ZUS bez przepisywania, a ZUS zna i akceptuje ten druk.
  - Technicznie można zostać przy nakładce współrzędnych na pliku z repozytorium albo wypełniać 85 pól AcroForm w wariancie „Wypełnij i wydrukuj”. Ten wariant to hybryda z XFA; pdf-lib usuwa XFA przy wczytaniu, co do wydruku nie przeszkadza.
  - PESEL dziecka trzeba wpisać w pole tekstowe „Dane dziecka”.
  - Trzeba uzupełnić pola wymienione w pkt 6.1–6.8.
- **(c) Symulowana wysyłka przez eZUS („Złożenie dokumentu ZAM”)** jako opcja tylko przy progu do 20. Ekran powinien uprzedzać, że:
  - pracodawca i tak musi wysłać Z-3;
  - trzeba go o tym poinformować;
  - podpis składa się profilem zaufanym, profilem PUE, QES albo e-dowodem.
- **Dla progu ponad 20:** to samo (a). Można też dopuścić (b), czyli list w dowolnej formie, bo pracodawca może mieć własny formularz ([POR] s. 35). Wysyłka e-mailem jest tu prawnie dopuszczalna, a w liście kontrolnym trzeba dodać odpis skrócony aktu urodzenia.
- Kanał „E-mailem jako PDF” przy personie (do 20) usunąć albo oznaczyć jako „kopia do kadr, oryginał podpisany papierowo”.

---

## FORMULARZ 2: `ubezpieczenie-dziecka`

### 1. Nazwa, symbol, podstawa prawna
- Dokument, który trafia do ZUS: **ZUS ZCNA, „Zgłoszenie danych o członkach rodziny dla celów ubezpieczenia zdrowotnego”**. Strona ZUS podaje „Aktualizacja 14.05.2021 r.” (https://www.zus.pl/-/zgloszenie-zus-zcna). Plik „Wypełnij i wydrukuj” ma `Last-Modified: 19.05.2026`, oba pliki są z nakładu „zam. 2384/20”.
- **ZCNA składa płatnik składek, a nie rodzic-pracownik.**
- Podstawa prawna:
  - **art. 67 ust. 3 u.ś.o.z.** (Dz.U. 2025 poz. 1461, s. 100): osoba podlegająca ubezpieczeniu „ma obowiązek zgłosić do ubezpieczenia zdrowotnego członków rodziny”. Osoby, które nie zgłaszają się same, „informują podmiot właściwy do dokonania zgłoszenia … w terminie 7 dni od dnia zaistnienia okoliczności powodujących konieczność dokonania zgłoszenia. Członkowie rodziny uzyskują prawo do świadczeń … od dnia zgłoszenia”;
  - art. 67 ust. 3a (s. 101): wystarczy zgłoszenie przez **jedną** osobę;
  - art. 5 pkt 3 (s. 7–8): definicja członka rodziny;
  - art. 74 (s. 105): tryb jak dla ubezpieczeń społecznych; przedsiębiorca może zgłaszać przez CEIDG (ust. 3);
  - ZUS podaje też art. 36 ustawy o systemie ubezpieczeń społecznych (https://www.zus.pl/firmy/zgloszenie-platnika/firmy/zgloszenie-ubezpieczonego/czlonka-rodziny-ubezpieczonego).
  - Tekst ustawy pobrany z API Sejmu ELI: https://api.sejm.gov.pl/eli/acts/DU/2025/1461/text.pdf (odpowiada https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU20251461). Zmian po 24.10.2025 nie sprawdzałem (**NIEZWERYFIKOWANE**).

### 2. Kto, komu, termin
- **Pracownik (persona):** informuje **pracodawcę**. ZUS: „ma obowiązek poinformować swojego płatnika (np. pracodawcę) o członkach rodziny w terminie 7 dni od zaistnienia okoliczności powodujących konieczność zgłoszenia. Płatnik zobowiązany jest zgłosić członków rodziny osoby ubezpieczonej w terminie **7 dni od uzyskania tej informacji**” (strona ZUS „Zgłoszenie ubezpieczonego / członka rodziny”, wyżej).
- **Przedsiębiorca** zgłasza sam, na ZCNA, w 7 dni (tamże). Osoba zarejestrowana jako bezrobotna zgłasza w urzędzie pracy (https://pacjent.gov.pl/artykul/jak-ubezpieczyc-czlonka-rodziny).
- Od czego liczyć 7 dni:
  - ustawa: od „zaistnienia okoliczności”;
  - pacjent.gov.pl (strona z 16.03.2023) podaje dla noworodka „7 dni od momentu nadania mu numeru PESEL”, a w tym samym artykule wyżej „7 dni od momentu gdy … urodzi Ci się dziecko”.
  - Liczenie od PESEL to praktyczna interpretacja portalu rządowego, a nie dosłowne brzmienie ustawy. Ma sens, bo ZCNA wymaga PESEL albo dokumentu, a noworodek przed rejestracją nie ma żadnego z nich.
- Prawo do świadczeń: dziecko poniżej 18 lat z obywatelstwem polskim ma prawo do świadczeń finansowanych publicznie także bez zgłoszenia (art. 2 ust. 1 pkt 3 lit. a u.ś.o.z., s. 6). pacjent.gov.pl: „Wszystkie dzieci mają prawo do bezpłatnego leczenia. Ale rodzice mają obowiązek zgłoszenia dzieci do ubezpieczenia.”
- Zgłoszenie trzeba powtarzać przy każdej zmianie pracodawcy lub formy zatrudnienia (pacjent.gov.pl).

### 3. Kanały
| Kanał | Kto | Źródło |
|---|---|---|
| Informacja **do pracodawcy**: papier, e-mail, system kadrowy | rodzic | Ustawa mówi tylko „informują” i **nie określa formy** (art. 67 ust. 3 u.ś.o.z.). Czy konkretny pracodawca przyjmie e-mail, zależy od jego praktyki (NIEZWERYFIKOWANE dla danego pracodawcy). |
| ZCNA do ZUS elektronicznie (program Płatnik albo eZUS na profilu płatnika) | **tylko płatnik** | Płatnik rozliczający ponad 5 osób musi przekazywać dokumenty elektronicznie, rozliczający 5 lub mniej może papierowo (https://www.zus.pl/firmy/sposob-przekazywania-dokumentow/forma-papierowa). |
| ZCNA przez eZUS albo CEIDG samodzielnie | przedsiębiorca jako własny płatnik | Strona ZUS „Zgłoszenie ubezpieczonego…”; art. 74 ust. 3 u.ś.o.z. |
| Samodzielne zgłoszenie online przez pracownika | **nie ma takiego kanału** | W źródłach ZUS i pacjent.gov.pl pracownik zgłasza dziecko tylko przez płatnika. Brak usługi „ZCNA” dla klienta indywidualnego niebędącego płatnikiem: **NIEZWERYFIKOWANE** w samym interfejsie eZUS. |
| **Sprawdzenie skutku** w mZUS/eZUS | rodzic | mZUS pokazuje „zgłoszenia członków rodziny do ubezpieczenia zdrowotnego” (https://www.zus.pl/pl/mzus). |

### 4. Wzór urzędowy
- **Oficjalnego wzoru „informacji pracownika dla pracodawcy” nie ma.**
  - ZUS mówi tylko o obowiązku poinformowania płatnika, a „aby zgłosić członka rodziny, należy użyć formularza ZUS ZCNA”, który jest dokumentem płatnika (strona ZUS wyżej).
  - Nie znalazłem wzoru oświadczenia na zus.pl, gov.pl ani pacjent.gov.pl. Wyszukiwanie zwróciło jedynie wzory komercyjne lub urzędów gmin.
- **Druk ZCNA** (może go wydrukować każdy, ale składa płatnik):
  - „Pobierz” `zcna.pdf`: https://www.zus.pl/documents/10182/18428/zcna.pdf/42c2bfc3-5281-4b22-8901-7f3d3c9c3c1a?t=1620988986291. 2 strony, **0 pól AcroForm**, praktycznie bez warstwy tekstowej (glify jako grafika).
  - „Wypełnij i wydrukuj”: https://www.zus.pl/documents/10182/18428/2384_20+ZCNA__WCAG_do+zapisu.pdf/aaae2bde-9065-d64d-01cf-250841193f28?t=1779184759043. 2 strony, **59 pól AcroForm** (np. `III01_NrPESEL`, `IV03A_NrPESEL`, `IV10A` z listą kodów pokrewieństwa, `IV11A` wspólne gospodarstwo, `IV12A` kod niepełnosprawności, `VI01_PodpisZglaszanej`) i XFA.
  - Druk ma **blok VII „Oświadczenie osoby ubezpieczonej”**, w którym ubezpieczony własnoręcznie potwierdza dane (poradnik ZUS ZCNA, maj 2022, s. 9: https://www.zus.pl/documents/10182/167567/ZUS_ZCNA.pdf/7c416097-ff77-4b70-bc25-cb141c974df8). Wersja papierowa przewiduje więc podpis rodzica.

### 5. Wymagane dane, załączniki, opłaty
Z poradnika ZUS ZCNA (s. 5–9):
- **blok II:** dane płatnika (NIP, REGON, nazwa); wypełnia pracodawca;
- **blok III:** dane ubezpieczonego, czyli rodzica: **PESEL**, nazwisko, imię, **data urodzenia**;
- **blok IV.A:**
  - pole 01: „1” (zgłoszenie);
  - pole 02: data uzyskania uprawnień;
  - pole 03: PESEL dziecka (pola 05–06 tylko przy braku PESEL);
  - pola 07–09: nazwisko, imię, data urodzenia;
  - pole 10: **kod pokrewieństwa**, „11” oznacza dziecko własne, przysposobione lub dziecko małżonka, „21” wnuka albo dziecko obce pod opieką lub w rodzinie zastępczej;
  - pole 11: „X”, jeśli dziecko pozostaje we **wspólnym gospodarstwie domowym**;
  - pole 12: **kod niepełnosprawności**, „0” gdy brak orzeczenia;
- **blok IV.B:** adres dziecka, **tylko jeśli jest inny** niż adres ubezpieczonego;
- **bloki VI i VII:** data i podpis płatnika oraz podpis ubezpieczonego.

Załączniki: **żadne nie są wymagane** (ZUS: wystarczy ZCNA). Opłaty: **brak**. Za członka rodziny nie płaci się składki (pacjent.gov.pl). Osobna „opłata” nie istnieje: **NIEZWERYFIKOWANE** w przepisach o opłatach, ale w żadnym źródle nie ma o niej wzmianki.

### 6. Porównanie z aplikacją (`forms-current.json` → `ubezpieczenie-dziecka`)
1. `form.name`: „Zgłoszenie dziecka do ubezpieczenia zdrowotnego (ZUS ZCNA)” sugeruje, że rodzic wypełnia ZCNA. W rzeczywistości rodzic składa **informację dla pracodawcy**, a ZCNA składa płatnik. `fidelity` mówi to poprawnie, nazwa nie.
2. **Brak PESEL i daty urodzenia rodzica** (ZCNA blok III, pola 01 i 07). Pracodawca zwykle ma je w aktach, ale druk ich wymaga.
3. Brak pola **adres dziecka, jeśli inny** (IV.B) i pola **orzeczenie o niepełnosprawności** (IV.A pole 12, domyślnie 0). Drobne.
4. `howTo.zalaczniki: „Numer PESEL dziecka”`: numer to nie załącznik. Załączników **nie ma** (ZUS).
5. `doKiedy` / `dueBasis`: „7 dni od nadania numeru PESEL” to uproszczenie z pacjent.gov.pl. Ustawa mówi o 7 dniach od zaistnienia okoliczności (art. 67 ust. 3). Brakuje też informacji, że **pracodawca ma kolejne 7 dni od otrzymania informacji** (ZUS). Proponuję brzmienie: „Poinformuj pracodawcę w ciągu 7 dni (praktycznie od nadania PESEL); pracodawca zgłasza Olę na ZUS ZCNA w ciągu 7 dni”.
6. `why` / `detailsInApp` nie mówią, że **wystarczy zgłoszenie przez jednego z rodziców** (art. 67 ust. 3a). To się przydaje, gdy drugi rodzic ma szybszą ścieżkę, np. własną firmę.
7. Brak informacji, że **dziecko ma prawo do świadczeń także przed zgłoszeniem** (art. 2 ust. 1 pkt 3 lit. a u.ś.o.z.; pacjent.gov.pl). Bez niej tekst może niepotrzebnie straszyć.
8. Brak kroku **„sprawdź w mZUS/eZUS, czy pracodawca zgłosił Olę”** (mZUS pokazuje zgłoszenia członków rodziny).
9. Kanał „E-mailem jako PDF” jest prawnie dopuszczalny (ustawa nie określa formy). Gdy pracodawca składa ZCNA na papierze, będzie potrzebny podpis rodzica w bloku VII.
10. Opcje w polu `pokrewienstwo` są w porządku, mapują się na kody 11 i 21. Brak tylko „dziecko małżonka” i „wnuk”.

Co jest poprawne:
- rejestracja w USC nie zgłasza dziecka automatycznie (pacjent.gov.pl);
- pracownik zgłasza przez pracodawcę, przedsiębiorca sam na ZCNA, bezrobotny w urzędzie pracy, dziadkowie, gdy rodzice nie są ubezpieczeni (pacjent.gov.pl; ZUS);
- dziecko można zgłosić do 18 lat, a uczące się do 26 lat. Brakuje uzupełnienia: przy znacznym stopniu niepełnosprawności bez limitu wieku (art. 5 pkt 3 lit. a).

### 7. Rekomendacja
**Rekomenduję (b) i opcjonalnie (a), bez wysyłki online w imieniu pracownika.**
- **(b) Krótki list PDF „Informacja dla pracodawcy o członku rodziny do zgłoszenia do ubezpieczenia zdrowotnego (dane do ZUS ZCNA)”.** Powinien zawierać wszystkie dane z bloków III i IV.A, z kodem 11, X przy wspólnym gospodarstwie i kodem niepełnosprawności 0, oraz miejsce na podpis.
  - Do wysłania e-mailem lub oddania w kadrach.
  - To odpowiada ustawie, bo pracownik ma tylko „poinformować”, a forma jest dowolna.
- **(a) Opcjonalnie wstępnie wypełniony ZCNA „Wypełnij i wydrukuj”** (59 pól AcroForm). Bloki III–IV i podpis w bloku VII wypełnia rodzic, bloki II i VI pracodawca. Przydaje się małym pracodawcom (do 5 osób), którzy składają papierowo.
- **Bez (c)**, bo pracownik nie ma kanału online do ZCNA. Zamiast tego w aplikacji można symulować krok „sprawdź zgłoszenie w mZUS/eZUS”.

---

## Pobrane pliki (każdy w osobnym katalogu w `research/zus/`)
| Plik | Strony | AcroForm | SHA-256 |
|---|---|---|---|
| `zam-drukuj/ZAM_pobierz_i_drukuj.pdf` (taki sam jak plik w repo) | 7 | 0 | 45597ebb0278edf7518e24cf8eb764f242661638c7d1288ab0b6edf70186c639 |
| `zam-wypelnij/ZAM_wypelnij_i_wydrukuj.pdf` | 7 | 85 (+XFA) | 4c242de9e30c670c6e4e447d4e615179a77b7aa8fe007a8301fe1e405384cd67 |
| `zcna-drukuj/zcna.pdf` | 2 | 0 | 4db07857e593debd73c9ccec755294419d5396dedc357f8afe8c49bdd0d983b6 |
| `zcna-wypelnij/ZCNA_wypelnij_i_wydrukuj.pdf` | 2 | 59 (+XFA) | 08e47e79e13808f33a27d15f78d2e1acc995fb55f48538f3399ce3b9244efc77 |
| `zcna-poradnik/ZUS_ZCNA_poradnik.pdf` (poradnik ZUS, maj 2022) | 13 | – | 344198931070f8dbda5c7bee5b49ba82607f7df4d81552fa178d150285ea10b2 |
| `isap-uswz/eli.pdf` (u.ś.o.z., tekst jednolity Dz.U. 2025 poz. 1461) | 204 | – | – |

Listy pól: `zam-wypelnij-fields.txt`, `zcna-wypelnij-fields.txt`. Kopie stron WWW w HTML i tekście: `web/`.

## NIEZWERYFIKOWANE (zbiorczo)
- Czy niepodpisany PDF wysłany e-mailem do pracodawcy przy progu do 20 skutecznie zachowuje termin 21 dni. Ustawa wymienia tylko papier albo podpisany e-dokument do ZUS.
- Czy w interfejsie eZUS klient indywidualny niebędący płatnikiem ma jakąkolwiek usługę zgłoszenia członka rodziny. W przejrzanych źródłach takiej usługi nie ma.
- Zmiany u.ś.o.z. po tekście jednolitym z 24.10.2025.
- Brak opłat. W źródłach nie ma wzmianki o opłacie, nie badałem ustawy o opłacie skarbowej.
- Wartość „data uzyskania uprawnień” w ZCNA (IV.A pole 02) dla noworodka zgłoszonego w terminie. Wypełnia ją płatnik; źródło nie precyzuje.
