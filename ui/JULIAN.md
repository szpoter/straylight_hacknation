# Julian — Zusik, rozmowa i treści generowane przez AI

**UI spec do rozwijania.** Zachowanie czatu i szkicu opisuje [spec po zalogowaniu](../SPEC-PO-LOGOWANIU.md), a scenę do filmu [spec strony publicznej](../SPEC.md). Projektuj każdą rodzinę treści z przykładową wypowiedzią po polsku według [workflow](WORKFLOW.md) i [DESIGN.md](../DESIGN.md).

| Kolejność rozmów | Decyzja wizualna |
| --- | --- |
| 1. Zusik i wejście do czatu | Jedna rozpoznawalna postać w dymku na stronie, onboardingu i przycisku w prawym dolnym rogu. Miejsce na etykietę, fokus i ostatni przycisk formularza. |
| 2. Panel, historia i tryby widoku | Nowa rozmowa ma trzy kontekstowe startery. Zaprojektuj historię, powrót, pełny i dzielony widok, zachowanie wpisanej wiadomości oraz podział pionowy na telefonie. |
| 3. Pole wiadomości | Tekst, edycja startera, załącznik i jego usunięcie, wysłanie, generowanie, zatrzymanie i ponowienie. Sprawdź widoczność przy otwartej klawiaturze. |
| 4. Wygląd odpowiedzi | Osobna runda dla krótkiej odpowiedzi ze źródłem, listy formalności z terminem, porównania wyników kalkulatora i pytania o brakującą informację. Przy kwocie pokazuj okres i przyjęte założenia. Link do źródła jest dostępny również w wąskim panelu. |
| 5. Agent przy wniosku | Szkic, wskazanie konkretnego pola, poprzednia i proponowana wartość, akceptacja lub poprawa przez rodzica. Osobny stan po zastosowaniu korekty i osobny krok wysłania dokumentu. |
| 6. Materiał dla pozostałych osób | Nikodem dostaje kadr rozmowy z korektą daty z 17 na 18 czerwca. Maciej dostaje bąbelek i stany panelu przy tej samej sprawie, także po jej zwinięciu. |

