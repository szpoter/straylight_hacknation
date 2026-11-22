# Codex · naturalny ruch kończyn i dłoni w filmie v3

Pracujesz w repozytorium HackNation, w katalogu `plans/film/v3`. Film „Przewodnik Rodzica” v3 jest gotowy: 30 ujęć po 60 klatek, 1280 × 720, 30 kl./s, polski miks. Julian akceptuje wszystko poza **animacją rąk, dłoni i nóg w części fabularnej (ujęcia 01–19)**. Kończyny przeskakują między pozami, dłonie zmieniają chwyt z klatki na klatkę, łokcie odwracają zgięcie, a na cięciach poza ręki nie przechodzi płynnie. Twoje zadanie to jedna wspólna metoda ruchu dla wszystkich postaci, przeniesiona na każde ujęcie i sprawdzona testami. Ujęć produktowych 20–30 nie ruszasz.

## Co przeczytać najpierw

- `PRODUKCJA.md` (narzędzia, rejestr), `BRIEF-BLOKU.md` (zasady pracy autorów), `POSTACIE.md` (karta obsady i sekcja „Rewizja r1”)
- `obsada/obsada.mjs` (model r1: `person`, `joints`, `sofaPose`, `parts`, długości segmentów) i `obsada/rekwizyty.mjs` (punkty chwytu rekwizytów)
- lokalne rozszerzenia ruchu w scenach: `sceny/03/kolejka.mjs`, `sceny/07/kolejka.mjs`, `sceny/13/okienko.mjs`, `sceny/15/kanapa.mjs`, `sceny/15/teczka.mjs` (solver chwytu i interpolacja póz)
- `sceny/NN/PLAN.md` i `SPEC.md` każdego ujęcia: klatki kontaktu, przekazania rekwizytów, pozy na granicach
- obecny wynik: `podglady/animatik-720p-r2.mp4`

## Jedna metoda ruchu (zbuduj ją jako wspólny moduł `ruch/`)

1. **Pozy kluczowe w przestrzeni stawów.** Ujęcie zapisuje pozy jako kąty barku, łokcia, nadgarstka, biodra, kolana i kostki oraz obrót tułowia i głowy na określonych klatkach. Interpolacja idzie po kątach, nie po pozycji dłoni na ekranie. Dzięki temu łokieć nie przeskakuje na drugą stronę, a długość ręki zostaje stała.
2. **IK dwusegmentowe ze stałą długością i ciągłym biegunem łokcia.** Tam, gdzie dłoń ma trafić w punkt, IK liczy kąty ze stałych długości ramienia i przedramienia z modelu r1. Kierunek zgięcia łokcia (biegun) jest ciągły w czasie i nie zmienia znaku w trakcie gestu. Gdy cel jest poza zasięgiem, ruch przejmuje obręcz barkowa lub biodra, a ręka się nie rozciąga.
3. **Kontakty jako więzy.** W oknie kontaktu dłoń jest przypięta do punktu w lokalnym układzie rekwizytu (teczka, kartka, rączka wózka, but). Gdy rekwizyt się porusza, dłoń jedzie z nim. Wejście i wyjście z więzu trwa co najmniej 3 klatki i ma wygładzone przejście. Przy przekazaniu oboje trzymają ten sam punkt przez chwilę.
4. **Zmiana chwytu stopniowo.** Przejścia otwarta → szczypta → chwyt trwają co najmniej 3–4 klatki. Kciuk i palce mają osobne fazy, a mankiet zachodzi na nadgarstek zgodnie z kierunkiem gestu.
5. **Zasady ruchu.** Ruch idzie po łuku, nie po linii. Przed większym gestem jest krótkie przygotowanie. Bark rusza 1–2 klatki przed dłonią, a dłoń dochodzi do celu z wyhamowaniem. Rękaw, kosmyk i torba lekko się opóźniają i dochodzą do spoczynku. Krzywe wyhamowania bierz z jednego wspólnego zestawu, na przykład z eases.svg z Motionmaxxing, tak jak w briefach.
6. **Ciężar i nogi.** Stopa podporowa stoi w miejscu na podłodze, bez ślizgu. Przy siadaniu najpierw obniża się miednica, potem ugina poduszka i układa tkanina. Przy skłonie po but najpierw zmienia się podparcie, potem dochodzą żebra i głowa.
7. **Cięcia.** Moduł eksportuje pozę stawów i kontakty z klatki 59 każdego ujęcia. Następne ujęcie importuje je jako klatkę 0, przeliczone na swoją kamerę. Nikt nie przepisuje liczb ręcznie.
8. **Brakujące widoki.** Model r1 ma tułów i nogi tylko od przodu. Dodaj w modelu, a nie w scenie, widok ¾ i profil tułowia oraz nóg na tej samej osi, skrót przedramienia w głąb i otwartą dłoń Oli. Głowy i twarze zostają bez zmian.

