# Codex · historia z Google Flow + poradnik z animacji (wersja B filmu)

Pracujesz w repozytorium HackNation (`plans/film/v3`). Mamy gotową minutę „Przewodnik Rodzica” v3: rysowaną animację 30 ujęć z polskim miksem (`podglady/animatik-720p-r2.mp4`). Julian chce **dwie wersje filmu**:

- **Wersja A:** obecna animacja w całości (bez zmian z twojej strony).
- **Wersja B:** historia rodziny, czyli 0:00 do kliku w 37,733 s, wygenerowana w **Google Flow** w tym samym stylu rysunkowym. Od kliku do końca, czyli poradnik z Zusikiem, mapą Oli i wnioskiem, zostaje ta sama animacja co w A.

Sterujesz Google Flow przez przeglądarkę Chrome Juliana (https://labs.google/fx/tools/flow), na jego zalogowanym koncie Google.

## Zasady pracy z Flow

- Nie wpisujesz haseł ani danych płatności. Jeśli trzeba się zalogować albo coś potwierdzić, zatrzymaj się i poproś Juliana.
- **Zanim wydasz kredyty**, pokaż Julianowi listę generacji: ujęcie, tryb, liczba prób, szacowany koszt. Ruszasz dopiero po jego „tak”.
- Do Flow wysyłasz tylko nasze rysunki i fikcyjne postaci (Marta, Paweł, Ola, pracownica ZUS). Nie wysyłasz logo ZUS ani prawdziwych danych osobowych.
- Prompty pisz po angielsku, bo modele Flow lepiej je rozumieją. Opis sceny bierz z briefów.
- AI źle rysuje napisy. Nagłówki druków („URLOP”, „ZASIŁEK”, data „11.01.2027”, tablica „A17”) nie mogą pochodzić z generacji. Kadruj tak, żeby tekst był nieczytelny albo poza kadrem, a czytelne napisy nałóż w montażu jako warstwę śledzoną za kartką.

## Styl i ciągłość postaci

- **Referencje (Ingredients):** `obsada/plansza-obsady-r1.png` oraz `../referencje/rodzina-oli-v1.png`, `kolejka-zus-v1.png`, `kanapa-przed-fala-v1.png` i `fala-formularzy-zusik-v1.png`. Styl: płaska ilustracja, czysta granatowa linia (#283754), pastelowa szałwia i mięta, jasne tło #F5FAF7, proste oczy-kropki, bez cieniowania 3D. Opis postaci bierz z `POSTACIE.md`:
  - Marta: niski kok, szałwiowa narzutka, jasna sukienka.
  - Paweł: asymetryczna grzywka, granatowa rozpięta koszula.
  - Ola: zielony pas na kocyku.
  - Pracownica: wysoki szary kok, jasny kołnierzyk.
- **Klatki startowe i końcowe (Frames to video):** dla każdego ujęcia wyeksportuj z obecnej animacji pierwszą i ostatnią klatkę, np. `node klatki.mjs robocze/flow/kadry 0 59`, po `node build.mjs`. Podaj je Flow jako kadr początkowy i końcowy. Dzięki temu kompozycja, pozycje postaci i cięcia zgadzają się z animacją i z dźwiękiem.
- Treść, czas i gest każdego ujęcia opisują `sceny/01…19/PLAN.md` i `SPEC.md`, a dialogi `../../../PLAN-FILMU-DEMO.md`. Kluczowe momenty:
  - chwyt palca w 2,17 s
  - „Chyba tak” od 10,85 s
  - Paweł łapie wózek biodrem w 16–18 s
  - pracownica mówi „do jutra” w 26–28 s
  - róg teczki uderza w kanapę w 28,20 s
  - but opada w 34,60 s
  - klik w 37,733 s
- Flow generuje dłuższe klipy niż nasze 2 s. Możesz generować po kilka ujęć ciągiem, jeśli kadr się nie zmienia, a potem przyciąć do granic ujęć.

## Generacja i wybór

1. Zapisz plan w `../v3-flow/UJECIA.md`. Dla każdego ujęcia 01–19 podaj: prompt, tryb (Frames/Ingredients), klatki wejścia i wyjścia, oczekiwany gest i kontakt dłoni.
2. Generuj po kolei bloki 01–03, 04–08, 09–11, 12–15, 16–19. Z każdej generacji pobierz pliki do `../v3-flow/surowe/` (nie commituj surowych plików ponad 50 MB, zapisz je w `.gitignore`).
3. Każdą próbę obejrzyj w tempie 1× i klatka po klatce. Odrzuć te, w których:
   - postać ma inną twarz lub strój niż na planszy;
   - dłonie mają złą liczbę palców albo kończyny się zlewają;
   - rekwizyt zmienia kształt;
   - styl przechodzi w 3D lub fotorealizm.

   Do `UJECIA.md` wpisz wybraną próbę i powód. Maksymalnie 3 próby na ujęcie, potem zgłoś Julianowi blokadę.
4. Ujęcie 19 do kliku może pochodzić z Flow (fala papierów z kanapy), ale klatka kliku musi się zgadzać z animacją. W 37,733 s zamroź ostatnią klatkę Flow, rozmyj tło i rodziców tak jak w `sceny/19/scene.mjs` (klatki 52–59) i nałóż oryginalnego Zusika z naszego kodu: środek (640,325), ramka 270 px. Od klatki 1140 (ujęcie 20) wszystko pochodzi z wersji A.

## Montaż wersji B

- Utwórz `../v3-flow/sklad.mjs` (ffmpeg lub HyperFrames, jak `render.mjs`). Ma robić cztery rzeczy:
  - dopasować klipy Flow do 30 kl./s i 1920 × 1080 i przyciąć każde ujęcie dokładnie do 60 klatek;
  - nałożyć warstwy napisów na druki;
  - zrobić zamrożenie z Zusikiem w ujęciu 19;
  - dokleić od klatki 1140 render wersji A.
- **Dźwięk:** wycisz audio z Flow. Obie wersje używają tego samego miksu `media/miks.flac`, więc obraz ma trafiać w istniejące sylaby i efekty (klik, stuk teczki, but).
- Wyniki:
  - `../v3-flow/przewodnik-rodzica-B-720p.mp4` do przeglądu, potem `-B-1080p.mp4`: 1920 × 1080, 30 kl./s, 1800 klatek;
  - obok render wersji A w 1080p z `render.mjs 1080 1 30`;
  - klatka 1799 identyczna w A i B;
  - arkusz 30 ujęć dla obu wersji.
- **Odbiór:** obejrzyj B w całości z dźwiękiem. Sprawdź cięcia między ujęciami z Flow i styk historia → poradnik w 37,7–38 s. Zrób test bez głosu na szerokości 360 px.

## Na koniec

Raport dla Juliana:
- link do projektu Flow;
- liczba zużytych generacji;
- które ujęcia wyszły najlepiej, a które najsłabiej;
- obie wersje do porównania.

Commituj w formacie `type(scope): description`. W opisie commita wymień Google Flow (oraz model wideo, którego użyłeś) jako zewnętrzne narzędzie AI: regulamin hackathonu wymaga listy zewnętrznych rozwiązań. Nie usuwaj istniejących plików bez zgody Juliana.
