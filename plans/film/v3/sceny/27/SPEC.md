# 27 · Specyfikacja ujęcia „Wspólny urlop w szkicu Marty”

Autor planu: s27

52–54 s, klatki filmu 1560–1619. Lokalnie 0–59 przy 30 kl./s. Współrzędne w kadrze 1280 × 720, od lewego górnego rogu.

| Klatki | Ustawienie i ruch |
| --- | --- |
| 0–5 | Na styku 26/59 → 27/0 zachować kartę od (150, 182) do (1130, 552) i kreskę #A6D0B8 od (227, 429), 273 × 7 px. W pierwszej klatce w miejscu cytatu stoi już cały zakres „11 stycznia – 7 lutego 2027”, z początkiem przy x = 225 i linią bazową y = 413. |
| 6–17 | Utrzymać zielony znak wyboru i „Razem z Pawłem” w Inter 44 px nad datami w Domine 62 px. Zakres jest pojedynczym obiektem tekstowym i pozostaje widoczny od pierwszej do ostatniej klatki. |
| 18–40 | Przenieść linię bazową dat z (225, 413) do (216, 500), zmniejszając krój do 52 px i hamując przed końcem. Wypełnienie pola rozwijać poziomo za datami, obrys pokazać dopiero po osiągnięciu pełnej szerokości. Etykieta „Okres urlopu” porusza się nad wartością. Jej dolna krawędź ma stale przynajmniej 16 px odstępu od najwyższej litery dat. Na końcu pole zajmuje x = 188–1092 i y = 386–542. |
| 41–59 | Utrzymać arkusz na x = 105–1175, margines tekstu x = 188, tytuł „Wniosek o urlop rodzicielski” w Domine i status „Szkic” w Inter. Obie informacje są czytelne obok siebie. Przy cięciu do 28 zachować tytuł, status, brzegi papieru i kolory. Dopiero niżej pojawi się „Odpis aktu urodzenia Oli”. |

Papier #FFFFFF, tło i aktywne pole #F5FAF7, tusz #283754, obrys #D4D7DD, zielony znak #1A8648. Wariant i daty pozostają poziome. Ruch kończy się pod słowem „wniosek”; matowy stuk jest zarezerwowany dla kontaktu odpisu z polem w scenie 28. [Wzorzec v2](../../../v2/sceny/27/klatki.jpg) · [Przejęcie kreski](../26/SPEC.md) · [Następne ujęcie](../28/SPEC.md)

## Próba odbiorowa przy 360 px

Po złożeniu scen odtworzyć wyciszony klip 52–56 s z szerokością obrazu 360 px, w normalnym tempie. Po jednym przebiegu widz powinien wskazać, z kim Marta bierze urlop, od kiedy do kiedy trwa i jaki dokument trafia następnie do szkicu. W drugim przebiegu zatrzymać klatki 20, 30 i 40. Cały zakres musi pozostać widoczny raz, z odstępem między cyframi i etykietą także w połowie ruchu. Na styku 26/27 porównać oba końce kreski, a na 27/28 wyrównanie tytułu i brzegów arkusza. [Pola szkicu](../../../../../app/src/features/chat/draft-form.tsx) · [Plan i przykłady](PLAN.md)

## Realizacja v3 (autor s27)

Rewizja kitu `k.rewizja = "r0-pusta"` (scena nie korzysta z obsady). Kod: [scene.mjs](scene.mjs). Metryki fontów zmierzone w Chrome na fontach filmu (`robocze/s27/measure.mjs`): Domine „11 stycznia – 7 lutego 2027” ma wznoszenie 0,781 em, zejście 0,190 em, szerokość 752,3 px przy 62 px (odstęp liter −0,0145 em). Inter 500 26 px „Okres urlopu”: wznoszenie 19,2, zejście 5,3.

**Źródła tekstów.** `DRAFT_TITLE` „Wniosek o urlop rodzicielski” i znacznik „Szkic” ([draft-form.tsx](../../../../../app/src/features/chat/draft-form.tsx), [case-data.ts](../../../../../app/src/features/chat/case-data.ts), `OLA.employer` w [ola.ts](../../../../../app/src/lib/family/ola.ts)). `CHOICE_FIELD_LABEL` „Sposób korzystania z urlopu”, `CHOICE_TEXT.razem.short` „Razem z Pawłem”, `PENDING_ROWS.period` „Okres urlopu” / „11 stycznia – 7 lutego 2027”. Wiersz „Do pracodawcy · Studio Lipa” (`RECIPIENT` = `OLA.employer`) celowo nie wchodzi w 27 ani w 28: odbiorcę odsłania 29.

### Klatki i krzywe

Krzywe (wzory z Motionmaxxing `runtime/motion.js`): `softLand` = expoOut(3,41), `glide` = powerOut(1,7), `softInOut` = smoothP(1,42), `cruise` = liniowa. Postęp `t = (f − a)/(b − a)` obcięty do 0–1.

