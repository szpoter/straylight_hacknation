# Komponenty

Czytaj przed zbudowaniem kontrolki lub sekcji. Każdy element ma:

- anatomię;
- warianty;
- stany;
- recepturę CSS opartą na zmiennych z [tokeny.md §9](tokeny.md#9-blok-css-do-skopiowania). Receptury zakładają reset `box-sizing: border-box` z tego bloku.

Statusy objaśnia [README](README.md#statusy).

Zasady wspólne:

- **Stany zmieniają się natychmiast** (`--motion-state`, bez `transition`). Status: wykryte.
- **Fokus z klawiatury:** `outline: var(--focus-ring-width) solid var(--color-focus-ring); outline-offset: var(--focus-ring-offset);`. Na ciemnym pasie używaj `--color-focus-ring-on-inverse`. Status: szerokość i odsunięcie wykryte; kolor i widoczność wywnioskowane, bo źródło nie pokazuje fokusu.
- **Komponent spoza tego pliku** składasz z tokenów i istniejących wzorców: ramka 2 px, krawędź, `--radius-lg` dla kontenerów, natychmiastowe stany. W kodzie oznacz go `/* nowy komponent: do weryfikacji */`. Gotowe złożenia dla zakładek, panelu i etykiety są w [§11](#11-komponenty-złożone-wywnioskowane).
- **Zachowanie (zakładki, modal, rozwijanie) może używać JS.** Stack nie jest wybrany, więc receptury są w czystym CSS i HTML.

---

## 0. Typografia i ikony

### 0.1 Nagłówki i tekst

```css
.display-xl { margin: 0; font: var(--type-display-xl); letter-spacing: var(--tracking-display-xl); color: var(--color-text-display); }
.display-lg { margin: 0; font: var(--type-display-lg); color: var(--color-text-display); }
.title-hero { margin: 0; font: var(--type-title-hero); color: var(--color-text-primary); }
.text-body  { margin: 0; font: var(--type-body); color: var(--color-text-primary); max-width: var(--container-text); }
```

Status:

- rozmiary i kroje: wykryte;
- kolory: wywnioskowane AA (źródło: nagłówki display zielone, akapity `#777777`);
- `max-width` akapitu: wykryte.

### 0.2 Ikony

| Cecha | Wartość | Status |
| --- | --- | --- |
| Styl | konturowe, obrys 2 px, zaokrąglone zakończenia | wykryte (tylko 4 ikony, do weryfikacji) |
| Siatka rysunku | 16 px (`viewBox="0 0 16 16"`) | wykryte (mała próbka) |
| Kolor | `currentColor` | wykryte |
| Rozmiar renderowany | `--size-icon` (1em, skaluje się z tekstem) | wywnioskowane, do weryfikacji |
| Zestaw | nie wykryto biblioteki; wybór zestawu należy do zespołu | — |

Ikona obok tekstu ma `aria-hidden="true"`. Ikona bez tekstu (np. zamknięcie) ma etykietę `aria-label`. Status: wywnioskowane.

---

## 1. Przyciski

### 1.1 Anatomia (wykryte)

Element ma **przezroczystą dolną ramkę 4 px**, która rezerwuje miejsce na krawędź. Kolor i krawędź siedzą na `::before` pod etykietą, więc wciśnięcie przesuwa element w dół bez zmiany układu wokół.

```
┌──────────────────────────────┐  ← ::before: wypełnienie, radius
│           ETYKIETA           │     wysokość = 50 − 4 = 46 px
└──────────────────────────────┘
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀  ← box-shadow 0 4px 0 <edge> wypełnia dolną ramkę
```

| Cecha | Wartość | Status |
| --- | --- | --- |
| Wysokość | `--size-control-height` (50px) | wykryte |
| Szerokość | `--size-cta-width` w hero i sekcjach; 100% kolumny w formularzu i modalu; dopasowana do treści w nagłówku | wykryte |
| Wewnętrzny odstęp w poziomie | `--space-md` | wykryte |
| Etykieta | `--type-label-button`, wersaliki, `--tracking-label` | wykryte |
| Zaokrąglenie | `--radius-md` na stronach publicznych; `--radius-lg` (`.btn--app`) w modalach i po zalogowaniu | wykryte (użycie); wywnioskowane (zasada) |
| Odstęp między przyciskami w stosie | `--space-sm` | wykryte |
| Ikona przed etykietą | `--size-icon`, odstęp `--space-xs` | wykryte (obecność); rozmiar i odstęp: wywnioskowane, do weryfikacji |

### 1.2 Warianty

| Wariant | Wypełnienie | Ramka | Krawędź | Etykieta | Status |
| --- | --- | --- | --- | --- | --- |
| `primary` | `--color-action-primary-fill` | — | `0 4px 0` `--color-action-primary-edge` | `--color-action-primary-text` | wykryte; etykieta: wywnioskowane AA |
| `secondary` | `--color-action-secondary-fill` | 2px `--color-action-secondary-border` | `0 2px 0` `--color-action-secondary-edge` | `--color-action-secondary-text` | wykryte; etykieta: wywnioskowane AA |
| `neutral` | jak `secondary` | jak `secondary` | jak `secondary` | `--color-action-neutral-text` | wykryte |
| `info` | `--color-action-info-fill` | — | `0 4px 0` `--color-action-info-edge` | `--color-action-info-text` | wykryte; etykieta: wywnioskowane AA, do weryfikacji |
| `on-inverse` | biały, na ciemnym pasie | — | — | ciemna | wykryte na zrzucie; wartości do weryfikacji, nie używaj bez weryfikacji |

Wariantu destrukcyjnego (czerwonego) nie wykryto. Ani czerwony tekst, ani biały na czerwonym nie spełnia AA. Dla akcji nieodwracalnej użyj `neutral` plus potwierdzenie i zapytaj zespół.

### 1.3 Stany

| Stan | `primary` / `info` | `secondary` / `neutral` | Status |
| --- | --- | --- | --- |
| hover | `filter: brightness(1.1)` | `filter: brightness(0.9)` | wykryte |
| active | `translateY(4px)`, krawędź `none` | `translateY(2px)`, krawędź `none` | wykryte |
| focus-visible | pierścień fokusu | pierścień fokusu | wywnioskowane |
| disabled | wypełnienie `--color-surface-disabled`, etykieta `--color-text-disabled`, bez krawędzi, bez hover i active | jak obok | wywnioskowane, do weryfikacji |
| loading | nie wykryto, zapytaj zespół | — | — |

### 1.4 Receptura CSS

```css
.btn {
  --btn-fill: var(--color-action-primary-fill);
  --btn-edge: var(--color-action-primary-edge);
  --btn-text: var(--color-action-primary-text);
  --btn-press: var(--edge-height);

  position: relative;
  isolation: isolate;                 /* ::before z z-index:-1 zostaje nad tłem rodzica */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  height: var(--size-control-height);
  padding: 0 var(--space-md);
  border: 0 solid transparent;
  border-bottom-width: var(--edge-height);   /* rezerwa na krawędź */
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--btn-text);
  font: var(--type-label-button);
  letter-spacing: var(--tracking-label);
  text-transform: uppercase;
  text-decoration: none;              /* gdy .btn jest linkiem <a> */
  cursor: pointer;
}
.btn::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background: var(--btn-fill);
  box-shadow: 0 var(--edge-height) 0 var(--btn-edge);
}
.btn:hover { filter: brightness(1.1); }
.btn:active { transform: translateY(var(--btn-press)); }
.btn:active::before { box-shadow: none; }
.btn:focus-visible { outline: var(--focus-ring-width) solid var(--color-focus-ring); outline-offset: var(--focus-ring-offset); }

/* obrysowane: secondary, neutral */
.btn--secondary, .btn--neutral {
  --btn-fill: var(--color-action-secondary-fill);
  --btn-edge: var(--color-action-secondary-edge);
  --btn-press: var(--edge-height-outline);
  border-width: var(--border-width) var(--border-width) var(--edge-height);
}
.btn--secondary { --btn-text: var(--color-action-secondary-text); }
.btn--neutral   { --btn-text: var(--color-action-neutral-text); }
.btn--secondary::before, .btn--neutral::before {
  inset: calc(var(--border-width) * -1);
  border: var(--border-width) solid var(--color-action-secondary-border);
  box-shadow: 0 var(--edge-height-outline) 0 var(--btn-edge);
}
.btn--secondary:hover, .btn--neutral:hover { filter: brightness(0.9); }

.btn--info {
  --btn-fill: var(--color-action-info-fill);
  --btn-edge: var(--color-action-info-edge);
  --btn-text: var(--color-action-info-text);
}

.btn--app   { border-radius: var(--radius-lg); }   /* modal, widoki po zalogowaniu */
.btn--cta   { width: var(--size-cta-width); max-width: 100%; }
.btn--block { width: 100%; }
.btn__icon  { width: var(--size-icon); height: var(--size-icon); flex: none; }

/* nieaktywny: wywnioskowane, do weryfikacji */
.btn:disabled, .btn[aria-disabled="true"] {
  --btn-fill: var(--color-surface-disabled);
  --btn-text: var(--color-text-disabled);
  cursor: not-allowed;
  filter: none;
  transform: none;
}
.btn:disabled::before, .btn[aria-disabled="true"]::before { box-shadow: none; }
```

Wymiary pseudo-elementów zgadzają się z pomiarami ze źródła przy `border-box`:

- `primary`: `::before` ma 46 px wysokości, krawędź 4 px.
- `secondary`: `::before` wystaje 2 px poza ramkę i ma 48 px wysokości, krawędź 2 px.

Na telefonie, w hero źródła, `secondary` wygląda na szaro wypełniony. Widać to na zrzucie, ale wartości nie zmierzyłem (do weryfikacji). Do czasu weryfikacji używaj wariantu jak na desktopie.

---

## 2. Link w tekście

| Cecha | Wartość | Status |
| --- | --- | --- |
| Kolor | `--color-text-link`; na `--color-surface-info` `--color-text-link-on-info` | wywnioskowane AA (źródło `#1cb0f6`) |
| Grubość | 700 | wykryte |
| Podkreślenie | brak | wykryte |
| Hover | nie wykryto zmiany | wykryte |

```css
.link { color: var(--color-text-link); font-weight: var(--font-weight-bold); text-decoration: none; }
.link:focus-visible { outline: var(--focus-ring-width) solid var(--color-focus-ring); outline-offset: var(--focus-ring-offset); }
.surface-info .link { color: var(--color-text-link-on-info); }
```

Grubość 700 to wyróżnik linku poza kolorem (WCAG 1.4.1). Nie zmieniaj jej.

---

## 3. Karta wyboru

Karta do wybrania jednej z opcji albo do rozwinięcia przykładu.

### 3.1 Anatomia

| Cecha | Wartość | Status |
| --- | --- | --- |
| Element | `<button>` | wykryte |
| Rozmiar | szerokość z siatki (§3.2), `max-width: --size-card-choice-max`, `min-height: --size-card-choice-height` | wykryte |
| Tło | `--color-surface-page` | wykryte |
| Ramka | `--border-width` `--color-border-default`, dolna `--border-width-card-bottom` | wykryte |
| Zaokrąglenie | `--radius-lg` | wykryte |
| Wewnętrzny odstęp | `--space-sm` `--space-sm` `--space-xl` | wykryte |
| Ikona lub flaga u góry | `--size-card-media-w` × `--size-card-media-h`, wyśrodkowana | wykryte |
| Ikona → tytuł | `--space-card-media-title` | wykryte |
| Tytuł | `--type-title-card`, `--color-text-primary`, wyśrodkowany | wykryte |
| Tytuł → podpis | `--space-card-title-meta` | wykryte |
| Podpis | `--type-body-card`, `--color-text-primary` | wywnioskowane AA (źródło `#777777`) |

### 3.2 Siatka kart (wykryte)

Liczba kolumn dopasowuje się do szerokości: karta nie może być węższa niż 150 px. Na desktopie siatka jest stała, 4 kolumny.

```css
.choice-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(var(--size-card-choice-min), 1fr));
  gap: var(--space-sm);
  margin-top: var(--space-heading-grid);    /* od nagłówka strony; pomiń, jeśli nad siatką jest inny element */
  padding: 0;
  list-style: none;
}
@media (min-width: 700px) { .choice-grid { gap: var(--space-xl); } }
@media (min-width: 1080px) {
  .choice-grid { grid-template-columns: repeat(4, var(--size-card-choice)); justify-content: center; }
}
```

Status:

- odstęp 12 / 24 px i próg 700 px: wykryte (w źródle jako marginesy kart);
- przejście na 4 stałe kolumny: wykryte w przedziale 981–1070 px; przypisanie do 1080: wywnioskowane.

### 3.3 Stany i semantyka

| Stan | Wygląd | Status |
| --- | --- | --- |
| hover | `filter: brightness(0.9)` | wykryte |
| active | bez zmiany | wykryte |
| wybrana / rozwinięta | ramka `--color-border-focus`, tło `--color-surface-info` | wywnioskowane, do weryfikacji |
| focus-visible | pierścień fokusu | wywnioskowane |
| disabled | nie wykryto, zapytaj zespół | — |

Semantyka zależy od tego, co robi karta. Wygląd stanu „wybrana” jest wspólny dla wszystkich trzech przypadków. Status: wywnioskowane.

- **Wybór jednej opcji:**
  - grupa `role="radiogroup"` z etykietą, karty `role="radio"` z `aria-checked`;
  - fokus wędruje strzałkami, a w kolejności Tab jest tylko wybrana karta (wzorzec WAI-ARIA Radio Group).
- **Karta rozwija treść** (np. przykład pod kartą): `<button aria-expanded="true|false" aria-controls="…">`.
- **Przełącznik niezależny:** `aria-pressed`.

```css
.choice-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: var(--size-card-choice-max);
  min-height: var(--size-card-choice-height);
  justify-self: center;
  padding: var(--space-sm) var(--space-sm) var(--space-xl);
  background: var(--color-surface-page);
  border: var(--border-width) solid var(--color-border-default);
  border-bottom-width: var(--border-width-card-bottom);
  border-radius: var(--radius-lg);
  color: var(--color-text-primary);
  font: var(--type-body-card);
  text-align: center;
  cursor: pointer;
}
.choice-card:hover { filter: brightness(0.9); }
.choice-card[aria-checked="true"],
.choice-card[aria-pressed="true"],
.choice-card[aria-expanded="true"] {
  border-color: var(--color-border-focus);
  background: var(--color-surface-info);
}
.choice-card:focus-visible { outline: var(--focus-ring-width) solid var(--color-focus-ring); outline-offset: var(--focus-ring-offset); }
.choice-card__media { width: var(--size-card-media-w); height: var(--size-card-media-h); margin: auto 0 var(--space-card-media-title); object-fit: contain; }
.choice-card__title { font: var(--type-title-card); }
.choice-card__meta  { margin-top: var(--space-card-title-meta); font: var(--type-body-card); }
```

`margin: auto 0 …` przy ikonie centruje treść karty w pionie, gdy karta jest wyższa niż jej zawartość. Status: wywnioskowane; w źródle ikona zaczyna się 50 px pod górną krawędzią karty o wysokości 217 px.

---

## 4. Pole formularza

### 4.1 Anatomia

Grupa pola składa się z etykiety, opakowania z inputem, tekstu pomocniczego i komunikatu błędu. Kolor i ramka są na **opakowaniu**, a `<input>` jest przezroczysty. Status: wykryte (opakowanie); grupa i etykieta: wywnioskowane.

| Cecha | Wartość | Status |
| --- | --- | --- |
| Etykieta nad polem | `--type-title-card`, `--color-text-primary`, odstęp do pola `--space-xs` | wywnioskowane (WCAG 3.3.2; źródło ma tylko placeholder) |
| Tekst pomocniczy (np. przykład formatu) | pod etykietą, `--type-body`, `--color-text-primary` | wywnioskowane (zastępuje placeholder) |
| Opakowanie: tło | `--color-surface-subtle` | wykryte |
| Opakowanie: ramka | `--border-width` `--color-border-field` | wykryte (grubość); kolor: wywnioskowane AA, do weryfikacji |
| Opakowanie: zaokrąglenie | `--radius-md` | wykryte |
| Wysokość | `--size-field-height`; z akcją w środku `--size-field-height-with-action` | wykryte |
| Input: wewnętrzny odstęp | `--space-xs` `--space-field-x` | wykryte |
| Input: tekst | `--type-input`, `--color-text-primary` | wykryte |
| Placeholder | **nie używamy** ([tokeny §1.3](tokeny.md#13-tekst)) | wywnioskowane AA |
| Akcja w polu (np. link do odzyskania hasła) | po prawej, `--type-label-small`, wersaliki, `--color-text-link` | wykryte (położenie, typografia); kolor: wywnioskowane AA |
| Komunikat błędu | pod polem, ikona `--color-status-error-edge` + tekst `--type-body` `--color-text-primary`, odstęp `--space-xs`, powiązany przez `aria-describedby` | wywnioskowane, do weryfikacji |

### 4.2 Stany

| Stan | Wygląd | Status |
| --- | --- | --- |
| focus | ramka opakowania `--color-border-focus`, także przy błędzie | wykryte (mechanizm); kolor: wywnioskowane AA |
| błąd (`aria-invalid="true"` na inpucie) | ramka `--color-border-error`, komunikat pod polem | wywnioskowane, do weryfikacji |
| disabled | nie wykryto, zapytaj zespół | — |

Gdy pole z błędem dostaje fokus, ramka zmienia się na kolor fokusu. Błąd nadal komunikuje tekst pod polem, a fokus musi być widoczny (WCAG 2.4.7).

### 4.3 Receptura CSS i HTML

```html
<div class="field-group">
  <label class="field-label" for="pesel">PESEL</label>
  <p class="field-hint" id="pesel-hint">…</p>
  <div class="field">
    <input class="field__input" id="pesel" aria-invalid="true" aria-describedby="pesel-hint pesel-error">
  </div>
  <p class="field-message" id="pesel-error"><svg class="field-message__icon" aria-hidden="true">…</svg>…</p>
</div>
```

```css
.form-stack { display: grid; gap: var(--space-sm); }
.form-stack__submit { margin-top: calc(var(--space-xl) - var(--space-sm)); }   /* pole → przycisk = 24px */

.field-group { display: grid; gap: var(--space-xs); }
.field-label { font: var(--type-title-card); color: var(--color-text-primary); }
.field-hint  { margin: 0; font: var(--type-body); color: var(--color-text-primary); }

.field {
  display: flex;
  align-items: center;
  min-height: var(--size-field-height);
  background: var(--color-surface-subtle);
  border: var(--border-width) solid var(--color-border-field);
  border-radius: var(--radius-md);
}
.field:has(.field__input[aria-invalid="true"]) { border-color: var(--color-border-error); }
.field:focus-within,
.field:has(.field__input[aria-invalid="true"]):focus-within { border-color: var(--color-border-focus); }

.field__input {
  flex: 1;
  min-width: 0;
  padding: var(--space-xs) var(--space-field-x);
  border: 0;
  background: transparent;
  font: var(--type-input);
  color: var(--color-text-primary);
}
.field__input:focus { outline: none; }   /* fokus pokazuje ramka opakowania */

.field-message { display: flex; gap: var(--space-xs); margin: 0; font: var(--type-body); color: var(--color-text-primary); }
.field-message__icon { flex: none; width: var(--size-icon); height: var(--size-icon); margin-top: 0.2em; color: var(--color-status-error-edge); }
```

`margin-top: 0.2em` przy ikonie wyrównuje ją optycznie do pierwszej linii tekstu. Status: wywnioskowane, do weryfikacji.

---

## 5. Separator „lub”

Dwie linie 2 px `--color-border-default`, między nimi etykieta `--type-label-small` w wersalikach z odstępem bocznym `--space-xs`. Nad i pod separatorem jest `--space-lg`. Status: wykryte.

Etykieta w źródle ma kolor `#afafaf`. U nas `--color-text-primary` (wywnioskowane AA).

```css
.divider-or { display: flex; align-items: center; margin: var(--space-lg) 0; }
.divider-or::before, .divider-or::after { content: ""; flex: 1; height: var(--border-width); background: var(--color-border-default); }
.divider-or__label { padding: 0 var(--space-xs); font: var(--type-label-small); letter-spacing: var(--tracking-label); text-transform: uppercase; color: var(--color-text-primary); }
/* w .form-stack marginesy dodają się do gap (12px): razem ma wyjść 20px */
.form-stack > .divider-or { margin: calc(var(--space-lg) - var(--space-sm)) 0; }
```

---

## 6. Modal pełnoekranowy

| Cecha | Wartość | Status |
| --- | --- | --- |
| Nakładka | `--color-surface-overlay`, `opacity` w `--motion-duration-base` z `--motion-easing-standard` | wykryte |
| Arkusz | pełny ekran, `--color-surface-page` | wykryte |
| Kolumna treści | `--container-form`, wyśrodkowana | wykryte |
| Tytuł | `--type-title-modal`, `--color-text-strong`, wyśrodkowany | wykryte |
| Zamknięcie | ikona „X” w lewym górnym rogu, szara, `aria-label="Zamknij"` | wykryte na zrzucie (położenie); rozmiar, kolor i odstęp: do weryfikacji |
| Akcja poboczna | `.btn--secondary.btn--app` w prawym górnym rogu | wykryte |
| Przyciski w środku | `.btn--block.btn--app` | wykryte |
| Odstęp między przyciskami alternatywnymi | `--space-stack-alt` | wykryte, do weryfikacji |
| Tekst prawny na dole | `--type-caption-legal`, wyśrodkowany, linki 700, `--color-text-primary` | wykryte; kolor: wywnioskowane AA (źródło `#afafaf`) |

Kolejność w kolumnie:

1. tytuł,
2. pola,
3. przycisk główny,
4. separator,
5. przyciski alternatywne,
6. tekst prawny.

Status: wykryte.

Dostępność, wszystko wywnioskowane: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` wskazujący tytuł, fokus na pierwszym polu albo tytule, pułapka fokusu, Esc zamyka, po zamknięciu fokus wraca do przycisku, który otworzył modal.

---

## 7. Nagłówek strony

| Cecha | Telefon (< 768) | Tablet (768–1079) | Desktop (≥ 1080) | Status |
| --- | --- | --- | --- | --- |
| Pozycja | `fixed`, u góry | to samo | to samo | wykryte |
| Wysokość | `--size-header-height` | to samo | to samo | wykryte |
| Tło | `--color-surface-page` | to samo | to samo | wykryte |
| Układ | logo wyśrodkowane, margines `--space-gutter` | logo wyśrodkowane, margines `--space-gutter` | `--container-content`, logo po lewej, akcja tekstowa po prawej (`justify-content: space-between`) | wykryte |
| Akcja tekstowa | ukryta | ukryta | `--type-label-small`, wersaliki, `--color-text-primary` | wykryte; kolor: wywnioskowane AA (źródło `#afafaf`) |

Zachowanie przy przewijaniu:

- **Dolna ramka:** `--border-width`, na samej górze strony przezroczysta, po zjechaniu `--color-border-default`. Zmiana w `--motion-duration-base` z `--motion-easing-standard`. Status: wykryte.
- **Chowanie:** przy dalszym przewijaniu w dół pasek wyjeżdża do góry (`translateY(-72px)`) w `--motion-duration-slow` z `--motion-easing-out`. Status: wykryte; próg i powrót przy przewijaniu w górę: do weryfikacji.

---

## 8. Pasek z karuzelą (opcjonalny)

Pas pełnej szerokości pod hero z poziomą listą pozycji i strzałkami po bokach. Status: wykryte.

- Wysokość `--size-strip-height`, ramki u góry i u dołu `--border-width` `--color-border-default`, boczny wewnętrzny odstęp `--space-3xl`.
- Lista w `--container-wide`. Siatka: strzałka 14 px, lista, strzałka 14 px, odstęp 30 px. Wartości 14 i 30 px są zmierzone, ale poza skalą (do weryfikacji).
- Przesunięcie listy: `transform` w `--motion-duration-slower` z `--motion-easing-in-out`.
- Pozycja: ikona i etykieta `--type-label-small` w wersalikach; kolor `--color-text-primary` (wywnioskowane AA, źródło `#777777`).

Użyj tylko, jeśli ekran naprawdę potrzebuje poziomej listy.

---

## 9. Stopka

| Cecha | Telefon (< 768) | Tablet (768–1079) | Desktop (≥ 1080) | Status |
| --- | --- | --- | --- | --- |
| Tło | `--color-surface-brand` | to samo | to samo | wykryte |
| Kontener siatki | `--container-footer` (375 px), wyśrodkowany | `--container-footer` (768 px), wyśrodkowany | `--container-footer` (988 px) | wykryte |
| Siatka | 1 kolumna `--size-footer-column`, wyrównana do lewej | 3 kolumny | 5 kolumn | wykryte |
| Odstęp kolumn | `--space-lg` | `--space-lg` | `--space-xl` | wykryte |
| Wewnętrzny odstęp | `--space-6xl` `--space-2xl` `--space-5xl` | `--space-5xl` `--space-3xl` | `--space-6xl` 0 `--space-5xl` | wykryte |
| Tytuł kolumny | `--type-title-footer` | to samo | to samo | wykryte |
| Linki | `--type-link-footer`, jeden pod drugim co `--space-list-footer` (także tytuł → pierwszy link) | to samo | to samo | wykryte |
| Kolor tekstu | `--color-text-on-brand` | to samo | to samo | wywnioskowane AA (źródło: tytuły `#d7ffb8`, linki `#a5ed6e`, 1.5–1.9:1) |

Falisty brzeg nad stopką w źródle to prawdopodobnie część ilustracji SVG, nie CSS (wywnioskowane, do weryfikacji). Nie odtwarzaj go bez ilustracji od zespołu.

---

## 10. Komunikat statusu

Komponent nie występuje na stronach publicznych źródła. Status: wywnioskowane, do weryfikacji.

```css
.notice {
  display: flex;
  gap: var(--space-xs);
  padding: var(--space-md);
  background: var(--color-status-info-surface);
  border: var(--border-width) solid var(--color-status-info-edge);
  border-bottom-width: var(--border-width-card-bottom);
  border-radius: var(--radius-lg);
  font: var(--type-body);
  color: var(--color-text-primary);
}
.notice__icon { flex: none; width: var(--size-icon); height: var(--size-icon); margin-top: 0.2em; color: var(--color-status-info-edge); }
.notice--success { background: var(--color-status-success-surface); border-color: var(--color-status-success-edge); }
.notice--warning { background: var(--color-status-warning-surface); border-color: var(--color-status-warning-edge); }
.notice--error   { background: var(--color-status-error-surface);   border-color: var(--color-status-error-edge); }
```

Ustaw kolor ikony zgodnie z wariantem. Komunikat zawsze ma tekst.

---

## 11. Komponenty złożone (wywnioskowane)

Tych elementów nie ma w źródle. Specyfikacja projektu ich wymaga, więc składamy je wyłącznie z istniejących wzorców. Status każdego: wywnioskowane, do weryfikacji wizualnej.

### 11.1 Panel (karta z treścią, np. podgląd planu)

Kontener jak karta wyboru, ale nieklikalny.

```css
.panel {
  width: 100%;
  max-width: var(--container-form);
  padding: var(--space-xl);
  background: var(--color-surface-page);
  border: var(--border-width) solid var(--color-border-default);
  border-bottom-width: var(--border-width-card-bottom);
  border-radius: var(--radius-lg);
}
.panel__row + .panel__row { margin-top: var(--space-xl); padding-top: var(--space-xl); border-top: var(--border-width) solid var(--color-border-default); }
.panel__label { font: var(--type-label-small); letter-spacing: var(--tracking-label); text-transform: uppercase; color: var(--color-text-primary); }
```

### 11.2 Zakładki

Zakładki składamy z przycisków `neutral`. Wybrana zakładka ma ten sam wygląd co wybrana karta.

- **Struktura:** wzorzec WAI-ARIA Tabs. `role="tablist"` z etykietą, zakładki `role="tab"` z `aria-selected` i `aria-controls`, panele `role="tabpanel"` z `aria-labelledby`.
- **Kolejność Tab:** w kolejności Tab jest tylko wybrana zakładka (`tabindex="0"`), pozostałe mają `tabindex="-1"`.
- **Klawiatura:** strzałki lewo i prawo, Home, End.

```css
.tabs { display: flex; gap: var(--space-xs); }
.tabs .tab { flex: 1; }                       /* klasy: btn btn--neutral btn--app tab */
.tab[aria-selected="true"]::before {
  border-color: var(--color-border-focus);
  background: var(--color-surface-info);
  box-shadow: 0 var(--edge-height-outline) 0 var(--color-border-focus);
}
.tab[aria-selected="true"]:active { transform: none; }
```

Wskaźnik wybranej zakładki jest kandydatem do efektu `move` z [gooey.md](gooey.md). Ruch jest do omówienia.

### 11.3 Etykieta (np. „Przykład”)

```css
.badge {
  display: inline-block;
  padding: 0 var(--space-xs);
  border-radius: var(--radius-md);
  background: var(--color-status-info-surface);
  font: var(--type-label-small);
  letter-spacing: var(--tracking-label);
  text-transform: uppercase;
  color: var(--color-text-primary);
}
```

### 11.4 Zaślepka ilustracji

Do czasu dostarczenia grafik:

```css
.media-placeholder {
  width: var(--size-media-feature);
  aspect-ratio: 1;
  background: var(--color-surface-subtle);
  border: var(--border-width) solid var(--color-border-default);
  border-radius: var(--radius-lg);
}
```

---

## 12. Wariant płynny (gooey)

Przyciski i grupy z efektem łączenia kształtów opisuje [gooey.md](gooey.md). Używaj go tylko w miejscach zatwierdzonych przez zespół.
