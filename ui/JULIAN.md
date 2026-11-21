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

Miejsce na wpisy Juliana po obejrzeniu referencji.
