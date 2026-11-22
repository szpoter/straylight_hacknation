# Rozmowa o wgranej sprawie

Rodzic otwiera ZUSika na stronie lub z planu rodziny. Przeciąga PDF albo wybiera go klawiaturą i od razu dostaje odpowiedź na własne pytanie, także gdy poszczególne świadczenia dotyczą różnych okresów. Może zobaczyć źródło kwoty, poprawić jeden fakt i wrócić po odświeżeniu. Sam załącznik wystarcza do rozpoczęcia analizy. Bez pytania ZUSik domyślnie sprawdza, o co zawnioskowano, prawo do świadczenia, okres i wysokość w zakresie widocznych danych.

## Istniejące miejsca integracji

- Ogólną i rodzinną rozmowę renderują [ParentChat](../../app/src/features/chat/parent-chat.tsx) i [CaseChatWindow](../../app/src/features/chat/case-chat-window.tsx). Rodzinny przycisk przekazuje plan i opcjonalny krok. [Composer](../../app/src/features/chat/composer.tsx) ogólnej rozmowy ma wybór własnego PDF. [Obsługa dokumentu](../../app/src/features/chat/case-file-upload.tsx) czyta strony lokalnie, wyszukuje pasujące fragmenty i otwiera źródło. Obecnie zmiana dokumentu lub odświeżenie wymaga ponownego wczytania. Trwałe wersjonowanie faktów i automatyczny rachunek z pliku opisano w kolejnych etapach. [Workspace Marty](../../app/src/features/chat/workspace.tsx) korzysta z tego odpisu przy wniosku.
- [Model rozmowy](../../app/src/lib/zusik/conversation.ts) identyfikuje scenariusze Marta, Kamil, chorobowe i ogólny. Rodzinny kontekst w [family-chat.ts](../../app/src/lib/zusik/family-chat.ts) sprawdza identyfikator planu i publicznego tematu kroku. Powiązanie z planem ani treść nagłówka ekranu nie potwierdzają danych ubezpieczenia osoby z PDF-u.
- [Endpoint pytań](../../app/src/app/api/zusik/ask/route.ts) obsługuje priorytet sesji z podpisanego cookie, kontrolę pochodzenia, `requestId`, strumień i skutki ponawiania. [Magazyn tur](../../app/src/lib/zusik/turn-store.ts) zapisuje także treść pytania i odpowiedzi. [AskService](../../app/src/lib/zusik/ask-service.ts) obsługuje wyszukiwanie publiczne, cytaty, historię, podpowiadanie tematu i szczególny przypadek Marty dla pytań o pochodzenie danych. [Kontrakt UI](../../app/src/features/chat/contract.ts) filtruje twierdzenia odnoszące się do nieistniejących źródeł prawnych.
- [Obsługa sesji](../../app/src/lib/zusik/session.ts) oraz [przepływ klienta](../../app/src/features/chat/use-zusik-case.ts) stanowią punkt wyjścia dla izolacji i wznowienia. Backend aplikacji używa Node na Vercelu oraz Postgresa. Do tego planu wystarcza obecny stos i lokalny OCR z [etapu dokumentów](02-dokumenty-i-ocr.md).

## Kolejność pracy

### 1. Jedno wejście z obydwu odmian czatu

**Odbiór ekranu startowego.** W pustej rozmowie, tuż nad polem wiadomości, widoczne są trzy opcjonalne przyciski. Każdy wstawia pełne pytanie i uruchamia jego wysłanie tą samą ścieżką co własny tekst. Juror widzi pytanie jako swoją wiadomość, pozostaje w tym samym czacie i może dopytać. Nagłówek i start nie zawierają wyboru imiennej rodziny.

| Przycisk | Pytanie wysyłane jednym kliknięciem |
|---|---|
| Sprawdź ubezpieczenie | Jak sprawdzić, czy mam ubezpieczenie chorobowe na dzień, od którego ubiegam się o zasiłek? |
| Oblicz wysokość zasiłku | Jak obliczyć wysokość mojego zasiłku macierzyńskiego i jakie dane o wynagrodzeniu mam podać? |
| Sprawdź dokumenty i terminy | Jakie dokumenty są potrzebne do zasiłku macierzyńskiego, gdzie je złożyć i w jakim terminie? |

