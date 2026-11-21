# Maciej — otwarte poprawki widoków po zalogowaniu

Stan na 21.11.2026, gałąź `maciej/ui-po-logowaniu`. Kod: `app/` (Next.js 16, Tailwind v4, dane demo w `app/src/lib/demo/`). Serwer dev: `npx next dev -p 3100` w `app/`.

**Zakres:** ścieżka (timeline), wyświetlanie przystanków, „Dokumenty i wnioski”, ustawienia/profil, onboarding (pełna funkcjonalność), potem widok na telefonie. **Kalkulator robi Julek** (`features/calculator/` — nie ruszamy). Strona publiczna: Bartek. Panel admina: Nikodem. Czat/agent: Julian (czekamy).

## Decyzje podjęte w tej rozmowie (nie ma ich w SPEC / ui/MACIEJ.md)

- Tło strony to `surface` (biel), nie `background` — `globals.css`. DESIGN.md do aktualizacji.
- Przystanki to podesty 3D (`features/journey-map/shared.tsx`, `Pedestal`). Wszystko, co za rodzicem (załatwione, odhaczone, wysłane, „Nie korzystam”), ma jeden wygląd; różnicę mówi podpis. Wybrany podest unosi się, bez obręczy.
- Bąbelek (maskotka z `maskotka_kod`, kopia w `app/src/components/mascot/babelek`, zależność `motion`) lewituje nad podestem pionka; dymek „Następny krok” obok. Przejście między polami: `TravellingZusik.tsx` (`travel`, `heading`, wzorzec z `maskotka_kod/app/mascot/roadmap`).
- Ścieżka bez ramki, bez paska przewijania, bezpośrednio na tle.
- Szczegóły przystanku otwierają się w panelu (z prawej na komputerze, od dołu na telefonie) — `BottomSheet`. Zmienia to element 4 w `ui/MACIEJ.md` (tam karta pod ścieżką przejmowała treść). Pod ścieżką zostaje tylko „Najbliższa sprawa”.
- Panel przystanku ma sekcję „O co chodzi” z opisami z oficjalnych źródeł (`lib/demo/stop-details.ts`, sprawdzone 21.11.2026) i „Podstawa” z linkami. Źródła pod przyciskami.
- Sprawy urzędowe: „Oznacz jako załatwione”, „Nie korzystam” (dobrowolne), „Cofnij oznaczenie”. Informacja/Program zdrowotny: „Odhacz”.
- Widok listy: przystanki jako rozwijane wiersze ze znacznikiem stanu, bez tagów.
- Licznik „Etap N z 4” podąża za przewijaniem ścieżki.
- Profil: „Rola w planie” i „Zmiana pracy przed porodem” jako listy rozwijane (`SelectField`).
- Plan oczekiwanego dziecka budowany z tego samego katalogu przystanków co plan Oli.
- Poprawki faktów po sprawdzeniu źródeł: zasiłek macierzyński bez okresu wyczekiwania; odpis aktu urodzenia niepotrzebny przy zwykłym wniosku o zasiłek/ojcowski. SPEC-PO-LOGOWANIU do poprawy w tych miejscach. Niepotwierdzone przez źródła: 13,71%, kod „B”, ojcowski poza pulą rodzicielskiego, kanał online becikowego (pole `uwagi` w `stop-details.ts`).

## Do zrobienia — ścieżka i przystanki

