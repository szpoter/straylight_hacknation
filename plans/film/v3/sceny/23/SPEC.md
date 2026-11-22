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
