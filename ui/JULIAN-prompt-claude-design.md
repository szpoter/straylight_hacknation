# Claude Code — zaprojektuj i zaimplementuj okno czatu Zusika

Pracujesz w repozytorium HackNation. Użyj Claude Design w tej sesji Claude Code. Zaprojektuj okno czatu Juliana, zaimplementuj je jako klikalne demo na trasie `/demo/zusik` w aplikacji `maskotka_kod` i sprawdzaj wynik w przeglądarce po każdym etapie. Interfejs ma być po polsku, kod po angielsku. Pracuj do momentu, gdy da się otworzyć wniosek Oli, zmienić datę przez rozmowę i zobaczyć tę samą datę w formularzu.

## Zacznij od naszego projektu

Przeczytaj całe `ui/JULIAN.md`. Sekcja „Uzgodnione decyzje UI” zawiera obowiązujące zachowania, teksty, referencje i przykłady do odbioru. Przeczytaj `CLAUDE.md`, instrukcje w `maskotka_kod/`, `design/README.md` i wskazane tam zasady wyglądu, tokenów, komponentów i ruchu. Wspólne kontrolki są opisane w `ui/S0-prompt.md`. Kontekst wniosku i dane do porównania weź z `SPEC-PO-LOGOWANIU.md`, a zasady agenta z `TECH-SPEC-AGENT.md`. Zakres demo to rozmowa i potrzebny do niej fragment wniosku.

Uruchom istniejącą aplikację przez `npm run dev` w `maskotka_kod/`. Obejrzyj zaproszenie, rozmowę i zapis na `/mascot/zusik`. W nowym oknie użyj istniejącego komponentu `Babelek` i jego gotowych animacji. Wykorzystaj fikcyjne dane Oli i powtarzalne lokalne wyniki operacji. Pozwól odtworzyć opóźnienie i awarię podczas testów bez eksponowania kontrolek testowych rodzicowi.

## Pracuj etapami

Po każdym etapie wykonaj opisaną próbę. Dla zmiany wizualnej otwórz demo przy szerokościach **1280 i 375 px** i porównaj je z projektem w Claude Design. Sprawdzaj działanie kliknięciem, dotykiem lub klawiaturą. Po istotnej zmianie kodu uruchom build. Jeśli próba ujawni błąd, popraw go i powtórz tę samą próbę przed przejściem dalej. W rozmowie podaj krótko, co faktycznie udało się zaobserwować. Po udanej zmianie zrób commit zgodnie z instrukcjami projektu.

### 1. Zaprojektuj właściwe okno w Claude Design

Użyj `/design` lub dostępnej w tej sesji funkcji Claude Design. Przygotuj na jednej planszy wspólne kontrolki i trzy kadry tej samej sprawy na komputer i telefon: zaproszenie przy formularzu, otwarta rozmowa i potwierdzona zmiana daty. Najważniejszy jest trzeci kadr. Po lewej widać pole „Początek urlopu” z 18 czerwca 2027, po prawej małego Zusika na marginesie odpowiedzi i adnotację „17 czerwca → 18 czerwca”. Na telefonie to samo pole jest nad wiadomością. Układ formularz–czat weź z Form-Filling Co-Pilot, dół pola wiadomości z Claude, a krój pisma, powierzchnie i kontrolki z naszego `design/`.

**Sprawdź projekt.** Otwórz oba rozmiary. Czy bez przewijania między ekranami da się odczytać, co zmienił Zusik, w którym polu i jak odpowiedzieć dalej? Sprawdź, czy na planszy jest jedna maskotka w danym momencie. Popraw układ przed implementacją. Jeśli Design wymaga osobistego logowania lub zgody, podaj dokładną czynność potrzebną do wznowienia.

### 2. Zbuduj zaproszenie i ramę panelu

Zacznij na szkicu. Zielony Zusik w prawym dolnym rogu zaprasza do pracy z wnioskiem. „Tak, pomóż” otwiera czat. „Nie teraz” wycisza zaproszenie dla tego szkicu również po ponownym otwarciu, a kliknięcie bąbelka wciąż działa. Desktop zaczyna od podziału 50/50 z regulowanym separatorem. Na telefonie aktualne pole jest nad rozmową. Nagłówek „Zusik · asystent AI” pokazuje dziecko i sprawę, Historię, Nową rozmowę, Pełny ekran / Podziel ekran oraz minus „Zwiń czat”. Na telefonie Nowa rozmowa trafia do „Więcej”.

**Sprawdź panel.** Odrzuć zaproszenie, otwórz ten sam szkic, potem inny. Otwórz czat bąbelkiem, zmień szerokość myszą i klawiaturą, przełącz pełny ekran i wróć. Zwiń panel i sprawdź fokus na bąbelku.

### 3. Uruchom pisanie, rozmowy i historię

Trzy startery wstawiają pytanie do edycji i znikają dopiero po wysłaniu. W polu „Zapytaj Zusika…” pokaż załącznik po lewej, a model i wysłanie po prawej. Obsłuż dodanie, usunięcie i ponowienie załącznika. PLLuM ma sam wybór modelu. Bielik pokazuje „Poziom rozumowania” tylko przy potwierdzonej obsłudze przez API wdrożonej wersji. Historia otwiera się w miejscu rozmowy, z grupami „Dzisiaj”, „Wczoraj”, „Wcześniej” i dwuwierszowymi wpisami. Zachowuj tekst, plik, trwającą odpowiedź i miejsce czytania właściwego wątku.

