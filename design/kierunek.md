# Kierunek designu

Czytaj przed zaprojektowaniem nowego ekranu lub sekcji. Plik opisuje charakter stylu. Konkretne wartości są w [tokeny.md](tokeny.md), a budowa elementów w [komponenty.md](komponenty.md).

Opis charakteru i nastroju to **interpretacja** (wywnioskowane). Opiera się na obserwacjach z sekcji 2, a każda z nich ma status.

---

## 1. Charakter w trzech zdaniach

Interfejs jest **przyjazny i zabawowy, ale bardzo uporządkowany**. Elementy klikalne wyglądają jak **fizyczne klawisze**: mają twardą dolną krawędź i przy naciśnięciu „wchodzą” w powierzchnię. Wokół nich jest **dużo bieli i jeden mocny kolor akcji**. Tło nie konkuruje z treścią, a ciepło dają zaokrąglony krój, płaskie kolory i ilustracje, nie efekty.

Nastrój: optymistyczny, lekki, pewny siebie, bez urzędowego chłodu. Ekran mówi „to proste, zrób jeden krok”.

---

## 2. Obserwacje, na których opieram kierunek

| # | Obserwacja | Status |
| --- | --- | --- |
| 1 | Biel zajmuje 67% malowanej powierzchni strony. Kolor pojawia się w przyciskach, nagłówkach, stopce i ilustracjach. | wykryte |
| 2 | Każdy przycisk i karta ma twardą dolną krawędź: cień bez rozmycia albo grubszą dolną ramkę. Przycisk wciśnięty przesuwa się w dół o wysokość krawędzi, a krawędź znika. | wykryte |
| 3 | Brak rozmytych cieni, gradientów i `backdrop-filter`. | wykryte |
| 4 | Zaokrąglenia 12 i 16 px. Bez pigułek i bez ostrych rogów. | wykryte |
| 5 | Dwa kroje: gruby, zaokrąglony krój nagłówków pisanych małymi literami oraz krój UI z etykietami przycisków w wersalikach z rozstrzeleniem. | wykryte |
| 6 | Jedna barwa obramowań: jasnoszara ramka 2 px wszędzie. | wykryte |
| 7 | Wszystkie 20 obrazów na stronie to płaskie, kolorowe ilustracje SVG. Część jest animowana skryptem. | wykryte; animacja: wywnioskowane |
| 8 | Duże odstępy: sekcje mają 96 px w pionie. Wiersz to kwadratowa ilustracja 530 px obok kolumny tekstu 473–503 px. | wykryte |
| 9 | Stany przycisków zmieniają się natychmiast, bez przejścia. Animacja jest zarezerwowana dla ilustracji, nagłówka i tła przy przewijaniu. | wykryte |
| 10 | Krótkie teksty: pod nagłówkiem jeden akapit o długości 150–280 znaków. Jedna akcja główna na sekcję; ta sama akcja wraca w ostatniej sekcji strony. | wykryte (długości, powtórzenie akcji), wywnioskowane (zasada) |
| 11 | Główne przyciski mają stałą szerokość 330 px. Nie rozciągają się na cały kontener i nie są dopasowane do tekstu. | wykryte |

---

## 3. Czym ten styl różni się od generycznego szablonu

| Generyczny szablon | Ten styl |
| --- | --- |
| Głębia przez miękkie cienie (`box-shadow` z rozmyciem) | Głębia przez twardą dolną krawędź w ciemniejszym odcieniu wypełnienia |
| Przyciski w kształcie pigułki, gradient, animowany hover | Płaski kolor, zaokrąglenie 12/16 px, wersaliki z rozstrzeleniem, hover to tylko zmiana jasności, naciśnięcie to przesunięcie w dół |
| Karty z cieniem i zdjęciem | Karty z szarą ramką 2 px i dolną ramką 4 px, ikona lub ilustracja, wyśrodkowana treść |
| Neutralny, wąski sans-serif | Zaokrąglony, „miękki”, gruby krój |
| Gęsta siatka kafli i dużo akcji na ekranie | Jedna akcja główna, dużo bieli, rytm „ilustracja ↔ krótki tekst” |
| Animacje wejścia na każdym bloku | Interfejs reaguje natychmiast, ruch mają tylko ilustracje i tło sekcji |

---

## 4. Rób / nie rób

### Rób

- W każdej sekcji daj **jedną akcję główną** (przycisk wypełniony). W oknie nie powinno być widać dwóch naraz. Pozostałe akcje to przyciski obrysowane albo linki.
- Każdemu elementowi klikalnemu daj **krawędź** i stan naciśnięcia zgodny z [komponenty.md](komponenty.md#1-przyciski).
- Zostaw **dużo bieli**. Sekcje oddzielaj przestrzenią (`space.6xl`), nie liniami.
- Kolor stosuj **płasko**: wypełnienie plus jego ciemniejsza krawędź.
- Używaj **krótkich zdań**: nagłówek plus jeden akapit, a potem akcja.
- Etykiety przycisków pisz **WERSALIKAMI** z rozstrzeleniem `--tracking-label`, a nagłówki display **małymi literami**, jeśli nie zawierają nazw własnych ani skrótów.
- Zachowuj **rytm wierszy**: ilustracja i tekst obok siebie na desktopie, naprzemiennie lewo–prawo, a na telefonie jedno pod drugim.
- Ilustracje projektu (np. maskotka) traktuj jak w źródle: płaskie, kolorowe, wektorowe, z dużą ilością powietrza dookoła. Status: wywnioskowane.

### Nie rób

- Nie używaj rozmytych cieni, gradientów, szkła ani `backdrop-filter`.
- Nie dawaj białego tekstu na zielonym ani jasnoniebieskim. Nie spełnia WCAG AA (decyzja projektu, zob. [tokeny.md](tokeny.md#13-tekst)).
- Nie dodawaj przejść CSS do stanów przycisków i kart. Zmieniają się natychmiast.
- Nie wprowadzaj nowych kolorów spoza [tokeny.md](tokeny.md) i nie przyciemniaj ich „na oko”.
- Nie rób pigułek ani pełnych kół (wyjątek: elementy efektu z [gooey.md](gooey.md), jeśli zespół je zatwierdzi).
- Nie dawaj kilku równorzędnych przycisków wypełnionych obok siebie.
- Nie wstawiaj logo, maskotki ani tekstów ze strony źródłowej. Przenosimy system, nie markę.
- Nie dodawaj animacji wejścia do bloków treści. Animacje zespół dostarczy sam, zob. [motion.md](motion.md#5-animacje-dostarczane-przez-zespół).

---

## 5. Adaptacja do naszego projektu

Te decyzje odróżniają nasz system od źródła. Status: wywnioskowane, zatwierdzone przez właściciela.

1. **WCAG 2.1 AA ma pierwszeństwo przed wiernością źródłu.** Ciemny tekst na zielonym przycisku, linki w `#2b70c9`, nagłówki display w granacie `#042c60`, akapity w `#4b4b4b` zamiast `#777777`, widoczny pierścień fokusu i widoczne etykiety pól.
2. **Kroje:** Nunito zamiast obu krojów własnościowych (do weryfikacji).
3. **Bez brandingu źródła:** bez logo, maskotki, nazw i tekstów.
4. **Ten folder jest źródłem prawdy o wyglądzie i zastępuje `DESIGN.md`** w repozytorium.
