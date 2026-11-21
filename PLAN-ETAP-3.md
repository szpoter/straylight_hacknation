# Etap 3 · Chorobowe w ciąży · Jedno zadanie wykonawcze dla Claude’a

Wykonaj wszystkie trzy kroki w jednej sesji. Gotowy wynik to działająca sprawa w Zusiku: rodzic widzi rozstrzygnięcie za konkretny okres, może sprawdzić dowód w swoich dokumentach i przepis w źródle urzędowym. Zmiana dowodu ma zmienić wynik. Skorzystaj z [uzgodnionego scenariusza](TECH-SPEC-AGENT.md#scenariusze-demonstracji), [specyfikacji rodzica](SPEC-PO-LOGOWANIU.md) i [systemu wyglądu](DESIGN.md).

## Co możesz robić równolegle

Zacznij od syntetycznych dokumentów, funkcji oceny i testów. Twoje są moduł chorobowego w katalogu reguł, dane demonstracyjne tej sprawy, jej fragmenty publicznych przepisów i testy tej ścieżki. Marta dostarcza wyszukiwanie i cytowanie prawa oraz wspólny czat. Kamil dostarcza odczyt dokumentu, wskazanie strony i potwierdzanie odczytu. Na początku zapisz i podaj obu autorom granicę integracji: przyjmujesz potwierdzone fakty z odnośnikami do dowodów, zwracasz stan, okres, uzasadnienie i odnośniki do źródeł. Dopóki wspólny moduł jest rozwijany, sprawdzaj ten sam kontrakt na fikcyjnych danych. Podłącz rzeczywiste moduły przed odbiorem. Wspólne pliki grafu, sesji, czatu i migracji integruj z ich właścicielem. Zachowaj istniejące identyfikatory spraw i izolację użytkowników.

## Krok 1. Zbuduj oś czasu, na której można sprawdzić każdy fakt

1. Wzorcem sytuacji są akta konkursowe „Dagmara Chrz_2”. Według specyfikacji na stronie 13 jest ustalenie o niepodleganiu ubezpieczeniom jako pracownik u wskazanego płatnika. Zweryfikuj lokalnie stronę i zakres ustalenia. Specyfikacja osobno zakłada pełne pokrycie okresu i wykluczenie prawa z wcześniejszego ubezpieczenia. Oznacz te założenia jako dane demonstracyjne. Nie przypisuj ich automatycznie stronie 13.
2. Przygotuj odrębne, fikcyjne dowody: e-ZLA wskazujące niezdolność od 2 do 13 listopada 2026 r.; ustalenie dotyczące tytułu u pracodawcy A obejmujące badane dni i początek niezdolności; historię ubezpieczenia odpowiadającą na pytanie o wcześniejszy tytuł i ciągłość niezdolności. Te daty są wymyślone do testu. Do demonstracji użyj krótkiego syntetycznego pakietu z własną numeracją stron i zaznaczeniem właściwego miejsca.
3. Dla faktu zapisz osobę, rodzaj tytułu, płatnika, daty włącznie, źródło (dokument, profil demo lub odpowiedź rodzica), stronę lub lokalizator oraz stan potwierdzenia. Puste pole, zaprzeczenie rodzica i ustalenie z dokumentu to trzy różne wartości. Kolejne zaświadczenie może dotyczyć tej samej, ciągłej niezdolności. Zbieraj także początek tej ciągłości, jeśli jest potrzebny do oceny.
4. Oddziel prywatne dowody od publicznego korpusu. Do Qdrant trafiają wyłącznie źródła prawa i instrukcje. Rzeczywistych akt, identyfikatorów ani danych o zdrowiu nie wysyłaj do ARK, publicznego repo, telemetrii ani logów. W demonstracji stosuj syntetyczne dokumenty i dane. Wynik archiwalnej sprawy i słowo „odmowa” w nazwie pliku służą wyłącznie do późniejszej oceny.

**Odbiór kroku:** zmień nazwę PDF i usuń zdanie o końcowej odmowie. Zachowane ustalenia o tytule i okresie nadal można odczytać. Usuń zamiast tego ustalenie o tytule, a jego stan musi zmienić się na „brak dowodu”.

## Krok 2. Zaimplementuj decyzję i jedno pytanie o brakujący fakt

1. Dodaj czystą regułę TypeScript, np. `assessSicknessCase(facts, asOf)`. Wynik zawiera stan, badany okres, powody, identyfikatory użytych dowodów i podstaw prawnych oraz najwyżej jedno następne pytanie. Rozróżnij `not_entitled_for_period`, `needs_fact` i `requires_review`. Po potwierdzeniu potencjalnego tytułu zwróć sprawę do sprawdzenia prawa z tego tytułu. Pełne pozytywne wyliczenie nowej sprawy wykracza poza ten scenariusz.
2. Ustal, kiedy powstała niezdolność i czy trwa bez przerwy, co dokładnie wykluczono u pracodawcy A, czy są inne tytuły oraz czy trzeba zbadać prawo po ustaniu wcześniejszego ubezpieczenia. Wypowiedź „to była moja jedyna praca” może wyjaśnić inne równoległe zatrudnienie; sama nie wyklucza wcześniejszej ochrony, działalności ani innych tytułów. Pytaj prostym językiem o najbliższą lukę. Gdy rodzic nie wie, pokaż, jaki okres lub dokument trzeba sprawdzić.
3. Wynik negatywny dla całego okresu jest możliwy tylko w zweryfikowanym wariancie demonstracyjnym: początek i ciągłość są ustalone, dokument dotyczy właściwej osoby i tytułu, pokrywa istotne daty, inne możliwe tytuły zostały wyjaśnione, a zweryfikowana historia wyklucza drogę z wcześniejszej ochrony. W razie częściowego pokrycia, sprzeczności, niepewnego odczytu lub podstawy ochrony po ustaniu ubezpieczenia pokaż konkretny zakres do wyjaśnienia. Status „dokumentu nie odnaleziono” nie jest przesłanką odmowy.
4. W manifeście prawa zapisz aktualną dla ocenianego okresu wersję ustawy zasiłkowej. Art. 6 ust. 1 dotyczy powstania niezdolności podczas ubezpieczenia, art. 7 dotyczy wskazanych przypadków po ustaniu tytułu. Przy wariantach po ustaniu sprawdź również zakres art. 13 i odpowiednie objaśnienia ZUS. Art. 11 ust. 2 pkt 1 dotyczy wysokości świadczenia w ciąży, a kod B opisuje okoliczność medyczną. Oba nie zastępują ustalenia prawa. Sprawdź wersję przepisów na datę sprawy przed publikacją. [Ustawa zasiłkowa, tekst jednolity Dz.U. 2026 poz. 854](https://eli.gov.pl/api/acts/DU/2026/854/text.pdf) · [ZUS o okresie ubezpieczenia i prawie po jego ustaniu](https://www.zus.pl/pl/swiadczenia/zasilki/zasilek-chorobowy/z-ubezpieczenia-chorobowego/prawo-do-zasilku-i-okres-przyslugiwania)
5. RAG wyszukuje publiczne podstawy. Graf prowadzi rozmowę i zachowuje pytanie oraz odpowiedź. Decyzję podejmuje reguła na wersjonowanych faktach. Model może ubrać wynik w proste słowa; nie zmienia stanu i nie dopisuje podstawy. Przy braku zweryfikowanej wersji źródła pokaż „wymaga sprawdzenia”; przy awarii usługi pokaż błąd techniczny i zachowaj sprawę.

**Odbiór kroku:** wykonaj tabelę poniżej na rzeczywistej funkcji reguł. W raportach pokaż przyczynę wyniku i konkretne użyte daty oraz ID dowodów. Sama zgodność tekstu odpowiedzi nie wystarczy.

## Krok 3. Pokaż wynik w Zusiku i zamknij sprawę

1. Użyj sesji sprawy i trwałego zapisu w Neon. Po wyborze scenariusza rodzic pyta „Mam zwolnienie w ciąży. Czy za te dni dostanę zasiłek chorobowy?”. Jeśli jedyną luką jest inny tytuł, Zusik pyta „Czy w tym czasie miałaś jeszcze inne ubezpieczenie chorobowe, na przykład z drugiej pracy lub działalności?”. Przy odpowiedzi „tak” pyta o okres i źródło potwierdzenia. Przy „nie wiem” zostawia sprawę do sprawdzenia.
2. Przy kompletnym wariancie negatywnym pokaż np. „Z podanych informacji wynika, że za 2–13 listopada 2026 r. zasiłek chorobowy Ci nie przysługuje”. Niżej wyjaśnij, co ustalono o ochronie bieżącej i wcześniejszej. Daj dwa oddzielne odnośniki: „Zobacz dowód w swojej sprawie” do fragmentu dostępnego właścicielowi oraz „Sprawdź podstawę prawną” do urzędowej publikacji i jednostki. Prywatny podgląd kieruje do strony faktycznie zaimportowanego dokumentu. Ekran ma być oceną demonstracyjną. Zakończenie tej ścieżki nie tworzy wniosku, zadania, przypomnienia ani symulowanej wysyłki.
3. Po zmianie lub wycofaniu dowodu przelicz stan i zastąp widoczny stary wynik. Po F5 rodzic wraca do aktualnego pytania lub wyniku, bez drugiego wywołania oceny. Powtórzenie tej samej mutacji nie powiela historii ani efektów. Przy konflikcie wersji pobierz aktualną sprawę. Obca sesja nie odczytuje faktów ani strony dokumentu.
4. Zintegruj ścieżkę w pełnym widoku agenta. W czasie równoległych prac użyj testu integracyjnego wokół kontraktu; test nowej usługi sam w sobie nie zamyka etapu. Przed odbiorem przejdź scenę przez UI z nowej sesji oraz sprawdź, czy wcześniejsze przepływy Marty i Kamila dostępne na tej wersji nadal działają.

## Minimalny zestaw odbiorowy

| Zmień tylko ten element | Oczekiwany wynik |
|---|---|
| Pełny zestaw syntetyczny, inne tytuły wyjaśnione, historia wcześniejsza wyklucza ochronę | Wynik negatywny ograniczony do wskazanych dni, poprawny dowód i przepis, zero dokumentów do wysyłki |
| Usuń stronę z ustaleniem o tytule; pozostaw samo e-ZLA i nazwę pliku sugerującą odmowę | Brak podstawy do odmowy, prośba o potwierdzenie ubezpieczenia |
| Ustalenie obejmuje tylko część dni albo dotyczy innej osoby lub innego płatnika | Brak odmowy dla całego okresu; aplikacja wskazuje, których dat lub danych dotyczy luka |
| Rodzic zgłasza drugi tytuł; następnie osobno testuj odpowiedź „nie wiem” | Odpowiednio pytanie o ten tytuł albo prośba o sprawdzenie. Żaden wariant nie daje automatycznej odmowy |
| Jest wcześniejszy tytuł, a ciągła niezdolność zaczęła się przed jego ustaniem | Ocena ochrony po ustaniu, bez negatywnego werdyktu na podstawie obecnego pracodawcy |
| Niezdolność zaczęła się dopiero po ustaniu wcześniejszego tytułu albo brakuje dat do zbadania art. 7 | Odrębna ścieżka sprawdzenia lub jedno pytanie o datę; bez odmowy opartej wyłącznie na braku bieżącego tytułu |
| W dwóch dowodach różnią się daty; model podaje obcy lub nieistniejący przepis | Konflikt lub brak zweryfikowanej podstawy jest widoczny; błędny cytat nie przechodzi |
| Zmień nazwę pliku i ukryj końcowe rozstrzygnięcie, zachowując właściwe dowody | Ten sam wynik i te same podstawy |
| Po negatywnym wyniku dodaj drugi tytuł, wykonaj F5 i spróbuj otworzyć dowód z drugiej sesji | Stary wynik przestaje obowiązywać; F5 odtwarza nowy stan; druga sesja nie uzyskuje dostępu |

**Oddaj w jednej wiadomości końcowej:** adres działającej sceny, wynik testów reguł i testu przez UI, dwa kadry tej samej sprawy przed i po usunięciu kluczowego dowodu, wersje podstaw prawnych, wyniki builda i regresji oraz konkretne braki, jeśli któreś połączenie zespołowe pozostaje niedostępne. Pracuj do odbioru całego etapu zgodnie z instrukcjami repozytorium. Nie uruchamiaj nowego procesu wydania bez uzgodnienia z osobą integrującą main.
