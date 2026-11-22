# 08 · Końcówka pytania Marty

Autor planu: s08

**14–16 s.** Na końcu pytania o zasiłek Marta szuka odpowiedzi na twarzy Pawła. Zostajemy po tej samej stronie wózka. Marta stoi z lewej, śpiąca Ola między rodzicami, Paweł z prawej. Na planszy Stickman postać przy monitorze czyta z pochyloną głową, a postać z pudłami utrzymuje ciężar przedramionami. Te dwie obserwacje łączymy w pozie czytającego Pawła. [Gra postaci](../../../v2/przyklady/pozy-postaci.png)

1. **0–9.** Przejmujemy profil Marty znad daszka z 07. Podczas końcówki pytania jej źrenica rusza od policzka Oli w górę i w prawo. Broda jeszcze wskazuje dziecko. Palce prawej dłoni pozostają zaciśnięte na rączce.
2. **10–25.** Marta podnosi brodę do linii oczu Pawła. Za głową idzie bark, łokieć prostuje się tylko tyle, ile pozwala chwyt. Lekko poszerzamy kadr, by widzieć obie twarze i otwartą teczkę. Paweł wciąż patrzy na kratki odwróconego „URLOPU”.
3. **26–43.** Paweł przenosi wzrok w lewo ku Marcie, po chwili podnosi brodę. Skręt prowadzi przez wspólne rysunki jego głowy osadzone na tej samej szyi. W trzech czwartych grzywka przesuwa się z czołem, a nos przesłania część dalszego policzka. Teczka nadal opiera się o lewe przedramię.
4. **44–59.** Rodzice przez chwilę patrzą sobie w oczy. Marta czeka z zamkniętymi ustami. Paweł zaczyna „Nie wiem” tuż przed cięciem do szerszego planu 09. Wózek pozostaje u ich boku, a kolejka ruszy w następnym ujęciu.

[Plansza firmowa](../../../referencje/kolejka-zus-v1.png) · [Wspólna obsada](../../POSTACIE.md)

[Stickman · punkty jednej postaci w trzech widokach](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b6/characters/kiosk_keeper/package.json) · [Stickman · gra postaci](../../../v2/przyklady/pozy-postaci.png) · [Oryginał](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b1/character-acting-reference.png)

[Specyfikacja tego ujęcia](SPEC.md)


## Realizacja v3 (autor b07)

Modele r1 (`k.rewizja === "r1"`), wspólny świat bloku w [`../07/kolejka.mjs`](../07/kolejka.mjs): plan ogólny 1280×720, postaci s = 1, podłoga y 590, lada od x 960 (blat y 352), pracownica siedzi (1131,420) s 0,9, wózek s 0,95 (oś y 558). Każde ujęcie patrzy na ten świat kamerą `cam(z,cx,cy)`; kreski cienione z^−0,6. Teczka i druki jak w 03–06 (b01): teczka zamknięta, pionowo przy piersi, w ekranowo prawej dłoni Pawła; ekranowo lewa dłoń pracuje. Zdjęcie na okładce = `photo02(k)` (decyzja koordynatora). Render: `node build.mjs --only 06,…,13 --out robocze/b07`, `klatki.mjs`, `render.mjs 720 NN NN`. Przykład animatora ([ZRODLA.md](../../../v2/przyklady/ZRODLA.md)): Stickman `character-acting-reference.png` (czytanie z pochyloną głową, ciężar na przedramionach) i B6 `package.json` (ta sama głowa w obrocie).

Szczegóły klatek i styków: [SPEC](SPEC.md#realizacja-v3-autor-b07).
