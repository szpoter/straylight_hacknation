# 15 · Powrót na kanapę

Autor planu: s15

28–30 s. Widz śledzi zdjęcie na opuszczanej teczce. Tuż po cięciu dostrzega inne miejsce, bo ten sam róg trafia w miękki brzeg kanapy. Kamera po stronie salonu pozostaje nieruchoma. W kadrze mieszczą się twarze, dłonie, kolana i podeszwy. Wózek z Olą stoi przy lewym podłokietniku. [Plansza firmowa kanapy](../../../referencje/kanapa-przed-fala-v1.png) · [Scenariusz](../../HISTORIA.md)

| Klatki | Reżyseria |
| --- | --- |
| 0–6 | Paweł po prawej kończy opuszczanie zamkniętej teczki rozpoczęte przy okienku. Kciuk leży na okładce, pozostałe palce obejmują ją od tyłu. Na pierwszych sześciu odstępach pomiędzy klatkami zdjęcie przesuwa się w rytmie ręki z urzędu. W kadrze 6 dolny lewy róg trafia w szew siedziska. Marta, już z ugiętymi kolanami, patrzy na róg. |
| 7–19 | Teczka obraca się wokół opartej krawędzi. Marta pierwsza przenosi ciężar z balerin na siedzisko. Pod jej biodrem powstaje wgłębienie. Jasny dół stroju obejmuje oba uda jednym brzegiem. Przy biodrze spódnica zbiera się w fałdę. Brzeg otwartej szałwiowej kurtki opada chwilę później. |
| 20–35 | Ciężar Pawła dociera do prawej części poduszki, gdy lewa zaczyna odrobinę wracać. Jego żebra obracają się ku teczce. Przód rozpiętej koszuli zachodzi na udo, rękaw marszczy się po wewnętrznej stronie łokcia. Paweł otwiera chwyt dopiero po położeniu okładki na siedzisku. Wzrok Marty zostaje przy grzbiecie. |
| 36–59 | Paweł cofa rękę na udo. Poduszka pozostaje lekko ugięta pod każdym z rodziców. Marta zbliża dłoń do grzbietu i pozostawia miejsce na pierwszy docisk w 16. Wózek pozostaje w tym samym miejscu, oba buty Pawła są na stopach. |

Animować z jednego wspólnego zestawu modeli w widoku siedzącym ¾. Marta zachowuje niski kok, odsłonięte ucho i szałwiową kurtkę z kolejki. Paweł zachowuje węższą żuchwę, grzywkę, rozpiętą koszulę i wyższy tułów. Oprzeć miednicę Marty równomiernie, a Pawła skierować lekko ku teczce. Przed rysowaniem przypiąć tę samą rewizję modeli twarzy, chwytu, pełnych sylwetek i teczki w 14–16. [Wspólna obsada](../../POSTACIE.md) · [Rodzina Oli](../../../referencje/rodzina-oli-v1.png)

W przykładzie Bang Motion uwaga widza podąża za ruchem przez zmianę tła. Tu punktem odniesienia jest lewy górny róg zdjęcia pod folią. Z arkusza Stickman bierzemy różnicę między pozą obciążoną i pozycją po osiadaniu. W naszej scenie tę różnicę pokazują miednica, barki i fałdy ubrania przy nieruchomych stopach. [Bang Motion · ciągłość gestu](../../../v2/przyklady/ciagly-ruch.jpg) · [Oryginał Bang Motion](https://github.com/bangtutorial/bang-motion/blob/c1aa65e921c970d858705fcb4a53a8294d1a4131/docs/gallery/05-continuous-action.jpg) · [Stickman · pozy w ruchu](../../../v2/przyklady/fazy-ruchu.png) · [Oryginał Stickman](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b1/approved-2026-10-23-motion-sheet.png)

[Specyfikacja ujęcia](SPEC.md)

## Realizacja v3 (autor b13)

Rewizja modeli r1, skala 1,28. Jedna funkcja `kanapa(g)` dla 840–1079 (plik `15/kanapa.mjs`), więc cięcia 15/16/17/18 są ciągłe. Teczka spada po torze z 14 i rogiem (−75,+90)·obrót dotyka siedziska w kl. 6 (846 = 28,20 s), potem obraca się wokół rogu do −3° i staje na siedzisku (grzbiet ≈ (517,407)). Siad: Marta — miednica 0–10, poduszka 10–17 (dół 18 px), spódnica/kurtka +3 kl.; Paweł — miednica 12–20, poduszka 20–25 (22 px). Koniec: oboje w siadzie, dłonie na udach, buty na stopach, prawa dłoń Marty 8 px od grzbietu.

Źródła: plansze [kolejka](../../../referencje/kolejka-zus-v1.png) i [kanapa](../../../referencje/kanapa-przed-fala-v1.png), modele r1 (`k.rewizja === "r1"`, [POSTACIE.md](../../POSTACIE.md)), daty z `app/src/features/chat/case-data.ts` („11 stycznia – 7 lutego 2027” → odręcznie 11.01.2027). Usta z obwiedni `media/dialog.flac`, stuki z `media/efekty.flac`. Render: `build.mjs --only 13..18 --out robocze/b13`, `klatki.mjs`, `render.mjs`. Przykład animatora: [ZRODLA.md](../../../v2/przyklady/ZRODLA.md) — Stickman `approved-2026-10-23-motion-sheet.png` (kolejność: podparcie → żebra → głowa → dłoń), Bang Motion `05-continuous-action.jpg` (ruch przez cięcie), Video Shotcraft `card-stack.jpg` (przesunięte krawędzie kart).
