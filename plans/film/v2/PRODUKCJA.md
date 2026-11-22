# Wspólna specyfikacja wykonawcza v2

Każdej scenie odpowiada katalog o dwucyfrowym numerze, indywidualny subagent oraz trzy osobne pliki. Najpierw autor zapisuje PLAN.md (reżyseria, etapy, przebieg gestu), następnie SPEC.md (parametry, pozy na klatkach, dźwięk, przejęcie sąsiednich ujęć, kryteria odbioru), potem wykonuje własny scene.mjs i sprawdza rezultat. Dokumenty są po polsku. Każda scena trwa 60 klatek przy 30 kl./s, od lokalnej klatki 0 do 59.

Do planu/specyfikacji należy włączyć odniesienie do odpowiedniej planszy ze storyboardu lub źródła aplikacji oraz minimum dwa konkretne przykłady z repozytoriów przypisanych do ujęcia. Link do pliku, demo lub klatki przykładowej ma towarzyszyć opisowi konkretnego zabiegu zastosowanego w naszej scenie. Linki sprawdza się w drzewach git w /private/tmp/rodzic-guides. Dostępne są stickman, video-shotcraft, bang-motion, motionmaxxing, earshot. Skrypty i materiały źródłowe aplikacji pozostają w oryginalnych lokalizacjach. Plansze referencyjne wyznaczają wygląd, postaci są rysowane i animowane od podstaw.

## Interfejs ujęcia

Moduł eksportuje czystą funkcję `scene(f,k)`. Zwraca treść SVG w przestrzeni 1280 × 720 bez zewnętrznego elementu svg. Każde ujęcie odpowiada za pełne pokrycie kadru. Koordynator składa 30 modułów na osi HyperFrames, korzysta z istniejących polskich nagrań i sprawdza dekodowane klipy. Autor sprawdza kod i wybrane klatki np. za pomocą własnej makiety k albo dostarczonego zestawu.

| Funkcja | Rysunek i współrzędne |
| --- | --- |
| k.person(role,pose) | role marta, pawel lub clerk. x,y oznaczają środek bioder w kadrze, s skalę. seat, lean (obrót tułowia w stopniach), head (obrót głowy w stopniach), gaze (−1 lewo do 1 prawo), mouth (0–1), blink (0–1), brow (−1 do 1). left i right to ramiona po lewej/prawej stronie ekranu, każde jako [łokiećX, łokiećY, dłońX, dłońY] względem bioder PRZED skalowaniem. Barki około (±52,−108), głowa (0,−178). leftGrip/rightGrip lub grip przyjmują open, pinch, hold, point. step (−1..1) animuje krok; footL/footR opcjonalnie przesuwają stopy w poziomie. Rysunek ma pełne ciało z ubraniem. |
| k.hand(x,y,angle,size,grip,side) | Oddzielna dłoń na pierwszym planie do zamykania chwytu na rekwizycie. side = 1 lub −1. |
| k.salon(), k.queue(), k.ward() | Osobne rysunkowe tła bez pierwszoplanowych postaci. Salon obejmuje kanapę. Korytarz ZUS obejmuje stanowisko po prawej. |
| k.pram(x,y,s,roll) | Wózek, środek pomiędzy kołami na poziomie osi; roll w stopniach. Ola śpi pod kocykiem z jednym pasem. Rączka na lokalnym (−144,−145). |
| k.folder(x,y,w,angle,open) | Teczka ze zdjęciem chwytu, środek obiektu, obrót w stopniach, open od 0 do 1. |
| k.paper(x,y,w,h,angle,fold) | Arkusz, środek, obrót w stopniach, fold od 0 do 1. |
| k.zusik(cx,cy,size,look) | Oryginalny SVG z aplikacji, look od −1 do 1. |
| k.grasp(p) | Rysunek zbliżenia dłoni Oli na palcu Pawła, przezroczysty, w lokalnym kadrze 400 × 230. p=0 rozluźnione palce, p=1 pełny chwyt. Do fotografii od sceny 03 używamy k.grasp(1). |

W salonie biodra siedzącej Marty są w (427,490), biodra Pawła w (800,490), skala 1,16. W kolejce rodzice stoją po tych samych stronach ekranu. Tło #F5FAF7, tusz #283754, zielony #1A8648, kolor teczki piaskowy. Typografia produktu Domine i Inter. Zmiana planu kamery może grupować rysunki w transformację SVG. Wrażenie ruchu człowieka pochodzi z gry oczu, głowy, ciała, kończyn i trzymanych obiektów.

### Ustawienia ciągłości

Dla scen 04–11 podstawowy plan ogólny ma biodra Marty (323,445) przy s=1,05 i Pawła (712,438) przy s=1,09; wózek ma osie na (474,612) przy s=1. Dłoń Marty może trzymać lewą stronę rączki. Zbliżenia na oczy, biodro, dokument i gesty są oddzielnymi ustawieniami kamery. W scenach 12–14 pracownica siedzi po prawej, arkusz i ręce są widoczne na blacie, rodzice patrzą w prawo. Pracownica nosi jasny kołnierzyk i ma szary kok.

Na końcu sceny 18 otwarta teczka leży w (688,493), w=300, obrót −3°, stos przy (817,455). Lewa ekranowa ręka Pawła ma lokalne współrzędne [−69,−42,−65,−35], prawa [61,−32,39,−93]. Marta trzyma ręce w [−66,−36,−48,−10] i [65,−33,79,−5]. To wejście sceny 19. W salonie wózek z Olą należy do wyposażenia z lewej strony.
