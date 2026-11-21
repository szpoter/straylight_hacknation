---
version: alpha
name: Spokojna Kartka
description: Jasny, redakcyjny kierunek wizualny z szeryfowymi nagłówkami, dużą ilością jasnej przestrzeni i pastelową zielenią opartą na kolorach ZUS.
# Pominięte sekcje prozy: Elevation & Depth, Motion, Voice & Content Strategy, Components.
# Linter specyfikacji przyjmuje w `omitted` tylko grupy tokenów, dlatego wpisany jest tu wyłącznie motion.
omitted:
  - section: motion
    reason: "Ruch źródła jest powściągliwy: zmiany koloru 150–300 ms i wjazd słów nagłówka po kolei przy przewijaniu. To za mało na osobny charakter. Animacje maskotki dostarcza zespół."
colors:
  primary: "#1A8648"
  on-primary: "#FFFFFF"
  secondary: "#A6D0B8"
  tertiary: "#FCDCAA"
  background: "#F5FAF7"
  surface: "#FFFFFF"
  on-surface: "#283754"
  on-surface-variant: "#5E697F"
  outline: "#D4D7DD"
typography:
  display:
    fontFamily: Literata
    fontSize: 86.4px
    fontWeight: 400
    lineHeight: 0.93
    letterSpacing: -0.02em
  headline:
    fontFamily: Literata
    fontSize: 48px
    fontWeight: 400
    lineHeight: 1
    letterSpacing: -0.015em
  title:
    fontFamily: Literata
    fontSize: 24px
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: -0.01em
  body:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.5
rounded:
  sm: 8px
  lg: 24px
  full: 9999px
spacing:
  gutter-mobile: 16px
  gutter-desktop: 40px
  container: 1280px
  card: 24px
  stack: 32px
  section: 112px
  section-mobile: 80px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    height: 56px
    padding: 24px
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    height: 56px
    padding: 24px
---

# Spokojna Kartka

## Overview

To kierunek, a nie sztywna specyfikacja, więc nowe komponenty mogą odbiegać od przykładów, jeśli zachowują opisany niżej charakter.

Strona sprawia wrażenie spokojnego notatnika. Jasna kartka, duże szeryfowe nagłówki w regularnej grubości, drobny bezszeryfowy tekst interfejsu i jeden kolor marki, użyty rzadko, ale na dużych płaszczyznach. Ton jest redakcyjny i rzeczowy, bez efektów. Ilustracje to makiety produktu w zaokrąglonych oknach, często na tle zdjęcia. W naszym produkcie to miejsce mogą zajmować maskotka i widoki z aplikacji.

Na czym się opieram: computed styles i zrzuty z trzech podstron źródła (strona główna, cennik, strona dla firm) na szerokości 1440 i 390 px. Tło strony jest białe na wszystkich trzech. Kolor tekstu to prawie czerń. Wszystkie nagłówki są szeryfowe w grubości 400. Przyciski i nawigacja mają kształt pigułki.

## Colors

Paleta źródła ma role, które tu zostały: jasne tło, odcinające się od niego karty, prawie czarny tusz do tekstu i ciemnych bloków, jeden nasycony kolor dla głównej akcji, jego jasna wersja dla dużych bloków i jeden ciepły akcent. Barwy źródła zastąpiono kolorami ZUS w wersji bardziej pastelowej. W odróżnieniu od źródła tło nie jest czysto białe: ma ledwie widoczny odcień zieleni, a biel przeszła na karty.

Kolory ZUS zmierzono w computed styles na zus.pl (strona główna i strona o zasiłku macierzyńskim): zieleń `#007834` (aktywne menu, stopka), ciemny granat `#283754` (kafle nawigacyjne), bursztyn `#FAB856` (przycisk logowania). Oficjalnej księgi znaku nie udało się znaleźć w sieci. Pastelowe wersje to te kolory zmieszane z bielą w sRGB, w proporcji podanej przy każdym z nich.

