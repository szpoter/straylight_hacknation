# 28 · Specyfikacja ujęcia „Odpis Oli trafia do szkicu”

Autor planu: s28

54–56 s, klatki filmu 1620–1679. Lokalnie 0–59 przy 30 kl./s. Pozycje oznaczają lewy górny róg w obrazie 1280 × 720.

| Klatki | Wykonanie |
| --- | --- |
| 0–9 | Po cięciu brzegi arkusza zachowują x = 105 i 1175, a tytuł „Wniosek o urlop rodzicielski” w Domine ma lewy margines x = 188. Obok pozostaje „Szkic” w Inter. Lewy wiersz zajmuje (140, 376), prawy cel (676, 376). Oba mają 446 × 108 px. Cały odstęp 90 px jest widoczny. |
| 10–34 | Ikona, obrys i podpis „Odpis aktu urodzenia Oli” tworzą jeden ruchomy obiekt. Unieś go o 22 px do klatki 17, potem przesuń w prawo po płaskim łuku, najwyżej 39 px ponad pozycję spoczynku. Zachowaj pełne krycie, poziomą linię pisma i stały rozmiar. Na liście zostaje pusty obrys. |
| 35–42 | Domknij ruch poziomy do x = 676 w klatce 36. Opuść kartę dokładnie do y = 376 w klatce 42. Przy pierwszym pełnym osadzeniu, globalnie w klatce 1662 (55,400 s), zagra pojedynczy krótki stuk z miksu. Do tej chwili pole ma tylko etykietę i miejsce na plik. |
| 43–59 | W klatkach 43–48 narysuj zielony znak przy etykiecie „Załącznik”. Przez 49–59 wszystkie elementy stoją. Scena 29 przejmuje ostatnią klatkę z odpisem w (676, 376) i rozpoczyna odjazd odsłaniający „Pracodawca · Studio Lipa”. |

Papier #FFFFFF na tle #F5FAF7, obrys #D4D7DD, tusz #283754, potwierdzenie #1A8648. Nazwy pochodzą z rzeczywistego widoku plików i danych szkicu. [Dokumenty sprawy](../../../../../app/src/features/chat/case-data.ts) · [Lista plików](../../../../../app/src/features/documents/DocumentsList.tsx) · [Stuk przy 55,400 s](../../../montaz/miks.py#L65) · [Poprzednie ujęcie](../27/SPEC.md) · [Następne ujęcie](../29/SPEC.md)

## Próba odbiorowa 52–56 s

Odtworzyć sklejkę raz w tempie 1×, przy wyciszonych wszystkich ścieżkach i szerokości podglądu 360 px. Po odtworzeniu poprosić widza, by podał wybór Marty, odczytany okres, nazwę pliku oraz miejsca, z którego i do którego trafił. Oczekiwana odpowiedź brzmi „Razem z Pawłem, 11 stycznia – 7 lutego 2027. Odpis aktu urodzenia Oli przeszedł z Plików dziecka do pola Załącznik w szkicu”. [Próba v2](../../../v2/podglady/52-56-wniosek.mp4)

Przy drugim przebiegu zatrzymać klatki lokalne 0, 24, 42 i 48. Policzyć pełne podpisy odpisu w każdym kadrze. Wynik ma wynosić jeden kolejno na liście, w ruchu i dwukrotnie w celu. Porównać klatki 42 i 48 pod kątem zielonego znaku, a po włączeniu dźwięku sprawdzić początek stuku na 42. [Plan i przykłady](PLAN.md)

## Realizacja v3 (autor s28)

Moduł: [`scene.mjs`](scene.mjs), `export function scene(f, k)`. Wynik zależy tylko od `f`. Wersja kitu `k.rewizja = "r0-pusta"` (scena nie korzysta z obsady). Lokalna klatka `f` = globalna 1620 + `f`.

