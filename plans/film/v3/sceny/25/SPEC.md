# 25 · Specyfikacja odpowiedzi Zusika

**48–50 s** · klatki filmu 1440–1499 · 30 kl./s · układ 1280 × 720.

Po cięciu z 24 zachowaj biały panel od x=427 i początek tekstu na x=518. Na miętowym tle #F5FAF7 ustaw maskotkę w ramce 262 × 262 px o środku (241,328). Podpis „Agent AI · RAG” wyśrodkuj na x=241, na bazie y=529. Po prawej ustaw „Zusik” na (518,239). Poniżej dwa wiersze w Domine 49 px na bazach y=331, 401, kolejno „Oboje możecie korzystać” i „z urlopu jednocześnie.”. Podpisy i link używają Inter. [Wyjście sceny 24](../24/SPEC.md) · [Układ typograficzny w v2](../../../v2/sceny/25/klatki.jpg) · [Styl aplikacji](../../../../../DESIGN.md)

| Klatki lokalne | Ruch i punkty kontroli |
| --- | --- |
| 0–11 | Czytelny cały tekst i spokojna pozycja ciała. W oryginalnym modelu uruchom jeden gest stanu `answering`. W klatce 0 widać uśmiech, w 5 największe otwarcie warstwy `mouth-open`, w 11 znowu tylko uśmiech. Pozycja oczu odpowiada początkowemu przesunięciu (0,−4) w jednostkach SVG postaci. |
| 12–25 | W 12–17 ciało i oczy pozostają w spoczynku. W 18–25 obie źrenice idą w prawo i w dół ku lewemu brzegowi przypisu. Kończą z przesunięciem (+22,+14) względem geometrii źrenic. Każdy blik pokonuje jedną piątą przemieszczenia swojej źrenicy. |
| 26–39 | Przechyl grupę ciała o 5° zgodnie z ruchem wskazówek i opuść środek ramki do (241,332). Cień pozostaje poziomy. Pod linkiem „Kodeks pracy · art. 182¹a § 6” narysuj kreskę od x=518 do x=950 na y=531. Sam napis ma stałą bazę (518,519), szerokość 432 px, Inter 31 px o grubości 600 i kolor #1A8648. |
| 40–59 | Usta zamknięte, spojrzenie na odnośnik, podkreślenie pełnej długości. Utrzymaj tę pozę. Klatka 0 sceny 26 przejmuje wszystkie warstwy. Od klatki 1 otwiera się książka tego samego modelu w stanie `reading`, przy nieruchomym tytule przepisu. |

