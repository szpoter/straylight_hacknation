# 06 · Chyba tak

Autor planu: s06

**10–12 s.** Paweł chce upewnić się, że zabrał właściwy formularz. Wchodzimy odrobinę wyżej niż w 05, z tej samej strony barku Marty. W jednym nieruchomym kadrze mieszczą się oba mankiety, wolny brzeg kartki i oczy Pawła w widoku trzy czwarte. Podczas odpowiedzi górna krawędź papieru wypada poniżej ust.

| Klatki | Co widzi widz |
| --- | --- |
| 0–6 | „URLOP” wciąż jest zwrócony do Marty i do kamery. Prawy kciuk Pawła zsuwa się z narożnika na boczną krawędź. Wskazujący podtrzymuje arkusz od tyłu. Lewa ręka przyciska otwartą teczkę do brzucha. |
| 7–19 | Paweł obraca przedramię. Kciuk i wskazujący zabierają ze sobą boczną krawędź druku. Wolny róg zostaje chwilę z tyłu, po czym przechodzi łukiem przed koszulą. W połowie obrotu widać tylko cienki profil papieru. Po drugiej stronie palców rozwija się odwrotna strona z kratkami. |
| 20–26 | Papier przestaje drgać. Oczy Pawła zatrzymują się na jednej kratce, broda lekko opada. Marta czeka na odpowiedź. Oboje mają zamknięte usta. |
| 27–59 | Na „Chyba” Paweł jeszcze patrzy w kratki. Przy „tak” zaczyna opuszczać druk do teczki. Pozostawia go uchwyconego za tę samą krawędź. Pod koniec Marta zaczyna kolejne pytanie i kieruje twarz ku budce wózka, przejmując uwagę na cięciu do 07. |

Z dolnego rzędu arkusza Stickman bierzemy sposób prowadzenia gestu od barku przez łokieć po miejsce kontaktu. W przykładzie Video Shotcraft każda karta zachowuje własny brzeg na tle sąsiedniej. U nas „ZASIŁEK” wystaje z teczki przez cały obrót „URLOPU”. [Rozkład faz](../../../v2/przyklady/fazy-ruchu.png) · [Warstwy kart](../../../v2/przyklady/stos-kart.jpg)

[Plansza firmowa](../../../referencje/kolejka-zus-v1.png) · [Wspólna obsada](../../POSTACIE.md)

[Stickman · pozy w ruchu](../../../v2/przyklady/fazy-ruchu.png) · [Oryginał](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b1/approved-2026-10-23-motion-sheet.png) · [Video Shotcraft · głębia stosu](../../../v2/przyklady/stos-kart.jpg) · [Oryginał](https://github.com/Vincentwei1021/video-shotcraft/blob/59f3e9b9e936ff2bce0e18446226d770a3f2f61f/gallery/media/poster/card-stack.jpg)

[Specyfikacja tego ujęcia](SPEC.md)

## Realizacja v3 (autor b01)

Ta sama strona barku Marty, kamera wyżej: ×2,0 wokół (798,232). 0–6 kciuk zsuwa się z rogu na lewą krawędź (niżej o ≈ ⅓ wysokości). 7–19 obrót 0→180° wokół trzymanej pionowej krawędzi: szerokość ×|cos|, w kl. 13 cienki przekrój (pasek), od 14 rewers z kratkami (lokalny rysunek rewersu, `k.paper` nie ma tylnej strony); od 40° obrotu arkusz i dłoń są przed teczką; dłoń przechodzi na `leftFlip` po 90°. 20–26 oczy na kratce, broda opada. Usta Pawła z amplitudy `media/dialog.flac` dla kl. filmu 327–342 (lokalnie 27–42; ścieżka Pawła w `mowa.json` jest nieaktualna). Od „tak” (36) arkusz schodzi nad lewą krawędź teczki (+40/+40 j.), nadal trzymany za tę samą krawędź. 52–59 Marta odwraca twarz ku wózkowi, usta z `mowa.json` od 354.

Przykład animatora: [Stickman · approved-2026-10-23-motion-sheet.png](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b1/approved-2026-10-23-motion-sheet.png) (lokalnie `../../../v2/przyklady/fazy-ruchu.png`) — gest od barku przez łokieć do miejsca kontaktu; [Video Shotcraft · card-stack.jpg](https://github.com/Vincentwei1021/video-shotcraft/blob/59f3e9b9e936ff2bce0e18446226d770a3f2f61f/gallery/media/poster/card-stack.jpg) (lokalnie `../../../v2/przyklady/stos-kart.jpg`) — ZASIŁEK zachowuje swój brzeg w teczce przez cały obrót. Render: `node build.mjs --only 01,02,03,04,05,06 --out robocze/b01`, klatki `klatki.mjs`, ujęcie `render.mjs 720 NN NN`. Modele **r1** (`k.rewizja`), bez zmian w `obsada/`.
