# 28 · Przeniesienie odpisu

**Klatki 1620–1679, 30 kl./s, obraz 1280 × 720.** Cięcie niżej na arkusz sceny 27 zachowuje jego krawędzie x = 105 i 1175, biały papier na #F5FAF7, szary obrys #D4D7DD i zieleń #1A8648. Tytuł pozostaje przy x = 188 w Domine, metka „Szkic” w Inter. Pod linią nagłówka czytamy „Pliki dziecka” i „Załącznik”. Między polami mieści się 90 px pustej przestrzeni. [Zamknięcie sceny 27](../27/scene.mjs) · [Pole załącznika](../../../../../app/src/features/chat/case-data.ts)

| Klatka lokalna | Położenie i zdarzenie |
| --- | --- |
| 0–9 | Wiersz 446 × 108 px przy (140, 376). Nazwa „Odpis aktu urodzenia Oli” występuje raz. Z prawej spokojny, przerywany obrys pola przy (676, 376). |
| 10–17 | Wiersz odrywa się od miejsca na liście. Unosi się o 22 px, zachowując poziomą linię pisma. |
| 18–34 | Wiersz przechodzi przez prześwit. Przyspiesza po starcie i zwalnia w pobliżu celu. Łuk daje kolejne 17 px uniesienia w połowie drogi. |
| 35–42 | Wiersz osiada pionowo na powierzchni pola. Klatka 42, czyli 55,400 s, to dokładny kontakt i początek matowego stuknięcia. |
| 43–48 | Obok etykiety „Załącznik” pojawia się zielona pieczęć z rysowaną fajką. |
| 49–59 | Pełna pauza. Wiersz w (676, 376), identyczna ikona i pełna nazwa pliku. Scena 29 może rozpocząć odjazd z tego stanu. |

**Dwa przykłady ruchu.** W Motionmaxxing wariant `slide` prowadzi element w jednej osi i wyhamowuje krzywą `softLand`. W naszym ruchu ta krzywa hamuje przy prawym polu, a pierwsze klatki łagodzą start, aby wzrok nadążył za całym wyrazem „Odpis”. [Implementacja slide](https://github.com/Tejashmakwana/motionmaxxing/blob/8c8ec0f2a6f6c9a0da15cd24f7b1298ab298368c/runtime/motion.js#L292-L295) · [Krzywa softLand](https://github.com/Tejashmakwana/motionmaxxing/blob/8c8ec0f2a6f6c9a0da15cd24f7b1298ab298368c/runtime/motion.js#L28-L33)

W przykładzie katalogowym Bang Motion ruch kadru kończy się przed wejściem tekstu. U nas odpowiednikiem kolejnego sygnału jest fajka. Zaczyna się klatkę po osadzeniu pliku, kiedy obserwator skończy śledzić ruch. [Przykład katalogu, opis kolejności w wierszu 12](https://github.com/bangtutorial/bang-motion/blob/c1aa65e921c970d858705fcb4a53a8294d1a4131/assets/starter-explainer-katalog.html#L10-L15)

**Dźwięk.** Zachować słowa „dołączyć odpis aktu urodzenia” i krótki, suchy odgłos teczki wyzwalany w 55,400 s. Ruch nad prześwitem biegnie pod głosem. [Punkt synchronizacji i długość efektu](../../../montaz/miks.py#L65)

**Odbiór.** W wyciszonej próbce można wskazać źródło, odczytać pełną nazwę również podczas przejścia i odróżnić pusty cel od potwierdzonego załącznika. Skrajne pozycje wiersza, pojedynczy podpis i kolejność potwierdzenia sprawdza test modułu.

## Załączniki do odbioru

![Klatki 0, 20, 40 i 59 z ukończonego ujęcia](klatki.jpg)

[Ujęcie z głosem lub dźwiękiem sceny](ujecie-720p.mp4) · [Załączony przykład warsztatowy](../../przyklady/budowa-karty.jpg) · [Autorstwo przykładów](../../przyklady/ZRODLA.md)