## Testy (każde ujęcie musi je przejść)

Napisz `ruch/test.mjs`, który dla podanych ujęć liczy dane z modelu dla każdej klatki, bez renderu:

- **Długości segmentów:** odchyłka długości ramienia, przedramienia, uda i łydki w lokalnych jednostkach poniżej 0,5%.
- **Brak przeskoków:** prędkość i przyspieszenie kątowe każdego stawu poniżej progu, zgięcie łokcia nie zmienia znaku w obrębie gestu, a kąt między dwiema kolejnymi klatkami nie skacze bardziej niż o ustalony limit.
- **Kontakty:** w oknie kontaktu dłoń i punkt rekwizytu dzielą od siebie najwyżej 1 px na ekranie, a stopa podporowa przesuwa się najwyżej o 1 px.
- **Cięcia:** po sprowadzeniu do tej samej skali bark, łokieć, nadgarstek i rekwizyt w NN/59 i NN+1/0 różnią się najwyżej o kilka px. Jeśli zmiana jest zamierzona, zapisz to w SPEC.

Do tego kontrola wzrokowa. Dla każdego ujęcia zrób:

- `sceny/NN/ruch.jpg`, czyli nakładkę „onion skin”: tor dłoni, łokcia i stopy klatka po klatce na jednym obrazie;
- klatki przed kontaktem, kontakt, pod obciążeniem i puszczenie.

Obejrzyj ujęcie raz w tempie 1×, a potem klatka po klatce przez kontakty i oba cięcia.

## Podział pracy na agentów

1. **Agent „rig”.** Buduje `ruch/`, rozszerza model r1 (rewizja **r2**), pisze `ruch/test.mjs` i jedną próbę: Paweł podaje kartkę pracownicy, a ona ją odbiera (ujęcia 11–12). Zapisuje metodę w `ruch/METODA.md`. Dopiero gdy próba przejdzie testy i wygląda naturalnie, pozostali dostają metodę.
2. **Czterech agentów bloków**, każdy kilka ujęć: 01–06, 07–12, 13–18, 19. Każdy przenosi swoje sceny na `ruch/` i r2 i zachowuje akcję, czasy oraz synchronizację z dźwiękiem z obecnych SPEC. Każdy uruchamia testy i ogląda ruch. Na granicach bloków importuje pozę z sąsiada.
3. **Agent odbiorca.** Składa animatik, przegląda wszystkie cięcia i kontakty, a konkretny zakres klatek odsyła autorowi.

Każdy agent pracuje w swoim katalogu `robocze/<blok>`. Do budowania i renderu używa `node build.mjs --only … --out robocze/<blok>` i `FILM_HTML=… node klatki.mjs` / `render.mjs`. Renderuje oszczędnie, bo maszyna jest obciążona. Przy więcej niż dwóch nieudanych próbach tego samego problemu przerywa i opisuje blokadę oraz alternatywę.

## Wynik

- `ruch/` (moduł, `METODA.md`, testy), model r2 i zaktualizowane ujęcia 01–19 z sekcją „Ruch v3.1” w każdej SPEC (wyniki testów i oględzin)
- `podglady/animatik-720p-r3.mp4`, czyli cała minuta z miksem, a po odbiorze finał 1920 × 1080, 30 kl./s, 1800 klatek
- raport dla Juliana: co zmieniło się w ruchu, wyniki testów dla każdego ujęcia, klipy przed i po dla trzech najgorszych miejsc z r2

Zasady repo: commit po każdym ukończonym i sprawdzonym etapie w formacie `type(scope): description`. Bez usuwania istniejących plików bez zgody Juliana. Bez sekretów w commitach. Każdą nową bibliotekę zewnętrzną wymień w opisie commita.
