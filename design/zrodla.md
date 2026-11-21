# Źródła i weryfikacja

Ten plik jest dla ludzi i dla agenta, który aktualizuje folder `design/`. Agent budujący UI **nie musi** go czytać.

---

## 1. Skąd są dane

Źródło: https://pl.duolingo.com/. Data ekstrakcji: 2026-11-21. Bez logowania, z odrzuconymi cookies.

### 1.1 designlang 13.4.1

```bash
npx designlang https://pl.duolingo.com/ --full --motion-runtime --dark --wait 2500 \
  --ignore-widgets --depth 3 --no-history --no-credit
```

| Co objęła | Wynik |
| --- | --- |
| Podstrony (10) | `/`, `/register`, `/chess`, `/course/{en,es,fr,de,it,pt,ja}/pl/…` |
| Szerokości | 375, 768, 1280, 1920 px, każda w trybie jasnym i ciemnym |
| Elementy | 11 711 |
| Ruch | `document.getAnimations()` przy ładowaniu i przewijaniu |
| Bot protection | brak blokady |

Ograniczenia tej ekstrakcji:

- Baner cookies przykrył dane interakcji: stany hover i focus zmierzono na przyciskach banera. **Te dane odrzuciłem.**
- Wygląd przycisków jest zbudowany na `::before`, a designlang tych pseudo-elementów nie odczytał.

### 1.2 Własne przebiegi Playwright (4)

Uruchamiałem headless Chromium z dwukrotną gęstością pikseli. Przed pomiarami odrzucałem baner cookies.

| Przebieg | Co mierzył |
| --- | --- |
| 1 | `::before` i `::after` przycisków. Stany hover, active i focus na prawdziwych CTA. Kroje z `document.fonts`. Nagłówki i akapity. Sekcje i kontenery. Wszystkie `transition` z elementem. `getAnimations()` co 400 px przewijania. Style inline zmieniane przy przewijaniu. Reguły `@media` z czytelnych arkuszy. |
| 2 | Fokus klawiaturą (Tab), pasek z karuzelą, krzywa `opacity` tła sekcji i `transform` nagłówka w funkcji przewinięcia. Modal logowania otwarty przyciskiem: **nic nie wysyłano, nic nie wpisano**. Pola w stanie default i focus. Stany karty wyboru na `/register`. Siatka kart na telefonie. |
| 3 | Stopka, nagłówek, wiersz z ilustracją na 375, 768 i 1280 px. Separator „lub”. Przyciski w modalu. |
| 4 | Pomiar szerokości: strona główna i `/register`, od 360 do 1300 px co 10 px, a wokół progów co 1 px. Pomiar objął kierunek wiersza, szerokość ilustracji, rozmiary nagłówków, kolumny i odstępy stopki, układ nagłówka strony, hero, siatkę kart i `scrollWidth`. Wynik: progi układu to 768 i 1080 px; ilustracja wystaje poza kontener i jest przycinana. |

### 1.3 Biblioteka `liquid-gooey@0.2.2`

Przeczytałem README, `index.d.ts` i `dist/index.js` z paczki npm. Z kodu pochodzą:

- wartości presetów `transition`;
- domyślne `blur`, `contrast` i `filterPadding`;
- obsługa `prefers-reduced-motion` (`resolveTransition`);
- parser `shadow`;
- owijka `display: contents`.

### 1.4 Kontrast

Liczony wzorem WCAG 2.1 (luminancja względna) dla każdej pary podanej w [tokeny.md](tokeny.md).

---

## 2. Dowody najważniejszych wartości

