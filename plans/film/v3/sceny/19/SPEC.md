# 19 · Styki papieru, gestu i ostrości

Autor planu: s19

Klatki filmu 1080–1139, lokalnie 0–59 przy 30 kl./s. Podgląd 1280 × 720. Kamera stoi na osi sceny 18. Wszystkie kierunki ruchu odnoszą się do stron ekranu.

**18/59 → 19/0.** Przejąć końcowy kadr sceny 18. Otwarta teczka ma środek (688,493), szerokość 300 px i obrót −3°. Środek stosu wypada w (817,455), prawy łokieć Pawła w (871,453), a prawy nadgarstek przy piersi. Lewa dłoń trzyma krótki brzeg „ZASIŁKU”. Spod niego wystaje drugi arkusz. Marta patrzy na ten róg, obie dłonie ma na własnych kolanach. Oba buty pozostają na podłodze. Biodra Marty w (427,490), Pawła w (800,490), skala 1,16. [Pozycje łokci i nadgarstków](../18/SPEC.md)

| Klatki | Ustawienie i dźwięk |
| --- | --- |
| 0–13 | W kl. 0 utrzymać styk mankietu ze stosem oraz wskazującego palca z wierzchem „ZASIŁKU”. Na 4–9 lewa ręka Pawła pociąga druk o szerokość kilku palców. Na 10–13 pod arkuszem rośnie łuk, a przyciśnięta krawędź nadal znika pod rękawem. Tu zaczyna narastać jeden szelest. |
| 14–35 | Na 14–18 zarys dolnego arkusza wychodzi spod rękawa. Na 19–23 jego podwinięty róg przecina krawędź następnego druku i popycha go po udzie Marty. Na 24–29 źrenice Marty skręcają do środka, a potem rusza bark. Na 30–35 lewy kciuk i palec wskazujący Pawła otwierają się nad uciekającym papierem, prawa ręka Marty podchodzi od dołu. |
| 36–51 | W kl. 36–39 zostawić prześwit między palcami Marty i rogiem. Następna kartka na moment zasłania jej nadgarstek. Do kl. 51 grzbiet prowadzącego arkusza dochodzi w okolice (640,325). Teczka, oba kolana i przynajmniej część każdej twarzy pozostają widoczne. Szelest osiąga pełnię tuż przed klikiem. |
| 52–59 | Lokalna 52 to globalna 1132, czyli 37,733 s. Początek suchego kliku wypada na pierwszą klatkę zatrzymania. Szelest urywa się, ustaje ruch dłoni, źrenic i kartek. Na 52–53 rozmyć tylny plan z salonem i rodzicami, zachowując czytelne kontury przednich formularzy. Na 53 pokazać oryginalnego Zusika w stanie `available`, z refleksami, cieniem i ramionami w spoczynku. |

**19/59 → 20/0.** Środek Zusika (640,325), ramka 270 × 270 px, spojrzenie do widza. Przekazać cały obraz z 19/59 wraz z tłem, cieniem, źrenicami i obrysem grzbietu fali. Klatki 20/0–5 utrzymują ten stan. Potem 20 rozpoczyna zmianę tła i osiadanie maskotki. [Oryginalny Zusik](../../../../../app/src/components/mascot/Zusik.tsx) · [Pozy maskotki](../../PRODUKT.md) · [Ujęcie 20](../20/SPEC.md)

**Wykonanie.** W Konva oddzielić rękaw, chwyt i arkusze. Pierwsze dwa styki ustawić ręcznie. Scene.js ustala kolejne zgięcia dolnego rogu, Anime.js opóźnia następujące po sobie arkusze, a Planck.js przejmuje wybrane luźne kartki po oderwaniu. Wspólny numer klatki HyperFrames zatrzymuje wszystkie warstwy. Pozę spóźnionego chwytu porównać z arkuszem rysunkowym Stickman. Przy wysunięciu drugiej kartki wzorować zakładkę na przesuniętych kartach Video Shotcraft. [Stickman · arkusz faz ruchu](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b1/approved-2026-10-23-motion-sheet.png) · [Video Shotcraft · stos kart](https://github.com/Vincentwei1021/video-shotcraft/blob/59f3e9b9e936ff2bce0e18446226d770a3f2f61f/gallery/media/poster/card-stack.jpg)

**Test odbioru.** Wyciszyć 36–40 s i poprosić widza, by wskazał dociskający łokieć, pierwszą uciekającą kartkę i rękę Marty mijającą jej róg. Na kl. 51, 52 i 53 sprawdzić kolejność ruchu, zatrzymania i pojawienia się maskotki. Porównać obrys fali w 52 i 59 oraz nałożyć 19/59 na 20/0. Na szerokości 360 px oczy Zusika i obie twarze mają pozostać rozpoznawalne. Po włączeniu dźwięku sprawdzić początek kliku na 1132 i ciszę po jego wybrzmieniu.