| Element | Klatki | Krzywa | Od → do |
| --- | --- | --- | --- |
| Kreska #A6D0B8 | 2–8 | softLand | szer. 273 → 308 przy (227, 429), wys. 7 |
| Kreska — jazda | 18–40 | jak daty | x = datyX + 2, y = datyY + 16·s, szer. 308·s (s = rozmiar/62) |
| Kreska — zwinięcie | 26–36 | softInOut | szerokość → 0 do lewej, krycie 1 → 0 |
| Arkusz | 18–34 | softLand | (150, 182)–(1130, 552), rx 35 → (105, −12)–(1175, 772), rx 18 |
| Daty | 18–40 | glide | (225, 413), 62 px → (216, 500), 52 px |
| „Sposób korzystania z urlopu” | 18–40 | glide | Inter 26 (225, 262) → Inter 24 (188, 244) |
| Znak + „Razem z Pawłem” | 18–40 | glide | koło (245, 314) r 18, tekst Inter 600 44 px x 281 / baza 330 → koło (206, 291) r 17, tekst Inter 600 38 px x 236 / baza 304 |
| Etykieta „Okres urlopu” | 24–32 krycie (cruise) | tor związany z datami | x = datyX, baza = datyY − 0,781·rozmiar − 25,3 (dolna krawędź liter stale 20 px nad górą dat) |
| Wypełnienie pola #F5FAF7 | 24–27 krycie, 24–38 kształt | glide (poziomo), softLand (pionowo) | od prostokąta 10 px wokół dat+etykiety do (188, 386)–(1092, 542); w każdej klatce zawiera daty, etykietę i kreskę z zapasem ≥ 10 px |
| Obrys pola #D4D7DD 2 px, rx 14 | 37–40 | cruise | krycie 0 → 1 |
| Belka pola #1A8648 5 px | 36–40 | softLand | od środka y = 464 do y = 414–514 przy x = 190,5 |
| Tytuł | 24–36 | softLand / softInOut 24–32 | y +12 → 0, krycie 0 → 1 |
| „Szkic” | 27–37 | j.w. | j.w. |
| Linia podziału y = 151 | 29–40 | softLand | x 188 → 1092 |

**Kontrola toru etykiety.** Wiersz wyboru kończy się najniżej na y = 332 − 24p (koło), etykieta zaczyna się na y = 320,1 + 94,8p (p = postęp `glide` dat). Od klatki 24 (p ≥ 0,42) odstęp wynosi ≥ 38 px, dlatego etykieta i wypełnienie wchodzą dopiero w 24. Etykieta jest od 24 do 59 stale 20,0 px nad najwyższą literą dat (warunek ≥ 16 px).

### Styk 26/59 → 27/0

Tło #F5FAF7. Karta biała, obrys #D4D7DD 2 px, (150, 182)–(1130, 552), rx 35 (jak koniec v2/26). Kreska #A6D0B8 (227, 429), 273 × 7, rx 3,5. W 27/0 daty Domine 62 px od x = 225 (pierwszy piksel tuszu „1” na x ≈ 227,8), baza y = 413, nad nimi „Razem z Pawłem” i etykieta wyboru. Autor 26 utrzymuje te wymiary karty i kreski w 26/30–59.

### Kadr końcowy 27/41–59 = wejście 28/0

Klatki 41–59 są identyczne. Wszystkie wartości dokładne:

| Element | Geometria |
| --- | --- |
| Tło | #F5FAF7, cały kadr |
| Arkusz | prostokąt x = 105–1175, y = −12–772 (góra i dół poza kadrem), rx 18, #FFFFFF, obrys #D4D7DD 2 px |
| Tytuł | „Wniosek o urlop rodzicielski”, Domine 400 52 px, odstęp liter −1,2 px, #283754, x = 188, baza y = 101 (tusz y ≈ 60–111, szerokość 682 px, koniec x ≈ 870) |
| Status | pigułka x = 963–1082, y = 56–109, rx 26,5, #F5FAF7, obrys #D4D7DD 2 px; „Szkic” Inter 400 26 px #5E697F, środek x = 1022,5, baza y = 92 |
| Linia podziału | y = 151, x = 188–1092, #D4D7DD 2 px |
| Wybór | „Sposób korzystania z urlopu” Inter 24 #5E697F (188, 244); koło (206, 291) r 17 #F5FAF7 obrys #1A8648 2,5; „Razem z Pawłem” Inter 600 38 px #283754, x = 236, baza 304 |
| Pole „Okres urlopu” | x = 188–1092, y = 386–542, rx 14, #F5FAF7, obrys #D4D7DD 2 px; belka #1A8648 5 px x = 190,5, y = 414–514 |
| Etykieta | „Okres urlopu” Inter 500 26 px #5E697F, x = 216, baza y = 434 (tusz 414,8–439,3) |
| Daty | „11 stycznia – 7 lutego 2027” Domine 400 52 px, odstęp −0,75 px, #283754, x = 216, baza y = 500 (tusz ≈ 218–847 × 459,4–509,9) |

