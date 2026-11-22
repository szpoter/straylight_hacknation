# 24 · Specyfikacja ujęcia „Marta pyta o wspólny urlop”

**46–48 s** · 1380–1439 na osi filmu · 60 klatek przy 30 kl./s · współrzędne w 1280 × 720.

| Klatki lokalne | Geometria i typografia |
| --- | --- |
| 0 | Przejąć klatkę 59 z ujęcia 23. Karta ma obrys x=342–990, y=164–464, status „Do zrobienia” i termin „1 grudnia 2026”. Podest leży pod kartą. |
| 1–13 | Zmniejszać mapę i przesuwać ją poziomo względem punktu na prawym boku karty na wysokości y=325. Lewa granica białego panelu przez cały ruch pokrywa się z tym bokiem. Panel pozostaje pusty. |
| 14–25 | Od klatki 14 podpis i cały dymek wchodzą razem. Pierwszy wiersz brzmi „A jeśli weźmiemy”, drugi „urlop razem?”. W ciągu ośmiu klatek grupa podnosi się o 8 px i nabiera pełnego kontrastu. W klatce 25 karta ma 60% początkowego rozmiaru i mieści się między x=38 a x=427. |
| 26–59 | Utrzymać nieruchomą kartę i biały panel x=427–1280. Dymek sięga od x=482 do x=1216. Podpis i pytanie zaczynają się na x=518, linie bazowe pytania leżą na y=350 i 414. Tekst Inter 52 px w kolorze #176343 na tle #E6F3E9. W 25 białe pole i x=518 przechodzą pod odpowiedź. |

## Odbiór

1. Porównać klatkę 59 ujęcia 23 z klatką 0 ujęcia 24. Kontur karty, termin i podest powinny się pokryć. Podczas przejazdu śledzić jej prawy bok aż do x=427. [Wyjście z mapy](../../../v2/sceny/23/klatki.jpg)
2. Obejrzeć dwie sekundy bez głosu, w podglądzie szerokim na 360 px. Po jednym odtworzeniu widz powinien móc powtórzyć całe pytanie i wskazać Martę jako nadawczynię. Przy przeglądaniu klatek 13–21 pierwszy widoczny tekst musi już zawierać słowo „razem?” ze znakiem zapytania. [Dymek rodzica w aplikacji](../../../../../app/src/features/chat/zusik.module.css#L558-L579) · [Zasady wyglądu produktu](../../../../../DESIGN.md)
3. Na styku 24/25 porównać początek wiersza „A jeśli weźmiemy” z początkiem „Oboje możecie korzystać”. Oba zaczynają się na x=518. [Układ odpowiedzi](../25/SPEC.md) · [Klatki odpowiedzi](../../../v2/sceny/25/klatki.jpg)

## Realizacja v3 (autor b24)

Moduł [`scene.mjs`](scene.mjs), `scene(f)`, czysta funkcja klatki. Rewizja kitu nieużywana (scena produktowa, bez obsady). Render: `build.mjs` → `film.tsx` (Remotion Player, zegar HyperFrames/GSAP) → `render.mjs` (Playwright + ffmpeg, `media/miks.flac` bez zmian).

| Klatki | Wartości |
| --- | --- |
| 0 | `drawMap(918, 1584)` z `../v2/sceny/22/scene.mjs`: karta x=342–990, y=164–464, podest (666,523). To dokładnie 23/59 według SPEC 23. |
| 1–25 | `t=f/25`, `move = 1 − (1−t)³(1+3t)` (zerowa prędkość na obu końcach). Krawędź `990 − 563·move`, skala mapy `1 − 0,4·move` wokół (990,325). Maska: poza kartą (340–992 × 162–467) i pasem podestu (y=468–577) mapa blednie do zera. Biały panel od krawędzi, kreska #D4D7DD 2 px, krycie panelu `min(f/9,1)`. |
| 14–21 | `enter=(f−13)/8`. Grupa „Marta” + dymek przy `edge+55`, podnosi się o 8 px (`8(1−enter)²`), krycie `1−(1−enter)²`. Cały tekst od pierwszej widocznej klatki (oba wiersze w jednym `<text>`). |
| 25–59 | Stoi: karta 60 % w x=38–427, panel x=427–1280, dymek x=482–1216 (#E6F3E9, rx 32), „Marta” Inter 600 28 px (518,239), pytanie Inter 500 52 px #176343 na bazach 350 i 414 od x=518. |

Źródła: kolory dymka `--user-bg`/`--user-ink` z [zusik.module.css](../../../../../app/src/features/chat/zusik.module.css), tokeny [DESIGN.md](../../../../../DESIGN.md).

**Styk 23/59 → 24/0.** 24/0 to `drawMap(918, 1584)`. Autor bloku 19–23 nie oddał jeszcze `sceny/23/scene.mjs` (stan na oddanie b24). Jeśli zmieni rysunek mapy (np. powiększy status zgodnie z SPEC 23, pkt 2), 24 musi przejąć ten sam rysunek: wystarczy podmienić import `drawMap`, a reszta ruchu liczy się od krawędzi x=990.
**Styk 24/59 → 25/0.** Panel x=427, wspólny lewy margines tekstu x=518.

## Odbiór

Build `node build.mjs --only 24,25,26,27,28,29,30 --out robocze/b24`. Stopklatki 1380, 1394, 1405, 1439 (1280 × 720 i 360 px). Render [ujecie-720p.mp4](ujecie-720p.mp4), [klatki.jpg](klatki.jpg) (0/20/40/59), [pozy.jpg](pozy.jpg) (v2 u góry, v3 na dole).

| Sprawdzenie | Wynik |
| --- | --- |
| 24/0 = mapa w spoczynku | Tak, `drawMap(918, 1584)`: karta x=342–990, y=164–464. |
| Pierwsza widoczna klatka pytania (14) | Oba wiersze i „razem?” obecne od razu (jeden obiekt tekstowy, krycie ≈ 0,23). |
| Klatka 25 | Krawędź 427, skala 0,6, karta x=38–427. |
| 24/59 → 25/0 | Panel x=427, tekst od x=518 w obu klatkach. |
| 360 px | „A jeśli weźmiemy urlop razem?” i „Marta” czytelne; termin na karcie (≈ 8 px) rozpoznawalny. |

**Wynik.** Ruch obejrzany w całości, bez klatki z problemem. **Otwarte:** styk 23/59 → 24/0 nie mógł być sprawdzony pikselowo — `sceny/23/scene.mjs` nie istnieje w chwili oddania. Po jego oddaniu: różnica 1379/1380; jeśli 23 zmieni rysunek mapy, podmienić import `drawMap` w 24.

## Poprawka koordynatora

Mapa w 24 importuje teraz `drawMap` z `../22/scene.mjs` (v3, kapsuły statusu 30 px) zamiast z v2. Różnica pikseli 1379/1380 wynosi 0. Podgląd `ujecie-720p.mp4` wyrenderowano ponownie.
