# 27 · Wspólny urlop w szkicu Marty

Autor planu: s27

**52–54 s.** Widz śledzi wybrany przez Martę okres od słów „Razem z Pawłem” do pola „Okres urlopu” w jej wniosku. Głos „Pomaga jej wypełnić wniosek…” towarzyszy ruchowi. Sens sceny ma wynikać również z samego obrazu. [Reżyseria produktu](../../PRODUKT.md) · [Dane wariantu i okresu](../../../../../app/src/features/chat/case-data.ts)

| Klatki | Co widzi widz |
| --- | --- |
| 0–5 | Cięcie na miętowej kresce. W 26 podkreślała „jednocześnie”, teraz w tym samym miejscu podkreśla początek „11 stycznia – 7 lutego 2027”. Biały papier zachowuje brzegi. |
| 6–17 | Czas na odczytanie „Razem z Pawłem”. Zielony znak wyboru stoi obok tych słów, pełne daty wciąż mieszczą się w jednym wierszu pod nimi. |
| 18–40 | Arkusz rozsuwa się wokół wyboru. Wzrok może podążać za pierwszym „11”, kiedy cały wiersz zjeżdża do podświetlonego pola. Powierzchnia pola rośnie za napisem. Etykieta „Okres urlopu” wchodzi na wydzielony pas powyżej cyfr. |
| 41–59 | Oko może wrócić od dat do tytułu „Wniosek o urlop rodzicielski” i statusu „Szkic”. Cięcie w 54,00 s odsłoni niższy fragment tej samej kartki, gdzie czeka pole „Załącznik”. |

**Dwa wzorce.** Na planszy Video Shotcraft cena ma własny wiersz między tytułem karty a opisem. Nasz zakres dostaje taki sam oddech, gdy arkusz ujawnia pozostałe pola. Na planszy Bang Motion pozioma czerwona linia biegnie przez całą sylwetkę pociągu. W ujęciach 26 i 27 oko rozpoznaje miętową linię po obu stronach cięcia. [Video Shotcraft · budowa karty](../../../v2/przyklady/budowa-karty.jpg) · [Oryginał](https://github.com/Vincentwei1021/video-shotcraft/blob/59f3e9b9e936ff2bce0e18446226d770a3f2f61f/gallery/media/poster/product-card-progressive-assemble.jpg) · [Bang Motion · ciągłość gestu](../../../v2/przyklady/ciagly-ruch.jpg) · [Oryginał](https://github.com/bangtutorial/bang-motion/blob/c1aa65e921c970d858705fcb4a53a8294d1a4131/docs/gallery/05-continuous-action.jpg)

Pisownię wariantu i dat bierzemy z pól szkicu, a nagłówek i status ze strony formularza Marty. [Szkic Marty](../../../../../app/src/features/chat/draft-form.tsx) · [Wygląd produktu](../../../../../DESIGN.md) · [Specyfikacja ujęcia](SPEC.md)

## Realizacja v3 (autor s27)

**Reżyseria.** Ujęcie ma jeden gest: zakres dat zjeżdża z karty przepisu do pola w szkicu, a kartka rozsuwa się wokół niego. Wszystkie pozostałe elementy reagują na ten ruch albo pojawiają się w kolejności, w jakiej widz je czyta. Daty są jednym obiektem tekstowym przez 60 klatek, nic ich nie zasłania i nic nie przechodzi przez litery.

| Etap | Klatki | Co się dzieje | Krzywa |
| --- | --- | --- | --- |
| Przejęcie kreski | 0–8 | Karta i miętowa kreska jak w 26/59. Od 2 do 8 kreska wydłuża się z 273 do 308 px i obejmuje całe „11 stycznia”. | `softLand` |
| Odczyt wyboru | 9–17 | Bezruch. Zielony znak, „Razem z Pawłem” (Inter 44) i daty (Domine 62) w jednym bloku. | — |
| Rozsunięcie arkusza | 18–34 | Brzegi karty odchodzą od treści na zewnątrz do arkusza x = 105–1175, góra y = −12 (poza kadrem, jak w 28). Brzeg nigdy nie mija liter, bo porusza się od nich. | `softLand` |
| Zjazd dat | 18–40 | Daty z (225, 413) / 62 px do (216, 500) / 52 px. Blok wyboru przesuwa się razem z nimi do (188, 244). Kreska jedzie pod datami i od 26 do 36 zwija się w lewo, w miejsce zielonej belki pola. | `glide` |
| Pole i etykieta | 24–40 | Wypełnienie pola zaczyna się jako jasny prostokąt ciasno wokół dat i etykiety, potem rozwija się do x = 188–1092, y = 386–542. Etykieta „Okres urlopu” jedzie na własnym torze stale 20 px nad najwyższą literą dat. Obrys pola 37–40, belka 36–40. | `glide` (szerokość), `softLand` (wysokość), `cruise` (krycie) |
| Nagłówek | 24–40 | Kolejno: tytuł (24), „Szkic” (27), linia podziału (29–40). Geometria nagłówka jest wspólna z 28/0. Wiersz odbiorcy zostaje dla 29. Każdy element wznosi się o 12 px z krycia 0. | `softLand` + `softInOut` |
| Bezruch | 41–59 | 19 identycznych klatek. Oko wraca od dat do tytułu i „Szkic”. | — |

**Gest.** Na planszy Bang Motion linia prowadzi oko przez całą sylwetkę. U nas tą linią jest mięta: pod „jednocześnie” w 26, pod „11 stycznia” w 27/0–17, a potem chowa się w zieloną belkę pola. Na planszy Video Shotcraft elementy karty składają się po kolei, każdy w swoim rzędzie. U nas kolejność to: wybór → daty → pole → etykieta → nagłówek, z lewym marginesem 188 dla arkusza i 216 dla treści pola.

**Narzędzia.** Render: `v3/build.mjs` (esbuild) + `v3/film.tsx` (Remotion Player + zegar GSAP) + `klatki.mjs`/`render.mjs` (Playwright + Chrome + FFmpeg). Scena jest czystą funkcją SVG od numeru klatki. Krzywe przepisane wprost ze wzorów Motionmaxxing (`runtime/motion.js`, nic nie jest importowane z zewnątrz). Przykłady dla animatora (tylko do oglądania, nie uruchamiane): Video Shotcraft `demos/ui-entrance/product-card-progressive-assemble/ProductCardProgressiveAssemble.tsx` @59f3e9b, Bang Motion `docs/gallery/05-continuous-action.jpg` @c1aa65e, Motionmaxxing `docs/media/eases.svg` i `runtime/motion.js` @8c8ec0f. Rewizja kitu: `k.rewizja = "r0-pusta"`; scena nie używa obsady ani rekwizytów z kitu. Szczegóły liczbowe: [SPEC.md](SPEC.md#realizacja-v3-autor-s27).
