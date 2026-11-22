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

## Autorzy ujęć · etap 1 (dwa klipy próbne)

| Ujęcie | Autor | Rewizja modeli | Stan |
| --- | --- | --- | --- |
| 19 | s19 | r1 | czeka na obsadę r1 |
| 20 | s20 | r1 | czeka na 19 |
| 27 | s27 | r0 (produkt) | oddane, odbiór autora i koordynatora OK |
| 28 | s28 | r0 (produkt) | oddane po poprawce styku z 27 (pole dat zostaje nad plikami) |

Pozostałe ujęcia czekają na ocenę Juliana po klipach 36–40 i 52–56 s.
