# 05 · Na pewno wziąłeś dobre?

Autor planu: s05

**08–10 s.** Kamera tuż za lewym barkiem Marty, na wysokości jej policzka. W lewym brzegu kadru widzimy profil, bliższe oko i usta. W głębi Paweł patrzy na teczkę. Między policzkiem Marty a mankietami Pawła zostawiamy miejsce na obie kartki.

1. **0–8.** Przejmujemy pochylenie Marty z 04. Na „Na pewno…” patrzy na prawą dłoń Pawła. On opiera przyniesioną do piersi teczkę na lewym przedramieniu. Pozycję łokcia pod ciężarem bierzemy z prawej ilustracji arkusza Stickman. [Pozy z rekwizytem](../../../v2/przyklady/pozy-postaci.png)
2. **9–15.** Na szelest Paweł rozchyla rant teczki prawym kciukiem. Wsuwa palec wskazujący za wolny róg druku, od przodu dociska go opuszkiem kciuka. Nad okładką widać „URLOP”.
3. **16–35.** Paweł cofa łokieć i ciągnie róg w prawo i lekko w górę. W klatce 25 spod pierwszego arkusza można już odczytać cały „ZASIŁEK”. Oko Marty schodzi na niższy napis, chwilę później pochyla się broda. Widz ma dostrzec jej wątpliwość jeszcze na „dobre?”. Wzorem jest zakładka sąsiednich kart w wachlarzu Video Shotcraft. [Warstwy kartek](../../../v2/przyklady/stos-kart.jpg)
4. **36–59.** Marta zamyka usta i dalej czyta drugi nagłówek. Paweł zatrzymuje „URLOP” poniżej twarzy. Pozostawia róg między palcami i daje sobie chwilę na sprawdzenie odwrotu w 06.

[Plansza firmowa](../../../referencje/kolejka-zus-v1.png) · [Wspólna obsada](../../POSTACIE.md)

[Stickman · gra postaci](../../../v2/przyklady/pozy-postaci.png) · [Oryginał](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b1/character-acting-reference.png) · [Video Shotcraft · głębia stosu](../../../v2/przyklady/stos-kart.jpg) · [Oryginał](https://github.com/Vincentwei1021/video-shotcraft/blob/59f3e9b9e936ff2bce0e18446226d770a3f2f61f/gallery/media/poster/card-stack.jpg)

[Specyfikacja tego ujęcia](SPEC.md)

## Realizacja v3 (autor b01)

Kamera zza lewego barku Marty: świat kolejki ×2,05 wokół (806,252), linie ×z^−0,62; na pierwszym planie profil Marty `k.head(head .93)` przy lewej krawędzi, szyja i szałwiowy bark (kształty lokalne). Paweł ¾ w świecie. Strony dłoni wg ciała Pawła: prawa = ekranowo lewa.

0–8 jak 04/59 (kciuk na rogu teczki). 9–15 (szelest 8,30 s) palce przechodzą na wolny lewy górny róg URLOP-u, chwyt `pinch` zamknięty w 15. 15–19 róg się ugina (`bend`, `lift`), 16–26 arkusz wysuwa się w prawo (ku jego prawej, ekranowo w lewo) i w górę: dx −84, dy −34 j., −9°. W kl. 25 nagłówek ZASIŁEK odsłonięty. Marta: źrenica 26–29 na drugi druk, głowa 30–35; usta z `mowa.json` (244–275). 36–59 URLOP nieruchomo pod twarzą Pawła, róg w palcach. Odstępstwo: SPEC mówi o „górnym prawym rogu widzianym w kadrze”; prawa dłoń Pawła jest po lewej stronie kadru, więc chwyta bliższy, lewy górny róg i ciągnie „w prawo” w układzie ciała.

Przykład animatora: [Video Shotcraft · card-stack.jpg](https://github.com/Vincentwei1021/video-shotcraft/blob/59f3e9b9e936ff2bce0e18446226d770a3f2f61f/gallery/media/poster/card-stack.jpg) (lokalnie `../../../v2/przyklady/stos-kart.jpg`) — kolejna karta zachowuje swój brzeg na tle sąsiedniej; [Stickman · character-acting-reference.png](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b1/character-acting-reference.png) (lokalnie `../../../v2/przyklady/pozy-postaci.png`) — łokieć pod ciężarem. Render: `node build.mjs --only 01,02,03,04,05,06 --out robocze/b01`, klatki `klatki.mjs`, ujęcie `render.mjs 720 NN NN`. Modele **r1** (`k.rewizja`), bez zmian w `obsada/`.
