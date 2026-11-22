# Przewodnik Rodzica · pierwsza minuta

Wersja v1 liczy 1800 klatek przy 30 kl./s. Klipy do oceny obejmują klatki 1080–1199 oraz 1560–1679. Animatik utrwala wcześniejszy montaż głosów i kadrów. Eksport 1080p dodaje bliższy plan rozmowy rodziców oraz ruch dłoni, głów i ubrań prowadzony pod głos.

| Materiał | Plik lub katalog |
| --- | --- |
| Fala i wejście marki, 720p | [36–40 s](v1/36-40-fala.mp4) |
| Wybór i odpis, 720p | [52–56 s](v1/52-56-wniosek.mp4) |
| Pracownica i narrator | [Próba obsady](v1/proba-obsady.mp3) |
| Roboczy montaż | [Animatik 720p](v1/animatik-720p.mp4) |
| Pełna minuta | [MP4 1080p](v1/przewodnik-rodzica-1080p.mp4) |
| Kontrola kadrów | [30 ujęć](v1/arkusz-30-ujec.jpg) |
| Cięcie na landing | [Klatka 1799](v1/zusik-ostatnia-klatka.png) |
| Dźwięk do montażu | [Pięć ścieżek i miks FLAC](v1/sciezki/), [kwestie użyte](v1/kwestie/), [spokojniejsze duble](v1/duble-spokojne/) |

### Decyzje montażowe

Klik przypada na granicę klatek 1131–1132. Formularze zatrzymują się przy wejściu ostrego Zusika. Salon pozostaje za nim do początku przejścia na miętę w 38,16 s. W ujęciu wniosku ten sam napis z datami przesuwa się o 36 jednostek w prawo i maleje, gdy pole wsuwa się pod niego. Odpis przekracza odstęp między listą plików i szkicem od 54,35 do 55,42 s.

Źródłem wyboru „Razem z Pawłem”, okresu 11 stycznia – 7 lutego 2027 i nazwy odpisu są dane sprawy Marty. Odbiorcą jest Studio Lipa. Przy logowaniu pokazujemy obecny przycisk „Importuj dane i otwórz plan” oraz podpis demonstrujący import z mObywatela i mZUS. Tekst przepisu pochodzi z fragmentu kp-art182-1a-par6. [Sprawa Marty](../../app/src/features/chat/case-data.ts) · [Przycisk logowania](../../app/src/features/auth/open-family-plan.tsx) · [Korpus](../../app/corpus/marta/fragments.jsonl)

Końcowy kadr ma jednolite tło #F5FAF7. Kwadrat SVG maskotki ma 472,5 × 472,5 px, środek w punkcie (960, 540) i neutralne spojrzenie na wprost. Można użyć dostarczonego PNG jako pierwszej klatki przejścia. Ostatnie cztery klatki utrzymują pozę.

### Projekt i poprawki pojedynczych ujęć

Katalog z index.html wczytuje się jako projekt HyperFrames. Paczka montaz/bundle.js jest gotowa do podglądu. Kod źródłowy jest w montaz. Budowanie korzysta z zależności aplikacji zainstalowanych w app/node_modules oraz osobnego zestawu bibliotek filmu. Polecenia poniżej zakładają bieżący katalog plans/film. Przykład renderuje wyłącznie cztery sekundy do nowego pliku.

```sh
npm ci --prefix montaz
node montaz/build.mjs
node montaz/render.mjs video 720 52 56 v2/52-56-wniosek.mp4
```

Renderer używa Chrome, Playwright i FFmpeg. Na innym komputerze ścieżkę do Chrome można wskazać przez CHROME_PATH. Oś czasu zapisano w sekundach, a granice ujęć co 60 klatek. Źródła obu prób to [rodzina.js](montaz/rodzina.js) i [produkt.tsx](montaz/produkt.tsx). Zegar jest zarejestrowany w [scene.tsx](montaz/scene.tsx), a pozycje wszystkich ujęć i ścieżek są widoczne na [osi HyperFrames](index.html).

Marta ma głos Sarah, Paweł — Chris, pracownica — Matilda, narrator — Daniel. Wszystkie kwestie nagrano w ElevenLabs po polsku, na modelu eleven_multilingual_v2. Osobny plik przypada na całą wypowiedź. Skrypt syntezy pomija istniejące nagrania. Miks korzysta z gotowych plików, a do jego odtworzenia wystarczą FFmpeg oraz Python z numpy i soundfile. Głośność miksu źródłowego wynosi −18,6 LUFS, szczyt rzeczywisty −1,6 dBTP. [Synteza](montaz/glosy.py) · [Miks](montaz/miks.py)

### Wykorzystane narzędzia

| Zasób | Zastosowanie |
| --- | --- |
| Stickman Video Director, styl Minimal Line Art, oraz Video Shotcraft | Jedna czynność na kadr, stała oś rodziny, zmiany planu na gestach i pauzy po ruchu. Obraz rodziny opiera się na planszach projektu. ImageGen dostarczył cztery nowe rysunki dopasowane do nich. [Stickman, cf78fdb](https://github.com/kaomei/stickman-video-director/tree/cf78fdb) · [Video Shotcraft, 59f3e9b](https://github.com/Vincentwei1021/video-shotcraft/tree/59f3e9b) |
| Konva, WebGL, Planck, Anime.js i Scene.js | Oddzielne warstwy postaci i papieru, lokalne ugięcia rysunku, trajektorie formularzy, odstępy między startami oraz odginanie rogów. |
| Remotion, Motion, Motionmaxxing i Bang Motion | Izolowana kompozycja produktu, oryginalny SVG Zusika z aplikacji, osiadanie i przeniesienie dat. Osiadanie załącznika stosuje krzywą softLand, a powrót przycisku snapSettle. Typografia pojawia się raz na ruch maskotki. [Motionmaxxing, 8c8ec0f](https://github.com/Tejashmakwana/motionmaxxing/tree/8c8ec0f) · [Bang Motion, c1aa65e](https://github.com/bangtutorial/bang-motion/tree/c1aa65e) |
| Earshot | Sygnał numerka notify/pair, klik toggle/key_down, papier paper/ball i teczka book/place. Motyw po kliku jest własną sekwencją 60 BPM. [Earshot, 7a7f7c5](https://github.com/Leonxlnx/earshot/tree/7a7f7c5) |
| HyperFrames, Playwright i FFmpeg | Wspólny zegar i 30 klipów. Playwright ustawia wskazaną klatkę na tej osi, FFmpeg koduje obraz i miks. Sprawdzono osiem momentów w środowisku HyperFrames, arkusz 30 ujęć i oba strumienie MP4. |

Trzy filmy referencyjne służyły jako opisane w planie wzory montażowe. Porównanie podglądów z odpowiednimi 120 klatkami pełnej minuty po sprowadzeniu do 720p daje SSIM 0,995 dla fali i 0,997 dla wniosku. Kontrola mowy na wyeksportowanym MP4 rozpoznała „do jutra”, „do kadr” oraz „dokumentem”. Sprawdzenie czytelności objęło pomniejszone kadry na komputerze. [Storyboard i odniesienia](../../PLAN-FILMU-DEMO.md)
