# Zasiłkowy Przewodnik Przyszłego Rodzica

W tym pliku zapisujemy specyfikacje kolejnych części projektu w miarę ich omawiania. Po decyzji aktualizujemy odpowiednią sekcję i oznaczamy ją jako uzgodnioną.

## Hero — pierwszy ekran strony głównej

### Uzgodnione

Hero odpowiada na dwa pytania rodzica: „Co mi przysługuje?” i „Co muszę załatwić?”. Przewodnik ma wskazywać, które formalności są obowiązkowe w danej sytuacji, a które stają się potrzebne, jeśli rodzic chce skorzystać z wybranego świadczenia lub urlopu.

**Cel.** Osoba planująca rodzicielstwo, oczekująca dziecka lub już sprawująca opiekę powinna od razu wiedzieć, czego może się dowiedzieć i od czego zacząć. Język ma pasować również do ojca, rodzica adopcyjnego, rodziny zastępczej i osoby po stracie.

### Uzgodniona treść w kolejności czytania

| Element | Tekst na ekranie | Rola |
| --- | --- | --- |
| Nagłówek główny | Co Ci przysługuje i co musisz załatwić? | Rodzic widzi, że przewodnik obejmuje zarówno uprawnienia, jak i obowiązki. |
| Opis | Sprawdź, jakie formalności Cię dotyczą i z jakich zasiłków lub urlopów możesz skorzystać. Dowiesz się, co wypełnić, gdzie złożyć dokumenty i do kiedy. | Zapowiada odpowiedź dopasowaną do sytuacji rodzica. |
| Główny przycisk | Sprawdź moją sytuację | Prowadzi bezpośrednio do ekranu logowania przez mObywatel. W wersji konkursowej ekran ten pokazuje symulację logowania. |

### Proponowany wygląd — do omówienia

Na komputerze po lewej znajdują się nagłówek, opis i ciemnozielony przycisk na jasnym, ciepłym tle. Po prawej pokazujemy podgląd tego, co rodzic dostanie po odpowiedzi na pytania. Na telefonie podgląd trafia pod główny przycisk.

**Uzgodniony podgląd.** Po prawej stronie Hero znajduje się jedna karta z zakładkami „Moja sytuacja” i „Mój plan”. Obie pokazują fikcyjny przypadek oznaczony jako „Przykład”. Proponowany widok początkowy to plan z krótkim kontekstem „Po narodzinach dziecka”. Zakładki przełącza się kliknięciem, dotykiem lub klawiaturą, we własnym tempie.