| Element | Wartość |
| --- | --- |
| Tło / papier | `#F5FAF7` pełny kadr; arkusz `rect` x = 105, y = −12, 1070 × 784, rx 18, obrys `#D4D7DD` 2 px |
| Tytuł | „Wniosek o urlop rodzicielski”, Domine 52 px, x = 188, linia bazowa y = 101, `#283754` ([`DRAFT_TITLE`](../../../../../app/src/features/chat/case-data.ts)) |
| Status | pigułka (963, 56) 119 × 53, wypełnienie `#F5FAF7`, „Szkic” Inter 26 px `#5E697F` |
| Pole „Okres urlopu” (stoi 0–59) | (188, 172)–(1092, 304), rx 14, `#F5FAF7`, obrys `#D4D7DD` 2 px; belka `#1A8648` 5 px x = 190,5, y = 194–282; „Okres urlopu” Inter 500 26 px `#5E697F` (216, 213); znak wyboru r 14 w (412, 204) + „Razem z Pawłem” Inter 600 26 px (438, 213); daty „11 stycznia – 7 lutego 2027” Domine 52 px, odstęp −0,75, linia bazowa (216, 282) — ten sam krój, rozmiar i x co w 27/59 |
| Nagłówki pól | „Pliki dziecka” x = 140 i „Załącznik” x = 676, Domine 37 px, linia bazowa y = 378 |
| Źródło (pusty obrys) | (140, 436) 446 × 108, rx 14, `#F5FAF7`, obrys `#D4D7DD` — stoi przez całe ujęcie, bez tekstu |
| Cel | (676, 436) 446 × 108, przerywany obrys `#5E697F` 8/8 |
| Odpis (jeden obiekt) | karta 446 × 108 `#FFFFFF`, ikona [`FileIcon`](../../../../../app/src/components/ui/icons.tsx) 24→44 px w `#5E697F` (jak w [liście plików](../../../../../app/src/features/documents/DocumentsList.tsx)), podpis Inter 30 px, waga 500 |
| Znak | kółko r = 17 `#1A8648` w (893, 365), ptaszek biały 3 px |

| Klatki | Krzywa | Pozycja odpisu |
| --- | --- | --- |
| 0–9 | — | (140, 436) |
| 10–17 | `lift = smoothstep((f−10)/7)` | y = 436 − 22·lift |
| 17–36 | `s = softLand(smoothstep((f−17)/19))`, łuk `4s(1−s)` | x = 140 + 536·s, y = 414 − 17·łuk |
| 36–42 | `d = softLand((f−36)/6)` | x = 676, y = 414 + 22·d; f = 42 → dokładnie 436 |
| 42–59 | — | (676, 436), obrys karty `#1A8648` |
| 43–48 | `c = (f−42)/6` | kółko: krycie min(1, 2c); ptaszek: `stroke-dashoffset = 1 − c` |

