# 13 · Specyfikacja ujęcia „Palcem do daty”

Autor planu: s13

24–26 s, klatki filmu 720–779, lokalnie 0–59 przy 30 kl./s. Podgląd 1280 × 720. Strony ciała oznaczają anatomiczne dłonie pracownicy. Krawędzie odnoszą się do zadrukowanej strony arkusza.

**Wejście z 12.** Bliższa kamera przejmuje kartkę o środku (816,463) i obrocie −10° w układzie poprzedniego planu. Dolna krawędź opiera się o blat. Lewy kciuk spoczywa z przodu przy prawej krawędzi na 45% wysokości liczonej od góry. Dwa palce podpierają ją z tyłu. Na 13/0 Marta patrzy na nagłówek, pracownica na Martę. Prawa dłoń pracownicy jest wolna, długopis leży na blacie w jej zasięgu obok dolnego brzegu kartki. [Wyjście z 12](../12/SPEC.md)

| Klatki | Papier, dłonie i wzrok |
| --- | --- |
| 0–11 | Pracownica przenosi wzrok z Marty na nagłówek i prostuje prawy palec przy „ZASIŁEK”. W klatkach 7–11 opuszka zatrzymuje się około jednej szerokości cyfry za ostatnią literą. Lewy nadgarstek i arkusz zachowują punkt kontaktu z 12/59. |
| 12–31 | Prawy łokieć prowadzi przedramię, nadgarstek podąża za nim. Opuszka schodzi po skosie ku prawemu końcowi odręcznej daty w dolnej połowie arkusza. Źrenice Marty zaczynają ruch w 15, podbródek w 20. Lewy kciuk pracownicy pozostaje na brzegu. |
| 32–47 | Ruch obu kobiet wygasa. Opuszka zatrzymuje się o szerokość cyfry za siódemką. Cały zapis „11.01.2027” i oczy Marty pozostają razem w kadrze przez 16 klatek. |
| 48–59 | Prawy palec unosi się nad datę. Kciuk i palec wskazujący ujmują trzon leżącego obok długopisu, a środkowy go podpiera. W 59 stalówka jest około 3 mm nad początkiem pustego wiersza pod datą. Lewa dłoń stabilizuje arkusz, Paweł ma otwartą teczkę, Marta patrzy na datę. |

**Dźwięk i styk z 14.** Usta pracownicy prowadzi nagranie „A o urlop składacie w pracy”. Rodzice słuchają. Klatka 14/0 przejmuje położenie stalówki, trzy palce obejmujące długopis, stały punkt pod lewym kciukiem i wzrok Marty. Pierwsza kreska „do jutra” pojawia się po dotknięciu papieru w 14. [Polski dialog](../../../v2/media/dialog.flac) · [Następne ujęcie](../14/SPEC.md) · [Okres urlopu w danych rodziny](../../../../../app/src/features/chat/case-data.ts)

**Test do wykonania na renderze.** Odtworzyć z wyciszeniem od 12/56 do 14/4. Po wyrównaniu skali kartki porównać lewy kciuk na 12/59, 13/0, 13/31 i 13/59. Powinien zakrywać ten sam punkt prawego brzegu. Przeklikać klatki 12, 15 i 20, śledząc kolejno opuszkę, oczy i podbródek. W 40 odczytać pełną datę z podglądu o szerokości 360 px oraz prześledzić obie dłonie do ich własnych mankietów. Na styku 13/59 i 14/0 sprawdzić kierunek stalówki oraz pusty wiersz przed kontaktem. Przy powtórce z głosem wskazać mówiącą osobę i miejsce, do którego rodzice mają skierować wniosek o urlop. [Plan i przykłady](PLAN.md)

## Realizacja v3 (autor b13)

Rewizja modeli r1, skala 1,28. Kamera bliska na świat okienka b13 (zoom 1,4 wokół (830,330) świata; świat = kadr 14/48–59). Marta (430,475) s 1,28 u góry po lewej w ¾, Paweł (790,455) z otwartą teczką (grzbiet (640,320), okładka 120°), pracownica siedzi za ladą (1150,545). Druk „ZASIŁEK” stoi na blacie: środek (1005,388), 120×150, −10°. 0–11 palec przy nagłówku, 12–31 zjazd do daty, 32–47 postój przy „11.01.2027”, 48–59 długopis, stalówka 5 px nad pustym wierszem.

