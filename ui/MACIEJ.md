# Maciej — widoki rodzica po zalogowaniu

**UI spec do rozwijania.** Punktem wejścia jest wynik symulacji od Nikodema. Wracający rodzic wznawia onboarding lub otwiera swój plan. Ustalenia funkcjonalne zawiera [SPEC-PO-LOGOWANIU.md](../SPEC-PO-LOGOWANIU.md). Pracuj po jednej sekcji według [workflow](WORKFLOW.md) i [DESIGN.md](../DESIGN.md).

| Kolejność rozmów | Decyzja wizualna |
| --- | --- |
| 1. Onboarding z Zusikiem | Jedno brakujące pytanie, rozpoznanie zaznaczenia, zmiana kafli na datownik, „Wstecz”, pominięcie opcjonalnej odpowiedzi i wznowienie. |
| 2. Pasek, dziecko i mapa | Aktywny plan zawsze ma nazwę. Ustal otwarcie selektora oraz widoczność „Teraz”, obowiązku i uprawnienia w czterech etapach. Mapa pozioma na komputerze, pionowa na telefonie. |
| 3. Najbliższa sprawa i kalkulator | Kolejno opracuj kartę sprawy z datą oraz porównanie okresów i kwot dwojga rodziców. Pokaż stan brakującej podstawy i rozwinięcie „Skąd ta kwota?”. |
| 4. Dokumenty i wnioski | Połącz wybór celu (np. urlopy, świadczenia) ze stanem sprawy. Osobno omów wiersz dokumentu, przebieg po wysyłce, potwierdzenie i wezwanie do uzupełnienia. |
| 5. Profil rodziny i przykładowa sprawa | Odróżnij źródło danych od ich edycji. Zaprojektuj przejście do testowej sprawy lub testowego PDF i powrót do planu. |
| 6. Przekazanie do agenta | „Dokończ z Zusikiem” otwiera panel Juliana przy właściwym dziecku, dokumencie i polu. Uzgodnij miejsce w widoku dzielonym oraz powrót do tego samego miejsca w formularzu. |

**Pierwsza runda.** Porównaj układ jednego pytania, czytelność pojedynczego wyboru i możliwość poprawienia wcześniejszej odpowiedzi. Proponowany punkt startowy to jedno pytanie Zusika nad grupą kafli i stałe miejsce akcji „Dalej”, także wtedy, gdy kafle zastępuje kalendarz. [GOV.UK — strona pytania](https://design-system.service.gov.uk/patterns/question-pages/) · [Przykłady wyboru jednej odpowiedzi](https://design-system.service.gov.uk/components/radios/) · [Podgląd odpowiedzi z korektą](https://design-system.service.gov.uk/patterns/check-answers/)

**Prompt na start rozmowy**

> Projektuję jako Maciej aplikację po zalogowaniu. Przeczytaj ui/MACIEJ.md, ui/WORKFLOW.md, DESIGN.md, SPEC-PO-LOGOWANIU.md i inspiracjeelementowistron.md. Zacznij od pierwszego brakującego pytania po pobraniu danych. Omów ze mną cel, znajdź kilka konkretnych przykładów, daj linki i poleć wariant dla rodzica na telefonie. Poczekaj na wybór. Po akceptacji zapisz układ, kontrolki, przejścia i scenę odbioru w tym UI specu. Potem omówimy następny element i złożymy zaakceptowane sceny w Claude Design.

## Uzgodnione decyzje UI

Miejsce na wpisy Macieja po obejrzeniu referencji.
