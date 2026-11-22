# 29 · Nazwa i odbiorca na jednym arkuszu

Klatki filmu 1680–1739, lokalnie 0–59, 30 kl./s, SVG 1280 × 720. Tło #F5FAF7. Biały arkusz, tytuł w Domine i metka „Szkic” przechodzą wprost z poprzedniej sceny. Pola „Pracodawca” i „Studio Lipa” pochodzą z profilu rodziny. [Wniosek i pola profilu](../../../../../app/src/features/chat/case-data.ts#L6-L15) · [Dane odbiorcy](../../../../../app/src/lib/family/ola.ts#L6) · [Ustalenia montażu](../../../PLAN-POPRAWEK-V2.md#L47)

| Klatki | Obraz |
| --- | --- |
| 0 | Dokładny wynik `scene(59,k)` z ujęcia 28. Odpis zajmuje (676,376) i ma rozmiar 446 × 108 px. |
| 1–3 | Cały rysunek zaczyna maleć. Odpis, znak załączenia i metka pozostają względem siebie w tych samych miejscach na arkuszu. |
| 4–16 | Z lewej na prawą odsłania się wspólny wiersz odbiorcy. Etykieta w rozmiarze 26 px i odpowiedź w rozmiarze 45 px mają stałe miejsca w arkuszu. |
| 17 | Drobne wyhamowanie kamery przy w pełni odsłoniętym odbiorcy. |
| 18–59 | Arkusz stoi. Transformacja `translate(115.2 51) scale(.82)` umieszcza cztery brzegi kartki w x=201–379 i y=41–684. Wspólny tytuł zostaje widoczny nad odbiorcą. Następny moduł może pobrać całą klatkę 59. |

Ruch jednej kamery kończy się w klatce 18, jak w przykładzie katalogu Bang Motion, gdzie `home` obejmuje cały kadr i utrzymuje jego położenie. Inscenizację przejścia od detalu do dłuższego zatrzymania ilustruje również ujęcie PullBackIsolation. [Bang Motion, funkcja home](https://github.com/bangtutorial/bang-motion/blob/c1aa65e921c970d858705fcb4a53a8294d1a4131/assets/starter-explainer-katalog.html#L129-L135) · [Video Shotcraft, odjazd i wytrzymanie końca](https://github.com/Vincentwei1021/video-shotcraft/blob/59f3e9b9e936ff2bce0e18446226d770a3f2f61f/demos/camera/tension-camera-moves/PullBackIsolation.tsx#L1-L6)

**Dźwięk i odbiór.** Zachować istniejącą kwestię narratora i muzykę. W miksie kwestia „wniosek” wchodzi w 51,71 s. Po pauzie po „sprawdzić” głos wraca w 56,44 s. Klatka 18 (56,60 s) zatrzymuje arkusz w trakcie „do kogo”. [Ustawienie kwestii w miksie](../../../montaz/miks.py#L33) Wyciszony obraz powinien pozwolić odczytać tytuł, nazwę odpisu i odbiorcę z jednej końcowej klatki. Sprawdzić identyczność wyjścia 28 z wejściem 29, wszystkie 60 klatek i nieruchomy finał.

## Załączniki do odbioru

![Klatki 0, 20, 40 i 59 z ukończonego ujęcia](klatki.jpg)

[Ujęcie z głosem lub dźwiękiem sceny](ujecie-720p.mp4) · [Załączony przykład warsztatowy](../../przyklady/budowa-karty.jpg) · [Autorstwo przykładów](../../przyklady/ZRODLA.md)