- **Primary (#1A8648):** zieleń ZUS z 10% bieli. Wypełnienie głównego przycisku. Biały tekst ma na niej kontrast 4,62:1.
- **Secondary (#A6D0B8):** zieleń ZUS z 65% bieli. Duże pełnoszerokościowe bloki i kafle ilustracji, tak jak w źródle jego jedyny mocny kolor. Tekst w kolorze tuszu ma na niej 6,99:1.
- **Tertiary (#FCDCAA):** bursztyn ZUS z 50% bieli. Drobne wyróżnienia, etykiety „nowe”, zaznaczenia w tekście.
- **Background (#F5FAF7):** zieleń ZUS z 96% bieli. Tło strony: nie całkiem białe, z ledwie widocznym zielonym odcieniem.
- **Surface (#FFFFFF):** biel. Karty, okna-makiety, sekcje naprzemienne i przycisk drugorzędny odcinają się nią od tła.
- **On-surface (#283754):** ciemny granat ZUS bez zmian, bo tusz musi pozostać ciemny. Tekst, obrysy przycisków drugorzędnych i ciemne pełnoszerokościowe bloki z białym tekstem (11,9:1). Na tle strony ma 11,28:1.
- **On-surface-variant (#5E697F):** tusz z 25% bieli. Tekst pomocniczy, podpisy, metadane (5,23:1 na tle strony, 5,52:1 na bieli).
- **Outline (#D4D7DD):** tusz z 80% bieli. Cienkie linie oddzielające karty i wiersze. Źródło robi to samo: jego linie to kolor tekstu z przezroczystością 20%.

## Typography

Dwa kroje o wyraźnie podzielonych rolach. Szeryfowy niesie treść redakcyjną: nagłówki, liczby w cenach, cytaty. Bezszeryfowy obsługuje wszystko, co jest interfejsem: tekst ciągły, przyciski, nawigację, etykiety. Źródło używa licencjonowanych krojów. Literata i Inter to zamienniki wybrane wzrokowo. Oba mają polskie znaki i cyrylicę, więc obsłużą też wersję ukraińską.

- **Display:** nagłówek hero, jeden na stronę. W źródle rośnie płynnie z szerokością okna: od 48 px na telefonie (390 px) do 86,4 px przy 1440 px, przy tej samej interlinii i światłach. Przy polskich wielkich literach z akcentami interlinia 0,93 może być za ciasna, wtedy tendencja jest raczej ku 1,0 niż ku mniejszemu rozmiarowi.
- **Headline:** tytuły sekcji. Na telefonie źródło używa 36 px z interlinią 40 px. Pojedyncze hasła-przerywniki bywają znacznie większe (zmierzono 60, 108 i 160 px), ale to wyjątki, a nie stopień skali.
- **Title:** nagłówki kart, kroków i pytań w FAQ. Duże ceny i cytaty też są szeryfowe, w rozmiarach 30–36 px.
- **Body:** tekst ciągły. Lead pod nagłówkiem bywa większy (zmierzono 18–22 px), czasem w lżejszej grubości 300.
- **Label:** przyciski. Nawigacja i drobne metadane schodzą do 13–14 px w tym samym kroju.

W źródle szeryfy nie są pogrubiane. Hierarchię buduje rozmiar, a nie grubość.

## Layout

Gęstość jest niska. Każda sekcja niesie jedną myśl i często zajmuje mniej więcej wysokość okna. Między blokami jest dużo wolnej przestrzeni. Sekcja „jak to działa” na stronie głównej jest przyklejona przy przewijaniu i przełącza kolejne kroki.

- **Kontener:** maksymalnie 1280 px z marginesem wewnętrznym 40 px po bokach, czyli 1200 px treści. Na telefonie margines boczny to 16 px. Teksty ciągłe zwykle nie przekraczają około 770 px szerokości, a nagłówek hero zajmuje około 560 px.
- **Odstępy między sekcjami:** sekcje mają 112–128 px wypełnienia w pionie na desktopie i 80–96 px na telefonie. Sekcje z jednym hasłem mają 160 px (telefon 96 px). Na stronie cennika sekcje oddziela przerwa 192 px (telefon 112 px).
- **Wewnątrz kart:** 16–24 px. Mniejsze karty informacyjne mają 16 px, karty cytatów 20 px, okna-makiety 16–24 px. Większy panel ma 28 px u góry i 48 px po bokach.
- **Rytm pionowy:** od nagłówka sekcji do treści jest zwykle 32–40 px, na telefonie 24–32 px.
- **Układ:** hero ma tekst wyrównany do lewej i makietę po prawej, a na telefonie jedną kolumnę. Sekcje z jednym hasłem są wyśrodkowane. Nawigacja to pływająca pigułka wysokości 56 px, 8 px od górnej krawędzi, przyklejona przy przewijaniu.

## Shapes

Język kształtów łączy miękkie z prostym. Elementy klikalne mają zwykle kształt pigułki (`full`): przyciski, nawigacja, etykiety, przełączniki. Pól formularzy źródło prawie nie pokazuje, więc ich kształt jest do wyboru. Duże karty i okna-makiety mają 24 px (w źródle także 28 px). Małe karty, tabele i zdjęcia mają 8 px lub mniej. Pełnoszerokościowe bloki koloru nie mają zaokrągleń: są prostymi pasami od krawędzi do krawędzi.

Głębię dają tonalne powierzchnie i linie 1 px w kolorze `outline`, a nie cienie. Delikatny, ledwie widoczny cień pojawia się tylko pod oknami-makietami. Przycisk drugorzędny to biała pigułka z obrysem 1 px w kolorze tuszu. Na telefonie przyciski mają 48 px wysokości zamiast 56. Wypełnienie 24 px w tokenach dotyczy boków, wysokość wynika z tokenu `height`. Przy wielu powtórzonych wezwaniach w dolnej części strony źródło używa też pigułki wypełnionej tuszem z białym tekstem.

## Do's and Don'ts

- **Pasuje:** duże szeryfowe nagłówki w regularnej grubości obok drobnego bezszeryfowego interfejsu.
- **Pasuje:** kolor marki rzadko, ale odważnie: jeden pełnoszerokościowy blok albo kafel na kilka sekcji i jeden główny przycisk na ekran.
- **Pasuje:** dużo jasnej przestrzeni i cienkie linie zamiast ramek i cieni.
- **Nie pasuje:** pogrubione lub pochylone nagłówki szeryfowe i mieszanie wielu grubości w jednym widoku.
- **Nie pasuje:** gradienty, mocne cienie i nasycone kolory na dużych powierzchniach. Pastel trafia na płaszczyzny, pełniejsza zieleń głównie na przycisk.
- **Nie pasuje:** kanciaste przyciski i kontrolki. Kształt pigułki jest jedną z najbardziej rozpoznawalnych cech.