1. **Bąbelek-przycisk czatu „w boxie”** (Dokumenty, Profil): lewe ramię ucięte — SVG maskotki przycina się do viewBox. Dodać `overflow-visible` (np. w `components/mascot/Zusik.tsx`). Sprawdzić też obrys fokusu po kliknięciu.
2. **Licznik etapu nie pokazuje „Przed narodzinami”.** Dwa błędy: (a) „Teraz jesteś na etapie” bierze `plan.stage`, a powinien etap pionka (`pawnStop.stage`); (b) etap widoczny liczony ze środka widoku — przy wąskim pierwszym etapie środek wpada w „Ciążę”. Liczyć z punktu `scrollLeft + clientWidth/3` (tam ustawiamy pionka) albo z pierwszego etapu przy `scrollLeft ≈ 0`. `HorizontalPath.tsx` (efekt `report`) i `JourneyMap.tsx`.
3. **Po powrocie z innej karty Bąbelek nie stoi na żadnym przystanku.** Pionek jest w etapie „Przed narodzinami”, który przy nowym montażu jest zwinięty (`collapsed` w `JourneyMap.tsx`). Nigdy nie zwijać etapu z pionkiem; domyślnie zwijać „Przed narodzinami” tylko, gdy wszystko w nim załatwione.
4. **Bąbelek ma ruszyć dopiero po zamknięciu panelu.** Po „Oznacz jako odhaczone/załatwione” w panelu przystanku pionek przesuwa się od razu. Ma poczekać na zamknięcie panelu, potem animować przejście (np. trzymać „wyświetlany pionek” w stanie i aktualizować go w `onClose` panelu).
5. **Ścieżka przechwytuje przewijanie strony.** Kursor nad ścieżką: kółko/gest pionowy przewija ścieżkę zamiast strony. Pionowy scroll ma przewijać stronę; ścieżka tylko poziomo (gest poziomy, Shift+kółko, przyciski). Sprawdzić, czy kontener nie jest wyższy niż przydzielone miejsce; rozważyć `overscroll-x-contain` → usunąć, `touch-action: pan-x pan-y`, przekierowanie `wheel` z `deltaY` do okna.
6. **Podpisy przystanków czytelniej przy dłuższym tekście** (zrzut 21.44.40 — do ponownego przesłania): np. stała szerokość, max 2 linie tytułu, status w osobnej linii, termin wyróżniony.
7. **Ptaszek (chevron) w rozwijanych sekcjach trochę w lewo** — `components/ui/Disclosure.tsx` (np. `mr-2`).
8. **Widok listy: „Najbliższa sprawa” nad listą.** W widoku ścieżki zostaje pod ścieżką jak teraz. `JourneyMap.tsx`.

## Do zrobienia — onboarding i funkcjonalność

9. **Pytanie w onboardingu „bez sensu”** (zrzut 21.45.57 — do ponownego przesłania, ustalić które).
10. **Onboarding w pełni działający**: odpowiedzi (sytuacja, rola, data, liczba dzieci, nazwa, zmiana pracy) mają tworzyć plan, a nie wybierać gotowy (`ola` / `oczekiwane` / `przyklad`). Terminy liczone z daty (`lib/rules/deadlines.ts`: np. zgłoszenie urodzenia 21 dni, 800+ 3 mies., macierzyński przed porodem 6 tyg.), przystanki z katalogu według sytuacji i roli, ostrzeżenie przy zmianie pracy = Tak. Plan dopisany do selektora dziecka.
11. **Zapamiętywanie stanu** (odhaczenia, oznaczenia, utworzone plany, odpowiedzi onboardingu) po odświeżeniu — najpierw localStorage w `PlanProvider`, później backend.
12. **Gdzie w głównym widoku jest „Wsparcie”?** Dziś tylko link w onboardingu i trasa `/wsparcie`. SPEC: wejścia także z przełącznika spokojnego widoku na ścieżce, ze stopki każdej karty i z karty sprawy przy martwym urodzeniu/wcześniactwie/„Za życiem”. Dodać widoczne wejście na „Moim planie”.
13. **Mapa niepodpiętych funkcji** — przygotować listę dla użytkownika (wiadomość z „[Pasted text #4]” nie dotarła; poprosić o ponowne wklejenie). Znane: „Rozpocznij”/„Sprawdź i zatwierdź”/„Przekaż” w Dokumentach (TODO backend), „Sprawdź, jak przystąpić”/akcje ostrzeżeń, „Dane dziecka”, „Dodaj dziecko lub plan” (→ onboarding bez tworzenia planu), „Sprawdź inny scenariusz”, edycja w Profilu bez wpływu na plan, sprawa testowa z wynikiem na sztywno (OCR), „Odśwież dane” ZUS (symulacja), panel Zusika (Julian).

## Dokumenty i ustawienia (po timeline)

14. Dokumenty na tym samym stanie co ścieżka (już wspólne `plan.stops`; dopilnować oznaczeń „przez Ciebie”), symulacja wysyłki i potwierdzenia, szczegóły sprawy.
15. Profil: zapis zmiany przelicza plan i oznacza zależne szkice „Sprawdź po zmianie danych”.

## Telefon

16. Przegląd responsywny (użytkownik sprawdzi): pionowa ścieżka, baner etapu, „↑ Teraz”, panel od dołu, dolny pasek, onboarding z „Dalej” przyklejonym na dole.
