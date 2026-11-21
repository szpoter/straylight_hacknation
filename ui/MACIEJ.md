# Maciej — widoki rodzica po zalogowaniu

**UI spec do rozwijania.** Punktem wejścia jest wynik symulacji od Nikodema. Wracający rodzic wznawia onboarding lub otwiera swój plan. Ustalenia funkcjonalne zawiera [SPEC-PO-LOGOWANIU.md](../SPEC-PO-LOGOWANIU.md). Pracuj po jednej sekcji według [workflow](WORKFLOW.md) i [design/](../design/README.md).

| Kolejność rozmów | Decyzja wizualna |
| --- | --- |
| 1. Onboarding z Zusikiem | Jedno brakujące pytanie, rozpoznanie zaznaczenia, zmiana kafli na datownik, „Wstecz”, pominięcie opcjonalnej odpowiedzi i wznowienie. |
| 2. Pasek, dziecko i mapa | Aktywny plan zawsze ma nazwę. Ustal otwarcie selektora oraz widoczność „Teraz”, obowiązku i uprawnienia w czterech etapach. Mapa pozioma na komputerze, pionowa na telefonie. |
| 3. Najbliższa sprawa i kalkulator | Kolejno opracuj kartę sprawy z datą oraz porównanie okresów i kwot dwojga rodziców. Pokaż stan brakującej podstawy i rozwinięcie „Skąd ta kwota?”. |
| 4. Dokumenty i wnioski | Połącz wybór celu (np. urlopy, świadczenia) ze stanem sprawy. Osobno omów wiersz dokumentu, przebieg po wysyłce, potwierdzenie i wezwanie do uzupełnienia. |
| 5. Profil rodziny i przykładowa sprawa | Odróżnij źródło danych od ich edycji. Zaprojektuj przejście do testowej sprawy lub testowego PDF i powrót do planu. |
| 6. Przekazanie do agenta | „Dokończ z Zusikiem” otwiera panel Juliana przy właściwym dziecku, dokumencie i polu. Uzgodnij miejsce w widoku dzielonym oraz powrót do tego samego miejsca w formularzu. |

