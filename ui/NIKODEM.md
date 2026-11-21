# Nikodem — strona publiczna i wejście do demo

**UI spec do rozwijania.** Funkcje i uzgodnione teksty bierzesz z [SPEC.md](../SPEC.md). Każdy wiersz poniżej można rozbić na mniejsze elementy. Prowadź dla nich oddzielne rundy według [wspólnego workflow](WORKFLOW.md) i [DESIGN.md](../DESIGN.md).

| Kolejność rozmów | Decyzja wizualna |
| --- | --- |
| 1. Hero i podgląd „Moja sytuacja / Mój plan” | Hierarchia nagłówka i CTA, skala przykładu, widoczność etykiety „Przykład”, przełączenie zakładki, ułożenie na telefonie. |
| 2. Zusik przy przewijaniu | Miejsce postoju i dymka dla każdej sekcji, powrót w górę, statyczny wariant przy ograniczeniu ruchu. Wygląd postaci uzgodnij z Julianem. |
| 3. Sytuacje rodzinne, wsparcie, pytania rodziców | Kolejno opracuj wybór sytuacji, spokojny panel wsparcia i parę pytanie–fragment planu. Utrzymaj związek pytania z przykładem na telefonie. |
| 4. Film z Zusikiem | Miniatura, napisy, sterowanie i miejsce na dymek. Użyj kadrów rozmowy i szkicu od Juliana. |
| 5. Liczby, końcowe CTA, stopka | Czytelność czterech wartości z opisem i źródłem, potem powrót do tego samego logowania. |
| 6. mObywatel i dane z ZUS | Dwie odrębne sceny demo. Potwierdzenie fikcyjnego profilu, powrót, stan pobierania, sukces, ponowienie i ręczne uzupełnienie. Sukces przekazuje rodzica do pierwszego pytania u Macieja. |

