# CLAUDE.md

## Aplikacja i deploy

Kod aplikacji jest w `app/` (Next.js, backend jako REST API w `app/src/app/api/`). Na razie żyje na gałęzi `zusik/stage1-probe`, układ i polecenia opisują tam `app/ARCHITECTURE.md` i `app/README.md`. Stack wynika z wymagań technicznych zadania ZUS (s. 15): preferowany React/Next.js i REST API.

Projekt Vercel `straylight-hacknation` (team `idk`, plan Hobby) ma Root Directory `app`, instalację `npm ci` i Node 24. Push na `main` wdraża produkcję na https://straylight-hacknation.vercel.app, inne gałęzie dostają preview. Na planie Hobby z prywatnym repo Vercel buduje tylko commity właściciela konta (`szpoter`). Commity innych osób są blokowane, wtedy deploy uruchamia `szpoter` albo `vercel deploy` z CLI.

Zadanie wymaga wskazania w opisie projektu funkcji opartych na AI, a regulamin (§ 4 ust. 1) wymaga wskazania w prezentacji zewnętrznych rozwiązań. Dodając bibliotekę lub usługę zewnętrzną, odnotuj ją w opisie commita, żeby dało się zebrać pełną listę do zgłoszenia.

## Design i UI

Wygląd opisuje [`DESIGN.md`](DESIGN.md), zapisany w otwartym formacie DESIGN.md. To kierunek, a nie sztywna specyfikacja. Tokeny kolorów, typografii, zaokrągleń i odstępów są w nagłówku YAML, a proza opisuje charakter strony. Treść i zachowanie ekranów określają `SPEC*.md` i `ui/*.md`.

- Kolory, kroje, zaokrąglenia i odstępy bierz z tokenów w `DESIGN.md`. Nowe komponenty mogą odbiegać od przykładów, jeśli zachowują opisany charakter.
- Jeśli potrzebnej wartości nie ma w tokenach (np. koloru błędu), zapytaj zespół. Jeśli nie możesz czekać, użyj najbliższego tokenu i oznacz miejsce w kodzie „do weryfikacji”.
- Animacje i ruch dostarcza zespół, nie projektuj ich sam.