`softLand(t) = (1 − e^(−3,4t)) / (1 − e^(−3,4))`, dopasowane do punktów krzywej z [eases.svg](https://github.com/Tejashmakwana/motionmaxxing/blob/8c8ec0f2a6f6c9a0da15cd24f7b1298ab298368c/docs/media/eases.svg). Różni się od krótkiego nacisku w 21: tu długi ogon hamowania, ostatni krok 0,6 px. Cień pod kartą: elipsa rozmyta `feGaussianBlur`, krycie 0,16·uniesienie; w 0–9 i 42–59 nie jest rysowany (brak filtra i identyfikatora w kadrze 59).

**Styk 27/59 → 28/0.** Arkusz, tytuł, metka i linia y = 151 identyczne z 27/59. Pole dat z 27 (188–1092 × 386–542, daty na y = 500) przechodzi cięciem w ściśnięty pas pod tytułem (172–304, daty na y = 282): te same daty, ten sam x = 216 i rozmiar 52 px, tylko 218 px wyżej. Wybór „Razem z Pawłem” z 27 (osobny wiersz nad polem) trafia do wiersza etykiety pola. Na cięciu oko widzi, że arkusz przesunął się w górę, a nie że daty zniknęły. Pliki zjechały w dół o 60 px, żeby zrobić miejsce na pole.
**Styk 28/59 → 29/0 (współrzędne dla autora 29).** 29 może wywołać `scene(59, k)` jak w v2. Kadr 28/59: tytuł Domine 52 px (188, 101), „Szkic” (963, 56) 119 × 53, linia y = 151, pole dat (188, 172)–(1092, 304) z datami na (216, 282), nagłówki „Pliki dziecka” (140, 378) i „Załącznik” (676, 378), pusty obrys (140, 436), odpis (676, 436) 446 × 108 z zielonym obrysem, znak (893, 365). Arkusz y = −12…772; pas y = 560–720 pusty pod wiersz „Odbiorca” (v2 miał go na y = 554–700, teraz najwyżej od y ≈ 560).

**Render** (narzędzie): `build.mjs` → `film.tsx` (Remotion Player, zegar HyperFrames/GSAP) → Playwright/Chrome → ffmpeg; dźwięk z gotowego `media/miks.flac`, bez zmian. **Przykłady animatora** (zabieg): [Video Shotcraft · budowa karty](../../../v2/przyklady/budowa-karty.jpg) — osobne gniazdo na znak przy etykiecie; Motionmaxxing `softLand` — osiadanie.


## Odbiór

Build `node build.mjs --only 27,28 --out robocze/s28` (scena 27 od autora s27). Klatki globalne 1619, 1620, 1629, 1642, 1644, 1654, 1661, 1662, 1668, 1679 obejrzane w 1280 × 720 i w 360 px. Render [`ujecie-720p.mp4`](ujecie-720p.mp4) (60 kl., 2,0 s, gotowy miks bez zmian). [Klatki 0/24/42/48/59](klatki.jpg) · [v2 (górny rząd) vs v3 (dolny rząd)](pozy.jpg). Wersja po uwadze koordynatora: pole dat zostaje w kadrze.

| Sprawdzenie | Wynik |
| --- | --- |
| Pełne podpisy „Odpis aktu urodzenia Oli” w klatkach 0 / 24 / 42 / 48 | 1 / 1 / 1 / 1 — na liście, w ruchu, w celu, w celu. Na liście zostaje pusty miętowy obrys. |
| Pismo i rozmiar | Poziome, stałe 30 px; pełne krycie. |
| Osadzenie | `pose(41).y = 435,42`, `pose(42) = (676, 436)` — dokładnie w 42. Ruch poziomy kończy się w 36; najwyżej 39 px nad spoczynkiem (kl. 22, górna krawędź y = 397, 11 px pod ogonkami „Załącznik”). |
| Znak | Brak w 42, pełny w 48, przy „Załącznik” nad kartą; nie dotyka nazwy. 49–59 bez zmian. |
| Pole dat | Nieruchome 0–59; daty, „Okres urlopu” i „Razem z Pawłem” czytelne w 360 px. |
| 360 px | Tytuł, „Szkic”, daty, „Pliki dziecka”, „Załącznik” i nazwa pliku czytelne w 24 i 59. |
| Styk 1619/1620 — różnica | Pas y = 0–155 (tytuł, metka, linia): maks. różnica 0, piksel w piksel. Brzegi arkusza (x = 75–135 i 1145–1205, pełna wysokość): 0. Reszta kadru różni się zgodnie z zamiarem (pole dat przesunięte 218 px w górę, pojawiają się pliki). |
| Dźwięk | Próbka „teczka” startuje w 55,400 s = kl. 42,0; pierwszy transjent 55,44 s (kl. 43), główny 55,48 s (kl. 44), narrator od 55,47 s. Kontakt w obrazie 1–2 klatki przed słyszalnym stukiem — w tolerancji. |

**Otwarte uwagi.** (1) Autor 29 musi uwzględnić nowe położenie plików (wiersze y = 436–544) przy odsłanianiu „Odbiorcy” — wiersz w v2 na y = 554 zostawia 10 px odstępu. (2) Stuk w miksie jest 1–2 klatki po kontakcie; nie zmieniałem dźwięku. (3) Ikona pliku w `#5E697F` jak w aplikacji (w v2 zielona).
