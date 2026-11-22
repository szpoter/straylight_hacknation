# Zusik · Przewodnik Rodzica

Rodzic może sprawdzić, jakie świadczenia dotyczą jego rodziny, porównać podział urlopu między rodzicami i przygotować wniosek. Plan prowadzi od ciąży przez narodziny dziecka do kolejnych terminów. Przy każdej sprawie rodzic widzi potrzebne dokumenty, odbiorcę i kolejny krok. Logowanie mObywatelem, pobranie danych rodziny oraz przekazanie wniosku są symulacjami.

[Otwórz demo](https://straylight-hacknation.vercel.app) · [Prezentacja · 6 slajdów](zgloszenie/przewodnik-rodzica.pdf) · [Zrzuty ekranu](zgloszenie/) · [Obejrzyj minutowy film](plans/film/v1/przewodnik-rodzica-1080p.mp4)

## Jak sprawdzić projekt

1. Otwórz demo i przejdź do planu rodziny. Wybierz sprawę na ścieżce. W zakładce **Dokumenty** otwórz odpowiadający jej wniosek, uzupełnij pola i sprawdź podgląd przed przekazaniem.
2. W **Kalkulatorze** rozwiń **Sprawdź przykładową sprawę lub dokument PDF** i wybierz **Pracownica, 81,5% za cały okres**. Dla jednego dziecka urodzonego 3 czerwca 2026 r., podstawy z decyzji 5 608,85 zł i wariantu 81,5% stawka dzienna wynosi 152,37 zł, a za 28 dni czerwca przypada 4 266,36 zł brutto. Zmień wariant wypłaty i porównaj miesiące.
3. W profilu wybierz **Otwórz rozmowę z Zusikiem**, dołącz fikcyjny PDF i zapytaj o ubezpieczenie. Porównaj wskazane strony z dokumentem. Aby przejść przez ocenę ubezpieczenia, wybierz w profilu **Konto eZUS → Zwolnienia e-ZLA → Sprawdź ubezpieczenie na przykładzie**. Rozpocznij od pytania o dni zwolnienia, potem dołącz pakiet w sekcji dokumentów sprawy. Aby przeliczyć dokument z kwotą, otwórz w kalkulatorze **Sprawdź przykładową sprawę lub dokument PDF**, wybierz plik, sprawdź wskazaną stronę i potwierdź podstawę. Jeśli dokument zawiera tylko dane o ubezpieczeniu, kwotę podaj osobno. [Fikcyjny pakiet do sprawdzenia ubezpieczenia](app/public/demo/sickness/akta-demonstracyjne.pdf)
4. W panelu administratora wybierz **Sprawy testowe**. Przykład K-06 pokazuje odmowę z powodu braku ubezpieczenia, K-08 wskazuje brak informacji. Porównaj uzasadnienia. [Instrukcja panelu i test publikacji zmiany](ZGLOSZENIE-PANEL-ADMINISTRACYJNY.md)

## Gdzie działa AI

- **Rozmowa z Zusikiem.** Asystent wyszukuje fragmenty przepisów i poradników. Model językowy formułuje odpowiedź, a przypisy pozwalają rodzicowi sprawdzić jej podstawę. Repozytorium zawiera integracje z Bielikiem, Sherlockiem, Qdrantem oraz lokalnymi modelami.
- **Prowadzenie sprawy.** Asystent zbiera brakujące informacje w rozmowie. Kod reguł wylicza kwoty, okresy i terminy. Rodzic może sprawdzić wynik przed zatwierdzeniem dokumentu.
- **Odczyt dokumentów.** PDF.js odczytuje warstwę tekstową, a Tesseract rozpoznaje tekst na skanach. Rodzic potwierdza dane. OCR jest odrębnym zastosowaniem uczenia maszynowego.
- **Praca nad projektem.** Codex pomagał w przygotowaniu kodu, testów i materiałów zgłoszeniowych. Do przygotowania głosów w materiale filmowym wykorzystano ElevenLabs.

## Kod i uruchomienie

Aplikacja Next.js i trasy REST znajdują się w `app/src/app`, ekrany w `app/src/features`, a reguły świadczeń w `app/src/lib/rules`. Testy scenariuszy są w `app/tests`. W katalogu `app` użyj Node.js 24, wykonaj `npm ci` i `npm run dev`. Testy uruchomisz przez `npm test`. Moduły korzystające z zewnętrznych usług wymagają konfiguracji opisanej w instrukcji technicznej. [Uruchomienie i konfiguracja](app/README.md) · [Architektura](app/ARCHITECTURE.md)

`plans/film` zawiera materiały filmowe, `wnioski-research` dokumentuje dobór formularzy i kanałów doręczenia, a `ui` i pliki `PLAN-*.md` zawierają robocze decyzje zespołu. Do demonstracji służą fikcyjne pliki w `app/public/demo`. Przed udostępnieniem kodu jury przygotuj czystą kopię bez akt konkursowych, plików konfiguracyjnych z sekretami i historii roboczego repozytorium.
