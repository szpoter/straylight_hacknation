# 17 · Z drugim butem w ręce

Autor planu: s17

**32–34 s.** Paweł mówi „Wezmę jutro wolne”. Sięga po but jak po powrocie do domu. Wzrok wraca mu do druku na kolanie Marty i na moment zapomina odłożyć but. Nieruchomy plan kanapy obejmuje wózek, obie twarze, dłonie i podłogę pod stopami. [Scenariusz](../../../../../PLAN-FILMU-DEMO.md) · [Poza z butem przy podłokietniku](../../../referencje/kanapa-przed-fala-v1.png)

| Klatki | Co widzi widz |
| --- | --- |
| 0–14 | Paweł siedzi po prawej i zerka z formularza na stopy. Przytrzymuje drugim butem zapiętek pierwszego, bliższego Marcie. Wysuwa z niego piętę, potem palce. Jasna skarpeta staje obok pustego buta. |
| 15–28 | Paweł opiera wolną dłoń o udo. Pochyla się z bioder w stronę podłokietnika i unosi drugie kolano. Łokieć wychodzi na zewnątrz, dłoń po tej samej stronie zakreśla łuk do zapiętka. Palce zaciskają się na jego krawędzi. |
| 29–42 | Paweł prostuje kostkę i cofa stopę. But wyślizguje się z palców stopy i pozostaje w dłoni. Widać drugą jasną skarpetę. Opadający nosek obraca but wokół chwytu. |
| 43–59 | Oczy Pawła wracają do nagłówka „ZASIŁEK”, głowa podąża za nimi. Ręka zatrzymuje się na zewnątrz kolana. Drugi but zwisa noskiem w dół. Marta dalej trzyma kartki na kolanach. |

Z arkusza faz bierzemy kolejność zmian podparcia. Na planszy gry postaci kierunek przedramienia wskazuje, który przedmiot zajmuje bohatera. Pod koniec naszego ujęcia kierunek dłoni nadal prowadzi do buta, a twarz i źrenice już do druku. [Stickman · fazy ruchu](../../../v2/przyklady/fazy-ruchu.png) · [Oryginał](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b1/approved-2026-10-23-motion-sheet.png) · [Stickman · gra postaci](../../../v2/przyklady/pozy-postaci.png) · [Oryginał](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b1/character-acting-reference.png)

[Wspólna obsada](../../POSTACIE.md) · [Specyfikacja ujęcia](SPEC.md)

## Realizacja v3 (autor b13)

Rewizja modeli r1, skala 1,28. 0–12 pięta lewej ekranowo stopy wysuwa się (`heelOut`), w 12 but zostaje na podłodze (690,676) jak w modelu. 15–28 skłon i skręt żeber w prawo, kolano w górę, dłoń do pięty, chwyt w 28. 29–42 pięta wysuwa się z drugiego buta, stopa wraca na podłogę. 43–59 wzrok, potem głowa ku „ZASIŁKOWI”, but wisi noskiem w dół przy (942,537).

Źródła: plansze [kolejka](../../../referencje/kolejka-zus-v1.png) i [kanapa](../../../referencje/kanapa-przed-fala-v1.png), modele r1 (`k.rewizja === "r1"`, [POSTACIE.md](../../POSTACIE.md)), daty z `app/src/features/chat/case-data.ts` („11 stycznia – 7 lutego 2027” → odręcznie 11.01.2027). Usta z obwiedni `media/dialog.flac`, stuki z `media/efekty.flac`. Render: `build.mjs --only 13..18 --out robocze/b13`, `klatki.mjs`, `render.mjs`. Przykład animatora: [ZRODLA.md](../../../v2/przyklady/ZRODLA.md) — Stickman `approved-2026-10-23-motion-sheet.png` (kolejność: podparcie → żebra → głowa → dłoń), Bang Motion `05-continuous-action.jpg` (ruch przez cięcie), Video Shotcraft `card-stack.jpg` (przesunięte krawędzie kart).
