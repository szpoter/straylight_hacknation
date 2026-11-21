# CLAUDE.md

## Aplikacja i deploy

Kod aplikacji jest w [`web/`](web/): Next.js (App Router, TypeScript, Tailwind), backend jako REST API w `web/src/app/api/`. Stack wynika z wymagań technicznych zadania ZUS (s. 15): preferowany React/Next.js i REST API. Przed pisaniem kodu przeczytaj [`web/AGENTS.md`](web/AGENTS.md).

Projekt Vercel `straylight-hacknation` (team `idk`) ma Root Directory `web`. Push na `main` wdraża produkcję na https://straylight-hacknation.vercel.app, inne gałęzie i PR-y dostają preview. Lokalnie: `cd web && npm install && npm run dev`.

Zadanie wymaga wskazania w opisie projektu funkcji opartych na AI, a regulamin (§ 4 ust. 1) wymaga wskazania w prezentacji zewnętrznych rozwiązań. Dodając bibliotekę lub usługę zewnętrzną, odnotuj ją w opisie commita, żeby dało się zebrać pełną listę do zgłoszenia.

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
