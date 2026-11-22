# Ruch v3.1 · model r2 i próba 11–12

**Próba D przechodzi testy ujęć 11 i 12.** Rzeczywiste pozy trzech aktorów, wózek, teczka, kartka i wszystkie kontakty przechodzą przez cięcie 11/59 → 12/0 we wspólnym układzie planu. Oba maksymalne przyspieszenia mieszczą się w 12°/kl².

## Skąd pochodzą pozycje

Scena oblicza `motionFrame(f,k)` raz dla klatki 0–59. Zwraca pozy aktorów, kontakty, podpory, pozycje rekwizytów i kamerę. Funkcja `scene(f,k)` rysuje ten sam stan. Klatki można odtwarzać w dowolnej kolejności. Przy cięciu `endPose(previousMotionFrame,k)` pobiera i zapamiętuje wynik rzeczywistej klatki 59 poprzedniego modułu.

`pose.r2=true` włącza model. Lokalny początek leży pośrodku miednicy. Oś x biegnie w prawo, y w dół. Długości ramienia i przedramienia pochodzą z karty ciała w `obsada.mjs`, a długości uda i goleni z pozy stojącej tej samej postaci. Rzut odcinka ku kamerze może się skracać. Test mierzy jego długość z uwzględnieniem głębi. `bodyView` płynnie obraca wspólną konstrukcję tułowia i nóg od frontu przez ±0,5 (¾) do ±1 (profil). `k.babyHand(layer, close, {thumb, press})` udostępnia model otwartej i zamykającej się dłoni Oli z ujęcia szpitalnego.

## Poza swobodna i docelowa

- Pozy płaskie zapisuje się jako `pose.angles.left/right = [bark, łokieć, nadgarstek]` i `legL/legR = [biodro, kolano, kostka]`. Pierwsza wartość to orientacja odcinka, następne opisują obrót względem poprzedniego. `angleKeys(f,keys)` prowadzi kąty najkrótszym łukiem z łagodnym początkiem i końcem. Ruch tułowia i głowy wykorzystuje osie `lean`, `head`, `nod`, `tilt` oraz klucze ujęcia.
- Końcowy chwyt jest punktem w układzie kartki lub rekwizytu. `attachment(prop,local)` stosuje obrót, skalę i przesunięcie. `reach(role,pose,side,target,weight)` zapisuje więzy. Płaski solver utrzymuje znak łokcia przez cały gest. Obręcz może przesunąć się najwyżej o 12 jednostek. Dalszy niedobór zasięgu wymaga kroku, skłonu lub przestawienia rekwizytu. W przeciwnym razie test pokaże odległość od celu.
- Przy niesieniu kartki w poprzek klatki piersiowej `downPole.left/right` podaje głębokość celu względem barku w jednostkach modelu. Konstrukcja dwusegmentowa utrzymuje łokieć w płaszczyźnie wyznaczonej przez kierunek celu i stały kierunek w dół oraz w głąb. `spatialAngles(arm)` zapisuje azymut i wzniesienie ramienia, zmianę azymutu przedramienia oraz jego wzniesienie. Klucze w `pose.spatial` prowadzą rękę swobodnie przed przypięciem. W próbie D przez cztery klatki waga przechodzi z 0 do 1. Skrót przedramienia i dłoni wynika z rzutu tej samej konstrukcji.
- Przy makrze `pose.handAngle[side]` ustala kierunek palca w stopniach w świecie płaskiej sceny. `pose.roll[side]` obraca dłoń wokół osi przedramienia. Linia mankietu podąża za łokciem i zachodzi na początek dłoni.
- `gripKeys(f, [[0,"open"],[24,"pinch"]])` rozpoczyna zmianę w 20 i kończy w 24. Obrys palców i obrys kciuka mają osobne fazy. Kciuk domyka się później. Punkt chwytu interpoluje się razem z dłonią. `pinWindow(f,start,end,fade)` utrzymuje pełną wagę od `start` do `end`, obie rampy trwają przynajmniej trzy klatki.
- Stojąca stopa ma jeden stały cel w świecie na całe okno podpory. W siadzie przemieszczenie kolana w głąb wynika z położenia miednicy i kostki. Początkową wysokość miednicy trzeba dobrać do rzeczywistych długości nóg.

