# Rodzina Oli i pracownica ZUS · wytyczne do nowej animacji

Claude Code, zbuduj historię 00:00–00:38 od pierwszego szkicu. Zachowaj przebieg akcji, polskie nagrania i moment kliku. Cztery plansze leżą obok stołu animatora podczas rysowania. Do filmu trafiają nowe rysunki postaci, otoczenia i rekwizytów. [Scenariusz i dialogi](../../../PLAN-FILMU-DEMO.md) · [Paleta Spokojnej Kartki](../../../DESIGN.md)

## Co poprawiamy

| Miejsce | Co widać albo wynika ze źródła v2 | Zadanie dla animatora |
| --- | --- | --- |
| 00–16 s | Rodzice w szpitalu mają inne kontury i proporcje twarzy niż w kolejce. Profil Marty przy wózku oraz oczy Pawła w kolejnym ujęciu rysują osobne moduły. | Rysownik tworzy jedną serię widoków twarzy obojga. W szpitalu zmieniają się garderoba, poza i oświetlenie. Nos, ucho, linia włosów i żuchwa zachowują konstrukcję. [Klatki filmu v2](../v2/arkusz-30-ujec.jpg) · [Profil z ujęcia 07](../v2/sceny/07/scene.mjs) · [Oczy w ujęciu 08](../v2/sceny/08/scene.mjs) |
| 16–28 s | Wspólny rysunek nadaje dorosłym ten sam obrys głowy i wyprowadza oba rękawy z linii o stałej grubości. Przy okienku pracownica przypomina Martę w jasnym ubraniu. | Zróżnicować kontur i wysokość koka. Zbudować pełną sylwetkę przedramienia i widoczny mankiet. Pokazać dłoń obejmującą krawędź wniosku z dwóch stron. [Źródło v2](../v2/rysunek.mjs) · [Ujęcie przy okienku](../v2/sceny/12/klatki.jpg) |
| 28–38 s | Na planszy sukienka lub spódnica Marty przechodzi nad oboma kolanami. W filmie pojawiają się dwie oddzielne nogawki. Rodzice na kanapie zajmują mały fragment szerokiego kadru i mają podobne pozycje ud, mimo różnych zadań rąk. | Odtworzyć garderobę i oprzeć każde ciało inaczej. Marta trzyma dwa druki na kolanach, Paweł skręca żebra ku stopie. Zbliżyć ich w kadrze tak, aby równocześnie odczytać gest, reakcję i początek fali. [Kanapa z projektu](../referencje/kanapa-przed-fala-v1.png) · [Klatki v2](../v2/sceny/17/klatki.jpg) |

## Modele, które otrzymuje każdy animator

Jedna osoba odpowiada za rysunek całej obsady. Na jednej kartce zestawia rodzinę przy wózku na wspólnej linii podłogi. Obok umieszcza ten sam duet w siadzie oraz trzy widoki twarzy każdego dorosłego w identycznej skali głowy. Zaznacza płaszczyznę oczu, nasadę nosa, ucho, żuchwę, linię włosów i miejsce osadzenia szyi. Z planszy rodziny bierze względny wzrost rodziców, długość tułowia i długość nóg. Zapisuje te pomiary w lokalnych jednostkach modelu. Rysownik odpowiada także za poprawki poszczególnych widoków, gdy ujęcie wymaga nowego kąta. [Rodzina w pełnej sylwetce](../referencje/rodzina-oli-v1.png) · [Wzorzec trzech widoków w Stickman B6](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b6/characters/two-character-three-view-sheet.jpg)

