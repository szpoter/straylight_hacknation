# 18 · Jeden but, dwa formularze

Autor planu: s18

**34–36 s.** Paweł zauważył „ZASIŁEK” na prawym ekranowym udzie Marty. Mówiąc „Zawiozę poprawiony wniosek do kadr”, nadal patrzy na nagłówek, choć ręka z butem wędruje ku podłodze. Marta widzi, którego druku szuka. Przytrzymuje drugi arkusz, żeby Paweł mógł podciągnąć teczkę. Na końcu patrzą na tę samą krawędź wystającą spod jego łokcia. [Scenariusz](../../../../../PLAN-FILMU-DEMO.md) · [Historia](../../HISTORIA.md)

| Faza | Co widz zauważa |
| --- | --- |
| 0–18 | But zwisa przy prawym podłokietniku. Paweł jeszcze odrobinę pochyla żebra, opuszcza bark i stawia but obok stopy. Kciuk wciąż obejmuje zapiętek, kiedy cała podeszwa dotyka podłogi. |
| 19–31 | Prawa ekranowa dłoń Pawła otwiera się nad butem. Lewa ekranowa schodzi z jego uda i podciąga teczkę za wolny brzeg. Dłoń Marty od strony Pawła odsuwa się od „ZASIŁKU”. Druga dłoń przytrzymuje „URLOP”. |
| 32–46 | Paweł wkłada kciuk pod krótki brzeg „ZASIŁKU”, palec wskazujący zostawia na wierzchu. Wybrany arkusz unosi się nad plikiem. W tym czasie wolny nadgarstek Pawła wraca znad podłogi do piersi. |
| 47–59 | Paweł opiera prawy ekranowy łokieć na drugim końcu stosu. Rękaw spłaszcza narożnik, a po lewej spod wybranego druku wystaje brzeg następnej kartki. Marta dostrzega ten róg. Na cięciu oboje siedzą w pozycji, z której zacznie się fala. |

Na planszy salonu zwisający but, przedramię i podłokietnik mają osobne kontury. Zachować tę szczelinę podczas opuszczania buta. U Marty jasna spódnica leży na obu kolanach, u Pawła mankiet ciemnej rozpiętej koszuli odsłania chwyt. Wózek z Olą i lampa zostają po lewej. [Kanapa przed falą](../../../referencje/kanapa-przed-fala-v1.png) · [Modele postaci](../../POSTACIE.md)

W dolnym rzędzie przykładu Stickman bark i łokieć zmieniają ułożenie przed dotknięciem blatu. To wzór dla drogi dłoni Pawła do podłogi. Na plakacie Video Shotcraft przesunięte krawędzie kart pozostawiają czytelny pasek kolejnej warstwy. W naszym stosie taki pasek daje widzowi czas rozpoznać drugi arkusz, zanim się wyślizgnie. [Stickman · arkusz faz](../../../v2/przyklady/fazy-ruchu.png) · [Video Shotcraft · wachlarz kart](../../../v2/przyklady/stos-kart.jpg) · [Konkretne pliki i próba odbioru](SPEC.md)

[Plik źródłowy Stickman](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b1/approved-2026-10-23-motion-sheet.png) · [Plik źródłowy Video Shotcraft](https://github.com/Vincentwei1021/video-shotcraft/blob/59f3e9b9e936ff2bce0e18446226d770a3f2f61f/gallery/media/poster/card-stack.jpg)

## Realizacja v3 (autor b13)

Rewizja modeli r1, skala 1,28. 0–18 but schodzi do podłogi (zapiętek (912,678), odwrócony jak w modelu), kontakt i stuk w kl. 18 = 1038 (34,60 s), dłoń puszcza w 19. 19–31 lewa dłoń ciągnie teczkę za bliższy brzeg na uda (grzbiet → (688,493), 300 px, −3°), Marta odsuwa prawe palce. 32–46 lewy kciuk pod krótki brzeg „ZASIŁKU”, tułów wraca do skłonu. 47–59 prawy łokieć osiada na stosie; kl. 59 = `sofaPose(…,"przekazanie")` obojga 1:1.

Źródła: plansze [kolejka](../../../referencje/kolejka-zus-v1.png) i [kanapa](../../../referencje/kanapa-przed-fala-v1.png), modele r1 (`k.rewizja === "r1"`, [POSTACIE.md](../../POSTACIE.md)), daty z `app/src/features/chat/case-data.ts` („11 stycznia – 7 lutego 2027” → odręcznie 11.01.2027). Usta z obwiedni `media/dialog.flac`, stuki z `media/efekty.flac`. Render: `build.mjs --only 13..18 --out robocze/b13`, `klatki.mjs`, `render.mjs`. Przykład animatora: [ZRODLA.md](../../../v2/przyklady/ZRODLA.md) — Stickman `approved-2026-10-23-motion-sheet.png` (kolejność: podparcie → żebra → głowa → dłoń), Bang Motion `05-continuous-action.jpg` (ruch przez cięcie), Video Shotcraft `card-stack.jpg` (przesunięte krawędzie kart).
