# Nikodem — strona publiczna i wejście do demo

**UI spec do rozwijania.** Funkcje i uzgodnione teksty bierzesz z [SPEC.md](../SPEC.md). Każdy wiersz poniżej można rozbić na mniejsze elementy. Prowadź dla nich oddzielne rundy według [wspólnego workflow](WORKFLOW.md) i [DESIGN.md](../DESIGN.md).

| Kolejność rozmów | Decyzja wizualna |
| --- | --- |
| 1. Hero i podgląd „Moja sytuacja / Mój plan” | Hierarchia nagłówka i CTA, skala przykładu, widoczność etykiety „Przykład”, przełączenie zakładki, ułożenie na telefonie. |
| 2. Zusik przy przewijaniu | Miejsce postoju i dymka dla każdej sekcji, powrót w górę, statyczny wariant przy ograniczeniu ruchu. Wygląd postaci uzgodnij z Julianem. |
| 3. Sytuacje rodzinne, wsparcie, pytania rodziców | Kolejno opracuj wybór sytuacji, spokojny panel wsparcia i parę pytanie–fragment planu. Utrzymaj związek pytania z przykładem na telefonie. |
| 4. Film z Zusikiem | Miniatura, napisy, sterowanie i miejsce na dymek. Użyj kadrów rozmowy i szkicu od Juliana. |
| 5. Liczby, końcowe CTA, stopka | Czytelność czterech wartości z opisem i źródłem, potem powrót do tego samego logowania. |
| 6. mObywatel i dane z ZUS | Dwie odrębne sceny demo. Potwierdzenie fikcyjnego profilu, powrót, stan pobierania, sukces, ponowienie i ręczne uzupełnienie. Sukces przekazuje rodzica do pierwszego pytania u Macieja. |

**Pierwsza runda.** Obejrzyj zapowiedź korzyści i główną akcję w planerze urlopu, ruch wskaźnika w przykładzie Motion oraz zachowanie zakładek przy klawiaturze. Proponowany kierunek do oceny to wyraźne CTA po lewej i obsługiwana przez rodzica karta po prawej. Na telefonie CTA jest nad kartą. [Planer urlopu](https://www.gov.uk/plan-shared-parental-leave-pay) · [Motion — przełączenie zakładek](https://motion.dev/examples/react-smooth-tabs) · [W3C — Tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/)

**Prompt na start rozmowy**

> Projektuję jako Nikodem stronę publiczną i wejście do demo. Przeczytaj ui/NIKODEM.md, ui/WORKFLOW.md, DESIGN.md, SPEC.md i inspiracjeelementowistron.md. Zacznijmy od Hero. Ustal ze mną pierwsze wrażenie rodzica, potem otwórz kilka konkretnych inspiracji i daj mi linki, co w każdej obejrzeć oraz własną rekomendację. Poczekaj na mój wybór. Zapisuj zatwierdzone elementy tutaj, z układem na telefon i komputer oraz zachowaniem przycisków. Na końcu złożymy je w prototyp w Claude Design.

## Uzgodnione decyzje UI

Miejsce na wpisy Nikodema po obejrzeniu referencji.
