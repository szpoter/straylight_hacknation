# Przewodnik Rodzica v3 · rejestr produkcji

Koordynator prowadzi tu listę autorów, rewizje wspólnych modeli i stan odbioru. Materiały v1 i v2 są archiwum i źródłem dźwięku.

## Narzędzia v3

| Polecenie (z katalogu `plans/film/v3`) | Co robi |
| --- | --- |
| `node build.mjs` | Składa wszystkie istniejące `sceny/NN/scene.mjs` z `zestaw.mjs` do `film.js` i `index.html` w v3. |
| `node build.mjs --only 19,20 --out robocze/s19` | Prywatna kompilacja autora, żeby równoległe prace się nie nadpisywały. |
| `node render.mjs 720 19 20 podglady/plik.mp4` | Render zakresu ujęć z miksem `media/miks.flac`. Nie nadpisuje istniejących plików. `FILM_HTML=robocze/…/index.html` wskazuje prywatną kompilację. |
| `node klatki.mjs katalog 1080 1139` | Pojedyncze klatki PNG 1280 × 720 do oględzin. |

Dźwięk: `media/*.flac` to przyjęty miks v2 (dialog, narrator, efekty, otoczenie, muzyka, miks). Nowy dubel powstaje tylko przy zmianie kwestii.

## Wspólne modele

| Rewizja | Autor | Zawartość | Stan |
| --- | --- | --- | --- |
| r0 | koordynator | pusty zestaw, oryginalny Zusik w `zestaw.mjs` | zastąpiona |
| r1 | dyrektor artystyczny | obsada, rekwizyty, plansza obsady, test obrotu; kanapa s=1,28 (zamiast 1,16) | przyjęta do produkcji |

## Autorzy ujęć

Na prośbę Juliana jeden autor dostaje blok kilku ujęć i odpowiada za cięcia wewnątrz bloku. Równolegle pracuje najwyżej pięć bloków. Wspólny brief autorów: [BRIEF-BLOKU.md](BRIEF-BLOKU.md).

| Ujęcia | Autor | Rewizja modeli | Stan |
| --- | --- | --- | --- |
| 01–06 | blok b01 | r1 | oddane; styk 06/07 rozstrzygnięty (photo02, chwyt URLOP, POTWIERDZENIE w teczce); prośby: przycięcie zdjęcia teczki, statyści, otwarta dłoń Oli, rewers kartki |
| 07–12 | blok b07 | r1 | oddane; styk 12/13 do decyzji; prośby: profil tułowia i nóg, skrót łokcia, statyści |
| 13–18 | blok b13 | r1 | oddane; prośby do modeli: skłon tułowia z profilu, obrót buta, okładka teczki |
| 19–23 | blok b19 | r1 | oddane; 20 poprawione (tytuł czytelny od pierwszej litery) |
| 24–26, 29–30 | blok b24 | r1 (produkt) | oddane; styk 23/24 = 0 po poprawce importu mapy |
| 27 | s27 | r0 (produkt) | oddane, odbiór autora i koordynatora OK |
| 28 | s28 | r0 (produkt) | oddane po poprawce styku z 27 (pole dat zostaje nad plikami) |