1. Własny tekst i spinacz są dostępne już podczas pierwszej wizyty. Przy własnym pliku odseparować treść od zalogowanego profilu. Pytanie bez danych prowadzi do wyjaśnienia lub wskazania potrzebnych informacji. Kliknięcie sugestii nigdy nie jest dowodem zarobków ani ubezpieczenia.
2. Plik z pytaniem zachowuje treść pytania do chwili zakończenia odczytu. Sam plik rozpoczyna analizę wgranej sprawy. Przy kolejnym pliku rodzic określa, czy uzupełnia obecną sprawę. Docelowo odczyt oraz podgląd dowodu muszą działać także po przerwaniu i wznowieniu według tabeli operacji poniżej.
3. Z pytania o macierzyński przy kompletnych dowodach wywołać ten sam silnik co na stronie kalkulatora. Adapter potwierdza kompletność, przelicza jednostki i zachowuje identyfikatory stron. Z pustej rozmowy można zapytać, co potrzeba do obliczeń. Link prowadzi do /app/kalkulator, który otwiera ręczną symulację bez logowania i przykładowych kwot. Rodzinny /kalkulator nadal służy do pracy z danymi wybranego planu. Stare adresy scenariuszy umożliwiają wznowienie ich dotychczasowych przebiegów. [Silnik rachunku](../../app/src/lib/rules/maternity.ts) · [Plan adaptera](04-reguly-i-kalkulator.md)

### 2. Jedna sprawa i jej historia

Proponowany kontrakt można zrealizować w nowej gałęzi obecnych usług. Nazwy operacji poniżej opisują zachowanie. Publiczny endpoint pytań i zapisane rozmowy zachowują dotychczasowy format w starych scenariuszach.

| Operacja | Wejście | Skutek i odpowiedź |
|---|---|---|
| Utwórz sprawę | Sesja, żądanie z kluczem idempotencji, opcjonalny zakres planu | Serwer nadaje losowe `caseId`, wiąże właściciela z sesją i zwraca wersję 1. Nazwisko i nazwa pliku pozostają lokalne. Zduplikowane żądanie zwraca tę samą sprawę. |
| Uzupełnij fakty | `caseId`, oczekiwana wersja, ID operacji, potwierdzone typowane zmiany i źródła | Serwer waliduje typy, okresy, podmiot oraz dozwolone pola. Jedna transakcja zapisuje nową wersję i unieważnia wyniki wyprowadzone ze zmienionych faktów. Równoczesna edycja zwraca bieżącą wersję. |
| Oceń sprawę / zadaj pytanie | `caseId`, wersja, `requestId`, intencja lub zminimalizowane pytanie, opcjonalne ID wcześniejszego wyniku | Po potwierdzeniu prawa sesji do sprawy serwer czyta tę wersję faktów i wybiera reguły. Zwraca listę `DecisionResult`, identyfikatory dowodów i cytowań prawa. Powtórzenie identycznego żądania zwraca utrwalony wynik. |
| Wznów | Sesja właściciela, `caseId`, ostatnia znana wersja | Widok wraca z listą świadczeń, wersjami odpowiedzi i otwartymi pytaniami. Podgląd źródła o niedostępnym lokalnym pliku proponuje wskazanie tego samego PDF. |
| Zamknij lub usuń | `caseId`, wersja i jawny wybór użytkownika | Zamknięcie zachowuje historię w okresie retencji. Usunięcie czyści własne tury, wyprowadzone wyniki, indeks odsyłaczy i lokalne dane dokumentu. Sesja wygasła wraca do pustego widoku, bez aktywnej sprawy poprzedniego użytkownika. |

Zakres wiadomości musi uwzględniać sesję i sprawę niezależnie od zakresu samego planu. Dla `caseId` przesłanego z przeglądarki serwer sprawdza właściciela przy każdej operacji, także przy ponowieniu oraz odczycie odsyłacza. Próba otwarcia cudzej lub nieistniejącej sprawy daje tę samą odpowiedź. Identyfikator wątku i zakres zapytania do bazy wyznacza serwer. Zapytań zawierających PESEL, adres lub wklejony fragment akt nie zapisywać wprost w tabeli ogólnych tur. Lokalnie zamienić prywatne treści na typowane fakty, role lub identyfikatory. Na serwerze odrzucać pola spoza dozwolonego schematu.

### 3. Wybór sposobu odpowiedzi

