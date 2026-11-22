# 14 · Do jutra

Autor planu: s14

**26–28 s.** Marta ma zrozumieć, ile czasu zostało rodzinie. Najpierw widzimy datę i ślad stalówki obok niej. Kiedy Marta przytakuje, uwagę przejmuje ręka Pawła chowająca ten sam druk. Kadr otwiera się w stronę teczki. W ostatniej chwili urząd można już opuścić cięciem. [Storyboard poczekalni](../../../referencje/kolejka-zus-v1.png) · [Wygląd i gesty rodziny](../../POSTACIE.md)

| Klatki | Prowadzenie ujęcia |
| --- | --- |
| 0–23 | Zostajemy na końcu wskazania z 13. Marta widzi „11.01.2027”. Anatomicznie lewa ręka pracownicy przytrzymuje prawy brzeg papieru. Prawa osadza stalówkę w wolnym wierszu pod datą i zapisuje „do jutra”. Kamera obejmuje kartkę i oczy Marty. W detalu, jak w przykładzie Video Shotcraft, zachowujemy jeden czytelny punkt uwagi. [Jump Cut Punch In](https://github.com/Vincentwei1021/video-shotcraft/blob/59f3e9b9e936ff2bce0e18446226d770a3f2f61f/demos/rhythm/rhythm-interrupt-moves/JumpCutPunchIn.tsx) |
| 24–33 | Stalówka odchodzi od ostatniej litery. Marta patrzy jeszcze na gotowy zapis i raz kiwa głową. Paweł podsuwa otwartą teczkę lewą ręką, prawą obejmuje wolną krawędź arkusza. Pracownica puszcza dopiero, kiedy jego kciuk jest już na papierze. Kolejność kontaktu i ruchu przedmiotu bierzemy z sięgnięcia Mei po filiżankę. [Stickman, gest Mei](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/examples/b5-mei-event-relay/stage.cjs#L26) |
| 34–51 | Odsunięcie kamery odsłania oba przedramiona Pawła. Prawa dłoń prowadzi druk pod okładkę, lewa podpiera grzbiet. Widać kolejno znikanie dopisku i ostatniego narożnika papieru. Paweł zamyka okładkę. Zdjęcie dłoni Oli wraca na wierzch. |
| 52–59 | Prawa dłoń przejmuje ciężar za górny prawy brzeg. Lewa odchodzi. Zdjęcie, grzbiet i mankiet schodzą razem. W połowie tego gestu podłoże zmieni się na siedzisko kanapy. Przez cięcie utrzymujemy tor przedmiotu widoczny w przykładzie ciągłej akcji. [Bang Motion, continuous action](https://github.com/bangtutorial/bang-motion/blob/c1aa65e921c970d858705fcb4a53a8294d1a4131/docs/gallery/05-continuous-action.jpg) · [Klatka referencyjna](../../../v2/przyklady/ciagly-ruch.jpg) |

[Specyfikacja i punkty kontrolne](SPEC.md) · [Kanapa po cięciu](../../../referencje/kanapa-przed-fala-v1.png)

## Realizacja v3 (autor b13)

Rewizja modeli r1, skala 1,28. 0–23 pisanie „do jutra” (stalówka dotyka w 2, przerwa między słowami 11–13), 24–33 Marta kiwa (24–28 w dół, 29–33 w górę), prawa dłoń Pawła łapie lewy brzeg w 29, kciuk pracownicy puszcza w 32. 34–48 odjazd kamery do świata 1:1. 33–45 druk na tylny panel teczki, 40–51 lewa dłoń zamyka okładkę (120°→0°). 52–59 lewa dłoń trzyma prawy brzeg zamkniętej teczki i prowadzi ją w dół-lewo; ten sam tor trwa w 15.

Źródła: plansze [kolejka](../../../referencje/kolejka-zus-v1.png) i [kanapa](../../../referencje/kanapa-przed-fala-v1.png), modele r1 (`k.rewizja === "r1"`, [POSTACIE.md](../../POSTACIE.md)), daty z `app/src/features/chat/case-data.ts` („11 stycznia – 7 lutego 2027” → odręcznie 11.01.2027). Usta z obwiedni `media/dialog.flac`, stuki z `media/efekty.flac`. Render: `build.mjs --only 13..18 --out robocze/b13`, `klatki.mjs`, `render.mjs`. Przykład animatora: [ZRODLA.md](../../../v2/przyklady/ZRODLA.md) — Stickman `approved-2026-10-23-motion-sheet.png` (kolejność: podparcie → żebra → głowa → dłoń), Bang Motion `05-continuous-action.jpg` (ruch przez cięcie), Video Shotcraft `card-stack.jpg` (przesunięte krawędzie kart).
