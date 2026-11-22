# Urlopy pracownicze w Dokumentach

Stan na 22 listopada 2026 r. Poniższe sprawy dotyczą urlopu udzielanego przez pracodawcę. Wypłata zasiłku macierzyńskiego ma odrębną ścieżkę.

| Sprawa | Co przygotowuje aplikacja | Kiedy przekazać |
| --- | --- | --- |
| Macierzyński przed porodem | Pismo ze wskazaniem pierwszego dnia urlopu i przewidywanej daty porodu. Załącznikiem jest kopia zaświadczenia lekarskiego o przewidywanej dacie porodu. | Przed rozpoczęciem urlopu. Pierwszy dzień może przypadać w ciągu 6 tygodni poprzedzających przewidywany poród. |
| Podstawowy macierzyński po porodzie | Informacja na ścieżce. Jeśli pracownica nie rozpoczęła urlopu wcześniej, pierwszym dniem jest dzień porodu. Jeżeli wykorzystała część wcześniej, po porodzie korzysta z pozostałej części. | Urlop rozpoczyna się z mocy prawa. Nie składa się wniosku o jego udzielenie. |
| Ojcowski | Pismo za jeden okres. Aplikacja oblicza ostatni dzień 7 lub 14 dni urlopu, uwzględnia wykorzystaną część i umieszcza oświadczenie ojca w piśmie. Dołącza się odpis skrócony aktu urodzenia lub odpowiednik zagraniczny, ewentualnie kopię. Po przysposobieniu dołącza się też kopię prawomocnego postanowienia sądu. | Co najmniej 7 dni przed rozpoczęciem. Po urodzeniu dziecka cały urlop musi się zakończyć przed pierwszymi urodzinami. Po przysposobieniu obowiązuje 12 miesięcy od uprawomocnienia postanowienia i granica 14. urodzin dziecka. |
| Rodzicielski | Pismo za wybrany okres od–do. Zawiera dotychczasowe okresy i liczbę wykorzystanych części lub wniosków o zasiłek oraz oświadczenie o równoczesnym korzystaniu przez drugiego rodzica. Rodzic wskazuje dokument urodzenia albo dokumenty przyjęcia na wychowanie i ewentualne zaświadczenie „Za życiem”. | Co najmniej 21 dni wcześniej. Przy urodzeniu dziecka urlop można wykorzystać do końca roku jego szóstych urodzin. |
| Łączenie rodzicielskiego z pracą | Osobna sprawa z własnym pismem, okresem pracy u pracodawcy udzielającego urlopu, wymiarem etatu i oświadczeniem o pracy w czasie wydłużenia. Rodzic może podać inny wymiar pracy na wydłużeniu. Rozporządzenie nie wymaga załącznika do tego wniosku. | Co najmniej 21 dni przed rozpoczęciem pracy. W obu okresach wymiar pracy może wynosić najwyżej połowę pełnego etatu. |

Rozporządzenie określa treść pism. Nie ustanawia jednolitego blankietu urzędowego ani symbolu druku dla tych wniosków. PDF zawiera miejscowość i datę sporządzenia, pracownika, pracodawcę, tytuł, treść żądania, oświadczenia, informację o załącznikach i miejsce na podpis. Dokumenty z akt osobowych pracownika można pominąć. Przy zagranicznym dokumencie urodzenia § 21 reguluje tłumaczenie i zwolnienia. Rodzic dostarcza wymagane załączniki razem z pismem. [Rozporządzenie MRPiPS z 11 marca 2025 r., §§ 2, 15–17, 21–23](https://eli.gov.pl/api/acts/DU/2025/322/text.pdf)

### Limity rodzicielskiego

Przy urodzeniu jednego dziecka pula wynosi 41 tygodni, przy porodzie mnogim 43. Zaświadczenie „Za życiem” zwiększa te wymiary do 65 lub 67 tygodni. Dla każdego rodzica 9 tygodni jest nieprzenoszalnych. Rodzice dzielą między siebie do 5 części. Przy jednoczesnym korzystaniu każdy wykorzystuje swoją część wspólnej puli. Formularz uwzględnia również odrębny wymiar 38 lub 62 tygodni związany z dziewięciotygodniowym urlopem na warunkach macierzyńskiego przy przyjęciu na wychowanie. [Kodeks pracy, art. 180, 182¹a–182¹f, 182³ i 183](https://eli.gov.pl/eli/DU/2026/1245/ogl) · [MRPiPS o urlopie rodzicielskim](https://www.gov.pl/web/rodzina/urlop-rodzicielski) · [MRPiPS o przyjęciu dziecka na wychowanie](https://www.gov.pl/web/rodzina/urlop-adopcyjny)

### Przekazanie i koszt

Pracownik przekazuje pismo pracodawcy na papierze lub elektronicznie, np. wysyłając je na uzgodniony adres kadr. Złożenie wniosku urlopowego jest bezpłatne. W aplikacji oba kanały udostępniają PDF. Przekazanie i dostarczenie załączników wykonuje użytkownik. [MRPiPS o urlopie macierzyńskim](https://www.gov.pl/web/rodzina/urlop-macierzynski) · [MRPiPS o urlopie ojcowskim](https://www.gov.pl/web/rodzina/urlop-ojcowski) · [MRPiPS o urlopie rodzicielskim](https://www.gov.pl/web/rodzina/urlop-rodzicielski)

### Zapisane plany i weryfikacja

Sprawa po porodzie zachowuje identyfikator na ścieżce. Znika z listy dokumentów wraz z przykładową wysyłką. Formularz przed porodem otrzymał odrębny identyfikator, więc wartości dawnego wniosku po porodzie nie trafiają do nowego pisma. Starsze zapisane plany dostają aktualne sprawy urlopowe. Odrębny zapis wartości pól pozostaje dostępny, a wcześniejszy stan przekazania nie przywraca dokumentu do informacji o urlopie.

Testy w `app/tests/forms-leave.test.ts` sprawdzają oba końce okresów, minimalne wyprzedzenie, limity części i obu rodziców, pracę w czasie wydłużenia oraz treść faktycznie wygenerowanych PDF-ów. Testy planu i osi czasu sprawdzają widoczność dokumentów i aktualizację zapisanych planów z zachowaniem istniejącego szkicu.
