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

## Realizacja v3 (autor b24)

Moduł [`scene.mjs`](scene.mjs), `scene(f, k)`; obraz bazowy `scene(59)` z [`../29/scene.mjs`](../29/scene.mjs); postać `k.zusik` z `zestaw.mjs` (oryginalny `<Babelek/>`, stan `available`). Rewizja kitu: `k.rewizja` r1, używany tylko `k.zusik`.

| Klatki | Ruch | Krzywa |
| --- | --- | --- |
| 0 | `scene29(59)`. | — |
| 1–35 | Cały arkusz skaluje się wokół (640, 360): `1 − 0,66·e(0,25) − 0,26·e(25,35)` → 0,08 (86 px szer.). | smoothstep |
| 10–24 / 14–28 | „Zgłoszenie urodzenia dziecka” + pole „Placówka lub miejsce porodu” (obrót −5° → 0°), potem „Wniosek o udzielenie / urlopu ojcowskiego” + „Imię i nazwisko ojca” (+5° → 0°): od y=972 do 345, skala 1,34 → 0,54; w 26–36 → 0,12. Nowszy arkusz leży wyżej w kolejności (najbliższy największy). | smoothstep |
| 23–36 | `k.zusik(640, 918 − 566·rise, 315, look)`: postać z cieniem wchodzi od dołu i zasłania stos; w 36 cała sylwetka (y środka 352). Od 36 stos nie jest rysowany (≤ 107 px, w całości za ciałem 524–756 × 219–479). | smoothstep |
| 36–56 | Osiadanie +8 px do środka (640, 360); spojrzenie −0,34 → 0. | smoothstep |
| 56–59 | Jedna poza: `k.zusik(640, 360, 315, 0)` — w 1080p (960, 540), 472,5 × 472,5 (ten sam SVG ×1,5). | — |

Teksty formularzy: `name` i etykiety pól z [forms-civil.ts](../../../../../app/src/lib/demo/forms-civil.ts) i [forms-leave.ts](../../../../../app/src/lib/demo/forms-leave.ts). Ostatnia klatka: [klatka-1799.png](klatka-1799.png).

## Odbiór

Stopklatki 1740, 1750, 1756, 1762, 1766, 1768, 1770, 1772, 1774–1776, 1796–1799. Render [ujecie-720p.mp4](ujecie-720p.mp4), [klatki.jpg](klatki.jpg), [pozy.jpg](pozy.jpg), [klatka-1799.png](klatka-1799.png) (1280 × 720).

| Sprawdzenie | Wynik |
| --- | --- |
| 29/59 → 30/0 | Różnica 0. |
| Stos za Zusikiem | 28–32: postać zasłania stos od dołu, w 32 wystaje już tylko górny brzeg formularza; od 33 nic. |
| Klatka 36 | Cała sylwetka z cieniem na #F5FAF7. |
| 1796–1799 | Różnica każdej z 1796, 1797, 1798 względem 1799: 0. |
| Finał | `k.zusik(640, 360, 315, 0)`: neutralne spojrzenie, tło #F5FAF7; w 1080p (960, 540), 472,5 px (ten sam SVG ×1,5). |

**Wynik.** Bez problemu. Otwarte: nakładka PNG na pierwszą klatkę landingu do zrobienia przez montaż (nagranie landingu nie jest w repo v3).