**Pierwsza runda.** Obejrzyj zapowiedź korzyści i główną akcję w planerze urlopu, ruch wskaźnika w przykładzie Motion oraz zachowanie zakładek przy klawiaturze. Proponowany kierunek do oceny to wyraźne CTA po lewej i obsługiwana przez rodzica karta po prawej. Na telefonie CTA jest nad kartą. [Planer urlopu](https://www.gov.uk/plan-shared-parental-leave-pay) · [Motion — przełączenie zakładek](https://motion.dev/examples/react-smooth-tabs) · [W3C — Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)

**Prompt na start rozmowy**

> Projektuję jako Nikodem stronę publiczną i wejście do demo. Przeczytaj ui/NIKODEM.md, ui/WORKFLOW.md, DESIGN.md, SPEC.md i inspiracjeelementowistron.md. Zacznijmy od Hero. Ustal ze mną pierwsze wrażenie rodzica, potem otwórz kilka konkretnych inspiracji i daj mi linki, co w każdej obejrzeć oraz własną rekomendację. Poczekaj na mój wybór. Zapisuj zatwierdzone elementy tutaj, z układem na telefon i komputer oraz zachowaniem przycisków. Na końcu złożymy je w prototyp w Claude Design.

## Uzgodnione decyzje UI

### Hero · nagłówek, akcje wejścia i karta przykładu

| Pole | Ustalenie |
| --- | --- |
| Element, właściciel, data, status | Hero · nagłówek, akcje wejścia i karta przykładu. Nikodem. 21.11.2026. **Uzgodnione.** Zusik przy karcie to osobny element (punkt 2). Ekrany logowania i rejestracji to punkt 6. Szczegóły wizualne ustalamy w Claude Design według DESIGN.md. |
| Cel, treść i hierarchia | Rodzic w pierwszych sekundach rozumie, czego dotyczy przewodnik, i widzi, jak wejść. Kolejność czytania: nagłówek, opis, akcje, dopisek, karta z przykładem. Nagłówek „Co Ci przysługuje i co musisz załatwić?” i opis bez zmian według SPEC.md. **Akcje:** główna „Zaloguj się”, drugorzędna „Zarejestruj się”. Etykiety urzędowe, jasne, bez języka marketingowego. Pod akcjami dopisek: „Wersja demonstracyjna. Logowanie przez mObywatel i pobranie danych z ZUS są symulowane.” **Karta przykładu** bez zmian według SPEC.md: zakładki „Moja sytuacja” i „Mój plan”, stale widoczna etykieta „Przykład”, fikcyjny przypadek taty po narodzinach córki, na starcie otwarty „Mój plan”. Karta nie ma własnej akcji. |
| Referencje i wybór | Zapowiedź korzyści: [Försäkringskassan, Vänta barn-guiden](https://www.forsakringskassan.se/privatperson/foralder/vantar-barn/verktyg-och-tjanster-for-blivande-foraldrar). Bierzemy obietnicę „osobista lista zadań”, którą u nas pokazuje karta. Nie bierzemy bramki logowania przed pokazaniem czegokolwiek. Dopisek o symulacji w stylu [Kela, Perhevapaavertailu](https://perhevapaavertailu.kela.fi/?lang=en): jedno uczciwe zdanie. Odrzucony szkielet [planera GOV.UK](https://www.gov.uk/plan-shared-parental-leave-pay): akcja dopiero po długiej sekcji „Before you start”. Para akcji „logowanie / rejestracja” jak w eZUS. **Poprawki Nikodema:** akcje widoczne od razu; dwie akcje zamiast jednego przycisku „Sprawdź moją sytuację”; „Sprawdź moją sytuację” tylko na dole strony; karta przykładu zostaje jak w SPEC. |
| Wygląd i zachowanie | **Komputer:** po lewej nagłówek, opis, akcje i dopisek, po prawej karta. Obie akcje mieszczą się w pierwszym ekranie przy 1280 × 720. **Telefon:** nagłówek, opis, akcje jedna pod drugą na całą szerokość, dopisek, pod nimi karta. Obie akcje mieszczą się w pierwszym ekranie przy 360 × 640, karta może zaczynać się niżej. **Akcje:** komponent Button z DESIGN.md, „Zaloguj się” jako główny, „Zarejestruj się” jako drugorzędny, ze stanami spoczynku, hover, fokusu i wciśnięcia. „Zaloguj się” otwiera ekran logowania, „Zarejestruj się” ekran rejestracji (punkt 6). Po zakończeniu obu ścieżek rodzic trafia w to samo miejsce po zalogowaniu (zakres Macieja). **Zakładki karty:** przełączane kliknięciem, dotykiem i klawiaturą według [W3C APG Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/): Tab wchodzi na aktywną zakładkę, strzałki lewo/prawo przełączają z zawijaniem i od razu pokazują panel. Przy ograniczeniu ruchu zmiana bez animacji. **Klawiatura:** „Zaloguj się” jest pierwszym elementem fokusowalnym po nawigacji strony. |
| Odbiór i przekazanie | Na 360 × 640 i 1280 × 720 obie akcje widać bez przewijania. „Zaloguj się” prowadzi do ekranu logowania, „Zarejestruj się” do ekranu rejestracji. Karta przełącza się myszą, dotykiem i strzałkami, a etykieta „Przykład” nie znika. Następna scena: logowanie albo rejestracja (punkt 6). **Do przekazania Maciejowi:** stan strony głównej dla zalogowanego rodzica należy do jego zakresu. **Do zgłoszenia w SPEC.md:** w Hero zamiast przycisku „Sprawdź moją sytuację” są akcje „Zaloguj się” i „Zarejestruj się”. |

### Dół strony · przycisk „Sprawdź moją sytuację”

| Pole | Ustalenie |
| --- | --- |
| Element, właściciel, data, status | Dół strony · przycisk „Sprawdź moją sytuację”. Nikodem. 21.11.2026. **Uzgodnione (zachowanie).** Otoczenie przycisku i stopka to punkt 5. |
| Cel, treść i hierarchia | Jedyne miejsce na stronie z „Sprawdź moją sytuację”. Wyraźny przycisk główny na samym dole strony. |
| Referencje i wybór | Decyzja Nikodema z rundy Hero. |
| Wygląd i zachowanie | Kliknięcie otwiera panel z dwiema akcjami: „Zaloguj się” i „Zarejestruj się”, z tą samą hierarchią co w Hero. Każda prowadzi do tej samej ścieżki co w Hero (punkt 6). Po zakończeniu logowania lub rejestracji rodzic trafia do osobnej sekcji o swojej sytuacji (roboczo „Moja sytuacja”), a nie w domyślne miejsce po zalogowaniu. Panel można zamknąć bez wyboru, fokus wraca wtedy na przycisk. |
| Odbiór i przekazanie | Kliknij „Sprawdź moją sytuację”, wybierz logowanie, przejdź ścieżkę demo. Oczekiwany efekt: sekcja o sytuacji rodzica. **Do przekazania Maciejowi:** informacja, że rodzic wszedł przez „Sprawdź moją sytuację”, oraz nazwa i zawartość sekcji docelowej. **Do zgłoszenia w SPEC.md:** końcowy przycisk otwiera panel wyboru i ma inny punkt docelowy niż akcje w Hero. |

### Zusik przy przewijaniu (punkt 2)

| Pole | Ustalenie |
| --- | --- |
| Element, właściciel, data, status | Zusik przy przewijaniu. Nikodem. 21.11.2026. **Przekazane do etapu designu.** Decyzja Nikodema: wszystkie pytania punktu 2 rozstrzygamy w Claude Design, wygląd postaci z Julianem. Obowiązuje zachowanie już uzgodnione w SPEC.md (start przy karcie przykładu, ruch wzdłuż marginesu, jedno zdanie przy sekcji, przewinięcie w górę przywraca poprzedni dymek, przy ograniczonym ruchu ilustracja statyczna i wypowiedzi jako tekst przy sekcjach). |
| Pytania zostawione dla designu | Każde z propozycją agenta (P), bez zatwierdzenia. **Pierwsze wrażenie:** co rodzic zauważa najpierw, Zusika czy treść sekcji? P: treść sekcji, Zusik na drugim planie. **Interakcja przed logowaniem:** czy rodzic może coś zrobić z Zusikiem? P: tylko „Ukryj Zusika” do końca sesji, wypowiedzi zostają jako tekst. **Miejsca postoju:** czy poza czterema miejscami ze SPEC Zusik zatrzymuje się przy bento i przy przycisku „Sprawdź moją sytuację”? P: tak, przy stopce milczy, nowe zdania pisze Julian. **Moment zmiany dymka:** P: gdy nagłówek sekcji minie środek ekranu, przy szybkim przewijaniu pośrednie dymki pomijane. **Panel „Informacje i wsparcie”:** P: Zusik chowa się, dopóki panel jest otwarty. **Telefon:** P: Zusik nie podąża za przewijaniem, mała ilustracja przy nagłówku sekcji i zdanie pod nagłówkiem jako tekst. |
| Referencje do obejrzenia w designie | [Motion, ruch powiązany z przewijaniem](https://motion.dev/examples/vue-scroll-container), [galeria Motion](https://motion.dev/examples) (szukaj `scroll-linked` i `scroll-triggered`), [W3C, ograniczenie ruchu](https://www.w3.org/WAI/WCAG22/Techniques/css/C39.html). |

### Sytuacje rodzinne, wsparcie, pytania rodziców (punkt 3)

| Pole | Ustalenie |
| --- | --- |
| Element, właściciel, data, status | Sytuacje rodzinne, panel „Informacje i wsparcie”, pytania rodziców. Nikodem. 21.11.2026. **Uzgodnione (treść i zachowanie).** Wygląd kafli, układ i animacje rozwijania ustalamy w Claude Design. |
| Cel, treść i hierarchia | Rodzic najpierw widzi pytanie „Która sytuacja najlepiej Cię opisuje?” i pięć opcji, a jedyną czynnością jest wybranie swojej sytuacji i przeczytanie przykładu. Dalej osobny link do wsparcia, potem pytania rodziców. Kolejność i teksty według SPEC.md. |
| Referencje i wybór | Do obejrzenia w designie: [W3C, wzorzec Disclosure](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/), [The Component Gallery](https://component.gallery/components/), [Fundacja Ernesta, jak pomagamy](https://fundacjaernesta.pl/jak-pomagamy/), [Gov.pl, zgłoszenie urodzenia](https://www.gov.pl/web/gov/zglos-urodzenie-dziecka), [GOV.UK, sprawdzenie odpowiedzi](https://design-system.service.gov.uk/patterns/check-answers/). |
| Wygląd i zachowanie | **Sytuacje:** na starcie żadna nie jest rozwinięta. Kliknięcie rozwija przykład przy wybranej opcji, wybór innej zwija poprzedni, ponowne kliknięcie rozwiniętej sytuacji ją zwija. Przyciski komunikują stan rozwinięcia czytnikowi ekranu. **Wsparcie:** panel „Informacje i wsparcie” rozwija się w miejscu, pod linkiem, tak jak przykłady, bez okna nad stroną. **Pytania rodziców, komputer:** rodzic wybiera jedno pytanie, fragment planu pokazuje się obok, na starcie zaznaczone jest pierwsze pytanie. **Telefon:** fragment stoi bezpośrednio pod swoim pytaniem. **Przejście do filmu:** pod fragmentem ostatniego pytania („Czy muszę od nowa wpisywać dane do każdego wniosku?”) link „Zobacz, jak agent wypełnia wniosek”, który przewija do sekcji z filmem. |
| Odbiór i przekazanie | Wybierz dwie różne sytuacje (poprzednia się zwija), kliknij ponownie rozwiniętą (zwija się). Otwórz wsparcie (rozwija się pod linkiem). Przełącz pytania rodziców na komputerze i sprawdź układ pod pytaniem na telefonie. Link z ostatniego pytania przewija do filmu. Następna sekcja: film (punkt 4). |

### Film z Zusikiem (punkt 4)

| Pole | Ustalenie |
| --- | --- |
| Element, właściciel, data, status | Film „Agent AI pomoże Ci wypełnić wniosek”. Nikodem. 21.11.2026. **Uzgodnione (treść i zachowanie).** Wygląd miniatury, odtwarzacza i dymków ustalamy w Claude Design. Kadry rozmowy i szkicu dostarcza Julian. Scenariusz 30 s i teksty według SPEC.md. |
| Cel, treść i hierarchia | Rodzic najpierw widzi miniaturę z rozmową obok szkicu wniosku i przycisk „Zobacz, jak powstaje wniosek”. Jedyna czynność to uruchomienie filmu. Oznaczenie „Przykład na fikcyjnych danych” widoczne przez cały czas. |
| Referencje i wybór | Do obejrzenia w designie: [assistant-ui, przykłady](https://www.assistant-ui.com/examples), [Mobbin](https://mobbin.com/) (szukaj `AI assistant`), [Motion, przykłady](https://motion.dev/examples) (szukaj `highlight`, moment korekty 17 → 18 czerwca). |
| Wygląd i zachowanie | **Start:** film uruchamia rodzic, bez autoodtwarzania. **Napisy:** włączone od początku, można je wyłączyć. **Transkrypcja:** rozwijana pod odtwarzaczem, „Pokaż transkrypcję”. **Głos Zusika:** na start bez nagrania, wystarczą napisy i dymki. **Koniec filmu:** zostaje ostatnia klatka z podsumowaniem („Złóż do 11 czerwca”) i przycisk „Obejrzyj ponownie”, bez dodatkowych akcji. **Przewinięcie w trakcie:** gdy odtwarzacz zniknie z ekranu, film się zatrzymuje, a Zusik przechodzi do następnej sekcji. Sterowanie odtwarzaczem dostępne z klawiatury. |
| Odbiór i przekazanie | Uruchom film, sprawdź napisy od początku, rozwiń transkrypcję, przewiń w trakcie (film się zatrzymuje), obejrzyj do końca (ostatnia klatka i „Obejrzyj ponownie”). Następna sekcja: liczby (punkt 5). |

### Liczby, końcowy przycisk, stopka (punkt 5)

| Pole | Ustalenie |
| --- | --- |
| Element, właściciel, data, status | Siatka „Jak możecie podzielić się opieką?”, przycisk „Sprawdź moją sytuację”, stopka. Nikodem. 21.11.2026. **Uzgodnione (treść i zachowanie).** Wygląd siatki, kafli i stopki ustalamy w Claude Design. Zachowanie przycisku opisuje wpis „Dół strony”. |
| Cel, treść i hierarchia | Rodzic najpierw widzi największy kafel „340,3 tys. osób”, potem trzy mniejsze, w kolejności i z podpisami według SPEC.md. Liczby są do przeczytania. Jedyna czynność na tym odcinku to „Sprawdź moją sytuację”. Pod przyciskiem dopisek bez zmian: „Wersja demonstracyjna. Logowanie przez mObywatel i pobranie danych z ZUS są symulowane.” |
| Referencje i wybór | Do obejrzenia w designie: [Bento Grids](https://bentogrids.com/), [Tabler, podgląd](https://preview.tabler.io/), [GOV.UK, początek usługi](https://www.gov.uk/plan-shared-parental-leave-pay), [Gov.pl, przykład polskiej usługi](https://www.gov.pl/web/gov/zglos-urodzenie-dziecka). |
| Wygląd i zachowanie | **Źródła:** krótki link „Źródło” przy każdym kaflu, na telefonie zostaje przy swojej liczbie. **Kafle:** nieklikalne, poza linkiem do źródła. **Wsparcie w stopce:** link przewija stronę do sekcji sytuacji, rozwija panel „Informacje i wsparcie” i przenosi fokus na jego nagłówek. **Linki zewnętrzne** (ZUS, gov.pl, PIP, Fundacja Ernesta, źródła liczb): otwierają się w nowej karcie, z ikoną i opisem dla czytnika ekranu „otwiera się w nowej karcie”. Przy ograniczonym ruchu liczby widoczne od razu, bez animacji odliczania. |
| Odbiór i przekazanie | Na telefonie każda liczba ma przy sobie podpis i źródło. Źródło otwiera się w nowej karcie. Link do wsparcia w stopce rozwija panel w sekcji sytuacji, z fokusem na nagłówku. „Sprawdź moją sytuację” otwiera panel z „Zaloguj się” i „Zarejestruj się”. Następna scena: logowanie lub rejestracja (punkt 6). |

### Logowanie, rejestracja i dane z ZUS (punkt 6)

| Pole | Ustalenie |
| --- | --- |
| Element, właściciel, data, status | Wejście do demo: logowanie, rejestracja, login.gov.pl, mObywatel, wczytanie danych z ZUS. Nikodem. 21.11.2026. **Uzgodnione (przebieg, treść i zachowanie).** Wygląd ekranów i animacje przejść ustalamy w Claude Design. |
| Cel, treść i hierarchia | Ścieżka przypomina znane rodzicowi logowanie do eZUS, ale w demo prowadzi jedną drogą: login.gov.pl → Aplikacja mObywatel → wczytanie danych. Na każdym ekranie rodzic najpierw widzi jedyną aktywną drogę. Pozostałe metody są widoczne, nieaktywne, z podpisem „Niedostępne w wersji demonstracyjnej” przy każdej. **Uczciwość symulacji na każdym ekranie:** bez godła i logotypu gov.pl, w nagłówku nazwa przewodnika i stały pasek „Wersja demonstracyjna · nie podawaj prawdziwych danych”. Pola loginu i hasła nieaktywne, nie przyjmują tekstu. Kod QR to grafika zastępcza, która niczego nie koduje. Rodzic nie podaje PESEL-u ani danych logowania (SPEC.md). |
| Referencje i wybór | Wzór przebiegu: logowanie i rejestracja w eZUS oraz ekrany login.gov.pl ze zrzutów Nikodema z 21.11.2026 (lista metod logowania, ekran „Aplikacja mObywatel” z kodem QR, pięcioma krokami i licznikiem). Przejmujemy układ, kolejność i teksty instrukcji, bez oznaczeń rządowych. Do obejrzenia w designie: [shadcn/ui, bloki](https://ui.shadcn.com/blocks), [Mobbin](https://mobbin.com/) (szukaj `onboarding`). |
| Wygląd i zachowanie | **1. „Zaloguj się do eZUS”** (z „Zaloguj się” w Hero lub w panelu na dole strony). Opis „Wybierz metodę logowania do konta w eZUS.” Metody: login i hasło (nieaktywne), „Aplikacja mobilna ZUS · Skanuj kod QR za pomocą aplikacji mobilnej” (nieaktywna), „login.gov.pl · Profil zaufany, bankowość, mObywatel, e-Dowód lub eID” (aktywna). Link „Nie masz konta w eZUS?” prowadzi do ekranu 2. **2. Rejestracja** (z „Zarejestruj się”). „login.gov.pl · Potwierdzanie konta online za pomocą: profilu zaufanego, bankowości, aplikacji mObywatel, e-Dowodu lub eID” (aktywna). „E-wizyta lub wizyta w placówce ZUS · Potwierdzanie konta eZUS podczas wideorozmowy z pracownikiem ZUS lub w placówce ZUS” (nieaktywna). Pod spodem dwie informacje z linkami do zus.pl: „Chcesz reprezentować firmę lub inną osobę?” i „Jesteś asystentem medycznym w systemie RAM?”, otwierane w nowej karcie. **3. Wybór metody login.gov.pl.** „Zaloguj się do usługi ZUS”, „Wybierz sposób, w jaki chcesz to zrobić.” Aktywna tylko „Aplikacja mObywatel” z oznaczeniem „Polecany”. Bankowość elektroniczna, E-dowód, Profil zaufany i eID widoczne, nieaktywne. Dyskretny link „Przetestuj błąd pobierania danych”. **4. „Aplikacja mObywatel”.** Kod QR (grafika zastępcza), pięć kroków instrukcji, licznik „Kod QR wygaśnie za” od 5:00. Po upływie: „Kod wygasł” i „Wygeneruj nowy kod”. Przejście dalej: widoczny przycisk „Symuluj zeskanowanie kodu” pod kodem, na komputerze także skrót Spacja. Krok „Udostępnij dane” pomijamy. **5. Wczytywanie.** „Wczytujemy przykładowe dane z ZUS…” przez ok. 2 s. Sukces: rodzic jest zalogowany. Po wejściu z Hero trafia do pierwszego pytania onboardingu u Macieja, po wejściu przez „Sprawdź moją sytuację” do sekcji o swojej sytuacji. Błąd (po wyborze „Przetestuj błąd pobierania danych”): rodzic pozostaje zalogowany w demo i ma „Spróbuj ponownie” oraz „Wpisz dane samodzielnie”. **Rejestracja** kończy się tak samo jak logowanie, bez osobnego ekranu „konto założone”. **„Wróć”** na każdym ekranie cofa o jeden ekran. Z ekranów 1 i 2 wraca na stronę główną, do miejsca kliknięcia (Hero albo dół strony). **Sesja demo** trwa do zamknięcia karty, odświeżenie nie wylogowuje. **Klawiatura:** wszystkie aktywne elementy dostępne z klawiatury, nieaktywne metody ogłaszane czytnikowi jako niedostępne wraz z powodem. |
| Odbiór i przekazanie | Przejdź z Hero: „Zaloguj się” → login.gov.pl → Aplikacja mObywatel → „Symuluj zeskanowanie kodu” → wczytywanie → pierwsze pytanie onboardingu. Powtórz przez „Zarejestruj się” (ten sam koniec) i przez „Sprawdź moją sytuację” (sekcja o sytuacji). Sprawdź, że nieaktywne metody mają podpis i nie reagują, że „Wróć” cofa o jeden ekran, że na telefonie przejście działa przyciskiem, a „Przetestuj błąd pobierania danych” pokazuje obie akcje błędu. **Do przekazania Maciejowi:** stan po sukcesie (zalogowany profil demo, wczytane dane, źródło wejścia: Hero albo „Sprawdź moją sytuację”), sekcja o sytuacji jako cel z dołu strony, formularz po „Wpisz dane samodzielnie”, przycisk „Zacznij demo od nowa” po zalogowaniu. **Do zgłoszenia w SPEC.md:** jedna karta „Zaloguj się przez mObywatel” z przyciskiem „Potwierdź logowanie w demo” zastąpiona ścieżką eZUS → login.gov.pl → mObywatel; przejście nie jest już jednym kliknięciem. |

### Odpowiedzi Nikodema (21.11.2026)

Zestawienie pytań z rund i odpowiedzi. „R” oznacza wybór rekomendacji agenta. Szczegóły w odpowiednich wpisach powyżej.

#### Punkt 1 · Hero i wejście

| Pytanie | Odpowiedź |
| --- | --- |
| Co rodzic widzi najpierw i jaka jest kolejność czytania? | Nagłówek, opis, akcje, karta z przykładem. |
| Ile akcji w Hero i która jest główna? | Dwie: „Zaloguj się” (główna) i „Zarejestruj się” (drugorzędna). |
| Jaki charakter mają etykiety? | Urzędowe, jasne i jednoznaczne. |
| Czy akcje są widoczne bez przewijania? | Tak, na komputerze i telefonie. |
| Gdzie zostaje „Sprawdź moją sytuację”? | Tylko na samym dole strony, jako wyraźny przycisk. |
| Dokąd prowadzi „Sprawdź moją sytuację”? | Do panelu z „Zaloguj się” i „Zarejestruj się”. Po zakończeniu do osobnej sekcji o sytuacji rodzica. |
| Dokąd prowadzą logowanie i rejestracja z Hero? | Do tego samego miejsca po zalogowaniu (zakres Macieja). |
| Co widzi zalogowany rodzic na stronie głównej? | Poza zakresem Nikodema, przekazane Maciejowi. |
| Karta „Moja sytuacja / Mój plan” | Bez zmian według SPEC.md, na starcie „Mój plan”. |
| Czy karta ma własną akcję? | Nie (R). |
| Czy na telefonie karta może zaczynać się poniżej pierwszego ekranu? | Tak, pod akcjami (R). |
| Zapowiedź korzyści: inspiracja | Vänta barn-guiden zamiast planera GOV.UK, dopisek o symulacji w stylu Kela. |

#### Punkt 2 · Zusik przy przewijaniu

| Pytanie | Odpowiedź |
| --- | --- |
| Wszystkie pytania punktu 2 | Zostawione do etapu designu. Propozycje agenta zapisane we wpisie punktu 2. |

#### Punkt 3 · Sytuacje rodzinne, wsparcie, pytania rodziców

| Pytanie | Odpowiedź |
| --- | --- |
| Co rodzic zauważa najpierw? | Pytanie „Która sytuacja najlepiej Cię opisuje?” i pięć opcji (R). |
| Czy na starcie któraś sytuacja jest rozwinięta? | Żadna (R). |
| Ponowne kliknięcie rozwiniętej sytuacji | Zwija ją (R). |
| Gdzie otwiera się panel wsparcia? | W miejscu, pod linkiem (R). |
| Pytania rodziców na komputerze | Wybór jednego pytania, fragment obok, na starcie pierwsze (R). |
| Przejście do filmu | Link „Zobacz, jak agent wypełnia wniosek” pod ostatnim pytaniem (R). |

#### Punkt 4 · Film z Zusikiem

| Pytanie | Odpowiedź |
| --- | --- |
| Co rodzic zauważa najpierw? | Miniaturę i przycisk „Zobacz, jak powstaje wniosek” (R). |
| Napisy | Włączone od początku (R). |
| Transkrypcja | Rozwijana pod odtwarzaczem (R). |
| Głos Zusika | Na start bez nagrania (R). |
| Koniec filmu | Ostatnia klatka i „Obejrzyj ponownie” (R). |
| Przewinięcie w trakcie | Film się zatrzymuje (R). |

#### Punkt 5 · Liczby, końcowy przycisk, stopka

| Pytanie | Odpowiedź |
| --- | --- |
| Co rodzic zauważa najpierw? | Największy kafel „340,3 tys. osób” (R). |
| Źródła | Link „Źródło” przy każdym kaflu (R). |
| Czy kafle są klikalne? | Nie, poza źródłem (R). |
| Dopisek przy „Sprawdź moją sytuację” | Bez zmian (R). |
| Link do wsparcia w stopce | Przewija do sekcji sytuacji i rozwija panel (R). |
| Linki zewnętrzne | W nowej karcie, z oznaczeniem (R). |

#### Punkt 6 · Logowanie, rejestracja i dane z ZUS

| Pytanie | Odpowiedź |
| --- | --- |
| Przebieg | Według wytycznych Nikodema: eZUS (logowanie lub rejestracja) → login.gov.pl → Aplikacja mObywatel → wczytanie danych. Aktywna tylko ta droga. |
| Co rodzic zauważa najpierw? | Jedną aktywną drogę, pozostałe metody nieaktywne z podpisem (R). |
| Przejście dalej z ekranu QR | Przycisk „Symuluj zeskanowanie kodu”, na komputerze także Spacja (R). |
| Krok „Udostępnij dane” | Pomijamy (R). |
| Licznik kodu QR | Od 5:00, potem „Kod wygasł” i „Wygeneruj nowy kod” (R). |
| Czas wczytywania | Ok. 2 s (R). |
| Pokazanie błędu w demo | Link „Przetestuj błąd pobierania danych” (R). |
| „Wróć” | O jeden ekran, z pierwszego ekranu do miejsca kliknięcia (R). |
| Koniec rejestracji | Tak samo jak logowanie (R). |
| Sesja demo | Do zamknięcia karty (R). |
| „Wpisz dane samodzielnie” | Nikodem projektuje przejście, formularz należy do Macieja (R). |
| Animacje przejść | W etapie designu. |

### Do przekazania

**Maciejowi**
- Stan strony głównej dla zalogowanego rodzica.
- Stan po udanym logowaniu: zalogowany profil demo, wczytane dane, źródło wejścia (Hero albo „Sprawdź moją sytuację”).
- Sekcja o sytuacji rodzica (roboczo „Moja sytuacja”) jako cel przycisku z dołu strony: nazwa i zawartość.
- Formularz po „Wpisz dane samodzielnie”.
- Przycisk „Zacznij demo od nowa” po zalogowaniu.

**Julianowi**
- Wygląd Zusika i zdania przy sekcjach (pytania punktu 2), w tym ewentualne nowe zdania przy liczbach i przy „Sprawdź moją sytuację”.
- Kadry rozmowy i szkicu do filmu.

**Do poprawienia w SPEC.md**
- Hero: zamiast przycisku „Sprawdź moją sytuację” akcje „Zaloguj się” i „Zarejestruj się”.
- Dół strony: „Sprawdź moją sytuację” otwiera panel z logowaniem i rejestracją i prowadzi do sekcji o sytuacji rodzica.
- Logowanie: zamiast jednej karty „Zaloguj się przez mObywatel” z przyciskiem „Potwierdź logowanie w demo” ścieżka eZUS → login.gov.pl → mObywatel.

**Do Claude Design**
- DESIGN.md, ten plik i linki z wpisów.
- Pytania punktu 2 (Zusik przy przewijaniu).
- Wygląd wszystkich sekcji oraz animacje przejść między ekranami logowania.
