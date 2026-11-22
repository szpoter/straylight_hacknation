# 10 · Trzy podkreślenia

Autor planu: s10

18–20 s. Paweł próbuje pokazać Marcie, co zaznaczył podczas lektury. Nieruchome zbliżenie obejmuje piaskową okładkę ze zdjęciem, rękę podtrzymującą jej róg oraz drugą dłoń z granatowym mankietem. W kadrze zostaje tyle przedramienia, żeby widz mógł prześledzić ruch od nadgarstka do opuszki. Wykorzystać wspólny model Pawła i jego widok dłoni w skrócie. [Plansza kolejki](../../../referencje/kolejka-zus-v1.png) · [Obsada](../../POSTACIE.md)

1. **0–16.** Ciąć po spojrzeniu Pawła na palec spoczywający na odwrocie „URLOPU”. Opuszka naciska papier i popycha go w prawo, nieco w górę. Nad brzegiem teczki odsłania się „Okres”. Przy zmianie skali prowadzić wzrok tym samym przedmiotem jak w przykładzie Shotcraft. [JumpCutPunchIn](https://github.com/Vincentwei1021/video-shotcraft/blob/59f3e9b9e936ff2bce0e18446226d770a3f2f61f/demos/rhythm/rhythm-interrupt-moves/JumpCutPunchIn.tsx)
2. **17–37.** Paweł odrywa opuszkę, zgina wskazujący palec i przekłada go nad stos na „ZASIŁEK”. Przy ponownym nacisku mankiet ustępuje przy nadgarstku. Palec pociąga arkusz ukośnie w lewo i odsłania „Podstawę”. Druga ręka utrzymuje teczkę przy piersi. Rozdzielenie podpory i ręki pracującej odpowiada środkowemu rzędowi planszy Stickman. [Lokalne fazy ruchu](../../../v2/przyklady/fazy-ruchu.png) · [Arkusz źródłowy](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b1/approved-2026-10-23-motion-sheet.png)
3. **38–53.** Między drukami wystaje potwierdzenie. Palec siada na tym odsłoniętym fragmencie i wysuwa go ku górze. Czytamy „Data wpływu”. Podobnie jak na przykładzie wachlarza, każdy tekst ma własny widoczny brzeg papieru. [Układ kart](../../../v2/przyklady/stos-kart.jpg) · [Źródło Shotcraft](https://github.com/Vincentwei1021/video-shotcraft/blob/59f3e9b9e936ff2bce0e18446226d770a3f2f61f/gallery/media/poster/card-stack.jpg)
4. **54–59.** Paweł przez chwilę trzyma potwierdzenie i patrzy na wynik swoich poszukiwań. W tym czasie dolny lewy narożnik „ZASIŁKU” ześlizguje się z niskiej krawędzi w stronę Marty. Ciąć podczas osuwania. [Przekazanie do 11](../11/SPEC.md) · [Kwestia Pawła](../../../../../PLAN-FILMU-DEMO.md) · [Pozy i próba czytelności](SPEC.md)


## Realizacja v3 (autor b07)

Modele r1 (`k.rewizja === "r1"`), wspólny świat bloku w [`../07/kolejka.mjs`](../07/kolejka.mjs): plan ogólny 1280×720, postaci s = 1, podłoga y 590, lada od x 960 (blat y 352), pracownica siedzi (1131,420) s 0,9, wózek s 0,95 (oś y 558). Każde ujęcie patrzy na ten świat kamerą `cam(z,cx,cy)`; kreski cienione z^−0,6. Teczka i druki jak w 03–06 (b01): teczka zamknięta, pionowo przy piersi, w ekranowo prawej dłoni Pawła; ekranowo lewa dłoń pracuje. Zdjęcie na okładce = `photo02(k)` (decyzja koordynatora). Render: `node build.mjs --only 06,…,13 --out robocze/b07`, `klatki.mjs`, `render.mjs 720 NN NN`. Przykład animatora ([ZRODLA.md](../../../v2/przyklady/ZRODLA.md)): Video Shotcraft `card-stack.jpg` (każdy druk z własnym brzegiem) i Stickman motion sheet (podpora vs ręka pracująca).

Szczegóły klatek i styków: [SPEC](SPEC.md#realizacja-v3-autor-b07).
