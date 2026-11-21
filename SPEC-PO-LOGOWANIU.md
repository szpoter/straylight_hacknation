# Przewodnik Rodzica po zalogowaniu

Ten plik rozwijamy dla części produktu po uwierzytelnieniu. Punktem wejścia jest koniec symulowanego pobierania danych z ZUS opisanego w [specyfikacji strony publicznej](SPEC.md). Aktualny kierunek pierwszego wejścia to onboarding, a następnie pełny widok produktu.

**Uzgodniony kierunek.** Zusik pomaga odpowiedzieć wyłącznie na brakujące pytania. Po onboardingu rodzic widzi pływający górny pasek z wyborem dziecka i mapę jego spraw w czterech etapach. Na komputerze mapa przewija się poziomo, na telefonie pionowo. Osobna karta paska to „Dokumenty i wnioski”. Propozycja całego paska to „Mój plan”, „Dokumenty i wnioski” oraz „Profil rodziny”, z dotychczasowym selektorem dziecka. Pod mapą są kolejno „Najbliższa sprawa” i kalkulator. Szczegóły interakcji oraz dalsze moduły to propozycje do omówienia.

## Pierwsze wejście — krótka rozmowa z Zusikiem

Jedno pytanie na ekranie. Zusik wita rodzica dymkiem „Pomogę Ci ułożyć plan. Zacznijmy od tego, na jakim jesteś etapie”. Znane informacje są dostępne pod „Sprawdź dane startowe”, z oznaczeniem źródła: „Profil demonstracyjny”, „ZUS · symulacja” albo „Podane przez Ciebie”. Ubezpieczenie chorobowe rodzica, zgłoszenie dziecka do ubezpieczenia zdrowotnego i stan rodzinnych formalności to trzy odrębne informacje. Brak wpisu oznacza „Brak danych”. Rodzic może poprawić dane w swoim wariancie demo.

| Kiedy pytamy | Pytanie i sposób odpowiedzi | Wpływ na plan |
| --- | --- | --- |
| Brakuje kontekstu rodziny | **„Dla kogo układamy plan?”** Duże kafle: „Planuję rodzicielstwo”, „Spodziewamy się dziecka”, „Dziecko jest już z nami”, „Adopcja”, „Rodzina zastępcza”. Dyskretny link „Potrzebuję wsparcia w trudnej sytuacji”. Jeśli profil zawiera dzieci, rodzic może od razu wskazać jedno z listy. | Wybiera punkt startowy i język pytań. W planowaniu wystarcza profil „Mój plan”. |
| Rola wpływa na dostępne sprawy i nie wynika z danych | **„Z czyjej perspektywy chcesz zobaczyć plan?”** Przyciski dopasowane do sytuacji, np. „Jestem w ciąży” lub „Jestem drugim rodzicem”. | Dobiera sprawy rodzica i opiekuna. Zgadywanie roli na podstawie imienia lub płci prowadziłoby do błędnej listy. |
| Brakuje daty potrzebnej do umiejscowienia spraw | W ciąży **„Na kiedy planowany jest poród?”**, po narodzinach **„Kiedy urodziło się dziecko?”**, przy adopcji lub pieczy **„Kiedy dziecko trafiło pod Twoją opiekę?”**. Selektor daty i odpowiedź „Uzupełnię później”. Przy samym planowaniu pomijamy datę. | Przy braku daty pokazujemy etapy i zasadę liczenia terminu. Dokładną datę pokażemy po poznaniu zdarzenia, od którego zależy dana sprawa. |
| Trzeba odróżnić dzieci | **„Jak podpisać ten plan?”** Opcjonalne imię lub własna nazwa. Przy wskazaniu ciąży mnogiej albo kilkorga dzieci z jednego porodu dodajemy wybór liczby dzieci. | Plan można otworzyć jako „Moje dziecko” bez imienia i PESEL-u. Dzieci z jednego porodu mają osobne sprawy osobiste i wspólny kontekst porodu. |

Końcowy przycisk **„Pokaż mój plan”** otwiera mapę na aktualnym etapie. Zusik przechodzi do następnego dymka po zatwierdzeniu odpowiedzi. Po zmianie rodzaju pytania miejsce kafli zajmuje np. kalendarz. „Wstecz” zachowuje odpowiedź, a zmiana wcześniejszego wyboru pomija pytania, które przestały mieć sens. Przy ograniczeniu ruchu dymki i kontrolki zmieniają się bez animacji. Wszystkie wybory mają etykiety dla czytnika ekranu i działają z klawiatury. Powracający rodzic trafia do ostatniego planu, przerwaną rozmowę może wznowić.

Pytania o dochód, dokładne daty urlopu, dokument sądowy, hospitalizację lub zaświadczenie „Za życiem” zadajemy w konkretnej sprawie. Jeśli dane profilu są niepełne, brak istotnego pola blokuje wyłącznie wynik, który go wymaga. Testowy PDF i wybór gotowej sprawy są dostępne w demo po logowaniu jako osobny sposób zasilenia przykładu.

## Ekran główny i wybór dziecka

U góry pływający pasek. W nim widoczna nazwa aktywnego planu, np. **„Ola ▾”**. Po otwarciu listy widać imiona lub nazwy planów oraz krótkie rozróżnienie, np. „Ola · 2 miesiące”, „Oczekiwane dziecko · maj” i „Dodaj dziecko lub plan”. Na zmianę dziecka reagują równocześnie mapa, najbliższy krok, wyliczenia, dokumenty i kontekst rozmowy. Zmiana nie oznacza spraw jako wykonanych. Przy pierwszym wejściu po terminie porodu rodzic potwierdza narodziny, zanim zmienimy etap. Przy planowaniu i ciąży aplikacja działa już przed nadaniem dziecku imienia.

**Karta dziecka** pod nazwą planu pokazuje etap, wiek lub przewidywany termin oraz najbliższą sprawę. „Dane dziecka” otwiera szczegóły. Zakres danych zależy od otwartej sprawy:

