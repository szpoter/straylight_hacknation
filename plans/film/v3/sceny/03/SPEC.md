# 03 · Specyfikacja ujęcia „Zdjęcie pod folią”

Autor planu: s03

04–06 s, klatki filmu 120–179, lokalnie 0–59 przy 30 kl./s. Podgląd 1280 × 720. Odbitką jest cały ostatni czysty obraz z ujęcia 02. Zachowujemy palec, chwyt Oli, ukośny pas koca i fragment twarzy Marty w głębi. [Wejście z ujęcia 02](../02/SPEC.md)

| Klatki | Kamera, dłoń i rekwizyt | Punkt kontroli |
| --- | --- | --- |
| 0–5 | Stała kamera i ekspozycja po migawce. Kadr 03/0 przyjmuje wprost obraz 02/59. | Nałóż obie klatki w 50% przy jednakowym rozmiarze. Kontur opuszki, fałda rękawa Oli i krawędź zielonego pasa mają pojedyncze obrysy. |
| 6–21 | Na skrzyp w 4,20 s zaczyna się zmiana przestrzeni. Prawy nadgarstek Pawła obraca lekko okładkę, lewa dłoń stanowi oparcie pod spodem. W ślad za przechyłem jedna smuga światła przechodzi po folii. Kamera cofa się wzdłuż osi odbitki. | W kl. 20 jasna kreska dochodzi do brzegu kieszonki. Szew, ramka zdjęcia i zagięty narożnik zachowują wzajemne położenie przy zmianie skali. |
| 22–40 | Przy dalszym odjeździe widać kciuk prawej dłoni na przodzie, jej pozostałe palce za okładką i podparcie u dołu. Rozchylenie prawego łokcia wyhamowuje przechył, po czym teczka osiada przy piersi. | Zatrzymaj w kl. 32. Wskaż połączenie mankietu z nadgarstkiem, styk kciuka z brzegiem oraz fotografię widoczną ponad palcami. |
| 41–59 | Paweł patrzy na zdjęcie. Marta stoi z lewej i ma dłoń na rączce. Wózek między nimi ma składaną budkę, skrzyżowany stelaż i dwa szprychowane koła. Koła i chwyt pozostają w spoczynku przed ruchem 04. | W kl. 59 porównaj ucho i niski kok Marty z jej portretem, grzywkę i żuchwę Pawła z widokiem ¾. Sprawdź jeden pas koca w gondoli i na odbitce. |

**Styk 03/04.** Zachowaj na 04/0 układ z 03/59, łącznie z miejscem styku dłoni Marty z rączką, ustawieniem szprych, kątem teczki i dwiema podporami Pawła. Przekaż tę pozę autorowi 04 jako początek kołysania i późniejszego uniesienia teczki. [Wyjście do ujęcia 04](../04/SPEC.md) · [Plansza kolejki](../../../referencje/kolejka-zus-v1.png)

**Odbiór.** Obejrzyj w tempie 1× bez dźwięku końcówkę 02, całe 03 i początek 04. Widz ma móc wskazać, czyje palce widać na zdjęciu, kto trzyma odbitkę i gdzie jest Ola. W podglądzie szerokości 360 px sprawdź, czy można rozróżnić twarze rodziców oraz kciuk na teczce. Przy drugim odtworzeniu włącz miks i sprawdź, czy skrzyp słychać, zanim wózek wejdzie w kadr. [Miks](../../../v2/media/miks.flac) · [Plan i przykłady](PLAN.md)

## Realizacja v3 (autor b01)

Kamera: `translate(640 360) rotate(r) scale(S) translate(−Q)`; S₀ = 1/(skala zdjęcia) ≈ 23, ln S maleje smoothstepem 6→56, Q wędruje od środka zdjęcia do (640,360), r od +5° do 0. Kl. 6 = obraz 02/53 co do piksela (różnica średnia 0,10 poziomu jasności, subpikselowe krawędzie). Folia tonuje zdjęcie dopiero od 6 do 16 (bez skoku jasności).

**03/59 = 04/0 (kadr kolejki):** Marta biodra (232,456), dłoń na rączce (273,415), patrzy na Olę (`head .5, gaze .15, gazeDown .9`). Wózek oś (470,657.5), s 1,25, koła na podłodze y 700, `roll 0`. Paweł biodra (880,424), bark (802,228), łokieć (740,305), nadgarstek (803,370), kciuk na grzbiecie (840,356), lewa dłoń pod dołem teczki (932,408). Teczka (896,342), w 114, −5°, zamknięta, zdjęcie = 02/53; nad okładką URLOP (z przodu) i ZASIŁEK.

## Odbiór

- Klatki 0, 5, 6, 12, 20, 25, 32, 45, 59 obejrzane. W 20 refleks dochodzi do szwu kieszonki i znika; od 21 widać białą ramkę odbitki. W 32 widać mankiet, nadgarstek, kciuk na przedniej krawędzi i zdjęcie ponad palcami.
- 02/59 → 03/0 identyczne; 03/5 → 03/6 bez skoku. Zdjęcie przyklejone do okładki przez cały odjazd (jedna transformacja).
- 59: ucho i niski kok Marty, grzywka Pawła, jeden pas kocyka w gondoli i na odbitce.
- Problem modelu: w r1 `folder()` przedramię dziecka z `grasp(1)` wystaje poza odbitkę (brak przycięcia). W 03–06 przykrywam pole zdjęcia kolorem okładki i rysuję własną ramkę. Prośba do autora modeli: przycięcie oraz `photo02` jako zdjęcie w `rekwizyty.folder` (dla spójności 07–18).
- Statyści to płaskie sylwetki bez twarzy (r1 ich nie ma) — prośba o modele statystów.
