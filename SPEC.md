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

**Proponowany przebieg.** Zusik zaczyna przy krawędzi karty przykładowego planu. Gdy rodzic przewija stronę, maskotka płynnie przesuwa się wzdłuż bocznego marginesu i zatrzymuje przy aktualnie czytanej sekcji. Tam pojawia się jedno krótkie zdanie, które można czytać we własnym tempie. Przewinięcie w górę przywraca komunikat poprzedniej sekcji.

| Miejsce | Proponowana wypowiedź Zusika |
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

**Propozycja do omówienia.** Nagłówek **„Co najtrudniej ustalić samodzielnie?”**. Trzy krótkie pary pokazują problem słowami rodzica i konkretną pomoc przewodnika.

| Pytanie rodzica | Co pokaże przewodnik |
| --- | --- |
| Czy muszę to złożyć, czy tylko wtedy, gdy chcę skorzystać z urlopu? | Przy każdej sprawie zobaczysz, czy jest obowiązkowa, czy wynika z Twojego wyboru. |
| Do kogo z tym wnioskiem? | Przy dokumencie znajdziesz adresata, np. pracodawcę, ZUS albo urząd stanu cywilnego. |
| Od którego dnia mam liczyć termin? | Obok terminu zobaczysz zdarzenie, od którego jest liczony, np. wystawienie karty urodzenia. |

Po sekcji z pytaniami proponujemy powtórzyć przycisk **„Sprawdź moją sytuację”** prowadzący do tego samego ekranu logowania. Rodzic może rozpocząć demonstrację także po przeczytaniu przykładów.
