# 28 · Odpis Oli trafia do szkicu

Autor planu: s28

**54–56 s.** W 27 Marta wybrała „Razem z Pawłem” i widzieliśmy jej daty w polu „Okres urlopu”. Cięcie niżej odsłania skąd Marta bierze dokument do tego samego wniosku. Widz może poprowadzić wzrok za słowem „Odpis” od nagłówka listy do nagłówka pola. [Szkic Marty](../../../../../app/src/features/chat/draft-form.tsx) · [Design produktu](../../../../../DESIGN.md) · [Stany Zusika i przejścia](../../PRODUKT.md)

| Klatki | Co widzi i słyszy widz |
| --- | --- |
| 0–9 | Kamera stoi. Na białej stronie pozostają tytuł wniosku i „Szkic”. Pod „Pliki dziecka” leży jeden „Odpis aktu urodzenia Oli”. Po prawej widać nagłówek „Załącznik” i pusty obrys. |
| 10–34 | Wiersz wraz z ikoną unosi się, odsłania wolne miejsce na liście i przechodzi nad przerwą między polami. Nazwa pozostaje pozioma i w pełni widoczna. |
| 35–42 | Wiersz zwalnia nad celem i schodzi ostatnie piksele pionowo. Przy zetknięciu krawędzi z polem słychać jeden matowy stuk. |
| 43–59 | Przy „Załączniku” rysuje się zielony znak. Źródło jest puste, nazwa odpisu pozostaje w szkicu. Końcową kompozycję utrzymujemy do chwili, gdy w 29 kamera zacznie odjazd ku odbiorcy. |

Na planszy Video Shotcraft elementy karty mają odrębne miejsca. U nas miejsce na znak rezerwujemy przy etykiecie pola, żeby nigdy nie przykrył nazwy. Z wykresu Motionmaxxing bierzemy łagodne hamowanie `softLand` na ostatnim odcinku drogi. [Video Shotcraft · budowa karty](../../../v2/przyklady/budowa-karty.jpg) · [Oryginał](https://github.com/Vincentwei1021/video-shotcraft/blob/59f3e9b9e936ff2bce0e18446226d770a3f2f61f/gallery/media/poster/product-card-progressive-assemble.jpg) · [Motionmaxxing · przebieg wyhamowania](https://github.com/Tejashmakwana/motionmaxxing/blob/8c8ec0f2a6f6c9a0da15cd24f7b1298ab298368c/docs/media/eases.svg)

[Specyfikacja tego ujęcia](SPEC.md)

## Realizacja v3 (autor s28)

Wersja kitu: `k.rewizja = "r0-pusta"`. Scena nie używa postaci ani rekwizytów z `obsada/`; rysuje wyłącznie arkusz szkicu, więc zmiana modeli jej nie przestawia. Zusik nie występuje.

**Co robi ruch dla widza.** Na ekranie jest przez cały czas jeden „Odpis aktu urodzenia Oli”. Na liście zostaje tylko pusty, miętowy obrys, bez drugiego podpisu. Widz widzi więc przeniesienie, nie kopię. Zielony znak pojawia się dopiero po stuku, przy słowie „Załącznik”, więc potwierdza miejsce, a nie zasłania nazwy.

| Klatki lokalne (globalne) | Realizacja |
| --- | --- |
| 0–9 (1620–1629) | Poza spoczynkowa. Pod linią tytułu stoi przez całe ujęcie pole „Okres urlopu · Razem z Pawłem” z datami „11 stycznia – 7 lutego 2027”. Arkusz x = 105–1175, tytuł Domine 52 px od x = 188 (linia bazowa y = 101), metka „Szkic” Inter 26 px w pigułce (963, 56) 119 × 53, linia pod tytułem y = 151. Odpis leży w (140, 436), cel to przerywany obrys (676, 436). |
| 10–17 (1630–1637) | Uniesienie o 22 px krzywą wejścia i wyjścia (smoothstep). Pod kartą rośnie miękki cień, który mówi „podniesione”. |
| 17–36 (1637–1656) | Przelot w prawo: x = 140 → 676. Czas wygładzony smoothstepem, a potem przepuszczony przez `softLand`, więc ruch rusza bez szarpnięcia i długo wyhamowuje nad celem. Płaski łuk dokłada najwyżej 17 px, razem 39 px nad spoczynkiem (w połowie drogi). |
| 36–42 (1656–1662) | Opadanie 22 px krzywą `softLand` (wykładnicza, k = 3,4). Ostatni krok to 0,6 px, więc karta „dotyka” pola w 42 prawie bez prędkości. Cień znika razem z uniesieniem. W 42 obrys karty zmienia się na zielony. Stuk z miksu na 55,400 s = klatka 1662. |
| 43–48 (1663–1668) | Zielone kółko przy „Załącznik” (środek x = 893, y = 365) pojawia się, a biały ptaszek rysuje się po ścieżce. |
| 49–59 (1669–1679) | Nic się nie rusza. 59 jest identyczna z 49. |

**Dwie krzywe, dwa charaktery.** Krótki nacisk z 21 to szybkie zejście i powrót w kilku klatkach. Tutaj osiadanie jest cięższe: `softLand` z Motionmaxxing (12 kl., „panele i UI osiadające na miejscu”), połowa drogi w ok. 25% czasu i długi ogon. Wartości odczytano z punktów krzywej w pliku SVG (postęp 0,30 / 0,59 / 0,85 przy 10 / 25 / 50% czasu). Dopasowanie to `(1 − e^(−3,4·t)) / (1 − e^(−3,4))`.

**Styki.** 27/59 → 28/0: ten sam arkusz, tytuł, metka i kolory co w briefie 27 (x = 105–1175, margines 188). Pole dat z 27/59 nie znika na cięciu: stoi przez całe 28 jako ściśnięty pas pod tytułem (188–1092 × 172–304) z „Okres urlopu”, „Razem z Pawłem” i datami Domine 52 px na x = 216, tylko 218 px wyżej. Widz czyta cięcie jako przesunięcie arkusza w górę. Pliki zjechały o 60 px w dół (wiersze y = 436). Test różnicy 1619/1620: tytuł i brzegi piksel w piksel. 28/59 → 29/0: 29 może wywołać `scene(59, k)` i zawinąć wynik w transformację odjazdu. Klatka 59 nie zawiera filtrów ani identyfikatorów, a pas pod polami (y > 560) jest pusty na wiersz „Odbiorca”.

**Narzędzie renderu vs przykład animatora.** Render: moduł `scene.mjs` zwraca SVG; składa go `film.tsx` (Remotion Player na zegarze HyperFrames/GSAP), klatki robi Playwright w Chrome, wideo ffmpeg. Przykłady, z których wziąłem zabieg: Video Shotcraft „budowa karty” (osobne miejsce na każdy element, więc znak ma swoje gniazdo przy etykiecie) i Motionmaxxing `softLand` (przebieg osiadania).
