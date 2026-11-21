# Zusik — specyfikacja techniczna agenta

**Projekt techniczny · 21 listopada 2026.** Priorytety wynikają z tego, co jury sprawdzi na własnym pliku i jakiej decyzji rodzic potrzebuje przed rozpoczęciem wniosku. [Opis zadania, s. 11–15](<Materiały hackathonowe/ZUS - Pełna treść zadania konkursowego.pdf>) · [Architektura demo i kryteria odbioru](#architektura-demo)

**Uzgodnione trzy scenariusze.** Rodzice porównują dwa warianty i przygotowują wniosek dla pracodawcy. Przedsiębiorca przygotowuje ZAM. Osoba pytająca o chorobowe otrzymuje wyjaśnienie braku prawa w udokumentowanej sytuacji. [Przebieg demonstracji](#scenariusze-demonstracji)

## Architektura demo

**Decyzja projektowa.** Jeden backend Next.js w TypeScript obsługuje czat, szkic i obliczenia. Korzysta z dwóch źródeł o różnych zadaniach. Z wersjonowanej biblioteki publicznych przepisów i instrukcji pobiera podstawę odpowiedzi. Z prywatnej sprawy pobiera fakty o konkretnej osobie. O tym, czy wynik da się policzyć, decyduje dostępność potwierdzonych faktów i przetestowanej reguły. Istniejący prototyp HTML jest wzorem zachowania. Pakiet aplikacji Next.js jest w `maskotka_kod`.

| Element | Wybór i zakres odpowiedzialności |
|---|---|
| Rozmowa | Next.js na Vercelu (Node.js), LangGraph.js dla etapów rozmowy i Zod dla danych z modelu. Vercel AI SDK służy do połączenia z zarządzanym API i warstwą czatu. Jeden graf steruje wykonaniem. Pierwszy dostawca do próby to Sherlock by CloudFerro, który publikuje Bielika 11B v3.0. Identyfikator modelu i obsługę formatu odpowiedzi potwierdzamy na koncie zespołu. Backend waliduje JSON i sam wywołuje dozwolone narzędzie. [Katalog Sherlock](https://sherlock.cloudferro.com/en) · [Wznawianie grafu](https://docs.langchain.com/oss/javascript/langgraph/interrupts) |
| Stan i obliczenia | Neon Postgres przechowuje dane transakcyjne aplikacji i trwałe punkty wznowienia LangGraph (PostgresSaver). Wersja szkicu, zatwierdzone fakty, warianty, wersja reguł, zadania i potwierdzenia należą do sprawy. Reguły w TypeScript operują na datach kalendarzowych i dokładnych kwotach z jawnym zaokrągleniem. Zwracają uprawnienie, okres, kwotę, płatnika, termin oraz powody z identyfikatorem reguły. Stawki i limity z panelu mają datę obowiązywania. Otwarte pytania do mentorów są jawne w wyniku zależnym od brakującej reguły. |
| Wyszukiwanie | Qdrant Cloud przechowuje fragmenty publicznej wiedzy i generuje wektory przez Cloud Inference. Model intfloat/multilingual-e5-small daje 384 wymiary. Ten sam model obsługuje import i pytania, z prefiksami dobranymi do dokumentu i zapytania. Symbol druku jest osobnym polem do dokładnego filtrowania. Dla większego korpusu porównamy wyniki gęste z połączeniem E5 i BM25 przez RRF. [Qdrant Cloud Inference](https://qdrant.tech/documentation/embeddings/qdrant-cloud-inference/) |
| Skany | PDF.js odczytuje strony i warstwę tekstową. Dla skanów renderuje obraz, a Tesseract.js z polskim słownikiem rozpoznaje tekst i pozycje słów w Web Workerze. Model językowy porządkuje kandydatów w pola ze wskazaniem osoby, dokumentu, strony i miejsca. Przy kratkach, kwotach i sprzecznych datach ekran pokazuje wycinek do potwierdzenia. Oryginał jest dostępny w bieżącej sesji. Pliki modelu OCR serwuje aplikacja. [PDF.js](https://mozilla.github.io/pdf.js/examples/) · [Tesseract.js](https://github.com/naptha/tesseract.js) |
| Wnioski | Formularz i czat zapisują ten sam typowany szkic. Wniosek pracownika powstaje z szablonu HTML i stylu do druku, wraz z oświadczeniem i listą załączników. ZAM powstaje przez naniesienie danych na statyczny wzór do druku przy użyciu pdf-lib i osadzonej czcionki z polskimi znakami. Wersja i suma kontrolna PDF wskazują właściwą mapę pól i kratek. Przy zmianie wzoru eksport czeka na sprawdzenie mapy. Na wyjściu jest wypełniona kopia do wydruku. [Wzory ZAM](https://www.zus.pl/-/wniosek-zas-54-1) · [Możliwości i ograniczenia XFA w pdf-lib](https://pdf-lib.js.org/docs/api/classes/pdfform) |

### Etap 1 · Marta wybiera wariant i wznawia przygotowanie wniosku

[Plan wdrożenia dla Opusa — krok 1, konta, Vercel Preview i test wznowienia sprawy](PLAN-ETAP-1-KROK-1.md)

**Efekt na Vercel Preview.** Na fikcyjnym profilu Marty rodzic pyta o urlop razem lub kolejno, widzi obie osie, kwoty i podstawę ze źródła. Wybiera wariant, odświeża stronę, potwierdza oświadczenie i dostaje ten sam szkic z właściwym terminem. To pierwszy przebieg od rozmowy do dokumentu. Sceny Kamila i chorobowego oraz import skanów mają własne, późniejsze etapy.

**Po co LangGraph.js?** W tym przebiegu agent dwukrotnie oddaje kontrolę rodzicowi: przy wyborze wariantu i przy potwierdzeniu oświadczenia. Graf zapisuje etap i dane w Neon przed zakończeniem żądania. Kliknięcie lub kolejna wiadomość wznawia ten sam wątek osobnym żądaniem HTTP. LangGraph steruje krokami, model interpretuje tekst, a funkcja TypeScript odpowiada za obliczenia. [Interrupt i resume](https://docs.langchain.com/oss/javascript/langgraph/interrupts) · [Trwała pamięć](https://docs.langchain.com/oss/javascript/langgraph/add-memory)

| Kolejność | Co wdrażamy | Jak sprawdzamy |
|---|---|---|
| 1. Preview i dostawcy | Projekt Vercel wskazuje katalog aplikacji Next.js. W konfiguracji serwera ustawiamy klucz Sherlock, identyfikator modelu, adres i klucz odczytu Qdrant oraz połączenie Neon. Klucz zapisu Qdrant jest potrzebny tylko podczas importu. Migracja przygotowuje tabele szkiców i checkpointów. | Wywołanie z Preview zwraca polską odpowiedź modelu, wynik rzeczywistego zapytania Qdrant i odczyt zapisanego checkpointu po nowym żądaniu. Testujemy błędny JSON, timeout i limit API. W razie błędu rodzic nadal może wybrać wariant przyciskami. |
| 2. Pierwszy prawdziwy RAG | Jednorazowy skrypt importuje do kolekcji fragmenty oficjalnej strony o urlopie rodzicielskim i § 15 rozporządzenia o wnioskach. Każdy fragment ma ID, URL, sekcję, datę weryfikacji i zakres obowiązywania. Qdrant wylicza embeddingi dokumentów i pytań. Klient dostaje tekst źródłowy po ID. | Pytania „Czy możemy razem?”, „Do kiedy złożyć?” i „Co wpisać o drugim rodzicu?” prowadzą do odpowiedniego fragmentu. Pytanie spoza tego korpusu kończy się informacją o braku podstawy. [Urlop rodzicielski](https://www.gov.pl/web/rodzina/urlop-rodzicielski) · [Rozporządzenie, § 15](https://eli.gov.pl/api/acts/DU/2025/322/text.pdf) |
| 3. Rozmowa i obliczenia | Proponowane moduły w aplikacji: `lib/zusik/graph.ts`, `retrieval.ts`, `parental-leave.ts`. Endpoint `POST /api/zusik` przyjmuje wiadomość lub wznowienie. Przebieg: rozpoznaj intencję → uzupełnij brakującą datę → pobierz podstawę → policz oba warianty → poczekaj na wybór. AI SDK obsługuje klienta modelu, Zod waliduje dane, a LangGraph jest jedynym mechanizmem sterującym. | Dla startu 11.01.2027 oba warianty dają 6860 zł, ale odpowiednio 28 dni razem lub 56 dni kolejno. Przy zmianie daty kalkulator przelicza obie osie i terminy. |
| 4. Wybór i szkic | Kolejne kroki: zapisz wybrany wariant → przygotuj szkic Marty → poczekaj na potwierdzenie okresu Pawła i stanu odpisu → pokaż podgląd do druku. W demie wybieramy fikcyjną kopię odpisu lub potwierdzenie, że jest w aktach. Osobne `GET /api/zusik/state` odtwarza widok. Serwer wiąże nieprzewidywalny identyfikator wątku z sesją demo w podpisanym ciasteczku HttpOnly i sprawdza właściciela. | Po odświeżeniu wznawiamy od oczekującego pytania. Dwa kliknięcia „Wybieram razem” tworzą jeden szkic. Druga sesja nie ma do niego dostępu. Dla wspólnego startu termin Marty to 21.12.2026. |

**Granice transakcji.** Checkpoint grafu przechowuje pozycję rozmowy. Osobny rekord szkicu ma właściciela, wersję i klucz operacji. Zapisy przed ponownym wejściem w węzeł są idempotentne. Spóźniony wybór ze starej karty powoduje odświeżenie aktualnej wersji. Klucze dostawców są dostępne wyłącznie w backendzie. Logi przechowują identyfikatory operacji, błędy i czasy.

**Warunek odbioru.** Z adresu Preview inna osoba przechodzi całą scenę, otwiera prawidłowe źródło, przerywa po wyborze, wraca i kończy jeden poprawny szkic. Osobno zapisujemy wyniki testu źródeł, zgodność kwot i dat oraz opóźnienie API modelu. Dostęp zespołu, limity dostawcy i obsługę formatu JSON potwierdzi dopiero ta próba.

### Jak agent dostaje wiedzę

1. **Korpus.** Na początek importujemy przepisy i poradnik z paczki, tabele DOCX, urzędowe strony świadczeń i instrukcje formularzy. Dla publicznego demo korzystamy z publicznie dostępnych wersji urzędowych i autoryzowanych treści. Akta konkursowe są prywatnym materiałem do analizy i testów. Zapisujemy tytuł, organ, URL, datę pobrania, okres obowiązywania, wersję i sumę treści.
2. **Jednostka wyszukiwania.** Dzielimy ustawę według artykułów i ustępów, poradnik według nagłówków i stron, formularz według sekcji. Wiersz tabeli zachowuje nagłówki, jednostki i przypis. Długi fragment dzielimy przy granicy zdania w limicie tokenizera E5. Każdy fragment ma stabilne ID, rodzaj źródła, stronę PDF i, gdy się różni, numer strony drukowanej.
3. **Jedno pytanie.** Backend dobiera datę właściwą dla danej reguły oraz rozróżnia pytanie historyczne od przygotowania nowego druku. Wyszukuje po symbolu i znaczeniu. Bielik otrzymuje tylko dobrane fragmenty i potrzebne, zminimalizowane fakty. Interfejs sam składa link i cytat po ID. Gdy źródła dotyczą różnych okresów albo brakuje wyjątku rozstrzygającego sprawę, model wskazuje konkretną niewiadomą.
4. **Aktualizacja.** Sprawdzamy zmiany treści na liście oficjalnych adresów. Nowe fragmenty i embeddingi powstają obok poprzedniej wersji. Po sprawdzeniu źródeł i testach publikujemy jedną wersję biblioteki. Zmiana tekstu urzędowego sygnalizuje regułę lub formularz do przeglądu. Stare sprawy zachowują wersję używaną przy wyliczeniu.
5. **Granica sprawy.** Publikowane źródła są tylko do odczytu dla rodzica. OCR, rozmowa i dokumenty należą do użytkownika i sprawy. Backend sprawdza właściciela przy każdym odczycie i zapisie, a tabele prywatne mają RLS osobno dla operacji i roli. Tekst w PDF jest materiałem dowodowym. Do logów trafiają czasy, wersje i kody błędów zamiast treści akt. Vercel wywołuje zarządzane API po HTTPS. Do dostawców trafiają publiczne fragmenty i dane fikcyjnego profilu demonstracyjnego. Prywatne skany konkursowe pozostają po stronie użytkownika. Przed etapem OCR rozstrzygamy zakres danych dopuszczonych do wysłania dostawcy.

### Kontrakty i obsługa innych spraw

- **Fakt** ma osobę, nazwę pola, wartość, okres, pochodzenie, odniesienie do źródła i stan potwierdzenia. Okres wnioskowany i okres potwierdzony są różnymi polami. Jedna zmiana w rozmowie dotyczy jawnie rozpoznanego wariantu albo szkicu.
- **Wynik reguły** ma status „przysługuje”, „brak prawa”, „brakuje danych” lub „brak zaimplementowanej reguły”. Ostatni stan pozwala udzielić odpowiedzi informacyjnej z RAG i jasno wskazuje zakres, który pozostaje do zweryfikowania. Werdykt wymaga właściwej reguły i dowodów. Kalkulator może zwrócić okres, choć kwota wymaga uzupełnienia podstawy.
- **Przebieg.** Marta używa tego samego kalkulatora dwukrotnie, a zapis wyboru tworzy jej szkic. Kamil korzysta z reguły okresu ojcowskiego i katalogu aktualnych druków. W sprawie chorobowego potwierdzone wyłączenie tytułu, ustalenie okresu i sprawdzenie pozostałych tytułów prowadzą do wyjaśnienia. Brak dokumentu prowadzi do jednego pytania. Zatwierdzenie dokumentu i przekazanie w symulacji to osobne akcje interfejsu. Powtórzenie żądania z tym samym kluczem nie tworzy kolejnego szkicu, przypomnienia ani wysyłki.
- **Rozszerzenie.** Nową kombinację znanych faktów, reguł i druków obsługuje istniejący przepływ. Dla nowego świadczenia dokładamy źródła, warunki, wymagane fakty, regułę z datą obowiązywania, mapę formularza i przypadek odbioru. Wdrożenie kolejnej gałęzi prawa uruchamia testy wcześniejszych scen.

### Dodatkowa wiedza dla młodych osób

| Przykładowe pytanie | Co pobiera RAG |
|---|---|
| „Mam 23 lata, studiuję i pracuję na zleceniu. Skąd mam ubezpieczenie?” | Status studenta, wiek, relację z własnym pracodawcą i pozostałe tytuły. Prawo do opieki zdrowotnej i ubezpieczenie chorobowe potrzebne do zasiłku wymagają osobnych odpowiedzi. [ZUS o zleceniu studenta](https://www.zus.pl/documents/10182/167567/Poradnik_umowy_cywilnoprawne.pdf/542ecb21-490d-4877-a27f-8524116f08fe) · [Powrót na uczelnię po pracy](https://www.zus.pl/-/studencie-wakacyjna-praca-si%C4%99-sko%C5%84czy%C5%82a-sprawd%C5%BA-czy-masz-ubezpieczenie) |
| „Studiuję i pobieram rentę po rodzicu. Co mam dostarczyć?” | Reguły kontynuacji nauki, dokument potwierdzający naukę, wiek oraz wyjątek ostatniego roku studiów. [Renta rodzinna ucznia i studenta](https://www.zus.pl/o-zus/aktualnosci/-/asset_publisher/aktualnosci/content/id/13403402) |
| „Zakładam pierwszą firmę i planuję dziecko” | Jak ulga na start wpływa na składki, ubezpieczenie zdrowotne i ochronę chorobową z działalności. Odpowiedź zależy także od innego tytułu ubezpieczenia. [Ulgi przy rozpoczęciu działalności](https://www.zus.pl/pl/firmy/rozliczenia-z-zus/skladki-preferencyjne) |
| „Gdzie dowiem się, jak działa ZUS, zanim zacznę pracę?” | Materiały edukacyjne odpowiednie do etapu szkoły, oferowane oddzielnie od świadczeń pieniężnych. [Lekcje z ZUS](https://www.zus.pl/baza-wiedzy/lekcje-z-zus/o-projekcie-lekcje-z-zus) · [Projekt z ZUS](https://www.zus.pl/edukacja/szkoly-podstawowe/projekt-z-zus) |

### Odbiór przed pokazem

Proponowane kryteria do zmierzenia: identyczne oczekiwane daty, kwoty i status wszystkich trzech scen. W odłożonym zestawie co najmniej sześć nowych spraw z różnych rodzin przypadków, np. adopcja, wcześniactwo, łączenie z pracą, szósta część, zadłużenie i niepełne ubezpieczenie. Przed uruchomieniem ekspert opisuje fakty, wynik oczekiwany i zakres reguł wspieranych w demo. Wyniki dla nowych spraw raportujemy osobno jako trafne rozstrzygnięcia, prawidłowe pytania o brak, obszary poza zakresem i błędy. Żadnej nieuzasadnionej odmowy po usunięciu dokumentu. Podział testowy według całej sprawy po usunięciu duplikatów. Nazwa pliku i końcowe rozstrzygnięcie o świadczeniu są ukryte przed obliczeniem. Dokument rozstrzygający sam stan ubezpieczenia pozostaje dowodem wejściowym, gdy to on jest podstawą ustalenia.

Startowy cel RAG to właściwy fragment w pierwszej piątce dla co najmniej 18 z 20 ręcznie opisanych pytań po polsku. Osobno mierzymy pokrycie wyjątków, poparcie każdej odpowiedzi przez widoczny cytat i poprawność wersji źródła. Sprawdzamy OCR pól krytycznych przed korektą i po niej, rękopis lub kratkę nieczytelną, wydruk ZAM z polskim nazwiskiem, dwiema datami i znacznikiem wyboru oraz zgodność szkicu z plikiem. Mierzymy zimny i powtórny odczyt 20-stronicowego pakietu, najdłuższy dostępny pakiet, czas odpowiedzi i działanie na telefonie. Pomiar na Vercel Preview ma rozstrzygnąć wybór modelu i dostawcy. Błąd modelu pozostawia rodzicowi ręczny szkic, kalkulator i dostęp do źródeł.

### Materiały warsztatowe do wdrożenia

| Kod i lekcja | Technika dla Zusika |
|---|---|
| [LangChain, notebook z RAG Fusion](https://github.com/langchain-ai/rag-from-scratch/blob/main/rag_from_scratch_5_to_9.ipynb) · [Seria wideo twórców](https://www.youtube.com/playlist?list=PLfaIDFEXuae2LXbO1_PKyVJiQ23ZztA0x) | Mechanika łączenia rankingów. Dla większego korpusu przetestujemy ją przez [Hybrid Queries w Qdrant](https://qdrant.tech/documentation/concepts/hybrid-queries/). |
| [DataTalksClub, kod i lekcja o pomiarze](https://github.com/DataTalksClub/llm-zoomcamp/blob/main/04-evaluation/05-search-metrics.md) · [Nagranie warsztatu](https://www.youtube.com/watch?v=WUGtDveIe7A) | Pytania z ręcznie oznaczoną właściwą stroną. Hit Rate@5 pokazuje, czy ją znaleziono. MRR pokazuje, jak wysoko się znalazła. Osobno sprawdzamy odpowiedź i wykonane działania. |
| [Vercel, starter RAG](https://github.com/vercel/ai-sdk-rag-starter) · [Microsoft, lekcja i ćwiczenie z wyszukiwania](https://github.com/microsoft/generative-ai-for-beginners/blob/main/15-rag-and-vector-databases/README.md) | Połączenie interfejsu, narzędzia wyszukiwania i odpowiedzi. Publikacja korpusu jest uprawnieniem zespołu. |
| [Full Stack Deep Learning, wykład i notatki](https://fullstackdeeplearning.com/llm-bootcamp/spring-2023/augmented-language-models/) · [Projekt z nagraną demonstracją](https://fullstackdeeplearning.com/llm-bootcamp/spring-2023/askfsdl-walkthrough/) | Wyszukiwanie z podaniem źródła oraz diagnozowanie przypadków, w których potrzebny fragment nie trafił do kontekstu. |

### Prompt do podjęcia decyzji wdrożeniowej

> Jesteś architektem demo Zusika na HackNation. Przygotuj jedną decyzję techniczną, z której zespół może rozpocząć implementację. Przeczytaj TECH-SPEC-AGENT.md, SPEC-PO-LOGOWANIU.md, SPEC-PANEL-ADMINISTRACYJNY.md, PYTANIA-MENTORZY-ZUS.md, opis zadania i regulamin. Sprawdź istniejący Next.js i prototyp HTML. Zachowaj trzy zaakceptowane scenariusze jako testy odbioru.
>
> Przyjmij Next.js na Vercelu, LangGraph.js, Vercel AI SDK, Zod, zarządzane API Bielika, Qdrant Cloud z Cloud Inference, Neon Postgres dla szkiców i checkpointów, PDF.js, polski Tesseract.js i pdf-lib. Rozpisz wyłącznie aktualny etap. Każde odstępstwo uzasadnij konkretnym ograniczeniem lub wynikiem testu na Vercel Preview.
>
> Dla każdej sceny rozpisz drogę od wiadomości lub PDF do wyniku na ekranie. Pokaż kontrakty faktu ze źródłem, wyniku reguły, cytatu i wersji szkicu. Wskaż, które informacje proponuje model, co oblicza kod, co potwierdza rodzic i które zdarzenie zapisuje wniosek lub wysyłkę w symulacji. Rozróżnij odmowę, brak dowodu i brak zaimplementowanej reguły. Kontrprzykładem jest usunięcie dowodu ubezpieczeniowego lub pojawienie się drugiego tytułu.
>
> Zaprojektuj RAG od dokumentu do klikanej podstawy zdania. Podaj źródła, sposób podziału przepisów, tabel i formularzy, znaczenie dat, model embeddingów, wyszukiwanie hybrydowe, aktualizację i obsługę braku dowodu. Uwzględnij studentów, pierwszą pracę, działalność, rentę rodzinną i ofertę dla młodych rodziców. Skorzystaj z podlinkowanych notebooków LangChain, lekcji DataTalksClub, dokumentacji Qdrant Cloud Inference i kursu Full Stack. Pokaż, jak prywatne akta pozostają w granicach jednej sprawy.
>
> Opracuj pierwszy etap według sekcji „Etap 1”. Podaj pliki, kontrakty, konfigurację, kolejność prac i testy widoczne pod adresem Vercel Preview. Uwzględnij ponowienie, wznowienie i awarię zewnętrznego API. Przedstaw warunek odbioru etapu i oznacz usługi, których dostępności na koncie zespołu trzeba dopiero dowieść. Rezultatem jest projekt wdrożenia.

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
