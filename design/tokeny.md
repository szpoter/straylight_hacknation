# Tokeny

Czytaj przy każdej pracy nad stylami. W komponentach używaj wyłącznie zmiennych CSS z [bloku na końcu pliku](#9-blok-css-do-skopiowania).

**Brak potrzebnej wartości:** zapytaj zespół. Jeśli nie możesz czekać, użyj najbliższego istniejącego tokenu i oznacz miejsce w kodzie komentarzem `do weryfikacji: brak tokenu dla …`. Ta sama procedura obowiązuje w [zasady-agenta.md](zasady-agenta.md) i `CLAUDE.md`.

**Nazwa tokenu a zmienna CSS:**

- Kropki zamieniasz na myślniki, a camelCase na kebab-case. Przykład: `color.text.onBrand` → `--color-text-on-brand`.
- Wyjątki:
  - `font.family.display` → `--font-display`;
  - `font.family.ui` → `--font-ui`;
  - `border.width.default` → `--border-width`.

Statusy objaśnia [README](README.md#statusy). Dowody do wartości są w [zrodla.md](zrodla.md).

**Decyzja projektu: WCAG 2.1 AA.** Paleta źródła zostaje dla wypełnień, krawędzi i dużych powierzchni. Tekst i wskaźniki stanu dostają tylko kolory wykryte w źródle, które spełniają AA. Kolumna „Źródło” pokazuje oryginalną wartość, której nie używamy.

---

## 1. Kolory

### 1.1 Powierzchnie

| Token | Wartość | Rola | Status |
| --- | --- | --- | --- |
| `color.surface.page` | `#ffffff` | Tło strony, kart, paneli, modala, przycisków obrysowanych. Zajmuje 67% powierzchni strony źródłowej. | wykryte |
| `color.surface.subtle` | `#f7f7f7` | Tło pola formularza; zaślepka ilustracji. | wykryte (pole); zaślepka: wywnioskowane |
| `color.surface.info` | `#ddf4ff` | Tło wyróżnionej sekcji pełnej szerokości, tło zaznaczonej karty lub zakładki. | wykryte (sekcja); zaznaczenie: wywnioskowane |
| `color.surface.brand` | `#58cc02` | Stopka. Ta sama barwa co wypełnienie przycisku głównego. | wykryte |
| `color.surface.inverse` | `#100f3e` | Ciemny pas pełnej szerokości. | wykryte |
| `color.surface.overlay` | `rgba(0, 0, 0, 0.3)` | Nakładka pod modalem. | wykryte |
| `color.surface.overlayStrong` | `rgba(0, 0, 0, 0.4)` | Nakładka pod szufladą. | wykryte |
| `color.surface.disabled` | `#e5e5e5` | Wypełnienie przycisku nieaktywnego. Stanu nie zaobserwowano. | wywnioskowane, do weryfikacji |

### 1.2 Ramki

| Token | Wartość | Rola | Status | Źródło |
| --- | --- | --- | --- | --- |
| `color.border.default` | `#e5e5e5` | Ramki kart, paneli, przycisków obrysowanych i ich dolna krawędź, linia pod nagłówkiem, separatory, ramki pasków. Jedyny kolor obramowań w źródle. | wykryte | — |
| `color.border.field` | `#777777` | Ramka pola formularza (4.48:1 na białym, wymóg WCAG 1.4.11 to 3:1). | wywnioskowane, do weryfikacji | `#e5e5e5` (1.26:1) |
| `color.border.focus` | `#2b70c9` | Ramka pola w focus, ramka zaznaczonej karty lub zakładki (4.93:1). | wywnioskowane | `#1cb0f6` (2.44:1) |
| `color.border.error` | `#ea2b2b` | Ramka pola z błędem (4.30:1). Stanu nie zaobserwowano. | wywnioskowane, do weryfikacji | — |

### 1.3 Tekst

Kontrast liczony na `color.surface.page`, chyba że zaznaczono inaczej.

| Token | Wartość | Kontrast | Rola | Status | Źródło |
| --- | --- | --- | --- | --- | --- |
| `color.text.strong` | `#3c3c3c` | 11.03 | Domyślny kolor dokumentu, tytuł modala. | wykryte | — |
| `color.text.primary` | `#4b4b4b` | 8.72 | Tytuły (hero, karty), tekst w polu, **akapity**, drobne etykiety, tekst prawny, komunikaty. | wykryte; użycie dla akapitów i drobnych etykiet: wywnioskowane | akapity `#777777` (4.48), drobne etykiety `#afafaf` (2.19) |
| `color.text.muted` | `#777777` | 4.48 | **Tylko tekst duży:** od 19 px przy grubości 700 albo od 24 px. | wykryte (podtytuł 19 px / 700) | — |
| `color.text.disabled` | `#afafaf` | 2.19 | Tylko stan nieaktywny i elementy dekoracyjne. | wykryte | — |
| `color.text.display` | `#042c60` | 13.69 | Nagłówki krojem display. | wykryte (CSS var; użyty dla dużego nagłówka na `surface.info`); rola dla wszystkich nagłówków: wywnioskowane | nagłówki sekcji `#58cc02` (2.09) |
| `color.text.link` | `#2b70c9` | 4.93 (4.60 na `#f7f7f7`) | Linki w tekście, etykieta przycisku `secondary`, akcja w polu. | wykryte (CSS var); rola: wywnioskowane | `#1cb0f6` (2.44) |
| `color.text.linkOnInfo` | `#042c60` | 12.03 na `#ddf4ff` | Linki na `color.surface.info`. Zwykły link ma tam 4.33:1. | wywnioskowane | — |
| `color.text.onBrand` | `#3c3c3c` | 5.28 na `#58cc02` | Tekst i ikony na zielonym: przycisk główny, stopka. | wywnioskowane | biały (2.09), w stopce `#a5ed6e` i `#d7ffb8` |
| `color.text.onInfoFill` | `#042c60` | 5.60 na `#1cb0f6` | Tekst na niebieskim wypełnieniu. | wywnioskowane, do weryfikacji | biały (2.44) |
| `color.text.onInverse` | `#ffffff` | 18.10 na `#100f3e` | Tekst na ciemnym pasie. | wykryte | — |

**Placeholderów nie używamy.** Na tle pola `#777777` ma tylko 4.18:1, a 20 px przy grubości 400 nie jest tekstem dużym. Przykład formatu podaj jako tekst pomocniczy pod etykietą ([komponenty.md §4](komponenty.md#4-pole-formularza)). Status: wywnioskowane AA; źródło używa placeholdera zamiast etykiety.

### 1.4 Akcje (przyciski)

| Token | Wartość | Status | Uwagi |
| --- | --- | --- | --- |
| `color.action.primary.fill` | `#58cc02` | wykryte | — |
| `color.action.primary.edge` | `#58a700` | wykryte | — |
| `color.action.primary.text` | = `color.text.onBrand` | wywnioskowane AA | Źródło: biały. |
| `color.action.secondary.fill` | `#ffffff` | wykryte | — |
| `color.action.secondary.border` | `#e5e5e5` | wykryte | — |
| `color.action.secondary.edge` | `#e5e5e5` | wykryte | — |
| `color.action.secondary.text` | = `color.text.link` | wywnioskowane AA | Źródło: `#1cb0f6`. |
| `color.action.neutral.text` | `#4b4b4b` | wykryte | Przycisk obrysowany z ciemnym tekstem. |
| `color.action.info.fill` | `#1cb0f6` | wykryte | Przycisk główny w modalu źródła. |
| `color.action.info.edge` | `#1899d6` | wykryte | — |
| `color.action.info.text` | = `color.text.onInfoFill` | wywnioskowane AA, do weryfikacji | Źródło: biały. |

### 1.5 Statusy

Kolory pochodzą ze zmiennych CSS źródła (`wykryte (CSS var)`). Na stronach publicznych ich nie zaobserwowano, więc przypisanie ról jest `wywnioskowane`.

| Status | `fill` | `edge` (ramka, krawędź, ikona) | `surface` (jasne tło komunikatu) |
| --- | --- | --- | --- |
| `success` | `#58cc02` | `#58a700` (3.02 na białym) | `#d7ffb8` |
| `info` | `#1cb0f6` | `#1899d6` (3.20) | `#ddf4ff` |
| `warning` | `#ff9600` | `#cd7900` (3.32) | `#fff5d3` |
| `error` | `#ff4b4b` | `#ea2b2b` (4.30) | `#ffdfe0` |

Tokeny mają postać `color.status.<status>.<fill|edge|surface>`.

Zasady:

- Tekst komunikatu zawsze w `color.text.primary`. Na tłach statusów daje 7.0–8.0:1.
- Kolor statusu tylko dla ramki, krawędzi i ikony. Na białym spełnia próg 3:1.
- Ikona zawsze stoi obok tekstu. Na jasnym tle statusu ma tylko 2.7–3.5:1.
- Wypełnień `fill` nie używaj jako tła tekstu.

### 1.6 Fokus

| Token | Wartość | Status | Uwagi |
| --- | --- | --- | --- |
| `color.focus.ring` | `#042c60` | wywnioskowane | Źródło nie pokazuje fokusu. Kontrast: 13.69 na białym, 6.55 na zielonym, 12.03 na `surface.info`. |
| `color.focus.ringOnInverse` | `#ffffff` | wywnioskowane | Na `color.surface.inverse`. |
| `focus.ring.width` | 3px | wykryte (`outline-width`) | — |
| `focus.ring.offset` | 1px | wykryte (`outline-offset`) | — |

### 1.7 Barwy dekoracyjne

Tylko do ilustracji i elementów bez tekstu. Nie twórz z nich nowych ról.

| Token | Wartość | Status |
| --- | --- | --- |
| `color.decorative.violet` | `#ce82ff` | wykryte (CSS var) |
| `color.decorative.yellow` | `#ffc800` | wykryte (CSS var) |
| `color.decorative.teal` | `#00cd9c` | wykryte (tło na podstronie z szachami) |

---

## 2. Typografia

### 2.1 Kroje

| Token | Wartość | Status | Uwagi |
| --- | --- | --- | --- |
| `font.family.display` | `"Nunito", sans-serif` | do weryfikacji | Zamiennik. Źródło używa własnościowego, zaokrąglonego kroju display w grubości 700, tylko do nagłówków sekcji. |
| `font.family.ui` | `"Nunito", sans-serif` | do weryfikacji | Zamiennik. Źródło używa własnościowego kroju zmiennego 100–900 do całej reszty. |
| `font.weight.regular` | `400` | wykryte | — |
| `font.weight.bold` | `700` | wykryte | — |
| `font.weight.display` | `800` | do weryfikacji | Źródło ma 700 w grubym kroju. Nunito 700 jest cieńszy, więc 800 to propozycja. |

Ładowanie: Google Fonts, `family=Nunito:wght@400;700;800`, `display=swap`. Nunito ma polskie znaki. Status: wywnioskowane.

### 2.2 Skala stron publicznych (zmierzona)

Progi telefon / tablet / desktop: poniżej 768 px, 768–1079 px, od 1080 px. Szczegóły w [§6](#6-breakpointy).

`normal` oznacza, że źródło nie ustawia interlinii. Po zmianie kroju na Nunito wysokość linii może się zmienić (do weryfikacji).

| Token | Krój | Rozmiar telefon / tablet / desktop | Grubość | Interlinia | Odstęp liter | Wielkość liter | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `type.display.xl` | display | 36 / 48 / 64 px | display | normal | `-0.02em` (zmierzone −0.72 / −0.96 / −1.28 px) | zob. reguła niżej | wykryte |
| `type.display.lg` | display | 36 / 48 / 48 px | display | normal | normal | zob. reguła niżej | wykryte |
| `type.title.hero` | ui | 32 px na wszystkich szerokościach | 700 | 40 px | normal | zdanie | wykryte |
| `type.title.modal` | ui | 26 px | 700 | 40 px | normal | zdanie | wykryte |
| `type.title.section` | ui | 19 px | 700 | 24 px | normal | zdanie | wykryte |
| `type.title.footer` | ui | 19 px | 700 | 26.6 px | normal | zdanie | wykryte |
| `type.title.card` | ui | 17 px | 700 | 20.4 px | normal | zdanie | wykryte |
| `type.body` | ui | 17 px | 400 | 24 px | normal | zdanie | wykryte |
| `type.body.card` | ui | 17 px | 400 | 19.55 px | normal | zdanie | wykryte |
| `type.input` | ui | 20 px | 400 | 28 px | normal | zdanie | wykryte |
| `type.label.button` | ui | 15 px | 700 | 18 px | `0.8px` | WERSALIKI | wykryte |
| `type.label.small` | ui | 15 px | 700 | 20 px | `0.8px` | WERSALIKI | wykryte (separator, selektor języka) |
| `type.link.footer` | ui | 15 px | 700 | 22 px | normal | zdanie | wykryte |
| `type.caption.legal` | ui | 14 px | 400 (linki 700) | 20 px | normal | zdanie | wykryte; grubość zwykłego tekstu do weryfikacji |

**Wielkość liter w nagłówkach display.** Źródło pisze je małymi literami już w treści (`text-transform: none`). Status: wykryte.

- Tekstów ze specyfikacji projektu **nie zmieniasz**. Jeśli specyfikacja pisze nagłówek wielką literą albo formą grzecznościową („Ci”, „Cię”, „Twój”), tak zostaje.
- Małe litery stosuj tylko w nagłówku pisanym od zera, w którym nie ma nazw własnych, skrótów ani form grzecznościowych.

Status reguły: wywnioskowane.

Uwagi do pozostałych wierszy:

- **`type.title.section`:** w źródle kolor `#777777`. To tekst duży, więc dopuszczalny jest `color.text.muted`.
- **Linki w tekście:** kolor `color.text.link`, grubość 700, bez podkreślenia. Status: wykryte. Grubość odróżnia link od tekstu bez polegania na samym kolorze (WCAG 1.4.1).

### 2.3 Skala ekranów aplikacji (ze zmiennych CSS źródła)

Źródło definiuje zmienne `--text-*`, ale na stronach publicznych ich nie zaobserwowano. Status: wykryte (CSS var). Ta skala obowiązuje w widokach po zalogowaniu, skala z 2.2 na stronach publicznych. Status podziału: wywnioskowane.

| Token | Rozmiar / interlinia | Grubość | Wielkość liter i odstęp |
| --- | --- | --- | --- |
| `type.app.pageTitle.lg` | 40 / 44 px | 700 | — |
| `type.app.pageTitle.sm` | 32 / 36 px | 700 | — |
| `type.app.heading.lg` | 28 / 32 px | 700 | — |
| `type.app.heading.md` | 24 / 32 px | 700 | — |
| `type.app.heading.sm` | 20 / 24 px | 700 | — |
| `type.app.heading.xs` | 16 / 20 px | 700 | — |
| `type.app.body` | 20 / 28 px | 400 (pogrubienie 700) | — |
| `type.app.body.spacious` | 20 / 32 px | 400 (pogrubienie 700) | — |
| `type.app.caption` | 16 / 24 px | 400 (pogrubienie 700) | — |
| `type.app.label.lg` | 24 / 24 px | 700 | WERSALIKI, `0.04em` |
| `type.app.label.md` | 16 / 16 px | 700 | WERSALIKI, `0.04em` |

---

## 3. Odstępy

Wartości zmierzone w źródle są wielokrotnościami 4 px. Status skali: wywnioskowane.

| Token | Wartość | Gdzie zmierzono | Status |
| --- | --- | --- | --- |
| `space.xs` | 8px | wewnętrzny odstęp etykiety separatora, pionowy odstęp wewnątrz pola | wykryte |
| `space.sm` | 12px | odstęp między przyciskami w stosie i między polami, wewnętrzny odstęp karty | wykryte |
| `space.md` | 16px | wewnętrzny odstęp przycisku w poziomie | wykryte |
| `space.lg` | 20px | odstęp nad i pod separatorem „lub”, odstęp siatki stopki (telefon, tablet), od tytułu hero do przycisków (telefon) | wykryte |
| `space.xl` | 24px | od nagłówka do akapitu, od pola do przycisku, odstęp siatki stopki (desktop), dolny wewnętrzny odstęp karty | wykryte |
| `space.2xl` | 32px | odstęp ilustracja–tekst w układzie kolumnowym, boczny wewnętrzny odstęp stopki (telefon) | wykryte |
| `space.3xl` | 40px | od tytułu hero do przycisków (tablet, desktop), boczny margines nagłówka i stopki (tablet) | wykryte |
| `space.4xl` | 48px | w skali designlang, użycia nie zlokalizowano | do weryfikacji |
| `space.5xl` | 64px | dolny wewnętrzny odstęp stopki, górny i dolny na tablecie | wykryte |
| `space.6xl` | 96px | pionowy odstęp bloku sekcji, górny wewnętrzny odstęp stopki | wykryte |

Wartości lokalne poza skalą. Wszystkie wykryte; używaj ich tylko w podanym miejscu.

| Token | Wartość | Miejsce |
| --- | --- | --- |
| `space.gutter.phone` | 15px | boczny margines treści na telefonie |
| `space.row.gap` | 101px | odstęp tekst–ilustracja w wierszu na desktopie |
| `space.field.x` | 14px | wewnętrzny odstęp pola w poziomie |
| `space.list.footer` | 14px | odstęp tytuł–link i link–link w kolumnie stopki |
| `space.card.mediaTitle` | 22px | od ikony do tytułu w karcie wyboru |
| `space.card.titleMeta` | 6px | od tytułu do podpisu w karcie wyboru |
| `space.heading.grid` | 80px | od nagłówka strony do pierwszego rzędu kart (telefon; desktop 86) |
| `space.stack.alt` | 15px | między przyciskami alternatywnymi w modalu (np. logowanie zewnętrzne); do weryfikacji, czy to nie 16 |

---

## 4. Rozmiary, kontenery, zaokrąglenia

### 4.1 Rozmiary elementów

| Token | Wartość | Status |
| --- | --- | --- |
| `size.control.height` | 50px (przycisk) | wykryte |
| `size.field.height` | 48px (pole jednowierszowe z ramką) | wykryte |
| `size.field.heightWithAction` | 60px (pole z akcją wewnątrz, np. linkiem do odzyskania hasła) | wykryte |
| `size.cta.width` | 330px | wykryte |
| `size.header.height` | 72px (70 px treści + 2 px ramki) | wykryte |
| `size.strip.height` | 80px | wykryte |
| `size.media.feature` | `min(345px, 100vw - 30px)` na telefonie, 452px na tablecie, 530px na desktopie (kwadrat) | wykryte |
| `size.card.choiceMin` | 150px (najwęższa karta, liczba kolumn dopasowuje się do szerokości) | wykryte |
| `size.card.choice` | 200px szerokości na desktopie | wykryte |
| `size.card.choiceMax` | 240px (`max-width`) | wykryte |
| `size.card.choiceHeight` | 217px (`min-height`; przy zawiniętym tekście karta rośnie) | wykryte |
| `size.card.media` | 88 × 68 px (ikona lub flaga w karcie wyboru) | wykryte |
| `size.footer.column` | 216px na telefonie i tablecie, 178px na desktopie | wykryte |
| `size.icon` | `1em` | wywnioskowane, do weryfikacji |

### 4.2 Kontenery

| Token | Wartość | Gdzie | Status |
| --- | --- | --- | --- |
| `container.content` | 988px | nagłówek, wiersze, stopka (desktop) | wykryte |
| `container.wide` | 1090px | pasek z karuzelą | wykryte |
| `container.max` | 1440px | najszerszy kontener | wykryte |
| `container.statement` | 583px | duże hasło (od tabletu) | wykryte |
| `container.heading` | 503px | nagłówek w wierszu z ilustracją | wykryte |
| `container.text` | 473px | akapit (około 50 znaków w linii) | wykryte |
| `container.heroTitle` | 480px | kolumna tytułu hero (od tabletu) | wykryte |
| `container.form` | 375px | kolumna formularza i modala, panel podglądu | wykryte (formularz); panel: wywnioskowane |
| `container.footer` | 375px na telefonie, 768px na tablecie, 988px na desktopie | siatka stopki | wykryte |

### 4.3 Zaokrąglenia

| Token | Wartość | Gdzie | Status |
| --- | --- | --- | --- |
| `radius.md` | 12px | przyciski w sekcjach strony publicznej, pola formularza | wykryte |
| `radius.lg` | 16px | karty wyboru, panele, przyciski w modalach i w widokach po zalogowaniu (zmienna źródła `--web-ui_button-border-radius: 16px`) | wykryte |

**Zasada:**

- `radius.md` dla **przycisków na stronach publicznych** i **pól**.
- `radius.lg` dla **kontenerów** (karty, panele, komunikaty, modale), dla **przycisków w modalach** i dla **wszystkiego po zalogowaniu**.
- Nowy komponent-kontener dostaje `radius.lg`.

Status zasady: wykryte (użycia), wywnioskowane (reguła). Kształtu pigułki ani pełnych kół źródło nie używa. Wartość `2px` pojawiła się 4 razy w nieznanym kontekście, więc jej nie używaj.

---

## 5. Krawędź zamiast cieni

Źródło nie ma rozmytych cieni, gradientów ani `backdrop-filter`. Status: wykryte.

| Token | Wartość | Budowa | Status |
| --- | --- | --- | --- |
| `edge.height` | 4px | Przycisk wypełniony: `box-shadow: 0 4px 0 <edge>` na `::before`; element ma 4 px przezroczystej dolnej ramki jako rezerwę. | wykryte |
| `edge.heightOutline` | 2px | Przycisk obrysowany: ramka 2px plus `box-shadow: 0 2px 0 <border>`, razem 4px. | wykryte |
| `border.width.default` | 2px | Ramki kart, paneli, pól, przycisków obrysowanych, linii nagłówka i pasków. | wykryte |
| `border.width.cardBottom` | 4px | Dolna ramka karty i panelu. Krawędź kontenera to ramka, nie cień. | wykryte (karta); panel: wywnioskowane |

Wszystkie wymiary w źródle są liczone z `box-sizing: border-box`. Zgadzają się z pomiarami tylko z resetem z §9. Status: wykryte (wysokości zgadzają się wyłącznie przy `border-box`).

---

## 6. Breakpointy

Projektuj od telefonu w górę (`min-width`). Progi zmierzyłem, zmieniając szerokość okna co 1 px i obserwując układ. Status: wykryte.

| Token | Wartość | Co się zmienia |
| --- | --- | --- |
| `bp.md` (tablet) | 768px | margines boczny 15 → 40 px; nagłówki display 36 → 48 px; ilustracja 345 → 452 px; stopka 1 → 3 kolumny; tytuł hero i duże hasło dostają szerokość kontenera (480 / 583 px); tytuł hero → przyciski 20 → 40 px |
| `bp.lg` (desktop) | 1080px | wiersz z ilustracją: kolumna → rząd; hero: kolumna → dwie kolumny; nagłówek strony: logo wyśrodkowane → logo po lewej, akcja po prawej; stopka 3 → 5 kolumn; `type.display.xl` 48 → 64 px; treść w `container.content` (988 px) |

Progi lokalne:

| Próg | Gdzie | Co się zmienia | Status |
| --- | --- | --- | --- |
| 700px | siatka kart wyboru | odstęp kart 12 → 24 px | wykryte |
| 981–1070px (dokładnie nieustalony) | siatka kart wyboru | liczba kolumn z automatycznej → stała 4 × 200 px; u nas pod `bp.lg` | wykryte (przedział); przypisanie do 1080: wywnioskowane |

Progi 400, 425, 530, 550, 600, 769, 890, 896, 1024 i 1280 px występują w czytelnych arkuszach źródła, ale nie zmieniają żadnego zmierzonego elementu układu. Nie używaj ich.

---

## 7. Ruch

| Token | Wartość | Status |
| --- | --- | --- |
| `motion.state` | 0ms (stany przycisków i kart bez przejścia) | wykryte |
| `motion.duration.fast` | 200ms | wykryte (`filter 0.2s`); element: do weryfikacji |
| `motion.duration.base` | 300ms | wykryte |
| `motion.duration.slow` | 400ms | wykryte |
| `motion.duration.slower` | 500ms | wykryte |
| `motion.easing.out` | `cubic-bezier(0.22, 1, 0.36, 1)` | wykryte |
| `motion.easing.standard` | `ease` | wykryte |
| `motion.easing.inOut` | `ease-in-out` | wykryte |

Użycie opisuje [motion.md](motion.md).

---

## 8. Dodatek: tryb ciemny (nie włączaj bez decyzji zespołu)

Strona źródłowa nie ma trybu ciemnego: zrzuty jasny i ciemny wyglądają tak samo. Jej CSS zawiera jednak ciemne wartości tych samych zmiennych. Status całej tabeli: wykryte (CSS var), wizualnie niezweryfikowane.

| Token | Jasny | Ciemny | Kontrast w ciemnym |
| --- | --- | --- | --- |
| `color.surface.page` | `#ffffff` | `#131f24` | — |
| `color.surface.subtle`, `color.surface.info` | `#f7f7f7`, `#ddf4ff` | `#202f36` | — |
| `color.border.default` | `#e5e5e5` | `#37464f` | — |
| `color.text.strong`, `color.text.primary` | `#3c3c3c`, `#4b4b4b` | `#f1f7fb` | 15.56 |
| `color.text.muted` | `#777777` | `#dce6ec` | 13.27 |
| `color.text.disabled` | `#afafaf` | `#52656d` | 2.75 |
| `color.action.primary.fill` / `.edge` | `#58cc02` / `#58a700` | `#93d333` / `#79b933` | tekst `#131f24` na wypełnieniu: 9.29 |
| `color.action.info.fill` | `#1cb0f6` | `#49c0f8` | — |
| `color.status.error.fill` / `.edge` | `#ff4b4b` / `#ea2b2b` | `#ee5555` / `#d84848` | — |
| `color.status.warning.fill` / `.edge` | `#ff9600` / `#cd7900` | `#ffab33` / `#d79433` | — |

Nie wszystkie tokeny mają działający odpowiednik w ciemnym:

- `color.text.link`: 3.41:1 w ciemnym. Zamiennik: `#49c0f8` (8.15:1). Status: wywnioskowane.
- `color.text.display`: 1.23:1. Zamiennik: `#93d333` (9.29:1). Status: wywnioskowane, do weryfikacji.

---

## 9. Blok CSS do skopiowania

Wklej na początek globalnego arkusza. Komentarze `[status]` są tylko informacją, nie usuwaj ich.

```css
/* Reset: wszystkie wymiary systemu zakładają border-box  [wykryte] */
*, *::before, *::after { box-sizing: border-box; }

:root {
  /* Powierzchnie */
  --color-surface-page: #ffffff;                       /* [wykryte] */
  --color-surface-subtle: #f7f7f7;                     /* [wykryte] */
  --color-surface-info: #ddf4ff;                       /* [wykryte] */
  --color-surface-brand: #58cc02;                      /* [wykryte] */
  --color-surface-inverse: #100f3e;                    /* [wykryte] */
  --color-surface-overlay: rgba(0, 0, 0, 0.3);         /* [wykryte] */
  --color-surface-overlay-strong: rgba(0, 0, 0, 0.4);  /* [wykryte] */
  --color-surface-disabled: #e5e5e5;                   /* [wywnioskowane, do weryfikacji] */

  /* Ramki */
  --color-border-default: #e5e5e5;                     /* [wykryte] */
  --color-border-field: #777777;                       /* [wywnioskowane AA, do weryfikacji] */
  --color-border-focus: #2b70c9;                       /* [wywnioskowane AA] */
  --color-border-error: #ea2b2b;                       /* [wywnioskowane, do weryfikacji] */

  /* Tekst */
  --color-text-strong: #3c3c3c;                        /* [wykryte] */
  --color-text-primary: #4b4b4b;                       /* [wykryte; dla akapitów: wywnioskowane AA] */
  --color-text-muted: #777777;                         /* [wykryte] tylko tekst duży */
  --color-text-disabled: #afafaf;                      /* [wykryte] tylko nieaktywne i dekoracja */
  --color-text-display: #042c60;                       /* [wykryte (CSS var); rola: wywnioskowane AA] */
  --color-text-link: #2b70c9;                          /* [wykryte (CSS var); rola: wywnioskowane AA] */
  --color-text-link-on-info: #042c60;                  /* [wywnioskowane AA] */
  --color-text-on-brand: #3c3c3c;                      /* [wywnioskowane AA] */
  --color-text-on-info-fill: #042c60;                  /* [wywnioskowane AA, do weryfikacji] */
  --color-text-on-inverse: #ffffff;                    /* [wykryte] */

  /* Akcje */
  --color-action-primary-fill: #58cc02;                /* [wykryte] */
  --color-action-primary-edge: #58a700;                /* [wykryte] */
  --color-action-primary-text: var(--color-text-on-brand);      /* [wywnioskowane AA] */
  --color-action-secondary-fill: #ffffff;              /* [wykryte] */
  --color-action-secondary-border: #e5e5e5;            /* [wykryte] */
  --color-action-secondary-edge: #e5e5e5;              /* [wykryte] */
  --color-action-secondary-text: var(--color-text-link);        /* [wywnioskowane AA] */
  --color-action-neutral-text: #4b4b4b;                /* [wykryte] */
  --color-action-info-fill: #1cb0f6;                   /* [wykryte] */
  --color-action-info-edge: #1899d6;                   /* [wykryte] */
  --color-action-info-text: var(--color-text-on-info-fill);     /* [wywnioskowane AA, do weryfikacji] */

  /* Statusy  [kolory: wykryte (CSS var); role: wywnioskowane] */
  --color-status-success-fill: #58cc02;
  --color-status-success-edge: #58a700;
  --color-status-success-surface: #d7ffb8;
  --color-status-info-fill: #1cb0f6;
  --color-status-info-edge: #1899d6;
  --color-status-info-surface: #ddf4ff;
  --color-status-warning-fill: #ff9600;
  --color-status-warning-edge: #cd7900;
  --color-status-warning-surface: #fff5d3;
  --color-status-error-fill: #ff4b4b;
  --color-status-error-edge: #ea2b2b;
  --color-status-error-surface: #ffdfe0;

  /* Dekoracyjne  [wykryte (CSS var)] tylko ilustracje, bez tekstu */
  --color-decorative-violet: #ce82ff;
  --color-decorative-yellow: #ffc800;
  --color-decorative-teal: #00cd9c;

  /* Fokus */
  --color-focus-ring: #042c60;                         /* [wywnioskowane] */
  --color-focus-ring-on-inverse: #ffffff;              /* [wywnioskowane] */
  --focus-ring-width: 3px;                             /* [wykryte] */
  --focus-ring-offset: 1px;                            /* [wykryte] */

  /* Kroje */
  --font-display: "Nunito", sans-serif;                /* [do weryfikacji] zamiennik */
  --font-ui: "Nunito", sans-serif;                     /* [do weryfikacji] zamiennik */
  --font-weight-regular: 400;                          /* [wykryte] */
  --font-weight-bold: 700;                             /* [wykryte] */
  --font-weight-display: 800;                          /* [do weryfikacji] */
  --tracking-label: 0.8px;                             /* [wykryte] */
  --tracking-display-xl: -0.02em;                      /* [wykryte] */
  --tracking-app-label: 0.04em;                        /* [wykryte (CSS var)] */

  /* Typografia: strony publiczne  [wykryte; interlinie po zmianie kroju: do weryfikacji] */
  --type-display-xl-size: 36px;                        /* 48px od 768, 64px od 1080 */
  --type-display-lg-size: 36px;                        /* 48px od 768 */
  --type-display-xl: var(--font-weight-display) var(--type-display-xl-size)/normal var(--font-display);
  --type-display-lg: var(--font-weight-display) var(--type-display-lg-size)/normal var(--font-display);
  --type-title-hero: 700 32px/40px var(--font-ui);
  --type-title-modal: 700 26px/40px var(--font-ui);
  --type-title-section: 700 19px/24px var(--font-ui);
  --type-title-footer: 700 19px/26.6px var(--font-ui);
  --type-title-card: 700 17px/20.4px var(--font-ui);
  --type-body: 400 17px/24px var(--font-ui);
  --type-body-card: 400 17px/19.55px var(--font-ui);
  --type-input: 400 20px/28px var(--font-ui);
  --type-label-button: 700 15px/18px var(--font-ui);
  --type-label-small: 700 15px/20px var(--font-ui);
  --type-link-footer: 700 15px/22px var(--font-ui);
  --type-caption-legal: 400 14px/20px var(--font-ui);  /* grubość 400: do weryfikacji */

  /* Typografia: ekrany aplikacji  [wykryte (CSS var); użycie: wywnioskowane] */
  --type-app-page-title-lg: 700 40px/44px var(--font-ui);
  --type-app-page-title-sm: 700 32px/36px var(--font-ui);
  --type-app-heading-lg: 700 28px/32px var(--font-ui);
  --type-app-heading-md: 700 24px/32px var(--font-ui);
  --type-app-heading-sm: 700 20px/24px var(--font-ui);
  --type-app-heading-xs: 700 16px/20px var(--font-ui);
  --type-app-body: 400 20px/28px var(--font-ui);
  --type-app-body-spacious: 400 20px/32px var(--font-ui);
  --type-app-caption: 400 16px/24px var(--font-ui);
  --type-app-label-lg: 700 24px/24px var(--font-ui);   /* + uppercase, --tracking-app-label */
  --type-app-label-md: 700 16px/16px var(--font-ui);   /* + uppercase, --tracking-app-label */

  /* Odstępy: skala  [wykryte; skala 4px: wywnioskowane] */
  --space-xs: 8px;
  --space-sm: 12px;
  --space-md: 16px;
  --space-lg: 20px;
  --space-xl: 24px;
  --space-2xl: 32px;
  --space-3xl: 40px;
  --space-4xl: 48px;                                   /* [do weryfikacji] */
  --space-5xl: 64px;
  --space-6xl: 96px;
  /* Odstępy lokalne  [wykryte] tylko w opisanych miejscach */
  --space-gutter-phone: 15px;
  --space-gutter: 15px;                                /* 40px od 768 */
  --space-row-gap: 101px;
  --space-field-x: 14px;
  --space-list-footer: 14px;
  --space-card-media-title: 22px;
  --space-card-title-meta: 6px;
  --space-heading-grid: 80px;
  --space-stack-alt: 15px;                             /* [do weryfikacji] */

  /* Rozmiary  [wykryte, chyba że opisano inaczej] */
  --size-control-height: 50px;
  --size-field-height: 48px;
  --size-field-height-with-action: 60px;
  --size-cta-width: 330px;
  --size-header-height: 72px;
  --size-strip-height: 80px;
  --size-media-feature: min(345px, calc(100vw - 30px)); /* 452px od 768, 530px od 1080 */
  --size-card-choice-min: 150px;
  --size-card-choice: 200px;
  --size-card-choice-max: 240px;
  --size-card-choice-height: 217px;
  --size-card-media-w: 88px;
  --size-card-media-h: 68px;
  --size-footer-column: 216px;                         /* 178px od 1080 */
  --size-icon: 1em;                                    /* [wywnioskowane, do weryfikacji] */

  /* Kontenery  [wykryte] */
  --container-content: 988px;
  --container-wide: 1090px;
  --container-max: 1440px;
  --container-statement: 583px;
  --container-heading: 503px;
  --container-text: 473px;
  --container-hero-title: 480px;
  --container-form: 375px;
  --container-footer: 375px;                           /* 768px od 768, 988px od 1080 */

  /* Zaokrąglenia, ramki, krawędź  [wykryte] */
  --radius-md: 12px;
  --radius-lg: 16px;
  --border-width: 2px;
  --border-width-card-bottom: 4px;
  --edge-height: 4px;
  --edge-height-outline: 2px;

  /* Ruch  [wykryte; --motion-duration-fast: element do weryfikacji] */
  --motion-state: 0ms;
  --motion-duration-fast: 200ms;
  --motion-duration-base: 300ms;
  --motion-duration-slow: 400ms;
  --motion-duration-slower: 500ms;
  --motion-easing-out: cubic-bezier(0.22, 1, 0.36, 1);
  --motion-easing-standard: ease;
  --motion-easing-in-out: ease-in-out;
}

/* Breakpointy nie działają jako zmienne w @media, dlatego wpisuj je literalnie: 768px (bp.md), 1080px (bp.lg). */
@media (min-width: 768px) {
  :root {
    --type-display-xl-size: 48px;
    --type-display-lg-size: 48px;
    --space-gutter: 40px;
    --size-media-feature: 452px;
    --container-footer: 768px;
  }
}
@media (min-width: 1080px) {
  :root {
    --type-display-xl-size: 64px;
    --size-media-feature: 530px;
    --size-footer-column: 178px;
    --container-footer: 988px;
  }
}

/* Baza dokumentu  [wywnioskowane: kolor i krój z wykrytych wartości dokumentu] */
body {
  margin: 0;
  background: var(--color-surface-page);
  color: var(--color-text-strong);
  font: var(--type-body);
}
```
