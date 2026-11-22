# 29 · Specyfikacja ujęcia „Do kogo trafi wniosek?”

Autor planu: s29

56–58 s. Klatki filmu 1680–1739, lokalnie 0–59 przy 30 kl./s. Współrzędne dla podglądu 1280 × 720, początek w lewym górnym rogu. Papier #FFFFFF, otoczenie #F5FAF7, tusz #283754 i potwierdzenie #1A8648. [Design produktu](../../../../../DESIGN.md) · [Odsunięcie arkusza w v2](../../../v2/sceny/29/klatki.jpg)

| Klatki | Kamera, skład i dźwięk |
| --- | --- |
| 0–3 | Użyć pełnej pozy 28/59 jako 29/0. „Odpis aktu urodzenia Oli” leży w polu „Załącznik”, znak potwierdzenia już stoi. Od następnej klatki rozpocząć odjazd od papieru wzdłuż osi optycznej, zmniejszając skalę od 1. Matowy stuk kontaktu wybrzmiał w 28. |
| 4–12 | Skala i przesunięcie zmieniają się wspólnie. Odpis, jego obrys i znak załączenia pozostają ze sobą związane. Pod nimi od lewej odkrywa się miętowy wiersz „Odbiorca”. Maską odsłonić pełną nazwę do końca klatki 12, by widz zdążył przeczytać „Studio Lipa” przy wejściu głosu. |
| 13–17 | Po pauzie po „sprawdzić” lektor wraca ok. 56,44 s. Widz widzi już nazwę wniosku z metką u góry i „Pracodawca · Studio Lipa” na dole. Wygasić prędkość kamery pod pierwszymi sylabami „do kogo”. Zachować istniejący głos i muzykę. |
| 18–59 | Od 56,60 s utrzymać całą kompozycję. Docelowa skala 0,82 i przesunięcie (115,2 px w prawo, 51 px w dół) dają arkusz od x=201 do 1079 i od y=41 do 684. W końcowym kadrze nazwa wniosku ma co najmniej 43 px w Domine, pełna nazwa odbiorcy co najmniej 50 px w Inter. Obie mieszczą się w oddzielnych, poziomych wierszach. W 57,92 s zaczyna się kwestia finałowa. Przekazać pełną klatkę 59 do 30/0. Dopiero w 30/1 arkusz rusza w głąb. |

## Próba odbiorowa

Odtworzyć 54–60 s raz, bez głosu i bez powiększenia, przy szerokości obrazu 360 px. Po scenie widz powinien umieć nazwać wniosek, powiedzieć, że to szkic, oraz wskazać pracodawcę Studio Lipa. Na zatrzymanej klatce 18 powinien móc odczytać oba pełne napisy naraz. Sprawdzić jeszcze przy 390 px, czy metka „Szkic” ma odstęp od tytułu. Z miksem porównać moment zatrzymania z „do kogo”, potem sprawdzić, że przejście do stosu zaczyna się dopiero w 58. sekundzie. W nałożonych parach 28/59 i 29/0 oraz 29/59 i 30/0 krawędzie papieru, litery i znak załączenia mają się pokrywać. [Profil Oli](../../../../../app/src/lib/family/ola.ts) · [Czasy kwestii](../../../montaz/miks.py#L33) · [Miks odniesienia](../../../v2/media/miks.flac) · [Plan i przykłady](PLAN.md) · [Poprzednie ujęcie](../28/SPEC.md) · [Następne ujęcie](../30/SPEC.md)

## Realizacja v3 (autor b24)

Moduł [`scene.mjs`](scene.mjs), `scene(f)`; obraz bazowy `scene(59)` z [`../28/scene.mjs`](../28/scene.mjs). Rewizja kitu nieużywana.

| Klatki | Ruch | Krzywa |
| --- | --- | --- |
| 0 | `scene28(59)` bez zmian. | — |
| 1–18 | Cały arkusz: `translate(115,2·p, 51·p) scale(1 − 0,18·p)`, p = softLand(smoothstep(f/18)) — łagodny start z miejsca, długie hamowanie pod „do kogo”. W 18: arkusz x=201–1079, y=41–684. | softLand(expoOut 3,41) ∘ smoothstep |
| 3–12 | Wiersz odbiorcy odsłaniany maską od lewej: (140, 566) 982 × 160, rx 14, #F5FAF7, obrys #A6D0B8 2 px, belka #1A8648 5 px (x=142,5, y=592–700); „Odbiorca” Inter 500 28 px #5E697F (180, 616); „Pracodawca · Studio Lipa” Inter 600 62 px, odstęp −0,8, #283754 (178, 690). Pełna nazwa w 12. | smoothstep |
| 18–59 | Stoi (wszystkie klatki = 18). | — |

Teksty: etykieta pola „Pracodawca” i `OLA.employer` „Studio Lipa” z [case-data.ts](../../../../../app/src/features/chat/case-data.ts) i [ola.ts](../../../../../app/src/lib/family/ola.ts); tytuł i „Szkic” z 28. W kadrze końcowym (skala 0,82): tytuł Domine 42,6 px, nazwa odbiorcy Inter 50,8 px, wiersz odbiorcy y=515–646, baza nazwy y=617.

**Styki.** 28/59 → 29/0: identyczny obraz. 29/59 → 30/0: 30 zwraca `scene29(59)`.

## Odbiór

Stopklatki 1679, 1680, 1686, 1692, 1698, 1739. Render [ujecie-720p.mp4](ujecie-720p.mp4), [klatki.jpg](klatki.jpg), [pozy.jpg](pozy.jpg).

| Sprawdzenie | Wynik |
| --- | --- |
| 28/59 → 29/0 | Różnica 1679/1680 = 0. |
| Pełna nazwa w 12 | Tak; w 6 maska w połowie („Pracod…”), zamierzone. |
| Klatka 18 | Tytuł, „Szkic”, daty, pliki i „Pracodawca · Studio Lipa” w jednym nieruchomym kadrze; wiersz odbiorcy 22 px pod plikami. |
| 29/59 → 30/0 | Różnica 1739/1740 = 0. |
| 360 px | Odbiorca (≈ 14 px) czytelny; „Szkic” oddzielony od tytułu. |

**Wynik.** Bez problemu. Otwarte: tytuł w końcowym kadrze ma 42,6 px (SPEC: „co najmniej 43”) — wynika z narzuconej skali 0,82; przy 0,83 trzeba by zmienić przesunięcie i dół arkusza.