| Osoba | Co przenieść z naszego designu | Próba w ruchu |
| --- | --- | --- |
| Marta | Ciemne włosy zaczesane przez czoło, ucho odsłonięte przy niskim koku, mały kosmyk przy policzku. W kolejce i salonie krótka szałwiowa narzutka, jasny dół o wspólnym obrysie i ciemne baleriny. W szpitalu prosty strój pacjentki. | Spogląda na Olę, po jej oddechu podnosi oczy na Pawła i dopiero wtedy odwraca głowę. Kiedy siedzi, brzeg tkaniny układa się na dwóch udach. [Plansza rodziny](../referencje/rodzina-oli-v1.png) · [Kanapa](../referencje/kanapa-przed-fala-v1.png) |
| Paweł | Wyższy od Marty, asymetryczna wystająca grzywka, wąska dolna część twarzy. Ciemna rozpięta koszula z kołnierzem i widocznymi guzikami, jasny podkoszulek i spodnie. | Przenosi ciężar na jedną nogę, żeby biodrem wyhamować wózek. Na kanapie skręca barki i pochyla się z bioder, pięta wysuwa się z buta. [Kolejka](../referencje/kolejka-zus-v1.png) · [Gest z butem](../referencje/kanapa-przed-fala-v1.png) |
| Ola | Mały kosmyk włosów, miękki policzek i ucho, zamknięte powieki, jeden szeroki zielony pas na kocyku. Wózek ma składaną budkę, skrzyżowane rurki ramy, dwa widoczne koła i czytelną rączkę. | Zgina osobno palce na palcu Pawła, a następnie rozluźnia bark. W wózku oddech porusza kocykiem. Scenariusz przewiduje upływ czasu od narodzin. Szpitalna fotografia zachowuje wczesny wygląd Oli. [Dłoń na zdjęciu, kocyk i wózek](../referencje/rodzina-oli-v1.png) |
| Pracownica ZUS | Szare włosy upięte wysoko, widoczny jasny kołnierzyk i identyfikator. Ujęcie z kolejki daje sylwetkę i strój. Zaprojektować rysunek zbliżenia z łagodniejszą, dojrzalszą linią policzka i spokojnymi brwiami. | Czyta nagłówek, obraca druk ku Marcie, przesuwa palec do daty, dostawia stalówkę, zapisuje termin. Wzrok podąża za czynnością. [Stanowisko po prawej](../referencje/kolejka-zus-v1.png) |
| Osoby w kolejce | Starsza osoba z torbą, klientka z ciemnym bobem i torbą na ramieniu. Sylwetki mają osobne fryzury i różnie rozłożony ciężar. Dalszy plan rysować lżej. | Krok klientki i opóźniony ruch torby wyjaśniają, dlaczego Paweł robi miejsce. Osoba przy okienku odwraca się po odebraniu druku. [Kolejka](../referencje/kolejka-zus-v1.png) |

## Jak zbudować ruch

