# 27 · Specyfikacja ujęcia „Wspólny urlop w szkicu Marty”

Autor planu: s27

52–54 s, klatki filmu 1560–1619. Lokalnie 0–59 przy 30 kl./s. Współrzędne w kadrze 1280 × 720, od lewego górnego rogu.

| Klatki | Ustawienie i ruch |
| --- | --- |
| 0–5 | Na styku 26/59 → 27/0 zachować kartę od (150, 182) do (1130, 552) i kreskę #A6D0B8 od (227, 429), 273 × 7 px. W pierwszej klatce w miejscu cytatu stoi już cały zakres „11 stycznia – 7 lutego 2027”, z początkiem przy x = 225 i linią bazową y = 413. |
| 6–17 | Utrzymać zielony znak wyboru i „Razem z Pawłem” w Inter 44 px nad datami w Domine 62 px. Zakres jest pojedynczym obiektem tekstowym i pozostaje widoczny od pierwszej do ostatniej klatki. |
| 18–40 | Przenieść linię bazową dat z (225, 413) do (216, 500), zmniejszając krój do 52 px i hamując przed końcem. Wypełnienie pola rozwijać poziomo za datami, obrys pokazać dopiero po osiągnięciu pełnej szerokości. Etykieta „Okres urlopu” porusza się nad wartością. Jej dolna krawędź ma stale przynajmniej 16 px odstępu od najwyższej litery dat. Na końcu pole zajmuje x = 188–1092 i y = 386–542. |
| 41–59 | Utrzymać arkusz na x = 105–1175, margines tekstu x = 188, tytuł „Wniosek o urlop rodzicielski” w Domine i status „Szkic” w Inter. Obie informacje są czytelne obok siebie. Przy cięciu do 28 zachować tytuł, status, brzegi papieru i kolory. Dopiero niżej pojawi się „Odpis aktu urodzenia Oli”. |

Papier #FFFFFF, tło i aktywne pole #F5FAF7, tusz #283754, obrys #D4D7DD, zielony znak #1A8648. Wariant i daty pozostają poziome. Ruch kończy się pod słowem „wniosek”; matowy stuk jest zarezerwowany dla kontaktu odpisu z polem w scenie 28. [Wzorzec v2](../../../v2/sceny/27/klatki.jpg) · [Przejęcie kreski](../26/SPEC.md) · [Następne ujęcie](../28/SPEC.md)

## Próba odbiorowa przy 360 px

Po złożeniu scen odtworzyć wyciszony klip 52–56 s z szerokością obrazu 360 px, w normalnym tempie. Po jednym przebiegu widz powinien wskazać, z kim Marta bierze urlop, od kiedy do kiedy trwa i jaki dokument trafia następnie do szkicu. W drugim przebiegu zatrzymać klatki 20, 30 i 40. Cały zakres musi pozostać widoczny raz, z odstępem między cyframi i etykietą także w połowie ruchu. Na styku 26/27 porównać oba końce kreski, a na 27/28 wyrównanie tytułu i brzegów arkusza. [Pola szkicu](../../../../../app/src/features/chat/draft-form.tsx) · [Plan i przykłady](PLAN.md)