- **Moja sytuacja** — „Urodziła nam się córka. Pracuję na etacie i chcę wziąć urlop ojcowski.” Przykład dotyczy narodzin w Polsce.
- **Mój plan** — dwa wiersze. „Do załatwienia · Zgłoś urodzenie córki. Online lub w USC, w ciągu 21 dni od wystawienia karty urodzenia.” Drugi wiersz dotyczy wybranego uprawnienia. „Jeśli chcesz wziąć urlop ojcowski · Złóż wniosek u pracodawcy co najmniej 7 dni przed rozpoczęciem urlopu.” [Zgłoszenie urodzenia](https://www.gov.pl/web/gov/zglos-urodzenie-dziecka) · [Urlop ojcowski](https://www.gov.pl/web/rodzina/urlop-ojcowski)

### Zusik podczas przewijania

**Uzgodnione.** Zusik, maskotka Przewodnika Rodzica, towarzyszy rodzicowi już od Hero. Podczas przewijania podąża za stroną i przy kolejnych sekcjach wyjaśnia, w czym przewodnik może pomóc.

**Uzgodniony przebieg.** Zusik zaczyna przy krawędzi karty przykładowego planu. Gdy rodzic przewija stronę, maskotka płynnie przesuwa się wzdłuż bocznego marginesu i zatrzymuje przy aktualnie czytanej sekcji. Tam pojawia się jedno krótkie zdanie, które można czytać we własnym tempie. Przewinięcie w górę przywraca komunikat poprzedniej sekcji.

| Miejsce | Uzgodniona wypowiedź Zusika |
| --- | --- |
| Przy podglądzie „Moja sytuacja / Mój plan” | „Spójrz na ten przykład. Tata chce wziąć urlop i od razu widzi, do kiedy złożyć wniosek.” |
| Przy sytuacjach rodzinnych | „Możesz tu podejrzeć kilka planów. Zobacz, jak różnią się sprawy przed porodem i po narodzinach.” |
| Przy pytaniach rodziców | „W planie zobaczysz, co trzeba załatwić, a co zależy od tego, czy chcesz skorzystać z urlopu lub zasiłku.” |

Na telefonie Zusik ma miejsce obok nagłówka sekcji, dzięki czemu treść i przyciski są widoczne także na małym ekranie. Przy włączonym ograniczeniu ruchu ilustracja jest statyczna, a te same wypowiedzi są dostępne jako tekst przy sekcjach. W panelu dotyczącym straty dziecka pierwszeństwo mają spokojna treść i informacje o wsparciu.

### Podstawa w materiałach konkursowych

Opis zadania (s. 11–15) wskazuje na indywidualną ocenę sytuacji, oszacowanie kwoty i okresu zasiłku, pomoc z dokumentami i terminami oraz możliwość sprawdzenia przykładów w responsywnej demonstracji. Regulamin (§ 2) odsyła do kryteriów w opisie zadania.

Na s. 13–14 opis zadania wymienia również symulację wypełniania wniosków o urlopy i świadczenia oraz złożenia wniosku o odpis aktu urodzenia. Zakres obowiązkowych formalności, które przewodnik pokaże w poszczególnych sytuacjach rodzinnych, pozostaje do ustalenia.

## Pod Hero — przykładowe sytuacje rodzinne

**Uzgodniony zakres.** Strona przed logowaniem pokazuje wartość przewodnika na gotowych przykładach. Wybór sytuacji zmienia wyłącznie widoczny przykład. Indywidualne sprawy, wyliczenia i wnioski należą do dalszej części produktu. W wersji konkursowej zarówno logowanie przez mObywatel, jak i automatyczne pobranie danych z ZUS po zalogowaniu są symulowane.

### Proponowana interakcja i treść

Po przewinięciu strony rodzic trafia na publiczną sekcję **„Która sytuacja najlepiej Cię opisuje?”** ze wskazówką **„Wybierz sytuację, żeby zobaczyć przykładowy plan.”** Wszystkie przykłady można przeglądać przed logowaniem.

Pokazujemy pięć przycisków i osobny, stale widoczny link do wsparcia. Kliknięcie rozwija przy wybranej opcji jeden krótki przykład. Pozostałe opcje są wciąż dostępne. Po zmianie wyboru poprzedni przykład się zwija. Przyciski komunikują stan rozwinięcia również czytnikowi ekranu.

| Opcja | Co pojawia się po kliknięciu |
| --- | --- |
| Planuję rodzicielstwo | „Rozważam zmianę pracy. Co warto sprawdzić wcześniej?” Przykładowy plan wskazuje, gdzie sprawdzić ciągłość ubezpieczenia i jakie informacje przygotować do oszacowania zasiłku. |
| Spodziewam się dziecka | „Chcę przygotować się do porodu.” Przykładowa lista ma dwie części. Przed porodem pokazuje sprawy do omówienia z pracodawcą, a po narodzinach — zgłoszenie urodzenia i dokumenty do wybranego urlopu. |
| Wychowuję dziecko | „Chcemy podzielić się opieką.” Przykładowa oś czasu pokazuje okresy opieki dwojga rodziców i moment złożenia wniosku u pracodawcy. |
| Przygotowuję się do adopcji | „Dziecko zamieszka z nami przed zakończeniem sprawy w sądzie.” Przykład pokazuje osobno datę przyjęcia dziecka i etap postępowania oraz pytania o dokumenty do urlopu i zasiłku. |
| Rodzina zastępcza | „Przyjmujemy dziecko do niezawodowej rodziny zastępczej.” Przykładowy plan zaczyna się od dokumentu potwierdzającego przyjęcie dziecka na wychowanie, a dalej pokazuje, jakie sprawy związane z opieką warto sprawdzić. |
| Potrzebuję wsparcia w trudnej sytuacji | Link rozwija spokojny panel „Informacje i wsparcie” z przykładowymi tematami: pobyt dziecka w szpitalu, strata dziecka, pomoc dla rodziny. Można go przeczytać bez opisywania swojej historii. |

## Pod przykładami — pytania rodziców

**Uzgodnione.** W tej sekcji pokazujemy pięć poniższych pytań rodziców. Proponowany nagłówek to **„Co najtrudniej ustalić samodzielnie?”**. Przy każdym pytaniu pokazujemy fragment przykładowego planu, na telefonie bezpośrednio pod pytaniem.

| Pytanie na stronie | Co pokazujemy obok na fikcyjnym przykładzie |
| --- | --- |
| Co po narodzinach dziecka muszę załatwić, a co zależy ode mnie? | Dwie pozycje z planu rodzica. „Do załatwienia — zgłoszenie urodzenia” i „Jeśli wybierasz urlop ojcowski — wniosek o urlop”. |
| Ten wniosek mam złożyć w ZUS czy w pracy? | Fragment karty dokumentu. „Wniosek o urlop ojcowski” i bezpośrednio pod tytułem „Złóż u pracodawcy”. |
| Chcę zacząć urlop 18 czerwca. Do kiedy złożyć wniosek? | Dwie daty z przykładowego planu pracownika. „11 czerwca — ostatni dzień na złożenie wniosku” i „18 czerwca — początek urlopu ojcowskiego”. Obok znajduje się wyjaśnienie, że termin liczymy wstecz od początku urlopu. [Urlop ojcowski](https://www.gov.pl/web/rodzina/urlop-ojcowski) |
| Co się zmieni w naszej wypłacie, jeśli podzielimy się opieką? | Porównanie dwóch przykładowych planów. W obu widać, kto w danym okresie opiekuje się dzieckiem, przez ile tygodni i jaka jest szacowana kwota zasiłku dla każdego rodzica. Wartości do demonstracji pochodzą ze sprawdzonego przykładu kalkulatora. |
| Czy muszę od nowa wpisywać dane do każdego wniosku? | Fragment szkicu z uzupełnionym polem i jednym pytaniem o brakującą datę. Ten przykład prowadzi do sekcji o agencie AI. |

## Pod pytaniami — agent AI pomaga przygotować wniosek

**Planowana funkcja.** Po zalogowaniu agent wykorzysta dostępne dane sprawy i odpowiedzi z rozmowy do przygotowania szkicu. Dopyta o brakujące informacje i decyzje rodzica. Przy pytaniu o zasady wyszuka odpowiedni fragment materiałów ZUS i wskaże źródło. Rodzic będzie mógł poprawić dane i zatwierdzić szkic. W projekcie rozważane są polskie modele PLLuM lub Bielik oraz wyszukiwanie w materiałach ZUS (RAG). [Rozmowa o agencie](thread://01a1f4d5-2dd5-77f0-b878-7bc6bdec55c6?hostId=local)

**Kierunek.** Pod nagłówkiem **„Agent AI pomoże Ci wypełnić wniosek”** osadzamy krótkie wideo dostępne przed logowaniem. Miniatura pokazuje rozmowę obok szkicu oraz przycisk „Zobacz, jak powstaje wniosek”. Gdy rodzic przewinie do odtwarzacza, Zusik zatrzymuje się przy jego rogu i lekko zachodzi na ramkę. W czasie odtwarzania jego dymki podążają za scenami filmu. Na ekranie przez cały czas widnieje oznaczenie „Przykład na fikcyjnych danych”.

### Proponowany scenariusz klipu (30 sekund)

| Czas | Rozmowa i szkic widoczne na ekranie | Dymek Zusika |
| --- | --- | --- |
| 0–6 s | Tata wybiera wniosek o urlop ojcowski do pracodawcy. W szkicu widać już imię i nazwisko z profilu demonstracyjnego. Pole „Początek urlopu” jest puste. | „Dane z profilu są już we wniosku.” |
| 6–15 s | Agent pyta „Od kiedy chcesz zacząć urlop?”. Tata odpowiada „Od 17 czerwca”. Tuż po odpowiedzi w polu „Początek urlopu” pojawia się **17 czerwca**. | „Ty wybierasz datę. Agent wpisuje ją do wniosku.” |
| 15–22 s | Tata pisze „Jednak od 18 czerwca”. W tym samym polu **17 czerwca** zmienia się na **18 czerwca**. Kamera pozostaje na formularzu, żeby dało się zauważyć zmianę. | „Możesz poprawić odpowiedź w rozmowie.” |
| 22–30 s | Szkic przechodzi do podsumowania. Widać nową datę, adresata „Pracodawca” i kolejny krok „Złóż do 11 czerwca”. Przy terminie jest link „Skąd ten termin?”. Tata sprawdza szkic. | „Sprawdź treść, termin i do kogo trafi wniosek.” |

Rozmowę i odpowiadające jej pole pokazujemy w tym samym kadrze. Na telefonie wypowiedź znajduje się bezpośrednio nad powiększonym polem. Dymek Zusika zajmuje margines, poza napisami, formularzem i sterowaniem odtwarzacza. Rodzic sam uruchamia film, może go zatrzymać i przeczytać napisy lub transkrypcję. Narracja Zusika, jeśli ją nagramy, korzysta z tego samego tekstu co dymki. [Zasada terminu wykorzystana w przykładzie](https://www.gov.pl/web/rodzina/urlop-ojcowski)

## Pod filmem — urlop rodzicielski w liczbach

**Proponowany nagłówek: „Jak możecie podzielić się opieką?”** W siatce bento największy kafel pokazuje skalę korzystania ze świadczenia w Polsce. Trzy mniejsze tłumaczą decyzje rodziców. Na telefonie kafle zachowują kolejność z tabeli. Pod liczbami umieszczamy linki do źródeł.

| Liczba na kaflu | Podpis dla rodzica |
| --- | --- |
| **340,3 tys. osób** | Tyle osób w Polsce pobierało w 2025 r. zasiłek macierzyński za okres urlopu rodzicielskiego. [Dane ZUS za I–XII 2025, tablica 8](https://www.zus.pl/documents/10182/167606/wst%C4%99pna_12_2025.pdf/5fd743fb-5d5a-c6f4-bf7d-468fdac1fca7#page=9) |
| **Do 41 tygodni** | Tyle urlopu rodzicielskiego mają standardowo do dyspozycji łącznie uprawnieni rodzice po urodzeniu jednego dziecka przy jednym porodzie. [Wymiar urlopu rodzicielskiego](https://www.gov.pl/web/rodzina/urlop-rodzicielski) |
| **Po 9 tygodni** | Z tej puli każde z uprawnionych rodziców ma własną część. Może ją wykorzystać tylko ten rodzic. [Część nieprzenoszalna](https://www.gov.pl/web/rodzina/urlop-rodzicielski) |
| **Do 5 części** | Na tyle okresów możecie rozłożyć urlop rodzicielski. W przykładowym planie zobaczycie je na jednej osi czasu. [Zasady podziału urlopu](https://www.gov.pl/web/rodzina/urlop-rodzicielski) |

Pod siatką proponujemy powtórzyć przycisk **„Sprawdź moją sytuację”** prowadzący do ekranu demonstracyjnego logowania przez mObywatel.

**Powiązanie z oceną konkursową.** Związek z wyzwaniem oraz kompletność projektu i doświadczenie użytkownika odpowiadają łącznie za 50% oceny. Klip wskazuje czynność wspieraną przez AI, pokazuje zmianę dokonaną przez rodzica i kończy się konkretnym dokumentem, terminem oraz adresatem. Bento wprowadza do porównywania wariantów opieki. Jury zweryfikuje wyliczenia w działającym demie na przykładowych wnioskach. Krótki klip można wykorzystać jako fragment wymaganego filmu o całym projekcie (maks. 3 minuty). [Opis zadania, s. 13–16](</Users/julian/Downloads/ZUS - Pełna treść zadania konkursowego.pdf>)
