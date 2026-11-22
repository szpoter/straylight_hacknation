# 20 · Specyfikacja ujęcia „Wejście marki”

Autor planu: s20

38–40 s, klatki filmu 1140–1199. Podgląd 1280 × 720, 30 kl./s. Współrzędne od lewego górnego narożnika. Kamera stoi. Warstwy od najdalszej to zastygły salon z rodzicami i papierem, mięta, napis oraz jeden oryginalny Zusik.

| Faza i klatki lokalne | Ruch i pozycje kontrolne |
| --- | --- |
| I · 0–5 | Powtórz pełny obraz 19/59 we wszystkich sześciu klatkach. Grzbiet fali stoi, twarze rodziców są rozmyte. Zusik w stanie `available` jest ostry, patrzy na widza i trzyma ramiona przy bokach. Środek (640, 325), ramka 270 × 270 px. |
| II · 6–21 | Od 6 do 15 zwiększ krycie mięty #E4F2E9 za maskotką do 100%. W tym czasie obniż środek do y = 365, poszerz ciało o 4% i skróć je o 4%. Do 21 sylwetka odzyskuje proporcje i siada na y = 358. W klatkach 16–21 obie źrenice kierują się w prawo, bliki przechodzą jedną piątą ich drogi. |
| III · 22–44 | Przesuń środek z (640, 358) do (367, 358) i powiększ ramkę do 310 × 310 px. Na prawo od obrysu otwieraj oba wiersze od lewej do prawej, proporcjonalnie do odległości pokonanej przez postać. Przyhamuj do pełnego zatrzymania. |
| IV · 45–59 | Pełna nazwa stoi nad dwiema liniami bazowymi, y = 344 i 432. Górny wiersz „Przewodnik”, dolny „Rodzica”. Domine Regular 88 px, tusz #283754. Oba wiersze zaczynają się na x = 545. Maska, spojrzenie i ciało stoją przez 15 kolejnych klatek. |

**Styk z ekranem importu.** Nałóż pionową prowadnicę x = 545 na 20/59 i 21/0. Przechodzi przez początek obu wierszy w 20 i lewy brzeg przycisku w 21. Przycisk przed naciśnięciem ma środek (859, 378) i szerokość 628 px. [Ujęcie 21](../21/SPEC.md) · [Układ importu z pozycją przycisku](../../../v2/sceny/21/scene.mjs)

**Próba odbiorowa klipu 36–40 s.** Odtwórz raz bez głosu, także w szerokości 360 px. Poproś widza o wskazanie, skąd ruszyła pierwsza kartka, kto próbuje ją złapać i co pojawia się przed nazwą. Na granicy 19/59 i 20/0 nałóż oba pełne obrazy w trybie różnicy. Jednolita czerń oznacza zachowaną stopklatkę. Przewiń 20/6–21, obserwując kontur i oczy pojedynczego Zusika. Porównaj 20/45 z 20/59 i sprawdź, czy oba słowa można swobodnie odczytać w ostatnim półsekundowym zatrzymaniu. [Klip v2 do porównania](../../../v2/podglady/36-40-rodzina-i-zusik.mp4) · [Plan i przypisane repozytoria](PLAN.md)

## Realizacja v3 (autor s20, blok b19)

- **Kod:** [`scene.mjs`](scene.mjs) importuje `scene`, `frozenRoom` i `ZUSIK` z `../19/scene.mjs`. Eksportuje `zusikState(f)`, `title(reveal)`, `TITLE` i `END` (stan końcowy (367,358), ramka 310).
- **Pozycje kontrolne:** kl. 15: (640,365), sx 1,04, sy 0,96. Kl. 21: (640,358), proporcje 1:1, `look` 1. Kl. 44 i 59: (367,358), ramka 310. Napis i maska jadą z Zusikiem: x napisu = środek + 0,574 × ramka (`TITLE_GAP`). W kl. 22 to 795, a w 44 i 59 to 545. Maska zaczyna się 4 px przed „P”, a jej szerokość to 640 × postęp przejazdu.
- **Wyjście 20/59 → 21/0:** początek obu wierszy na x = 545 to lewy brzeg kapsuły w 21. Tło 20/59 ma kolor #E4F2E9, a ekran importu w 21 ma tło #F5FAF7, zgodnie ze SPEC 21.

## Odbiór

- Styk 19/59 → 20/0: SVG jest identyczne po normalizacji identyfikatorów, a 20/0–5 jest identyczne z 20/0 (`robocze/b19/eq.mjs`). W renderze sekwencyjnym (1138 → 1139 → 1140) pliki PNG 1139 i 1140 są identyczne bajt w bajt, więc różnica wynosi 0. Uwaga: kiedy klatki renderuje się z przeskokami (1132 → 1139 → 1140), Chrome rasteryzuje inaczej około 150 px krawędzi (maks. 54/255). Robi to przeglądarka, nie scena. W zakodowanym klipie MP4 klatki 59 i 60 różnią się o maks. 23/255. To kompresja H.264, nie obraz.
- 20/45 i 20/59 dają identyczny obraz (YMAX różnicy = 0). Oba wiersze są czytelne w podglądzie 320 px.
- Klatki 6–21 obejrzane w arkuszu co 4 klatki: jedno osiadanie, bez drugiego odbicia. Źrenice zwracają się w prawo przed ruszeniem w lewo.
- Poprawka koordynatora (fazy II–III): w kl. 10, 20, 30 i 44 Zusik nie zasłania żadnej litery, a odsłanianie idzie od „P”/„R” (`robocze/b19/k20-10-20-30-44.png`). Kl. 44 i 59 są identyczne bajt w bajt. Poprzedni klip leży w `robocze/b19/stary-klip.mp4`.
