# 05 · Specyfikacja ujęcia „Na pewno wziąłeś dobre?”

Autor planu: s05

08–10 s, klatki filmu 240–299. Lokalnie 0–59 przy 30 kl./s. Podgląd 1280 × 720. Marta w profilu ze wspólnego modelu, Paweł w trzech czwartych. Strony dłoni poniżej odnoszą się do ciała Pawła. [Modele i konstrukcja stawów](../../POSTACIE.md)

| Klatki | Kontakt i kolejność odsłon |
| --- | --- |
| 0–8 | Po cięciu z 04 zachować pochylenie Marty, prawą dłoń na rączce oraz wysokość teczki względem guzików Pawła. Grzbiet teczki oparty o lewe przedramię, lewa dłoń obejmuje dolną krawędź. Oba druki w środku. |
| 9–15 | Szelest w 8,30 s. Prawy kciuk ugina okładkę, wskazujący wchodzi za górny prawy róg pierwszej kartki widziany w kadrze. W klatce 15 opuszki zamykają chwyt. Do tego momentu oba arkusze pozostają na miejscu. |
| 16–35 | Utrzymać punkt styku palców z papierem. Najpierw ugina się wolny róg, potem rusza cały „URLOP”. Druk „ZASIŁEK” pozostaje przy grzbiecie. W klatce 25 widać całe drugie słowo. W klatkach 26–29 źrenica Marty schodzi na drugi druk, w 30–35 za spojrzeniem idzie głowa. Usta prowadzi nagranie „Na pewno wziąłeś dobre?”. |
| 36–59 | Po słowie „dobre?” Marta zamyka usta. Paweł trzyma „URLOP” licem ku kamerze, prawy górny róg pod kciukiem, wskazujący za kartką. Oba nagłówki widoczne obok siebie. 06 przejmuje dokładnie ten chwyt i dopiero wtedy Paweł przekłada kciuk przed obrotem arkusza. |

## Odbiór na renderze

- Zestawić klatki 8, 15, 25 i 59. Można prześledzić każde przedramię od łokcia do mankietu. Mankiet zachodzi na nasadę dłoni. Porównać długość ramienia i przedramienia z modelem w jego lokalnych współrzędnych.
- Klatkę po klatce przejrzeć 12–20. Kciuk zakrywa fragment przedniej powierzchni, wskazujący znika za rogiem. Fałda zaczyna się przy opuszkach. Lewy nadgarstek utrzymuje dolną krawędź teczki w czasie ruchu prawej ręki.
- Przy wyciszonej próbie w 720p wskazać oba tytuły w kolejności odsłonięcia i moment, kiedy Marta dostrzega drugi. W pomniejszeniu do szerokości 360 px nadal powinien być widoczny ruch jej oka, a potem brody.
- Na parach klatek 04/59 i 05/0 oraz 05/59 i 06/0 wyrównać skalę według teczki i porównać położenie obu kciuków, grzbietu oraz odsłoniętego rogu. Przed pierwszym ruchem w 06 widać jeszcze przód arkusza z napisem „URLOP”.

[Plan i przykłady](PLAN.md) · [Poprzednie ujęcie](../04/SPEC.md) · [Następne ujęcie](../06/SPEC.md)

## Realizacja v3 (autor b01)

Kadr ×2,05 wokół (806,252) świata kolejki; współrzędne poniżej w kadrze 05. 05/0: kciuk na rogu teczki (670,403), łokieć (440,377). 05/59: chwyt na lewym górnym rogu URLOP-u (453,307), róg arkusza (433,296), łokieć (610,512); lewa dłoń pod teczką (901,636). ZASIŁEK w teczce, nagłówek odsłonięty od 25. Marta: profil przy lewej krawędzi (głowa w (120,470), s 3,1), w 59 patrzy w dół na ZASIŁEK.

## Odbiór

- Klatki 0, 8, 15, 20, 25, 30, 35, 59 obejrzane: w 15 palce zamknięte na rogu, 15–19 ugina się tylko róg, potem jedzie cały arkusz; w 25 cały „ZASIŁEK” czytelny; źrenica Marty 26–29, broda 30–35.
- Ramię i przedramię Pawła mają stałą długość; mankiet zachodzi na nasadę dłoni (r1).
- Odstępstwo od SPEC: chwyt na lewym (bliższym prawej dłoni) rogu, ruch w prawo w układzie ciała Pawła.
