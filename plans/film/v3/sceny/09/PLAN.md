# 09 · Paweł przytrzymuje wózek

Autor planu: s09

**16–18 s.** Paweł chciałby pokazać Marcie, co przeczytał, ale obie dłonie ma zajęte. Kiedy kolejka rusza, robi miejsce starszej klientce z torbą i zatrzymuje wózek biodrem. Kamera pozostaje po stronie alejki. W jednym planie widać podeszwy obojga rodziców, koła i przejście do okienka po prawej. [Plansza kolejki](../../../referencje/kolejka-zus-v1.png)

| Klatki | Co prowadzi uwagę |
| --- | --- |
| 0–7 | Ciąć z wymiany spojrzeń w 08 na całą rodzinę. Paweł zaczyna „Nie wiem” w tej samej pozie. Przy okienku klientka z bobem postępuje o krok, starsza pani za ramieniem Pawła rusza za nią. |
| 8–23 | Marta robi krok za rączką. Koła ruszają po posadzce. Paweł zerka na wychodzącą zza niego torbę, obciąża but po prawej stronie ekranu i przestawia drugi w stronę wózka. Między biodrem a gondolą zostaje jeszcze prześwit. |
| 24–34 | Paweł stawia lewy ekranowy but i przesuwa nad niego miednicę. Bok koszuli na wysokości biodra spotyka sztywny bok gondoli. Marta wyczuwa opór i zgina łokieć. Widać biodro poniżej teczki, a po prawej otwiera się droga dla klientki. |
| 35–59 | Klientka mija Pawła, torba kończy wahnięcie za jej krokiem. Marta wciąż trzyma rączkę. Paweł patrzy na odwrotkę „URLOP” i rozprostowuje wskazujący palec przy jej krawędzi. Na tym dotyku przechodzimy do detalu w 10. |

W pozie nacisku zastosować rozstaw stóp i przesunięcie miednicy widoczne u postaci podpierającej stos w środkowym rzędzie arkusza Stickman. Z przykładu Video Shotcraft wziąć zmianę skali w jednej klatce. Dla cięcia 09/10 punktem odniesienia jest opuszka Pawła na wydruku. [Arkusz faz Stickman](../../../v2/przyklady/fazy-ruchu.png) · [Oryginał arkusza](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b1/approved-2026-10-23-motion-sheet.png) · [Video Shotcraft, JumpCutPunchIn](https://github.com/Vincentwei1021/video-shotcraft/blob/59f3e9b9e936ff2bce0e18446226d770a3f2f61f/demos/rhythm/rhythm-interrupt-moves/JumpCutPunchIn.tsx)

Użyć zatwierdzonego widoku ¾ rodziców i profilu starszej klientki. Przy ugięciu kolana brzeg jasnej spódnicy Marty zachowuje jeden obrys. Lokalne punkty na pięcie, biodrze, mankiecie i uchwycie prowadzić razem z właściwą częścią modelu, jak w pakiecie widoków Stickman. [Wspólna obsada](../../POSTACIE.md) · [Pakiet widoków postaci](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b6/characters/kiosk_keeper/package.json) · [Specyfikacja ujęcia](SPEC.md)


## Realizacja v3 (autor b07)

Modele r1 (`k.rewizja === "r1"`), wspólny świat bloku w [`../07/kolejka.mjs`](../07/kolejka.mjs): plan ogólny 1280×720, postaci s = 1, podłoga y 590, lada od x 960 (blat y 352), pracownica siedzi (1131,420) s 0,9, wózek s 0,95 (oś y 558). Każde ujęcie patrzy na ten świat kamerą `cam(z,cx,cy)`; kreski cienione z^−0,6. Teczka i druki jak w 03–06 (b01): teczka zamknięta, pionowo przy piersi, w ekranowo prawej dłoni Pawła; ekranowo lewa dłoń pracuje. Zdjęcie na okładce = `photo02(k)` (decyzja koordynatora). Render: `node build.mjs --only 06,…,13 --out robocze/b07`, `klatki.mjs`, `render.mjs 720 NN NN`. Przykład animatora ([ZRODLA.md](../../../v2/przyklady/ZRODLA.md)): Stickman `approved-2026-10-23-motion-sheet.png` (zmiana podpory przed naciskiem) i Video Shotcraft `JumpCutPunchIn.tsx` (cięcie na opuszkę).

Szczegóły klatek i styków: [SPEC](SPEC.md#realizacja-v3-autor-b07).
