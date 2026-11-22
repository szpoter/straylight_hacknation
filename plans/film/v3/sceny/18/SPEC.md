# 18 · Kontakty buta, dłoni i łokcia

Autor planu: s18

34,00–36,00 s, klatki filmu 1020–1079, lokalne 0–59 przy 30 kl./s. Kadr 1280 × 720, nieruchoma kamera na wysokości siedzących rodziców. Biodra Marty (427,490), Pawła (800,490). Zachować skalę postaci, położenie dwóch stóp w skarpetkach i obu butów z sąsiednich ujęć. „Lewo” i „prawo” poniżej oznaczają strony ekranu.

| Klatki | Rysunek i kontakt |
| --- | --- |
| 0–18 | 18/0 przejmuje 17/59. Pierwszy but leży płasko od strony Marty, obie skarpety na podłodze. W prawej ekranowej, anatomicznie lewej dłoni Pawła drugi but zwisa noskiem pionowo w dół, zapiętek w (942,537). Lewa ekranowa dłoń spoczywa na udzie Pawła, oczy są na „ZASIŁKU” na prawym ekranowym udzie Marty. Przy odkładaniu pięta schodzi do (858,656), nadgarstek obraca but do poziomu. Pełny kontakt podeszwy i stuk wypadają na **kl. 18, 34,60 s**. |
| 19–31 | Na kl. 19 palce po prawej puszczają zapiętek. But zostaje w miejscu obok skarpety. Dłoń po lewej chwyta teczkę za bliższy brzeg, potem ciągnie ją na swoje udo. Marta prawą ekranową dłonią puszcza „ZASIŁEK”, lewą utrzymuje „URLOP”. Spódnica układa się nad kolanami przy przeniesieniu ciężaru. |
| 32–46 | Paweł zatrzymuje teczkę. Palec wskazujący po lewej zasłania wierzch „ZASIŁKU”, kciuk wchodzi pod krótszą krawędź. Róg odchyla się razem z palcami, odsłaniając drugi arkusz. Prawy nadgarstek wraca ku piersi, łokieć pozostaje nad stosem. Najpierw źrenice Marty schodzą na ten róg, potem pochyla się głowa. |
| 47–59 | Prawy łokieć Pawła osiada na stosie w pobliżu (871,453). Obrzeże rękawa zasłania dociskany papier. Lecący arkusz pojawi się przy ciągnięciu w 19. W kl. 59 oba buty spoczywają na podłodze obok skarpet. Marta cofnęła dłonie na swoje kolana. |

**Przekazanie 18/59 → 19/0.** Teczka otwarta w (688,493), szerokość 300 px, kąt −3°. Stos przy (817,455), „ZASIŁEK” na wierzchu, krótki brzeg w lewej ekranowej dłoni Pawła. Róg dolnego druku widoczny tuż pod nim. W lokalnych jednostkach modelu przy skali 1,16 czwórki oznaczają kolejno współrzędne łokcia i nadgarstka względem bioder. Paweł po lewej [−69,−42,−65,−35], po prawej [61,−32,39,−93]. Marta po lewej [−66,−36,−48,−10], po prawej [65,−33,79,−5]. Po obu stronach cięcia zachować kierunek spojrzeń na krawędź i obrys butów. [Wejście z 17](../17/SPEC.md) · [Przejęcie przez 19](../19/SPEC.md) · [Plansza salonu](../../../referencje/kanapa-przed-fala-v1.png)

**Test dla animatora.** Zestawić nakładki 17/59 z 18/0 oraz 18/59 z 19/0. Przy wyciszeniu obejrzeć kl. 17, 18 i 19 w zbliżeniu na but. Podeszwa zatrzymuje się na 18, palce otwierają się na 19. Na kl. 32, 46 i 59 widz ma wskazać osobno wybrany druk, róg spod niego i łokieć podtrzymujący plik. Przy szerokości 360 px oba buty i dwie skarpety mają pozostać rozróżnialne. W próbie dźwięku porównać początek stuku z kontaktem na 34,60 s i dopasować usta Pawła do istniejącej kwestii.

