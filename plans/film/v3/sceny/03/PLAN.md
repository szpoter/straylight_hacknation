# 03 · Zdjęcie pod folią

Autor planu: s03

**04–06 s.** Paweł zabrał do urzędu zdjęcie chwili, kiedy Ola złapała go za palec. Widz odkrywa to razem z nim, śledząc ten sam palec od pełnego ekranu do odbitki na jego piersi. W ostatniej kolumnie arkusza v2 rodzinę otacza dużo pustej ściany. W v3 zatrzymujemy odjazd wcześniej, gdy widać obie twarze, gondolę i dłoń Marty na rączce. [Klatki v2](../../../v2/sceny/03/klatki.jpg) · [Rodzina i odbitka na teczce](../../../referencje/rodzina-oli-v1.png)

| Klatki | Co widzi widz |
| --- | --- |
| 0–5 | Po migawce nadal widać nieruchomy palec Pawła wchodzący z prawej, zaciśniętą na nim dłoń Oli i pas kocyka. Pozycję i skalę wyznacza ostatni czysty kadr sceny 02. |
| 6–21 | Słychać skrzypnięcie kółka. Paweł lekko przekręca teczkę ku światłu. Wąski ukośny refleks przecina zdjęcie i urywa się na szwie kieszonki. Kamera odsuwa się na tyle, by pokazać biały brzeg odbitki. |
| 22–40 | Odsłaniamy zagięty prawy róg, kciuk na przodzie i mankiet łączący go z przedramieniem. Druga ręka podtrzymuje spód teczki. Paweł ogląda zdjęcie, po czym pozwala teczce osiąść przy piersi. |
| 41–59 | Szerszy kadr odsłania Martę z lewej, śpiącą Olę w wózku i Pawła z prawej. Za jego barkiem czekają starsza osoba z torbą i klientka z ciemnym bobem. Marta trzyma rączkę, gotowa zakołysać gondolą w 04. |

Z planszy kolejki bierzemy profil budki i położenie okienka względem rodziny. Z arkusza rodziny bierzemy niski kok i linię ucha Marty, grzywkę i wąską żuchwę Pawła oraz pojedynczy zielony pas kocyka Oli. Marta widoczna na szpitalnej odbitce i Marta stojąca przy wózku korzystają z tych samych widoków twarzy. [Kolejka ZUS](../../../referencje/kolejka-zus-v1.png) · [Wspólna obsada](../../POSTACIE.md)

W przykładzie Bang Motion oko może śledzić pociąg względem mijanego otoczenia. U nas w ten sposób śledzi obrys dłoni Oli, gdy w kadr wchodzą kolejne krawędzie teczki. Z drugiego rzędu planszy Stickman bierzemy dwie różne podpory dla ciężaru przedmiotu. U Pawła jedna ręka podpiera dolny brzeg, druga prowadzi przechył. [Bang Motion · ciągłość ruchu](../../../v2/przyklady/ciagly-ruch.jpg) · [Oryginał](https://github.com/bangtutorial/bang-motion/blob/c1aa65e921c970d858705fcb4a53a8294d1a4131/docs/gallery/05-continuous-action.jpg) · [Stickman · fazy dłoni pod obciążeniem](../../../v2/przyklady/fazy-ruchu.png) · [Oryginał](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b1/approved-2026-10-23-motion-sheet.png)

[Specyfikacja ujęcia](SPEC.md)

## Realizacja v3 (autor b01)

0–5: dosłownie `scene02(59)` (= 02/53). Od 6 (skrzyp 4,20 s) kamera odjeżdża wzdłuż odbitki: obraz 02 jest zdjęciem w teczce (`photo02` wstawione w prostokąt zdjęcia `k.folder`, transformacja `PHOTO_IN_FOLDER` w `kolejka.mjs`), z białą ramką i kieszonką z folii (lokalny dodatek). Zoom logarytmiczny ze smoothstep 6→56 (S₀ ≈ 23, w kl. 6 jeden piksel 02 = jeden piksel ekranu, obrót kamery znosi −5° teczki). Refleks: wąska smuga 6–20 w obrębie kieszonki, kończy się na szwie. Teczka przechyla się o +4° (6–18) i osiada 22–40. Linie świata pogrubiają się wolniej niż zoom (×S^−0,92), linie zdjęcia skalują się jak fotografia.

Świat kolejki (`sceny/03/kolejka.mjs`, wspólny dla 03–06): `k.queue()` ×1,25 (styk ściana/podłoga y 560), podłoga stóp y 700, postaci s 1,3. Marta biodra (232,456), lewa ekranowa (jej prawa) dłoń `hold` na rączce w (273,415); wózek `k.pram` (470,657.5) s 1,25. Paweł biodra (880,424), teczka zamknięta (896,342) w = 114, −5°; prawa dłoń (ekranowo lewa) trzyma grzbiet, kciuk z przodu (ręka za okładką + pasek przy krawędzi narysowany ponownie), lewa (ekranowo prawa) podpiera dół od spodu. Z teczki wystają dwa druki: URLOP z przodu (38 j. ponad okładką), ZASIŁEK za nim (34 j., +8 w prawo). Statyści w głębi (starsza osoba z torbą, klientka z bobem) to płaskie sylwetki bez twarzy, tyłem — r1 nie ma statystów.

Przykład animatora: [Bang Motion · 05-continuous-action.jpg](https://github.com/bangtutorial/bang-motion/blob/c1aa65e921c970d858705fcb4a53a8294d1a4131/docs/gallery/05-continuous-action.jpg) (lokalnie `../../../v2/przyklady/ciagly-ruch.jpg`) — oko trzyma się obrysu dłoni Oli, gdy wchodzą kolejne krawędzie; oraz [Stickman · approved-2026-10-23-motion-sheet.png](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b1/approved-2026-10-23-motion-sheet.png) (lokalnie `../../../v2/przyklady/fazy-ruchu.png`) — dwie podpory ciężaru teczki. Render: `node build.mjs --only 01,02,03,04,05,06 --out robocze/b01`, klatki `klatki.mjs`, ujęcie `render.mjs 720 NN NN`. Modele **r1** (`k.rewizja`), bez zmian w `obsada/`.
