# Kierunek designu

Czytaj przed zaprojektowaniem nowego ekranu lub sekcji. Plik opisuje charakter stylu. Konkretne wartości są w [tokeny.md](tokeny.md), a budowa elementów w [komponenty.md](komponenty.md).

Opis charakteru to **interpretacja** (wywnioskowane). Opiera się na obserwacjach strony źródłowej z sekcji 2 oraz na decyzjach zespołu z sekcji 5.

---

## 1. Charakter w trzech zdaniach

Interfejs jest **przyjazny i spokojny, ale bardzo uporządkowany**. Wygląda jak świat Zusika: płaskie, zaokrąglone kształty w miękkiej mięcie i granacie, otoczone wyraźną obwódką. Wokół nich jest **dużo bieli i jedna akcja główna na sekcję**. Ciepło dają zaokrąglony krój, maskotka i ilustracje, nie efekty.

Nastrój: optymistyczny, życzliwy, godny zaufania, bez urzędowego chłodu i bez nachalnej zabawy. Ekran mówi „to proste, zrób jeden krok”.

---

## 2. Obserwacje ze strony źródłowej

| # | Obserwacja | Status | Przenosimy? |
| --- | --- | --- | --- |
| 1 | Biel zajmuje 67% malowanej powierzchni strony. Kolor pojawia się w przyciskach, nagłówkach, stopce i ilustracjach. | wykryte | tak |
| 2 | Przyciski i karty mają twardą dolną krawędź, a wciśnięty przycisk przesuwa się w dół. | wykryte | **nie** (decyzja zespołu: za mocny charakter źródła) |
| 3 | Brak rozmytych cieni, gradientów i `backdrop-filter`. | wykryte | tak |
| 4 | Zaokrąglenia 12 i 16 px. Bez pigułek i bez ostrych rogów. | wykryte | tak |
| 5 | Dwa kroje: gruby, zaokrąglony krój nagłówków i krój UI z etykietami przycisków w wersalikach z rozstrzeleniem. | wykryte | tak, z zamiennikiem Nunito |
| 6 | Jedna barwa obramowań, ramka 2 px wszędzie. | wykryte | tak, w szarości ZUS |
| 7 | Płaskie, kolorowe ilustracje SVG, część animowana skryptem. | wykryte; animacja: wywnioskowane | tak; u nas to Zusik |
| 8 | Duże odstępy: sekcje 96 px w pionie, wiersz to kwadratowa ilustracja 530 px obok kolumny tekstu 473–503 px. | wykryte | tak |
| 9 | Stany przycisków zmieniają się natychmiast. Animacja jest zarezerwowana dla ilustracji, nagłówka i tła przy przewijaniu. | wykryte | tak |
| 10 | Krótkie teksty: pod nagłówkiem jeden akapit o długości 150–280 znaków. Jedna akcja główna na sekcję. | wykryte (długości), wywnioskowane (zasada) | tak |
| 11 | Główne przyciski mają stałą szerokość 330 px. | wykryte | tak |

---

## 3. Czym ten styl różni się od generycznego szablonu

| Generyczny szablon | Ten styl |
| --- | --- |
| Głębia przez miękkie cienie | Całkiem płasko: ramka 2 px i kolor wypełnienia |
| Przyciski w kształcie pigułki, gradient, animowany hover | Prostokąt z zaokrągleniem, mięta w zielonej obwódce jak Zusik, wersaliki z rozstrzeleniem, hover to tylko zmiana jasności |
| Karty z cieniem i zdjęciem | Karty z szarą ramką, ikona lub ilustracja, wyśrodkowana treść |
| Neutralny, wąski sans-serif | Zaokrąglony, „miękki”, gruby krój |
| Gęsta siatka kafli i dużo akcji na ekranie | Jedna akcja główna, dużo bieli, rytm „ilustracja ↔ krótki tekst” |
| Animacje wejścia na każdym bloku | Interfejs reaguje natychmiast; ruch mają maskotka, ilustracje i tło sekcji |

---

## 4. Rób / nie rób

### Rób

- W każdej sekcji daj **jedną akcję główną** (miętowy przycisk). W oknie nie powinno być widać dwóch naraz. Pozostałe akcje to przyciski obrysowane albo linki.
- Każdemu przyciskowi, karcie, panelowi i komunikatowi daj **ramkę 2 px na całym obwodzie**.
- Zostaw **dużo bieli**. Sekcje oddzielaj przestrzenią (`space.6xl`), nie liniami.
- Kolory bierz **z palety Zusika i ZUS**:
  - mięta: akcja główna i stopka;
  - granat: tytuły i tekst na mięcie;
  - granat ZUS: linki;
  - niebieski ZUS: zaznaczenie i fokus pól;
  - żółty ZUS: akcent.
- Używaj **krótkich zdań**: nagłówek plus jeden akapit, a potem akcja.
- Etykiety przycisków pisz **WERSALIKAMI** z rozstrzeleniem `--tracking-label`.
- Zachowuj **rytm wierszy**: ilustracja (lub Zusik) i tekst obok siebie na desktopie, naprzemiennie lewo–prawo, a na telefonie jedno pod drugim.

### Nie rób

- Nie dodawaj cieni, gradientów, szkła, `backdrop-filter` ani grubszej dolnej ramki.
- Nie kładź tekstu na zieleni ZUS (`#00993F`) ani na niebieskim ZUS (`#3F84D2`). Żaden kolor tekstu z palety nie spełnia na nich AA. Biały tekst tylko na granacie.
- Nie dodawaj przejść CSS do stanów przycisków i kart.
- Nie wprowadzaj kolorów spoza [tokeny.md](tokeny.md) i nie przyciemniaj ich „na oko”.
- Nie rób pigułek ani pełnych kół (wyjątek: elementy efektu z [gooey.md](gooey.md), jeśli zespół je zatwierdzi).
- Nie dawaj kilku równorzędnych przycisków głównych obok siebie.
- Nie wstawiaj logo, ilustracji ani tekstów ze strony źródłowej.
- Nie dodawaj animacji wejścia do bloków treści. Animacje dostarcza zespół, zob. [motion.md](motion.md#5-animacje-dostarczane-przez-zespół).

---

## 5. Decyzje zespołu

Wszystkie decyzje zatwierdził właściciel (status: uzgodnione).

1. **WCAG 2.1 AA ma pierwszeństwo przed wiernością źródłu:**
   - granatowy tekst na mięcie;
   - linki w granacie ZUS;
   - akapity w `#4b4b4b`;
   - widoczny pierścień fokusu;
   - widoczne etykiety pól.
2. **Paleta z maskotki i ZUS** (2026-11-21). Kolory strony źródłowej zostały wymienione na kolory Zusika i ZUS. Ze źródła zostały rytm, skale, typografia i neutralne szarości.
3. **Płasko, bez dolnej krawędzi** (2026-11-21). Efekt „klawisza” ze źródła za mocno się z nim kojarzył.
4. **Kroje:** Nunito zamiast obu krojów własnościowych (do weryfikacji).
5. **Bez brandingu źródła:** bez logo, ilustracji, nazw i tekstów.
6. **Ten folder jest źródłem prawdy o wyglądzie** i zastępuje `DESIGN.md`.
