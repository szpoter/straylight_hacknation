# 01 · Narodziny Oli

Autor planu: s01

**00–02 s.** Marta leży po lewej na poduszce, Ola leży na jej piersi, Paweł siedzi przy prawym boku łóżka. Kamera stoi przy materacu na wysokości twarzy dziecka. Widz ma dostrzec moment, w którym Paweł przestaje sięgać i daje Oli czas na odpowiedź. Cięcie przypada na tę pauzę.

## Obsada i kadr

Rozrysuj rodzinę na nowo ze wspólnego arkusza. Weź Martę w trzech czwartych ku prawej, z odsłoniętym uchem przy niskim koku. Ułóż jej głowę tak, żeby dalszy policzek był widoczny nad skronią Oli. Pawła weź w trzech czwartych ku lewej. Przy pochyleniu zachowaj asymetryczną grzywkę, linię szczęki oraz widoczny kołnierz rozpiętej koszuli. Ułóż przed nimi Olę bokiem, z odsłoniętym kosmykiem, uchem i zamkniętymi powiekami. W szpitalnej koszuli Marty podwiń krótki rękaw nad łokciem. Na kocyku Oli zostaw jeden szeroki pas. [Plansza firmowa · rodzina i fotografia chwytu](../../../referencje/rodzina-oli-v1.png) · [Wspólna obsada](../../POSTACIE.md) · [Stickman · punkty jednej postaci w trzech widokach](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b6/characters/kiosk_keeper/package.json)

W klatkach v2 spory odstęp między tułowiami wypełnia jasna ściana. Przysuń krzesło Pawła do łóżka i zbliż kadr. Twarze, podparte przedramię Marty, kocyk i łokieć Pawła mają być razem widoczne od pierwszej klatki. Prowadź jego palec po jasnym tle poduszki, żeby nadgarstek, kciuk i pozostałe zgięte palce miały czytelny kontur. [Klatki 01 v2](../../../v2/sceny/01/klatki.jpg) · [Rysunek szpitalny](../../../montaz/assets/narodziny.png)

## Cztery fazy

1. **0–13.** Marta podpiera prawe przedramię poduszką. Jej dłoń obejmuje bok kocyka, ucho Oli spoczywa przy dekolcie. Marta patrzy na córkę. Paweł odnajduje wzrokiem otwartą lewą dłoń Oli, zanim ruszy ramieniem.
2. **14–28.** Wdech Marty unosi dziecko i kocyk. Łokieć pozostaje na poduszce, a przedramię obraca się z unoszonym ciężarem. Paweł nachyla się z bioder i wysuwa prawy bark. Jego drugi łokieć opiera się o udo.
3. **29–48.** Paweł otwiera prawy łokieć, prowadząc opuszkę wskazującego w stronę środka dłoni Oli. Jej nadgarstek wyrasta z rękawa przy zielonym pasie. Marta przenosi spojrzenie na Pawła, potem lekko podnosi brodę.
4. **49–59.** Paweł zwalnia i zatrzymuje palec o włos od dłoni. Palce Oli nadal są otwarte. Cięcie na większy plan zostawia jej pierwszy dotyk scenie 02. [Następne ujęcie](../02/SPEC.md)

Do próby narysuj dwie skrajne pozy Pawła na tej samej linii siedziska. Porównaj bark, łokieć i mankiet z przykładem gry postaci przy rekwizycie, następnie dodaj pośrednią pozę o największym zgięciu łokcia. [Stickman · gra postaci](../../../v2/przyklady/pozy-postaci.png) · [Oryginał przykładu](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b1/character-acting-reference.png) · [Specyfikacja tego ujęcia](SPEC.md)

## Realizacja v3 (autor b01)

Kadr: świat `k.ward()` z planszy obsady (panel „Szpital”) pod stałą kamerą `translate(-236 -250) scale(1.85)`, linie świata ×0,62. Marta `outfit:"patient"`, biodra świata (318,474), s 1,05, głowa ¾ w prawo (`head .55`), lewa ekranowa ręka pod kocykiem, prawa na boku kocyka; mała poduszka pod łokciem (lokalny dodatek do planu sali) ugina się o 3–4,5 px. Ola `k.ola()` (376,402), s 1,45, kąt −10°. Paweł siedzi (`seat`, biodra (700,420)), ¾ w lewo, prawa dłoń anatomicznie = lewa ekranowa, chwyt `point`. Dłoń Oli to lokalne rozszerzenie na geometrii `k.grasp()` (przedramię, dłoń, kciuk, palce) wycelowane na rzeczywistą oś palca Pawła (155°), z rękawem body; r1 ma dłoń Oli tylko w `grasp()`.

Fazy: 0–13 Paweł znajduje wzrokiem dłoń (gaze), palec 103 px od dłoni (oś linii); 14–28 wdech (Ola +4 px), skłon z bioder; 29–48 łokieć się otwiera, opuszka sunie z prawej do lewej po łuku, 13 px w kl. 48; 49–55 do 6 px między osiami kresek (≈3 px prześwitu), 56–59 bez ruchu. Marta: 30–40 wzrok na Pawła, 40–50 broda w górę.

Przykład animatora: [Stickman · character-acting-reference.png](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b1/character-acting-reference.png) (lokalnie `../../../v2/przyklady/pozy-postaci.png`) — bark prowadzi przed nadgarstkiem, łokieć otwiera się dopiero w drugiej fazie. Plansza: `../../../referencje/rodzina-oli-v1.png`. Render: `node build.mjs --only 01,02,03,04,05,06 --out robocze/b01`, klatki `klatki.mjs`, ujęcie `render.mjs 720 NN NN`. Modele **r1** (`k.rewizja`), bez zmian w `obsada/`.