**Uzgodnienie z 28.** Nagłówek przyjąłem dokładnie z gotowego `sceny/28/scene.mjs` (arkusz `x=105 y=-12 1070×784 rx 18`, tytuł baza 101, pigułka (963, 56) 119 × 53, linia y = 151), więc w 27/59 i 28/0 tło, brzegi arkusza, tytuł, „Szkic” i linia podziału mają identyczne piksele. Cięcie wymienia tylko treść poniżej linii (y > 151): wybór i pole „Okres urlopu” ustępują „Plikom dziecka” i „Załącznikowi”. Jeśli 28 zmieni nagłówek, musi zmienić te same liczby tutaj i w `scene.mjs` 27.

## Odbiór

Build `node build.mjs --only 26,27,28 --out robocze/s27`. Złożyły się 27 i 28, a 26 nie ma jeszcze `scene.mjs`. Stopklatki: `klatki.mjs` 1560, 1565, 1574, 1578, 1580, 1582, 1584, 1586, 1590, 1600, 1619, 1620. Render: [ujecie-720p.mp4](ujecie-720p.mp4), przegląd wszystkich 60 klatek w siatce 8 × 8 (`robocze/s27/wszystkie.png`). [klatki.jpg](klatki.jpg) pokazuje klatki 0, 20, 30, 40 i 59. [pozy.jpg](pozy.jpg) pokazuje te same klatki: v2 u góry, v3 na dole.

| Sprawdzenie | Wynik |
| --- | --- |
| Daty jednym obiektem w 0–59 | Tak. To jeden element `<text>` z niezmiennym ciągiem znaków, bez klonów i bez przycięcia. W każdej klatce siatki zakres jest cały i poziomy. |
| Etykieta ≥ 16 px nad datami (20, 30, 40) | W 20 etykiety jeszcze nie ma (wchodzi 25–32). Pomiar pikseli na nagraniu (`robocze/s27/gap.py`) daje 23 px w 26, 21 px w 30 i 21–22 px w 34–59. Minimum to 20 px na 27–34. Wiersz wyboru jest przez cały czas co najmniej 38 px nad etykietą. |
| Krawędź pola a znaki | W 24–40 wypełnienie zawsze obejmuje daty, etykietę i kreskę z zapasem 10 px. Obrys pojawia się dopiero przy pełnym rozmiarze (37–40). W 30 nic nie przecina liter. W v2/30 krawędź przecinała daty po „stycznia”, co widać w pozy.jpg. |
| Brzeg arkusza a znaki | Brzegi idą tylko na zewnątrz. Tytuł i „Szkic” wchodzą dopiero po przejściu górnego brzegu nad nimi (od 24 i 27). |
| Styk 27/59 → 28/0 | Różnica pikseli 1619/1620 w pasie y = 0–160 (arkusz, tytuł, „Szkic”, linia) wynosi 0. Poniżej y = 151 cięcie wymienia treść zgodnie z planem 28. |
| Styk 26/59 → 27/0 | Nie sprawdzony pikselowo, bo nie ma modułu 26. Strona 27/0 zgadza się z SPEC 26 i geometrią v2/26: karta (150, 182)–(1130, 552), rx 35, kreska (227, 429), 273 × 7. |
| 360 px (0, 20, 30, 40, 59) | „Razem z Pawłem” (ok. 10–12 px) i daty (ok. 15–17 px) są czytelne. Tytuł i „Szkic” też. Etykieta „Okres urlopu” ma ok. 7 px, rozpoznawalna, choć drobna. |
| Determinizm | Scena jest czystą funkcją `f` (bez zegara i losowości). Klatki z `klatki.mjs` (skoki) i z `render.mjs` (po kolei) pokazują te same pozy. |
| Bezruch 41–59 | W pomiarze wszystkie 19 klatek mają identyczne wartości. |

**Wynik.** Gest obejrzany w całości klatka po klatce (siatka 0–59 i stopklatki). Nie widzę klatki z problemem.

**Otwarte uwagi.** (1) Styk 26/27 trzeba potwierdzić różnicą 1559/1560, kiedy powstanie `sceny/26/scene.mjs`. Karta 26 musi mieć rx 35, obrys 2 px #D4D7DD, a kreska rx 3,5. (2) Wiersz „Do pracodawcy · Studio Lipa” świadomie pominięty, bo odsłania go 29. Jeśli reżyser chce go w 27, wejdzie pod tytuł kosztem przesunięcia linii podziału, a 28 musiałaby to powtórzyć. (3) Etykieta przy 360 px jest drobna. Można ją powiększyć do 28 px, ale trzeba wtedy przeliczyć tor (odstęp 20 px zostaje).
