# 19 · Specyfikacja obrazu i ruchu

1280 × 720, 30 kl./s, lokalne klatki 0–59. Nieruchomy plan średni szeroki. Biodra Marty w (427, 490), Pawła w (800, 490). Obie sylwetki w skali 1,16. Ciemny tusz, papier w ciepłej bieli, zielone detale wydruków i płócienna teczka.

| Klatki | Działanie | Co musi być widoczne |
| --- | --- | --- |
| 0–7 | Paweł dociska plik prawym ekranowym łokciem. Palce po przeciwnej stronie zaciskają się na brzegu. | Teczka oraz druki spoczywają na udach. Rękaw przykrywa papier w miejscu nacisku. |
| 8–16 | Dłoń ciągnie druk w lewo. Spod rękawa wysuwa się dolna kartka, jej róg odrywa się od pliku. | Papier ma stronę wierzchnią i odwinięty spód. Wygięcie poprzedza poślizg. |
| 17–33 | Paweł łapie powietrze. Marta prowadzi ruch oczami, przechyla głowę, potem otwiera rękę. | Widać prześwit pomiędzy palcami i uciekającym rogiem. Arkusz na chwilę zakrywa dłoń. |
| 34–51 | Fala otwiera się od teczki przez oba kolana ku górze. | Kartki ruszają grupami z różnym opóźnieniem, kątem i skalą. Najbliższy druk prowadzi oko do (640, 325). |
| 52–59 | Klik na 52. Na następnej klatce pojawia się Zusik. | Od 52 rodzina i wszystkie arkusze pozostają w tej samej pozie. Od 53 ostry Zusik ma środek (640, 325), rozmiar 270 i spojrzenie 0. |

Kolejność rysowania obejmuje salon, obie postacie, teczkę i plik druków z wycięciami na przedramiona, arkusze pośrednie, przedni grzbiet fali oraz maskotkę. Dźwięk montażowy wykorzystuje szeroki szelest i suchy klik na **37,733 s**. Ujęcie nie wprowadza kwestii dialogowej.

Eksport `scene(f,k)` zwraca wnętrze SVG. Eksport `frozenRoom(k)` daje scenie 20 gotowe zamrożone i rozmyte tło spod maskotki. Kontrola obejmuje klatki 0, 30, 59, stałą pozę na wyjściu i ciągłość punktu maskotki.
