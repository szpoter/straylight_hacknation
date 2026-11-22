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

## Realizacja v3 (autor s19, blok b19)

- **Rewizja modeli:** r1 (`k.rewizja`). Kod jest w [`scene.mjs`](scene.mjs). Eksportuje `scene`, `frozenRoom(k,f)` (kadr bez Zusika) oraz stałe `FREEZE = 52` i `ZUSIK`.
- **Wejście 18/59 → 19/0:** `sofaPose("marta"|"pawel","przekazanie")` bez nadpisań, kolejność warstw jak w `plansza.mjs → sofaScene`. ZASIŁEK na stosie stoi w (814,455) pod kątem −3°, arkusz pod nim w (826,462) pod kątem 8°. Arkusze Marty: URLOP (388,478) i ZASIŁEK (468,482). Buty stoją w (690,676) i (912,678). Pod arkuszem prowadzącym leżą jeszcze dwa arkusze (reszta stosu i arkusz B), dokładnie na jego miejscu. Rysuję je dopiero od kl. 4, kiedy prowadzący rusza, więc w kl. 0–3 obraz jest taki sam jak w 18/59.
- **Warstwy:** salon → ciała → teczka → stos (reszta, B, prowadzący, ZASIŁEK; do kl. 29) → druki Marty → buty → lewa ręka Marty → `sofaFront()` → prawa ręka Pawła. Kolejność jest taka jak w `sceny/15/kanapa.mjs` w kl. 1079. Wszystko to jest w grupie z filtrem `feGaussianBlur` (id `s19-defocus`). Nad nią leżą luźne kartki, górny wachlarz, arkusz B (od 30), dolny wachlarz, prowadzący arkusz (od 30), ZASIŁEK (od 30) i ręce sięgające (lewa Pawła, prawa Marty, z tym samym filtrem po kliku). W kl. 30 B i prowadzący nie stykają się już z niczym z salonu, więc zmiana warstwy jest niewidoczna.
- **Kontakty:** chwyt ZASIŁKU idzie za `joints("pawel").gripL` do kl. 29, a w 30 dłoń się otwiera. Łokieć leży na stosie przez całe ujęcie i podnosi się o 6 jednostek w 14–18. Dłoń Marty przy (570,467) w kl. 39 jest pod dolną krawędzią arkusza. W kl. 51 obie dłonie są otwarte poniżej grzbietu arkusza.
- **Wyjście 19/59 → 20/0:** pełny obraz kl. 59 (zatrzymany stan z kl. 52, rozmycie 2,6 px) i Zusik `k.zusik(640,325,270,0)`. Scena 20 woła `scene19(59,k)`.

## Odbiór

- Sprawdzone klatki: 0, 13, 20, 30, 35, 37, 39, 40, 46, 51, 52, 53, 59 (`robocze/b19/k`) oraz arkusz co 4 klatki z klipu `podglady/36-40-fala-v3.mp4`.
- Zatrzymanie: SVG z kl. 52–59 jest identyczne po pominięciu filtra i Zusika (po normalizacji identyfikatorów `hs*/hh*`, które licznik modelu r1 nadaje przy każdym wywołaniu). Test: `node robocze/b19/eq.mjs`.
- Twarze: w 51, 52 i 59 obie twarze są w pełni widoczne nad pasem papieru. Głowy odchylają się od środka (`lean`), więc Zusik ich nie zasłania. W podglądzie 320 px rodziców da się rozróżnić po koku i grzywce, a widać też, że patrzą na środek.
- Gest: źródło fali (spod łokcia), ruch arkusza B po kolanach i ręka Marty, która mija róg (36–39), są czytelne bez dźwięku. Klik w efektach wypada w 1131/1132, a zatrzymanie w 1132.
- Styk 18/59 → 19/0 z oddaną sceną 18 (`kanapa.mjs`): w renderze sekwencyjnym 1079 → 1080 różnią się 3 piksele, maks. 9/255, w okolicy barku Marty. To efekt innego zagnieżdżenia grup, który w filmie jest niewidoczny. Test: `node robocze/b19/eq18.mjs`.
- Uwagi otwarte: (1) Brak. (2) Kolory papieru i rozmycie pochodzą z modelu r1 i są „do weryfikacji” w DESIGN.md. (3) Prośba do autora modeli: stałe identyfikatory clipPath w `headSvg`, bo dziś rosną przy każdym wywołaniu.
