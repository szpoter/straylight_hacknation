# 22 · Specyfikacja ujęcia „Od Oli do najbliższej sprawy”

Autor planu: s22

42–44 s, klatki filmu 1260–1319. Lokalnie 0–59 przy 30 kl./s, podgląd 1280 × 720. Zachować skalę 1 i pionowe położenie mapy z v2. Imię Oli i nagłówek etapu w Domine, nazwy i statusy przystanków w Inter. Tło #F5FAF7, ślad #1A8648 szerokości 5 px. [Mapa v2](../../../v2/sceny/22/scene.mjs) · [Sposób rysowania podestów w aplikacji](../../../../../app/src/features/journey-map/shared.tsx)

Poniżej X kamery oznacza położenie lewego brzegu kadru na mapie. X linii oznacza koniec zielonego odcinka na mapie. Odejmując X kamery, dostajemy położenie na ekranie. Nagłówek „Narodziny” i licznik „Etap 3 z 4” stoją we współrzędnych ekranu.

| Faza | Położenie i tempo |
| --- | --- |
| 0–18 | W 21/58 i 21/59 kamera stoi. Koniec linii na y=641 przesuwa się z x=302 do 320, a w 22/0 do 338. Na mapie odcinek zaczyna się w (−4,641), skręt dopiero za x=344. Kamera rusza od zera według 6 × f² / 19 i dochodzi do x=102,32 w klatce 18. |
| 19–26 | Od klatki 19 kamera jedzie po 12 px/kl, jej X = 12 × f − 114. Środek blatu badań ma na mapie (802,476), w klatce 23 na ekranie (640,476). Koniec linii przecina ten środek pomiędzy klatkami 25 i 26. |
| 27–43 | Ślad przez całe ujęcie ma X = 338 + 18 × f + 58 × (f / 59)². Na końcu fazy kamera jest na 402, koniec śladu na 1142,81, a przystanek Z-3 w (1148,530) na mapie. |
| 44–59 | Koniec linii przechodzi przez Z-3 i biegnie dalej do zgłoszenia w (1584,523). Karta ma na mapie (1260,164), rozmiar 648 × 300 px. W klatce 59 jej lewy brzeg na ekranie ma x=666, w 23/0 x=654. Na obu klatkach przesunięcie karty względem podestu wynosi 0. |

W 22/58, 22/59 i 23/0 pary (X kamery, X linii) wynoszą kolejno (582; 1438,05), (594; 1458) i (606; 1478). Na ekranie koniec linii przechodzi od x≈856 przez 864 do 872, wciąż po tym samym łuku. Zakończyć ujęcie podczas jazdy. Scena 23 przejmuje dojazd do terminu „1 grudnia 2026”. [Wejście z 21](../21/SPEC.md) · [Przebieg hamowania w v2](../../../v2/sceny/23/scene.mjs) · [Następne ujęcie](../23/SPEC.md)

**Dane aplikacji.** Plan „Ola” zawiera odhaczone badania, automatyczne Z-3 oraz obowiązek zgłoszenia urodzenia do 1 grudnia 2026. Model ścieżki wyświetla dla nich kolejno „Odhaczone”, „Nic nie musisz robić” i „Do zrobienia”. Algorytm najbliższej sprawy wybiera otwarty obowiązek z najbliższym terminem. [Dane rodziny](../../../../../app/src/lib/family/ola.ts) · [Przystanki i terminy](../../../../../app/src/lib/demo/fixtures.ts) · [Statusy ścieżki](../../../../../app/src/lib/plan/status.ts) · [Wybór najbliższej sprawy](../../../../../app/src/lib/plan/path.ts) · [Ścieżka z aplikacji](../../../../../app/src/features/journey-map/HorizontalPath.tsx)

**Próba odbiorowa.** Odtworzyć v2 i v3 równolegle od 21/58 do 23/1 w tempie 1×. Wstrzymać na 22/0, 23, 26, 44 i 59, nałożyć obrazy przy 50% krycia. Porównać środek każdego podestu i kontur karty, kiedy znajdują się w kadrze, oraz koniec zielonej linii. Dopuszczalna różnica względem v2 wynosi 1 px. Na szerokości 360 px przy wyciszeniu wskazać „Ola”, odhaczone badania i tytuł następnej sprawy. Z narracją sprawdzić, czy przejazd przez podest z haczykiem wypada podczas zdania o załatwionych sprawach. [Klip v2](../../../v2/sceny/22/ujecie-720p.mp4) · [Klatki wzorcowe](../../../v2/sceny/22/klatki.jpg) · [Plan i przykłady](PLAN.md)
