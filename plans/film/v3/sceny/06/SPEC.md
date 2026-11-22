# 06 · Specyfikacja ujęcia „Chyba tak”

Autor planu: s06

10–12 s, klatki filmu 300–359. Lokalnie 0–59 przy 30 kl./s. Podgląd 1280 × 720.

## Kontakt i styki

- **Wejście, klatki 0–6.** Po cięciu z 05 prawy górny róg „URLOPU” wypada po tej samej stronie sylwetki. Kciuk prawej dłoni jest na licu, wskazujący na odwrocie. Przez zmianę chwytu kartka zachowuje pozycję, oparta o wskazujący i środkowy. W klatce 6 kciuk ponownie dociska papier do wskazującego, niżej na tej samej krawędzi. Lewe przedramię nadal niesie ciężar otwartej teczki.
- **Obrót, klatki 7–19.** Poprowadź oś obrotu pionowo wzdłuż przytrzymanego brzegu. W klatce 7 tytuł jest jeszcze czytelny. Przy około 90° w klatce 13 wolny róg mija oś w skrócie perspektywicznym. Za krawędzią znika najpierw opuszek kciuka. Po obrocie do około 180° w klatce 19 widać palec wskazujący na odwrocie oraz kratki formularza. Mankiet obraca się z nadgarstkiem. Fałda przy uchwycie prostuje się po wyhamowaniu dłoni.
- **Sprawdzenie, klatki 20–26.** Oczy osiadają na pierwszej kratce, po nich broda. Zostaw spojrzenie i zamknięte usta przez ostatnie cztery klatki fazy. „ZASIŁEK” i okładka zachowują kolejność w głębi.
- **Odpowiedź i wyjście, klatki 27–59.** Pierwsze rozwarcie ust przypada na klatkę 27 (10,90 s), zgodnie z kwestią „Chyba tak” w miksie v2. Po ostatniej sylabie usta się zamykają, a przedramię opuszcza odwrócony druk nad teczkę. Na cięciu ręka nadal trzyma brzeg arkusza, teczka jest otwarta, a Marta przy rączce zaczyna pochylać się ku Oli. W 07 ten układ można odsłonić ponownie z profilu.

## Odbiór na renderze

Na zatrzymanych klatkach 6, 13 i 19 prześledź mankiet prawej ręki do nasady kciuka. Przy 0° widz powinien wskazać kciuk zasłaniający lico, przy 90° brzeg papieru biegnący między palcami, a po obrocie opuszek wskazującego na kratkowanej stronie. Obrys drugiej ręki powinien prowadzić prosto do teczki we wszystkich trzech pozach. Odtwórz bez dźwięku w szerokości 360 px. Jeśli ruch ust rozpoczyna się, zanim widz odróżni spojrzenie na kratki od śledzenia papieru, wydłuż zatrzymanie głowy, zachowując wejście nagrania. Na styku 06/07 porównaj układ dłoni i pochylenie Marty względem rączki.

[Plan i przykłady](PLAN.md) · [Poprzednie ujęcie](../05/SPEC.md) · [Następne ujęcie](../07/SPEC.md)

## Realizacja v3 (autor b01)

Kadr ×2,0 wokół (798,232). 06/0: chwyt (473,347). Obrót: 7 → 0°, 13 → 90° (pasek), 19 → 180° (kratki, wskazujący na rewersie). 06/59: arkusz rewersem do kamery, trzymany za krawędź obrotu (środek krawędzi (609,521)), dłoń (594,376) przed lewą krawędzią teczki; teczka zamknięta (świat (890,326), −12°), ZASIŁEK wystaje. Usta Pawła 27–42 z `dialog.flac`. Marta 52–59 odwraca twarz ku wózkowi i zaczyna pytanie.

## Odbiór

- Klatki 0, 6, 10, 13, 16, 19, 26, 45, 59 obejrzane: przy 0° kciuk na licu, przy 90° cienki przekrój, po obrocie kratki i palec na rewersie; żaden palec nie przebija arkusza. Lewa dłoń trzyma teczkę przez całe ujęcie.
- Wzrok Pawła zatrzymuje się na kratkach 20–26, zanim w 27 ruszają usta.
- **Styk 06/07 (07 ma już `scene.mjs`, blok b07):** 07/0 to inny kadr (profil przy wózku). Różnice do uzgodnienia: w 07 odwrócony URLOP wisi za lewą krawędź nad teczką, a w 06/59 za krawędź obrotu (prawą na rewersie) obok teczki; w 07 jest trzeci druk POTWIERDZENIE, którego w 03–06 nie ma; zdjęcie na teczce w 07 to r1 `grasp(1)`, a w 03–06 obraz 02/53. Zmiany wymagają decyzji koordynatora (nie zmieniam plików b07).
