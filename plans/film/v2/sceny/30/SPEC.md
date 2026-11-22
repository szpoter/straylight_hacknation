# 30 · Finał do cięcia na landing

58,000–60,000 s, klatki filmu 1740–1799, 30 kl./s. Moduł zwraca wnętrze SVG w przestrzeni 1280 × 720. Tło do samych krawędzi ma kolor #F5FAF7. Nagłówki arkuszy w Domine, pola w Inter, tusz #283754, obrysy #D4D7DD. [Paleta i pismo](../../../../../DESIGN.md) · [Umowa produkcyjna](../../PRODUKCJA.md) · [Prompt i format wyjściowy](../../../PROMPT-PIERWSZA-MINUTA.md)

| Klatki lokalne | Obraz i dźwięk |
| --- | --- |
| 0 | Dokładne wyjście 29. Biały arkusz od x=201 do 1079, y=41–684. Można odczytać tytuł, załącznik i odbiorcę. |
| 1–10 | Wniosek wraz z odbiorcą cofa się wokół (640,360). Od klatki 3 z dołu wchodzi „Zgłoszenie urodzenia dziecka”. |
| 10–24 | Przed zgłoszeniem przechodzi „Wniosek o udzielenie urlopu ojcowskiego”. Duże litery i pola pozwalają prześledzić zmianę dokumentu. Największy obrót 5° przy dolnej krawędzi. Krawędzie w głębi stają się poziome. Szelest w 58,40 s podkreśla mijanie arkuszy. |
| 24–35 | Kartki zbiegają się za środkiem kadru. Na pierwszym planie wchodzi Zusik z dolnej krawędzi. Sylwetka zakrywa środek stosu, kolejne brzegi znikają za nią. |
| 36–55 | „Dokumentem” zaczyna się około 59,18 s. Pełny obrys postaci widać na początku słowa. Szelest kończy się w 59,27 s. Po zasłonięciu papierów Zusik miękko osiada i kieruje wzrok na wprost. |
| 56–59 | Identyczny obraz, sama mięta i Zusik z oryginalnym cieniem. Osobne nagranie strony można dopasować do tej pozycji. |

**Kadr przekazany do montażu**

| Obraz | Środek ramki SVG Zusika | Rozmiar ramki SVG | Spojrzenie |
| --- | --- | --- | --- |
| 1280 × 720 | (640,360) | 315 × 315 px | na wprost, parametr look=0 |
| 1920 × 1080 | (960,540) | 472,5 × 472,5 px | na wprost, parametr look=0 |

Współrzędne dotyczą kwadratowego kadru postaci wraz z oryginalnym cieniem. Montażysta może dopasować położenie sekcji „Poznaj Zusika” do klatki 1799. [Ruch postaci na stronie](../../../../../app/src/features/landing/agent-row.tsx) · [Oryginalna postać](../../../../../app/src/components/mascot/babelek/Babelek.tsx) · [Wzorzec jej obrysu](../../../../../maskotka_kod/design/mascot/base.jpg)

**Wzory ruchu i źródła papierów.** Z Card Stack pochodzi pomysł pokazania głębokości przez nakładanie kolejnych ostrych krawędzi. Z Continuous Action bierzemy prowadzenie wzroku tą samą osią przez trzy ruchy. Dane dwóch dalszych kartek pochodzą z własnych definicji formularzy. Na zgłoszeniu widać „Placówka lub miejsce porodu”, na wniosku ojcowskim „Imię i nazwisko ojca”. [Card Stack](../../przyklady/stos-kart.jpg) · [Continuous Action](../../przyklady/ciagly-ruch.jpg) · [Autorzy i wersje przykładów](../../przyklady/ZRODLA.md) · [Zgłoszenie](../../../../../app/src/lib/demo/forms-civil.ts#L47) · [Urlop ojcowski](../../../../../app/src/lib/demo/forms-leave.ts#L120)

**Odbiór.** Porównać klatki 1739 i 1740. Sprawdzić wszystkie 60 wyników, kolejność nakładania, końcowe położenie maskotki i identyczność klatek 1796–1799. Punkt słowa wyznacza lokalne rozpoznanie pojedynczych słów w istniejącym nagraniu, początek ujęcia głosowego przypada w 57,92 s. [Nagranie finałowe](../../../v1/kwestie/final.mp3) · [Pozycje głosu i szelestu](../../../montaz/miks.py)

## Załączniki do odbioru

![Klatki 0, 20, 40 i 59 z ukończonego ujęcia](klatki.jpg)

[Ujęcie z głosem lub dźwiękiem sceny](ujecie-720p.mp4) · [Załączony przykład warsztatowy](../../przyklady/stos-kart.jpg) · [Autorstwo przykładów](../../przyklady/ZRODLA.md)