| Intencja rodzica | Wykonanie | Co zrobić przy niejednoznaczności |
|---|---|---|
| „Co mi przysługuje?”, „czy byłam ubezpieczona?”, „ile dostanę?” | Z `CaseFile` odczytać osobę, wnioski, daty i zakres potwierdzonych dowodów. Uruchomić reguły datowane dla poszczególnych świadczeń i okresów. Kwoty, dni i podstawy zwraca kalkulator. | Jeżeli są dwa możliwe wnioski, pokazać oba z osobnymi wynikami. O wyborze dopytać, gdy odpowiedź naprawdę zależy od wskazania osoby lub świadczenia. |
| „Skąd ta kwota?”, „pokaż stronę”, „dlaczego odmowa?” | Odczytać powiązania z ostatnim właściwym `DecisionResult`. Pokazać konkretną wartość, stronę lub wpis profilu, zastosowaną regułę i etapy obliczeń. | Rozróżnić dowód faktu od podstawy prawnej. Dla daty wpisanej przez rodzica pokazać źródło „podałaś/podałeś w rozmowie”. |
| „W lutym było jednak …”, „wgrywam poprawione zaświadczenie” | Zaproponować zmianę jednego faktu z okresem, rolą i źródłem. Użytkownik potwierdza wartość. Ponowić zależne obliczenia i pokazać różnicę między wersjami. | Jeśli pasują dwa okresy lub dwóch płatników, zapytać którego dotyczy zmiana. Zmiana stanu faktycznego nie może nastąpić po samej luźnej wzmiance. |
| „A gdyby drugi rodzic wziął urlop później?” | Oznaczyć jako osobny wariant symulacji, podać zmienione założenia oraz porównanie kwoty i czasu. | Brak stawki dla drugiego rodzica blokuje jego kwotę. Wariant nie modyfikuje ustaleń z akt. |
| Ogólne pytanie o przepis, dokument, termin | Poprosić istniejący publiczny RAG o wyjaśnienie tematu, z datą właściwą dla pytania. Tam, gdzie to możliwe, użyć zatwierdzonego źródła przypiętego do wyniku. | Publiczna odpowiedź informacyjna ma własne oznaczenie. Brak przepisu lub sprzeczne wersje źródeł pozostawiają część wymagającą przeglądu. |
| „Co ZUS napisał w tym piśmie?” | Lokalnie wskazać czytelny dokument i stronę z treścią rozstrzygnięcia. Oddzielić opis istniejącego pisma od samodzielnego ustalenia świadczenia. W teście kalkulacji końcowe rozstrzygnięcie pozostaje ukryte do końca obliczeń. | Niepewny odczyt wskazać wprost i poprosić o sprawdzenie wycinka. |

Silnik reguł jest jedynym źródłem statusu, okresów oraz kwot. Warstwa językowa może uprościć wyjaśnienie, o ile liczby, jednostki, daty i cytowania zgadzają się z zatwierdzonym wynikiem. Na początek użyć deterministycznych szablonów, które działają również podczas awarii modelu. Pytania do zewnętrznego modelu lub wyszukiwarki budować z publicznych tematów i przytoczonych przepisów. Tekst dokumentu to dane do odczytu. Instrukcje znalezione w PDF nie zmieniają sposobu działania czatu.

### 4. Karta odpowiedzi dla każdej pary świadczenie–okres

1. **Wynik i osoba**. Pierwsze zdanie mówi, jakiego świadczenia, osoby i okresu dotyczy wynik. `eligible` oznacza potwierdzone prawo w ocenianym zakresie. `ineligible` wymaga wskazania niespełnionej przesłanki i dowodu. `needs_information` wskazuje konkretny brak. `needs_review` wskazuje konflikt lub konieczność oceny. `unsupported` oznacza rozpoznaną sytuację bez wdrożonej reguły.
2. **Prawo, okres i kwota osobno**. Jeśli prawo jest ustalone, a podstawa jeszcze nie, rodzic widzi np. „Za ten okres warunek ubezpieczenia jest spełniony. Do wyliczenia kwoty brakuje wynagrodzenia za luty”. Przy rozstrzygnięciu pozytywnym podać daty włącznie, liczbę dni oraz kwotę z jednostką i oznaczeniem brutto/rodzaju wypłaty, jeśli wynika z obliczeń. Kwotę zero wyświetlać tylko jako rzeczywisty wynik według reguły.
3. **Rachunek**. Rozwinięcie pokazuje składniki podstawy, okresy, zastosowany procent, stawkę dzienną, dni i regułę zaokrąglenia w kolejności obliczeń. Nie sumować ponownie tych samych dni i składników lub wyników alternatywnych wariantów. Przy kilku okresach suma wyłącznie z potwierdzonych pozycji, z wyraźnym oznaczeniem niepełnej sumy.
4. **Dowody i prawo**. „Dane z dokumentu” otwiera właściwą stronę i zaznacza fragment. „Dane z profilu” wskazuje źródło, rodzaj symulacji i dzień, na który obowiązywał wpis. „Przepis” wskazuje wersję, datę obowiązywania i możliwy do otwarcia urzędowy fragment. Dodać osobny typ referencji do dowodu prywatnego. Publiczny link do ustawy nie dowodzi indywidualnej pensji.
5. **Następny krok**. Wybrać najkrótszą akcję odblokowującą konkretną część wyniku. Przykład syntetyczny: „Mam okres urlopu, ale w zaświadczeniu nie mogę odczytać wynagrodzenia za luty. Sprawdź wyróżniony wiersz albo dołącz poprawione zaświadczenie”. Brakujący dokument lub konflikt jednego z rodziców nie powinien ukrywać pewnego wyniku dla drugiego.

