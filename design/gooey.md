# Efekt gooey (`liquid-gooey`)

Czytaj tylko wtedy, gdy zadanie dotyczy przycisku lub grupy elementów, które mają się „zlewać” jak ciecz. Efekt to **dodatek zespołu**, nie element stylu źródłowego. W źródle nic takiego nie występuje. Bazowy wygląd przycisków opisuje [komponenty.md](komponenty.md#1-przyciski) i ten opis zostaje nadrzędny.

Status całego pliku:

- API biblioteki: wykryte w kodzie paczki `liquid-gooey@0.2.2` (README, typy, `dist`).
- Połączenie ze stylem: wywnioskowane.
- Miejsca użycia: do omówienia.

---

## 1. Co to jest

Biblioteka dla **React 18+**, bez zależności, licencja MIT. Dokumentacja: https://libraries.dev/gooey.html.

Biblioteka rysuje dwie warstwy:

- **pod spodem:** sylwetka w SVG z filtrem „goo”, czyli rozmycie i podbicie kontrastu, plus cień;
- **na wierzchu:** prawdziwy DOM, czyli tekst, ikony, fokus i ARIA. Ta warstwa nie jest filtrowana, więc tekst zostaje ostry.

Elementy, które się dotykają, zlewają się w jedną bryłę.

```bash
npm install liquid-gooey
```

Stack projektu nie jest jeszcze wybrany. Jeśli nie będzie to React, efektu nie ma. Wtedy używamy zwykłych `.btn` bez zmian.

---

## 2. API (wykryte w kodzie paczki 0.2.2)

### `<Liquid>`: grupa

| Prop | Domyślnie | Znaczenie |
| --- | --- | --- |
| `blur` | 6 | Miękkość cieczy w px. Elementy łączą się, gdy `blur` jest mniej więcej równy odstępowi między nimi albo większy. |
| `contrast` | 18 | Ostrość krawędzi cieczy. |
| `fill` | `'#fff'` | Kolor powierzchni. Przyjmuje `var(--…)`. |
| `shadow` | — | Składnia `box-shadow`, wiele warstw. Rysowany na **scalonej** sylwetce. Warstwy `inset` malują wewnątrz krawędzi. |
| `filterPadding` | 24 | Zapas obszaru filtra w px, gdy elementy wyjeżdżają poza grupę. |
| `waviness`, `wavinessFreq` | 0, 0.018 | Falowanie brzegu. U nas zostaw 0, bo krawędzie mają być spokojne (wywnioskowane). |

### `<Liquid.Item>`: element grupy

| Prop | Znaczenie |
| --- | --- |
| `effect` | `'morph'` (domyślny: łączenie i zmiana kształtu), `'move'` (ciecz goni element, ciągnie się ogon), `'melt'` (dwa obrazy się przenikają), `'bend'` (bryła ugina się przy ruchu) |
| `x`, `y`, `scale` | Pozycja sterowana przez bibliotekę. Element i ciecz animują się razem. |
| `transition` | `'snappy'`, `'smooth'`, `'bouncy'`, `{ stiffness, damping, mass }` albo `{ duration, ease }` |
| `delay` | Opóźnienie w ms. |
| `morph` | `{ shape, speed, bounce, contentBlur }`: zmiana kształtu jak galaretka. |
| `move` | `{ springiness, wobble, stretch, trail }` |
| `radius` | Nadpisuje zaokrąglenie odczytane z computed style. |

Wartości presetów `transition` z kodu paczki:

| Preset | stiffness | damping | mass |
| --- | --- | --- | --- |
| `snappy` | 480 | 34 | 1 |
| `smooth` | 190 | 26 | 1 |
| `bouncy` | 320 | 17 | 1 |

Przy `prefers-reduced-motion: reduce` przejścia sterowane przez bibliotekę (`x`, `y`, `scale`) zmieniają się w natychmiastowy skok. To wynika z kodu paczki: `resolveTransition` przy ograniczeniu ruchu zwraca czas 0. Zachowanie efektów `move` i `bend` przy ograniczeniu ruchu jest do weryfikacji.

---

## 3. Jak połączyć efekt z naszym stylem

Wszystko w tej sekcji jest wywnioskowane, a efekt wizualny trzeba sprawdzić na prototypie (do weryfikacji).

### 3.1 Zasady

1. **Powierzchnią jest sylwetka, nie przycisk.** Wewnątrz `<Liquid>` przycisk ma przezroczyste tło i ramkę (klasa `.btn--liquid`). Kolor wypełnienia przechodzi do `fill` grupy.
2. **Ramkę 2 px przenosimy do `shadow` grupy jako pierścień `inset`.** Rysuje się wewnątrz krawędzi scalonej sylwetki, więc zlane przyciski mają jedną wspólną obwódkę. Przycisk główny wygląda wtedy jak ciało Zusika: mięta w zielonej obwódce, która płynnie się łączy i rozdziela.
3. **W `shadow` wpisz kolor literalnie**, skopiowany z [tokeny.md](tokeny.md). Parser cienia w bibliotece dzieli tekst na liczby i kolor. Działanie `var()` w `shadow` nie jest sprawdzone (do weryfikacji). `fill` przyjmuje `var()`.
4. **Jedna grupa to jeden wariant.** Grupa ma jeden `fill` i jeden `shadow`, więc nie mieszaj `primary` z `secondary` w jednej grupie.
5. **Ustawienia dla wariantów:**

   | Wariant | `fill` | `shadow` |
   | --- | --- | --- |
   | `primary` | `var(--color-action-primary-fill)` | `"inset 0 0 0 2px #338C5C"` |
   | `secondary` | `var(--color-action-secondary-fill)` | `"inset 0 0 0 2px #BEC3CE"` |

   Do weryfikacji na prototypie.
6. **Bez cienia zewnętrznego.** System jest płaski, więc `shadow` zawiera tylko warstwę `inset`.
7. **Zaokrąglenie** biblioteka odczytuje z computed style przycisku. Zostaw zaokrąglenie z `.btn` (`--radius-md`) albo dodaj `.btn--app` (`--radius-lg`).
8. **Rozmiar grupy** ustaw tak, żeby mieściła pełny zasięg ruchu elementów, np. rozwinięte menu.
9. **Fokus działa bez zmian.** Pierścień `outline` jest na prawdziwym przycisku w warstwie treści.

### 3.2 Czego nie da się przenieść 1:1 (do omówienia)

| Zachowanie zwykłego przycisku | Problem w `<Liquid>` | Opcje |
| --- | --- | --- |
| Hover i naciśnięcie: `filter: brightness()` | Filtr na przycisku zmieni tylko tekst, bo powierzchnia jest w SVG | Pomiń hover i naciśnięcie albo na ich czas zmieniaj `fill` grupy (do weryfikacji) |
| Stany natychmiastowe | Ruch cieczy to z definicji sprężyna | Sprężyny tylko dla ruchu i łączenia. Zmiany koloru i stanów nadal natychmiastowe. |

### 3.3 Receptura

```css
/* przycisk wewnątrz <Liquid>: powierzchnię daje sylwetka grupy */
.btn--liquid { --btn-fill: transparent; --btn-border: transparent; }
.btn--liquid:hover, .btn--liquid:active { filter: none; }   /* zob. 3.2 */

/* menu z przykładu niżej: w spoczynku przyciski leżą jeden na drugim,
   a grupa rezerwuje miejsce na pełne rozwinięcie (zasada 7) */
.liquid-menu { position: relative; width: var(--size-cta-width); height: calc(var(--size-control-height) * 3 + var(--space-sm) * 2); }
.liquid-menu .btn { position: absolute; left: 0; bottom: 0; width: 100%; }
```

```tsx
import { Liquid } from 'liquid-gooey'

// Przykład: przycisk główny, który rozwija się w dwie akcje.
// Kolor obwódki przepisany z tokeny.md, bo shadow potrzebuje wartości literalnej (3.1, pkt 3).
export function PrimaryActionMenu({ open }: { open: boolean }) {
  return (
    <Liquid className="liquid-menu" fill="var(--color-action-primary-fill)" shadow="inset 0 0 0 2px #338C5C">
      <Liquid.Item x={0} y={open ? -62 : 0} transition="snappy">
        <button className="btn btn--liquid btn--app" aria-hidden={!open} tabIndex={open ? 0 : -1}>…</button>
      </Liquid.Item>
      <Liquid.Item x={0} y={open ? -124 : 0} transition="snappy" delay={40}>
        <button className="btn btn--liquid btn--app" aria-hidden={!open} tabIndex={open ? 0 : -1}>…</button>
      </Liquid.Item>
      <Liquid.Item>
        <button className="btn btn--liquid btn--app" aria-expanded={open}>…</button>
      </Liquid.Item>
    </Liquid>
  )
}
```

Przesunięcia w przykładzie wynikają z tokenów: `-62` = `--size-control-height` + `--space-sm`, `-124` to dwa takie kroki. Po rozwinięciu odstęp 12 px jest większy niż `blur` 6, więc przyciski się rozdzielają, a w spoczynku leżą na sobie jako jedna bryła. `delay={40}` pochodzi z przykładu w dokumentacji biblioteki. Ostateczny układ i tempo ustala zespół (do omówienia).

`Liquid.Item` owija dziecko w `<span style="display: contents">`. Wynika to z kodu paczki. Dlatego pozycjonuj sam przycisk, a nie owijkę.

Wybór presetu (wywnioskowane, do omówienia):

- `snappy` jako domyślny, bo najbliżej natychmiastowej reakcji źródła;
- `bouncy` tylko tam, gdzie zespół świadomie chce zabawy;
- `smooth` do większych paneli.

---

## 4. Kandydaci do omówienia

Każda pozycja to propozycja, nie decyzja. Zatwierdzoną animację zespół wpisuje do [motion.md](motion.md#5-animacje-dostarczane-przez-zespół).

| Miejsce | Efekt | Dlaczego może pasować | Ryzyko |
| --- | --- | --- | --- |
| Wskaźnik wybranej zakładki „Moja sytuacja / Mój plan” | `effect="move"` | Ciecz goni wybraną zakładkę, ruch jest sterowany przez rodzica | Zakładki muszą zostać zgodne z wzorcem ARIA Tabs |
| Przycisk główny rozwijany w kilka akcji | `morph` z `x`/`y` | Kilka akcji „wypływa” z jednej, zostaje jedna akcja główna w sekcji | Ukryte akcje muszą być dostępne z klawiatury |
| Grupa przycisków wyboru odpowiedzi (np. w rozmowie z maskotką) | `morph` | Zaznaczona odpowiedź może się zlać z przyciskiem „dalej” | Możliwe rozproszenie uwagi przy formularzu urzędowym |
| Kafle wyboru (karty) | — | Nie polecam. Karty mają ramkę zamiast wypełnienia, a efekt potrzebuje jednolitej powierzchni. | — |

---

## 5. Kiedy nie używać

Wszystko w tej sekcji jest wywnioskowane.

- Pojedynczy przycisk, który nigdy się z niczym nie łączy. Wtedy wystarczy `.btn`.
- Formularze i miejsca, gdzie rodzic wpisuje dane albo podejmuje decyzję prawną.
- Gdy grupa łączyłaby różne warianty (różne kolory).
- Gdy stack nie jest Reactem 18+.
