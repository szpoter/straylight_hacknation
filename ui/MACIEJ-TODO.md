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

1. ✅ (22:25, do sprawdzenia wizualnie) **Bąbelek-przycisk czatu „w boxie”** (Dokumenty, Profil): lewe ramię ucięte — SVG maskotki przycina się do viewBox. Dodać `overflow-visible` (np. w `components/mascot/Zusik.tsx`). Sprawdzić też obrys fokusu po kliknięciu.
2. ✅ (22:25, do sprawdzenia wizualnie) **Licznik etapu nie pokazuje „Przed narodzinami”.** Dwa błędy: (a) „Teraz jesteś na etapie” bierze `plan.stage`, a powinien etap pionka (`pawnStop.stage`); (b) etap widoczny liczony ze środka widoku — przy wąskim pierwszym etapie środek wpada w „Ciążę”. Liczyć z punktu `scrollLeft + clientWidth/3` (tam ustawiamy pionka) albo z pierwszego etapu przy `scrollLeft ≈ 0`. `HorizontalPath.tsx` (efekt `report`) i `JourneyMap.tsx`.
3. ✅ (22:25, do sprawdzenia wizualnie) **Po powrocie z innej karty Bąbelek nie stoi na żadnym przystanku.** Pionek jest w etapie „Przed narodzinami”, który przy nowym montażu jest zwinięty (`collapsed` w `JourneyMap.tsx`). Nigdy nie zwijać etapu z pionkiem; domyślnie zwijać „Przed narodzinami” tylko, gdy wszystko w nim załatwione.
4. ✅ (22:25, do sprawdzenia wizualnie) **Bąbelek ma ruszyć dopiero po zamknięciu panelu.** Po „Oznacz jako odhaczone/załatwione” w panelu przystanku pionek przesuwa się od razu. Ma poczekać na zamknięcie panelu, potem animować przejście (np. trzymać „wyświetlany pionek” w stanie i aktualizować go w `onClose` panelu).
5. ✅ (22:25, do sprawdzenia wizualnie) **Ścieżka przechwytuje przewijanie strony.** Kursor nad ścieżką: kółko/gest pionowy przewija ścieżkę zamiast strony. Pionowy scroll ma przewijać stronę; ścieżka tylko poziomo (gest poziomy, Shift+kółko, przyciski). Sprawdzić, czy kontener nie jest wyższy niż przydzielone miejsce; rozważyć `overscroll-x-contain` → usunąć, `touch-action: pan-x pan-y`, przekierowanie `wheel` z `deltaY` do okna.
6. ✅ (22:25, do sprawdzenia wizualnie) **Podpisy przystanków czytelniej przy dłuższym tekście** (zrzut 21.44.40 — do ponownego przesłania): np. stała szerokość, max 2 linie tytułu, status w osobnej linii, termin wyróżniony.
7. ✅ (22:25, do sprawdzenia wizualnie) **Ptaszek (chevron) w rozwijanych sekcjach trochę w lewo** — `components/ui/Disclosure.tsx` (np. `mr-2`).
8. ✅ (22:25, do sprawdzenia wizualnie) **Widok listy: „Najbliższa sprawa” nad listą.** W widoku ścieżki zostaje pod ścieżką jak teraz. `JourneyMap.tsx`.

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

## Zrobione 21.11 wieczorem (do sprawdzenia wizualnie)

- Bąbelek-przycisk czatu: większe pole na animacje, nad dolnym paskiem.
- Pionek na sprawie z warunkiem: dymek „Czekamy: …. Potem: …”; „Najbliższa sprawa” bez spraw na dziś pokazuje następną sprawę i jej warunek.
- Panel przystanku: jedno zdanie „po co”, ramka z faktami (termin, od czego liczymy, gdzie, dla kogo), działania wyżej, „O co chodzi” jako punkty, „Co przygotować” i „Jak złożyć” zwijane. Przy sprawie załatwionej główny przycisk jest drugorzędny.
- Dokumenty: zdanie wyjaśniające kartę, cały wiersz klikalny (szczegóły sprawy), przyciski jednej szerokości.
- Profil: „Edytuj plan” otwiera panel edycji (plan oczekiwany: nazwa i termin porodu, terminy przystanków przesuwają się; plan z rejestru: tylko odczyt; test/przykład: bez edycji). Osobno „Otwórz plan”.

## Mapa niepodpiętych funkcji (stan 21.11, 22:45)

Działa tylko w pamięci przeglądarki do odświeżenia: odhaczenia, oznaczenia, edycja planu, wybór planu (ten zapamiętany).

