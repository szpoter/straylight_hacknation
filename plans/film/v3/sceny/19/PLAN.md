# 19 · Kartka spod łokcia

Autor planu: s19

**36–38 s.** Paweł wybrał już „ZASIŁEK”. Kiedy próbuje wyciągnąć go jedną ręką, własnym łokciem trzyma przeciwny koniec pliku. W jednym nieruchomym kadrze widzimy równocześnie krótszy brzeg druku w jego palcach, mankiet na papierze i wolną rękę Marty. [Ostatnia poza ujęcia 18](../18/SPEC.md) · [Plansza kanapy](../../../referencje/kanapa-przed-fala-v1.png)

| Klatki | Gra postaci i papieru |
| --- | --- |
| 0–13 | Paweł ciągnie „ZASIŁEK” w lewo. Spód druku zabiera ze sobą krawędź następnej kartki. Jej dalszy koniec nadal tkwi pod prawym ekranowym łokciem. Pomiędzy dłonią a mankietem wyrasta łuk. Marta już patrzy na wystający róg. |
| 14–35 | Dolna kartka wymyka się spod rękawa, prostuje i zahacza podwiniętym rogiem o kolejny arkusz. Ten sunie po kolanach Marty. Jej oczy podążają za nim, dopiero potem prawa ekranowa ręka opuszcza kolano. Paweł rozluźnia lewy chwyt, próbując przechwycić uciekający brzeg. |
| 36–51 | Marta podsuwa dłoń od spodu, ale róg przechodzi nad jej palcami. Na moment widać prześwit. Następne arkusze rozsuwają się wachlarzem od teczki przez oba uda. Pierwsza wygięta kartka unosi się między rodzicami, a ich spojrzenia spotykają się na jej grzbiecie. |
| 52–59 | Suchy klik zatrzymuje łokieć, otwarte palce i pofalowane kartki. Salon i twarze miękną. Od kl. 53 w środku fali patrzy na widza ostry, oryginalny Zusik. Przez ostatnie siedem klatek wciąż widzimy za nim tę samą rodzinę. |

Na planszy fali otwarta teczka tworzy dolny początek wachlarza, a za każdą z uniesionych krawędzi widać następny arkusz. Zostawiamy obie twarze ponad gęstym pasem papieru. Rytm spojrzenia, ruchu łokcia i nadgarstka bierzemy z kolejnych póz Stickman Video Director. Ze stosu kart Video Shotcraft bierzemy przesunięcie konturów, które pozwala rozpoznać osobno arkusz pociągnięty, przytrzymany i podrywany. [Plansza fali](../../../referencje/fala-formularzy-zusik-v1.png) · [Arkusz póz Stickman](../../../v2/przyklady/fazy-ruchu.png) · [Stos kart Video Shotcraft](../../../v2/przyklady/stos-kart.jpg)

[video-shotcraft · card-stack.jpg](https://github.com/Vincentwei1021/video-shotcraft/blob/59f3e9b9e936ff2bce0e18446226d770a3f2f61f/gallery/media/poster/card-stack.jpg) · [stickman-video-director · approved-2026-10-23-motion-sheet.png](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b1/approved-2026-10-23-motion-sheet.png)

## Realizacja v3 (autor s19, blok b19)

Kadr i skala z modelu r1. Klatka 0 to `k.sofaPose(rola,"przekazanie")`, czyli ten sam układ co duet na [planszy obsady r1](../../obsada/plansza-obsady-r1.png): biodra Marty (427,490), Pawła (800,490), s = 1,28. Teczka leży w (688,493), ma 300 px i kąt −3°. Stos ma środek (817,455), łokieć Pawła jest w (872,452), oba buty stoją na podłodze. Rodzice zajmują kadr od czubka głowy do stóp. Twarze w każdej klatce pozostają nad pasem papieru.

| Klatki | Realizacja |
| --- | --- |
| 0–13 | Lewa ekranowa dłoń Pawła ciągnie ZASIŁEK w lewo (4–9). Arkusz pod nim wygina się w łuk, a jego prawy koniec zostaje pod rękawem. |
| 14–35 | Łokieć unosi się o 6 jednostek (14–18) i arkusz wychodzi spod rękawa. Jego róg popycha arkusz B z teczki po kolanach Marty (19–35). Źrenice Marty idą do środka (24–29), potem rusza bark. Paweł puszcza ZASIŁEK w 30. |
| 36–51 | Prawa dłoń Marty podchodzi od dołu, a arkusz przelatuje nad jej palcami z prześwitem (36–39). Wachlarz 16 arkuszy rusza z teczki w 32–46. Sześć luźnych kartek leci po torach Planck.js, które omijają twarze. Oboje podnoszą wzrok na grzbiet arkusza w (640,~330). |
| 52–59 | Klik w 52 (globalna 1132) zatrzymuje ruch. Salon i rodzice dostają rozmycie 1,4 → 2,2 → 2,6 px, a fala zostaje ostra. Od 53 w (640,325) stoi oryginalny Zusik w ramce 270 px. |

Narzędzia: Anime.js (`cubicBezier`, `stagger` od środka dla startów wachlarza), Scene.js (`SceneItem` z łukiem i zgięciem rogu prowadzącego arkusza), Planck.js (luźne kartki liczone raz przy imporcie modułu). Wszystko zależy tylko od numeru klatki. Ręce, które sięgają nad papier (lewa Pawła, prawa Marty), są w warstwie fali i dostają to samo rozmycie co tło.

Przykłady animatora: [Stickman · approved-2026-10-23-motion-sheet.png](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b1/approved-2026-10-23-motion-sheet.png). Z niego wzięliśmy kolejność: najpierw oczy, potem bark, na końcu dłoń. Drugi przykład to [Video Shotcraft · card-stack.jpg](https://github.com/Vincentwei1021/video-shotcraft/blob/59f3e9b9e936ff2bce0e18446226d770a3f2f61f/gallery/media/poster/card-stack.jpg). Z niego wzięliśmy przesunięte krawędzie arkuszy w wachlarzu. Lokalne kopie są w [ZRODLA.md](../../../v2/przyklady/ZRODLA.md).
