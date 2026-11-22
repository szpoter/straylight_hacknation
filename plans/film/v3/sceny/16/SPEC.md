# 16 · Specyfikacja ujęcia „Który jest który?”

Autor planu: s16

30–32 s, klatki filmu 900–959, lokalnie 0–59 przy 30 kl./s. Współrzędne podano w pikselach podglądu 1280 × 720, strony dłoni i ud względem ekranu.

**15/59 → 16/0.** Skopiować końcowy rysunek 15. Biodra Marty (427,490), biodra Pawła (800,490). Oboje siedzą w zagłębieniach kanapy, obie podeszwy Pawła spoczywają na podłodze. Zamknięta teczka ma środek (621,526), szerokość 190, obrót −5° i pionowy skrót 0,48. Zdjęcie jest na wierzchu. Prawe ekranowo opuszki Marty kończą około 8 px przed grzbietem. Oba końce osi zawiasu pobrać z lewej długiej krawędzi tego samego rysunku. [Wyjście sceny 15](../15/SPEC.md)

| Klatki | Kontakt, przesłanianie i dźwięk |
| --- | --- |
| 0–9 | W 0 powtórzyć pozę przekazania. W 5 opuszki prawej dłoni dociskają grzbiet. W 9 lewa dłoń obejmuje bliższą krawędź około jednej czwartej jej szerokości od zawiasu. Kciuk widać nad kartonem, krawędź zasłania końce palców wsuniętych pod spód. Zdjęcie jeszcze leży płasko. |
| 10–26 | Przy obu końcach grzbietu postawić znaczniki robocze. Okładka obraca się od 0° przez około 90° w kl. 18 do około 175° w kl. 26. Fotografia, folia i zagięty róg obracają się wspólnie. W kl. 18 widoczny jest przekrój kartonu, potem wewnętrzna powierzchnia. Lewy nadgarstek opisuje łuk wokół osi. Opuszki prawej dłoni pozostają na grzbiecie. |
| 27–43 | Lewa dłoń zwalnia leżącą okładkę w kl. 27. W kl. 30 kciuk przytrzymuje „URLOP”, dwa palce podchodzą pod spodni „ZASIŁEK”. Prawa ręka przechodzi z grzbietu pod przeciwny róg. Oba druki podążają za dłońmi, ich wolne końce lekko się uginają. W 43 dolne brzegi obu arkuszy mają podparcie na spódnicy. |
| 44–59 | Spód „ZASIŁKU” ma kontakt z prawym udem. Prawa dłoń dociska jego dolny prawy róg. Lewa zsuwa „URLOP” na lewe udo i zmniejsza nacisk w 53. Szelest zgrać z tarciem przy rozsuwaniu. Głos Marty prowadzi zdanie. W 53 oczy wędrują na prawy nagłówek, w 55 dołącza głowa. Papier i stopy pozostają nieruchome w 56–59. |

**16/59 → 17/0.** Marta i Paweł zachowują podane pozycje bioder. „URLOP” leży na lewym ekranowo udzie Marty pod jej lewym palcem, „ZASIŁEK” na prawym udzie przy jej prawej dłoni. Między nagłówkami widać pasek tkaniny, a poniżej nadgarstków oba dolne brzegi. Otwarta teczka leży między rodzicami, grzbiet nadal w punktach z kl. 0. Paweł patrzy na prawy druk. Obie jego dłonie odpoczywają i oba buty są jeszcze na stopach. W 17 ruszy najpierw pięta bliższa Marcie. [Wejście sceny 17](../17/SPEC.md)

**Test do wykonania na animatiku.** Nałożyć 15/59 na 16/0, a następnie 16/59 na 17/0. Sprawdzić zgodność sylwetek, teczki, dłoni i obu butów. Przewinąć bez dźwięku 0/9/18/26/30/43/53/59. Znaczniki obu końców zawiasu powinny pozostać w miejscu w granicy jednego piksela. Przed ruchem każdego rekwizytu musi być widoczna klatka kontaktu palców. Zatrzymać fazę rozsuwania i wskazać, który arkusz Marta trzyma, a który przesuwa. Po puszczeniu arkusza jego brzeg ma nadal leżeć na udzie. W pełnym planie można prześledzić obie linie od barków do paznokci i odczytać oba nagłówki. Na koniec odsłuchać kwestię z szelestem pod słowami Marty. [Plan i przykłady](PLAN.md)

## Realizacja v3 (autor b13)

Rewizja modeli r1, skala 1,28. Prawa (bliższa teczce) dłoń Marty prowadzi okładkę po łuku 0°→180° (kl. 9–26), lewa dociska grzbiet (zasięg modelu r1 nie pozwala lewej dłoni sięgnąć do okładki — zamiana rąk względem briefu). 27–43 prawa przenosi parę druków z tylnego panelu na kolana, lewa przejmuje „URLOP”. 44–59 rozsunięcie: „URLOP” (388,478,−8°), „ZASIŁEK” (468,482,6°) — pozycje z `sofaPose(…,"przekazanie")`. Głowa przechodzi na prawy nagłówek 53–55.

Źródła: plansze [kolejka](../../../referencje/kolejka-zus-v1.png) i [kanapa](../../../referencje/kanapa-przed-fala-v1.png), modele r1 (`k.rewizja === "r1"`, [POSTACIE.md](../../POSTACIE.md)), daty z `app/src/features/chat/case-data.ts` („11 stycznia – 7 lutego 2027” → odręcznie 11.01.2027). Usta z obwiedni `media/dialog.flac`, stuki z `media/efekty.flac`. Render: `build.mjs --only 13..18 --out robocze/b13`, `klatki.mjs`, `render.mjs`. Przykład animatora: [ZRODLA.md](../../../v2/przyklady/ZRODLA.md) — Stickman `approved-2026-10-23-motion-sheet.png` (kolejność: podparcie → żebra → głowa → dłoń), Bang Motion `05-continuous-action.jpg` (ruch przez cięcie), Video Shotcraft `card-stack.jpg` (przesunięte krawędzie kart).

## Odbiór

Sprawdzone klatki: 0, 5, 9, 12, 18, 26, 30, 34, 40, 46, 53, 59. Kontakt dłoni z okładką w 5, obrót 9–26 (0° → 92° w 18 → 180° w 26; pod 90° okładka jest ściśniętym rysunkiem modelu z fotografią, powyżej — otwartym rysunkiem modelu). Druki z tylnego panelu: chwyt 31, przeniesienie 34–44, lewa dłoń przejmuje „URLOP” 41, rozsunięcie 44–53 do pozycji modelu. Oczy na prawy nagłówek 52, głowa 53–56. Papier nie odrywa się od dłoni (punkt chwytu liczony z tego samego przesunięcia co w modelu).

**Odstępstwo od briefu:** okładkę prowadzi prawa (bliższa) dłoń, lewa nie dociska grzbietu — w r1 lewa ręka Marty nie sięga do teczki (zasięg 70+64 j.). Otwarta okładka kładzie się na prawe kolano Marty, druki leżą na niej (jak na planszy kanapy).

**16/59 → 17/0:** ciągłe.

Render: `ujecie-720p.mp4`, `klatki.jpg` (kl. 0/20/40/59), `pozy.jpg` (v2 u góry, v3 u dołu). Czytelność 360 px: `../../robocze/b13/w360.png`.