| Miejsce | Co nie działa | Co powinno |
|---|---|---|
| Onboarding `/start` | Wybiera gotowy plan demo | Tworzy plan z odpowiedzi (punkt 10) |
| Selektor dziecka / Profil | „Dodaj dziecko lub plan” → onboarding, nowy plan nie powstaje | Dopisanie planu do listy |
| Dokumenty → szczegóły | „Rozpocznij”, „Sprawdź i zatwierdź”, „Przekaż” bez działania | Szkic → wypełniony → zatwierdzony → wysłano (symulacja), zdarzenia w przebiegu, plik „Kopia wniosku” |
| Panel przystanku | Przycisk ostrzeżenia (np. „Sprawdź, jak przystąpić”) bez działania | Otwiera wyjaśnienie / Zusika |
| Profil → Moje dane | Zapis nie wpływa na plan | Zmiana pracy = Tak → ostrzeżenie w planie; szkice „Sprawdź po zmianie danych” |
| Profil → Konto ZUS | „Odśwież dane”, wysyłka — symulacja bez skutku | Zdarzenie w sprawie |
| Profil → Sprawa testowa | Wynik OCR i porównanie na sztywno | OCR + reguły (backend) |
| Zusik (FAB, dymek nad pionkiem, „Dokończ z Zusikiem”) | Panel-zaślepka | Czat Juliana |
| Wsparcie | Brak wejścia na „Moim planie” | Wejście z planu i z kart spraw (punkt 12) |
| Kalkulator | — | Julek |
| Zapis stanu | Brak | localStorage, potem backend (punkt 11) |

## Backend — podłączymy później (decyzja 21.11)

Na razie cały stan rodzica jest w przeglądarce (`localStorage`, klucz `zusik.state.v1`, `features/family/PlanProvider.tsx`): odhaczenia i oznaczenia przystanków, edycje planów, plany z onboardingu, wpisane wartości wniosków. Dane startowe są w `lib/demo/fixtures.ts`. Do przeniesienia na backend (baza + REST w `app/src/app/api/`):

- plany i przystanki → profil rodziny i sprawy (zamiast `fixtures.ts` i `created`);
- zmiany przystanków (`patches`) → zdarzenia sprawy;
- wartości wniosków (`forms`) → szkic sprawy, wysyłka przez prawdziwy kanał zamiast symulacji;
- terminy → `lib/rules` (część już jest od Juliana: `lib/rules/dates.ts`, `lib/rules/paternity.ts`);
- profil (`MyData`), konto ZUS, sprawa testowa (OCR: `lib/ocr` od Juliana).

Ekrany Zusika od Juliana: `/zusik` (urlop rodzicielski, czat z przypisami), `/zusik/kamil` (ZAM + odpis aktu). Panel Zusika w aplikacji linkuje do nich, dopóki nie będzie panelu bocznego.

## Przegląd funkcji (22.11, z kodu — bez przeklikania w przeglądarce)

Legenda: ✅ działa · 🟡 symulacja · ⛔ martwe/brak · ⚠️ do poprawy

**Onboarding `/start`**
- ✅ pytania zależne od sytuacji (planowanie, ciąża, urodzone, adopcja, piecza), „Dalej” wymagane, walidacja dat w kontekście, imiona per dziecko, plan per dziecko, wspólne sprawy rodzeństwa synchronizowane, „Dlaczego pytamy?” ze źródłami, wznowienie przerwanej rozmowy, dziecko z rejestru → „Otwórz plan”.
- 🟡 praca zaznaczona „z ZUS” (dane demo `features/family/profile/data.ts`).
- ⚠️ drugi rodzic nie dostaje spraw macierzyńskich — uproszczenie bez źródła (gov.pl: drugi rodzic może w części przypadków przejąć urlop macierzyński).
- ⚠️ odmiana imion heurystyczna (proste końcówki).

**Mój plan `/plan`**
- ✅ ścieżka (fala, podesty, Bąbelek, ruch po zamknięciu panelu), zwinięte etapy „za Tobą” + „Pokaż etap” (przewija do etapu), licznik etapu, widok listy, „Najbliższa sprawa”, Odhacz / Oznacz jako załatwione / Nie korzystam / Cofnij (zapis w przeglądarce).
- 🟡 dymek Bąbelka i „Dokończ z Zusikiem” → panel-zaślepka z linkami do ekranów Juliana.
- ⛔ przycisk ostrzeżenia w planie Oli z danych demo („Sprawdź, jak przystąpić”) — bez działania (w planach z onboardingu linkuje źródło).
- ⛔ brak wejścia do „Wsparcia” z planu (SPEC).
- Kalkulator — Julek.

