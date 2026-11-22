# Ruch v3.1 · model r2 i próba 11–12

**Status próby C: zatrzymana.** Dojście ręki do narożnika zachowuje długość kości, kontakt i ciągły biegun. Przyspieszenia w kolanach i łokciu przekraczają kryterium odbioru. Migracja kolejnych ujęć wymaga przyjęcia ruchu w obu scenach próbnych.

## Skąd pochodzą pozycje

Scena oblicza `motionFrame(f,k)` raz dla klatki 0–59. Zwraca pozy aktorów, kontakty, podpory, pozycje rekwizytów i kamerę. Funkcja `scene(f,k)` rysuje ten sam stan. Klatki można odtwarzać w dowolnej kolejności. Przy cięciu `endPose(previousMotionFrame,k)` pobiera i zapamiętuje wynik rzeczywistej klatki 59 poprzedniego modułu.

`pose.r2=true` włącza model. Lokalny początek leży pośrodku miednicy. Oś x biegnie w prawo, y w dół. Długości ramienia i przedramienia pochodzą z karty ciała w `obsada.mjs`, a długości uda i goleni z pozy stojącej tej samej postaci. Rzut odcinka ku kamerze może się skracać. Test mierzy jego długość z uwzględnieniem głębi. `bodyView` płynnie obraca wspólną konstrukcję tułowia i nóg od frontu przez ±0,5 (¾) do ±1 (profil). `k.babyHand(layer, close, {thumb, press})` udostępnia model otwartej i zamykającej się dłoni Oli z ujęcia szpitalnego.

## Poza swobodna i docelowa

- Pozy płaskie zapisuje się jako `pose.angles.left/right = [bark, łokieć, nadgarstek]` i `legL/legR = [biodro, kolano, kostka]`. Pierwsza wartość to orientacja odcinka, następne opisują obrót względem poprzedniego. `angleKeys(f,keys)` prowadzi kąty najkrótszym łukiem z łagodnym początkiem i końcem. Ruch tułowia i głowy wykorzystuje osie `lean`, `head`, `nod`, `tilt` oraz klucze ujęcia.
- Końcowy chwyt jest punktem w układzie kartki lub rekwizytu. `attachment(prop,local)` stosuje obrót, skalę i przesunięcie. `reach(role,pose,side,target,weight)` zapisuje więzy. Płaski solver utrzymuje znak łokcia przez cały gest. Obręcz może przesunąć się najwyżej o 12 jednostek. Dalszy niedobór zasięgu wymaga kroku, skłonu lub przestawienia rekwizytu. W przeciwnym razie test pokaże odległość od celu.
- Przy niesieniu kartki w poprzek klatki piersiowej `downPole.left/right` podaje głębokość celu względem barku w jednostkach modelu. Konstrukcja dwusegmentowa utrzymuje łokieć w płaszczyźnie wyznaczonej przez kierunek celu i stały kierunek w dół oraz w głąb. `spatialAngles(arm)` zapisuje azymut i wzniesienie ramienia, zmianę azymutu przedramienia oraz jego wzniesienie. Klucze w `pose.spatial` prowadzą rękę swobodnie przed przypięciem. W próbie C przez cztery klatki waga przechodzi z 0 do 1. Skrót przedramienia i dłoni wynika z rzutu tej samej konstrukcji.
- Przy makrze `pose.handAngle[side]` ustala kierunek palca w stopniach w świecie płaskiej sceny. `pose.roll[side]` obraca dłoń wokół osi przedramienia. Linia mankietu podąża za łokciem i zachodzi na początek dłoni.
- `gripKeys(f, [[0,"open"],[24,"pinch"]])` rozpoczyna zmianę w 20 i kończy w 24. Obrys palców i obrys kciuka mają osobne fazy. Kciuk domyka się później. Punkt chwytu interpoluje się razem z dłonią. `pinWindow(f,start,end,fade)` utrzymuje pełną wagę od `start` do `end`, obie rampy trwają przynajmniej trzy klatki.
- Stojąca stopa ma jeden stały cel w świecie na całe okno podpory. W siadzie przemieszczenie kolana w głąb wynika z położenia miednicy i kostki. Początkową wysokość miednicy trzeba dobrać do rzeczywistych długości nóg.

## Dane do pomiaru

`motionFrame` podaje `actors` jako mapę nazwy postaci na pozę. W `contacts` i `supports` każdy wpis ma `role`, `joint`, `id` i `target` w przestrzeni sceny. `props` przechowuje punkty odniesienia rekwizytów. Kamera może mieć pola `z,cx,cy` lub macierz SVG `[a,b,c,d,e,f]`. Model szczegółu może wyeksportować własne punkty przez `details`; `visible` ogranicza zestaw do narysowanych części. `sampleShot(id,f)` przelicza punkty na podgląd 1280 × 720.

Przy zmianie dekoracji `cutTransform` przelicza układ całej sceny, a `cutKeys` wymienia wspólne punkty. Przestawienie konkretnej postaci wymaga opisania przesunięcia w SPEC i wpisu do `cutOffsets`. Test pokazuje osobno `cutWorld` przed takim wyrównaniem i `cutPx` po nim. Zmiana między postacią na fotografii i osobą trzymającą fotografię może mieć osobny `segment`.

## Uruchomienie

```sh
node ruch/test.mjs --self
node ruch/test.mjs 11 12
node build.mjs --only 11,12 --out robocze/rig
FILM_HTML=robocze/rig/index.html node klatki.mjs robocze/rig 623 624 637 641 671 672 675 682
```

Test jednostkowy obejmuje trzy role, widoki, stałe długości, dokładność chwytu, limit ruchu barku, fazy kciuka, rampy i pobranie ostatniej klatki. Odbiór scen bada 60 rzeczywistych klatek. Wymaga odchyłki długości poniżej 0,5%, kroku kątowego najwyżej 20°/kl., przyspieszenia najwyżej 12°/kl², odległości od celu i ślizgu stopy najwyżej 1 px oraz odchylenia pozy na cięciu najwyżej 4 jednostek w skali sceny. Osobne asercje wymagają obecności obu rąk na jednym punkcie podczas 11/36–39 i 12/13–17. Wynik przekroczenia daje kod wyjścia 1. Test wyświetla maksimum z każdej kategorii; szczegółowe zakresy próby C opisują SPEC 11 i 12.

## Granica zastosowania próby

W trzeciej wersji największe przyspieszenia dały wyprostowane nogi w chwili zmiany podpory i oddanie ciężaru kartki. Dalszy wariant wymaga osobnej decyzji po wyczerpaniu trzech prób. Możliwe rozwiązanie obejmuje ciągłe klucze miednicy i kolan w czasie lądowania oraz dodatkową pozę pośrednią łokcia przy powrocie ręki do teczki.