| Zawsze dostępne w planie | Uzupełniane w odpowiednim momencie |
| --- | --- |
| Nazwa planu, rola opiekuna, etap, znana data z oznaczeniem „planowana” lub „rzeczywista” | Imię i nazwisko, miejsce urodzenia, identyfikator dziecka oraz dane rodziców potrzebne do danego formularza. W demo wyłącznie dane fikcyjne. [Dokumenty do zasiłku](https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/niezbedne-dokumenty) |
| Stan każdej sprawy, kto go wskazał, powiązany dokument i podstawa terminu | Data karty urodzenia, potwierdzenie rejestracji w USC, zgłoszenie do ubezpieczenia i wybór POZ. Przy adopcji i pieczy zamiast danych porodowych pytamy o daty przyjęcia, właściwego orzeczenia lub wniosku do sądu. [Rejestracja urodzenia](https://www.gov.pl/web/gov/zglos-urodzenie-dziecka) · [Dokumenty ZUS](https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/niezbedne-dokumenty) |
| Dostęp do edycji i informacji o źródle | Tylko dla odpowiedniego wyliczenia: liczba dzieci z jednego porodu lub przyjętych jednocześnie, okresy wykorzystane przez rodziców, wymiar pracy, informacja o zaświadczeniu „Za życiem”. Przy uzupełniającym urlopie mogą mieć znaczenie tydzień ciąży w dniu porodu, masa urodzeniowa i okresy pobytu w szpitalu. [ZUS o uzupełniającym urlopie](https://psz.zus.pl/web/guest/swiadczenia/zasilki/zasilek-macierzynski/prawo-do-zasilku-i-okres-przyslugiwania/za-okres-uzupelniajacego-urlopu-macierzynskiego) |

## Mapa — cztery etapy, jedna najbliższa sprawa

Ścieżka z przystankami jest inspirowana Duolingo. Aktualny przystanek wyróżnia się podpisem **„Teraz”** i obecnością Zusika. Pozostałe etapy można oglądać od razu. Na komputerze przewijamy mapę poziomo gestem lub przyciskami „Poprzedni etap” i „Następny etap”. Na telefonie przystanki biegną pionowo w naturalnym przewijaniu strony. Skrót „Przejdź do najbliższej sprawy” omija długą ścieżkę. Aktywność medyczna ani złożenie wniosku nie daje punktów. W trudnej sytuacji można przejść do spokojnego widoku listy z formalnościami i wsparciem.

Zachowujemy nazwy **„Przed narodzinami → Ciąża → Narodziny → Po narodzinach”**. Proponowane znaczenie pierwszego etapu to przygotowania podczas planowania rodzicielstwa. Drugi zaczyna się, gdy rodzic wybierze ciążę. W adopcji i pieczy pokazujemy właściwe kamienie milowe — przygotowania, postępowanie, przyjęcie dziecka, opiekę — z pominięciem pytań o przebieg ciąży. Przy stracie rodzic sam decyduje o przejściu na ścieżkę wsparcia, która wycisza kolejne przypomnienia rozwojowe. [Bezpłatne wsparcie Fundacji Ernesta](https://fundacjaernesta.pl/jak-pomagamy/)

### Katalog startowy przystanków

Na głównej linii są czynności wymagające działania w danej sytuacji. Obok znajdują się sprawy **„Na wniosek”**, **„Program zdrowotny”** i **„Informacja”**. Obowiązek powstający po decyzji rodzica ma widoczny warunek. Przy każdym przystanku podajemy właściwą instytucję i link do źródła.

| Etap | Co konkretnie pojawia się na mapie |
| --- | --- |
| **Przed narodzinami** | „Sprawdź swoje ubezpieczenie chorobowe” otwiera podsumowanie, tytuł i okres ubezpieczenia. „Planuję zmianę pracy” uruchamia wariant porównawczy z pytaniem o datę zmiany i wpływ na możliwe uprawnienia. To czynności przygotowawcze. [Opis wyzwania, s. 11–13](Materia%C5%82y%20hackathonowe/ZUS%20-%20Pe%C5%82na%20tre%C5%9B%C4%87%20zadania%20konkursowego.pdf) |
| **Ciąża** | „Sprawdź świadczenia w razie choroby” prowadzi do zasiłku chorobowego, warunkowo do świadczenia rehabilitacyjnego lub zasiłku w wysokości zasiłku macierzyńskiego przy określonej utracie zatrudnienia. „Zapytaj o badania prenatalne” otwiera kartę programu NFZ ze skierowaniem, etapem ciąży i odnośnikiem do realizatorów. Program obejmuje badania nieinwazyjne, a pogłębiona diagnostyka genetyczna zależy od wskazań i kwalifikacji lekarskiej. Przy zainteresowaniu becikowym osobno wyjaśniamy warunek dotyczący opieki medycznej matki od odpowiedniego momentu ciąży i wyjątki dla opiekunów. [ZUS o chorobowym](https://www.zus.pl/pl/swiadczenia/zasilki/zasilek-chorobowy/z-ubezpieczenia-chorobowego/prawo-do-zasilku-i-okres-przyslugiwania) · [Program prenatalny NFZ](https://pacjent.gov.pl/program-profilaktyczny/program-badan-prenatalnych) · [Becikowe](https://www.gov.pl/web/gov/uzyskaj-becikowe) |
| **Narodziny** | „Zgłoś urodzenie w Polsce” — obowiązek, USC, w typowej sytuacji żywego urodzenia 21 dni od wystawienia karty urodzenia. „Sprawdź dokumenty z USC” opisuje odpis aktu, nadanie PESEL-u i meldunek, jeśli dotyczą dziecka. Dodatkowy odpis można zamówić w symulacji. „Zgłoś dziecko do ubezpieczenia zdrowotnego” pojawia się, gdy zachodzi obowiązek i nikt jeszcze dziecka nie zgłosił. Pracownik informuje płatnika, osoba samodzielnie zgłaszająca rodzinę korzysta z ZUS ZCNA. „Badania przesiewowe noworodka” to informacja o programie Ministerstwa Zdrowia realizowanym w opiece medycznej. [USC](https://www.gov.pl/web/gov/zglos-urodzenie-dziecka) · [Ubezpieczenie członków rodziny](https://www.zus.pl/pracujacy/ubezpieczenie-zdrowotne-w-polsce/zasady-podlegania-ubezpieczeniu-zdrowotnemu/ubezpieczenie-czlonkow-rodziny) · [Program badań przesiewowych 2019–2026](https://www.gov.pl/web/zdrowie/program-badan-przesiewowych-noworodkow-w-polsce-na-lata-2019-2026) |
| **Po narodzinach — urlopy i wypłaty** | „Zaplanuj urlop i zasiłek” dobiera dokumenty do zatrudnienia, roli i wybranego okresu: macierzyńskiego, uzupełniającego, rodzicielskiego lub ojcowskiego. Dla pracownika oddziela wniosek urlopowy do pracodawcy od dokumentów do wypłaty zasiłku przez właściwego płatnika. W razie hospitalizacji otwiera pytania o zaświadczenie ze szpitala. Przy podziale opieki i powrocie do pracy prowadzi do wspólnego kalkulatora. [Dokumenty ZUS](https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/niezbedne-dokumenty) · [Urlop rodzicielski](https://www.gov.pl/web/rodzina/urlop-rodzicielski) |
| **Po narodzinach — świadczenia na wniosek** | „Sprawdź 800+” — dla noworodka wniosek w ciągu 3 miesięcy od urodzenia pozwala uzyskać wypłatę od urodzenia. „Sprawdź program Aktywny Rodzic” — wariant według wieku i formy opieki. „Sprawdź becikowe” — ocena warunków i odbiorca w gminie. Przy właściwym zaświadczeniu pokazujemy także ścieżkę „Za życiem”. Każda karta określa instytucję, warunki i skutki terminu. [800+](https://www.zus.pl/pl/swiadczenia/swiadczenia-dla-rodzin/swiadczenie-wychowawcze-800-plus) · [Aktywny Rodzic](https://www.zus.pl/pl/aktywnyrodzic) · [Becikowe](https://www.gov.pl/web/gov/uzyskaj-becikowe) · [Za życiem](https://www.gov.pl/web/rodzina/program-za-zyciem) |
| **Po narodzinach — zdrowie** | „Wybierz przychodnię dla dziecka” prowadzi do deklaracji wyboru POZ. „Sprawdź kalendarz szczepień” odsyła do aktualnego programu z oznaczeniami szczepień obowiązkowych i zalecanych. W karcie są instytucja, źródło i kolejny krok do omówienia w POZ. [Deklaracje POZ](https://pacjent.gov.pl/jak-wybrac-lub-zmienic-swiadczeniodawce-poz) · [Kalendarz na 2026 r.](https://pacjent.gov.pl/kalendarz-szczepien-dzieci-i-mlodziezy-na-2026-rok) |

**Co pokazuje pojedynczy przystanek.** Na mapie wystarczą nazwa czynności, status i termin. Kliknięcie otwiera szczegóły sprawy. Na komputerze mapa wskazuje kartę bezpośrednio pod ścieżką, a na telefonie ten sam widok otwiera się od dołu. Karta pokazuje, dla którego dziecka, dlaczego sprawa się pojawia, do kiedy i od jakiego zdarzenia liczymy czas, dokumenty, kto składa i do kogo, źródło oraz jedno działanie. Dla formularza to „Przygotuj szkic”, dla programu NFZ „Sprawdź, gdzie wykonać badanie”, dla wykonanej czynności „Zobacz szczegóły”. Statusy „Do zrobienia”, „Szkic”, „Oznaczone jako załatwione” i „Wysłano w symulacji” mają odrębne znaczenie. Jeśli nie znamy daty bazowej, zamiast odliczania proponujemy „Uzupełnij datę”. Sprawy rodzica i wspólne okresy opieki są powiązane z rodziną lub porodem, więc zmiana profilu bliźniaka nie tworzy dodatkowego urlopu.

## Pod mapą — najbliższa sprawa i kalkulator

1. **Najbliższa sprawa.** Jedna rozwinięta karta wybrana według obowiązku i terminu. Przykład: „Zgłoś urodzenie Oli”, „Urząd stanu cywilnego”, termin wraz z podstawą i przycisk „Zobacz, jak zgłosić”. To domyślnie wybrany przystanek. Po wskazaniu innego kroku karta przyjmuje jego nazwę i treść. Przycisk „Wróć do najbliższej sprawy” przywraca priorytet. Gdy brakuje danych dla pilnej sprawy, tu pojawia się konkretne pytanie. Gdy wszystkie obowiązki są załatwione, karta informuje o tym i wskazuje najbliższą opcjonalną możliwość.
2. **Ile czasu i jaki zasiłek?** Porównanie dwóch wariantów opieki dla tej rodziny na jednej osi: okres każdego rodzica, przewidywana kwota i założenia kalkulatora. Rodzic może symulować opiekę kolejno, równocześnie i pracę na część etatu. Przy braku podstawy wymiaru pokazujemy, jakiej wartości potrzeba. Liczy kalkulator według reguł, a agent wyjaśnia wynik ze źródłem. [ZUS o wysokości zasiłku](https://www.zus.pl/pl/swiadczenia/zasilki/zasilek-macierzynski/wysokosc)

## Kalkulator „Ile czasu i jaki zasiłek?”

**Uzgodnione miejsce.** Druga karta pod mapą, bezpośrednio pod „Najbliższą sprawą”. **Proponowany wygląd i zachowanie** opisano poniżej. To jeden kalkulator zasiłku macierzyńskiego dla wybranego dziecka lub planu. Przystanek dotyczący urlopu otwiera ten sam kalkulator z odpowiednim okresem. [Wymagania ZUS, s. 12–15](Materia%C5%82y%20hackathonowe/ZUS%20-%20Pe%C5%82na%20tre%C5%9B%C4%87%20zadania%20konkursowego.pdf)

### Pierwszy widok

Nagłówek **„Ile czasu i jaki zasiłek?”** i krótkie określenie zakresu, np. „Ola · urlop rodzicielski · planowane okresy”. Największe liczby to **„Czas opieki w kalendarzu”** i **„Szacowany zasiłek łącznie · brutto”** za pokazany okres. Pod nimi są dwie podpisane linie czasu na wspólnej skali, po jednej dla każdego uczestniczącego rodzica, z datami, czasem i kwotą danej osoby. Jednego rodzica można policzyć samodzielnie. Paski mają etykiety tekstowe także wtedy, gdy się pokrywają. Pensja za pracę pozostaje poza sumą zasiłków.

Jeśli rodzic ma już zapisany plan, karta otwiera jego wynik. Gdy dopiero zaczyna i nie wskazał okresów, widzi pytanie „Jaki okres opieki chcesz sprawdzić?” i przycisk „Ułóż wariant”. Przed porodem daty wynikające z przewidywanego terminu są podpisane „planowane”. Gdy brakuje tylko podstawy wymiaru, oś czasu pozostaje widoczna, a miejsce kwoty zajmuje np. „Uzupełnij podstawę drugiego rodzica”. Znana część ma własną nazwę i kwotę, suma rodziny czeka na komplet danych. Przy ustalonym braku uprawnienia pokazujemy okres, którego dotyczy, przyczynę i źródło.

### Edycja i porównanie

1. **„Zmień wariant”.** Rodzic wybiera rodzaj okresu i uczestniczące osoby. Przy każdym odcinku można wskazać osobę, początek i koniec albo długość. Dla wspólnej opieki podpowiedzi „Kolejno” i „W tym samym czasie” ustawiają początek drugiego odcinka. Daty pozostają edytowalne. Przełącznik „Łączę urlop rodzicielski z pracą” dodaje wymiar etatu i okres pracy u pracodawcy udzielającego urlopu. Po zatwierdzeniu poprawnej zmiany przeliczają się zarówno kwota, jak i długość oraz data zakończenia. [Łączenie urlopu z pracą](https://www.gov.pl/web/rodzina/urlop-rodzicielski)
2. **„Porównaj wariant”.** Drugi wariant powstaje jako kopia pierwszego. Rodzic zmienia jedną decyzję, np. przechodzi z opieki kolejno na równoczesną. Oba wyniki obejmują te same kategorie świadczeń, z własnym zakresem dat. Podsumowanie pokazuje różnicę w kwocie brutto i czasie kalendarzowym. Obok osi widać ile puli już wykorzystano, ile zużywa wariant i ile pozostaje, w tym część zastrzeżoną dla każdej osoby. Przedziały równoczesne zużywają pulę obojga rodziców, a wspólny dzień na osi kalendarza liczymy raz. Przy przerwach osobno widać dni opieki i daty całego planu.
3. **„Skąd ta kwota?”** Rozwinięcie pokazuje dla każdej osoby źródło danych, przyjętą podstawę wymiaru, właściwą stawkę, liczbę dni i sumę za odcinek. Dla okresów z różnymi stawkami podaje oddzielne wiersze. Zusik może wyjaśnić konkretną różnicę z odnośnikiem do podstawy. Oba warianty korzystają z tego samego kalkulatora reguł. [Wysokość zasiłku według ZUS](https://www.zus.pl/pl/swiadczenia/zasilki/zasilek-macierzynski/wysokosc)
4. **„Użyj tego wariantu w planie”.** Dopiero ten przycisk zapisuje wybór i aktualizuje odpowiednie terminy na mapie, potrzebne dokumenty i odbiorcę. Powrót bez zatwierdzenia zachowuje dotychczasowy plan. Jeśli istnieje szkic wniosku oparty na wcześniejszych datach, rodzic widzi informację, które pola wymagają sprawdzenia. Wysłanie dokumentu w demo jest osobną czynnością.

Na komputerze porównanie ma dwie kolumny ze wspólną skalą dat. Na telefonie podsumowanie różnic pozostaje widoczne nad przełącznikiem „Wariant A / Wariant B”. Szczegóły aktywnego wariantu mieszczą się w jednej kolumnie. Każdy odcinek da się ustawić polami daty i długości, również klawiaturą.

### Dane i reguły, które wpływają na ekran

| Dane z profilu, sprawy testowej lub podane przez rodzica | Co robi kalkulator |
| --- | --- |
| Tytuł i okres ubezpieczenia oraz indywidualna podstawa każdego rodzica | Wykorzystuje znaną podstawę albo ustala ją z odpowiednich danych o wynagrodzeniach lub podstawach składek, okresach i przerwach zależnie od tytułu. Pokazuje pochodzenie danych i pozwala wprowadzić własną podstawę do symulacji. Dane drugiego rodzica uzupełniamy, gdy jego odcinek ma wejść do obliczeń. |
| Narodziny, adopcja lub niezawodowa piecza zastępcza, wiek i liczba dzieci urodzonych albo przyjętych jednocześnie | Wybiera właściwe rodzaje okresów i limity. Pyta warunkowo o datę przyjęcia, etap postępowania, zaświadczenie „Za życiem” albo dane do uzupełniającego urlopu po hospitalizacji. Dla bliźniąt pula tego samego porodu jest wspólna. |
| Rodzaj okresu, wykorzystana pula, daty i decyzje obojga rodziców, data wniosku, praca podczas urlopu | Rozróżnia okres macierzyński lub na jego warunkach, uzupełniający, rodzicielski i ojcowski. Uwzględnia różne stawki, warunki stawki uśrednionej, część nieprzenoszalną, limity części oraz wydłużenie przy łączeniu pracy z urlopem. Przy sprzeczności wskazuje konkretny odcinek do poprawy i wstrzymuje zapis wariantu. |

### Przykład do makiety i odbioru

Dwoje uprawnionych pracowników planuje po 4 tygodnie urlopu rodzicielskiego w ramach dostępnej puli. Rozpatrujemy tylko te dwa odcinki. Przyjmujemy fikcyjne, już ustalone stawki dzienne zasiłku: 140 zł brutto dla pierwszej osoby i 105 zł dla drugiej. W obu wariantach wykorzystują po 28 dni, bez pracy podczas urlopu.

| Wynik | A · kolejno, bez przerwy | B · jednocześnie od tego samego dnia |
| --- | ---: | ---: |
| Dni kalendarzowe objęte opieką | 56 | 28 |
| Zasiłek pierwszej osoby | 3 920 zł | 3 920 zł |
| Zasiłek drugiej osoby | 2 940 zł | 2 940 zł |
| Łącznie brutto za pokazane odcinki | 6 860 zł | 6 860 zł |

Zdanie pod wynikiem: **„Przy wspólnym rozpoczęciu spędzicie razem 4 tygodnie. Łączna kwota zasiłku za wybrane okresy pozostaje taka sama.”** Do odbioru reguł potrzebne są ponadto sprawy konkursowe z dokumentami i oczekiwanym wynikiem, w tym brak uprawnienia, niepełne dane, różne podstawy rodziców, praca na część etatu, adopcja i piecza. Parametry stawek i limitów wybieramy według daty sprawy z ustawień administracyjnych.

## Zusik — czat dostępny w całej aplikacji po zalogowaniu

**Uzgodnione.** W prawym dolnym rogu każdego ekranu jest mały bąbelek Zusika z etykietą „Otwórz czat z Zusikiem”. Pozostaje w zasięgu podczas przewijania. Otwiera po prawej panel agenta z historią rozmów, polem wiadomości i trzema propozycjami rozpoczęcia rozmowy dopasowanymi do sytuacji na stronie. „Pełny ekran” rozszerza tę samą rozmowę. „Podziel ekran” przywraca obok niej bieżący widok aplikacji. Akcja „Dokończ z Zusikiem” otwiera ten panel przy odpowiednim szkicu wniosku.

**Uzgodniony układ panelu i sterowanie**

- **Nagłówek.** „Zusik · asystent AI” oraz kontekst, np. „Ola · Kalkulator · Wariant B”. Pod ręką są „Historia”, „Nowa rozmowa”, przełącznik pełnego lub dzielonego widoku i „Zwiń czat”. Historia pokazuje rozmowy zalogowanego rodzica z tytułem, dzieckiem lub planem oraz datą ostatniej wiadomości. Wybranie pozycji wznawia rozmowę w jej pierwotnym kontekście.
- **Rozmowa.** Gdy rodzic zaczyna nowy czat, widzi dokładnie trzy krótkie pytania. Wybranie pytania przenosi je do pola wiadomości, gdzie można je zmienić i wysłać. W toku rozmowy w tym miejscu pojawiają się wiadomości, źródła odpowiedzi oraz podgląd proponowanych zmian w konkretnym szkicu.
- **Pole wiadomości.** Wielowierszowe „Zapytaj Zusika…”, „Dołącz dokument” z możliwością usunięcia załącznika przed wysłaniem i „Wyślij”. Podczas generowania dostępne jest „Zatrzymaj odpowiedź”, a po błędzie „Spróbuj ponownie”. Wysłanie wiadomości i zatwierdzenie wniosku to osobne czynności.

| Miejsce otwarcia | Trzy przykładowe początki rozmowy |
| --- | --- |
| Mapa lub najbliższa sprawa | „Co mam teraz załatwić?” · „Od czego liczy się ten termin?” · „Jakie dokumenty przygotować?” |
| Kalkulator z dwoma wariantami | „Skąd ta kwota?” · „Czym różnią się moje warianty?” · „Co się zmieni, jeśli wrócę na część etatu?” |
| Szkic wniosku | „Czego brakuje we wniosku?” · „Jak poprawić datę?” · „Do kogo mam go złożyć?” |

Pytania odpowiadają rzeczywistemu stanowi ekranu. Przykładowo przy jednym wariancie drugie pytanie w kalkulatorze brzmi „Jak dodać drugi wariant?”, a przy brakującej podstawie pierwsze brzmi „Jakich danych brakuje do wyliczenia?”. Przed wyborem dziecka podpowiedzi dotyczą aktualnego kroku onboardingu. Po zmianie dziecka panel przywołuje rozmowę dla nowego planu albo oferuje rozpoczęcie nowej. Poprzedni czat zachowuje swoją historię, niewysłany tekst i załączniki przy właściwym dziecku.

**Przejścia między widokami.** Na komputerze panel zwęża obszar roboczy tak, aby rodzic widział obok np. zmieniane pole formularza. Na wąskim telefonie stosujemy podział pionowy: fragment bieżącej sprawy u góry, rozmowa i pole wiadomości niżej. „Pełny ekran” oddaje całą dostępną przestrzeń rozmowie, a „Podziel ekran” odtwarza podział. Zwijanie przywraca bąbelek. Każde przejście zachowuje aktywną rozmowę, niewysłaną wiadomość, załączniki, generowaną odpowiedź oraz miejsce rodzica na stronie. Pole pozostaje dostępne po otwarciu klawiatury ekranowej. Wszystkie kontrolki mają nazwy dla czytnika ekranu, a zwinięcie zwraca fokus na przycisk otwierający.

## Karta nawigacji „Dokumenty i wnioski”

**Uzgodnione miejsce.** To osobna karta w górnej nawigacji. Działa dla dziecka lub planu wybranego w głównym selektorze. Wejście z mapy, historii rozmowy lub „Najbliższej sprawy” prowadzi do tej samej sprawy i jej istniejącego szkicu. Sprawy wspólne dla rodzeństwa mają podpis „Dotyczy także…” i jeden zestaw dokumentów.

### Co wynika z procesu eZUS

Zapisany formularz pozostaje w dokumentach roboczych aż do wysłania. Po autoryzacji i wysłaniu do ZUS trafia do dokumentów wysłanych. Elektroniczne urzędowe poświadczenie przedłożenia (UPP) potwierdza wpływ dokumentu. Pisma od ZUS trafiają do skrzynki odbiorczej, a szczegóły obsługi zależą od świadczenia. Przykładowo przy 800+ rodzic może dostać wezwanie z terminem na uzupełnienie. Informacja o przyznaniu i decyzja odmowna są różnymi rodzajami odpowiedzi. [Wysyłanie i odbieranie pism w eZUS](https://bip.zus.pl/web/guest/baza-wiedzy/o-portalu-pue-/w-jaki-sposob-wysylac-do-zus-i-odbierac-pisma-) · [Obsługa wniosków 800+](https://www.zus.pl/portal/pomoc/kub0030.html) · [Zasady 800+](https://www.zus.pl/swiadczenia/swiadczenia-dla-rodzin/swiadczenie-wychowawcze-800-plus)

### Lista dla rodzica — uzgodniony podział

Na górze nazwa dziecka oraz dwa widoki: **„Sprawy”** (domyślny) i **„Pliki dziecka”**. W „Sprawach” jeden wiersz odpowiada jednej sprawie. Pod nim w szczegółach znajdują się formularz, załączniki, potwierdzenie i korespondencja. Nazwy grup poniżej to etykiety przewodnika. Każda sprawa jest w jednej grupie, zgodnie z ostatnim zdarzeniem i tym, kto ma wykonać kolejny krok.

**Podział według celu obowiązuje w obu widokach.** Dokumenty wybranego dziecka pokazujemy w sekcjach **Urlopy**, **Świadczenia i zasiłki**, **Rejestracja i ubezpieczenie** oraz **Zdrowie i opieka**. Wniosek o urlop do pracodawcy należy do „Urlopów”, wniosek o wypłatę zasiłku do „Świadczeń i zasiłków”, zgłoszenie urodzenia lub do ubezpieczenia do „Rejestracji i ubezpieczenia”, a deklaracja wyboru POZ do „Zdrowia i opieki”. W „Sprawach” nad sekcjami są filtry statusu z licznikami. Wybranie „Do załatwienia” pokazuje zadania ze wszystkich celów, z pilnymi wezwaniami na górze. Odznaczenie filtra przywraca wszystkie sprawy. Każda pozycja ma jeden cel główny i jeden aktualny status. Potwierdzenia, załączniki i pisma dziedziczą cel sprawy. Jeden plik użyty w kilku sprawach ma odnośniki do tych spraw i pozostaje pojedynczym plikiem.

| Grupa | Co widzi rodzic | Główne działanie |
| --- | --- | --- |
| **Do załatwienia** | Najpierw wezwania z terminem, potem aktualne sprawy według terminu. Etykiety: „Do rozpoczęcia”, „Szkic”, „Wypełniony · do sprawdzenia”, „Zatwierdzony · do przekazania”, „Do uzupełnienia po wezwaniu”. Obok jedno zdanie, np. „Brakuje daty rozpoczęcia urlopu”. Sprawa dobrowolna ma oznaczenie „Jeśli chcesz skorzystać”. | „Rozpocznij”, „Dokończ z Zusikiem”, „Sprawdź i zatwierdź”, „Przekaż” albo „Otwórz wezwanie”. |
| **Wysłane i w toku** | Data wysłania, odbiorca i ostatnie potwierdzone zdarzenie. W demo „Wysłano w symulacji”. Przy wysyłce do ZUS można otworzyć przykładowe UPP. „W trakcie rozpatrywania” pojawia się dopiero, gdy dane danej sprawy zawierają taki stan. | „Zobacz przebieg sprawy”. Gdy przychodzi wezwanie, sprawa przechodzi do „Do załatwienia” z zachowaniem historii wysyłki. |
| **Na później** | Sprawy pasujące do planu, które staną się aktualne po konkretnym zdarzeniu. Zamiast pustego formularza pokazujemy warunek, np. „Po narodzinach dziecka” przy zgłoszeniu urodzenia. Gdy data jest nieznana, podajemy samo zdarzenie. | „Zobacz, co przygotować”. Po potwierdzeniu zdarzenia sprawa przechodzi do „Do załatwienia”. Dopiero wybranie „Rozpocznij” tworzy szkic. |
| **Zakończone** | Ostatni wynik i data, np. „Świadczenie przyznane”, „Odmowa” albo „Oznaczone przez Ciebie jako załatwione”. Po odebraniu pisma widać jego treść i wynik oraz kolejne możliwości zgodne z pouczeniem. | „Zobacz wynik” lub „Zobacz dokument”. |

Na komputerze wiersz ma tytuł sprawy językiem rodzica, status, odbiorcę, termin lub ostatnie zdarzenie i jedno działanie. Na telefonie te same informacje układają się w kartę. Przykład: **„Urlop ojcowski”** · „Szkic” · „Do pracodawcy” · „Brakuje daty rozpoczęcia” · **„Dokończ z Zusikiem”**. Kolor uzupełnia tekst statusu. Przy pustej grupie „Do załatwienia” rodzic widzi „Na dziś masz wszystko załatwione”, o ile stan spraw jest znany. Jeśli brakuje danych do ustalenia następnego kroku, wskazujemy brakujące informacje.

**„Pliki dziecka”** pokazują dokumenty źródłowe i załączniki (np. zaświadczenie ze szpitala), kopie wniosków, potwierdzenia oraz pisma przychodzące. Wiersz podaje nazwę, rodzaj, datę i powiązaną sprawę. Otwarcie pokazuje podgląd i link do sprawy. Szkic można edytować. Wysłaną wersję zachowujemy do odczytu. Uzupełnienie po wezwaniu tworzy kolejne pismo lub załącznik powiązany z tą samą sprawą. Dla pisma do pracodawcy lub USC pokazujemy sposób przekazania i dostępne potwierdzenie właściwe dla odbiorcy. UPP z eZUS jest przypisane do przesyłki złożonej do ZUS.

### Po kliknięciu „Dokończ z Zusikiem”

1. **Powrót do miejsca przerwania.** Otwiera się widok dzielony. Po lewej widoczny jest zapisany formularz z pierwszym brakującym polem, po prawej rozmowa dotycząca tego szkicu. Nagłówek identyfikuje dziecko, dokument i odbiorcę, np. „Ola · Wniosek o urlop ojcowski · Pracodawca”. Na telefonie nad czatem widać edytowane pole. Przy pierwszej rozmowie działają trzy ustalone propozycje startu, przy wznowieniu widać dotychczasowe wiadomości.
2. **Jedno konkretne pytanie.** Zusik mówi np. „Masz już wpisane dane pracodawcy. Od którego dnia chcesz zacząć urlop?”. Rodzic może odpowiedzieć w rozmowie albo użyć selektora daty. Odpowiedź aktualizuje to samo pole, pokazuje zmienioną wartość i zapisuje postęp. Brakujący załącznik ma nazwę oraz akcję „Dodaj dokument”. Zamknięcie panelu pozwala później wznowić ten sam szkic.
3. **Sprawdzenie.** Po uzupełnieniu wymaganych pól i załączników sprawa otrzymuje status „Wypełniony · do sprawdzenia”. Rodzic widzi podsumowanie, może poprawić dowolne pole i wybiera „Zatwierdź”. Jeśli dokument obsługuje demonstracyjną wysyłkę, osobna akcja „Wyślij w symulacji” pokazuje odbiorcę. Status „Wysłano w symulacji” pojawia się po potwierdzeniu powodzenia. Przy błędzie zatwierdzony dokument pozostaje dostępny do ponowienia.
4. **Odpowiedź odbiorcy.** W szczegółach jest historia z datami, np. „Wysłano”, „Potwierdzono wpływ”, „Otrzymano wezwanie”. Po wezwaniu Zusik otwiera pismo i pomaga przygotować wyłącznie wskazane uzupełnienie. Status i termin odczytujemy ze zdarzeń scenariusza demo, a po ręcznym oznaczeniu wyraźnie wskazujemy „Podane przez Ciebie”.

### Po wysłaniu — przebieg jednej sprawy

**Propozycja do omówienia.** „Zobacz przebieg sprawy” otwiera szczegóły. U góry widnieją dziecko, nazwa sprawy, odbiorca i oznaczenie symulacji. Bezpośrednio poniżej znajduje się karta ostatniej potwierdzonej zmiany z datą, odpowiedzią na pytanie **„Czy mam teraz coś zrobić?”** i jednym działaniem. Po potwierdzeniu wpływu może brzmieć „Wniosek dotarł do ZUS. Na razie nic nie musisz robić” z przyciskiem „Zobacz potwierdzenie”. Po nadejściu pisma jej miejsce zajmuje informacja wymagająca uwagi.

**Układ etapów.** Na komputerze proponujemy poziomy pasek etapów, na telefonie pionową listę. Zakończony etap ma znacznik wykonania i datę, bieżący ma podpis „Teraz” i rozwinięte szczegóły, a przy przyszłym widnieje „Przed Tobą”. Wybranie etapu otwiera powiązane dokumenty. Znacznik postępu zmienia się po zdarzeniu w sprawie. Dzięki temu rodzic może zajrzeć do wyniku lub potwierdzenia, zachowując faktyczny status.

| Etap | Co widać po rozwinięciu |
| --- | --- |
| **1. Wysłano** | Kiedy i do kogo przekazano wniosek w symulacji, wysłana wersja oraz lista przekazanych załączników. |
| **2. Potwierdzenie wpływu** | Dla sprawy ZUS po udostępnieniu UPP pokazujemy datę wpływu i „Otwórz potwierdzenie UPP”. Można pobrać oznaczoną jako demonstracyjna kopię. Do tego czasu etykieta brzmi „Oczekujemy na potwierdzenie”. Dla innego odbiorcy etapy wynikają z dostępnego sposobu potwierdzenia. |
| **3. Przebieg sprawy** | Zdarzenia z datą i autorem. Po wpływie domyślny opis to „Oczekujemy na wiadomość”. „W trakcie rozpatrywania” wymaga takiego statusu w danych sprawy. Każda wymiana „Wezwanie → odpowiedź → potwierdzenie” ma własne wpisy pod tym samym etapem. |
| **4. Wynik** | Po odebraniu informacji lub decyzji karta pokazuje rzeczywisty wynik scenariusza, datę, oryginalne pismo i ewentualne dalsze kroki zgodne z pouczeniem. Jeżeli wynik wymaga reakcji, rodzic widzi ją także w podsumowaniu. |

### Wezwanie — lista czynności rodzica

1. **Odbierz pismo.** W szczegółach i na liście spraw pojawia się „Nowe pismo do odbioru”. Jeżeli pismo wymaga poświadczenia doręczenia, akcja „Odbierz pismo w demo” symuluje UPD. Po odbiorze wezwania karta pokazuje „Twój krok — uzupełnij dokumenty”, nadawcę, treść pisma i termin zgodny z wezwaniem. Jeśli podano okres liczony od doręczenia, dokładną datę pokazujemy dopiero po ustaleniu daty doręczenia zgodnie z właściwą regułą. [Odbiór pism i poświadczenia w eZUS](https://bip.zus.pl/web/guest/baza-wiedzy/o-portalu-pue-/w-jaki-sposob-wysylac-do-zus-i-odbierac-pisma-)
2. **Zobacz, czego brakuje.** Przykład fikcyjnej sprawy: „Dołącz zaświadczenie ze szpitala wskazane w piśmie”. Pod spodem krótka lista zadań z tego wezwania. Plik otrzymuje oznaczenie „Dodano do szkicu” po faktycznym dołączeniu. Obok streszczenia stale dostępny jest oryginał pisma.
3. **„Uzupełnij z Zusikiem”.** Po lewej otwiera się szkic odpowiedzi na konkretne wezwanie, po prawej jego rozmowa. Rodzic dodaje plik z „Plików dziecka” lub z urządzenia, sprawdza adresata i załączniki, a następnie wybiera „Wyślij uzupełnienie w symulacji”. Może wyjść i wznowić ten sam szkic. Wysłany wcześniej wniosek pozostaje dostępny do odczytu. Forma uzupełnienia zależy od rodzaju sprawy. [Przykład obsługi załączników do wniosku 800+](https://www.zus.pl/portal/pomoc/kub0030.html)
4. **Sprawdź, co dalej.** Po udanej wysyłce na osi pojawia się „Wysłano uzupełnienie”, a potwierdzenie wpływu uzupełnienia trafia do tego wpisu po jego udostępnieniu. Gdy wszystkie wezwania mają wysłaną odpowiedź i brak innych czynności rodzica, sprawa wraca do „Wysłane i w toku”. Błąd wysyłki zachowuje szkic w „Do załatwienia”. Kolejne wezwanie ponownie aktywuje tę samą sprawę. Sam upływ terminu oznaczamy „Termin minął”, a zakończenie sprawy wynika z otrzymanego rozstrzygnięcia.

## Profil rodziny — dane rodzica i dzieci

**Uzgodniona zasada widoczności.** W profilu pokazujemy podstawowe dane identyfikujące osobę oraz informacje, które rodzic może uzupełnić lub zmienić w przewodniku. Szczegóły urzędowe tylko do odczytu pojawiają się w odpowiedniej sprawie lub przy wyliczeniu. Edycja w przewodniku dotyczy własnych deklaracji i założeń planu. Urzędowa korekta ma osobną drogę u właściwego podmiotu. [Korekta danych zgłoszeniowych według ZUS](https://www.zus.pl/-/jak-dokonac-zmiany-korekty-danych-wykazanych-w-dokumentach-zgloszeniowych-ubezpieczonego-czlonka-rodziny)

**Rekomendowana nazwa: „Profil rodziny”.** Ekran ma sekcje „Moje dane” oraz „Dzieci i plany”. Pierwsza pokazuje dane rodzica raz dla całej rodziny. W drugiej są wszystkie plany tej osoby, z zaznaczonym dzieckiem wybranym w pasku. Rodzic wybiera „Edytuj plan Oli” lub „Dodaj dziecko lub plan”. Osoba planująca ciążę może zacząć od nienazwanego planu.

| Źródło i zakres | Co symulujemy lub wpisujemy | Co widzi i zmienia rodzic |
| --- | --- | --- |
| **Tożsamość rodzica — logowanie.** Publicznie opisana integracja S46 z login.gov.pl otrzymuje imię, nazwisko i PESEL. Własna usługa wymaga odrębnego uzgodnienia zakresu integracji. [Przykład S46](https://www.gov.pl/web/system-s46/logowanie-i-rejestracja-konta) · [Informacje dla integratorów](https://www.gov.pl/web/login/dla-integratorow2) | W demonstracji podstawiamy fikcyjną tożsamość. | W „Moich danych” imię i nazwisko z oznaczeniem źródła, do odczytu. PESEL tylko w formularzu, który go potrzebuje. |
| **Dziecko — rejestr PESEL.** Gov.pl oferuje rodzicowi oddzielną usługę wglądu w dane dziecka po spełnieniu warunków dotyczących uprawnień i powiązania w rejestrze. [Usługa Gov.pl](https://www.gov.pl/web/gov/sprawdz-swoje-dane-w-rejestrze-pesel) | Dzieci znane z przygotowanego przypadku demo lub dodane przez rodzica. Samo logowanie nie dostarcza listy dzieci. | Podstawy: imię i nazwisko oraz data urodzenia, jeśli są znane. Dane rejestrowe tylko do odczytu. W planie dodanym ręcznie rodzic może poprawić podane przez siebie dane, ustawić nazwę wyświetlaną, etap, przewidywany termin porodu lub datę przyjęcia pod opiekę. |
| **ZUS — ubezpieczony i płatnik.** eZUS pokazuje m.in. ubezpieczenia i płatników, podstawy składek, członków rodziny zgłoszonych do ubezpieczenia zdrowotnego oraz zwolnienia lekarskie. Dane zależą od roli i dostępnych zapisów. [Panel ubezpieczonego](https://www.zus.pl/portal/pomoc/kub0000.html) · [Informator eZUS](https://www.zus.pl/documents/10182/13876255/0306_26%2BPortal%2BeZUS_WCAG.pdf/2c883aa0-bccd-30af-3ce7-67199f7c28a6?t=1779346638803) | Konkurs przewiduje m.in. symulowany stan ubezpieczenia, podgląd e-ZLA i zadłużenia składkowego dla odpowiedniej osoby. Zgłoszenie zdrowotne dziecka przez danego płatnika jest informacją o zgłoszeniu. Kompletność listy dzieci i uprawnienia opiekuna wymagają odrębnego ustalenia. | Status i okres ubezpieczenia w sprawie o zasiłek, podstawy w kalkulatorze, e-ZLA i zadłużenie przy sprawie, której dotyczą. Wartość podana przez rodzica do symulacji jest podpisana „Moje założenie”. Źródłowy zapis ZUS zachowuje swoje pochodzenie. |
| **Dane od rodzica.** Informacje potrzebne do wyboru ścieżki. | Rola w konkretnym planie, planowane zmiany zatrudnienia lub opieki, brakujące daty. Dane drugiego opiekuna tylko w zakresie podanym do wspólnej symulacji. | Możliwość dodania, poprawienia i zapisania przy właściwej osobie lub planie. Szczegółowe dane medyczne, finansowe i załączniki mają wejście przez odpowiednią sprawę. |

**Po zapisaniu zmiany** rodzic widzi jej skutek, np. „Zmieniono przewidywany termin porodu. Zaktualizowano daty w planie Oli”. Szkic zależny od zmienionego pola dostaje oznaczenie „Sprawdź po zmianie danych”. Wysłane dokumenty zachowują treść z chwili wysyłki. Przy błędzie zapisu formularz zachowuje wpisane wartości. Korekta lokalnego założenia i przywrócenie wartości źródłowej są dostępne w miejscu użycia tej wartości.

### Proponowany komplet kart

- **Mój plan** — mapa aktywnego dziecka, najbliższa sprawa, kalkulator i kontekstowa pomoc.
- **Dokumenty i wnioski** — sprawy według celu, filtry statusu, terminy, wezwania i pliki.
- **Profil rodziny** — podstawowe dane rodzica, dzieci i edycja planów.

Selektor dziecka i bąbelek Zusika są dostępne globalnie. Pilne wezwanie jest widoczne w „Najbliższej sprawie” i liczniku „Do załatwienia”. Do testowania konkursowego pozostaje potrzebne wejście „Przetestuj przykładową sprawę” przy planie, a edycja parametrów świadczeń należy do widoku administratora. Te działania mają własne miejsca poza głównym paskiem rodzica. [Zakres demonstracji w opisie zadania, s. 13–15](Materia%C5%82y%20hackathonowe/ZUS%20-%20Pe%C5%82na%20tre%C5%9B%C4%87%20zadania%20konkursowego.pdf)

## Zakres konkursowy do dalszego rozpisania

W kolejnych sekcjach tej specyfikacji rozwiniemy reguły poszczególnych przypadków, wzory i wyjątki terminów, weryfikację wyliczeń na dokumentach testowych oraz urzędowe formularze i załączniki. W ścieżce testowej wybór sprawy lub testowego PDF prowadzi do ustalenia ubezpieczenia, kwoty i okresu albo przyczyny braku uprawnień. Dla odpowiednich profili potrzebne są symulacje stanu zadłużenia składkowego, e-ZLA, połączenia z PUE/eZUS, wniosków do pracodawcy lub ZUS i odpisu aktu urodzenia. Parametry prawne podlegają aktualizacji w panelu administracyjnym. Moduły zdrowotne i rodzinne to proponowane rozszerzenie przewodnika. Nazwy programów, daty obowiązywania i reguły kierowania do instytucji wymagają utrzymywania aktualnych źródeł. [Pełna treść zadania, s. 11–15](Materia%C5%82y%20hackathonowe/ZUS%20-%20Pe%C5%82na%20tre%C5%9B%C4%87%20zadania%20konkursowego.pdf)