**Dokumenty `/dokumenty`, `/dokumenty/[id]`**
- ✅ lista, filtry, pliki dziecka, cały wiersz klikalny, formularz → sprawdzenie → zatwierdzenie → przekazanie → wysłano, korekta, zapis wartości.
- 🟡 wysyłka i potwierdzenie wpływu (symulacja).
- ⚠️ pola formularzy bez źródeł przy polach („do weryfikacji”) — uzgodnić z Julkiem (PDF-y, ZAM).
- ⚠️ karta „Czy mam teraz coś zrobić?” — do dopracowania UI (pusta prawa strona, tagi „Symulacja”).

**Profil `/profil`**
- ✅ Moje dane (edycja w wierszu), plany: edycja nazwy/daty z przeliczeniem terminów, usuwanie (bez kłódki).
- ⛔ zmiana roli / zmiany pracy w „Moich danych” nie przebudowuje planu (dane z onboardingu są w `plan.origin` — do podpięcia).
- 🟡 konto ZUS i „Odśwież dane” — dane demo, nie z kalkulatora.
- 🟡 sprawa testowa — wynik na sztywno (OCR Juliana w `lib/ocr` — decyzja, czy podpinać).
- ⛔ brak przycisku „Wyczyść dane demo” (funkcja `resetAll` jest) — przyda się przed prezentacją.

**Powłoka**
- ✅ selektor dziecka (rodzeństwo, „dodane przez Ciebie”), dolny pasek, Bąbelek-przycisk.
- ⚠️ `/` przekierowuje teraz na `/app` (ekran Juliana) — ustalić z zespołem wejście do aplikacji (`/start` / `/plan` vs `/app`).
- ⚠️ dwie kopie maskotki: `components/mascot/*` (zespół) i `components/mascot/babelek/*` (nasza) — scalić.
- ⚠️ widok telefonu nie był sprawdzony wizualnie.

## Kolejne kroki (propozycja kolejności)

1. Przeklikanie z listą powyżej (komputer + telefon 390 px) — Maciej.
2. Przycisk „Wyczyść dane demo” w Profilu + scenariusz prezentacji (S).
3. Wejście do „Wsparcia” na „Moim planie” i w karcie sprawy (S).
4. Profil → zmiana roli / pracy przebudowuje plan z `plan.origin` (M).
5. Drugi rodzic: część urlopu macierzyńskiego jako sprawa warunkowa — tylko ze źródłem (M).
6. Martwe przyciski ostrzeżeń w danych demo → link do źródła albo Zusik (S).
7. Karta sprawy w Dokumentach — dopracowanie UI (M), po uzgodnieniu z Julianem, czy jego formularz/PDF zastąpi nasz.
8. Integracja: wejście `/app` vs nasze trasy, panel Zusika zamiast zaślepki, jedna maskotka (M, z zespołem).
9. Przegląd źródeł w pozostałych tekstach (`fixtures.ts` why/howTo/prepare, `forms.ts`, `wsparcie`) (M).
10. Dostępność i ograniczony ruch — przegląd (S).

## Kalkulator — co od Juliana da się użyć (sprawdzone w kodzie 22.11)

**Do użycia od razu (czyste funkcje, testy w `tests/`):**
1. `lib/marta/case.ts` → `applyMarta(null, { type: "compare", version: 0, firstStart, days, firstDaily, secondDaily, firstName, secondName, childName })`.
   Urlop rodzicielski dwojga rodziców w dwóch wariantach: `together` (oboje od tego samego dnia) i `sequential` (drugi rodzic dzień po pierwszym).
   Dla każdego rodzica: `from`, `to`, `deadline` = początek − 21 dni (Julian cytuje KP art. 182¹ᵈ § 1 z korpusu `kp-art182-1d-par1`), `amount` = stawka dzienna × dni.
   Walidacja zod: dni 1–143, stawki 0–100 000 zł; przy „confirm” limit `previousDays + 2 × days ≤ 287`, części ≤ 5. Dalej `choose` → `confirm` → `submit` (wersjonowanie, 409 przy nieaktualnej wersji).
   To samo liczy jego czat („Łączna kwota z kalkulatora…”), więc liczby w planie i w rozmowie będą zgodne.
   Serwerowo: `POST /api/zusik/marta` trzyma widok w sesji — można dzielić stan z czatem.