Pozę twarzy i książki próbkuj według lokalnej klatki na jednej instancji oryginalnego modelu. Wyłącz interaktywną pętlę mowy i losowe gesty na czas tego ujęcia. Zachowaj półksiężyc, trzy kropki, ręce i cień ze wzorca. [Model Bąbelka](../../../../../app/src/components/mascot/babelek/Babelek.tsx) · [Ruch oczu i blików](../../../../../app/src/components/mascot/babelek/useStateAnimation.ts#L107) · [Poza książki](../../../../../app/src/components/mascot/babelek/shapes.ts)

**Próba odbiorowa.** Odtwórz 48–52 s w wyciszonym podglądzie szerokim na 360 px. Po jednym pokazie widz powinien móc powtórzyć odpowiedź Zusika i wskazać przepis, zanim otworzy się książka. Przejdź klatki 0–11, licząc jeden pełny cykl ust. Porównaj 17, 25 i 39, aby zobaczyć kolejność ruchu oczu, ciała i kreski. Nałóż klatkę 1499 na 1500 i sprawdź zgodność konturu, źrenic, liter i obu końców podkreślenia. Sprawdź również klatkę 25 po skoku z obu stron osi i po ponownym otwarciu odtwarzacza. [Kryteria produktu](../../PRODUKT.md) · [Wejście w źródło](../26/SPEC.md)

## Realizacja v3 (autor b24)

Moduły: [`scene.mjs`](scene.mjs) (`scene(f)`, eksportuje też `pose25`, `layout25`, `linkMarkup` dla 26) i [`zusik-ruch.mjs`](zusik-ruch.mjs) (`zusikFilm(cx, cy, size, {look, mouth, tilt, morph, page, parts})`, wspólny z 26). Geometria 1:1 z [geometry.ts](../../../../../app/src/components/mascot/babelek/geometry.ts) (`BODY`, `ARM_OUTLINES`, `SHADOW`, `CRESCENT`, `DOTS`, `EYES`, `MOUTH`, `MOUTH_OPEN`), [shapes.ts](../../../../../app/src/components/mascot/babelek/shapes.ts) (`BODY_POINTS`, `SHAPES.book`, `BOOK`, `smoothPath`), [travel.ts](../../../../../app/src/components/mascot/babelek/travel.ts) (`tuckArm`); stałe ruchu z [useStateAnimation.ts](../../../../../app/src/components/mascot/babelek/useStateAnimation.ts) (`CATCHLIGHT_SHARE 0,2`, `answering` lookAt (0,−4), `READ`) i [AnimatedSvg.tsx](../../../../../app/src/components/mascot/babelek/AnimatedSvg.tsx) (`DETAILS.appearFrom 0,75`, zanikanie ramion i blików). Kolory motywu `fill-babelek-*` jak w `index.html` filmu. Ramka jak `k.zusik`: kwadrat `tight` 1408 jednostek → 262 px (skala 0,18608). Rewizja kitu nieużywana.

| Klatki | Ruch | Krzywa |
| --- | --- | --- |
| 0–11 | `mouth-open`: skalaY 0,2 + 0,8·a od górnej krawędzi kształtu (y=166 twarzy), krycie min(1, a/0,3). a = 0 w 0, 1 w 5, 0 w 11. Uśmiech (`MOUTH`) zawsze na wierzchu. | smoothstep 0–5 i 5–11 |
| 0–17 | Źrenice (0, −4), bliki (0, −0,8) — poza `answering`. | — |
| 18–25 | Źrenice → (+22, +14), bliki → (+4,4, +2,8). | easeOut³ |
| 26–39 | Przechył postaci 0 → 5° w prawo wokół (1023,5; 1531) — dół ciała, cień poziomy i nieruchomy. Środek ramki 328 → 332. Kreska linku #1A8648 x=518 → 950, y=529,5, wys. 3. | smoothstep |
| 40–59 | Stoi. Usta zamknięte, źrenice (+22, +14), przechył 5°, środek (241, 332). | — |

Tekst: „Zusik” Inter 600 30 px #1A8648 (518,239); odpowiedź Domine 49 px, odstęp −0,9, #283754, bazy 331 i 401, oba wiersze od klatki 0; „Kodeks pracy · art. 182¹a § 6” Inter 600 31 px #1A8648, (518,519), `textLength` 432; „Agent AI · RAG” Inter 25 px #5E697F, środek x=241, baza 529. Tło #F5FAF7, biały panel od x=427 z kreską #D4D7DD.

**Styki.** 24/59 → 25/0: panel x=427 i margines x=518 bez zmian. 25/59 → 26/0: 26 zwraca dokładnie `scene25(59)`.

## Odbiór

Stopklatki 1440, 1445, 1465, 1499 (+ zbliżenia twarzy `robocze/b24/z25.png`). Render [ujecie-720p.mp4](ujecie-720p.mp4), [klatki.jpg](klatki.jpg), [pozy.jpg](pozy.jpg).

| Sprawdzenie | Wynik |
| --- | --- |
| Jeden cykl ust 0–11 | Uśmiech w 0, największe otwarcie w 5, uśmiech w 11; poza tym usta zamknięte. |
| Kolejność 17 / 25 / 39 | 17: oczy (0,−4), ciało proste; 25: źrenice (+22,+14) na link, ciało proste; 39: przechył 5° i pełna kreska. |
| Wierność modelu | Neutralna poza `zusikFilm` vs `k.zusik` (oryginalny `<Babelek/>`) w 315 px: 415 pikseli różni się tylko wygładzaniem krawędzi (maks. 49/255), kształty identyczne. |
| Determinizm | Klatka 1465 po skoku 1559 → 1512 → 1465 i po świeżym starcie 1380 → 1465: różnica 0. |
| 25/59 → 26/0 | Różnica 1499/1500 = 0 (cały kadr). |
| 360 px | Odpowiedź, link i kierunek spojrzenia czytelne. |

**Wynik.** Gest obejrzany w całości, bez klatki z problemem. Otwarte: brak.
