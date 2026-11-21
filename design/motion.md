# Motion

Czytaj, gdy element ma się poruszać albo zmieniać w czasie. Czasy i easingi są tokenami w [tokeny.md](tokeny.md#7-ruch). Statusy objaśnia [README](README.md#statusy).

Ten plik ma pięć części:

1. przejścia CSS wykryte w źródle;
2. ruch sterowany skryptem, wykryty tylko próbkowaniem;
3. czego nie dało się wykryć i jak to uzupełnić;
4. zasady dla agenta;
5. **miejsce na animacje dostarczane przez zespół**. Agent nie projektuje ich sam.

---

## 1. Wykryte przejścia CSS

| Co | Właściwość | Czas | Easing | Wyzwalacz | Status |
| --- | --- | --- | --- | --- | --- |
| Przyciski i karty: hover, active | `filter`, `transform`, `box-shadow` | `--motion-state` (0ms) | — | hover, naciśnięcie | wykryte (computed `transition: all 0s`) |
| Dolna ramka nagłówka strony | `border-color` | `--motion-duration-base` (300ms) | `--motion-easing-standard` | zjechanie z samej góry strony | wykryte |
| Chowanie nagłówka strony | `transform` | `--motion-duration-slow` (400ms) | `--motion-easing-out` | dalsze przewijanie w dół | wykryte |
| Lista w pasku z karuzelą | `transform` | `--motion-duration-slower` (500ms) | `--motion-easing-in-out` | klik w strzałkę | wykryte |
| Panel wysuwany z boku (prawdopodobnie szuflada) | `right` | `--motion-duration-base` | `ease` (domyślny) | otwarcie panelu | wykryte; element: wywnioskowane |
| Nieustalony element | `filter` | `--motion-duration-fast` (200ms) | `ease` (domyślny) | — | wykryte; element: do weryfikacji |

**Najważniejsza cecha:** reakcja kontrolek na dotyk jest natychmiastowa. „Klawiszowość” daje skok o wysokość krawędzi, a nie płynne przejście. Status: wykryte.

---

## 2. Ruch sterowany skryptem (wykryty próbkowaniem)

Tych wartości nie da się odczytać z arkuszy, więc zmierzyłem je, przewijając stronę i odczytując style co 400 px.

| Co | Co zaobserwowano | Status |
| --- | --- | --- |
| Nakładka modala i nakładka szuflady | Web Animations API, `opacity`, 300ms, `ease` | wykryte |
| Tło sekcji `--color-surface-info` | Warstwa tła pełnej szerokości zmienia `opacity` stylem inline zależnie od przewinięcia. Próbki dla przewinięcia 0–2000 / 2400 / 2800 / 3200 / 3600 px: 0 / 0.10 / 0.59 / 0.99 / 1. Tło pojawia się płynnie na odcinku około 1000 px, gdy sekcja wchodzi w ekran. | wykryte (próbki); krzywa i progi: do weryfikacji |
| Chowanie nagłówka | Po przewinięciu około 3200 px pasek ma `translateY(-72px)`. Powrotu przy przewijaniu w górę nie testowałem. | wykryte; próg i powrót: do weryfikacji |
| Ilustracje | SVG z układem typowym dla odtwarzacza animacji wektorowych: `<svg>` w `<span>`, `transform: translate3d(0,0,0)`, `content-visibility`. Na stronie nie ma `<canvas>` ani `<video>`. | wywnioskowane (Lottie lub podobny); czasy: niewykrywalne |

---

## 3. Czego nie dało się wykryć i jak to uzupełnić

| Brak | Dlaczego | Jak uzupełnić |
| --- | --- | --- |
| Czasy, krzywe i pętle animacji ilustracji | Animacja liczona skryptem klatka po klatce, computed styles jej nie pokazują | DevTools → Performance (nagranie przewijania); w zakładce Network otwórz plik animacji i odczytaj `fr` (klatki/s) oraz `op` (liczba klatek). Nie kopiuj samych plików, to branding. |
| Dokładna krzywa tła sekcji przy przewijaniu | Wartość ustawia skrypt | DevTools → Elements, obserwuj `style="opacity…"` na warstwie tła podczas wolnego przewijania co 100 px |
| Próg chowania i powrotu nagłówka | Logika skryptu | Ręczny test: przewiń w dół i w górę, obserwuj `transform` paska |
| Obsługa `prefers-reduced-motion` w źródle | 9 arkuszy z innej domeny było nieczytelnych | DevTools → Rendering → „Emulate CSS prefers-reduced-motion: reduce”, potem obejrzyj stronę |
| Animacje wejścia modala i treści | Zarejestrowano tylko nakładkę | DevTools → Animations (spowolnienie 10%) podczas otwierania modala |
| Nagranie referencyjne całości | — | `npx designlang replay <adres źródła z zrodla.md>` zapisuje nagranie WebM przewijania i hovera |

---

## 4. Zasady dla agenta

Wszystko w tej sekcji jest wywnioskowane, chyba że zaznaczono inaczej.

1. **Czasy i easingi wyłącznie z tokenów.** Nie wpisuj `0.25s`, `ease-out` ani innych wartości spoza [tokeny.md](tokeny.md#7-ruch).
2. **Stany kontrolek bez przejść** (hover, active, focus, selected). Wykryte.
3. **Animuj tylko `transform` i `opacity`.** Wyjątki to przejścia z sekcji 1 (`border-color`, `filter`, `right`), które przenosimy tak, jak są.
4. **Ograniczenie ruchu jest obowiązkowe.** Wymagają tego specyfikacje projektu, nie źródło:

   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after { transition-duration: 0ms !important; animation-duration: 0ms !important; animation-iteration-count: 1 !important; scroll-behavior: auto !important; }
   }
   ```

   Ruch sterowany skryptem (scroll, sprężyny, efekt gooey) musi sprawdzać `matchMedia('(prefers-reduced-motion: reduce)')` i od razu pokazywać stan końcowy.
5. **Bez animacji wejścia** dla bloków treści (fade-in czy slide-up przy przewijaniu). Źródło tego nie robi. Wyjątek: tło sekcji z tabeli w sekcji 2, jeśli zespół je zatwierdzi.
6. **Gdy brakuje animacji, nie dopisuj jej.** Jeśli element ze slotu w sekcji 5 nie ma jeszcze opisu, zbuduj jego stan końcowy bez ruchu i zostaw znacznik w składni danego języka:
   - JS/TS: `// TODO(motion): <slot>`;
   - CSS: `/* TODO(motion): <slot> */`;
   - HTML: `<!-- TODO(motion): <slot> -->`.

---

## 5. Animacje dostarczane przez zespół

**Status: czeka na materiały i omówienie.** Zespół dostarczy animacje i ustali, jak mają wyglądać. Ten rozdział to miejsce na te ustalenia. Do czasu wpisu agent stosuje zasadę 6 z sekcji 4.

### 5.1 Szablon wpisu

Każdą zatwierdzoną animację dopisz jako osobny podrozdział, kopiując ten szablon:

```markdown
### <nazwa animacji>
- Status: propozycja | do omówienia | uzgodnione (data, kto)
- Element i miejsce: <komponent / sekcja / ekran>
- Wyzwalacz: <wejście w widok | przewinięcie | klik | zmiana stanu | czas>
- Co się zmienia: <właściwości, stan początkowy → końcowy>
- Czas i krzywa: <token z tokeny.md albo sprężyna {stiffness, damping, mass}>
- Choreografia: <kolejność, opóźnienia między elementami>
- Ograniczenie ruchu: <co widać przy prefers-reduced-motion>
- Materiał źródłowy: <plik, link, nagranie>
- Technologia: <CSS | Motion | liquid-gooey | Lottie | inne>
```

### 5.2 Sloty znane ze specyfikacji projektu

Te miejsca opisują specyfikacje w repozytorium. Ruch nie jest dla nich ustalony.

| Slot | Gdzie w specyfikacji | Status |
| --- | --- | --- |
| Maskotka podąża za przewijaniem i zatrzymuje się przy sekcji | `SPEC.md` → „Zusik podczas przewijania” | do omówienia |
| Przełączanie zakładek „Moja sytuacja / Mój plan” (wskaźnik zakładki) | `SPEC.md` → Hero, `inspiracjeelementowistron.md` | do omówienia; kandydat do `effect="move"` z [gooey.md](gooey.md) |
| Dymki i kolejne pytania w rozmowie z maskotką | `SPEC-PO-LOGOWANIU.md` → „Pierwsze wejście” | do omówienia |
| Przyciski i grupy z efektem gooey | [gooey.md](gooey.md#4-kandydaci-do-omówienia) | do omówienia |
| Tło sekcji pojawiające się przy przewijaniu (wzorzec ze źródła) | sekcja 2 tego pliku | do omówienia: przenosimy czy nie |