2. `lib/rules/paternity.ts` → `evaluatePaternity({ childBirthDate, insuranceConfirmed, noArrears, priorParts, request, today })`.
   Urlop ojcowski / zasiłek dla **osoby niebędącej pracownikiem** (działalność, dobrowolne chorobowe): 14 dni, max 2 części, do 12. miesiąca życia dziecka, termin ZAM, brakujące dane jako pytania, powody z `citationIds`.
3. `lib/rules/dates.ts` — daty (dodawanie, zakresy, formaty).

**Nie ma u Juliana (nie wolno tego „dopisać z głowy”):** wyliczenia kwoty zasiłku z podstawy (procenty 100/81,5/70, odliczenie składek), długości macierzyńskiego, puli rodzicielskiego na rodzica (tygodnie nieprzenoszalne). Przełącznik 81,5% / 100–70% w obecnym kalkulatorze (`features/calculator`) to tylko UI — nie liczy.

**Propozycja UI/UX (do uzgodnienia z Julkiem, właścicielem kalkulatora):**
- Na „Moim planie” sekcja „Urlop rodzicielski — jak się podzielić?”: data startu (podpowiedź: dzień po końcu macierzyńskiego z planu), liczba tygodni na rodzica, stawka dzienna każdego (z ZUS albo wpisana — jako „założenie”).
- Dwie karty wariantów „Razem” / „Po kolei”: pasek czasu z okresami obojga, „Wniosek do pracodawcy do: X” (termin −21 dni), kwota brutto każdego i suma; wybór wariantu → „Zapisz porównanie” (ten sam stan co czat Zusika).
- Termin wniosku trafia jako przystanek na ścieżkę („Złóż wniosek o rodzicielski do X”).
- Dla działalności: karta „Urlop ojcowski (ZAM)” z `evaluatePaternity` — pytania o brakujące dane, wynik z przypisami.

## Zrobione 22.11 (po przeglądzie)
- Profil: „Dane demonstracyjne → Zacznij od nowa” (z potwierdzeniem) — `features/family/profile/ResetDemo.tsx`.
- Wejście do „Wsparcia”: pod ścieżką na „Moim planie” i w panelu przystanku.
- Ostrzeżenie w planie Oli: link do źródła (zielonalinia.gov.pl), treść zgodna ze źródłem.
- „Wsparcie”: zdania o przepisach ze źródłami (uzupełniający urlop macierzyński, „Za życiem” 65/67 tyg.); usunięte zdania bez źródła i obietnice funkcji, których nie ma.

## Zrobione 22.11 (wieczór) — kalkulator i logowanie

- **Merge `origin/main`** (strona główna i logowanie Bartosza): połączone `globals.css` (nasze `@theme` + style `[data-site]`), krój Domine, zamiana `background`/`surface` z DESIGN.md bez zmiany wyglądu naszych widoków. Kolizja `Button.tsx`/`button.tsx` (macOS) → nasz przycisk to `components/ui/AppButton.tsx`.
- **Kalkulator** (`features/calculator/Calculator.tsx`, `lib/plan/leave-split.ts`): liczy wyłącznie `applyMarta` Juliana, walidacja jego schematem Zod. Dwa warianty (Razem / Po kolei), termin wniosku, kwota = stawka × dni. Wybór zapisany w `PlanProvider` (`splits`, wspólny dla rodzeństwa) i nałożony na przystanek „Urlop rodzicielski” (termin, notatka ze źródłem). Źródła sprawdzone na gov.pl „Urlop rodzicielski”: 21 dni, jednocześnie, 9 tyg. nieprzenoszalne. Niepotwierdzone (nie twierdzimy): że rodzicielski zaczyna się zaraz po macierzyńskim — data to podpowiedź.
- **Logowanie ↔ onboarding**: `features/family/LoginGate.tsx` (karty i `/start` wymagają sesji demo), podpowiedź pracy z ZUS tylko przy `data: "zus"`, rodzic z gotowym planem po logowaniu trafia na `/plan`, „Zacznij od nowa” wylogowuje i wraca na `/`. Profil demo zgodny ze SPEC.md i ekranem logowania (test `profile-consistency`).
- **Hydracja maskotki** (`components/mascot/details.tsx`): współrzędne ołówka zaokrąglone do 0,1.

Otwarte: PDF wniosku (`/api/zusik/marta/pdf` wymaga sesji serwera — TODO(julian)); stawki dzienne to założenie demo (brak reguły podstawy); kalkulator zakłada tę samą liczbę tygodni dla obojga (ograniczenie reguły); Profil przy „Wpisz dane samodzielnie” nadal pokazuje wiersze ZUS; karty `surface` vs biel — decyzja zespołu.
