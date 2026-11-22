# 10 · Trzy podkreślenia w teczce

Autor planu: s10

18–20 s, klatki filmu 540–599, lokalnie 0–59 przy 30 kl./s, podgląd 1280 × 720. Pozycje rekwizytów podano w pikselach planu ogólnego przed powiększeniem. Punkty dotyku liczymy od środka danego arkusza przed obrotem. Ognisko uwagi przechodzi z prawej strony na lewą, potem na środek.

**Styk 09/59 → 10/0.** Teczka ma środek (646,392), szerokość 128 i obrót −6°. Lewy ekranowy kciuk Pawła leży z przodu na dolnym lewym rogu, reszta palców podpiera okładkę od tyłu. Od spodu układają się potwierdzenie (694,376), −5°, „ZASIŁEK” (639,374), −6°, oraz odwrotka „URLOP” (726,362), −4°. Prawa opuszka spoczywa w punkcie (−28,−24) odwrotki. Zachować stronę nadruku, zdjęcie chwytu Oli z 02 i ułożenie mankietu przy zmianie skali. [Poza wyjściowa 09](../09/SPEC.md) · [Wzór kadru](../../../referencje/kolejka-zus-v1.png)

| Klatki | Dłoń, druk i efekt na ekranie |
| --- | --- |
| 0–16 | Do 3 palec zwiększa nacisk, skóra opuszki lekko się spłaszcza. Na 4 rusza „URLOP”, nadal pod tym samym punktem palca. Na 16 osiąga (746,349), −4°. Widz odczytuje „Okres” w całości po prawej. Pierwszy szelest na 18,35 s przypada na ruch papieru. |
| 17–37 | Do 25 palec wraca łukiem nad luźnymi krawędziami. Cień oddziela się od opuszki. Na 26 ponowny styk w punkcie (+8,−28) druku „ZASIŁEK”. Na 37 jego środek jest w (623,345), obrót −10°. Po lewej odsłania się „Podstawa”. Lewy kciuk pozostaje na okładce. |
| 38–53 | Na 44 opuszka opiera się w punkcie (−4,−34) wystającego środkowego potwierdzenia. Brzeg lekko się wygina, a następnie przesuwa razem z palcem. Na 53 arkusz osiąga (694,338), −5°. Nad kieszenią widać „Data wpływu”. Unieść łokieć na tyle, by rękaw odsłonił także „Okres”. |
| 54–59 | Środkowy arkusz zostaje pod palcem. Lewy druk traci oparcie dolnego rogu i zaczyna opadać ku Marcie. W klatce 58 środek „ZASIŁKU” wynosi (620,353), a w 59 (619,355), w obu −10°. Dolny lewy narożnik prowadzi ruch. Trzy ślady są wciąż czytelne. |

**Styk 10/59 → 11/0.** Szerszy plan przejmuje te trzy pozycje, ciągłość głosu Pawła oraz ruch „ZASIŁKU” o 1 px w lewo i 2 px w dół na klatkę. Prawa opuszka pozostaje na górze potwierdzenia, lewa ręka na teczce. Papier jest jeszcze poza zasięgiem Marty. Sygnał numerka przypada już na 11. [Wejście do 11](../11/SPEC.md) · [Dialog](../../../v2/media/dialog.flac) · [Miks kolejki](../../../montaz/miks.py)

**Próba odbiorowa po animacji**

1. Pokazać wyciszony render 720p raz w tempie 1× osobie, która nie zna scenariusza. Poprosić o wskazanie trzech podkreślonych określeń w kolejności odsłaniania oraz kartki uciekającej ku Marcie. Oczekiwana odpowiedź brzmi „Okres, Podstawa, Data wpływu” oraz „ZASIŁEK”.
2. Porównać klatki 0, 16, 37 i 53. Na 0 brzeg okładki zasłania kompletne ślady, następnie można przeczytać kolejno jeden, dwa i trzy. Każda kreska ma stałe położenie pod tym samym wyrazem od pierwszej klatki. Podczas nacisku sprawdzić odstęp między opuszką a tym samym szczegółem nadruku. Dopuszczalny dryf punktu kontaktu wynosi 1 px planu ogólnego.
3. Wyrównać 09/59 z 10/0 oraz 10/59 z 11/0 według grzbietu teczki i rogu zdjęcia. Po wyrównaniu skali kontury narożników, kciuk oraz opuszka powinny pokrywać się z dokładnością do 1 px planu ogólnego. Odtworzyć jeszcze 10/58–11/2 i prześledzić opadający lewy narożnik przez cięcie. [Referencje gestu i układu papieru](PLAN.md)


## Realizacja v3 (autor b07)

Modele r1 (`k.rewizja === "r1"`), wspólny świat bloku w [`../07/kolejka.mjs`](../07/kolejka.mjs): plan ogólny 1280×720, postaci s = 1, podłoga y 590, lada od x 960 (blat y 352), pracownica siedzi (1131,420) s 0,9, wózek s 0,95 (oś y 558). Każde ujęcie patrzy na ten świat kamerą `cam(z,cx,cy)`; kreski cienione z^−0,6. Teczka i druki jak w 03–06 (b01): teczka zamknięta, pionowo przy piersi, w ekranowo prawej dłoni Pawła; ekranowo lewa dłoń pracuje. Zdjęcie na okładce = `photo02(k)` (decyzja koordynatora). Render: `node build.mjs --only 06,…,13 --out robocze/b07`, `klatki.mjs`, `render.mjs 720 NN NN`. Przykład animatora ([ZRODLA.md](../../../v2/przyklady/ZRODLA.md)): Video Shotcraft `card-stack.jpg` (każdy druk z własnym brzegiem) i Stickman motion sheet (podpora vs ręka pracująca).

Kamera z 4 wokół (704,262). Pozycje druków w układzie teczki (od środka, góra okładki −52,8; kolejność Z, U, P):

| Klatki | Realizacja |
| --- | --- |
| 0–16 | Opuszka na URLOP (−20,−34), 0–3 nacisk; URLOP (18,−46)→(34,−80): „Okres” nad okładką. |
| 17–25 | Palec łukiem do ZASIŁKU. |
| 26–37 | Dotyk ZASIŁKU w (−24,−34); ZASIŁEK (−18,−50,−6°)→(−50,−72,−12°): „Podstawa”. |
| 38–44 | POTWIERDZENIE, dotąd schowane (−8, poniżej góry okładki), palec wysuwa za górny brzeg do −22. |
| 44–53 | Dotyk (16,−36), POTWIERDZENIE do (−2,−66): „Data wpływu”. |
| 54–59 | ZASIŁEK traci podparcie: −1 px x, +2 px y na klatkę (+przyspieszenie), kąt −0,5°/kl. 10/59: róg dolny lewy (611,8; 316,4), −15°. |

## Odbiór

Klatki kontrolne: 0 — żaden ślad nieczytelny; 16 — „Okres”; 40 — „Podstawa”; 53 — „Data wpływu”. W 53 ramię zasłania „Podstawę” (r1 nie ma łokcia w głąb; zgłoszone). Dryf opuszki względem punktu druku 0 px (punkt liczony z arkusza). 54–59 ZASIŁEK zsuwa się dolnym lewym rogiem. Styk 539/540 i 599/600 obejrzany.
