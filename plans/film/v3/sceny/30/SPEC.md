# 30 · Specyfikacja ujęcia „Papiery wracają na miejsce”

58–60 s, klatki filmu 1740–1799. Lokalnie 0–59 przy 30 kl./s. Podgląd 1280 × 720.

| Klatki lokalne | Pozycja, czas i punkt kontroli |
| --- | --- |
| 0–9 | Położyć klatkę 1739 na 1740 w trybie różnicy. Cały wynik ma być czarny. Od klatki 1 zmniejszać kompletny arkusz wokół (640,360), zachowując położenie nazwy, załącznika i odbiorcy względem papieru. |
| 10–27 | Pierwszy dalszy arkusz pokazuje pole „Placówka lub miejsce porodu”, drugi „Imię i nazwisko ojca”. Oba zachowują nagłówki z własnych formularzy demo. Przy dolnej krawędzi dopuścić obrót do 5°. W miarę oddalania sprowadzić go do 0°. Jeden szelest zaczyna się w 58,40 s. |
| 28–55 | Oryginalny Zusik przesłania najpierw środek, potem narożniki stosu. Najpóźniej w klatce 36 (59,20 s), na początku „dokumentem”, widać całą sylwetkę z cieniem na #F5FAF7. Szelest wygasa około 59,27 s. Pod koniec słowa ruch postaci wyhamowuje, wzrok wraca na wprost. |
| 56–59 | Jedna pozycja całej maskotki, łącznie ze źrenicami i cieniem. W każdej z czterech klatek każdy piksel ma tę samą wartość co w klatce 1799. |

Źródłem postaci jest oryginalny SVG aplikacji. Wielkość w tabeli oznacza jego kwadratową ramkę wraz z cieniem. [Rysunek Zusika](../../../../../app/src/components/mascot/babelek/Babelek.tsx) · [Nagranie kwestii końcowej](../../../v1/kwestie/final.mp3)

| Rozdzielczość | Środek ramki (x, y) | Szerokość × wysokość | Spojrzenie |
| --- | --- | --- | --- |
| 1280 × 720 | (640, 360) | 315 × 315 px | na wprost, look=0 |
| 1920 × 1080 | (960, 540) | 472,5 × 472,5 px | na wprost, look=0 |

## Odbiór na renderze

Wyeksportować klatkę 1799 jako PNG. Nałożyć ją z kryciem 50% na przygotowaną pierwszą klatkę osobnego nagrania landingu. Dopasować kadrowanie nagrania, aż pokryją się źrenice, boczne krawędzie postaci i środek cienia. Obejrzeć twarde cięcie 1799 → landing w tempie 30 kl./s. Odbiór wymaga ciągłości położenia, skali i kierunku spojrzenia. [Formularz zgłoszenia](../../../../../app/src/lib/demo/forms-civil.ts) · [Wniosek ojcowski](../../../../../app/src/lib/demo/forms-leave.ts) · [Etap wejścia na landingu](../../../../../app/src/features/landing/agent-row.tsx)

[Plan i przykłady](PLAN.md) · [Poprzednie ujęcie](../29/SPEC.md)
