# 12 · Specyfikacja ujęcia „Przy okienku”

Autor planu: s12

22–24 s, klatki filmu 660–719, lokalnie 0–59 przy 30 kl./s. Podgląd 1280 × 720. Strony ciała oznaczają anatomiczne dłonie postaci. Krawędzie arkusza nazywamy, patrząc na wyprostowaną zadrukowaną stronę.

| Klatki | Pozycja i kontakt |
| --- | --- |
| 0–12 | Wejście kontynuuje ruch w prawo z 11/59. W poprzedniej skali środek kartki jest w (822,363), górna krawędź ma +6°. Po cięciu prawa dłoń Pawła nadal trzyma górny brzeg w ⅓ szerokości od lewego narożnika. W 12/12 lewy kciuk pracownicy dotyka prawej krawędzi na 45% wysokości od góry. |
| 13–22 | Klatki 13–17 pokazują oba chwyty. W 18 kciuk Pawła odchodzi pierwszy, do 22 między jego palcami a papierem widać prześwit. Kciuk pracownicy i dwa palce z tyłu pozostają w tym samym miejscu względem prawej krawędzi. |
| 23–36 | Pracownica podciąga druk bliżej piersi. W 23 oczy trafiają na nagłówek, do 28 lekko skłania się głowa. W 29–36 górny brzeg zatrzymuje się pod kątem około +20°. Rytm ust pochodzi z nagrania pracownicy, rodzice słuchają. |
| 37–59 | Nadgarstek prowadzi górny brzeg od +20° do −10°. Kartka przechyla się ku Marcie i opiera dolnym brzegiem o blat w 53. Na 54–59 środek arkusza jest w (816,463). Marta patrzy na tytuł, pracownica na Martę. Lewy kciuk pracownicy zostaje na 45% wysokości prawej krawędzi. |

**Styk z 13.** Bliższa kamera przejmuje ten sam blat i druk. Nagłówek jest w górnej części kartki, a odręczna data „11.01.2027” w dolnej połowie. To początek okresu z profilu rodziców. Lewa dłoń pracownicy stabilizuje prawy brzeg, jej wolny prawy palec wskazujący zaczyna ruch przy nagłówku. Paweł ma otwartą teczkę. [Daty w sprawie rodziny](../../../../../app/src/features/chat/case-data.ts) · [Ujęcie 13](../13/SPEC.md)

**Test odbioru.** Odtworzyć w 1× z wyciszeniem od ostatnich czterech klatek 11 do pierwszych czterech 13. Na stopklatkach 11, 15 i 22 wskazać kolejno podającego, oba chwyty oraz samą dłoń odbierającą. W 15 sprawdzić ciągłość rękawa, mankietu i nadgarstka każdej osoby. W 32 i 56 porównać orientację tego samego nadruku i kierunek spojrzenia pracownicy. Na szerokości 360 px odczytać „ZASIŁEK” oraz odróżnić wysoki szary kok pracownicy od niskiego ciemnego koka Marty. Na 12/59 i 13/0 porównać punkt pod kciukiem po wyrównaniu skali arkusza. Przy powtórce z głosem sprawdzić pracę ust podczas „To jest wniosek o zasiłek”. [Polska ścieżka dialogowa](../../../v2/media/dialog.flac) · [Plan](PLAN.md) · [Wyjście z 11](../11/SPEC.md)


## Realizacja v3 (autor b07)

Modele r1 (`k.rewizja === "r1"`), wspólny świat bloku w [`../07/kolejka.mjs`](../07/kolejka.mjs): plan ogólny 1280×720, postaci s = 1, podłoga y 590, lada od x 960 (blat y 352), pracownica siedzi (1131,420) s 0,9, wózek s 0,95 (oś y 558). Każde ujęcie patrzy na ten świat kamerą `cam(z,cx,cy)`; kreski cienione z^−0,6. Teczka i druki jak w 03–06 (b01): teczka zamknięta, pionowo przy piersi, w ekranowo prawej dłoni Pawła; ekranowo lewa dłoń pracuje. Zdjęcie na okładce = `photo02(k)` (decyzja koordynatora). Render: `node build.mjs --only 06,…,13 --out robocze/b07`, `klatki.mjs`, `render.mjs 720 NN NN`. Przykład animatora ([ZRODLA.md](../../../v2/przyklady/ZRODLA.md)): Stickman B6 `package.json` (osadzenie głowy i mankietu pracownicy) i `character-acting-reference.png` (oczy przed karkiem).

Kamera z 1,8 wokół (885,254) — nowy kąt z końca lady; rodzice podsunięci (Marta biodra 640, Paweł 850; w 11/59: 358 i 745), kierunek ruchu kartki zachowany (w prawo). Statyści odeszli.

| Klatki | Realizacja |
| --- | --- |
| 0–12 | Paweł (lewa dłoń, punkt (−10,7;−42)) prowadzi kartkę (872,332,+6°)→(936,322,+2°). Pracownica: ekranowo lewa ręka (`left`) otwarta. **Kontakt 12**: kciuk na prawej krawędzi w 45% wysokości = punkt lokalny (32;−4,2). |
| 13–17 | Oba chwyty. |
| 18–22 | Paweł puszcza (18), prześwit do 22, dłoń wraca nad teczkę. |
| 23–36 | Pracownica podciąga do (992,300), +20°; oczy na nagłówek 23, skłon 23–28; usta z obwiedni 660–719. |
| 37–59 | Obrót +20→−10°, dolna krawędź na blacie (y 352) w 53; 54–59 środek na ekranie (816,463), −10°; pracownica patrzy na Martę, Marta na tytuł. |

Uwaga nazw: SPEC 12/13 mówi „lewa dłoń pracownicy”; w r1 (postać od przodu) jest to ręka ekranowo lewa (`left`), anatomicznie prawa.

## Odbiór

Sprawdzone 0, 11 (przed kontaktem), 12 (kontakt), 15 (oba chwyty), 22 (prześwit), 32, 53, 59 i 659/660, 719/720. Trzy twarze rozróżnialne; wysoki szary kok vs niski ciemny kok Marty czytelne w 360 px; „ZASIŁEK” czytelny. Otwarte (styk z b13): w 13/0 teczka Pawła jest otwarta z URLOP-em, a rodzice stoją w innym układzie świata b13; u mnie teczka zamknięta — do uzgodnienia przez koordynatora (otwarcie okładki w 12/24–40 możliwe).
