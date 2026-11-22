# 07 · Specyfikacja ujęcia „Marta pochyla się do Oli”

12–14 s, klatki filmu 360–419. Lokalnie 0–59 przy 30 kl./s. Podgląd 1280 × 720.

## Ustawienie i styki

W pierwszej klatce Marta stoi po lewej, pochylona tak jak przy końcu 06. Paweł trzyma otwartą teczkę i nadal ogląda odwrotną stronę druku. Ustaw wspólny profil Marty tak, aby między jej nosem a brzegiem budki pozostał prześwit przez cały skłon. Niski kok, odsłonięte ucho i kosmyk przy policzku mają zachować wzajemne położenie, kiedy broda schodzi w dół. Kształt oka i usta do istniejącej kwestii pochodzą ze wspólnego modelu. [Karta obsady](../../POSTACIE.md) · [Wyjście 06](../06/SPEC.md)

W klatce 0 zaznacz na rączce miejsce styku nasady kciuka. Część dłoni jest za rurką, kciuk zachodzi na jej bliższą krawędź. Od klatki 10 kolana lekko ustępują, ciężar przechodzi na przodostopie, pięty pozostają na podłodze. Bark przesuwa się nad rączkę i skraca się odległość bark–uchwyt. Łokieć przejmuje tę różnicę, a mankiet obraca się razem z przedramieniem. Kółka stoją w miejscu. Oddech Oli w klatkach 27–59 unosi i opuszcza barki pod materiałem. Zielony pas zmienia krzywiznę razem z kocykiem.

W **07/59 → 08/0** zachowaj ten sam kadr, położenie oczu Marty skierowanych na policzek Oli, kąt głowy i tułowia, układ palców na uchwycie oraz kocyk po wydechu. Paweł wciąż patrzy w druk. Przepisz pozę i stan rekwizytów na wejście 08. Dopiero na drugim „oboje” Marta podniesie spojrzenie na Pawła. Usta kontynuują kolejną próbkę tego samego nagrania. [Wejście 08](../08/SPEC.md) · [Dialog](../../../v2/media/dialog.flac)

## Próba odbioru obrazu

- Odtwórz 06/55–08/9 bez dźwięku, najpierw w 720p, potem przy szerokości 360 px. Widz powinien wskazać, z czego Marta przenosi wzrok, do kogo się pochyla i co pod jej brodą porusza się z oddechem.
- Zatrzymaj 07/0, 07/26 i 07/43. Wyrównaj głowy względem ucha, obróć do wspólnej osi i nałóż profil z karty obsady. Sprawdź linię powieki, czubek nosa, żuchwę i osadzenie koka. Na drugim zestawieniu wyrównaj klatki do rurki. Nasada kciuka ma trafiać w zaznaczone miejsce zarówno w najwyższym, jak i najniższym położeniu barku.
- Przełączaj na przemian 07/59 i 08/0. Sprawdź krawędź druku, dłoń Marty, linię powiek i pas kocyka. Potem odsłuchaj pytanie przez granicę ujęć i sprawdź ciągłość ust na słowach nagrania.

[Plan i przykłady](PLAN.md)


## Realizacja v3 (autor b07)

Modele r1 (`k.rewizja === "r1"`), wspólny świat bloku w [`../07/kolejka.mjs`](../07/kolejka.mjs): plan ogólny 1280×720, postaci s = 1, podłoga y 590, lada od x 960 (blat y 352), pracownica siedzi (1131,420) s 0,9, wózek s 0,95 (oś y 558). Każde ujęcie patrzy na ten świat kamerą `cam(z,cx,cy)`; kreski cienione z^−0,6. Teczka i druki jak w 03–06 (b01): teczka zamknięta, pionowo przy piersi, w ekranowo prawej dłoni Pawła; ekranowo lewa dłoń pracuje. Zdjęcie na okładce = `photo02(k)` (decyzja koordynatora). Render: `node build.mjs --only 06,…,13 --out robocze/b07`, `klatki.mjs`, `render.mjs 720 NN NN`. Przykład animatora ([ZRODLA.md](../../../v2/przyklady/ZRODLA.md)): Stickman B6 `kiosk_keeper/package.json` (jedna oś szyi dla trzech widoków → `head` 0,7→1 na tej samej głowie r1) i `character-acting-reference.png` (łokieć przejmuje skrócenie bark–uchwyt).

| Klatki | Realizacja |
| --- | --- |
| 0–9 | Kamera z 1,9 wokół (400,270). Marta biodra (222,402), głowa ¾ (head 0,7), oczy schodzą z druku pod budkę (gazeDown −0,1→0,8). Prawa dłoń `hold` na rączce w (318,9; 373,7). |
| 10–26 | Głowa r1 obraca się do profilu (head 1, nod 0,72), skłon bow 0,16→0,42, lean 6→17°, kolana 96→92. Chwyt na rączce rozwiązywany co klatkę (ten sam punkt). |
| 27–43 | Wdech Oli (cykl 34 kl., globalnie 387→404), pas kocyka w górę. |
| 44–59 | Wydech; usta Marty z obwiedni `mowa.json` 360–419. Paweł czyta rewers URLOP-u. |

Styk 06/59→07/0: inny kadr; zgodny chwyt i strona kartki — URLOP rewersem do kamery, trzymany ekranowo lewą dłonią za krawędź obrotu (prawa krawędź rewersu), wisi obok lewej krawędzi zamkniętej teczki; z teczki wystaje tylko ZASIŁEK. Styk 07/59→08/0: identyczna klatka.

**Prośba do autora modeli:** profil tułowia i nóg (tu zastąpiony skrętem barków + lean w kadrze od pasa).

## Odbiór

Sprawdzone klatki 0, 26, 30, 43, 50, 59 (podgląd), 359/360 i 419/420 (render). Chwyt rączki: punkt (318,9;373,7) trzymany w każdej klatce (błąd < 1 px po rozwiązaniu nadgarstka). Profil Marty to głowa r1 (head 1) — nos, ucho, kok i kosmyk na wspólnej konstrukcji; prześwit nos–budka zachowany. Styk 06/07 sprawdzony z sceny 06 b01: zgodne strona i chwyt URLOP-u, jedna wystająca kartka ZASIŁEK, zdjęcie 02. 360 px: czytelne kto, do kogo, kocyk. Otwarte: brak profilu tułowia w r1 (prośba).
