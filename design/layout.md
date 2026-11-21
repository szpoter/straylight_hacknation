# Layout i rytm

Czytaj przy układaniu strony lub sekcji. Wartości są w [tokeny.md](tokeny.md), a statusy objaśnia [README](README.md#statusy).

Progi: **telefon** < 768 px, **tablet** 768–1079 px, **desktop** ≥ 1080 px. Zmierzone co 1 px; status: wykryte.

---

## 1. Siatka i kontenery

Źródło nie ma 12-kolumnowej siatki. Układ budują **wyśrodkowane kontenery o stałej szerokości** i flexbox. Status: wykryte.

| Warstwa | Szerokość | Do czego | Status |
| --- | --- | --- | --- |
| Pełna szerokość | 100% | tła sekcji, pasy, stopka, nagłówek | wykryte |
| `--container-content` | 988px | treść sekcji na desktopie, nagłówek, stopka | wykryte |
| `--container-wide` | 1090px | pasek z karuzelą | wykryte |
| `--container-statement` | 583px | duże hasło (od tabletu) | wykryte |
| `--container-hero-title` | 480px | kolumna tytułu hero (od tabletu) | wykryte |
| `--container-heading` | 503px | nagłówek w wierszu z ilustracją (od tabletu) | wykryte |
| `--container-text` | 473px | akapit (około 50 znaków w linii) | wykryte |
| `--container-form` | 375px | formularz, modal, panel | wykryte |
| `--size-cta-width` | 330px | stos przycisków | wykryte |

Boczny margines treści:

- telefon: `--space-gutter-phone` (15 px);
- tablet: 40 px (`--space-gutter` zmienia się sam od 768);
- desktop: kontener 988 px wyśrodkowany.

Układ desktopowy włącza się dopiero od 1080 px, czyli przy co najmniej 46 px marginesu z każdej strony kontenera. Status: wykryte.

**Ekran telefonu:** węższe kolumny przyjmują `min(<kontener>, 100% − 2 × margines)`. Zmierzone: ilustracja ma `min(345px, 100vw − 30px)`, a akapit 330 px przy 375 px szerokości. Status: wykryte.

---

## 2. Rytm pionowy

| Element rytmu | Wartość | Status |
| --- | --- | --- |
| Pionowy odstęp bloku sekcji (góra i dół) | `--space-6xl` | wykryte |
| Wiersze z ilustracją jeden pod drugim | bez odstępu; oddech daje kwadratowa ilustracja wyśrodkowana pionowo z tekstem | wykryte |
| Nagłówek → akapit | `--space-xl` | wykryte |
| Tytuł hero → przyciski | `--space-lg` na telefonie, `--space-3xl` od tabletu | wykryte |
| Przycisk → przycisk w stosie | `--space-sm` | wykryte |
| Nagłówek strony → siatka kart | `--space-heading-grid` | wykryte |
| Separacja sekcji | przestrzeń albo zmiana tła na pełną szerokość; nigdy linia | wykryte |

---

## 3. Wzorce sekcji

### 3.1 Hero

**Wybrany wariant (uzgodnione 2026-11-21): jak w źródle, bez paska z karuzelą pod spodem.** Animacja Zusika jest po lewej, tekst i przyciski po prawej. Zmierzone na 375, 768, 1080 i 1280 px. Status: wykryte, chyba że opisano inaczej.

| Szerokość | Układ |
| --- | --- |
| telefon | Kolumna, wszystko wyśrodkowane: animacja `--size-media-hero` (273 px), tytuł, opis, stos przycisków `--size-cta-width`, dopisek. Tytuł → przyciski `--space-lg`. |
| tablet | Kolumna jak na telefonie; animacja 424 px; tytuł w `--container-hero-title`; tytuł → przyciski `--space-3xl`. |
| desktop | Rząd w `--container-content`, `justify-content: flex-end`, `align-items: center`, odstęp `--space-hero-gap` (15 px między kwadratem animacji a kolumną tekstu), pionowy wewnętrzny odstęp `--space-4xl`. Po lewej animacja 424 × 424 px, po prawej kolumna tekstu `--container-hero-title` przy prawej krawędzi kontenera. Tytuł i stos przycisków wyśrodkowane w tej kolumnie. Grafika animacji powinna mieć wolne miejsce wewnątrz kwadratu, bo odstęp do tekstu jest mały. |

Odstępy i treść:

- **Tytuł → opis:** `--space-xl`. Wywnioskowane: tak samo jak nagłówek → akapit; źródło nie ma opisu w hero.
- **Opis → przyciski:** `--space-3xl` od tabletu, `--space-lg` na telefonie, tak samo jak tytuł → przyciski.
- **Przyciski:** `primary` „Zaloguj się”, pod nim `secondary` „Zarejestruj się”, odstęp `--space-sm`. Pod przyciskami dopisek o wersji demonstracyjnej (`--type-caption-legal`).
- **Wysokość:** hero wypełnia pierwszy ekran pod nagłówkiem: `min-height: calc(100svh - var(--size-header-height))`, treść wyśrodkowana w pionie. Status: wywnioskowane; w źródle hero razem z paskiem karuzeli wypełniało ekran.
- **Karta przykładu „Moja sytuacja / Mój plan”** ze `SPEC.md` nie jest częścią tego wariantu hero. Gdzie trafi, jest do ustalenia (do omówienia).

```css
.hero { display: flex; align-items: center; min-height: calc(100svh - var(--size-header-height)); padding-block: var(--space-4xl); }
.hero__row { display: flex; flex-direction: column; align-items: center; gap: var(--space-xl); width: 100%; max-width: var(--container-content); margin: 0 auto; padding: 0 var(--space-gutter); }
.hero__media { flex: none; width: var(--size-media-hero); aspect-ratio: 1; }
.hero__text { display: flex; flex-direction: column; align-items: center; width: 100%; max-width: var(--container-hero-title); text-align: center; }
.hero__text .text-body { margin-top: var(--space-xl); }
.hero__actions { display: grid; gap: var(--space-sm); width: var(--size-cta-width); max-width: 100%; margin-top: var(--space-lg); }
.hero__note { margin: var(--space-xl) 0 0; max-width: var(--size-cta-width); font: var(--type-caption-legal); color: var(--color-text-primary); }
@media (min-width: 768px) { .hero__actions { margin-top: var(--space-3xl); } }
@media (min-width: 1080px) {
  .hero__row { flex-direction: row; justify-content: flex-end; gap: var(--space-hero-gap); padding: 0; }
}
```

Wartości wywnioskowane w tej recepturze:

- `gap: var(--space-xl)` w kolumnie na telefonie i tablecie (w źródle tytuł ma dodatkowe puste miejsce);
- odstęp dopisku `--space-xl`.

### 3.2 Wiersz z ilustracją

| Szerokość | Układ | Status |
| --- | --- | --- |
| telefon | kolumna, odstęp `--space-2xl`, boczny margines `--space-gutter-phone`; ilustracja `--size-media-feature`; nagłówek `.display-lg` wyśrodkowany; akapit wyśrodkowany pod nim | wykryte |
| tablet | kolumna, odstęp `--space-2xl`; ilustracja 452 px; nagłówek w `--container-heading`, akapit w `--container-text`, wyśrodkowane | wykryte |
| desktop | rząd w `--container-content`, `align-items: center`, odstęp `--space-row-gap`; kolumna tekstu (`--container-heading`, nagłówek wyrównany do lewej) przy krawędzi kontenera; ilustracja 530 px **wystaje 146 px poza kontener** w stronę krawędzi ekranu; nadmiar jest przycięty, bez przewijania w poziomie. Kolejne wiersze naprzemiennie: tekst po lewej / tekst po prawej (`row-reverse`). | wykryte |

```css
.feature-section { overflow-x: clip; }                 /* przycina wystającą ilustrację */
.feature-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2xl);
  padding: 0 var(--space-gutter-phone);
  text-align: center;
}
.feature-row__text { width: 100%; max-width: var(--container-heading); }
.feature-row__text p { max-width: var(--container-text); margin: var(--space-xl) auto 0; }
.feature-row__media { flex: none; width: var(--size-media-feature); aspect-ratio: 1; }
@media (min-width: 768px) { .feature-row { padding: 0; } }
@media (min-width: 1080px) {
  .feature-row { flex-direction: row; gap: var(--space-row-gap); width: var(--container-content); margin: 0 auto; text-align: start; }
  .feature-row--reverse { flex-direction: row-reverse; }
  .feature-row__text { flex: none; width: var(--container-heading); }
  .feature-row__text p { margin-left: 0; }
}
```

Na desktopie suma szerokości (503 + 101 + 530 = 1134 px) celowo przekracza kontener 988 px. Wartości są wykryte; zachowanie przycięcia potwierdza `scrollWidth` równy szerokości okna.

#### Wariant z wędrującym Zusikiem (uzgodnione 2026-11-21)

Sekcja korzyści pod hero składa się z 4 wierszy w układzie z tabeli wyżej. W miejscach ilustracji jest **jeden Zusik**, który wędruje między wierszami:

1. W pierwszym wierszu wpływa z prawej strony ekranu (tekst po lewej).
2. Przy przewijaniu przechodzi na drugą stronę, a po przeciwnej stronie pojawia się tekst następnego wiersza.
3. W każdym wierszu Zusik zmienia się w inny kształt.

Strony zmieniają się naprzemiennie do końca sekcji. Na telefonie wiersze stoją jeden pod drugim, a Zusik zmienia się w miejscu, bez przechodzenia między stronami (wywnioskowane).

Ruch opisuje [motion.md §5.2](motion.md#52-sloty-znane-ze-specyfikacji-projektu). Do czasu dostarczenia animacji miejsca Zusika i przejść oznaczamy szarymi blokami.

### 3.3 Duże hasło wyśrodkowane

`.display-xl` w `--container-statement` (od tabletu; na telefonie szerokość akapitu), wyśrodkowane. Pod nim akcje albo rząd odnośników. W jednym z dwóch wystąpień w źródle hasło stoi na tle `--color-surface-info`, w drugim na białym. Status: wykryte.

### 3.4 Sekcja na tle pełnej szerokości

| Tło | Użycie w źródle | Tekst | Status |
| --- | --- | --- | --- |
| `--color-surface-info` (klasa `.surface-info`) | sekcja z dużym hasłem; tło pojawia się płynnie przy przewijaniu ([motion.md](motion.md)) | nagłówek `--color-text-display`, tekst `--color-text-primary`, linki `--color-text-link` | wykryte (tło); kolory tekstu: zespół |
| `--color-surface-inverse` | jeden pas promocyjny, wysokość około 900 px | `--color-text-on-inverse` | wykryte |
| `--color-surface-brand` | stopka | `--color-text-on-brand` | wykryte (tło); tekst: wywnioskowane AA |

### 3.5 Formularz lub modal

Jedna kolumna `--container-form`. Kolejność:

1. tytuł,
2. pola,
3. przycisk główny,
4. separator „lub”,
5. akcje alternatywne,
6. tekst prawny.

Status: wykryte. Szczegóły w [komponenty.md §4–6](komponenty.md#4-pole-formularza).

Tytuł formularza:

- w modalu: `--type-title-modal`;
- na stronie: `--type-title-hero`, wyśrodkowany, jak nagłówek nad siatką kart w źródle (wykryte).

### 3.6 Siatka kart wyboru

Tytuł strony `--type-title-hero` wyśrodkowany, pod nim siatka z [komponenty.md §3.2](komponenty.md#32-siatka-kart-wykryte). Status: wykryte.

---

## 4. Gęstość treści i jedna akcja główna

Wszystko w tej sekcji jest wywnioskowane z pomiarów.

- **Jedna akcja główna na sekcję.** W oknie przeglądarki widać naraz najwyżej jeden przycisk `primary`. Ta sama akcja może się powtórzyć w ostatniej sekcji strony: w źródle hero i sekcja końcowa mają ten sam przycisk (wykryte). Akcje drugorzędne są obrysowane albo są linkami.
- **Mało elementów na ekran.** Na jeden ekran desktopu przypada jeden wiersz: ilustracja, nagłówek, akapit.
- **Krótkie akapity:** 150–280 znaków (wykryte), około 50 znaków w linii.
- **Ilustracja jest równorzędna z tekstem.** Zajmuje około połowy wiersza, nie robi za ozdobnik w rogu.
- **Ekrany z dużą ilością danych** (np. kalkulator czy listy po zalogowaniu) mają w źródle odpowiednik tylko w skali typografii aplikacji. Zachowaj kontenery i odstępy z tego pliku. Dane grupuj w panelach ([komponenty.md §11.1](komponenty.md#111-panel-karta-z-treścią-np-podgląd-planu)). Zamiast mieścić wszystko na jednym ekranie, podziel treść na kroki.

---

## 5. Zachowanie responsywne (podsumowanie)

Wszystko w tej tabeli jest wykryte, zmierzone co 1 px.

| Element | Telefon (< 768) | Tablet (768–1079) | Desktop (≥ 1080) |
| --- | --- | --- | --- |
| Margines boczny | 15 px | 40 px | kontener 988 px wyśrodkowany |
| Nagłówek strony | logo wyśrodkowane | logo wyśrodkowane | logo po lewej, akcja po prawej |
| Hero | kolumna | kolumna | dwie kolumny |
| Wiersz z ilustracją | kolumna, ilustracja `min(345px, 100vw − 30px)` | kolumna, ilustracja 452 | rząd, ilustracja 530, odstęp 101 |
| `type.display.lg` / `type.display.xl` | 36 / 36 | 48 / 48 | 48 / 64 |
| Tytuł hero → przyciski | 20 | 40 | 40 |
| Stopka | 1 kolumna | 3 kolumny | 5 kolumn |
| Siatka kart | kolumny według szerokości (min. 150 px); odstęp 12, a od 700 px 24 | kolumny według szerokości | 4 × 200 px |
| Przyciski CTA | 330 px | 330 px | 330 px |
