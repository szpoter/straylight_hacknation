# 14 · Dopisek przy dacie i cięcie na teczce

Autor planu: s14

26–28 s, klatki filmu 780–839. Lokalnie 0–59 przy 30 kl./s, obraz 1280 × 720. Strony ciała są anatomiczne. Współrzędne kartki dotyczą planu stanowiska przed powiększeniem kamery. Współrzędne cięcia dotyczą gotowego obrazu.

| Klatki | Poza, rekwizyt i dźwięk |
| --- | --- |
| 0–23 | W 14/0 zachowujemy zbliżenie z 13/59. Formularz „ZASIŁEK” opiera się o blat, środek (816,463), kąt −10°, skrót pionowy 0,78. Lewy kciuk pracownicy trzyma prawą krawędź na 45% jej wysokości. Prawa dłoń ma stalówkę 3 mm nad początkiem wiersza. Marta patrzy na „11.01.2027”, Paweł podpiera otwartą teczkę. W kl. 2 stalówka dotyka wiersza przy lokalnym (−56,74). Do 23 powstaje „do jutra”. Przy przeniesieniu ręki ze słowa na słowo zostaje odstęp. |
| 24–33 | W 24 pracownica unosi prawą dłoń z długopisem i odsłania oba słowa. Marta schyla podbródek w 24–28 i prostuje głowę w 29–33. W 29 prawy kciuk Pawła dociska wolny lewy brzeg druku, jego palce podpierają odwrotną stronę. W 29–31 oba chwyty są równoczesne. Lewy kciuk pracownicy puszcza w 32. Na ustach pracownicy trwa kwestia „Przy tej dacie macie czas do jutra”. |
| 34–51 | Paweł prowadzi kartkę pod okładkę. Lewą dłonią podpiera grzbiet, prawą dosuwa wystający narożnik do środka. Kadr stopniowo odsłania chwyt i pozostaje nieruchomy od 48. W 51 okładka jest domknięta, zdjęcie i jego folia leżą płasko. |
| 52–59 | Paweł obejmuje prawą dłonią górny prawy brzeg zamkniętej teczki. Lewa dłoń zwalnia oparcie. Teczka opada przed tułowiem. Cięcie przypada pomiędzy 14/59 a 15/0 podczas ruchu. Pierwszy stuk należy do kontaktu z kanapą w 15/6, czyli 28,20 s. |

