# 12 · Przy okienku

Autor planu: s12

**22–24 s.** Kamera na końcu lady, na wysokości twarzy siedzącej pracownicy. Marta po lewej, Paweł bliżej środka. Między ciemnym mankietem Pawła a jasnym kołnierzykiem pracownicy zostaje miejsce na przekazanie druku. Pracownica mówi do rodziców „To jest wniosek o zasiłek”. [Stanowisko po prawej](../../../referencje/kolejka-zus-v1.png) · [Scenariusz](../../../../../PLAN-FILMU-DEMO.md)

| Klatki | Co widzimy |
| --- | --- |
| 0–12 | Prawa ręka Pawła podaje „ZASIŁEK” za górną krawędź. Lewa dłoń pracownicy otwiera się przy prawym brzegu. Jej kciuk ląduje na zadrukowanej stronie, dwa palce podpierają papier od spodu. |
| 13–22 | Oboje trzymają arkusz. Pracownica przejmuje ciężar na zgiętym łokciu. Dopiero wtedy Paweł rozwiera palce i cofa dłoń do otwartej teczki. |
| 23–36 | Wzrok pracownicy opada na słowo „ZASIŁEK”, broda lekko za nim podąża. Pracownica zatrzymuje papier przy sobie na czas rozpoznania nagłówka. Marta czeka. |
| 37–59 | Pracownica prowadzi arkusz lewym nadgarstkiem w stronę Marty. Dolna krawędź opiera się o blat. Marta dostrzega tytuł, pracownica podnosi na nią wzrok. Prawa ręka pracownicy jest wolna do wskazania daty w kolejnym ujęciu. |

Pracownica korzysta ze wspólnego widoku ¾ od strony klientów. Wysoki szary kok obraca się razem z głową. Jasny kołnierzyk i identyfikator zostają na tułowiu. Podczas pochylenia utrzymujemy łagodną, dojrzałą linię policzka oraz spokojne brwi. Z pakietu Stickman bierzemy sposób osadzenia głowy i mankietu w każdym widoku, z planszy póz przy stole kolejność opuszczenia oczu i pochylenia karku. [Wspólna obsada](../../POSTACIE.md) · [Stickman, punkty modelu w trzech widokach](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b6/characters/kiosk_keeper/package.json) · [Plansza póz](../../../v2/przyklady/pozy-postaci.png) · [Oryginał Stickman](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b1/character-acting-reference.png)

[Specyfikacja ujęcia](SPEC.md)


## Realizacja v3 (autor b07)

Modele r1 (`k.rewizja === "r1"`), wspólny świat bloku w [`../07/kolejka.mjs`](../07/kolejka.mjs): plan ogólny 1280×720, postaci s = 1, podłoga y 590, lada od x 960 (blat y 352), pracownica siedzi (1131,420) s 0,9, wózek s 0,95 (oś y 558). Każde ujęcie patrzy na ten świat kamerą `cam(z,cx,cy)`; kreski cienione z^−0,6. Teczka i druki jak w 03–06 (b01): teczka zamknięta, pionowo przy piersi, w ekranowo prawej dłoni Pawła; ekranowo lewa dłoń pracuje. Zdjęcie na okładce = `photo02(k)` (decyzja koordynatora). Render: `node build.mjs --only 06,…,13 --out robocze/b07`, `klatki.mjs`, `render.mjs 720 NN NN`. Przykład animatora ([ZRODLA.md](../../../v2/przyklady/ZRODLA.md)): Stickman B6 `package.json` (osadzenie głowy i mankietu pracownicy) i `character-acting-reference.png` (oczy przed karkiem).

Szczegóły klatek i styków: [SPEC](SPEC.md#realizacja-v3-autor-b07).