## Dane do pomiaru

Na kanapie `seatPerspective:true` zachowuje widziane z kamery położenie kolana i podpartej kostki. Model znajduje kolano na promieniu kamery w odległości jednego uda od biodra, a następnie kostkę w odległości jednej goleni od kolana. Bliższe kolano i cofnięta kostka dają skrót znany z planszy obsady. Test mierzy oba odcinki na trzech punktach przestrzennych przed rzutowaniem na obraz.

`motionFrame` podaje `actors` jako mapę nazwy postaci na pozę. W `contacts` i `supports` każdy wpis ma `role`, `joint`, `id` i `target` w przestrzeni sceny. `props` przechowuje punkty odniesienia rekwizytów. Kamera może mieć pola `z,cx,cy` lub macierz SVG `[a,b,c,d,e,f]`. Model szczegółu może wyeksportować własne punkty przez `details`; `visible` ogranicza zestaw do narysowanych części. `sampleShot(id,f)` przelicza punkty na podgląd 1280 × 720.

Przy zmianie dekoracji `cutTransform` przelicza układ całej sceny, a `cutKeys` wymienia wspólne punkty. Przestawienie konkretnej postaci wymaga opisania przesunięcia w SPEC i wpisu do `cutOffsets`. Test pokazuje osobno `cutWorld` przed takim wyrównaniem i `cutPx` po nim. Zmiana między postacią na fotografii i osobą trzymającą fotografię może mieć osobny `segment`.

## Uruchomienie

```sh
node ruch/test.mjs --self
node ruch/test.mjs 11 12
node build.mjs --only 11,12 --out robocze/rig
FILM_HTML=robocze/rig/index.html node klatki.mjs robocze/rig 623 624 637 641 671 672 675 682
```

Test jednostkowy obejmuje trzy role, widoki, stałe długości, dokładność chwytu, limit ruchu barku, fazy kciuka, rampy i pobranie ostatniej klatki. Odbiór scen bada 60 rzeczywistych klatek. Wymaga odchyłki długości poniżej 0,5%, kroku kątowego najwyżej 20°/kl., przyspieszenia najwyżej 12°/kl², odległości od celu i ślizgu stopy najwyżej 1 px oraz odchylenia pozy na cięciu najwyżej 4 jednostek w skali sceny. Osobne asercje wymagają obecności obu rąk na jednym punkcie podczas 11/36–39 i 12/13–17. Wynik przekroczenia daje kod wyjścia 1. Test wyświetla maksimum z każdej kategorii; wyniki poszczególnych ujęć opisują SPEC 11 i 12.

## Podpora i puszczenie w próbie D

`walkPose(base,rig,f,tracks,prepare)` przyjmuje osobne czasy oderwania i lądowania obu stóp oraz położenia docelowe na podłodze. Między nimi pięta zakreśla łuk. Miednica podąża za środkiem między stopami. Konstrukcja oblicza ich poziome odległości od stawów biodrowych i obniża miednicę na tyle, aby oba kolana miały zapas zgięcia. Przygotowanie rozpoczyna się dwanaście klatek przed pełnym przeniesieniem ciężaru. Stopa podporowa przez całe okno pozostaje na podłodze.

Paweł przechodzi z biodrami do x=850 jeszcze w 11. Marta kończy krok przy x=433,5, z dłonią na rączce toczącego się wózka. Kamera 12 obejmuje ten sam plan przy zbliżeniu 1,35×. Przy puszczeniu kartki dłoń Pawła nadal jedzie z jej narożnikiem, kiedy więzy wygasają w 18–21. Następnie łokieć przechodzi przez pozę pośrednią 26 i ręka kończy na teczce w 36. Test porównuje na cięciu także identyfikatory kontaktów i ich punkty w świecie.

W starszej próbie C miednica miała stałą wysokość, kolano gwałtownie rozpoczynało zgięcie po lądowaniu, a łokieć Pawła od razu wracał po prostej do teczki. Jej wyniki pozostały w historii Git w commicie `e18773c`.
