# Komponenty

Czytaj przed zbudowaniem kontrolki lub sekcji. Każdy element ma:

- anatomię;
- warianty;
- stany;
- recepturę CSS opartą na zmiennych z [tokeny.md §9](tokeny.md#9-blok-css-do-skopiowania). Receptury zakładają reset `box-sizing: border-box` z tego bloku.

Statusy objaśnia [README](README.md#statusy).

Zasady wspólne:

- **Płasko.** Każdy przycisk, karta, panel, zakładka i komunikat ma ramkę `--border-width` na całym obwodzie. Nie ma cieni ani grubszej dolnej krawędzi (uzgodnione 2026-11-21).
- **Stany zmieniają się natychmiast** (`--motion-state`, bez `transition`). Status: wykryte.
- **Fokus z klawiatury:** `outline: var(--focus-ring-width) solid var(--color-focus-ring); outline-offset: var(--focus-ring-offset);`. Na ciemnym pasie używaj `--color-focus-ring-on-inverse`. Status: szerokość i odsunięcie wykryte; kolor i widoczność wywnioskowane.
- **Komponent spoza tego pliku** składasz z tokenów i istniejących wzorców: ramka 2 px, `--radius-lg` dla kontenerów, natychmiastowe stany. W kodzie oznacz go `/* nowy komponent: do weryfikacji */`. Gotowe złożenia są w [§11](#11-komponenty-złożone-wywnioskowane).
- **Zachowanie (zakładki, modal, rozwijanie) może używać JS.** Receptury są w czystym CSS i HTML.

---

## 0. Typografia i ikony

### 0.1 Nagłówki i tekst

```css
.display-xl { margin: 0; font: var(--type-display-xl); letter-spacing: var(--tracking-display-xl); color: var(--color-text-display); }
.display-lg { margin: 0; font: var(--type-display-lg); color: var(--color-text-display); }
.title-hero { margin: 0; font: var(--type-title-hero); color: var(--color-text-strong); }
.text-body  { margin: 0; font: var(--type-body); color: var(--color-text-primary); max-width: var(--container-text); }
```

Status:

- rozmiary i kroje: wykryte;
- kolory: zespół (granat maskotki) i wykryte (szary akapitu);
- `max-width` akapitu: wykryte.

### 0.2 Ikony

| Cecha | Wartość | Status |
| --- | --- | --- |
| Styl | konturowe, obrys 2 px, zaokrąglone zakończenia | wykryte (tylko 4 ikony, do weryfikacji) |
| Siatka rysunku | 16 px (`viewBox="0 0 16 16"`) | wykryte (mała próbka) |
| Kolor | `currentColor` | wykryte |
| Rozmiar renderowany | `--size-icon` (1em) | wywnioskowane, do weryfikacji |
| Zestaw | nie wykryto biblioteki; wybór zestawu należy do zespołu | — |

Ikona obok tekstu ma `aria-hidden="true"`. Ikona bez tekstu (np. zamknięcie) ma `aria-label`. Status: wywnioskowane.

---

## 1. Przyciski

### 1.1 Anatomia

Płaski prostokąt z zaokrągleniem: wypełnienie i ramka 2 px na całym obwodzie. Przycisk główny ma budowę Zusika: miętowe wypełnienie w zielonej obwódce i granatową etykietę.

| Cecha | Wartość | Status |
| --- | --- | --- |
| Wysokość | `--size-control-height` (50px) | wykryte |
| Szerokość | `--size-cta-width` w hero i sekcjach; 100% kolumny w formularzu i modalu; dopasowana do treści w nagłówku | wykryte |
| Wewnętrzny odstęp w poziomie | `--space-md` | wykryte |
| Ramka | `--border-width` na całym obwodzie | uzgodnione |
| Etykieta | `--type-label-button`, wersaliki, `--tracking-label` | wykryte |
| Zaokrąglenie | `--radius-md` na stronach publicznych; `--radius-lg` (`.btn--app`) w modalach i po zalogowaniu | wykryte (użycie); wywnioskowane (zasada) |
| Odstęp między przyciskami w stosie | `--space-sm` | wykryte |
| Ikona przed etykietą | `--size-icon`, odstęp `--space-xs` | wywnioskowane, do weryfikacji |

### 1.2 Warianty

| Wariant | Wypełnienie | Ramka | Etykieta | Status |
| --- | --- | --- | --- | --- |
| `primary` | `--color-action-primary-fill` (mięta) | `--color-action-primary-border` (obwódka Zusika) | `--color-action-primary-text` (granat, 7.05:1) | zespół |
| `secondary` | `--color-action-secondary-fill` | `--color-action-secondary-border` | `--color-action-secondary-text` (granat ZUS) | zespół |
| `neutral` | jak `secondary` | jak `secondary` | `--color-action-neutral-text` | wykryte |

Usunięte warianty:

- **`info`:** na niebieskim ZUS żaden tekst nie spełnia AA.
- **`on-inverse`:** do zaprojektowania. Na ciemnym pasie użyj na razie `primary`: mięta na granacie ma 7.05:1.
- **Destrukcyjny:** nie wykryto. Dla akcji nieodwracalnej użyj `neutral` plus potwierdzenie i zapytaj zespół.

### 1.3 Stany

| Stan | `primary` | `secondary` / `neutral` | Status |
| --- | --- | --- | --- |
| hover | `filter: brightness(1.1)` | `filter: brightness(0.9)` | wykryte |
| active | `filter: brightness(0.9)` | tło `--color-surface-subtle` + `filter: brightness(0.9)` | wywnioskowane, do weryfikacji (źródło przesuwało przycisk, ale zrezygnowaliśmy z krawędzi) |
| focus-visible | pierścień fokusu | pierścień fokusu | wywnioskowane |
| disabled | wypełnienie i ramka `--color-surface-disabled`, etykieta `--color-text-disabled`, bez hover i active | to samo | wywnioskowane, do weryfikacji |
| loading | nie wykryto, zapytaj zespół | — | — |

### 1.4 Receptura CSS

```css
.btn {
  --btn-fill: var(--color-action-primary-fill);
  --btn-border: var(--color-action-primary-border);
  --btn-text: var(--color-action-primary-text);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  height: var(--size-control-height);
  padding: 0 var(--space-md);
  border: var(--border-width) solid var(--btn-border);
  border-radius: var(--radius-md);
  background: var(--btn-fill);
  color: var(--btn-text);
  font: var(--type-label-button);
  letter-spacing: var(--tracking-label);
  text-transform: uppercase;
  text-decoration: none;              /* gdy .btn jest linkiem <a> */
  cursor: pointer;
}
.btn:hover  { filter: brightness(1.1); }
.btn:active { filter: brightness(0.9); }
.btn:focus-visible { outline: var(--focus-ring-width) solid var(--color-focus-ring); outline-offset: var(--focus-ring-offset); }

/* obrysowane: secondary, neutral */
.btn--secondary, .btn--neutral {
  --btn-fill: var(--color-action-secondary-fill);
  --btn-border: var(--color-action-secondary-border);
}
.btn--secondary { --btn-text: var(--color-action-secondary-text); }
.btn--neutral   { --btn-text: var(--color-action-neutral-text); }
.btn--secondary:hover, .btn--neutral:hover { filter: brightness(0.9); }
.btn--secondary:active, .btn--neutral:active { --btn-fill: var(--color-surface-subtle); }

.btn--app   { border-radius: var(--radius-lg); }   /* modal, widoki po zalogowaniu */
.btn--cta   { width: var(--size-cta-width); max-width: 100%; }
.btn--block { width: 100%; }
.btn__icon  { width: var(--size-icon); height: var(--size-icon); flex: none; }

/* nieaktywny: wywnioskowane, do weryfikacji */
.btn:disabled, .btn[aria-disabled="true"] {
  --btn-fill: var(--color-surface-disabled);
  --btn-border: var(--color-surface-disabled);
  --btn-text: var(--color-text-disabled);
  cursor: not-allowed;
  filter: none;
}
```

---

## 2. Link w tekście

| Cecha | Wartość | Status |
| --- | --- | --- |
| Kolor | `--color-text-link` na każdym tle systemu (biały, `surface.info`, mięta) | zespół (granat ZUS) |
| Grubość | 700 | wykryte |
| Podkreślenie | brak | wykryte |
| Hover | nie wykryto zmiany | wykryte |

```css
.link { color: var(--color-text-link); font-weight: var(--font-weight-bold); text-decoration: none; }
.link:focus-visible { outline: var(--focus-ring-width) solid var(--color-focus-ring); outline-offset: var(--focus-ring-offset); }
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
| Ramka | `--border-width` `--color-border-default` na całym obwodzie | uzgodnione (bez grubszej dolnej ramki ze źródła) |
| Zaokrąglenie | `--radius-lg` | wykryte |
| Wewnętrzny odstęp | `--space-sm` `--space-sm` `--space-xl` | wykryte |
| Ikona lub ilustracja u góry | `--size-card-media-w` × `--size-card-media-h`, wyśrodkowana | wykryte |
| Ikona → tytuł | `--space-card-media-title` | wykryte |
| Tytuł | `--type-title-card`, `--color-text-strong`, wyśrodkowany | wykryte (typografia); zespół (kolor) |
| Tytuł → podpis | `--space-card-title-meta` | wykryte |
| Podpis | `--type-body-card`, `--color-text-primary` | wywnioskowane AA |

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
| wybrana / rozwinięta | ramka `--color-border-focus`, tło `--color-surface-info` | zespół (niebieski ZUS); wywnioskowane (wzorzec) |
| focus-visible | pierścień fokusu | wywnioskowane |
| disabled | nie wykryto, zapytaj zespół | — |

Semantyka zależy od tego, co robi karta. Wygląd stanu „wybrana” jest wspólny dla wszystkich trzech przypadków. Status: wywnioskowane.

- **Wybór jednej opcji:**
  - grupa `role="radiogroup"` z etykietą, karty `role="radio"` z `aria-checked`;
  - fokus wędruje strzałkami, a w kolejności Tab jest tylko wybrana karta (wzorzec WAI-ARIA Radio Group).
- **Karta rozwija treść:** `<button aria-expanded="true|false" aria-controls="…">`.
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
.choice-card__title { font: var(--type-title-card); color: var(--color-text-strong); }
.choice-card__meta  { margin-top: var(--space-card-title-meta); font: var(--type-body-card); }
```

`margin: auto 0 …` przy ikonie centruje treść karty w pionie. Status: wywnioskowane.

---

## 4. Pole formularza

### 4.1 Anatomia

Grupa pola składa się z etykiety, opakowania z inputem, tekstu pomocniczego i komunikatu błędu. Kolor i ramka są na **opakowaniu**, a `<input>` jest przezroczysty. Status: wykryte (opakowanie); grupa i etykieta: wywnioskowane.

| Cecha | Wartość | Status |
| --- | --- | --- |
| Etykieta nad polem | `--type-title-card`, `--color-text-strong`, odstęp do pola `--space-xs` | wywnioskowane (WCAG 3.3.2) |
| Tekst pomocniczy (np. przykład formatu) | pod etykietą, `--type-body`, `--color-text-primary` | wywnioskowane (zastępuje placeholder) |
| Opakowanie: tło | `--color-surface-subtle` | wykryte |
| Opakowanie: ramka | `--border-width` `--color-border-field` | wykryte (grubość); kolor: wywnioskowane AA, do weryfikacji |
| Opakowanie: zaokrąglenie | `--radius-md` | wykryte |
| Wysokość | `--size-field-height`; z akcją w środku `--size-field-height-with-action` | wykryte |
| Input: wewnętrzny odstęp | `--space-xs` `--space-field-x` | wykryte |
| Input: tekst | `--type-input`, `--color-text-primary` | wykryte |
| Placeholder | **nie używamy** ([tokeny §1.3](tokeny.md#13-tekst)) | wywnioskowane AA |
| Akcja w polu (np. link do odzyskania hasła) | po prawej, `--type-label-small`, wersaliki, `--color-text-link` | wykryte (położenie, typografia) |
| Komunikat błędu | pod polem, ikona `--color-status-error-edge` + tekst `--type-body` `--color-text-primary`, odstęp `--space-xs`, powiązany przez `aria-describedby` | wywnioskowane, do weryfikacji |

### 4.2 Stany

| Stan | Wygląd | Status |
| --- | --- | --- |
| focus | ramka opakowania `--color-border-focus`, także przy błędzie | wykryte (mechanizm); kolor: zespół |
| błąd (`aria-invalid="true"` na inpucie) | ramka `--color-border-error`, komunikat pod polem | wywnioskowane, do weryfikacji |
| disabled | nie wykryto, zapytaj zespół | — |

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
.field-label { font: var(--type-title-card); color: var(--color-text-strong); }
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

---

## 5. Separator „lub”

Dwie linie 2 px `--color-border-default`, między nimi etykieta `--type-label-small` w wersalikach, w kolorze `--color-text-primary`, z odstępem bocznym `--space-xs`. Nad i pod separatorem jest `--space-lg`. Status: wykryte (układ); kolor: wywnioskowane AA.

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
| Zamknięcie | ikona „X” w lewym górnym rogu, `aria-label="Zamknij"` | wykryte na zrzucie (położenie); rozmiar i odstęp: do weryfikacji |
| Akcja poboczna | `.btn--secondary.btn--app` w prawym górnym rogu | wykryte |
| Przyciski w środku | `.btn--block.btn--app` | wykryte |
| Odstęp między przyciskami alternatywnymi | `--space-stack-alt` | wykryte, do weryfikacji |
| Tekst prawny na dole | `--type-caption-legal`, wyśrodkowany, linki 700, `--color-text-primary` | wykryte; kolor: wywnioskowane AA |

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
| Układ | logo po lewej, wybór języka po prawej, margines `--space-gutter` | to samo | `--container-content`, logo po lewej, wybór języka po prawej | wykryte (desktop); telefon i tablet: uzgodnione 2026-11-21 (w źródle logo wyśrodkowane, bez wyboru języka) |
| Wybór języka | wersja krótka: sama nazwa języka | wersja krótka | wersja pełna: „Język strony: polski” | uzgodnione; zob. [§13](#13-wybór-języka) |

Zachowanie przy przewijaniu:

- **Dolna linia:** `--border-width`, na samej górze strony przezroczysta, po zjechaniu `--color-border-default`. Zmiana w `--motion-duration-base` z `--motion-easing-standard`. Status: wykryte.
- **Chowanie:** przy dalszym przewijaniu w dół pasek wyjeżdża do góry w `--motion-duration-slow` z `--motion-easing-out`. Status: wykryte; próg i powrót: do weryfikacji.

---

## 8. Pasek z karuzelą (opcjonalny)

Pas pełnej szerokości z poziomą listą pozycji i strzałkami po bokach. Status: wykryte.

- Wysokość `--size-strip-height`, linie u góry i u dołu `--border-width` `--color-border-default`, boczny wewnętrzny odstęp `--space-3xl`.
- Lista w `--container-wide`. Siatka: strzałka 14 px, lista, strzałka 14 px, odstęp 30 px (zmierzone; poza skalą, do weryfikacji).
- Przesunięcie listy: `transform` w `--motion-duration-slower` z `--motion-easing-in-out`.
- Pozycja: ikona i etykieta `--type-label-small` w wersalikach; kolor `--color-text-primary`.

---

## 9. Stopka

| Cecha | Telefon (< 768) | Tablet (768–1079) | Desktop (≥ 1080) | Status |
| --- | --- | --- | --- | --- |
| Tło | `--color-surface-brand` (mięta) | to samo | to samo | zespół |
| Kontener siatki | `--container-footer` (375 px), wyśrodkowany | `--container-footer` (768 px) | `--container-footer` (988 px) | wykryte |
| Siatka | 1 kolumna `--size-footer-column`, wyrównana do lewej | 3 kolumny | 5 kolumn | wykryte |
| Odstęp kolumn | `--space-lg` | `--space-lg` | `--space-xl` | wykryte |
| Wewnętrzny odstęp | `--space-6xl` `--space-2xl` `--space-5xl` | `--space-5xl` `--space-3xl` | `--space-6xl` 0 `--space-5xl` | wykryte |
| Tytuł kolumny | `--type-title-footer`, `--color-text-on-brand` | to samo | to samo | wykryte; kolor: zespół |
| Linki | `--type-link-footer`, `--color-text-link`, jeden pod drugim co `--space-list-footer` | to samo | to samo | wykryte; kolor: zespół |

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
  border-radius: var(--radius-lg);
  font: var(--type-body);
  color: var(--color-text-primary);
}
.notice__icon { flex: none; width: var(--size-icon); height: var(--size-icon); margin-top: 0.2em; color: var(--color-status-info-edge); }
.notice--success { background: var(--color-status-success-surface); border-color: var(--color-status-success-edge); }
.notice--success .notice__icon { color: var(--color-status-success-edge); }
.notice--warning { background: var(--color-status-warning-surface); border-color: var(--color-status-warning-edge); }
.notice--warning .notice__icon { color: var(--color-status-warning-edge); }
.notice--error   { background: var(--color-status-error-surface);   border-color: var(--color-status-error-edge); }
.notice--error .notice__icon { color: var(--color-status-error-edge); }
```

Komunikat zawsze ma tekst.

---

## 11. Komponenty złożone (wywnioskowane)

Tych elementów nie ma w źródle. Specyfikacja projektu ich wymaga, więc składamy je wyłącznie z istniejących wzorców. Status każdego: wywnioskowane, do weryfikacji wizualnej.

### 11.1 Panel (karta z treścią, np. podgląd planu)

```css
.panel {
  width: 100%;
  max-width: var(--container-form);
  padding: var(--space-xl);
  background: var(--color-surface-page);
  border: var(--border-width) solid var(--color-border-default);
  border-radius: var(--radius-lg);
}
.panel__row + .panel__row { margin-top: var(--space-xl); padding-top: var(--space-xl); border-top: var(--border-width) solid var(--color-border-default); }
.panel__label { font: var(--type-label-small); letter-spacing: var(--tracking-label); text-transform: uppercase; color: var(--color-text-primary); }
.panel__title { font: var(--type-title-card); color: var(--color-text-strong); }
```

### 11.2 Zakładki

Zakładki składamy z przycisków `neutral`. Wybrana zakładka wygląda jak wybrana karta.

- **Struktura:** wzorzec WAI-ARIA Tabs. `role="tablist"` z etykietą, zakładki `role="tab"` z `aria-selected` i `aria-controls`, panele `role="tabpanel"` z `aria-labelledby`.
- **Kolejność Tab:** w kolejności Tab jest tylko wybrana zakładka (`tabindex="0"`), pozostałe mają `tabindex="-1"`.
- **Klawiatura:** strzałki lewo i prawo, Home, End.

```css
.tabs { display: flex; gap: var(--space-xs); }
.tabs .tab { flex: 1 1 auto; }               /* klasy: btn btn--neutral btn--app tab; szerokość wg etykiety, żeby nie łamać jej bez potrzeby */
.tab[aria-selected="true"] {
  --btn-fill: var(--color-surface-info);
  --btn-border: var(--color-border-focus);
  --btn-text: var(--color-text-strong);
}
```

### 11.3 Etykieta (np. „Przykład”)

```css
.badge {
  display: inline-block;
  justify-self: start;               /* w rodzicu grid nie rozciąga się na całą szerokość */
  width: fit-content;
  padding: 0 var(--space-xs);
  border-radius: var(--radius-md);
  background: var(--color-accent-fill);
  font: var(--type-label-small);
  letter-spacing: var(--tracking-label);
  text-transform: uppercase;
  color: var(--color-text-on-accent);
}
```

### 11.4 Zaślepka ilustracji

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

---

## 13. Wybór języka

Przycisk tekstowy w prawym górnym rogu nagłówka, który rozwija listę języków. Wzór: selektor języka w nagłówku strony źródłowej (wykryte: `--type-label-small`, wersaliki, strzałka w dół). Lista, języki i zachowanie: uzgodnione 2026-11-21.

| Cecha | Wartość | Status |
| --- | --- | --- |
| Przycisk | bez ramki i tła; `--type-label-small`, wersaliki, `--tracking-label`, `--color-text-primary`; strzałka w dół (`--size-icon`) obraca się o 180° po otwarciu | wykryte (typografia); kolor: wywnioskowane AA (źródło `#afafaf`) |
| Etykieta | desktop: „Język strony: polski”, w wybranym języku (np. „Site language: English”); telefon i tablet: sama nazwa języka, pełna etykieta jako `aria-label` | uzgodnione |
| Języki | Polski (domyślnie), Українська, English: każdy w swoim języku i z atrybutem `lang` | uzgodnione |
| Lista | panel pod przyciskiem, wyrównany do prawej; tło `--color-surface-page`, ramka `--border-width` `--color-border-default`, `--radius-lg`, wewnętrzny odstęp `--space-xs` | wywnioskowane |
| Pozycja listy | `--type-body`, `--color-text-primary`, odstęp `--space-sm` `--space-md`, `--radius-md`; hover: tło `--color-surface-subtle` | wywnioskowane |
| Wybrana pozycja | tło `--color-surface-info`, `--color-text-strong`, grubość 700, znak ✓ po prawej | wywnioskowane |

Semantyka i klawiatura, wszystko wywnioskowane:

- przycisk ma `aria-haspopup="listbox"` i `aria-expanded`;
- lista ma `role="listbox"` z etykietą, pozycje `role="option"` z `aria-selected`;
- strzałka w dół otwiera listę i ustawia fokus na wybranej pozycji;
- strzałki góra/dół, Home i End przesuwają fokus;
- Enter lub spacja wybiera i zamyka;
- Esc zamyka i zwraca fokus na przycisk;
- klik poza listą ją zamyka.

Zmiana języka w prototypie zmienia tylko etykietę. Tłumaczenia treści są do zrobienia.

```css
.lang { position: relative; }
.lang__button {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) 0;
  border: 0;
  background: none;
  font: var(--type-label-small);
  letter-spacing: var(--tracking-label);
  text-transform: uppercase;
  color: var(--color-text-primary);
  cursor: pointer;
}
.lang__button:focus-visible { outline: var(--focus-ring-width) solid var(--color-focus-ring); outline-offset: var(--focus-ring-offset); }
.lang__chevron { width: var(--size-icon); height: var(--size-icon); }
.lang__button[aria-expanded="true"] .lang__chevron { transform: rotate(180deg); }
.lang__list {
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1;
  display: grid;
  gap: var(--space-xs);
  min-width: max-content;
  margin: var(--space-xs) 0 0;
  padding: var(--space-xs);
  list-style: none;
  background: var(--color-surface-page);
  border: var(--border-width) solid var(--color-border-default);
  border-radius: var(--radius-lg);
}
.lang__list[hidden] { display: none; }
.lang__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  font: var(--type-body);
  color: var(--color-text-primary);
  cursor: pointer;
}
.lang__option:hover { background: var(--color-surface-subtle); }
.lang__option:focus-visible { outline: var(--focus-ring-width) solid var(--color-focus-ring); outline-offset: calc(var(--focus-ring-width) * -1); }
.lang__option[aria-selected="true"] { background: var(--color-surface-info); color: var(--color-text-strong); font-weight: var(--font-weight-bold); }
.lang__check { visibility: hidden; width: var(--size-icon); height: var(--size-icon); }
.lang__option[aria-selected="true"] .lang__check { visibility: visible; }
```