**Sprawdź wiadomość.** Wybierz starter, popraw tekst, dodaj plik, zmień model i zajrzyj do innego wątku. Po powrocie odczytaj swój tekst i nazwę pliku, a potem wyślij wiadomość. Sprawdź dostęp do wysyłania przy otwartej klawiaturze ekranowej. Odróżnij próbę na urządzeniu od symulacji szerokości w przeglądarce.

### 4. Połącz odpowiedź ze stanem szkicu

Zusik pyta o jedną brakującą informację. Gdy odpowiedź jest niejednoznaczna, dopytuje. Nad tekstem pokazuje aktualną czynność w domyślnie zwiniętym przebiegu. Pod ukończoną odpowiedzią są następne pytanie i dwie sugestie do edycji. „Wybierz datę” dodaje wybraną datę jako wiadomość rodzica. Podczas pracy Border Beam biegnie po polu wiadomości. Przy zapisie ten sam Zusik przechodzi z marginesu do pola jako ołówek. Po potwierdzeniu formularz lekko się rozmywa, wraca ostrość i zielony obrys wyróżnia zmienione pole. Czat pozostaje czytelny. Zusik wraca do klikalnej adnotacji. Zastosuj też ustalone zachowanie dla pola poza ekranem i ograniczonego ruchu.

**Sprawdź najważniejszą scenę.** Wybierz 17 czerwca 2027, następnie poproś o poprawienie początku urlopu na 18 czerwca. Kliknij „Początek urlopu ↗” i odczytaj 18 czerwca w formularzu. Użyj „Zmień”, wpisz 19 czerwca i zapytaj Zusika o aktualną datę. Odpowiedź ma uwzględniać ręczną zmianę. Przy przewinięciu do starszej wiadomości czytany tekst zachowuje pozycję, a „↓ Nowa odpowiedź” przenosi na dół i znika.

### 5. Osadź źródła, mini plan i porównanie w odpowiedzi

Oznaczenie przy konkretnym zdaniu rozwija cytat z naszego RAG wraz z tytułem, wydawcą, rokiem, stroną i linkiem do PDF. Przy terminie pokaż flagę, czynność, datę odniesienia i „Skąd ten termin?”. Gdy brakuje podstawy albo daty odniesienia, zastosuj odpowiedź z planu. Kliknięcie kroku mini planu prowadzi do pola lub podsumowania. Kropka wypełnia się dopiero po wykonaniu zadania. Tabele i wykresy pojawiają się między akapitami w miejscu szkieletu UI. Na telefonie warianty stoją obok siebie. Przy przepełnieniu przewija się tylko tabela, z przypiętymi nazwami wierszy. Pod nią jedno zdanie podaje różnicę. Użyj okresów, jednostek i założeń z przykładu kalkulatora.

**Sprawdź treść.** Zadaj pytanie o podział urlopu ojcowskiego. Rozwiń cytat i otwórz drukowaną stronę 33 na stronie 34 pliku. Wejdź w krok planu, wróć bez zapisu i sprawdź pustą kropkę. Dokończ zadanie i sprawdź jej wypełnienie. Na 375 px porównaj obie wartości „Łącznie brutto” i sprawdź, czy tabela mieści się w rozmowie podczas przewijania.

### 6. Rozegraj przerwania i odbierz całość

Podczas generowania Stop zastępuje strzałkę. Po zatrzymaniu zostaw dotychczasowy tekst, wygaś obrys i pokaż faktyczny stan zapisu. Utrata połączenia daje „Utracono połączenie” i „Ponów odpowiedź” pod fragmentem. Ponowienie zastępuje odpowiedź w miejscu i zachowuje potwierdzony zapis. Przy błędzie zapisu pokaż aktualną wartość i „Ponów zapis”. Sukces zmienia komunikat w adnotację. Przed ponowieniem porównaj stan pola z wersją sprzed błędu.

**Sprawdź każdą awarię osobno.** Zatrzymaj odpowiedź w trakcie zapisu i obserwuj komunikat aż do rozstrzygnięcia. Zerwij połączenie po zapisie, ponów tekst i sprawdź, że jest jedno pytanie i jeden zapis. Po błędzie zapisu popraw ręcznie datę na 19 czerwca i dopiero wtedy kliknij „Ponów zapis”. W formularzu musi pozostać 19 czerwca.

Na koniec powtórz pełną ścieżkę od dymka do adnotacji, także przy ograniczonym ruchu. Uruchom `npm run lint` i `npm run build` w `maskotka_kod/`. Oddaj adres działającego demo, polecenie uruchomienia, odnośnik do projektu Claude Design, kadr desktop i telefon oraz krótkie nagranie zmiany 17 → 18 czerwca. W podsumowaniu wymień wyniki wykonanych prób, symulowane usługi i ewentualne próby do sprawdzenia na urządzeniu.