**Pierwsza runda.** Porównaj układ jednego pytania, czytelność pojedynczego wyboru i możliwość poprawienia wcześniejszej odpowiedzi. Proponowany punkt startowy to jedno pytanie Zusika nad grupą kafli i stałe miejsce akcji „Dalej”, także wtedy, gdy kafle zastępuje kalendarz. [GOV.UK — strona pytania](https://design-system.service.gov.uk/patterns/question-pages/) · [Przykłady wyboru jednej odpowiedzi](https://design-system.service.gov.uk/components/radios/) · [Podgląd odpowiedzi z korektą](https://design-system.service.gov.uk/patterns/check-answers/)

**Prompt na start rozmowy**

> Projektuję jako Maciej aplikację po zalogowaniu. Przeczytaj ui/MACIEJ.md, ui/WORKFLOW.md, DESIGN.md, SPEC-PO-LOGOWANIU.md i inspiracjeelementowistron.md. Zacznij od pierwszego brakującego pytania po pobraniu danych. Omów ze mną cel, znajdź kilka konkretnych przykładów, daj linki i poleć wariant dla rodzica na telefonie. Poczekaj na wybór. Po akceptacji zapisz układ, kontrolki, przejścia i scenę odbioru w tym UI specu. Potem omówimy następny element i złożymy zaakceptowane sceny w Claude Design.

## Uzgodnione decyzje UI

Wpisy z 21.11.2026, uzgodnione przez Macieja. Wygląd (kolory, kroje, krawędzie, stany) bierzemy z [`design/`](../design/README.md); tu jest układ, kolejność i zachowanie. Progi szerokości: telefon < 768 px, tablet 768–1079 px, desktop ≥ 1080 px ([layout.md](../design/layout.md)). Referencje pokazują wzorzec układu, nie markę: nie przenosimy logo, ilustracji ani tekstów. Ruch oznaczamy slotem `TODO(motion)` według [motion.md](../design/motion.md#5-animacje-dostarczane-przez-zespół). Treść i reguły są w [SPEC-PO-LOGOWANIU.md](../SPEC-PO-LOGOWANIU.md).

**Wspólny przykład do makiet:** dzień demo 21 listopada 2026, dziecko „Ola” urodzone 10 listopada 2026, etap „Narodziny”, najbliższa sprawa „Zgłoś urodzenie Oli · Urząd stanu cywilnego · do 1 grudnia 2026”. Kalkulator: przykład 140 zł i 105 zł dziennie ze specyfikacji. Wyłącznie dane fikcyjne.

### 1. Onboarding z Zusikiem

| Pole | Ustalenie |
| --- | --- |
| Element, właściciel, data, status | Onboarding z Zusikiem · Maciej · 21.11.2026 · Uzgodnione |
| Cel | Rodzic odpowiada tylko na brakujące pytania i w około minutę ma plan. Może też od razu obejrzeć plan przykładowy. |
| Kolejność ekranów | Ekran startowy → „Dla kogo układamy plan?” → rola → data (przy adopcji i pieczy także data urodzenia dziecka) → liczba dzieci (warunkowo) → nazwa planu (opcjonalnie) → zmiana pracy (opcjonalnie, „Pomiń”) → ekran końcowy → „Pokaż mój plan”. Pytania, na które profil zna odpowiedź, pomijamy. |
| Ekran startowy | Zusik z dymkiem „Pomogę Ci ułożyć plan. 4 krótkie pytania · ok. 1 minuty”. Akcja główna „Zaczynamy”. Zwinięte „Sprawdź dane startowe”. Linki „Najpierw rozejrzę się bez dopasowania” (→ „Mój plan” z planem przykładowym) i „Potrzebuję wsparcia w trudnej sytuacji” (→ „Wsparcie”). |
| Ekran pytania, od góry | 1) „Wstecz” i cienki pasek postępu bez liczb; 2) mały Zusik i dymek z pytaniem w jednym rzędzie, pod pytaniem link „Dlaczego pytamy?”; 3) odpowiedzi; 4) linki pomocnicze; 5) „Dalej”. |
| Desktop i tablet | Kolumna treści około 640 px na środku (najbliższy token kontenera, do weryfikacji). [Karty wyboru](../design/komponenty.md#3-karta-wyboru) w siatce po 2–3 w rzędzie. „Dalej” pod odpowiedziami, przy prawej krawędzi kolumny. |
| Telefon | Jedna kolumna, karty wyboru jedna pod drugą na całą szerokość. „Dalej” przyklejony do dołu ekranu, nad klawiaturą ekranową. Zusik mały, żeby 5 kart mieściło się bez przewijania. |
| Wybór | Cała karta klikalna. Zaznaczenie to ptaszek, obramowanie i tło wyboru, nie sam kolor. „Dalej” jest nieaktywne, dopóki nic nie wybrano. Przy pytaniu opcjonalnym widać „Pomiń”. |
| Krok z datą | Karty zastępują trzy [pola](../design/komponenty.md#4-pole-formularza) „Dzień”, „Miesiąc”, „Rok” z klawiaturą numeryczną i widoczną etykietą. Pod „Dalej” link „Uzupełnię później”, zawsze w tym samym miejscu. Błąd (np. 31.02) pojawia się przy polu. |
| Nazwa planu | Pole z dopiskiem „Możesz to zmienić później”. Po zapisie dymek „Plan dla Oli gotowy”. |
| Ekran końcowy | Rozwinięte „Sprawdź dane startowe”: wiersze etykieta → wartość → źródło („ZUS · symulacja”, „Podane przez Ciebie”). „Zmień” przy wartościach rodzica, kłódka przy urzędowych. Licznik ostrzeżeń. Akcja główna „Pokaż mój plan”. |
| Zachowanie | „Wstecz” zachowuje odpowiedź. Zmiana wcześniejszej odpowiedzi pomija pytania, które straciły sens. „Zmień” wraca do pytania, a po „Dalej” z powrotem do podsumowania. Przerwany onboarding wznawia się od ostatniego pytania. Zmiana dymków: slot `TODO(motion)` „Dymki i kolejne pytania”. |
| Dostępność | Karty wyboru to grupa radio (strzałki, spacja). Po zmianie ekranu fokus trafia na pytanie. Kłódka ma etykietę dla czytnika „Dane z ZUS, nie do edycji”. |
| Referencje | Duolingo, Zusik z dymkiem nad kartami, pasek postępu, „Dalej” na dole, ekran z liczbą pytań: [ScreensDesign](https://screensdesign.com/explore/apps/duolingo/onboarding/). Finch, zaznaczona karta i nieaktywne „Dalej”, dopisek „zmienisz później”: [Lazyweb](https://lazyweb.com/canvas/flows/finch/onboarding). Huckleberry, data w trzech polach z podpowiedzią: [Lazyweb](https://lazyweb.com/canvas/flows/huckleberry/onboarding). Wonder Weeks, link tekstowy pod akcją główną: [ScreensDesign](https://screensdesign.com/showcase/the-wonder-weeks-baby-leaps). Pregnancy+, lista „About you” jako podsumowanie danych: [ScreensDesign](https://screensdesign.com/explore/apps/pregnancy-plus/onboarding/). suomi.fi, „Skip questions” pokazuje całą treść: [suomi.fi](https://www.suomi.fi/guides/having-a-child). GOV.UK, strona pytania i pole daty: [Question pages](https://design-system.service.gov.uk/patterns/question-pages/) · [Date input](https://design-system.service.gov.uk/components/date-input/). |
| Odbiór | Na telefonie: „Spodziewamy się dziecka” → termin → „Wstecz” → zmiana na „Dziecko jest już z nami” (pytanie o termin zamienia się w datę urodzenia) → „Pokaż mój plan”. Efekt: plan na etapie „Narodziny”, dane startowe z właściwymi źródłami. Następna scena: „Mój plan”. |

### 2. Pasek i selektor dziecka

| Pole | Ustalenie |
| --- | --- |
| Element, właściciel, data, status | Pasek i selektor dziecka · Maciej · 21.11.2026 · Uzgodnione |
| Desktop i tablet | Od lewej: logo, selektor dziecka (nazwa planu i pod nią data kluczowa, np. „Ola ▾ / Urodzona 10 listopada”), dalej karty „Mój plan · Dokumenty i wnioski · Profil rodziny”. Przy „Dokumentach” licznik spraw „Do załatwienia”. Pasek przyklejony u góry. |
| Telefon | U góry selektor dziecka z datą kluczową. Trzy karty jako dolny pasek nawigacji z ikoną i etykietą. Bąbelek Zusika nad dolnym paskiem (na „Moim planie” ukryty, patrz element 8). |
| Lista selektora | Pozycje z rodzajem planu: „Ola · 2 miesiące · rejestr” z kłódką, „Oczekiwane dziecko · maj · planowane”, „Sprawa testowa · Alicja T.” z [etykietą](../design/komponenty.md#113-etykieta-np-przykład) „Test”, „Przykład · rodzina Kowalskich” z etykietą „Przykład”. Na dole „+ Dodaj dziecko lub plan” i „+ Wczytaj przykładową sprawę”. |
| Zachowanie | Zmiana dziecka przełącza ścieżkę, najbliższą sprawę, kalkulator, dokumenty i kontekst czatu. Nie oznacza spraw jako wykonanych. |
| Referencje | shadcn sidebar-07, blok przełącznika: pogrubiona nazwa, pod nią szary drugi wiersz, chevron. Przenosimy go poziomo do paska: [shadcn](https://ui.shadcn.com/view/new-york-v4/sidebar-07). Primer UnderlineNav, zakładki z licznikiem: [Primer](https://primer.style/product/components/underline-nav/). Material 3 Navigation bar, dolny pasek z ikoną, etykietą i aktywną pozycją: [M3](https://m3.material.io/components/navigation-bar/overview). eesti.ee, data kluczowa nad osią przelicza plan: [eesti.ee](https://www.eesti.ee/en/syndmusteenused/having-a-baby). |
| Odbiór | Zmiana z „Ola” na „Oczekiwane dziecko”: zmieniają się ścieżka i najbliższa sprawa, a licznik Dokumentów się przelicza. |

### 3. Ścieżka planu z Zusikiem jako pionkiem

| Pole | Ustalenie |
| --- | --- |
| Element, właściciel, data, status | Ścieżka i pionek · Maciej · 21.11.2026 · Uzgodnione |
| Cel | Rodzic od razu widzi, gdzie jest, co ma już za sobą i co dalej. |
| Desktop | Pozioma ścieżka z łagodnymi zakrętami (wąż) z okrągłymi węzłami. Nad linią nazwy etapów „Przed narodzinami · Ciąża · Narodziny · Po narodzinach”, a w „Ciąży” podpisy trymestrów. Przewijanie w poziomie gestem albo przyciskami „Poprzedni etap” / „Następny etap” pod ścieżką. Przy wejściu ścieżka ustawia się na polu pionka. |
| Telefon | Pionowa, wijąca się w dół ścieżka węzłów, jak w Duolingo. Przyklejony baner etapu u góry, np. „Etap 3 · Narodziny · 2 sprawy do zrobienia”, z przyciskiem „Lista” (spokojny widok listy). Baner zmienia się przy wejściu w kolejny etap. Pływający przycisk „↑ Teraz” pojawia się, gdy pionek zniknie z ekranu. |
| Węzeł (przystanek) | Okrągła ikona typu: obowiązek, na wniosek, informacja, program zdrowotny, „Dzieje się samo”. Obok węzła, zawsze widoczne: nazwa, skrót statusu (Przed Tobą / Do zrobienia / W trakcie / Wysłane / Wymaga uwagi / Załatwione) i termin. Napis stoi po stronie przeciwnej do zakrętu. Stany węzła: załatwiony (ptaszek), pionek, następny (podświetlony), przyszły (obrys, bez blokady), odhaczony informacyjny (ptaszek, wyciszony), ostrzeżenie (oznaczenie ryzyka). |
| Sprawy równoległe | Dwa węzły w jednym rzędzie z „i” między nimi. Pionek idzie dalej, gdy obie sprawy są załatwione. |
| Pionek (Zusik) | Stoi na ostatnim polu, przed którym wszystko jest załatwione, odhaczone albo oznaczone „Nie korzystam”. Sprawa zrobiona poza kolejnością dostaje ptaszek, ale pionek nie przeskakuje niezałatwionego obowiązku. Przed pierwszym polem stoi na polu startowym etapu. Przy pionku dymek z jedną wskazówką: „Następny krok: Zgłoś urodzenie Oli · do 1 grudnia”. Kliknięcie pionka otwiera czat z kontekstem przystanku. Przejście na następne pole: slot `TODO(motion)` „Pionek przechodzi na następne pole”. Przy ograniczonym ruchu pionek po prostu pojawia się na nowym polu. |
| Kliknięcie węzła | Od razu karta szczegółów: na desktopie [panel](../design/komponenty.md#111-panel-karta-z-treścią-np-podgląd-planu) pod ścieżką, na telefonie panel wysuwany od dołu. Treść karty: dla kogo, dlaczego, do kiedy i od czego liczymy, „Przygotuj”, „Jak złożyć” (Co / Do kogo / Do kiedy / Załączniki), źródło i jedno działanie. |
| Bez grywalizacji | Bez punktów, gwiazdek i serii. Przyszłe etapy można oglądać. |
| Dostępność | Ścieżka ma też postać listy dla czytnika i klawiatury (kolejność przystanków). Przycisk „Lista” przełącza na ten sam widok wizualnie. |
| Referencje | Duolingo: węzły na falującej linii, baner sekcji z przyciskiem, postać obok ścieżki, dymek „START” przy następnym polu, pływająca strzałka powrotu (opisana w tekście): [blog Duolingo](https://blog.duolingo.com/new-duolingo-home-screen-design/). Wąż poziomy z łukami i datami przy zakrętach: [amCharts](https://www.amcharts.com/demos/horizontal-serpentine-timeline/). Napis zawsze obok przystanku (tytuł, status Done/Now, czas): [shadcn.io road trip path](https://www.shadcn.io/blocks/features-road-trip-milestone-path). Spójnik „and” między krokami równoległymi: [GOV.UK](https://www.gov.uk/learn-to-drive-a-car). Ikona typu przy kroku, trymestry, „Pre-pregnancy health check”: [eesti.ee](https://www.eesti.ee/en/syndmusteenused/having-a-baby). Panel od dołu: [M3 Bottom sheets](https://m3.material.io/components/bottom-sheets/overview). „↑ Teraz”: brak publicznego zrzutu; okrągły pływający przycisk ze strzałką w prawym dolnym rogu, nad dolnym paskiem. |
| Odbiór | Odhaczenie „Informacja” przed pionkiem przesuwa pionek o pole. Odhaczenie sprawy za niezałatwionym obowiązkiem daje ptaszek, a pionek zostaje. Na telefonie przewiń w dół: baner zmienia etap, pojawia się „↑ Teraz”, a dotknięcie wraca do pionka. |

### 4. Najbliższa sprawa

| Pole | Ustalenie |
| --- | --- |
| Element, właściciel, data, status | Najbliższa sprawa · Maciej · 21.11.2026 · Uzgodnione |
| Układ | Panel pod ścieżką. Kolejność: tytuł z terminem („Zgłoś urodzenie Oli · do 1 grudnia 2026”, pod spodem „zostało 10 dni”), instytucja, jedno zdanie „dlaczego”, rozwijane „Przygotuj” (lista dokumentów), stały blok „Jak złożyć” (Co / Do kogo / Do kiedy / Załączniki), jedna akcja główna. Na desktopie i telefonie ta sama kolejność, na telefonie w pełnej szerokości. |
| Stany | Domyślnie sprawa według obowiązku i terminu. Po kliknięciu innego przystanku karta przyjmuje jego treść i pokazuje „Wróć do najbliższej sprawy”. Pilne wezwanie zajmuje to miejsce w pierwszej kolejności. Brak danych: konkretne pytanie zamiast terminu. Wszystko załatwione: „Na dziś masz wszystko załatwione” i najbliższa możliwość opcjonalna. „Dzieje się samo”: „Nic nie musisz robić” i kto to zrobi. |
| Referencje | LifeSG, termin w tytule zadania i sprawy „dzieją się automatycznie” (strona SPA, obejrzeć ręcznie): [LifeSG](https://www.life.gov.sg/pages/KwRyMMRl/when-your-baby-is-born). GOV.UK, lista „What you'll need” przed startem: [Start using a service](https://design-system.service.gov.uk/patterns/start-using-a-service/). myGov, zadania z terminem liczonym od porodu: [myGov](https://my.gov.au/en/services/raising-kids/having-a-baby/before-your-baby-arrives). |

### 5. Kalkulator „Ile czasu i jaki zasiłek?”

| Pole | Ustalenie |
| --- | --- |
| Element, właściciel, data, status | Kalkulator · Maciej · 21.11.2026 · Uzgodnione |
| Desktop, od góry | 1) Karta puli z trzema stanami nagłówka: „Zostało 12 tyg. do zaplanowania”, „Wszystkie tygodnie w planie”, „2 tyg. za dużo”. Rozwinięcie pokazuje część zarezerwowaną dla każdej osoby i wspólną. 2) Zwinięty pasek „Założenia: 1 dziecko · bez „Za życiem” · bez hospitalizacji · zmień”. 3) Przełącznik „Sposób wypłaty: 81,5% przez cały okres / 100%, potem 70%”. 4) Dwie osie rodziców na wspólnej skali miesięcy, z odcinkami podpisanymi tekstem (rodzaj, daty, kwota); ojcowski na osobnym torze. 5) „Zmień wariant”, „Porównaj wariant”, rozwijane „Skąd ta kwota?”. Jedna akcja główna: „Użyj tego wariantu w planie”. |
| Telefon | Podsumowanie (czas opieki, kwota łącznie brutto) → uproszczony pasek jednej osi → karty odcinków („Ty · rodzicielski · 2.03–30.03 · 4 tyg. · 3 920 zł”) → karta puli → założenia. Przy porównaniu przełącznik „Wariant A / Wariant B” pod podsumowaniem różnicy. |
| Porównanie | Na górze wynik jako różnica: „Wariant B: ta sama kwota · razem w domu 4 tygodnie”. Pod nim dwie kolumny na wspólnej skali (desktop) albo przełącznik A/B (telefon). |
| Stany | Brak podstawy drugiego rodzica: odcinek z „Uzupełnij podstawę” zamiast kwoty. Błąd walidacji: komunikat przy konkretnym odcinku, a nagłówek puli w stanie „za dużo” prowadzi do tego odcinka. Praca na część etatu: odcinek wydłużony z podpisem „+4 tyg. dzięki pracy na ½ etatu”. 14 tygodni matki po porodzie zablokowane z wyjaśnieniem. |
| Referencje | NAV, trzy stany karty puli: [Storybook: zostało](https://navikt.github.io/foreldrepengesoknad/@navikt/fp-uttaksplan/iframe.html?id=kvoteoppsummering--begge-rett-mor-ledige-dager); kod MIT: [navikt/foreldrepengesoknad](https://github.com/navikt/foreldrepengesoknad). NAV, lista okresów jako karty na telefonie: [Storybook](https://navikt.github.io/foreldrepengesoknad/@navikt/fp-uttaksplan/iframe.html?id=liste-uttaksplanliste--default). Wspólna oś miesięcy ze znacznikiem „dziś”: [Kibo UI Gantt](https://www.kibo-ui.com/components/gantt) (podgląd bez danych; dwa tory opisujemy słowami). Porównanie jako różnica względem wariantu bazowego: [Kela](https://perhevapaavertailu.kela.fi/) (analogia koncepcyjna). Blokada tygodni obowiązkowych: [GOV.UK SPL planner](https://www.plan-shared-parental-leave.service.gov.uk). Brak dobrej publicznej referencji dla dwóch torów rodziców i dla nagłówka różnicy, więc opisujemy je wyłącznie tym wpisem. |

### 6. Dokumenty i wnioski

| Pole | Ustalenie |
| --- | --- |
| Element, właściciel, data, status | Dokumenty i wnioski · Maciej · 21.11.2026 · Uzgodnione |
| Lista, desktop | U góry, nad filtrami, pasek pilnego wezwania (jeśli jest): „Nowe pismo z ZUS · termin do 5 grudnia · Otwórz wezwanie”. Pod nim [zakładki](../design/komponenty.md#112-zakładki) „Sprawy / Pliki dziecka”, filtry statusu z licznikami „Do załatwienia 3 · Wysłane 2 · Na później 5 · Zakończone 1”, a niżej sekcje celu jako nagłówki (Urlopy; Świadczenia i zasiłki; Rejestracja i ubezpieczenie; Zdrowie i opieka). Wiersz: tytuł językiem rodzica, status tekstem, odbiorca, termin lub ostatnie zdarzenie, jedno działanie. Akcje w wierszach są drugorzędne, żeby w oknie był najwyżej jeden przycisk główny. |
| Telefon | Ten sam porządek. Wiersz jako karta (tytuł → status → odbiorca → termin → działanie). Filtry przewijane w poziomie wewnątrz paska, bez przewijania całej strony. |
| Szczegóły sprawy | Osobny ekran z „← Wróć do listy”. U góry dziecko, nazwa sprawy, odbiorca i oznaczenie symulacji. Pod spodem karta „Czy mam teraz coś zrobić?” z jedną akcją. Przebieg: desktop to poziomy pasek etapów (Wysłano → Potwierdzenie wpływu → Przebieg sprawy → Wynik), telefon to pionowa lista. Bieżący etap „Teraz” jest rozwinięty, wezwanie i odpowiedź to wpisy pod etapem 3. |
| Puste stany | „Na dziś masz wszystko załatwione”; przy planowaniu „Na teraz nic nie musisz składać”, a „Na później” pokazuje warunki. |
| Referencje | GOV.UK, wiersze z tagiem statusu i nagłówki sekcji: [Complete multiple tasks](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/). Primer, zakładki lub filtry z licznikami: [UnderlineNav](https://primer.style/product/components/underline-nav/). GOV.UK, link powrotu nad tytułem: [Back link](https://design-system.service.gov.uk/components/back-link/). MOJ, oś zdarzeń z tytułem, datą i opisem (na telefonie): [Timeline](https://design-patterns.service.justice.gov.uk/components/timeline/). GOV.UK, pilny baner: [Notification banner](https://design-system.service.gov.uk/components/notification-banner/). |

### 7. Profil rodziny i sprawa testowa

| Pole | Ustalenie |
| --- | --- |
| Element, właściciel, data, status | Profil rodziny i sprawa testowa · Maciej · 21.11.2026 · Uzgodnione |
| Profil | Sekcje jedna pod drugą na każdej szerokości: „Moje dane”, „Dzieci i plany”, „Moje konto w ZUS (symulacja eZUS)”, „Przetestuj przykładową sprawę”. Wiersze etykieta → wartość → źródło, z „Zmień” albo kłódką. „Dzieci i plany” to karty planów z etykietą rodzaju i „Edytuj plan”, a na końcu karta „+ Dodaj dziecko lub plan”. „Konto w ZUS” ma „Odśwież dane” i „Zapytaj ZUS”, wyraźnie inne niż czat Zusika (bez postaci, jako formularz wiadomości). |
| Sprawa testowa | Trzy kroki z klikalnym paskiem kroków i „← Wstecz”: ① „Wgraj PDF” (tylko upload, stan „Wczytujemy dokumenty…”), ② „Sprawdź dane” (pola z etykietą AI, źródłem „Z-3, s. 4” i „Zmień”; brakujące pole z „Uzupełnij”), ③ „Wynik” (na górze „Zgodne z decyzją ZUS” albo różnica; pod tym ubezpieczenie → prawo → okres i kwota; akcje „Otwórz jako plan” i „Wczytaj inną sprawę”). Powrót do kroku zachowuje poprawki, a podmiana pliku wymaga potwierdzenia. Na telefonie kroki to osobne ekrany z „Dalej” na dole. |
| Referencje | GOV.UK Summary list, wiersz etykieta, wartość, „Zmień”: [Summary list](https://design-system.service.gov.uk/components/summary-list/). Pregnancy+, zwarta lista danych osoby: . Kroki z powrotem: [GOV.UK Question pages](https://design-system.service.gov.uk/patterns/question-pages/). Źródło danych przy wartości (plakietka i kłódka) nie ma publicznego wzorca w przejrzanych portalach; projektujemy je według tego wpisu. |

### 8. Wejście do Zusika i powrót

| Pole | Ustalenie |
| --- | --- |
| Element, właściciel, data, status | Wejście do Zusika · Maciej · 21.11.2026 · Uzgodnione (wnętrze panelu: [ui/JULIAN.md](JULIAN.md)) |
| Gdzie | „Dokończ z Zusikiem” w wierszu Dokumentów, w karcie przystanku i w Najbliższej sprawie, przy sprawach ze szkicem. Na „Moim planie” bąbelek czatu jest ukryty, a czat otwiera kliknięcie pionka na ścieżce z kontekstem bieżącego przystanku. Na pozostałych kartach jest zwykły bąbelek w prawym dolnym rogu, na telefonie nad dolnym paskiem. |
| Widok dzielony | Desktop: formularz z pierwszym brakującym polem po lewej, panel Juliana po prawej. Telefon: edytowane pole u góry, rozmowa niżej. |
| Powrót | Zamknięcie wraca do miejsca wejścia (ten sam przystanek, ta sama pozycja listy). Zmienione pole jest krótko wyróżnione (slot `TODO(motion)`). Jeśli sprawa zmieniła status, pionek przesuwa się według reguły z elementu 3. |
| Referencje | Wzorce panelu i wiadomości są w [ui/JULIAN.md](JULIAN.md). Pływający przycisk nad dolnym paskiem: [M3 FAB](https://m3.material.io/components/floating-action-button/overview). |
