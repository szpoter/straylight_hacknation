# 17 · Zdjęcie obuwia i zmiana spojrzenia

Pełny kadr SVG 1280 × 720. Lokalne klatki 0–59 przy 30 kl./s odpowiadają klatkom 960–1019 filmu. Biodra Marty (427,490), Pawła (800,490), skala 1,16. Dwa druki w punktach (547,514) i (670,503), otwarta teczka w (608,516), szerokość 290 px, obrót −3°. Wózek po lewej. [Wyjście sceny 16](../16/SPEC.md) · [Plansza salonu](../../../referencje/kanapa-przed-fala-v1.png)

| Klatki | Gra Pawła i rekwizyty |
| --- | --- |
| 0–15 | Pierwsza klatka przejmuje dokładnie ostatnią pozę poprzedniego ujęcia. Lewy but pozostaje z podeszwą przy podłodze. Stopa podnosi piętę i wysuwa się w lewo, jasna skarpeta staje się widoczna. |
| 12–28 | Prawy but podnosi się razem z kostką. Tułów pochyla się w prawo, łokieć ucieka na zewnątrz. Nadgarstek dochodzi do pięty przed odczepieniem buta. |
| 28–45 | Zaciśnięta prawa dłoń zabiera but po łuku na zewnątrz. Stopa wraca do podłogi w skarpecie. Nosek buta obraca się w dół pod własnym ciężarem. |
| 40–59 | Źrenice ruszają pierwsze w stronę druku, potem podąża głowa. Pięta zatrzymuje się w (942,537), nosek pod kątem 74° w dół od poziomu. Ostatnia poza dłoni przechodzi do odkładania buta w 18/0. |

Pierwszy but pozostaje w ekranowym położeniu początkowym, pięta około (716,656). W ostatniej pozie lewa ekranowa stopa jest od niego odsunięta. But i przód trzymającej go dłoni leżą na osobnych warstwach. Marta zachowuje kontakt z kartką. Wyciszenie pozwala obejrzeć oddzielnie wysunięcie stopy, kontakt drugiej ręki z butem oraz późniejsze skierowanie wzroku na formularz. W dialogu pozostaje istniejące nagranie Pawła. Usta korzystają z amplitud przypisanych do jego ścieżki. [Gra postaci](../../przyklady/pozy-postaci.png) · [Fazy ruchu](../../przyklady/fazy-ruchu.png) · [Źródła przykładów](../../przyklady/ZRODLA.md)

Na wyjściu Paweł ma lean=−10°, head=−5°, gaze=−1 oraz gazeDown=1. Lewa ręka [−64,−23,−53,2], prawy łokieć [101,−31], nadgarstek w (942,537). Klatka 18/0 może użyć `lastFrame(k)`. Przy odkładaniu pierwsza podeszwa zostaje w miejscu, a lewa skarpeta wraca za nią wraz z parametrem `restingLegs(t)` z 0 do 1. Rysunek drugiego buta `shoe(x,y,angle,lining)` obraca się wokół pięty, a parametr lining wygasza linie na cholewce w końcowej pozie sceny 18.

Sprawdzono raster wszystkich 60 klatek, porównano 0, 12, 22, 28, 38 i 59 na wspólnej planszy oraz przetestowano pozycję pięty przy zamkniętym chwycie i zgodność z 16/59.
