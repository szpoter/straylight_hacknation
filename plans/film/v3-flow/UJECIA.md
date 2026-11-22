# Przewodnik Rodzica B · plan generacji

Materiałem odniesienia jest przyjęty [animatik r2](../v3/podglady/animatik-720p-r2.mp4), rewizja 6225951. Pierwsza seria obejmuje **19 pojedynczych klipów**, po jednym wierszu z tabeli. Proponowany model to Veo 3.1 Lite, Frames to Video, 16:9, 720p, 8 s, jeden wynik na żądanie. Przy 5 kredytach za wynik na Ultra daje to 95 kredytów, przy 10 na pozostałych planach 190. Potwierdź dostęp do obu klatek i cenę w selektorze przed pierwszą próbą. Zmiana modelu, wyższa cena lub powtórka wymaga osobnej decyzji Juliana. [Cennik Google](https://support.google.com/flow/answer/16526234?hl=en)

[Projekt Google Flow](https://flow.google.com/project/d4d3ab4b-9ca2-4efb-8894-89fe66fa40e6). Panel konta Plus pokazał 250 kredytów. W ręcznym trybie Frames z Veo 3.1 Lite i x1 cena wynosi 10 kredytów. Julian zatwierdził pierwszą próbę każdego z 19 ujęć, łącznie do 190 kredytów. Veo przyjął 19 zleceń, dostarczył 18 klipów i zgłosił błąd generacji audio dla 11. Po zwrocie saldo wyniosło 70, wydatek netto 180.

## Materiały dla Flow

Wygląd Marty, Pawła i Oli bierzemy z wcześniejszych ilustracji. [Rodzina Oli](../referencje/rodzina-oli-v1.png) określa kształt twarzy, włosy, ubrania i proporcje. Szpital korzysta z [narodzin](../montaz/assets/narodziny.png), kolejka z [wycinka bez szyldu](referencje/kolejka-bez-szyldu.png), okienko z [ilustracji pracownicy](../montaz/assets/okienko.png), dom z [kanapy](../referencje/kanapa-przed-fala-v1.png), fala z [detalu papierów](referencje/fala-detal.png). Referencje okienka i narodzin służą lokalnie do przygotowania czystych kadrów. W Flow używamy dwóch ilustracji przedstawiających odpowiednie fazy gestu.

**Ujęcie 01.** Wbudowany ImageGen przygotował [początek](ilustracje/01-start.png) na podstawie ilustracji narodzin i rodziny Oli. Drugi rysunek to edycja tej samej kompozycji. Na [końcu](ilustracje/01-koniec.png) dłoń Pawła jest bliżej, a między palcami zostaje prześwit. Oryginalna ilustracja narodzin pokazuje już zamknięty chwyt i nadaje się jako odniesienie dla końca 02.

**Ujęcia 02–19.** Numery w tabeli wyznaczają pozycje w animatiku. Eksporty w `kadry/` są storyboardem ruchu do lokalnego porównania. Pary ilustracji do Flow przygotowujemy według powyższych wzorców, zachowując ustawienie kamery, kierunek i punkt styku dłoni. Po klatce 1132 montaż dokłada oryginalnego Zusika. Pary użyte w produkcji są w katalogu `ilustracje/`. 02 i 10 zaczynają się od własnych detali `NN-in.png`, 11 przejmuje szeroki plan z końca 09, a 15 zaczyna się od `15-in.png`. Inne ujęcia przejmują poprzednią ilustrację końcową. Kadry wyjściowe noszą nazwy `NN-out.png`.

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


## Montaż końcowy

Na prośbę Juliana usunęliśmy z całej historii lokalne napisy, również z druków i wyświetlacza. Czyszczenie obrazu obejmuje pozorny nagłówek wygenerowany w 05 oraz słowo na ścianie w 08. Napisy w poradniku od klatki 1140 są częścią oryginalnej animacji.

W tabeli numer próby oznacza plik `surowe/NN-p1.mp4`. Każdy z 18 udanych wyników kosztował 10 kredytów. Odrzucone zlecenie 11 kosztowało 0 po zwrocie. Bilans całej serii wyniósł **19 zleceń, 18 pobranych filmów, 180 kredytów netto i 70 kredytów na koncie po serii**. Model wideo to Google Flow, Veo 3.1 Lite, Frames to Video. Ilustracje wejściowe przygotowano z pomocą ImageGen.

| Ujęcie | Wykorzystany materiał | Decyzja montażowa |
|---|---|---|
| 01 | 01, próba 1 | Rodzice pochylają się nad Olą. Ich spojrzenia prowadzą do dłoni. |
| 02 | 02, próba 1 | Pierwszy kontakt przypada na klatkę 65. Błysk migawki łączy chwyt z nieruchomą fotografią. |
| 03 | 02 i 03, próby 1 | Odjazd od zdjęcia do tej samej fotografii na teczce. Ruch kamery złożono z dwóch klatek Flow po odrzuceniu przenikania postaci. |
| 04 | 04, próba 1 | W szerokim planie widać ułożenie rąk na wózku i obrót Marty do Pawła. |
| 05 | 05, próba 1 | Kartka wysuwa się z teczki. Oczyszczono pole nagłówka. |
| 06 | 06, próba 1 | Krótka reakcja Pawła przypada na kwestię „Chyba tak”. |
| 07 | 07, próba 1 | Marta pochyla się nad wózkiem, Paweł trzyma formularz w kadrze. |
| 08 | 08, próba 1 | Powrót spojrzenia na Pawła. Oczyszczono ścianę za Martą. |
| 09 | 09, próba 1 | Koła zatrzymują się przy Pawle. Sam kontakt wózka z biodrem jest słabo widoczny. |
| 10 | 10, próba 1 | Detal dłoni, druku i zdjęcia dziecka na teczce. |
| 11 | początek 12, próba 1 | Osobne zlecenie 11 zakończyło się błędem audio. Odcinek pokazuje kolejkę i podanie kartki. Brakuje gestu złapania spadającego arkusza przez Martę. |
| 12 | dalszy ciąg 12, próba 1 | Podanie kartki prowadzi do zbliżenia tej samej pracownicy. Skrócono szeroki plan z drugą postacią przy okienku. |
| 13 | 13, próba 1 | Ruch palca pracownicy prowadzi wzrok na odpowiednie pole druku. |
| 14 | 14, próba 1 | Gest pracownicy i przekazanie kartki towarzyszą słowom „do jutra”. |
| 15 | 15, próba 1 | Teczka dotyka kanapy w klatce 846. Rodzice siadają osobno. |
| 16 | 16, próba 1 | Marta rozkłada kartki na kolanach. |
| 17 | 17, próba 1 | Paweł zdejmuje but, teczka i kartki zostają na kanapie. |
| 18 | 18, próba 1 | Opadnięcie buta przypada na klatkę 1038. |
| 19 | 19, próba 1 | Cięcie poprzedza pojawienie się obcej maskotki w generacji. Fala zatrzymuje się na 1132, oryginalny Zusik wchodzi na 1133. Od 1140 rozpoczyna się obraz A. |

## Odtworzenie eksportu

Polecenia uruchamia się w `plans/film/v3-flow`. W katalogu `surowe/` muszą być pobrane oryginały z projektu Flow. Skład korzysta z istniejących renderów A i miksu `../v3/media/miks.flac`. Skrypt Pythona wymaga NumPy, OpenCV i lokalnego FFmpeg.

```sh
python3 montaz/przygotuj.py
node sklad.mjs 720 montaz/montaz.json
node sklad.mjs 1080 montaz/montaz.json
```

Skrypt chroni istniejący eksport. Czwarty argument pozwala skierować film i arkusz do innego katalogu. Plik `montaz/montaz.json` zawiera 19 pozycji bez żadnej warstwy napisów. Maska `montaz/fala-1132.png` zachowuje ostrość papierów w chwili kliku. Ujęcia Flow mają natywne 1280 × 720. W eksporcie Full HD zostały przeskalowane filtrem Lanczos, a poradnik pochodzi z renderu A w 1920 × 1080. Każdy MP4 zawiera 1800 klatek przy 30 kl./s. Skład porównuje piksele wszystkich 660 klatek poradnika z A, włącznie z klatką 1799.

Najczytelniejsze fragmenty to chwyt dłoni w 02, gest przy okienku w 13 i stuk teczki w 15. Poza ujęciem zastępczym 11 najsłabiej czyta się zatrzymanie wózka biodrem w 09. Na szerokości 360 px układ rodziny, dokumentów i Zusika jest czytelny. Drobny tekst ekranów aplikacji wymaga większego obrazu.

Wersja do montażu to `przewodnik-rodzica-B-master-1080p.mov`, Apple ProRes 422 HQ z dźwiękiem PCM 48 kHz ze źródłowego miksu. Pliki MP4 wersji A i B mają identyczny ciąg pakietów AAC. Najdrobniejsze elementy ujęć Flow ogranicza rozdzielczość oryginałów. Odbiór poszczególnych prób wykonano na arkuszach oraz na wybranych klatkach gestów. Pełny ręczny przegląd każdej klatki wszystkich surowych dubli pozostaje niepotwierdzony.