Źródła: plansze [kolejka](../../../referencje/kolejka-zus-v1.png) i [kanapa](../../../referencje/kanapa-przed-fala-v1.png), modele r1 (`k.rewizja === "r1"`, [POSTACIE.md](../../POSTACIE.md)), daty z `app/src/features/chat/case-data.ts` („11 stycznia – 7 lutego 2027” → odręcznie 11.01.2027). Usta z obwiedni `media/dialog.flac`, stuki z `media/efekty.flac`. Render: `build.mjs --only 13..18 --out robocze/b13`, `klatki.mjs`, `render.mjs`. Przykład animatora: [ZRODLA.md](../../../v2/przyklady/ZRODLA.md) — Stickman `approved-2026-10-23-motion-sheet.png` (kolejność: podparcie → żebra → głowa → dłoń), Bang Motion `05-continuous-action.jpg` (ruch przez cięcie), Video Shotcraft `card-stack.jpg` (przesunięte krawędzie kart).

## Odbiór

Sprawdzone klatki (podgląd `robocze/b13/podglad.mjs` i `ujecie-720p.mp4`): 0, 7, 15, 25, 32, 40, 50, 59. Palec przy końcu nagłówka w 7–11 (opuszka ok. 9 px za „K”), zjazd 12–31 po wolnym pasie, postój 32–47 ok. 9 px za „7” — cała data „11.01.2027” odsłonięta (wcześniejsza próba zasłaniała ją dłonią; poprawione analitycznym chwytem i przesunięciem pracownicy do x 1178). Długopis: chwyt 54–58, w 59 stalówka 5 px nad początkiem pustego wiersza. Ręka trzymająca prawy brzeg jest za kartką (palce z tyłu), wskazująca przed nią — rękawy się nie krzyżują.

**Styk 12/13.** Ujęcie 12 nie ma jeszcze `scene.mjs`. Poza wejściowa 13/0 w kadrze 13: druk (1005,388) w świecie b13, −10°, kamera 1,4 wokół (805,338) → na ekranie środek kartki ≈ (920,431); kciuk pracownicy na 45 % prawego brzegu, Marta patrzy w prawo (head .45), pracownica na Martę (gaze −.9). Autor 12 powinien zakończyć na tym kadrze albo zgłosić zmianę.

**Uwagi.** Pismo odręczne złożone krojem Domine italic (jedyny szeryfowy krój w media/) — do weryfikacji, czy nie wolimy pisma ręcznego. Kolor atramentu = granat tokenu, oznaczony „do weryfikacji”.

Render: `ujecie-720p.mp4`, `klatki.jpg` (kl. 0/20/40/59), `pozy.jpg` (v2 u góry, v3 u dołu). Czytelność 360 px: `../../robocze/b13/w360.png`.

**Poprawka po animatiku (styk 12/13).** 13/0 przejmuje 12/59 z `sceny/12` (b07): kamera świata b13 zaczyna od z 1,28 wokół (839,325), czyli druk na ekranie w (816,463), −10°, wysokość ≈151 px. Kciuk ekranowo lewej ręki pracownicy jest na prawej krawędzi w 45 %. Paweł trzyma zamkniętą teczkę (ekran ≈ (603,480)), Marta stoi po lewej, nad ladą wisi tablica A17 (zastępuje numer „2”, więc zmienia się też tło 14). Potem:
- 0–22: dojazd kamery do z 1,4;
- 1–16: pracownica obraca druk ku Marcie i podsuwa go na stałe miejsce (1005,388);
- 0–6: prawa ręka przejmuje brzeg, lewa przechodzi do nagłówka (13) i daty (32–47, bez zmian);
- 10–26: Paweł otwiera teczkę (okładka 0°→108°), od 32 jest jak dawniej.

Od 13/40 i w całym 14 akcja się nie zmienia, styk 13/59 → 14/0 bez skoku. Sprawdzone 719/720 (`robocze/b13/styk-719-720.png`), 724–752, 779/780.

Różnica do decyzji koordynatora: na druku z 12 nie ma daty, tylko linia „Podstawa”. W 13 od kl. 0 widać odręczne „11.01.2027”. Stary podgląd leży w `robocze/b13/stare/`.
