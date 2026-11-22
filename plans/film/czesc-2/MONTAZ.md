# Przewodnik Rodzica · nagranie aplikacji

Film konkursowy ma 5340 klatek. Pierwsze 1800 pochodzi z pliku [przewodnik-rodzica-B-1080p.mp4](../v3-flow/przewodnik-rodzica-B-1080p.mp4). Pozostałe 3540 to demonstracja w natywnym widoku komputera 1920 × 1080.

## Montaż z istniejących materiałów

[Projekt HyperFrames](projekt/index.html) zawiera czas wejścia podpisów i ruch kamery. W katalogu obok znajdują się gotowy miks stereo, obraz po cięciach i ostatnia klatka pierwszej minuty. Projekt można ponownie wyrenderować bez sesji aplikacji i bez wywołań ElevenLabs. Polecenia wykonaj z katalogu tego pliku.

```sh
npx hyperframes@0.8.118 render projekt --fps 30 -o demo-118s-1080p.mp4
python3 pelny-film.py
```

[Lista cięć](scenopis.py) używa sekund od początku drugiej części. Dla poprawki konkretnego ujęcia zmień czas w liście, następnie uruchom poniższe polecenie przed renderem. Wymaga Pythona z NumPy, FFmpeg, ffprobe oraz GSAP z instalacji pierwszej części w katalogu `../montaz/node_modules`.

```sh
python3 montaz.py film
```

## Surowe materiały

[Nagrania](surowe/) powstały w Playwright. Pliki 01–04 obejmują pierwotną sesję rodziny. Po kliknięciu otwierającym czat obraz przechodzi do dubla 02-odpowiedz, nagranego w poprawionej lokalnej wersji Zusika za pomocą skryptu rozmowa.cjs. Plik 05 pochodzi z oddzielnej sesji administratora. Każdy MP4 ma obok plik JSON z momentami i położeniem kursora w pikselach źródłowego obrazu. W ujęciu formularza aplikacja otwiera PDF w osobnej karcie. Formularz wygenerowany w tym przebiegu znajduje się w tym samym katalogu.

[Dziesięć kwestii lektora](glos/) pochodzi z ElevenLabs. Pliki JSON zawierają czasy wymowy. Numer 04 odnosi się do [rzeczywiście otwartego przypisu](surowe/zrodlo.txt). Bezpośrednia odpowiedź Zusika na pytanie Marty pokazuje 3 423 zł i 4 200 zł brutto za 21 dni. Pierwszy przypis rozwija art. 31 ust. 3. Wersja aplikacji z kartą importu rodziny ma na landingu przycisk „Otwórz profil Oli”.

[Próbka kalkulatora](proba-1080p.mp4) ma odrębny [projekt](projekt-proby/index.html), nagranie i dwie krótkie kwestie. Dane 6000 i 5000 są podstawami zasiłku wpisanymi ręcznie.