| Token lub zasada | Dowód |
| --- | --- |
| Biel 67% powierzchni | designlang, „Dominance” (udział malowanej powierzchni tła) |
| Przycisk `primary` | `a[data-test="get-started-top"]`: element 330 × 50, `border-bottom` 4px przezroczysta, `radius` 12; `::before` z tłem `#58cc02`, `box-shadow: 0 4px 0 #58a700`, wysokość 46, `z-index: -1`; hover `filter: brightness(1.1)`; active `translateY(4px)`, `::before` bez cienia |
| Przycisk `secondary` | `button[data-test="have-account"]`: element z ramką 2/2/4/2 px; `::before` z `inset: -2px`, białym tłem, ramką 2px `#e5e5e5`, `box-shadow: 0 2px 0 #e5e5e5`; hover `brightness(0.9)`; active `translateY(2px)`; etykieta `#1cb0f6` |
| Przycisk `info` w modalu | `[data-test="register-button"]`: `::before` z tłem `#1cb0f6`, krawędź `#1899d6`, `radius` 16 |
| Brak przejść na kontrolkach | computed `transition: all` (0s) na przyciskach i kartach; lista wszystkich niezerowych `transition` na stronie zawiera tylko 4 pozycje z [motion.md §1](motion.md#1-wykryte-przejścia-css) |
| Fokus | Tab: `:focus-visible` pasuje, `outline-width: 3px`, `outline-offset: 1px` (linki i CTA), ale zrzut nie pokazuje pierścienia |
| Pole formularza | opakowanie `div`: tło `#f7f7f7`, ramka 2px `#e5e5e5`, `radius` 12, wysokość 48; w focus ramka `#1cb0f6`; input 20/28 px `#4b4b4b`, wewnętrzny odstęp 8/14; placeholder `#777` |
| Karta wyboru | `button[data-test*="language-card"]`: 200 × 217, ramka 2px plus dolna 4px `#e5e5e5`, `radius` 16, wewnętrzny odstęp 12/12/24, hover `brightness(0.9)`, active bez zmian |
| Kroje | `document.fonts`: krój display 700 i krój UI 100–900 (oba załadowane). Nagłówki `h2` i duże `h1` w kroju display, reszta w UI. |
| Nagłówki małymi literami | tekst nagłówków display w DOM jest w całości małymi literami, `text-transform: none` |
| Skala aplikacji | zmienne `--text-*` w CSS (np. `--text-heading-size-large: 1.75rem`, `--text-label-casing-medium: uppercase`) |
| Kolory statusów i link AA | zmienne `--color-*` w CSS źródła (wartości RGB), pary jasny/ciemny z `--dark` |
| Kontenery i rytm | pomiary `getBoundingClientRect` i computed `padding`, `gap`, `max-width` na 3 szerokościach |
| Breakpointy 768 i 1080 | pomiar szerokości co 1 px: zmiany wszystkich elementów układu przy dokładnie 768 i 1080 px; progi są w arkuszach z innej domeny, więc nie było ich na liście `@media` |
| Wiersz z ilustracją | od 1080 px: tekst przy krawędzi kontenera 988 px, ilustracja 530 px za odstępem 101 px, czyli 146 px poza kontenerem; `scrollWidth` = szerokość okna na każdej szerokości |
| Siatka kart | kolumny dopasowują się do szerokości przy karcie co najmniej 150 px; marginesy kart 6 px (< 700 px) i 12 px (≥ 700 px); stałe 4 × 213 px od przedziału 981–1070 px; ikona 88 × 68, ikona → tytuł 22 px, tytuł → podpis 6 px |
| Stopka | kolumny 216 / 216 / 178 px; odstęp tytuł → link i link → link 14 px na wszystkich szerokościach |
| Animacja tła sekcji | inline `style="opacity: …"` na warstwie z tłem `#ddf4ff`, próbki co 400 px |
| Ilustracje | 20/20 `img` to SVG; inline `svg` w `span` z `translate3d(0,0,0)` i `content-visibility` (układ typowy dla odtwarzaczy animacji wektorowych) |

---

## 3. Lista „do weryfikacji”

Sprawdź ręcznie i zaktualizuj status w odpowiednim pliku.

| # | Co sprawdzić | Gdzie | Jak |
| --- | --- | --- | --- |
| 1 | Nunito jako zamiennik obu krojów; grubość 800 dla nagłówków display; interlinie `normal` po zmianie kroju | tokeny §2.1–2.2 | Zrzut nagłówka i przycisku obok źródła w tej samej skali |
| 2 | Ramka pola `#777777` (AA) zamiast `#e5e5e5`: czy nie jest zbyt ciężka | tokeny §1.2, komponenty §4 | Makieta formularza, decyzja zespołu |
| 3 | Etykieta `#042c60` na niebieskim przycisku `info` | tokeny §1.4, komponenty §1.2 | Makieta, ewentualnie rezygnacja z wariantu `info` |
| 4 | Stan wybranej lub rozwiniętej karty i wybranej zakładki (ramka `#2b70c9`, tło `#ddf4ff`) | komponenty §3.3, §11.2 | Kliknij kartę w aplikacji źródła albo zatwierdź propozycję |
| 5 | Stany disabled, błąd pola, loading (w źródle niewidoczne) | komponenty §1.3, §4.2 | Aplikacja źródła po zalogowaniu albo decyzja zespołu |
| 6 | Kolory statusów jako role success / info / warning / error | tokeny §1.5 | Ekrany lekcji i błędów w aplikacji źródła |
| 7 | Komponenty złożone (panel, zakładki, etykieta, zaślepka ilustracji, komunikat statusu) i hero w wariancie ze specyfikacji | komponenty §10–11, layout §3.1 | Makieta, decyzja zespołu |
| 8 | Hero na telefonie: przyciski przy dolnej krawędzi ekranu; szare wypełnienie przycisku `secondary` | layout §3.1, komponenty §1.4 | Telefon albo emulacja 375 px, inspekcja `::before` |
| 9 | Zamknięcie modala: rozmiar, kolor i odstęp ikony „X” | komponenty §6 | DevTools na otwartym modalu |
| 10 | Ikony: zestaw, rozmiar renderowany (`1em`), odstęp ikona–etykieta; styl wykryty tylko na 4 ikonach | komponenty §0.2, §1.1 | DevTools na przyciskach logowania zewnętrznego; wybór zestawu przez zespół |
| 11 | Odstępy lokalne: 15 px (przyciski w modalu, możliwe 16), 14 i 30 px (karuzela), `space.4xl` 48 px (użycie nieznane), 80/86 px (nagłówek → siatka kart) | tokeny §3, komponenty §6, §8 | DevTools: czy to celowe wartości |
| 12 | Element z `transition: filter 0.2s` | motion §1 | DevTools: wyszukaj w Elements |
| 13 | Chowanie i powrót nagłówka przy przewijaniu (próg, powrót w górę) | motion §2, komponenty §7 | Ręczny test przewijania |
| 14 | Krzywa pojawiania się tła sekcji przy przewijaniu | motion §2 | Wolne przewijanie z obserwacją `opacity` |
| 15 | Czasy i krzywe animacji ilustracji; czy to Lottie | motion §2–3 | Performance i Network w DevTools |
| 16 | Obsługa `prefers-reduced-motion` w źródle | motion §3 | DevTools → Rendering |
| 17 | Grubość zwykłego tekstu prawnego (400?) | tokeny §2.2 | DevTools na tekście pod formularzem |
| 18 | Falisty brzeg nad stopką: ilustracja czy CSS | komponenty §9 | DevTools na elemencie nad stopką |
| 19 | `liquid-gooey`: twardy `shadow` jako krawędź, `inset` jako ramka, `var()` w `shadow`, zachowanie `move` i `bend` przy ograniczeniu ruchu | gooey §2–3 | Prototyp w React |
| 20 | Tryb ciemny (cała tabela) | tokeny §8 | Tylko jeśli zespół zdecyduje się na tryb ciemny |
| 21 | Przycisk na ciemnym pasie (`on-inverse`) | komponenty §1.2 | DevTools na pasie `#100f3e` |

---

## 4. Czego świadomie nie przeniesiono

- Logo, maskotka, ilustracje, odznaki sklepów z aplikacjami i wszystkie teksty strony (branding).
- Nazwy zmiennych źródła (nazwy zwierząt): zastąpione nazwami semantycznymi.
- Rozmyty cień `0 0 5px` szary, warstwy `z-index` i animacja `onetrust-fade-in`, bo pochodziły z banera cookies.
- Kolory przycisków logowania zewnętrznego (barwy innych marek).
- Około 300 zmiennych kolorów z aplikacji źródła (wydarzenia, ligi, kampanie). W [tokeny.md](tokeny.md) są tylko barwy, które mają rolę w naszym systemie.

---

## 5. Jak zaktualizować folder

1. Ponów ekstrakcję komendą z §1.1 do katalogu tymczasowego, nie do repozytorium.
2. Zmieniona wartość aktualizuje token w [tokeny.md](tokeny.md), zarówno w tabeli, jak i w bloku CSS, oraz jego status.
3. Zatwierdzoną animację wpisz do [motion.md §5](motion.md#5-animacje-dostarczane-przez-zespół).
4. Rozstrzygniętą pozycję usuń z §3 tego pliku albo zmień jej status w pliku docelowym.
