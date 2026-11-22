# 16 · Otwarcie i porównanie

SVG 1280 × 720. Lokalnie 0–59 przy 30 kl./s, w filmie 900–959. Salon z wózkiem po lewej i oboje rodzice nadal w kurtkach. [Parametry produkcji](../../PRODUKCJA.md) · [Końcowe pozycje sceny 15](../15/SPEC.md) · [Wzór salonu](../../../referencje/kanapa-przed-fala-v1.png)

| Klatki | Punkty kontaktu i kadrowanie |
| --- | --- |
| 0–12 | Teczka początkowo zamknięta w (621,526), szerokość 190, obrót −5°, rzut wysokości 0,48. Marta na (427,490), Paweł na (800,490), s=1,16. Jedno przedramię Marty dociska grzbiet po lewej, drugie sięga do brzegu. |
| 13–32 | Widzimy zwarcie palców i dopiero potem obrót okładki. Zdjęcie obraca się wraz z nią, grzbiet pozostaje przy kanapie. Przy obrocie na sztorc zewnętrzna powierzchnia staje się cienką linią. |
| 33–49 | „URLOP” wychodzi spod palców w lewo. Odsłania „ZASIŁEK”. Przód dłoni zasłania fragment papieru przy chwycie. |
| 50–59 | Teczka otwarta w (608,516), w=290, obrót −3°. Środki arkuszy (547,514) i (670,503). Lewa dłoń ekranowa Marty zwalnia grzbiet. Prawa zostaje przy lewym druku. Oczy przechodzą na drugi nagłówek przed ruchem głowy. |

Usta Marty korzystają z istniejącego przebiegu nagrania w klatkach 900–959 filmu. Kwestia brzmi „Już mi się myli, który jest który”. Szelest towarzyszy rozsuwaniu przy cichszym końcu ruchu. Paweł słucha. [Nagranie i dialog](../../../../../PLAN-FILMU-DEMO.md)

Do sceny 17 przechodzą otwarta teczka, oba odczytywalne nagłówki i ten sam kadr dwojga siedzących rodziców. Odbiór na wyciszeniu wymaga czytelnego chwytu przed ruchem papieru, pełnego odsłonięcia obu druków i rozpoznawalnej zmiany kierunku spojrzenia. Sprawdzamy klatki przed otwarciem, w pionie okładki i po rozsunięciu. [Stickman · fazy ruchu](../../przyklady/fazy-ruchu.png) · [Video Shotcraft · warstwy papieru](../../przyklady/stos-kart.jpg)

**Przekazanie do 17.** Pozycje końcowe zawierają eksporty `martaAtRest` i `pawelAtRest`. Nadgarstki Marty są w (463,500) i (538,526), łokcie w (372,471) i (531,485). Lewa dłoń jest otwarta, prawa przytrzymuje druk. Na tle `restingRoom(k)` rysujemy obie postaci, potem `documentsAtRest(k)` i `martaHands(k,martaAtRest)`, żeby nadgarstki i mankiety leżały nad drukami. Druki to te same rysunki nagłówków „URLOP” i „ZASIŁEK”, które przeglądali wcześniej w kolejce. [Rysunki wniosków](../10/scene.mjs)
