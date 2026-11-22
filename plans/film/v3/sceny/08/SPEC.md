# 08 · Specyfikacja ujęcia „Końcówka pytania Marty”

Autor planu: s08

14–16 s, klatki filmu 420–479. Lokalnie 0–59 przy 30 kl./s. Podgląd 1280 × 720. Przed wykonaniem zapisz rewizję wspólnych modeli rodziców używaną w 07 i 09. Zwrot i polskie pozy ust rozgrywaj na jednej głowie każdej postaci. W ujęciu zmieniają się wyłącznie poza, kierunek oczu i widok wspólnego modelu. [Wytyczne rysunkowe](../../POSTACIE.md)

## Przebieg i styki

| Klatki | Gra, chwyt i dźwięk |
| --- | --- |
| 0–9 | Klatka 0 przejmuje z 07/59 profil Marty, wysokość pasa kocyka w cyklu oddechu Oli i położenie kciuka na rączce. Od klatki 3 oczy Marty idą do Pawła. Do 9 ucho, broda i nasada szyi pozostają w pozie skłonu. Paweł czyta, trzymając prawą ręką ten sam brzeg odwróconego „URLOPU”. |
| 10–25 | Marta unosi głowę na osi szyi. Dopiero od 14 dołączają bark i łokieć. Prawy nadgarstek pozostaje przy rączce. Odjazd kończy się na planie obojga, z widoczną odległością między oczami Marty a twarzą Pawła. Usta Marty kończą pytanie według nagrania, ostatnia niezerowa próbka wypada w klatce 18. |
| 26–43 | W 26–32 oczy Pawła przechodzą z kratek ku Marcie przy jeszcze opuszczonej brodzie. W 33–43 głowa obraca się na szyi do widoku trzy czwarte w lewo. Przesłonięcie dalszego policzka wynika z obrotu nosa w modelu. Wskazujący pozostaje na kratkowanej stronie arkusza, kciuk po drugiej stronie. Lewa dłoń podpiera okładkę, drugi druk „ZASIŁEK” zostaje przy grzbiecie. |
| 44–59 | Utrzymaj wzajemne spojrzenie. Na klatce 59 pojawia się pierwsza niezerowa próbka „Nie wiem”. 09 przejmuje to samo rozwarcie ust w ruchu, chwyt, układ arkuszy i nieruchome koła. Szerszy plan 09 odsłoni stopy przed przeniesieniem ciężaru i hamowaniem wózka biodrem. |

Zachowaj ciągłość obu nagrań i szumu korytarza na cięciach. Pozy ust odczytuj z kolejnych próbek 420–479. [Obwiednie Marty i Pawła](../../../montaz/assets/mowa.json) · [Tekst i początek kwestii](../../../montaz/glosy.py)

## Odbiór na renderze

- Odtwórz klip w tempie 1× bez dźwięku. Na klatkach 0, 9 i 43 widz powinien kolejno wskazać cel spojrzenia Marty pod budką, jej oczy uniesione przy opuszczonej brodzie i spojrzenie Pawła skierowane w jej stronę. Na 32 Paweł ma już widzieć Martę, choć jeszcze nie uniósł brody.
- Zestaw głowy w klatkach 0, 32 i 43 z planszą wspólnej obsady, wyrównując skalę według wysokości głowy. Śledź nasadę nosa, ucho, żuchwę i grzywkę w kolejnych widokach. Podczas zwrotu powinna pozostać jedna para oczu, jeden nos i jeden kontur ust Pawła.
- Porównaj 07/59 z 08/0 oraz 08/59 z 09/0 po wyrównaniu do rączki i okładki. Kciuk Marty trafia w to samo miejsce rączki, wskazujący Pawła nadal zakrywa ten sam fragment kratkowanej strony, drugi arkusz zachowuje położenie przy grzbiecie. Odsłuchaj przejście do 09 przez początek „Nie wiem” i sprawdź ruch ust po obu stronach cięcia.

[Plan i przykłady](PLAN.md) · [Poprzednie ujęcie](../07/SPEC.md) · [Następne ujęcie](../09/SPEC.md)


## Realizacja v3 (autor b07)

Modele r1 (`k.rewizja === "r1"`), wspólny świat bloku w [`../07/kolejka.mjs`](../07/kolejka.mjs): plan ogólny 1280×720, postaci s = 1, podłoga y 590, lada od x 960 (blat y 352), pracownica siedzi (1131,420) s 0,9, wózek s 0,95 (oś y 558). Każde ujęcie patrzy na ten świat kamerą `cam(z,cx,cy)`; kreski cienione z^−0,6. Teczka i druki jak w 03–06 (b01): teczka zamknięta, pionowo przy piersi, w ekranowo prawej dłoni Pawła; ekranowo lewa dłoń pracuje. Zdjęcie na okładce = `photo02(k)` (decyzja koordynatora). Render: `node build.mjs --only 06,…,13 --out robocze/b07`, `klatki.mjs`, `render.mjs 720 NN NN`. Przykład animatora ([ZRODLA.md](../../../v2/przyklady/ZRODLA.md)): Stickman `character-acting-reference.png` (czytanie z pochyloną głową, ciężar na przedramionach) i B6 `package.json` (ta sama głowa w obrocie).

| Klatki | Realizacja |
| --- | --- |
| 0 | = 07/59 (kamera, poza, oddech). |
| 3–9 | Oczy Marty w górę (gazeDown 0,55→−0,35). |
| 10–25 | Głowa Marty na osi szyi: head 1→0,62, nod 0,76→0,05; od 14 bark (bow 0,44→0,2). Kamera z 1,9→1,45, środek (470,258). Ostatnia sylaba Marty ~18. |
| 26–32 | Oczy Pawła z kratek ku Marcie (gaze →−1), broda jeszcze w dół. |
| 33–43 | Głowa Pawła r1 do ¾ w lewo (head −0,55, nod 0,08). |
| 44–59 | Wzajemne spojrzenie; 59 pierwsza próbka „Nie wiem”. |

Styk 08/59→09/0: te same pozy, kamera z 1,45→1 (cięcie na plan ogólny).

## Odbiór

Sprawdzone 0, 9, 32, 43, 59 oraz 419/420 i 479/480. Jedna głowa na postać, obrót Pawła 33–43 bez podmiany modułu. Kciuk Marty na tym samym punkcie rączki. Wskazujący Pawła trzyma URLOP przez całe ujęcie. 360 px: kierunki spojrzeń czytelne.
