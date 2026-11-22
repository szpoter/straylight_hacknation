# 23 · Dojazd do karty i odbiór terminu

Autor planu: s23

**44,00–46,00 s**, klatki filmu 1320–1379, 30 kl./s. Współrzędne obrazu odnoszą się do 1280 × 720. Przesunięcie kamery i koniec zielonej linii mierzymy na mapie przed jej przesunięciem. Nagłówek „Narodziny” pozostaje w miejscu. [Rysunek mapy v2](../../../v2/sceny/22/scene.mjs) · [Ruch kamery v2](../../../v2/sceny/23/scene.mjs)

| Klatki | Punkty kontrolne dla animatora |
| --- | --- |
| 0–11 | Między klatką 59 sceny 22 a klatką 0 sceny 23 kamera przechodzi z x=594 na 606, a koniec linii z x=1458 na 1478. W klatce 0 lewy brzeg karty jest na x=654 w obrazie. W klatce 11 linia osiąga x=1584 na mapie i przestaje rosnąć. |
| 12–21 | Kamera niesie zakończoną linię i podest dalej w lewo w obrazie. Karta zostaje za podestem o maksymalnie 10 px w klatce 21. Wszystkie napisy pozostają wewnątrz tej samej karty. |
| 22–29 | Zmniejszaj ten odstęp. W klatce 28 kamera osiąga x=918. Od końca sceny 22 przejechała 324 px, czyli połowę szerokości karty. Środek podestu wypada w obrazie na (666,523). |
| 30–59 | Przesunięcie karty względem podestu wynosi zero. Karta 648 × 300 px zajmuje x=342–990 i y=164–464. Wszystkie 30 klatek utrzymuje ten układ. Klatka 0 sceny 24 przejmuje dokładnie ostatni obraz, wraz z krawędzią x=990. |

## Odbiór przy szerokości 360 px

1. Odtwórz ujęcie raz w tempie 30 kl./s, na wyciszeniu, z całym kadrem o szerokości 360 px. Bez pauzy i powiększenia odczytaj „Zgłoś urodzenie Oli”, „Do zrobienia” i „1 grudnia 2026”. Sama bursztynowa kapsuła nie wystarcza do zaliczenia statusu. W produkcie data odpowiada polu `due` sprawy `zglos-urodzenie`. [Dane z demo](../../../../../app/src/lib/demo/fixtures.ts) · [Karta aplikacji](../../../../../app/src/features/journey-map/CaseCard.tsx)
2. Sprawdź klatki 30–59 przed kompresją. Różnica obrazu względem klatki 30 powinna wynosić zero na całej sekundzie. W podglądzie 360 px data ma około 14,1 px (Inter 600, 50 px w 720p). Jeśli status ginie po pomniejszeniu, zwiększ jego litery i kapsułę we wspólnym rysunku mapy ujęć 22–24, zachowując zewnętrzny obrys karty. [Klatki wzorcowe v2](../../../v2/sceny/23/klatki.jpg)
3. Przełączaj między ostatnią klatką 23 i pierwszą 24 przy szerokości 360 px. Prawy brzeg ma wypadać w tym samym miejscu, około 278,4 px od lewej strony. Nałóż obie klatki, aby sprawdzić też położenie daty i podestu. Dopiero na kolejnych klatkach 24 brzeg przesuwa się w lewo. [Wejście ze sceny 22](../22/SPEC.md) · [Przekazanie do sceny 24](../24/SPEC.md) · [Realizacja tego cięcia w v2](../../../v2/sceny/24/scene.mjs)

## Realizacja v3 (autor s23, blok b19)

- Kod: [`scene.mjs`](scene.mjs) eksportuje `mapAtRest()`, `CAMERA_REST = 918` i `CARD_RIGHT = 990`. Autor 24 może importować `mapAtRest` z `../23/scene.mjs`, tak jak w v2.
- **Styk 23/59 → 24/0 (do dopasowania przez autora 24):** kamera stoi na 918, ślad na 1584. Karta zajmuje x = 342–990, y = 164–464, a jej **prawa krawędź to x = 990** (na ekranie 360 px: 278,4). Środek podestu wypada w (666,523). W kl. 59 przesunięcie karty wynosi 0. Termin „1 grudnia 2026” (Inter 600, 50 px) ma linię bazową y = 426, a kapsuła „Do zrobienia” zajmuje x = 376–592, y = 298–352.

## Odbiór

- W kl. 30–59 scena zwraca ten sam obraz (`mapAtRest()`). Każda klatka ma kamerę 918 i przesunięcie karty 0.
- W podglądzie 360 px (`robocze/b19/w360.png`) da się odczytać „Zgłoś urodzenie Oli”, „Do zrobienia” (kapsuła 30 px, czyli ok. 8,4 px w podglądzie) i „1 grudnia 2026” (ok. 14 px).
- Styk z istniejącym `sceny/24/scene.mjs` (render 1379/1380, `robocze/b19/diff2324.png`): obrys karty, tytuł, termin, data, podest i ślad pokrywają się co do piksela. Różnią się tylko napisy kapsuł, bo 24 importuje `drawMap` z v2 (22 px). **Prośba do autora 24:** zmienić import na `../22/scene.mjs` (ta sama sygnatura `drawMap`) albo `mapAtRest` z `../23/scene.mjs`. Wtedy różnica na cięciu wyniesie 0.