Z arkusza póz bierzemy zmianę podparcia przy opuszczaniu ręki. Z plakatu kart bierzemy przesunięcie dolnej krawędzi, przez które widać następny arkusz. [Stickman · approved-2026-10-23-motion-sheet.png](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b1/approved-2026-10-23-motion-sheet.png) · [Video Shotcraft · card-stack.jpg](https://github.com/Vincentwei1021/video-shotcraft/blob/59f3e9b9e936ff2bce0e18446226d770a3f2f61f/gallery/media/poster/card-stack.jpg)

## Realizacja v3 (autor b13)

Rewizja modeli r1, skala 1,28. 0–18 but schodzi do podłogi (zapiętek (912,678), odwrócony jak w modelu), kontakt i stuk w kl. 18 = 1038 (34,60 s), dłoń puszcza w 19. 19–31 lewa dłoń ciągnie teczkę za bliższy brzeg na uda (grzbiet → (688,493), 300 px, −3°), Marta odsuwa prawe palce. 32–46 lewy kciuk pod krótki brzeg „ZASIŁKU”, tułów wraca do skłonu. 47–59 prawy łokieć osiada na stosie; kl. 59 = `sofaPose(…,"przekazanie")` obojga 1:1.

Źródła: plansze [kolejka](../../../referencje/kolejka-zus-v1.png) i [kanapa](../../../referencje/kanapa-przed-fala-v1.png), modele r1 (`k.rewizja === "r1"`, [POSTACIE.md](../../POSTACIE.md)), daty z `app/src/features/chat/case-data.ts` („11 stycznia – 7 lutego 2027” → odręcznie 11.01.2027). Usta z obwiedni `media/dialog.flac`, stuki z `media/efekty.flac`. Render: `build.mjs --only 13..18 --out robocze/b13`, `klatki.mjs`, `render.mjs`. Przykład animatora: [ZRODLA.md](../../../v2/przyklady/ZRODLA.md) — Stickman `approved-2026-10-23-motion-sheet.png` (kolejność: podparcie → żebra → głowa → dłoń), Bang Motion `05-continuous-action.jpg` (ruch przez cięcie), Video Shotcraft `card-stack.jpg` (przesunięte krawędzie kart).

## Odbiór

Sprawdzone klatki: 0, 8, 16, 18, 19, 20, 26, 32, 38, 44, 50, 54, 57, 59. But schodzi z (942,537) do podłogi; pełny kontakt podeszwy w kl. 18 (1038 = 34,60 s, stuk w efektach 1039–1040), zapiętek (912,678), odwrócony jak w modelu; dłoń puszcza w 19. Paweł sięga do podłogi przechyłem 34° i skłonem 1 oraz przesuwa biodra o 6 px (zmiana podparcia). Lewa dłoń: brzeg teczki 23–35 (chwyt `grab`), teczka jedzie na uda 23–34 do (688,493), okładka wysuwa się spod druków Marty. Stos przesuwa się na miejsce modelu 30–44, róg „ZASIŁKU” podwija się 38–52, wystaje róg pustej kartki. Kciuk i palec na krótkim brzegu „ZASIŁKU” od ~44. Prawy łokieć osiada na stosie 36–52. Marta odsuwa prawe palce 19–25 i wraca do chwytu 44–54.

**Styk 18/59 → 19/0:** 18/59 = `sofaScene("przekazanie")` z `obsada/plansza.mjs`. Porównanie pikselowe (`robocze/b13/styk.mjs`, `roznica-1859.png`): 0 pikseli różnicy > 24/255, maksimum 3/255. Teczka (688,493) 300 px −3°, stos (814,455)/(826,462), łokieć Pawła na stosie (872,452), lewa dłoń (759,465), Marta patrzy na róg, oba buty na podłodze (690,676) i (912,678), oddech Oli 0,5.

Render: `ujecie-720p.mp4`, `klatki.jpg` (kl. 0/20/40/59), `pozy.jpg` (v2 u góry, v3 u dołu). Czytelność 360 px: `../../robocze/b13/w360.png`.
