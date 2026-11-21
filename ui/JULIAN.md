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
- **Obrys pola wiadomości.** Zielony Border Beam biegnie również po zewnętrznej krawędzi całego pola „Zapytaj Zusika…”, obejmującego tekst, załącznik, selektor modelu i wysyłkę. Przy ograniczonym ruchu obrys jest statyczny. Moment uruchomienia i zakończenia tej animacji pozostaje do wyboru.
- **Ręczna poprawka.** Rodzic może wybrać „Zmień” przy konkretnej wartości i poprawić ją w formularzu. Kolejne pytanie Zusika uwzględnia aktualną wartość szkicu. Zatwierdzenie gotowego dokumentu i jego przekazanie mają osobne działania. [Wiersz z akcją Change w GOV.UK](https://design-system.service.gov.uk/patterns/check-answers/)

**Scena do przeklikania.** Rodzic otwiera wniosek Oli i klika zaproszenie. Zusik pyta o początek urlopu. Po odpowiedzi „17 czerwca” ta data pojawia się w polu „Początek urlopu”. Rodzic wybiera przy nim „Zmień” i wpisuje 18 czerwca. Przy kolejnym pytaniu o początek urlopu odpowiedź Zusika ma być zgodna z wartością 18 czerwca. Maciej wykorzystuje tę scenę przy szkicu, a Nikodem może pokazać w jednym kadrze rozmowę i efekt poprawki.
