# 02 · Specyfikacja ujęcia „Patrz, jak cię trzyma”

Autor planu: s02

Klatki filmu 60–119, lokalnie 0–59 przy 30 kl./s. Wszystkie pomiary ekranowe dotyczą podglądu 1280 × 720. Oś spojrzenia Marty i pierwszego dotyku przechodzi w pobliżu (578, 401). Duża dłoń wchodzi z prawej, mała z lewego dołu.

| Klatki lokalne | Dłonie i kontakt | Drugi plan i dźwięk |
| --- | --- | --- |
| 0–4 | Zacznij od ostatniej pozy 01. Szczelina o szerokości 3 px w planie rodzinnym powiększa się proporcjonalnie przy cięciu do makra. Utrzymaj otwarte palce Oli, gdy opuszek Pawła pokonuje ten ostatni odstęp. | Wzrok Marty spoczywa przy dłoniach. Jej „Patrz” wchodzi ze ścieżki dialogowej od 2,00 s. |
| 5–12 | W kl. 5 opuszka ojca dotyka wnętrza dłoni Oli od strony kciuka. Poduszeczka miękko się spłaszcza. W kl. 9 zaczyna zginać się środkowy palec dziecka. Pozostałe zachowują jeszcze szczeliny. | Górny brzeg koca zaczyna się unosić wraz z podpartym barkiem. |
| 13–24 | Środkowy palec zawija się przed palcem ojca. Serdeczny rusza w kl. 14, wskazujący w 20. W pierwszym odruchu Paweł cofa nadgarstek o około 4 px przy zachowanym kontakcie. Od kl. 20 trzyma go spokojnie. | Szałwiowy pas osiąga górne położenie, około 6 px nad pozycją wyjściową. Marta śledzi palce wzrokiem. |
| 25–38 | Mały palec dołącza w kl. 27. W kl. 34 cztery palce obejmują palec ojca, a kciuk opiera się o jego bok. Rozluźnienie barku Oli przenosi się na mankiet i fałdę koca przy lewym brzegu. | Marta kończy „trzyma” zgodnie z nagraniem i zamyka usta. |
| 39–53 | Zatrzymaj pełny chwyt. Klatka 53 to wzorzec odbitki, obejmujący cały obraz oraz czysty kontur styku. | Koc osiadł. Przez pół sekundy widać nieruchomą pozę. |
| 54–59 | Pojedynczy błysk zaczyna się w kl. 54, wygasa do końca 57. W kl. 58–59 widzimy ponownie obraz 53. | Kl. 54 wypada w 3,800 s, czyli 5 ms przed istniejącym klikiem 3,805 s. [Miks](../../../montaz/miks.py) |

## Styki montażowe

Weź układ kości i orientację dłoni z 01/59. Na 02/0 powiększ rysunek wokół miejsca przyszłego kontaktu. Na klatkę 03/0 przekaż czystą klatkę 02/53 w pełnej rozdzielczości. Ten sam obraz zostanie powierzchnią zdjęcia w teczce oraz miniaturą w późniejszych ujęciach. Przechylenie okładki poruszy całą odbitką. Dopiero folia wniesie ruch nad fotografią. [Wejście 01](../01/SPEC.md) · [Wyjście 03](../03/SPEC.md)

## Odbiór animacji po wykonaniu

1. Nałóż 01/59 i 02/0 po wyrównaniu skali. Opuszka Pawła, nasada kciuka Oli i mankiet powinny pokryć się z dokładnością 2 px w skali ujęcia 01. Na 02/4 widać jeszcze prześwit, na 02/5 po raz pierwszy znika w punkcie styku.
2. Porównaj klatki 8, 13, 19, 26 i 34 w szerokości 360 px. Kolejno powinno być widać zero, jeden, dwa, trzy i cztery rozpoczęte zgięcia. Na przybliżeniu od 20 do 53 śledź nasadę palca Pawła względem kadru. Dopuszczalne przesunięcie wynosi 2 px w 720p. Opuszka pozostaje w kontakcie przy osiadaniu barku Oli.
3. Obejrzyj bez dźwięku i wskaż, kto zaciska dłoń. Przy odsłuchu migawka ma wypaść po końcowej sylabie Marty, z różnicą do jednej klatki względem błysku.
4. Porównaj źródłowe klatki 02/53, 02/59 i 03/0 przed kodowaniem MP4. Obraz różnicowy powinien być czarny na całej powierzchni 1280 × 720. W 03/20 po wyrównaniu czterech narożników odbitki sprawdź położenie małego palca, krawędzi mankietu i szałwiowego pasa. Tolerancja wynosi 1 px w skali odbitki poza refleksem folii.

## Realizacja v3 (autor b01)

Z = 7 wokół (578,401); tło makro osobne (twarz Marty, koszula, kocyk z pasem −10°, prześcieradło). Kontakt w kl. 5 (film 65), poduszeczka 5–12, palce kolejno: środkowy 9, serdeczny 14, wskazujący 20, mały 27, pełny chwyt 34. Odruch cofnięcia 13–20 o ≈4 px w makro przy stałym kontakcie. Kl. 53 = wzorzec; błysk 54–57; 58–59 = 53. `photo02(k)` (kl. 53 z tłem przedłużonym o 114 px w górę i w dół) jest zdjęciem w teczce w 03–06.

## Odbiór

- Klatki 0, 4, 5, 13, 26, 34, 53, 54, 59 obejrzane. Na 02/4 jeszcze prześwit, na 02/5 obrysy się stykają. W 360 px po kolei widać 0/1/2/3/4 zgięte palce (kl. 8/13/19/26/34).
- Bez dźwięku czytelne, że zaciska Ola; Paweł nie cofa ręki.
- Klik 3,805 s = film 114,15 → błysk startuje w lokalnej 54 (film 114). Ostatnia sylaba Marty kończy się w filmie 94.
- **02/53, 02/59 i 03/0: obraz różnicowy czarny (YMAX 0)** na PNG przed kodowaniem.
- Kąt pasa kocyka w makro = kąt w 01 (−10°); położenie pasa w makro jest kompozycyjne (pas z 01 leży poza oknem ×7).