**Styk 14/15.** Szerokość teczki 190 px, obrót −8°, otwarcie 0, przesunięcie (+1,+6) px na klatkę. Tabela podaje planowane punkty po zaokrągleniu do piksela. Prawy górny narożnik mierzymy u dołu ukośnego zagięcia. Lewy górny róg obwódki zdjęcia jest w punkcie środek+(−85,−35). Prawy nadgarstek Pawła pozostaje względem niego w punkcie (+146,−28), dłoń pod kątem 125°. Lewa dłoń jest wolna. [Kontur okładki](../../../v2/rysunek.mjs) · [Ruch przez cięcie według Bang Motion](https://github.com/bangtutorial/bang-motion/blob/c1aa65e921c970d858705fcb4a53a8294d1a4131/docs/gallery/05-continuous-action.jpg)

| Klatka | Środek | Górny lewy | Górny prawy | Dolny prawy | Dolny lewy |
| --- | --- | --- | --- | --- | --- |
| 14/57 | (605,416) | (502,328) | (686,318) | (709,509) | (530,534) |
| 14/58 | (606,422) | (503,334) | (687,324) | (710,515) | (531,540) |
| 14/59 | (607,428) | (504,340) | (688,330) | (711,521) | (532,546) |
| 15/0 | (608,434) | (505,346) | (689,336) | (712,527) | (533,552) |

**Test odbioru.** Porównać 13/59 z 14/0 nałożonymi przy dacie i kciuku. Odtworzyć 14 bez dźwięku i po śladzie stalówki wskazać każde słowo. W 24 przeczytać datę i dopisek przy szerokości odtwarzacza 360 px. Wskazać jeden ukłon głowy, oba chwyty w 30 i moment zniknięcia ostatniego wystającego narożnika przed zamknięciem. Nałożyć 14/59 na 15/0 po przesunięciu o (+1,+6) px. Cztery narożniki, zdjęcie i prawy nadgarstek powinny pokryć się z dokładnością do 1 px. Z głosem sprawdzić zgodność ruchu ust i kontaktu teczki ze stukiem w domu. [Przekazanie z 13](../13/SPEC.md) · [Odbiór w 15](../15/SPEC.md) · [Nagranie dialogu](../../../v2/media/dialog.flac) · [Wzorzec kolejności chwytów](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/examples/b5-mei-event-relay/stage.cjs#L26)

## Realizacja v3 (autor b13)

Rewizja modeli r1, skala 1,28. 0–23 pisanie „do jutra” (stalówka dotyka w 2, przerwa między słowami 11–13), 24–33 Marta kiwa (24–28 w dół, 29–33 w górę), prawa dłoń Pawła łapie lewy brzeg w 29, kciuk pracownicy puszcza w 32. 34–48 odjazd kamery do świata 1:1. 33–45 druk na tylny panel teczki, 40–51 lewa dłoń zamyka okładkę (120°→0°). 52–59 lewa dłoń trzyma prawy brzeg zamkniętej teczki i prowadzi ją w dół-lewo; ten sam tor trwa w 15.

Źródła: plansze [kolejka](../../../referencje/kolejka-zus-v1.png) i [kanapa](../../../referencje/kanapa-przed-fala-v1.png), modele r1 (`k.rewizja === "r1"`, [POSTACIE.md](../../POSTACIE.md)), daty z `app/src/features/chat/case-data.ts` („11 stycznia – 7 lutego 2027” → odręcznie 11.01.2027). Usta z obwiedni `media/dialog.flac`, stuki z `media/efekty.flac`. Render: `build.mjs --only 13..18 --out robocze/b13`, `klatki.mjs`, `render.mjs`. Przykład animatora: [ZRODLA.md](../../../v2/przyklady/ZRODLA.md) — Stickman `approved-2026-10-23-motion-sheet.png` (kolejność: podparcie → żebra → głowa → dłoń), Bang Motion `05-continuous-action.jpg` (ruch przez cięcie), Video Shotcraft `card-stack.jpg` (przesunięte krawędzie kart).

## Odbiór

Sprawdzone klatki: 0, 2, 10, 20, 23, 29–33, 38, 44, 48, 51, 54, 57–59. Stalówka dotyka w 2, „do” 2–11, przerwa 11–13, „jutra” 13–23 (odsłanianie zsynchronizowane ze stalówką). Ukłon Marty 24–33. Kciuk Pawła na lewym brzegu od 26, oba chwyty 29–31, pracownica puszcza 32. Odjazd kamery 34–48 (zoom 1,4 → 1). Okładka 40–51 (108° → 0°) zakrywa druk. Lewa dłoń Pawła kończy zamykanie na prawym brzegu i niesie teczkę.

**Styk 14/15 (zmierzony, ten sam tor `folderDrop` w obu ujęciach, teczka 150 px, okładka zamknięta).**

| Klatka | Środek teczki | Kąt | Punkt chwytu lewej dłoni |
| --- | --- | --- | --- |
| 14/57 | (691,7; 384,1) | −5,41° | (756,1; 331,8) |
| 14/58 | (686,4; 389,6) | −5,80° | (750,4; 336,9) |
| 14/59 | (681,4; 395,7) | −6,20° | (745,2; 341,9) |
| 15/0 | (676,7; 402,3) | −6,59° | (740,0; 348,6) |
| 15/1 | (672,4; 409,3) | −6,96° | (735,4; 355,3) |
| 15/2 | (668,6; 416,7) | −7,30° | (731,2; 362,3) |

Ruch ≈ (−5,+6) px/kl., przyspiesza do kontaktu. Łokieć Pawła po obu stronach cięcia na zewnątrz (14/59 (632,331), 15/0 (631,318)), bark (713,276) → (716,270). Fotografia obraca się z okładką. Liczby z tabeli s14/s15 (v2, szerokość 190, prędkość (+1,+6)) zastępuje ten zapis.

Render: `ujecie-720p.mp4`, `klatki.jpg` (kl. 0/20/40/59), `pozy.jpg` (v2 u góry, v3 u dołu). Czytelność 360 px: `../../robocze/b13/w360.png`.