### 5. Kolejne wiadomości, awarie i przegląd historii

- Zapisywać przy każdej ustalonej odpowiedzi identyfikatory osoby, świadczenia i okresu, wersję sprawy, reguł i źródeł oraz identyfikatory wykorzystanych faktów. „Skąd to wiesz?” wskazuje poprzedni wynik danej sprawy. Wybór innego dziecka lub założenie drugiej sprawy tworzy odrębny kontekst.
- Przy zmianie faktu poprzednia odpowiedź zostaje oznaczona jako historyczna, wraz z datą. Nowa wersja wyjaśnia co i dlaczego się zmieniło. Odświeżenie lub powrót do czatu nie może przywrócić starego wyniku jako aktualnego. Odpowiedź w trakcie generowania, która wraca po zmianie wersji, jest historyczna lub wymaga ponownego wyliczenia.
- Podwójne kliknięcie, retry i ponowne połączenie odtwarzają ten sam skutek. Używać leasingu obecnego magazynu tur oraz osobnego klucza wersji sprawy dla operacji zapisu. Przy braku sieci zachować lokalny wybór pliku i szkic pytania. Po powrocie sieci wysłać typowane żądanie raz. Nie pokazywać niezweryfikowanego statusu ani kwoty w częściowej odpowiedzi strumieniowej.
- W trybie bez modelu i wyszukiwania podstawowy wynik reguły z przypiętą wersją źródła nadal jest dostępny. Jeśli zawiódł odczyt dokumentu, wyświetlić problem z odczytem. Jeśli wyliczenie nie jest obsługiwane, wyświetlić zakres ograniczenia. Jeśli awarii uległ sam zapis, zachować możliwość ponowienia bez komunikatu o odmowie świadczenia.

## Odbiór w przeglądarce i API

| Wejście i próba | Oczekiwane zachowanie |
|---|---|
| Strona główna → czat → sam PDF, bez nazwiska w profilu i bez wpisywania tekstu | Sprawa startuje, pyta o wymagane fakty, po potwierdzeniu ustala wyłącznie odpowiedni zakres. Reguła nie pobiera domyślnej pensji lub imienia Marty. |
| Plan rodziny → czat → PDF dotyczący innej osoby | System ujawnia różnicę ról, zachowuje odrębną sprawę i nie zmienia użytkownika w profilu. |
| Wniosek z pełnymi danymi → „Ile?”, „za jaki okres?”, „z której strony?” | Ten sam wynik, konkretne źródło liczby i dwa niezależne odsyłacze do dowodu i podstawy prawnej. Zmiana kolejności pytań nie zmienia rachunku. |
| Przyznanie i odmowa w różnych okresach jednego pakietu | Dwie odpowiedzi z właściwymi datami, warunkiem, statusem i wskazaniem dokumentu. |
| Wniosek bez historii ubezpieczenia, dokument z konfliktem, niewdrożony wyjątek | Odpowiednio `needs_information`, `needs_review`, `unsupported`. Zero błędnych odmów i wymyślonych kwot. Po dostarczeniu brakującego dowodu następuje ponowna ocena. |
| Dwa otwarte okna, refresh podczas oceny, odpowiedź po edycji płacy, ponowienie po błędzie | Jedna operacja na wersję, brak przenikania danych między sprawami, aktualny wynik i dostęp do historycznego wyjaśnienia. |
| Wygasła sesja, zgubiony plik, wyłączony model i przerwanie żądania | Czytelny komunikat na właściwym poziomie, możliwość kontynuacji w dostępnej części i brak wycieku treści w logach. |
| Ogólne pytanie bez akt oraz istniejące scenariusze Marty, Kamila i chorobowego | Zachowane dotychczasowe odpowiedzi, cytowania, korekty i odpis przy wniosku. Uruchomić m.in. testy chat-contract, ask, ask-stream, marta-chat i sickness-chat oraz skrypt przeglądarkowy z nową ścieżką importu. |

Demonstracja zamykająca ten etap ma zaczynać się z pustą sesją i plikiem o neutralnej nazwie. Przejść w zwykłym UI kolejno: wybór, odczyt, weryfikacja, wynik, wyjaśnienie, korekta, przeliczenie, odświeżenie. Dodatkowo uruchomić drugą sesję i wykazać izolację. W publicznych dowodach odbioru używać danych syntetycznych. Prywatne porównanie z losowo wybraną sprawą wykonać lokalnie zgodnie z zasadami walidacji projektu.