**Pierwsza runda.** Porównaj układ wątku z polem wiadomości, skład dłuższej odpowiedzi i sposób poprawiania jednego pola. Proponuję jako próbkę jedną scenę: rodzic prosi o zmianę daty, Zusik wskazuje pole „Początek urlopu” i pokazuje „17 czerwca → 18 czerwca”. Rodzic ma zobaczyć efekt przed zatwierdzeniem. [Przykłady assistant-ui](https://www.assistant-ui.com/examples) · [AI Elements — Message](https://elements.ai-sdk.dev/components/message) · [GOV.UK — korekta pojedynczej odpowiedzi](https://design-system.service.gov.uk/patterns/check-answers/)

**Prompt na start rozmowy**

> Projektuję jako Julian wygląd Zusika, czatu i generowanych treści. Przeczytaj ui/JULIAN.md, ui/WORKFLOW.md, DESIGN.md, sekcje o agencie w obu specach rodzica i inspiracjeelementowistron.md. Zacznij od wejścia do czatu przy szkicu. Omów ze mną, co musi pozostać widoczne. Pokaż kilka bezpośrednich linków, opisz dokładny detal i uzasadnij rekomendację. Poczekaj, aż wybiorę. Każdą zaakceptowaną decyzję zapisz w tym UI specu wraz z przykładową polską treścią i stanami na obu ekranach. Na koniec przygotujemy prototyp do przeklikania w Claude Design.

## Uzgodnione decyzje UI

### Pomoc Zusika przy otwartym formularzu lub wniosku

**Julian · 21 listopada 2026 · Uzgodnione**

- **Wejście.** Zusik jest w prawym dolnym rogu. Otwarcie formularza lub wniosku wywołuje krótki dymek nad postacią, np. „Chcesz wypełnić ten wniosek z Zusikiem?”. Rodzic może dalej pracować w formularzu. Kliknięcie zaproszenia otwiera rozmowę dotyczącą tego szkicu.
- **Komputer.** Wzorem układu jest Form-Filling Co-Pilot. Formularz zajmuje początkowo lewą połowę obszaru roboczego, a czat prawą. Rodzic widzi efekt odpowiedzi w tym samym szkicu i może zmieniać proporcje, przesuwając separator myszą lub klawiaturą. [Form-Filling Co-Pilot](https://www.assistant-ui.com/examples/form-demo) · [Uchwyt w shadcn/ui](https://ui.shadcn.com/docs/components/base/resizable#handle)
- **Telefon.** Zgodnie ze specyfikacją po zalogowaniu fragment wniosku z aktualnym polem znajduje się nad rozmową. Po otwarciu klawiatury rodzic nadal ma dostęp do wpisywanej wiadomości i wysyłania.
- **Rozmowa i dane.** Zusik korzysta z danych dostępnych dla bieżącego szkicu. Pyta o jedną brakującą informację naraz, np. „Od którego dnia chcesz zacząć urlop?”. Gdy rodzic poda jednoznaczną odpowiedź, wartość pojawia się we właściwym polu szkicu. Jeśli odpowiedź można przypisać do kilku pól, Zusik dopytuje. Podpowiedzi to pytania, które rodzic może zadać Zusikowi w aktualnej sprawie. Wybrana podpowiedź trafia do pola wiadomości do edycji.
- **Zmiana pola przez Zusika.** Po wpisaniu nowej wartości do szkicu formularz na moment lekko się rozmywa. Gdy odzyskuje ostrość, zielona smuga światła przesuwa się po obrysie zmienionego pola (Border Beam). Przy korekcie z 17 na 18 czerwca wyróżnienie otacza pole „Początek urlopu”. Treść czatu pozostaje czytelna. Na telefonie przejście obejmuje fragment formularza nad rozmową. Przy ograniczonym ruchu od razu widać nową wartość, statyczny obrys i potwierdzenie „Zaktualizowano”. [Lekkie rozmycie](https://emilkowal.ski/ui/7-practical-animation-tips#:~:text=7.%20Use%20blur) · [Wskazanie zmienionej wartości](https://www.ag-grid.com/react-data-grid/change-cell-renderers/#flashing-cells) · [Border Beam](https://magicui.design/docs/components/border-beam)
- **Dół czatu.** Przyjmujemy układ pola wiadomości z Claude. Rodzic pisze w górnej części pola „Zapytaj Zusika…”. W dolnym rzędzie po lewej dodaje załącznik, a po prawej widzi nazwę wybranego modelu obok przycisku „Wyślij”. Kliknięcie nazwy otwiera wybór między PLLuM a Bielikiem. [Pole wiadomości w demie Claude](https://www.assistant-ui.com/demos/claude)
- **Załączniki w polu wiadomości · Julian · 21 listopada 2026 · Uzgodnione.** Przyjmujemy wariant List z AI Elements. Nad wpisywanym tekstem każdy plik ma własny wiersz z ikoną typu, nazwą (np. „Zaświadczenie.pdf”), stanem „Dodawanie…” lub „Gotowy” i akcją „Usuń”. Gdy dodanie się nie powiedzie, przy tym pliku pojawia się „Spróbuj ponownie”. Na telefonie długa nazwa może przejść do drugiej linii. Po wysłaniu plik jest widoczny przy wiadomości rodzica. Kropka przy kroku „Dodaj zaświadczenie” wypełnia się dopiero po potwierdzeniu dodania dokumentu do właściwego szkicu. [AI Elements — Attachments, wariant List](https://elements.ai-sdk.dev/components/attachments#list-variant)
- **Obrys pola wiadomości podczas pracy Zusika.** Po wysłaniu wiadomości zielony Border Beam biegnie po zewnętrznej krawędzi całego pola „Zapytaj Zusika…”, obejmującego tekst, załącznik, selektor modelu i wysyłkę. Przy korekcie obrys pola wiadomości gaśnie po potwierdzonym zapisie i wtedy wyróżnia się zmienione pole formularza. Przy zwykłej odpowiedzi animacja kończy się wraz z odpowiedzią. Zatrzymanie pracy lub błąd również wygasza obrys. Przy ograniczonym ruchu informację o trwającej pracy przekazują statyczny obrys i tekst.
- **Przebieg pracy w rozmowie.** Nad odpowiedzią jest jeden domyślnie zwinięty wiersz. Jego nagłówek pokazuje aktualną czynność, np. „Sprawdzam Twój szkic” lub „Szukam w materiałach ZUS”. Po rozwinięciu rodzic widzi czynności wykonane przy tej wiadomości. Po zapisie może wrócić do szczegółów przez „Przebieg zmiany”. [Rozwijany przebieg](https://elements.ai-sdk.dev/components/task)
- **Sugestie pod odpowiedzią.** Pod najnowszą odpowiedzią Zusika są dokładnie dwa pytania dopasowane do sprawy. Przykład po korekcie daty: „Jak wybrać datę końca?” i „Czego jeszcze brakuje?”. Na telefonie dłuższy tekst może przejść do kolejnego wiersza. Wybranie sugestii wstawia pytanie do edycji w polu wiadomości. Nowa rozmowa nadal zaczyna się od trzech pytań startowych. [Wygląd sugestii](https://elements.ai-sdk.dev/components/suggestion)
- **Ręczna poprawka.** Rodzic może wybrać „Zmień” przy konkretnej wartości i poprawić ją w formularzu. Kolejne pytanie Zusika uwzględnia aktualną wartość szkicu. Zatwierdzenie gotowego dokumentu i jego przekazanie mają osobne działania. [Wiersz z akcją Change w GOV.UK](https://design-system.service.gov.uk/patterns/check-answers/)
- **Adnotacja przy zapisanej zmianie.** Mały Zusik na marginesie aktualnej odpowiedzi wskazuje adnotację z nazwą pola, poprzednią i zapisaną wartością, np. „Początek urlopu ↗”, „17 czerwca → 18 czerwca”, „Zapisane w szkicu Oli”. Nazwa pola jest klikalna także po powrocie do historii rozmowy. Na komputerze wskazuje to pole w formularzu po lewej, a na telefonie pokazuje je we fragmencie szkicu nad czatem. Wzorem dla powiązania komentarza z konkretnym miejscem jest Cursor, a dla rozpoznawalnej postaci przy pracy — Notion Agent. [Cursor Design Mode](https://cursor.com/blog/design-mode) · [Notion Agent](https://www.notion.com/help/guides/get-started-with-your-personal-agent-in-notion)

**Scena do przeklikania.** Rodzic otwiera wniosek Oli i klika zaproszenie. Zusik pyta o początek urlopu. Po odpowiedzi „17 czerwca” ta data pojawia się w polu „Początek urlopu”. Rodzic wybiera przy nim „Zmień” i wpisuje 18 czerwca. Przy kolejnym pytaniu o początek urlopu odpowiedź Zusika ma być zgodna z wartością 18 czerwca. Maciej wykorzystuje tę scenę przy szkicu, a Nikodem może pokazać w jednym kadrze rozmowę i efekt poprawki.

### Wybór daty w rozmowie

**Julian · 21 listopada 2026 · Uzgodnione.** Pod pytaniem „Od którego dnia chcesz zacząć urlop?” jest przycisk z ikoną kalendarza i etykietą „Wybierz datę” w stylu shadcn/ui. Otwiera kalendarz przy pytaniu. Wybranie dnia zamyka kalendarz i od razu dodaje po prawej wiadomość rodzica z pełną datą, np. „17 czerwca 2027”. Zamknięcie kalendarza bez wyboru pozwala wrócić do pytania. Rodzic może też wpisać odpowiedź własnymi słowami. Jeśli rok pozostaje niejasny, Zusik o niego pyta. [shadcn/ui — Date Picker](https://ui.shadcn.com/docs/components/radix/date-picker)

**Scena do przeklikania.** Po wyborze 17 czerwca 2027 rodzic widzi swoją odpowiedź w rozmowie. Dopiero gdy zapis się powiedzie, Zusik potwierdza zmianę i wyróżnia pole „Początek urlopu” w szkicu Oli. Na komputerze pole widać po lewej, na telefonie nad rozmową. Wybrana data pozostaje czytelna w historii wątku.

### Historia rozmów

**Julian · 21 listopada 2026 · Uzgodnione.** „Historia” w nagłówku Zusika otwiera listę w miejscu rozmowy. W widoku dzielonym rodzic nadal widzi formularz po lewej, a na telefonie fragment bieżącej sprawy nad listą. Samo otwarcie historii zachowuje bieżącą sprawę. [Linear Agent — wejście z paska czatu](https://linear.app/docs/linear-agent#chat-history)

Rozmowy zalogowanego rodzica grupujemy według daty ostatniej wiadomości pod nagłówkami „Dzisiaj”, „Wczoraj” i „Wcześniej”, od najnowszej. Pierwszy wiersz wpisu pokazuje tytuł i godzinę lub datę, np. **Zmiana daty urlopu ojcowskiego** i **10:42**. Drugi, spokojniejszy wiersz wskazuje dziecko lub plan oraz sprawę, np. „Ola · Wniosek do pracodawcy”. Na wąskim ekranie długi tytuł może się zawinąć. [assistant-ui — grupy rozmów](https://www.assistant-ui.com/elements/thread-list) · [Notion Agents — dwuwierszowy wpis w historii](https://www.notion.com/help/notion-ai-app-for-ios#history)

**Scena do przeklikania.** Rodzic zaczyna pisać wiadomość i dołącza plik, po czym otwiera historię. „Wróć do rozmowy” przywraca ten sam wątek z tekstem i plikiem. Wybranie wpisu „Zmiana daty urlopu ojcowskiego” wznawia rozmowę o Oli i jej szkic przy polu „Początek urlopu”. Niewysłany tekst i załącznik czekają w rozmowie, w której rodzic je przygotował.

### Źródła RAG przy odpowiedzi Zusika

**Julian · 21 listopada 2026 · Uzgodnione.** Przy zdaniu opartym na materiale źródłowym umieszczamy małe, domyślnie zwinięte oznaczenie w stylu AI Elements, np. „Pokaż fragment poradnika · ZUS, s. 33”. Kliknięcie, dotknięcie lub aktywacja klawiaturą rozwija pod zdaniem dokładny cytat z fragmentu użytego przez RAG, zgodnie z pomysłem „Zoom In” z Granoli. Na komputerze szkic pozostaje obok rozmowy, a na telefonie cytat rozwija się w treści wiadomości. [AI Elements — Inline Citation](https://elements.ai-sdk.dev/components/inline-citation) · [Granola — Zoom In](https://www.granola.ai/blog/announcement#:~:text=Zoom%20In)

**Przykład do odbioru.** Rodzic pyta „Czy mogę podzielić urlop ojcowski?”. Po rozwinięciu źródła widzi tytuł poradnika, wydawcę, rok i drukowaną stronę 33 oraz cytat „Tata może go wykorzystać jednorazowo lub w dwóch 7-dniowych częściach.” Osobny link „Otwórz stronę w PDF” prowadzi do 34. strony tego wydania pliku. Ponowne wybranie oznaczenia zwija cytat. Gdy materiały nie potwierdzają danej informacji, Zusik wskazuje, czego nie udało się ustalić. [Poradnik ZUS 2026](../Materiały%20hackathonowe/Materiały%20dla%20uczestników/Poradnik%20dla%20rodziców%2C%20ZUS%202026.pdf#page=34)

### Artefakty w rozmowie

**Julian · 21 listopada 2026 · Uzgodnione.** Zusik może osadzić mini plan albo tabelę bezpośrednio w wiadomości. Dalsze referencje wizualne dobieramy z aplikacji produktowych i galerii UI. Materiały urzędowe służą do sprawdzania przepisów, terminów i procedur.

- **Mini plan sprawy.** Kliknięcie aktualnego kroku „Podaj datę zakończenia” prowadzi do odpowiedniego pola w szkicu, a „Sprawdź szkic” otwiera jego podsumowanie. Na komputerze cel widać obok rozmowy, na telefonie nad nią. Kółko wypełnia się dopiero po faktycznym wykonaniu zadania, np. po potwierdzonym zapisie daty. Jeśli rodzic tylko otworzy pole i wróci do czatu, krok pozostaje do wykonania. Ten sam plan aktualizuje się w rozmowie w miarę postępu sprawy. Plan opisuje czynności rodzica, a rozwijany „Przebieg” nad wiadomością pokazuje pracę Zusika. Przy zmianie stosujemy ustalony ruch czatu. Przy ograniczonym ruchu od razu pokazujemy końcowy stan kółka. [Plan w rozmowie z agentem Cursor](https://cursor.com/changelog/1-2#agent-to-dos) · [Things — Progress Pies](https://culturedcode.com/things/features/#:~:text=Progress%20Pies)
- **Porównanie kwot.** Zusik osadza tabelę z wynikami kalkulatora. Warianty można porównać według wspólnych kryteriów, z okresem, jednostką i założeniami przy kwotach. [Przykład dwóch wariantów do makiety](../SPEC-PO-LOGOWANIU.md#przykład-do-makiety-i-odbioru)

### Kolor i ruch w rozmowie

Wartości do pierwszej próby w makiecie. [Wspólna paleta i fokus klawiatury](../DESIGN.md)

| Moment | Wygląd i zachowanie czatu |
| --- | --- |
| Rodzic wysyła wiadomość | Jasnozielony dymek (#E6F3E9) z ciemnozielonym tekstem (#176343) pojawia się po prawej. Przez 150 ms nabiera krycia i przesuwa się o 4 px w górę. |
| Zusik pracuje | Na obrysie pola pisania biegnie zielony akcent (#009C44). Zmiana opisu czynności w zwiniętym nagłówku ma krótkie przenikanie w miejscu. Rodzic może czytać wcześniejsze wiadomości na tej samej wysokości. |
| Zusik odpowiada | Tekst odpowiedzi jest ciemny (#21342D) na bieli. Potwierdzoną zmianę poprzedza zielony znak ✓, a następujące po niej pytanie jest pogrubione w osobnym wierszu. Dwie sugestie pojawiają się razem po zakończeniu odpowiedzi. |
| Rodzic sprawdza źródło albo szczegóły | Źródło z RAG ma jasnoniebieskie tło (#E8F2F9) i podkreślony link (#1E5479). Rozwinięcie przebiegu płynnie odsłania kroki pod nagłówkiem przez około 160 ms. Fokus pozostaje przy przycisku rozwijania. |
| Operacja się nie udała | Obrys pracy gaśnie. Przy wiadomości pojawia się powód błędu (#9E3039 na #FDEDEF) i dostępna czynność, np. „Spróbuj ponownie”. |

Przy ograniczonym ruchu od razu pokazujemy końcową treść, statyczny obrys i podpis stanu. Nowe wiadomości zachowują pozycję przewijania, gdy rodzic czyta starszy fragment rozmowy.
