# Zusik — specyfikacja techniczna agenta

**Szkic do rozmowy · 21 listopada 2026.** Proponowana kolejność wynika z tego, co jury sprawdzi na własnym pliku i jakiej decyzji rodzic potrzebuje przed rozpoczęciem wniosku. Wybór technologii pozostaje otwarty. [Opis zadania, s. 11–15](<Materiały hackathonowe/ZUS - Pełna treść zadania konkursowego.pdf>)

**Uzgodniona scena główna.** Rodzic porównuje dwa warianty, wybiera jeden i wspólnie z Zusikiem przygotowuje wniosek. Poniżej są trzy scenariusze do omówienia, w tym dwa zakończone kompletem dokumentów i jeden odpowiedzią o braku prawa. [Przebieg demonstracji](#scenariusze-demonstracji)

## 1. Czy w tej konkretnej sytuacji przysługuje mi świadczenie?

**Trudność.** Wśród spraw ZUS są odmowy z różnych powodów, m.in. brak ubezpieczenia na dzień porodu i wniosek o kolejną część urlopu rodzicielskiego. Informacja o zatrudnieniu dzisiaj nie wystarcza do ustalenia stanu z dnia zdarzenia. Brak potwierdzenia ubezpieczenia w aktach też nie przesądza o odmowie.

**Zachowanie Zusika.** Ustala osobę, świadczenie, właściwą datę i fakt, który zmienia wynik. Korzysta z reguły obowiązującej dla sprawy. Kiedy rozstrzygnięcia brakuje, zadaje jedno pytanie o ten fakt albo wskazuje dokument potrzebny do jego potwierdzenia.

**Próba odbioru.** Dla sprawy z potwierdzonym brakiem ubezpieczenia rodzic widzi przyczynę, datę, źródło faktu i podstawę reguły. Po usunięciu dowodu rozstrzygającego wynik przechodzi w „brakuje informacji”, jeżeli pozostałe dane nie wystarczają. [Sprawy testowe w specyfikacji rodzica](SPEC-PO-LOGOWANIU.md#przetestuj-przykładową-sprawę)

## 2. Którym danym w aktach można zaufać?

**Trudność.** W paczce są 87 plików, w tym 86 unikalnych, i 2020 stron bez warstwy tekstowej. Jeden plik może łączyć wniosek rodzica, zaświadczenie płatnika, zrzut systemowy i rozstrzygnięcie. Okres wnioskowany i potwierdzony mogą wyglądać podobnie. Wynik bywa widoczny nawet w nazwie pliku.

**Zachowanie Zusika.** Przy wartości potrzebnej do wyniku zachowuje jej znaczenie, dokument i stronę. Pokazuje źródłowy fragment przy niepewnym odczycie. Rodzic może poprawić odczyt lub utworzyć wariant „co jeśli”. Korekta danych i symulacja mają inne skutki.

**Próba odbioru.** Jury zmienia nazwę pliku i odkłada stronę z końcową decyzją. Dla pozostałych dowodów aplikacja wylicza wynik lub wskazuje konkretny brak. Dopiero potem porównuje wynik z decyzją. Inspiracją jest reprezentacja dokumentu w Docling, która wiąże element dokumentu ze stroną i położeniem. [Docling Core na GitHubie](https://github.com/docling-project/docling-core/blob/main/docling_core/types/doc/document.py)

## 3. Co się zmieni, jeśli inaczej podzielimy opiekę?

**Trudność.** Rodzice zmieniają jedną rzecz w swoim planie, a jej skutki dotyczą dwóch osób. Dni opieki mogą się pokrywać, podstawy zasiłku mogą być różne, a praca na część etatu wprowadza odrębny wariant. Kwota zasiłku i łączny dochód rodziny to różne wielkości.

**Zachowanie Zusika.** Tłumaczy wypowiedź rodzica na zmianę założenia w kopii planu. Kalkulator liczy według tej samej wersji reguł. Rodzic widzi obok siebie daty, czas opieki i kwoty dla każdej osoby, a pod nimi jedno zdanie wyjaśniające różnicę.

**Próba odbioru.** W fikcyjnym przykładzie z naszej specyfikacji każdy rodzic ma 28 dni i ustaloną stawkę dzienną. Zmiana „kolejno” na „razem od tego samego dnia” skraca czas kalendarzowy z 56 do 28 dni. Suma zasiłków za te odcinki w obu wariantach wynosi 6860 zł brutto. Brak podstawy drugiej osoby pozwala nadal pokazać daty. Z OpenFisca warto zaczerpnąć sposób modelowania świadczeń za pomocą jawnych reguł i okresów. [Przykład zespołu](SPEC-PO-LOGOWANIU.md#przykład-do-makiety-i-odbioru) · [OpenFisca na GitHubie](https://github.com/OpenFisca/openfisca-core)

## 4. Co mam zrobić teraz i kto odpowiada za dokument?

**Trudność.** Ten sam cel rodzica może oznaczać wniosek urlopowy do pracodawcy, wniosek o świadczenie albo oczekiwanie na zaświadczenie płatnika. Starsze akta mogą zawierać ZAO lub ZUR, których zakres przejął ZAM. Sama nazwa odnalezionego druku nie określa następnego kroku.

**Zachowanie Zusika.** Wskazuje jedną czynność, wykonawcę, odbiorcę oraz termin z jego podstawą, gdy jest znany. W szkicu wykorzystuje potwierdzone dane i pyta o wybory lub oświadczenia rodzica. Przy wezwaniu identyfikuje wskazany brak i wiąże uzupełnienie z właściwą sprawą.

**Próba odbioru.** Pracownik planujący urlop ojcowski trafia do szkicu dla pracodawcy. W scenariuszu wymagającym Z-3 widzi, co przekazuje płatnik. Gdy potrzebny jest nowy ZAM, szkic korzysta z aktualnego wzoru i pokazuje przed zatwierdzeniem okres oraz oświadczenia. Z docassemble warto zaczerpnąć prowadzenie wywiadu według informacji potrzebnych do przygotowania konkretnego dokumentu. [Aktualny ZAM](https://www.zus.pl/-/wniosek-zas-54-1) · [docassemble na GitHubie](https://github.com/jhpyle/docassemble)

## Scenariusze demonstracji

Imiona, pracodawcy i daty w rozmowach są fikcyjne. Pierwsza scena rozwija istniejący przykład liczbowy zespołu. Dwie kolejne korzystają z typów spraw i rozstrzygnięć w materiałach konkursowych. Dane profilu, terminy na mapie i przekazanie dokumentu to elementy projektowanej symulacji. Reguły sprawdzono 21 listopada 2026 r.

### 1. Tak · cztery tygodnie razem albo osiem tygodni opieki kolejno

**Punkt wyjścia.** Marta i Paweł Lis wychowują Olę, urodzoną 4 maja 2026 r. Oboje są uprawnionymi pracownikami. Zakończył się okres macierzyński. Na potrzeby przykładu rodzice potwierdzili, że dotąd wykorzystali 0 dni i 0 części rodzicielskiego. Każde planuje 28 dni bez łączenia z pracą. Ich indywidualne, już ustalone stawki dzienne brutto to 140 i 105 zł. Na ekranie widać oznaczenie „Dane demonstracyjne”. [Przykład liczbowy zespołu](SPEC-PO-LOGOWANIU.md#przykład-do-makiety-i-odbioru) · [Zasady urlopu rodzicielskiego](https://www.gov.pl/web/rodzina/urlop-rodzicielski)

| Moment | Rozmowa lub czynność rodzica | Co zmienia się na ekranie |
|---|---|---|
| 1. Cel | **Marta:** „Mamy z Pawłem po cztery tygodnie na opiekę nad Olą. Czy możemy wziąć je razem? I ile czasu zyskamy, jeśli Paweł zacznie po mnie?” **Zusik:** „Tak, możecie korzystać równocześnie. Od którego dnia chcesz zacząć?” | Nad czatem widać „Ola · Porównanie urlopu rodzicielskiego”. Można rozwinąć dane, z których korzysta kalkulator. |
| 2. Jedno pytanie | **Marta:** „Od 11 stycznia”. **Zusik:** „Licząc od 11 stycznia 2027 r., razem wrócicie po czterech tygodniach. Jeśli Paweł zacznie po Tobie, ktoś z Was będzie w domu z Olą przez osiem tygodni. Zobacz obie osie”. | Obie osie i kwoty są widoczne jednocześnie. Przycisk „Skąd ta kwota?” rozwija stawkę i dni dla każdej osoby. |
| 3. Wybór | **Marta:** „Zależy nam na pierwszym miesiącu razem. Wybieram wspólny start”. **Zusik:** „Oboje planujecie od 11 stycznia do 7 lutego. Twój wniosek do Studia Lipa trzeba złożyć do 21 grudnia. Przygotować go?” **Marta:** „Tak”. | Po wyborze powstaje szkic Marty. Na mapie pojawia się także osobne zadanie Pawła z tym samym terminem. Paweł przygotowuje i zatwierdza dokument dla własnego pracodawcy. |
| 4. Oświadczenie | **Zusik:** „Czy potwierdzasz, że Paweł zamierza korzystać z rodzicielskiego od 11 stycznia do 7 lutego 2027 r.?” **Marta:** „Tak, dokładnie w tych dniach”. | Przy wniosku pojawia się oświadczenie Marty z tym okresem. Pole zmienia stan z „do potwierdzenia” na „potwierdzone przez Ciebie”. |
| 5. Dokument dziecka | **Zusik:** „Czy Studio Lipa ma już odpis aktu urodzenia Oli w Twoich aktach osobowych?” **Marta:** „Nie. Mam kopię tutaj”. Wybiera „Dodaj z plików Oli” i wskazuje kopię skróconego odpisu. | Po dołączeniu pliku widać jego podgląd, nazwę oraz „Komplet do sprawdzenia”. Gdy dokument jest już w aktach osobowych, aplikacja pomija ponowne dołączanie. |
| 6. Zatwierdzenie | **Zusik:** „Twój wniosek obejmuje 28 dni. Dołączone są oświadczenie o okresie Pawła i kopia odpisu. Sprawdź całość”. Marta otwiera podgląd i wybiera „Zatwierdź”, a następnie osobno „Przekaż pracodawcy w symulacji”. | Do chwili przekazania karta pokazuje „Złóż do 21 grudnia 2026”. Po powodzeniu widać odbiorcę i datę przekazania. Zadanie Pawła ma nadal własny status. |

| Wynik kalkulatora | A · Marta, potem Paweł | B · oboje od tego samego dnia |
|---|---|---|
| Marta | 11.01–07.02.2027 · 28 × 140 zł = 3920 zł | 11.01–07.02.2027 · 3920 zł |
| Paweł | 08.02–07.03.2027 · 28 × 105 zł = 2940 zł | 11.01–07.02.2027 · 2940 zł |
| Dni, w których co najmniej jedno z nich opiekuje się Olą | 56, w tym 0 razem | 28, wszystkie razem |
| Łączny zasiłek brutto za te odcinki | 6860 zł | 6860 zł |
| Najpóźniejsze daty złożenia wniosków | Marta 21.12.2026 · Paweł 18.01.2027 | Oboje 21.12.2026, każde u swojego pracodawcy |

**Jeśli Marta odkłada wysyłkę.** Mówi „Przypomnij mi w piątek przed terminem”. Zusik pokazuje „Piątek, 18 grudnia 2026 · przypomnienie w planie Marty” i obok „Poniedziałek, 21 grudnia · ostatni dzień na złożenie”. Marta zatwierdza datę. Wcześniejsze przekazanie wniosku w symulacji zamyka jej przypomnienie. Zadanie Pawła pozostaje otwarte. Zmiana początku urlopu przelicza termin i oznacza przygotowany wcześniej szkic do sprawdzenia.

**Gotowy dokument Marty widoczny w demo.** W nagłówku „Wniosek o udzielenie części urlopu rodzicielskiego”, adresat „Studio Lipa”, wnioskodawczyni „Marta Lis”. Treść: „Wnoszę o udzielenie mi urlopu rodzicielskiego w związku z urodzeniem córki Oli Lis, od 11 stycznia do 7 lutego 2027 r. włącznie. Dotychczas żadne z nas nie korzystało z urlopu rodzicielskiego ani z zasiłku za odpowiadający mu okres. Wykorzystano 0 dni w 0 częściach”. Oświadczenie Marty: „Drugi rodzic, Paweł Lis, zamierza korzystać z urlopu rodzicielskiego od 11 stycznia do 7 lutego 2027 r.” Pod treścią są kopia skróconego odpisu z profilu dziecka oraz data i miejsce na podpis w wersji papierowej. Termin liczymy 21 dni przed początkiem urlopu każdej osoby. [Rozporządzenie, § 15 i § 22](https://eli.gov.pl/api/acts/DU/2025/322/text.pdf) · [Ministerstwo Rodziny o terminie i wspólnym korzystaniu](https://www.gov.pl/web/rodzina/urlop-rodzicielski)

### 2. Tak · tata prowadzący działalność przygotowuje ZAM do ZUS

**Punkt wyjścia.** W aktach „Józef Lu_3” na s. 1 potwierdzono przyznanie zasiłku za okres ojcowski. W demie bierzemy ten rodzaj świadczenia. Działalność ojca, brak zadłużenia, wiek dziecka i poniższe daty są założeniami nowego przykładu. Kamil wychowuje biologicznego syna urodzonego 20 maja 2026 r. Profil demonstracyjny potwierdza dobrowolne ubezpieczenie chorobowe obejmujące cały wybrany okres i brak zaległości. Kamil uprzednio nie korzystał z okresu ojcowskiego. [ZUS o prawie do okresu ojcowskiego](https://bip.zus.pl/pl/web/guest/swiadczenia/zasilki/zasilek-macierzynski/prawo-do-zasilku-i-okres-przyslugiwania/za-okres-dodatkowego-urlopu-ojcowskiego) · [Wysokość zasiłku](https://www.zus.pl/pl/swiadczenia/zasilki/zasilek-macierzynski/wysokosc)

| Moment | Rozmowa lub czynność rodzica | Ekran |
|---|---|---|
| Prawo | **Kamil:** „Prowadzę firmę. Chcę przez tydzień zająć się synem. Czy przysługuje mi wypłata?” **Zusik:** „Tak. Przy potwierdzonych danych możesz otrzymać zasiłek za okres ojcowski. Wniosek złożysz w ZUS. Kiedy chcesz zacząć?” | Karta wyjaśnia wynik przez ubezpieczenie, wiek syna i dostępny okres. Wysokość wynosi 100% podstawy za wybrane dni. |
| Wybór | **Kamil:** „Od 8 grudnia. Jeden tydzień, drugi zostawię na później”. **Zusik:** „Wpisuję 8–14 grudnia 2026 r. To pierwsza część. Złóż wniosek do 7 grudnia, przed początkiem tego okresu”. | Otwiera się aktualny ZAM. Jest zaznaczony okres ojcowski, daty oraz część 1. Obok pojawia się „Do ZUS · do 7.12.2026”. |
| Wspólne wypełnianie | **Zusik:** „Czy pobierałeś już z innego tytułu zasiłek za okres ojcowski na to dziecko?” **Kamil:** „Nie”. Sprawdza dane drugiego rodzica, syna i płatnika pobrane z fikcyjnego profilu. Wybiera wypłatę na zweryfikowany w demo rachunek. | W ZAM widać odpowiedź „Nie” przy oświadczeniu, dane wnioskodawcy i firmy, ubezpieczenie, urodzenie dziecka, dane rodziny, okres oraz wybraną formę wypłaty. Prywatne identyfikatory w podsumowaniu są zamaskowane. |
| Gotowy wniosek | **Zusik:** „Gotowe do sprawdzenia. ZAM, pierwsza część, siedem dni, odbiorca ZUS. Otwórz podgląd”. Kamil sprawdza treść, zatwierdza oświadczenie i wybiera „Wyślij w symulacji”. | Do wysłania widzi termin na karcie. Po symulacji widzi potwierdzenie i datę. W tym krajowym przykładzie dane urodzenia są kompletne, a przedsiębiorca nie musi dodatkowo składać zaświadczenia płatnika. |

Podstawą terminu jest początek okresu pobierania zasiłku przez ubezpieczonego, który nie jest pracownikiem. W archiwalnej sprawie może wystąpić ZAO. Dla nowego wniosku wykorzystujemy aktualny ZAM. [ZUS o dokumentach i terminie](https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/niezbedne-dokumenty) · [Urzędowy druk ZAM](https://www.zus.pl/-/wniosek-zas-54-1)

**Jeśli Kamil zapisze szkic.** Na jego prośbę „Przypomnij mi 4 grudnia” karta w planie pokazuje dwie daty: przypomnienie 4 grudnia i złożenie do 7 grudnia. Otwiera ten sam wypełniony ZAM. Sam zapis szkicu nie oznacza, że wniosek dotarł do ZUS.

### 3. Nie · chorobowe w ciąży przy potwierdzonym braku ubezpieczenia

**Punkt wyjścia.** Sprawa „Dagmara Chrz_2” dotyczy odmowy chorobowego w ciąży. Na s. 13 akt znajduje się ustalenie o niepodleganiu ubezpieczeniom jako pracownik u wskazanego płatnika. Na potrzeby demonstracji przyjmujemy, że ustalenie obejmuje cały badany okres oraz że wykluczono prawo z wcześniejszego ubezpieczenia. [ZUS o prawie do chorobowego, również po ustaniu ubezpieczenia](https://www.zus.pl/swiadczenia/zasilki/zasilek-chorobowy/z-ubezpieczenia-chorobowego/prawo-do-zasilku-i-okres-przyslugiwania)

**Rodzic:** „Mam zwolnienie w ciąży. Czy za te dni dostanę zasiłek chorobowy?” **Zusik:** „W dokumentach jest potwierdzenie, że w tym okresie nie podlegałaś ubezpieczeniu chorobowemu u tego pracodawcy. Czy miałaś wtedy inny tytuł do ubezpieczenia?” **Rodzic:** „Nie, to było moje jedyne zatrudnienie”. **Zusik:** „W tej sprawie za wskazane dni zasiłek chorobowy Ci nie przysługuje. Zwolnienie potwierdza niezdolność do pracy. Dokument ubezpieczeniowy potwierdza brak ochrony za ten okres”.

**Ekran końcowy.** Jeden komunikat, okres objęty sprawą i „Pokaż dokument, na którym oparto odpowiedź · s. 13”. Rozmowa kończy się bez szkicu, zadania i przypomnienia. Gdyby po imporcie brakowało potwierdzenia albo pojawił się inny tytuł, właściwy stan to „trzeba sprawdzić ubezpieczenie”.

## Świadczenia, o które rodzic może zapytać Zusika

Przegląd dotyczy ciąży, narodzin, adopcji i opieki nad dzieckiem. Trzy scenariusze powyżej służą prezentacji. Poniższe pozycje wyznaczają szerszy zakres rozpoznawania intencji rodzica.

| Sytuacja rodzica | Co sprawdza przewodnik i dlaczego |
|---|---|
| „Jestem na zwolnieniu w ciąży” | Zasiłek chorobowy, tytuł i okres ochrony, ewentualne prawo po ustaniu ubezpieczenia oraz właściwego płatnika. Po wyczerpaniu okresu zasiłkowego osobną ścieżką jest świadczenie rehabilitacyjne, gdy dalsze leczenie lub rehabilitacja rokują odzyskanie zdolności do pracy. [Chorobowe](https://www.zus.pl/swiadczenia/zasilki/zasilek-chorobowy/z-ubezpieczenia-chorobowego/prawo-do-zasilku-i-okres-przyslugiwania) · [Rehabilitacyjne](https://www.zus.pl/swiadczenia/zasilki/swiadczenie-rehabilitacyjne/z-ubezpieczenia-chorobowego/prawo-do-swiadczenia-i-okres-przyslugiwania) |
| „W ciąży straciłam pracę” | W określonych przypadkach ustania zatrudnienia w ciąży występuje **zasiłek w wysokości zasiłku macierzyńskiego** do dnia porodu. Znaczenie mają okoliczności ustania zatrudnienia i dokumenty, a po porodzie rozpatruje się prawo do zasiłku macierzyńskiego. [ZUS – wymagane dokumenty](https://www.zus.pl/pl/swiadczenia/zasilki/zasilek-macierzynski/niezbedne-dokumenty) |
| „Urodziło się dziecko”, „adoptujemy”, „dziecko było w szpitalu” | Zasiłek macierzyński obejmuje odpowiednio okres macierzyński, na warunkach macierzyńskiego, rodzicielski, ojcowski i uzupełniający. Przy wcześniactwie lub hospitalizacji decydują konkretne dane dziecka i pobytu. Adopcja i niezawodowa piecza mają własne wymagania dokumentowe. [ZUS – komu przysługuje](https://bip.zus.pl/web/guest/swiadczenia/zasilki/zasilek-macierzynski/komu-przysluguje) · [Dokumenty dla różnych sytuacji](https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/niezbedne-dokumenty) |
| „Muszę zostać w domu, bo dziecko zachorowało” | Zasiłek opiekuńczy. Pytania dotyczą m.in. wieku dziecka, przyczyny opieki i dotychczas wykorzystanych dni. Od 24.10.2026 nowy Z-15 zastąpił Z-15a i Z-15b. [Warunki ZUS](https://www.zus.pl/swiadczenia/zasilki/zasilek-opiekunczy/prawo-do-zasilku-i-okres-przyslugiwania) · [Aktualny Z-15](https://www.zus.pl/-/oswiadczenie-zus-z-15) |
| „Czy po narodzinach mogę dostać 800+?” | Świadczenie wychowawcze ma oddzielny wniosek i okres świadczeniowy. Przy noworodku ważna jest data urodzenia. Złożenie w ciągu 3 miesięcy pozwala ustalić prawo od dnia narodzin. [800+ w ZUS](https://www.zus.pl/pl/swiadczenia/swiadczenia-dla-rodzin/swiadczenie-wychowawcze-800-plus) |
| „Wracam do pracy”, „dziecko idzie do żłobka” | Program Aktywny Rodzic ma trzy świadczenia. „Aktywni rodzice w pracy” uwzględnia aktywność zawodową. „Aktywnie w żłobku” zależy od korzystania z uprawnionej opieki i opłaty za pobyt. „Aktywnie w domu” dotyczy wieku 12–35 miesięcy. Na jedno dziecko za ten sam miesiąc można pobierać jedno świadczenie z programu. [Program ZUS](https://www.zus.pl/aktywnyrodzic) · [Pytania rodziców](https://www.zus.pl/pl/baza-wiedzy/aktywnyrodzic/pytania-i-odpowiedzi) |
| „Dziecko zaczyna rok szkolny” | Dobry Start to 300 zł na wyprawkę dla uprawnionego ucznia. Standardowy nabór trwa od 1 lipca do 30 listopada. Ta propozycja pasuje do profilu ucznia, a nie noworodka. [Dobry Start w ZUS](https://bip.zus.pl/pl/web/guest/swiadczenia/swiadczenia-dla-rodzin/program-dobry-start) |
| „A świadczenie rodzicielskie albo 4000 zł Za życiem?” | Zusik wskazuje właściwy organ gminy. Odróżnia jednorazowe świadczenie od wpływu zaświadczenia „Za życiem” na wymiar urlopu rodzicielskiego. [Świadczenie rodzicielskie](https://www.gov.pl/web/gov/uzyskaj-swiadczenie-rodzicielskie) · [Jednorazowe 4000 zł](https://www.gov.pl/web/gov/uzyskaj-jednorazowe-swiadczenie-w-wysokosci-4000-zl) |
