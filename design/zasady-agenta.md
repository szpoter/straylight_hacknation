# Zasady dla agenta: budowa nowego ekranu

Czytaj zawsze przed pracą nad UI, razem z [README](README.md). Ten plik mówi, **jak** pracować. Wartości są w [tokeny.md](tokeny.md), a budowa elementów w [komponenty.md](komponenty.md).

Status tego pliku: reguły pracy to `wywnioskowane` (zasady projektu). Każda liczba tutaj odsyła do tokenu, a jej status jest w [tokeny.md](tokeny.md).

**„Ekran”** oznacza jeden widok w aplikacji albo jedną sekcję strony publicznej. Strona publiczna składa się z wielu sekcji.

---

## 1. Twarde reguły

1. **Tylko tokeny.** Kolor, rozmiar, odstęp, zaokrąglenie, czas i easing bierzesz ze zmiennych CSS z [tokeny.md §9](tokeny.md#9-blok-css-do-skopiowania).
   - Literał w kodzie komponentu (`#…`, `px` spoza tokenu, `0.25s`) to błąd.
   - Wyjątki: breakpointy w `@media` (768 px i 1080 px oraz lokalny 700 px siatki kart) i kolory w `shadow` efektu gooey ([gooey.md §3.1](gooey.md#31-zasady)). Przepisujesz je literalnie z tokenów.
2. **Brak wartości:** zapytaj zespół. Jeśli nie możesz czekać, użyj najbliższego istniejącego tokenu i oznacz w kodzie `do weryfikacji: brak tokenu dla …`. Ta sama procedura obowiązuje w `tokeny.md` i `CLAUDE.md`.
3. **WCAG 2.1 AA:**
   - tekst tylko w kolorach z [tokeny.md §1.3](tokeny.md#13-tekst);
   - nigdy biały na zielonym ani jasnoniebieskim;
   - `--color-text-muted` tylko dla tekstu dużego;
   - widoczna etykieta nad każdym polem, bez placeholderów;
   - pierścień fokusu na każdym elemencie interaktywnym.
4. **Jedna akcja główna na sekcję.** W oknie widać naraz najwyżej jeden przycisk `primary` ([layout.md §4](layout.md#4-gęstość-treści-i-jedna-akcja-główna)).
5. **Każdy element klikalny ma krawędź** i stany z [komponenty.md](komponenty.md). Stany zmieniają się bez `transition`.
6. **Głębię daje krawędź.** Bez rozmytych cieni, gradientów i `backdrop-filter`.
7. **Animacje:** tylko te z [motion.md](motion.md). Brak opisu oznacza stan końcowy bez ruchu plus znacznik TODO w składni danego języka:
   - JS/TS: `// TODO(motion): <slot>`;
   - CSS: `/* TODO(motion): <slot> */`;
   - HTML: `<!-- TODO(motion): <slot> -->`.

   Zawsze dodaj obsługę `prefers-reduced-motion`.
8. **Bez brandingu źródła:** żadnych logo, maskotki, nazw własnych ani tekstów strony źródłowej. Teksty bierzesz ze specyfikacji projektu (`SPEC*.md`) bez zmiany wielkości liter.
9. **Reset `box-sizing: border-box`** z [tokeny.md §9](tokeny.md#9-blok-css-do-skopiowania) musi być w arkuszu. Bez niego przyciski i pola mają złe wysokości.

---

## 2. Procedura dla nowego ekranu

1. **Ustal typ ekranu.**
   - Strona publiczna: typografia z [tokeny.md §2.2](tokeny.md#22-skala-stron-publicznych-zmierzona).
   - Widok po zalogowaniu: typografia z [§2.3](tokeny.md#23-skala-ekranów-aplikacji-ze-zmiennych-css-źródła), wszystkie zaokrąglenia `--radius-lg`.
   - W obu przypadkach kontenery (karty, panele, modale) mają `--radius-lg`. Przyciski na stronie publicznej mają `--radius-md`, w modalu `--radius-lg`.
2. **Przeczytaj specyfikację ekranu** (`SPEC*.md`, `ui/*.md`). Weź z niej treść, kolejność i rozmieszczenie elementów.
3. **Wybierz wzorzec sekcji** z [layout.md §3](layout.md#3-wzorce-sekcji). Jeśli żaden nie pasuje, złóż sekcję z kontenerów i rytmu z [layout.md §1–2](layout.md#1-siatka-i-kontenery) i opisz w komentarzu, z czego ją złożyłeś.
4. **Wskaż jedną akcję główną sekcji:** jej tekst ze specyfikacji i miejsce.
5. **Złóż komponenty** z [komponenty.md](komponenty.md), w tym złożone z [§11](komponenty.md#11-komponenty-złożone-wywnioskowane). Element spoza listy budujesz z tokenów i oznaczasz `/* nowy komponent: do weryfikacji */`.
6. **Ułóż rytm** według [layout.md §2](layout.md#2-rytm-pionowy).
7. **Responsywność:** zacznij od telefonu i rozszerzaj przez `min-width: 768px` i `min-width: 1080px`. Sprawdź tabelę w [layout.md §5](layout.md#5-zachowanie-responsywne-podsumowanie).
8. **Dostępność:**
   - kolejność fokusu zgodna z kolejnością czytania;
   - semantyka i `aria-*` według komponentu (karty wyboru, zakładki, modal, pola);
   - cele dotykowe nie mniejsze niż przycisk (`--size-control-height`).
9. **Ruch:** slot z [motion.md §5.2](motion.md#52-sloty-znane-ze-specyfikacji-projektu) oznacza TODO według reguły 7. Animacji nie projektujesz.
10. **Przejdź listę kontrolną** z sekcji 3.

---

## 3. Lista kontrolna przed oddaniem

- [ ] W kodzie komponentów nie ma żadnego hexa ani rozmiaru spoza zmiennych `--…`, poza wyjątkami z reguły 1.
- [ ] W arkuszu jest reset `box-sizing: border-box`.
- [ ] Na sekcję przypada jeden przycisk `primary`.
- [ ] Tekst na zielonym ma `--color-text-on-brand`, a na niebieskim wypełnieniu `--color-text-on-info-fill`.
- [ ] Akapity mają `--color-text-primary`, nie `#777`.
- [ ] Linki mają `.link` (700); na tle `surface.info` `--color-text-link-on-info`.
- [ ] Każde pole ma widoczną etykietę, nie ma placeholderów, błąd ma `aria-invalid` i `aria-describedby`.
- [ ] Wszystkie elementy interaktywne mają widoczny fokus, także pole z błędem.
- [ ] Stany hover i active nie mają `transition`.
- [ ] Brak `box-shadow` z rozmyciem, `linear-gradient` i `backdrop-filter`.
- [ ] Działa `prefers-reduced-motion: reduce`.
- [ ] Ekran sprawdzony na 375, 768, 1079 i 1280 px, bez przewijania w poziomie.
- [ ] Brak treści, logo i ilustracji ze strony źródłowej.
- [ ] Wartości „do weryfikacji”, których użyłeś, są wypisane w opisie zmiany.

---

## 4. Rozstrzyganie konfliktów

| Sytuacja | Co robisz |
| --- | --- |
| Specyfikacja (`SPEC*.md`, `ui/*.md`) określa **treść, kolejność, rozmieszczenie** (co jest po lewej, co pod czym) albo **zachowanie** | Wygrywa specyfikacja. |
| Specyfikacja albo `DESIGN.md` określa **wygląd**: kolory, kroje, odstępy, kształty, wygląd komponentów | Wygrywa ten folder. `design/` zastępuje `DESIGN.md`. |
| Znany konflikt: `SPEC.md` → Hero, „ciemnozielony przycisk na jasnym, ciepłym tle” (sekcja oznaczona w specyfikacji jako do omówienia) | Stosuj przycisk `primary` i `--color-surface-page` z tego folderu. Konflikt zgłoś w opisie zmiany. |
| Wierność źródłu kłóci się z AA | Wygrywa AA (decyzja projektu). |
| Brak informacji | Reguła 2: zapytaj albo użyj najbliższego tokenu i oznacz „do weryfikacji”. |
