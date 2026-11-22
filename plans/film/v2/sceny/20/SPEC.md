# Ujęcie 20 · Specyfikacja klatkowa

1280 × 720, 30 kl./s. Lokalne klatki 0–59 odpowiadają klatkom 1140–1199 filmu. Kamera pozostaje nieruchoma. Z przodu jest jeden oryginalny Zusik z aplikacji, za nim napis, najdalej salon lub mięta. [Referencja kompozycji](../../../referencje/fala-formularzy-zusik-v1.png) · [Wzorzec kolorów i Domine](../../../../../DESIGN.md)

| Klatki lokalne | Obraz i ruch |
| --- | --- |
| 0–5 | Ostatnia klatka ujęcia 19. Oryginalny Zusik jest ostry, ma środek (640, 325) i rozmiar 270 px. Fala i obie twarze za nim stoją. |
| 6–15 | Salon stopniowo przykrywa jednolita mięta #E4F2E9. Zusik opada do y = 365. Przy najniższej pozycji jego szerokość rośnie o 4%, a wysokość maleje o 4%. |
| 16–21 | Sylwetka wraca do zwykłych proporcji, środek do y = 358. Wzrok kieruje się w prawo i poprzedza ruch ciała. |
| 22–44 | Środek przejeżdża z x = 640 do x = 367. Kwadrat maskotki powiększa się z 270 do 310 px. Pole z napisem otwiera się od jej prawego boku. Na końcu lewy brzeg tekstu przypada na x = 545. |
| 45–59 | Stała plansza. Pierwszy wiersz „Przewodnik”, drugi „Rodzica”. Linie bazowe y = 344 i 432 px. Domine Regular 88 px, tusz #283754. |

Klatki 0 i 59 poprzedniego ujęcia muszą pokrywać się piksel w piksel na styku. Ruch maskotki i obszaru odsłonięcia korzysta z tej samej wartości przejazdu. Przy końcu przejazd wyhamowuje. [Motionmaxxing · krzywe](https://github.com/Tejashmakwana/motionmaxxing/blob/8c8ec0f2a6f6c9a0da15cd24f7b1298ab298368c/docs/media/eases.svg) · [Bang Motion · wspólny zegar animacji otwarcia](https://github.com/bangtutorial/bang-motion/blob/c1aa65e921c970d858705fcb4a53a8294d1a4131/assets/starter-opener.html)

## Załączniki do odbioru

![Klatki 0, 20, 40 i 59 z ukończonego ujęcia](klatki.jpg)

[Ujęcie z głosem lub dźwiękiem sceny](ujecie-720p.mp4) · [Załączony przykład warsztatowy](../../przyklady/gest-interfejsu.jpg) · [Autorstwo przykładów](../../przyklady/ZRODLA.md)
