# Przewodnik Rodzica B · plan generacji

Materiałem odniesienia jest przyjęty [animatik r2](../v3/podglady/animatik-720p-r2.mp4), rewizja 6225951. Pierwsza seria obejmuje **19 pojedynczych klipów**, po jednym wierszu z tabeli. Proponowany model to Veo 3.1 Lite, Frames to Video, 16:9, 720p, 8 s, jeden wynik na żądanie. Przy 5 kredytach za wynik na Ultra daje to 95 kredytów, przy 10 na pozostałych planach 190. Potwierdź dostęp do obu klatek i cenę w selektorze przed pierwszą próbą. Zmiana modelu, wyższa cena lub powtórka wymaga osobnej decyzji Juliana. [Cennik Google](https://support.google.com/flow/answer/16526234?hl=en)

[Projekt Google Flow](https://flow.google.com/project/d4d3ab4b-9ca2-4efb-8894-89fe66fa40e6). Panel konta Plus pokazał 250 kredytów. W ręcznym trybie Frames z Veo 3.1 Lite i x1 cena wynosi 10 kredytów. W edytorze są dwa kadry i prompt 01. Proponowany pierwszy wydatek to 10 kredytów za samą 01. Pozostałe 180 czeka na ocenę pilota i zgodę Juliana.

## Materiały dla Flow

Wygląd Marty, Pawła i Oli bierzemy z wcześniejszych ilustracji. [Rodzina Oli](../referencje/rodzina-oli-v1.png) określa kształt twarzy, włosy, ubrania i proporcje. Szpital korzysta z [narodzin](../montaz/assets/narodziny.png), kolejka z [wycinka bez szyldu](referencje/kolejka-bez-szyldu.png), okienko z [ilustracji pracownicy](../montaz/assets/okienko.png), dom z [kanapy](../referencje/kanapa-przed-fala-v1.png), fala z [detalu papierów](referencje/fala-detal.png). Referencje okienka i narodzin służą lokalnie do przygotowania czystych kadrów. W Flow używamy dwóch ilustracji przedstawiających odpowiednie fazy gestu.

**Ujęcie 01.** Wbudowany ImageGen przygotował [początek](ilustracje/01-start.png) na podstawie ilustracji narodzin i rodziny Oli. Drugi rysunek to edycja tej samej kompozycji. Na [końcu](ilustracje/01-koniec.png) dłoń Pawła jest bliżej, a między palcami zostaje prześwit. Oryginalna ilustracja narodzin pokazuje już zamknięty chwyt i nadaje się jako odniesienie dla końca 02.

**Ujęcia 02–19.** Numery w tabeli wyznaczają pozycje w animatiku. Eksporty w `kadry/` są storyboardem ruchu do lokalnego porównania. Pary ilustracji do Flow przygotowujemy według powyższych wzorców, zachowując ustawienie kamery, kierunek i punkt styku dłoni. Po klatce 1132 montaż dokłada oryginalnego Zusika. Dla ujęć po pilocie pary ilustracji czekają na przygotowanie.

Do angielskiego opisu gestu dopisz poniższy opis stylu. Po montażu lokalna klatka 0 to wejście ujęcia, 59 to wyjście, a w 19 koniec ruchu wypada na 52.

> Use the two supplied picture-book illustrations as the exact first and last poses of one continuous shot. Preserve the rounded faces, expressive eyebrows, asymmetric hair shapes, gently varying navy ink line, muted sage fabrics and fine paper grain visible in these drawings. Keep identities, clothing and prop silhouettes stable. Let the motion follow the described gesture. Keep title areas and signs blank for editorial lettering. No logos, subtitles or extra cuts.

Prompt przygotowany w Flow do 01:

> Locked hospital shot in the exact picture-book style of the two frames. Marta cradles Ola securely throughout. Paweł slowly eases his extended index finger towards her open hand and stops just short. Keep the sliver of light between their fingertips through the cut. Preserve the faces, soft navy ink, warm ivory paper, sage fabric and single blanket stripe. No grasp yet, camera motion, lettering or extra people.

## Pierwsza seria

Każdy wiersz to **Frames, 1 próba, do 10 kredytów**. Kolejność bloków daje odpowiednio 30, 50, 30, 40 i 40 kredytów. Gest i styk dłoni są częścią angielskiego promptu.

| Blok | Ujęcie | Klatki animatiku od → do | Prompt ujęcia |
|---|---|---|---|
| 01–03 | 01 | f0000 → f0059 | In the hospital Marta supports the swaddled newborn's neck and back. Paweł eases his index finger towards the open palm. End with a small visible gap, about three pixels in the wide view. |
| | 02 | f0060 → f0119 | Macro from the same side. In the first twelfth of the shot the index pad touches the baby's palm. Her middle, ring, index and little fingers curl one after another, then the thumb rests against his finger. Keep the sleeve and blanket stripe joined to the wrist. Hold the grasp through the shutter and end on the clean photograph. |
| | 03 | f0120 → f0179 | Start on the identical still photograph of the grasp. A narrow reflection crosses the plastic as Paweł tilts the folder, thumb on its face and left hand underneath. Pull back along the photo axis to reveal the queue, Marta on the left holding the pram handle. |
| 04–08 | 04 | f0180 → f0239 | Marta rocks the pram out and back, tyres rolling on the floor. Her right thumb stays wrapped around the handle. Only after the wheels stop does she lean towards the folder. Paweł supports it with his left forearm and reaches for a top corner. |
| | 05 | f0240 → f0299 | Pinch the upper corner of the front sheet between Paweł's right thumb and index finger before moving it. As he slides it out, the second sheet stays seated. Marta notices its blank title field, eyes moving before her head. End with both title fields visible. |
| | 06 | f0300 → f0359 | Keeping his folder on the left forearm, Paweł shifts the thumb down the edge, turns the sheet around the pinched side and reads its grid. Pause before his hesitant two-syllable Polish reply, starting about 43 percent into the shot. Lower the reversed sheet while keeping the pinch. |
| | 07 | f0360 → f0419 | In profile Marta looks down at Ola and bends from the hips. Keep the thumb fixed on the pram handle and leave space between her nose and hood. Only the blanket stripe rises with the sleeping baby's breath. Paweł keeps the open folder. |
| | 08 | f0420 → f0479 | Marta raises her eyes first, then her chin, keeping a hand on the pram. Paweł finishes reading, meets her gaze and waits a beat before beginning his reply. Keep the folder supported and the pram still. |
| 09–11 | 09 | f0480 → f0539 | As the queue advances, Marta pushes the handle. Paweł plants one foot and stops the rigid bassinet with his hip just under halfway through the shot. Wheels stop just after contact. His hands stay on the papers and his right index ends touching the top form. |
| | 10 | f0540 → f0599 | Close on three overlapping forms. The right fingertip pushes the top form, hooks the second and uncovers the third field in order. Keep blank space for three short printed labels. The loosened middle sheet starts sliding towards Marta. |
| | 11 | f0600 → f0659 | At one tenth of the shot both parents glance at a blank queue display. Marta keeps the pram in her left hand, catches the falling bottom corner with her right fingers, then presses her thumb down. They share its weight briefly before Paweł offers the free edge towards the counter. |
| 12–15 | 12 | f0660 → f0719 | The clerk places her left thumb on the front right edge with two fingers behind it. Paweł releases only after her grip carries the weight. She reads the blank heading, turns the same sheet towards Marta and rests the bottom edge on the counter. |
| | 13 | f0720 → f0779 | Keep the clerk's left grip fixed. Her right index travels diagonally from the title field to the date field. Marta follows with her eyes, then her chin. The clerk takes the pen and finishes with the nib just above the empty line. |
| | 14 | f0780 → f0839 | The clerk moves the pen across two short words under the date while mouthing the Polish phrase “do jutra”. Leave the line empty for compositing. Marta nods once. Paweł takes the free edge, closes the folder and carries its top-right corner down through the cut. |
| | 15 | f0840 → f0899 | Match the descending corner and wrist. One tenth into the shot the folder corner touches the sofa cushion, which compresses at contact. Marta and Paweł sit in succession. Marta's fingertips come to rest just short of the folder spine. |
| 16–19 | 16 | f0900 → f0959 | Marta pins the spine, opens the cover around its hinge, releases it and uses both hands to transfer two forms to her thighs. Separate the sheets so she reads the left title field, then the right one. Keep both blank. |
| | 17 | f0960 → f1019 | Paweł slips the foot nearest Marta out of its shoe using the other toe to pin the heel. He grips the remaining heel beside the armrest, withdraws the socked foot and pauses with the second shoe hanging in his hand when he notices the form. |
| | 18 | f1020 → f1079 | Lower and rotate the hanging shoe until the entire sole lands 30 percent into the shot. Only then release the heel. Paweł pinches the short edge of the form and anchors the remaining stack with the opposite elbow. Leave the next sheet peeking from under the sleeve. |
| | 19 | f1080 → f1132 | From the same sofa angle, Paweł pulls the pinched form. The next page slips from under his elbow, catches a second corner and sends the stack fanning across both laps. Marta reaches from below and just misses. End sharply on the supplied wave crest with both faces visible. Keep the centre clear for the mascot added in the edit. |

## Próby i odbiór

Stan początkowy dla 01–19: 0 prób, 0 wybranych. Po każdym wyniku zapisać tu numer ujęcia i próby, nazwę pobranego pliku w `surowe/`, koszt, decyzję i konkretny powód. Obejrzeć przy 1× z miksem i klatka po klatce. Sprawdzić twarz względem ilustracji rodziny i obu nowych kadrów, ubranie, liczbę i zasłanianie palców, styk dłoni, sztywność rekwizytu i płaski styl. Po trzech nieudanych próbach danego ujęcia zatrzymać pracę nad nim.

W montażu kontrolować chwyt w kl. 65, „Chyba tak” przy 10,85 s (najbliższa kl. 326), biodro 508 i zatrzymanie kół 514, sygnał 606, „do jutra” przy okienku, teczkę 846 i but 1038. W 19 klik wypada na 1132, oryginalny Zusik wchodzi od 1133. Od 1140 do 1799 włącznie źródłem jest A w rozdzielczości montażu. Po odbiorze wszystkich prób obejrzeć całe B z miksem, osobno cięcia oraz styk 37,7–38 s, potem wyciszony obraz o szerokości 360 px. W raporcie dopisać URL projektu, faktyczny model, koszt i najmocniejsze oraz najsłabsze ujęcie.

## Skład po wyborze prób

W pliku `wybrane/montaz.json` zapisz tablicę `shots` w kolejności 01–19 oraz `waveMask` ze ścieżką do maski z rzeczywistej klatki kliku. Białe pola maski oznaczają widoczną falę papierów, czarne oznaczają tło i rodziców. Wszystkie ścieżki w tym pliku są względne wobec niego. Przykładowy wpis ujęcia 02 ma postać `{"id":2,"file":"../surowe/02-p1.mp4","keys":[[0,0],[5,18],[59,239]],"blank":true}`. Liczby źródłowe w przykładzie są ilustracyjne. Po wybraniu dubla zmierz je na materiale przeliczonym do 30 kl./s.

Pierwsza liczba w parze to klatka montażu, druga to klatka pobranego klipu. Pierwsza para ustawia wejście, ostatnia wyjście, pośrednie wyrównują kontakt z efektem lub sylabą. Lokalnie kończymy w 59, a falę w 52. Ujęcie z czytelnym drukiem otrzymuje pole `titles` ze ścieżką do 60-klatkowej przezroczystej warstwy wideo 30 kl./s, np. ProRes 4444. Pozycję i perspektywę liter śledzimy na wybranym, już dopasowanym czasowo dublu. Przy zasłonięciu przez dłoń maskujemy odpowiednią część warstwy. Na klatkach 19/52–59 napisy również stoją. Oznaczenie `blank: true` jest dla ujęć bez czytelnego tekstu.

W 05–06 śledzimy „URLOP” i „ZASIŁEK”, w 10 również „POTWIERDZENIE”, „Okres”, „Podstawa” i „Data wpływu”. Wyświetlacz w 11 zmienia A16 na A17 w klatce 6. W 12–14 tytuł druku, data „11.01.2027” i dopisek „do jutra” muszą podążać za drukiem, dopisek odsłaniamy pod stalówką. W 16–19 każdy widoczny nagłówek podąża za własną kartką. W pozostałych kadrach sprawdzamy widoczność druku i wyświetlacza na wybranej próbie.

Uruchom `node sklad.mjs 720` z katalogu v3-flow. Po odbiorze uruchom `node sklad.mjs 1080`. Skrypt ignoruje dźwięk klipów, używa miksu v3 i porównuje piksele całego poradnika z A przed zapisem pliku. Arkusze mają pięć kolumn i sześć wierszy, po jednej klatce ze środka każdego ujęcia, od lewej do prawej.
