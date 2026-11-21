# CLAUDE.md

## Design i UI

Wygląd opisuje folder [`design/`](design/README.md). Jest jedynym źródłem prawdy o wyglądzie i **zastępuje `DESIGN.md`**. Przy konflikcie z `DESIGN.md` wygrywa `design/`. Treść i zachowanie ekranów nadal określają `SPEC*.md` i `ui/*.md`.

Kiedy czytać który plik:

- **Każda praca nad UI:** [`design/README.md`](design/README.md) i [`design/zasady-agenta.md`](design/zasady-agenta.md).
- **Nowy ekran lub sekcja:** dodatkowo [`kierunek.md`](design/kierunek.md), [`layout.md`](design/layout.md), [`komponenty.md`](design/komponenty.md), [`tokeny.md`](design/tokeny.md).
- **Tylko style (kolor, typografia, odstępy):** [`design/tokeny.md`](design/tokeny.md).
- **Animacje i ruch:** [`design/motion.md`](design/motion.md). Animacje dostarcza zespół, nie projektuj ich sam.
- **Efekt zlewających się przycisków (`liquid-gooey`):** [`design/gooey.md`](design/gooey.md).
- **Weryfikacja lub aktualizacja wartości:** [`design/zrodla.md`](design/zrodla.md).

Wartości bierz wyłącznie z tokenów w `design/tokeny.md`. Jeśli brakuje wartości, zapytaj zespół. Jeśli nie możesz czekać, użyj najbliższego tokenu i oznacz miejsce w kodzie „do weryfikacji”. Nie zgaduj nowych wartości.