1. **Obrót głowy.** Narysuj przód, trzy czwarte i profil na tej samej osi szyi. Zrób krótki test obrotu tam i z powrotem, z widocznym przejściem nosa przed dalszym policzkiem. Włosy przynależą do głowy, a kołnierz do tułowia. Daj animatorowi gotowe oczy patrzące na partnera, na dziecko i na kartkę oraz wspólne pozy ust do polskich nagrań. [Pakiet postaci Stickman z osobnymi widokami](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b6/characters/kiosk_keeper/package.json)
2. **Stawy i chwyt.** Ustal długości ramienia i przedramienia oraz pozycje barku, łokcia, nadgarstka i kciuka po obu stronach ciała. Przy ograniczeniu zasięgu ręki przesuń biodra lub obróć obręcz barkową. Kontroluj zgięcie łokcia przez cały łuk. W grafice stosuj zwężenie od barku do nadgarstka i zakładkę dłoni pod mankietem. Przednia część kciuka może zasłonić rekwizyt, a reszta dłoni może pozostać za nim. Pozycję dłoni względem papieru zapisz w momencie dotyku. Przy przekazaniu obie osoby przez chwilę dzielą ten sam punkt kontaktu. [Testy sięgania, podawania i odbierania ze Stickman](https://github.com/kaomei/stickman-video-director/blob/cf78fdb077ce6c9aa43e22786e9f2d0aa122af2d/skills/directing-stickman-videos/assets/b6/characters/action-envelope-report.json)
3. **Ciężar i ruch drugoplanowy.** Przy staniu trzymaj podporową stopę w przestrzeni podłogi. Przy siadaniu najpierw obniża się miednica, potem ugina poduszka i rozkłada się tkanina. Przy sięganiu po but najpierw zmienia się podparcie, później do ruchu dołączają żebra i głowa. Obejrzyj dolny rząd faz Stickman, w którym zmiana pozy barku i łokcia umożliwia utrzymanie ręki przy blacie. W przykładzie B6 testowano konkretne gesty na miejscu. Dla naszego kroku, siadu i zdjęcia buta potrzebne są próby z rzeczywistą kanapą i wózkiem. [Arkusz faz](../v2/przyklady/fazy-ruchu.png) · [Dwie pozy z rekwizytem](../v2/przyklady/pozy-postaci.png)
4. **Kamera i fala.** Użyj oddzielnych planów salonu, rodziny i bliższych papierów. Z przykładu Video Shotcraft weź rozdzielenie planów głębi. Na klik zatrzymaj całą rodzinę w jednej pozie, zmiękcz salon i zachowaj ostry kontur oryginalnego Zusika przed stosem. Rozmycie zaczyna się dopiero po czytelnym kontakcie łokcia z papierem. [Przykład kamery wieloplanowej](https://github.com/Vincentwei1021/video-shotcraft/blob/59f3e9b9e936ff2bce0e18446226d770a3f2f61f/demos/camera/depth-layer-moves/MultiplaneReal.tsx) · [Układ finału](../referencje/fala-formularzy-zusik-v1.png)

## Co oddaje autor ujęcia

W swoim planie autor wskazuje postać, wspólny widok modelu, intencję i przedmiot kontaktu. W specyfikacji zapisuje, która dłoń prowadzi ruch, kiedy rekwizyt zmienia właściciela, co podtrzymuje ciężar i jaką pozę przejmuje następne ujęcie. Nową pozę potrzebną do konkretnego gestu odsyła właścicielowi modeli, który dopisuje ją do wspólnego zestawu. Po zatwierdzeniu poprawek render obejmuje wskazane ujęcie, a połączenie sprawdzamy z kilkoma klatkami sąsiadów.

Do pierwszej próby fali 36–40 s obejrzyj dodatkowo trzy krótkie fragmenty robocze postaci na stole animatora. W makro narodzin porównaj ułożenie palców z fotografią. W obrocie głowy Marty zamień kolejno trzy widoki i zestaw je z portretem. Przy butach i teczce obejrzyj stopy oraz obie dłonie najpierw bez papieru, potem z kompletem rekwizytów. Pozostałą część fabularną składaj z tych samych modeli.

**Odbiór obrazu.** Odtwórz każdy wymagający gest bez dźwięku w 720p, potem cofnij po jednej klatce przez kontakt i puszczenie. Na klatkach granicznych porównaj położenie barku, łokcia, mankietu, pięty i rekwizytu. Przy ruchomej kamerze porównuj ich wzajemne położenie po sprowadzeniu obu klatek do tej samej skali. Mierz długości segmentów w lokalnym układzie postaci przed rzutowaniem. Zmiany długości widocznej na ekranie powinny wynikać z obrotu lub świadomie narysowanego skrótu perspektywicznego. Sprawdź, czy w 360 px obie twarze wciąż można odróżnić i wskazać, na co patrzą. Sam test wartości liczbowych nie oceni rysunku policzka ani czytelności chwytu. Zapisz przy ujęciu klatkę przed kontaktem, klatkę kontaktu, pozycję pod obciążeniem i klatkę puszczenia.

## Rewizja r1 · wspólne modele

Rewizja r1 to pierwszy wspólny zestaw postaci, tła i rekwizytów dla v3. Każde ujęcie importuje go przez `zestaw.mjs` jako `k`, z polem `k.rewizja === "r1"`. Kod leży w [`obsada/obsada.mjs`](obsada/obsada.mjs) i [`obsada/rekwizyty.mjs`](obsada/rekwizyty.mjs). Funkcje zwracają fragmenty SVG w kadrze 1280 × 720 i działają w przeglądarce i w Node. [Plansza obsady](obsada/plansza-obsady-r1.png) · [Test obrotu, chwytu i siadu](obsada/test-obrotu.mp4) · [Regresja v2 → r1](obsada/regresja-v2-v3.png)

**Co zawiera.** Pełne postaci Marty, Pawła i pracownicy, Olę, salon z osobnymi warstwami kanapy, wózek, teczkę ze zdjęciem chwytu, druki, but, kolejkę i salę szpitalną. Każda głowa to jedna konstrukcja na osi szyi. Widok z przodu, ¾ i profil powstają z tych samych punktów, więc oczy, nasada nosa, ucho, żuchwa i linia włosów leżą zawsze na tych samych wysokościach. Marta ma niski kok, zaczesaną grzywkę, odsłonięte ucho i kosmyk przy policzku. Paweł ma asymetryczną, sterczącą grzywkę i węższą żuchwę. Pracownica ma szary, wysoki kok, jasny kołnierzyk, identyfikator i pełniejszą linię policzka. Spódnica Marty w siadzie ma jeden obrys nad obojgiem kolan.

**Jednostki.** Postać rysujemy w jednostkach modelu, z zerem w środku bioder. Głowa od czubka do brody ma 100 jednostek, a u Pawła 104. Na ekranie punkt ma współrzędne `x + s·lx`, `y + s·ly`. Długości ramienia i przedramienia są stałe: Marta 70 i 64, Paweł 76 i 70, pracownica 68 i 62. Jeśli dłoń nie sięga celu, najpierw przesuwa się bark, najwyżej o 10 jednostek. Gdy to nie wystarcza, ręka się prostuje i dłoń zatrzymuje się przed celem, a rękaw się nie rozciąga. Pełna lista stawów jest w nagłówku `obsada.mjs`.

**Wywołanie.**

```js
k.person("pawel", {
  x: 800, y: 490, s: 1.28, seat: true,          // środek bioder i skala
  bow: .8, lean: 10, twist: -.3,                  // skłon z bioder, przechył, skręt barków
  head: -.3, nod: .7, gaze: -.3, gazeDown: .8,   // head: −1 profil w lewo, 0 przód, 1 profil w prawo
  brow: -.7, lid: .3, mouth: 0, viseme: "A",      // usta: mouth 0–1 albo viseme A/O/E/M/U
  left: [-62, -40, -56, -38],                     // [łokieć x,y, nadgarstek x,y] względem bioder, przed skalą
  right: [56, -29, 18, -88],                      // łokieć wybiera tylko stronę zgięcia
  leftGrip: "pinch", rightGrip: "open",           // open | pinch | hold | point | grab
  shoes: ["sock", "shoe"], heelOut: [0, .6],      // stopy po lewej i prawej stronie ekranu
  parts: "body",                                   // "body", potem rekwizyt na kolanach, potem "arms"
});
const j = k.joints("pawel", poza);                // gripL/gripR = punkt styku dłoni w px, reachL/reachR
k.head("marta", { x, y, s, head: .5 });           // sama głowa do zbliżeń
k.ola({ x, y, s, breath: .5, facing: 1 });        // Ola z kocykiem z jednym zielonym pasem
```

Kolejność rysowania na kanapie: `k.salon()` (zawiera `sofaBack()`), potem `person(..., {parts:"body"})` obojga, potem teczka i druki na kolanach, potem `parts:"arms"`, potem `k.sofaFront()` (podłokietniki). Rękę, która wisi przed podłokietnikiem, rysujemy po `sofaFront()`, jak prawą rękę Pawła z butem.

**Gotowe pozy na kanapie.** `k.sofaPose(rola, wariant, nadpisania)` zwraca pełną pozę. `k.SOFA` podaje biodra Marty (427,490), Pawła (800,490), skalę 1,28, siedzisko y ≈ 494 i podłogę pod stopami y ≈ 692. Dzięki tej skali rodzice zajmują kadr od czubka głowy (w prostym siadzie y ≈ 125 u Pawła i 150 u Marty) do stóp. Warianty:

| Wariant | Marta | Paweł |
| --- | --- | --- |
| `przekazanie` (18/59 → 19/0) | Kolana razem, stopy obok siebie. Szczypie URLOP i ZASIŁEK na kolanach, chwyty w ≈ (399,486) i (460,485). Patrzy w dół, na róg u Pawła. | Skłon z bioder (`bow .8`), barki skręcone. Prawy łokieć na stosie w (872,452), prawy nadgarstek przy piersi. Lewy kciuk i palec wskazujący na krótkim brzegu ZASIŁKU w (759,465). Skarpety, kolana szeroko, prawa stopa wysunięta. |
| `plansza` (kanapa przed falą) | Jak wyżej, głowa ku drukom. | Lewa dłoń sięga do stosu (`grab`). Prawa ręka wisi przy podłokietniku i trzyma but za zapiętek, chwyt w (932,516). |
| `siad` (koniec 15) | Dłonie na udach, patrzy na Pawła. | Dłonie na udach, patrzy na Martę, oba buty na nogach. |

Uwaga dla 18 i 19: liczby łokci i nadgarstków w SPEC tych ujęć pochodzą z modelu v2 przy s = 1,16. Ciało r1 ma inne proporcje, więc te liczby zastępuje `sofaPose(..., "przekazanie")`. Zachowane są punkty w kadrze: teczka (688,493) o szerokości 300 i kącie −3°, stos (817,455), łokieć (871,453).

**Punkty chwytu rekwizytów.** Funkcje `k.folderPoint`, `k.paperPoint`, `k.shoePoint` i `k.pramPoint` przyjmują te same argumenty co rysunek i nazwę punktu, a zwracają piksele.

| Rekwizyt | Zakotwiczenie | Punkty chwytu |
| --- | --- | --- |
| `folder(x,y,w,kąt,open)` | środek, `w` = szerokość na ekranie | `spine` (grzbiet), `edge` (wolny brzeg), `top`, `bottom`, `cornerTR`, `cornerBR`, `cornerBL`. Przy (688,493,300,−3,1): grzbiet (688,493), brzeg (838,485). Okładka ma zdjęcie narysowane z `grasp(1)`. |
| `paper(x,y,w,h,kąt,{header,fold,bend,curl,lift})` | środek | `edgeL`, `edgeR`, `top`, `bottom`, cztery narożniki, `header` (miejsce na palec przy nagłówku). ZASIŁEK na stosie (814,455,100,126,−3): lewy krótki brzeg w (764,458). |
| `shoe(x,y,kąt,s,{hang,flip})` | x,y = zapiętek (punkt chwytu) | `heel`, `toe` (+46,+4)·s, `sole` (+16,+13)·s. Na podłodze y = podłoga − 13·s. `hang:true` oznacza but zwisający noskiem w dół. |
| `pram(x,y,s,{breath,roll,hood})` | środek między osiami kół | `handle` (−150,−196)·s, `hinge` (92,−160)·s, `ola` (44,−184)·s |

Dłoń ma własny punkt styku dla każdego chwytu, liczony od nadgarstka wzdłuż przedramienia: open (22,2), pinch (25,−3) między kciukiem a palcem wskazującym, hold (15,2) w pięści, point (31,−2) na opuszce, grab (22,6). Wszystkie wartości mnożymy przez rozmiar dłoni. W klatce kontaktu ustaw rekwizyt tak, żeby jego punkt chwytu leżał w `joints().gripL/gripR`. Przykład dociągania nadgarstka do brzegu kartki jest w funkcji `solveWrist` w `plansza.mjs`.

**Pliki próby.** `node v3/obsada/plansza.mjs all` tworzy w `v3/obsada/` trzy pliki. [`plansza-obsady-r1.png`](obsada/plansza-obsady-r1.png) pokazuje rodzinę przy wózku i pracownicę na jednej podłodze, duet na kanapie, szpital oraz trzy widoki głowy z liniami konstrukcyjnymi. [`test-obrotu.mp4`](obsada/test-obrotu.mp4) ma 90 klatek: obrót głowy Marty i Pawła w przeciwne strony, a potem chwyt brzegu kartki w czterech fazach (przed kontaktem, kontakt, obciążenie, puszczenie) obok siadu. [`regresja-v2-v3.png`](obsada/regresja-v2-v3.png) zestawia głowy v2 z ujęć 01, 07 i 08 z widokami r1. Klatki robocze leżą w `v3/robocze/obsada/`.

**Sprawdzone wzrokowo.** Proporcje w spoczynku, w skrajnej pozie (skłon Pawła na stos) i w połowie obrotu głowy. Przy szerokości 360 px twarze rodziców da się odróżnić po koku i grzywce, a kierunek spojrzenia widać po skręcie głowy. W siadzie miednica leży na siedzisku, kolana są zgięte, a stopy stoją na podłodze.

**Znane ograniczenia r1.**
- Tułów i nogi rysujemy tylko od przodu, z przechyłem, skłonem i skrętem barków. Profil ciała, potrzebny na przykład w 07 przy wózku, wymaga osobnej pozy. Zgłaszajcie ją właścicielowi modeli.
- Uda w siadzie są mocno skrócone, bo widzimy je od przodu. But zsuwany z pięty (`heelOut`) pokazuje tylko unoszącą się skarpetę.
- Każda dłoń ma pięć gotowych kształtów. Palce osobno porusza tylko zbliżenie `grasp(p)`.
- Ola ma jedną pozę: śpi pod kocykiem. Jej dłoń na palcu jest tylko w `grasp()`.
- Otwarta teczka leży płasko. Nie ma wariantu otwartej teczki w kształcie litery V z planszy kanapy.
- Kolory włosów i kardiganu pracownicy, sukienki Marty, koszuli szpitalnej i odcieni kanapy nie występują w DESIGN.md. W kodzie oznaczono je „do weryfikacji”.
- `queue()` i `ward()` są prostymi tłami bez statystów. Siad w teście to szkic ruchu, a nie gotowa animacja ujęcia 15.
