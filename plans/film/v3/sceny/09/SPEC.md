# 09 · Specyfikacja ujęcia „Paweł przytrzymuje wózek”

Autor planu: s09

16–18 s, klatki filmu 480–539, lokalne 0–59. Plan ogólny 1280 × 720, 30 kl./s. Strony postaci opisano względem ekranu. Poniższe współrzędne to pozycje w planie ogólnym przed powiększeniem kamery w 10.

| Klatki | Poza, podparcie i kontakt |
| --- | --- |
| 0–7 | Na 0 odtworzyć pozę 08/59. Marta po lewej trzyma rączkę, Paweł patrzy na nią ponad teczką. Zachować układ jej palców, stronę wydruków i otwarcie okładki. Pierwsze kroki należą do osób z drugiego planu. Przed ruszeniem środek między osiami kół jest w (474,612). |
| 8–23 | Wózek jedzie w prawo. Marta, z palcami wokół uchwytu, przestawia kolejno stopy. Prawy but Pawła pozostaje na tym samym miejscu posadzki. Lewa pięta unosi się, kolano się zgina i but odchodzi w bok ku wózkowi. Na 23 czubek lewego buta wraca na ziemię, biodro i gondolę nadal rozdziela prześwit. |
| 24–34 | Po oparciu lewej podeszwy Paweł ugina kolano i przenosi miednicę w lewo. Pierwszy styk na 28 następuje na sztywnej krawędzi gondoli pod zawiasem budki. Po kontakcie maleje droga pokonywana przez koła w każdej klatce. Na 34 środek między osiami zatrzymuje się w (535,612), biodra Pawła w (686,438). Dolny brzeg koszuli lekko się spłaszcza w punkcie nacisku. Teczka trzymana wyżej odsłania ten punkt. |
| 35–59 | Koła i podeszwy Pawła stoją. Starsza klientka przechodzi za nim w prawo, torba opóźnia się przy zmianie podpory i opuszcza obrys jego barku. Gdy droga jest wolna, oczy Pawła opadają na papier, potem broda. Lewa dłoń nadal podtrzymuje okładkę. Na 59 prawa opuszka dotyka druku „URLOP”, od którego zacznie się rozsuwanie arkuszy. |

**Przekazanie do 10.** Na 09/59 oraz 10/0 teczka ma środek (646,392), szerokość 128 px i obrót −6°. Lewa dłoń trzyma dolną lewą stronę okładki. Od spodu leżą „POTWIERDZENIE” z akapitem „Data wpływu” (środek 694,376, obrót −5°), „ZASIŁEK” z „Podstawą” (środek 639,374, obrót −6°) i odwrotka „URLOP” z „Okresem” (środek 726,362, obrót −4°). Prawa opuszka opiera się na „URLOP” w punkcie (−28,−24) względem środka arkusza przed obrotem. Podkreślenia są narysowane na arkuszach. Teczka, fotografia, narożniki trzech kartek, mankiet i opuszka przechodzą do wspólnej pozy 10/0. Zmienia się skala kamery. [Wejście z 08](../08/SPEC.md) · [Początek 10](../10/SPEC.md)

**Dźwięk.** Synchronizować usta z głosem Pawła na globalnych klatkach 480–539. Między „Nie wiem” i „Czytałem…” domknąć usta zgodnie z nagraniem. Punkt ciężkości i kroki są czytelne także po wyciszeniu. [Dialog](../../../v2/media/dialog.flac)

**Próba odbiorowa do wykonania na nowym renderze**

1. Obejrzeć bez głosu w tempie 1×, następnie zatrzymać klatki 23, 28, 34 i 59. Wskazać kolejno prześwit, pierwszy dotyk, obciążenie gondoli oraz klientkę po drugiej stronie Pawła. Na każdej próbce widać śpiącą Olę, osadzoną budkę, obie opony i pełne podeszwy.
2. Na kopii kontrolnej zaznaczyć położenie prawej pięty na podłodze i po jednej szprysze obu kół. Odchylenie pięty najwyżej 1 px. Przy promieniu 29 px oraz przesunięciu 61 px koła obracają się w prawo o około 120,5°. Na klatkach 34–59 kierunek zaznaczonych szprych i położenie osi pozostają stałe.
3. Wyrównać 09/59 i 10/0 według górnej krawędzi oraz grzbietu teczki. Po nałożeniu klatek opuszka trafia na ten sam punkt „URLOP”, a narożniki, kolejność arkuszy i chwyt okładki pokrywają się w granicy 1 px planu ogólnego. Odtworzyć styk z nagraniem i sprawdzić, czy odpowiedź Pawła biegnie przez cięcie.

[Plansza z układem rodziny i wózka](../../../referencje/kolejka-zus-v1.png) · [Referencje ruchu z opisem zastosowania](PLAN.md)


## Realizacja v3 (autor b07)

Modele r1 (`k.rewizja === "r1"`), wspólny świat bloku w [`../07/kolejka.mjs`](../07/kolejka.mjs): plan ogólny 1280×720, postaci s = 1, podłoga y 590, lada od x 960 (blat y 352), pracownica siedzi (1131,420) s 0,9, wózek s 0,95 (oś y 558). Każde ujęcie patrzy na ten świat kamerą `cam(z,cx,cy)`; kreski cienione z^−0,6. Teczka i druki jak w 03–06 (b01): teczka zamknięta, pionowo przy piersi, w ekranowo prawej dłoni Pawła; ekranowo lewa dłoń pracuje. Zdjęcie na okładce = `photo02(k)` (decyzja koordynatora). Render: `node build.mjs --only 06,…,13 --out robocze/b07`, `klatki.mjs`, `render.mjs 720 NN NN`. Przykład animatora ([ZRODLA.md](../../../v2/przyklady/ZRODLA.md)): Stickman `approved-2026-10-23-motion-sheet.png` (zmiana podpory przed naciskiem) i Video Shotcraft `JumpCutPunchIn.tsx` (cięcie na opuszkę).

| Klatki | Realizacja |
| --- | --- |
| 0–7 | Plan ogólny z 1. Klientka z bobem robi krok do okienka (x 1010→1032), starsza pani rusza zza Pawła (770→905, krok 64 px, torba z opóźnieniem). |
| 8–34 | Wózek 470→531 (krzywa bez zatrzymań), koła obracają się o drogę/32,3 px. Marta idzie za rączką (stopy 7–19 i 15–30). Paweł: lewa stopa 678→640 (10–23), prawa stoi w 722; biodra 700→678,4 do 28. **Kontakt 28**: udo (biodra −46) = prawa krawędź gondoli (px+106,4); 28–34 biodra jadą z gondolą do 683,4, koła stają w 34. Teczka +10 px wyżej. |
| 30–40 | URLOP przesuwa się z boku za okładkę na swoje miejsce (od 30 za okładką, bez nakładania). |
| 41–59 | Dłoń puszcza (41–44 `open`), wskazujący (`point`) ląduje w 59 na URLOP w punkcie lokalnym (−20,−34). |

Styk 09/59→10/0: ten sam świat, kamera z 1→4.

## Odbiór

Sprawdzone 0, 23, 28, 34, 35, 45, 59 i 479/480, 539/540. Prześwit 23, kontakt 28 (udo = krawędź gondoli), zatrzymanie 34; prawa stopa Pawła stała (x 722); koła toczą się o drogę. Statyści bez modelu r1: lekkie, bez twarzy (prośba). Otwarte: lewa ręka Pawła w 45–59 z łokciem na zewnątrz (brak skrótu perspektywicznego w r1).
