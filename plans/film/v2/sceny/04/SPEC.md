# 04 · Koła i spojrzenie Marty

1280 × 720, 30 kl./s. Lokalne klatki 0–59 odpowiadają 180–239 w filmie. Marta jest z lewej, Paweł z prawej. Wózek zajmuje pierwszy plan w ogólnym, a tors i ramię Pawła w bliskim. Wygląd sprawdzić względem [rysunku rodziny w kolejce](../../../referencje/kolejka-zus-v1.png).

| Klatki | Obraz i akcja |
| --- | --- |
| 0 | Wspólny ogólny z 03. Oś wózka (474, 612), prawa dłoń Marty na końcu rączki. Paweł trzyma zamkniętą teczkę pod kątem −5°. |
| 1–13 | Wózek pokonuje 24 px w prawo. Biodra Marty przesuwają się nieznacznie, ciężar ciała podąża za prawą dłonią. Wzrok początkowo skierowany ku Oli. |
| 14–21 | Wózek wraca, wraz z nim zmienia się zwrot obrotu obu kół. Oczy prowadzą w stronę Pawła, po nich rusza głowa. |
| 22–37 | Cięcie na ustawienie od strony ramienia Pawła. Marta dalej trzyma rączkę i kończy przyciąganie wózka, unosząc twarz nad ramieniem partnera. Jej brew podnosi się na końcu pytania. |
| 38–49 | Pauza w głosie. Marta opuszcza wzrok na teczkę, Paweł przesuwa ją w lewo. Widoczne zagięcie rogu i zdjęcie z ujęcia 02. |
| 50–59 | Lewa dłoń podtrzymuje dolną część lewego brzegu. Prawy kciuk dochodzi do górnego prawego rogu okładki. Na cięcie do 05 środek teczki w przeliczeniu na plan ogólny wynosi (672, 392), szerokość 128, obrót −6°. |

Rotacja koła w stopniach odpowiada drodze podzielonej przez promień 29 px i pomnożonej przez 180/π. Ruch nadgarstka powstaje z pozycji rączki w obu ustawieniach. Palce i tusz rączki muszą być widoczne w miejscu chwytu. W przykładzie Mei plama filiżanki rusza po dotknięciu dłonią, a wcześniejsza faza `look` przenosi oczy na telefon. Tutaj te zależności sterują zmianą kierunku i reakcją Marty. [Mei, funkcje look i reach](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/examples/b5-mei-event-relay/stage.cjs#L25-L26)

Bliski plan wchodzi od razu na klatce 22. Skok skali służy temu samemu odczytaniu przedmiotu co zmiana ustawienia przy `JUMP_1` w Shotcraft. [Kod JumpCutPunchIn](https://github.com/Vincentwei1021/video-shotcraft/blob/59f3e9b9e936ff2bce0e18446226d770a3f2f61f/demos/rhythm/rhythm-interrupt-moves/JumpCutPunchIn.tsx)

Usta odczytują amplitudę Marty dla każdej klatki 180 + f. Pytanie zaczyna się w miksie w 5,90 s. Od lokalnej klatki 38 ścieżka Marty ma wartość zero. Słychać istniejące tło kolejki. [Obsada i nagranie](../../../montaz/glosy.py) · [Dane mowy](../../../montaz/assets/mowa.json)

Odbiór obejmuje zgodność z ostatnią klatką 03, zgodność kierunku toczenia z ruchem nadgarstka, pełny kontakt w obu ustawieniach oraz pauzę na oczekiwanie odpowiedzi. W bliskim planie twarz Marty, górna krawędź ramienia Pawła i okładka muszą pozostać jednocześnie widoczne.

Test przeszedł dla wszystkich 60 klatek. Na wyrenderowanych klatkach 0, 13, 21, 22, 39 i 59 sprawdzono odwrócenie ruchu wózka, czytelność twarzy Marty obok ramienia Pawła oraz końcową pozycję jego kciuka na rogu teczki. Odsłuch zmontowanego dialogu pozostaje częścią odbioru pełnego filmu.

## Załączniki do odbioru

![Klatki 0, 20, 40 i 59 z ukończonego ujęcia](klatki.jpg)

[Ujęcie z głosem lub dźwiękiem sceny](ujecie-720p.mp4) · [Załączony przykład warsztatowy](../../przyklady/fazy-ruchu.png) · [Autorstwo przykładów](../../przyklady/ZRODLA.md)
