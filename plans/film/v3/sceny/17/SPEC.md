# 17 · Specyfikacja ujęcia „Z drugim butem w ręce”

Autor planu: s17

32–34 s, klatki filmu 960–1019. Lokalnie 0–59 przy 30 kl./s. Pełny kadr 1280 × 720. Dla siedzącego prawie frontem Pawła strona bliższa Marcie to jego anatomiczna prawa, po lewej stronie jego sylwetki na ekranie. Przy zewnętrznym podłokietniku widzimy jego anatomiczną lewą stopę i dłoń. [Plansza kanapy](../../../referencje/kanapa-przed-fala-v1.png) · [Model w siadzie](../../POSTACIE.md)

## Pozy, kontakt i dźwięk

| Klatki lokalne | Poza i punkty kontroli |
| --- | --- |
| 0–14 | **0 = 16/59.** Biodra Marty (427,490), Pawła (800,490). Obie stopy Pawła obute, podeszwy na podłodze, obie dłonie na udach. Oczy na prawym nagłówku. Okładka otwarta między rodzicami. „URLOP” na lewym ekranowym udzie Marty pod palcem przy dolnym rogu, „ZASIŁEK” na prawym pod dłonią przy dolnym prawym rogu. Po spojrzeniu w dół Paweł dociska czubkiem drugiego buta zapiętek pierwszego. Do 14 prawa anatomiczna stopa wysuwa się i opiera na podłodze w jasnej skarpecie. Pierwszy but stoi płasko. |
| 15–28 | Ciężar siadu pozostaje na poduszce. Prawa anatomiczna dłoń podpiera własne udo. Lewy bark schodzi do uniesionego lewego kolana, łokieć omija kolano od strony podłokietnika, nadgarstek dochodzi do pięty. Na 26 kciuk wchodzi za zapiętek, na 28 palce zamykają się po jego zewnętrznej stronie. But i ta stopa wciąż się stykają. |
| 29–42 | Dłoń prowadzi zapiętek na zewnątrz i w górę, kostka wysuwa się do tyłu. Gdy palce stopy miną otwór buta, jasna skarpeta w całości oddziela się od cholewki. Kolano opada, skarpeta wraca na podłogę. Nosek zaczyna opadać pod własnym ciężarem. Pięta pozostaje w chwycie. |
| 43–59 | Na 43–46 źrenice kierują się w lewo i w dół ku „ZASIŁKOWI”. Na 47–53 obracają się głowa i barki. Lewa anatomiczna dłoń zatrzymuje piętę w (942,537), po zewnętrznej stronie kolana. Na 54–59 but wisi pionowo, noskiem w dół. Usta Pawła pracują pod istniejące nagranie „Wezmę jutro wolne”. Oba nagłówki i ręce Marty zachowują położenie. |

## Styk z 18 i odbiór anatomii

Na **17/59 = 18/0** obie skarpetki opierają się o podłogę. Pierwszy but leży przy stopie bliższej Marcie, drugi zwisa z dłoni przy podłokietniku. Wolna ręka Pawła pozostaje na własnym udzie, palce Marty nadal dotykają dolnych rogów druków. Opuszczenie drugiego buta rozpoczyna scena 18. [Wejście z 16](../16/SPEC.md) · [Odkładanie buta w 18](../18/SPEC.md)

Przy odbiorze zestawić klatki 0, 14, 28, 42 i 59. W planie od bioder do podłogi prześledzić obie linie od kolana przez kostkę do palców i osobno dwie ciemne podeszwy. Przy skłonie sprawdzić ciągłość bark–łokieć–nadgarstek i palce po przeciwnych stronach zapiętka. W pełnym kadrze z wyciszeniem sprawdzić powrót spojrzenia na prawy druk. Nałożyć 17/59 na 18/0 i porównać chwyt, pion buta, obie kostki, punkt podparcia każdej stopy oraz dolne rogi obu kartek. [Arkusz faz](../../../v2/przyklady/fazy-ruchu.png) · [Pozy z rekwizytem](../../../v2/przyklady/pozy-postaci.png) · [Plan](PLAN.md)

## Realizacja v3 (autor b13)

Rewizja modeli r1, skala 1,28. 0–12 pięta lewej ekranowo stopy wysuwa się (`heelOut`), w 12 but zostaje na podłodze (690,676) jak w modelu. 15–28 skłon i skręt żeber w prawo, kolano w górę, dłoń do pięty, chwyt w 28. 29–42 pięta wysuwa się z drugiego buta, stopa wraca na podłogę. 43–59 wzrok, potem głowa ku „ZASIŁKOWI”, but wisi noskiem w dół przy (942,537).

Źródła: plansze [kolejka](../../../referencje/kolejka-zus-v1.png) i [kanapa](../../../referencje/kanapa-przed-fala-v1.png), modele r1 (`k.rewizja === "r1"`, [POSTACIE.md](../../POSTACIE.md)), daty z `app/src/features/chat/case-data.ts` („11 stycznia – 7 lutego 2027” → odręcznie 11.01.2027). Usta z obwiedni `media/dialog.flac`, stuki z `media/efekty.flac`. Render: `build.mjs --only 13..18 --out robocze/b13`, `klatki.mjs`, `render.mjs`. Przykład animatora: [ZRODLA.md](../../../v2/przyklady/ZRODLA.md) — Stickman `approved-2026-10-23-motion-sheet.png` (kolejność: podparcie → żebra → głowa → dłoń), Bang Motion `05-continuous-action.jpg` (ruch przez cięcie), Video Shotcraft `card-stack.jpg` (przesunięte krawędzie kart).

## Odbiór

Sprawdzone klatki: 0, 6, 12, 22, 27, 32, 37, 44, 52, 59 i kafel co 3 kl. Pierwsza stopa (lewa ekranowo): pięta wychodzi 2–9 (`heelOut`), w 10 but leży na podłodze w (690,676) — dokładnie miejsce z modelu. Drugi but: skłon 0,72, przechył 18°, skręt żeber +0,3 ku stopie (14–26), kolano w górę 16–27, chwyt zapiętka 27, pięta wysuwa się 29–35, w 35 but przechodzi do dłoni (widok boczny), stopa wraca na podłogę do 46. Wzrok do „ZASIŁKU” 46, głowa 53. But wisi noskiem w dół w (942,537) od 52, wahnięcie wygasa do 59. Usta Pawła na „Wezmę jutro wolne” (1–25) i początek „Zawiozę…” od 35.

**Ograniczenie modelu:** but na stopie jest rysunkiem z przodu, zdjęty — z boku (jak w modelu); zamiana w kl. 10 i 35 jest widoczna jako mały przeskok kształtu.

Render: `ujecie-720p.mp4`, `klatki.jpg` (kl. 0/20/40/59), `pozy.jpg` (v2 u góry, v3 u dołu). Czytelność 360 px: `../../robocze/b13/w360.png`.
