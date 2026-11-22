# Kalkulator zasiłku macierzyńskiego — jak liczy

Kod: `app/src/lib/rules/maternity.ts` (reguła), `app/src/lib/plan/benefit-form.ts` (formularz, zapis w planie), `app/src/lib/plan/benefit-presets.ts` (sprawy ZUS), UI `app/src/features/calculator/`, strona `/kalkulator`, karta na „Moim planie”. Testy: `tests/maternity.test.ts`, `tests/benefit-form.test.ts`.

Źródła: materiały ZUS do zadania (ustawa zasiłkowa, Kodeks pracy, Poradnik 2026, załącznik o wymiarze i podstawie) oraz zus.pl / gov.pl. Wymagania: treść zadania s. 13, pkt b–f i j.

## Formuła

1. **Podstawa wymiaru** = przeciętne miesięczne wynagrodzenie brutto (pracownik) albo podstawa składki chorobowej (zlecenie, działalność) z 12 miesięcy kalendarzowych przed miesiącem porodu/przyjęcia × (1 − 13,71%), do grosza. Krócej ubezpieczony — średnia z pełnych miesięcy. Miesiące przepracowane w mniej niż połowie pomija się (UZ art. 36, 38, 48).
2. **Minimum (pełny etat, umowa o pracę)**: podstawa ≥ płaca minimalna × 86,29% (2026: 4 147,10 zł). Rośnie razem z płacą minimalną w trakcie zasiłku (UZ art. 45; potwierdza decyzja ZUS z 2024 r.).
3. **Limit (niepracownik, 2026)**: 20 321,30 zł (załącznik ZUS).
4. **Stawka dzienna** = podstawa × procent × (1 − część etatu w pracy) ÷ 30, do grosza (UZ art. 36 ust. 3, art. 31 ust. 4a).
5. **Wypłata** = stawka dzienna × liczba dni kalendarzowych (31-dniowy miesiąc = 31 dni).
6. **Procent**: macierzyński, na warunkach macierzyńskiego, uzupełniający, ojcowski — 100%; rodzicielski — 70%; po wniosku do 21 dni od porodu/przyjęcia — 81,5% za macierzyński + rodzicielski, z wyjątkiem 9 tygodni drugiego rodzica (zawsze 70%) (UZ art. 30a, 31).
7. **Podwyższenie do 1000 zł** (kwota świadczenia rodzicielskiego), gdy zasiłek miesięcznie niższy; część miesiąca proporcjonalnie; nie dotyczy urlopu ojcowskiego (UZ art. 31 ust. 3a–3c, zus.pl).
8. **Na rękę (szacunek)**: zaliczka PIT 12% (− 300 zł przy PIT-2), do pełnych złotych; ulga zwalniająca — 0.

## Wymiary

| | 1 dziecko | 2 | 3 | 4 | 5+ |
|---|---|---|---|---|---|
| Macierzyński / na warunkach | 20 tyg. | 31 | 33 | 35 | 37 |
| Rodzicielski (pula dla obojga) | 41 | 43 | 43 | 43 | 43 |
| Rodzicielski „Za życiem” | 65 | 67 | 67 | 67 | 67 |

- Każdy rodzic ma 9 tygodni rodzicielskiego wyłącznie dla siebie — jedno może wziąć najwyżej pula − 9 (32/34/56/58).
- Do 6 tygodni macierzyńskiego przed porodem; matka min. 14 tygodni po porodzie, resztę może przejąć drugi rodzic.
- Uzupełniający (wcześniak / szpital): tydzień za tydzień w szpitalu, niepełny w górę, max 15 tyg. (< 28. tyg. ciąży lub ≤ 1000 g) albo 8.
- Ojcowski: 14 dni, do 12. miesiąca życia dziecka, 100%.
- Adopcja do 14. roku życia, rodzina zastępcza do 7. (10. przy odroczeniu); na warunkach macierzyńskiego min. 9 tyg.
- Łączenie z pracą (do ½ etatu): urlop dłuższy proporcjonalnie (½ etatu — 2 razy), zasiłek niższy o część etatu; limit 82/86 (130/134 „Za życiem”) tygodni.

## Przypadki obsłużone w kalkulatorze

Urodzenie, adopcja, rodzina zastępcza · 1–5+ dzieci · „Za życiem” · wcześniak/szpital · martwe urodzenie (8 tyg., 100%) · oboje rodzice (przejęcie macierzyńskiego, rodzicielski po kolei albo razem, ojcowski) · drugi rodzic nieubezpieczony · praca na ¼ lub ½ etatu · umowa o pracę, zlecenie, działalność · podstawa: średnia, 12 miesięcy z tabeli albo znana z decyzji/Z-3 · wariant 81,5% vs 100/70 z porównaniem · terminy wniosków · wypłaty miesiąc po miesiącu · zapis w planie (terminy na ścieżce).

## Zgodność z decyzjami ZUS (zestaw spraw)

| Sprawa | Co sprawdzamy | Wynik |
|---|---|---|
| Pracownica, 81,5% | stawka 152,37; czerwiec 4 266,36; lipiec 4 723,47; październik 3 047,40 + 1 676,07 | zgodne co do grosza |
| Działalność, 81,5% | stawka 132,49; 11 dni 1 457,39; 31 dni 4 107,19 | zgodne |
| Pracownica poniżej minimum | podstawa 3 660,42 → 3 710,47 od lipca 2024; stawka 123,68 | zgodne |
| Ojciec, działalność, 9 tyg. 70% | 12 podstaw składek → 4 344,11; stawka 101,36; 31 dni 3 142,16; PIT 377 | zgodne (test) |
| Ojciec, 9 tyg. 70% | stawka 96,23; 30 dni 2 886,90; 11 dni 1 058,53 | zgodne (test) |

## Do weryfikacji (materiały nie rozstrzygają — w UI „Do weryfikacji”)

- Podwyższenie do 1000 zł: ustawa porównuje kwotę zasiłku, zus.pl — kwotę po zaliczce PIT. Liczymy od brutto.
- 81,5% za przejętą przez ojca część macierzyńskiego i za jego tygodnie ponad 9.
- Skrócenie urlopu na warunkach macierzyńskiego przy dziecku blisko limitu wieku (min. 9 tyg.).
- Łączenie z pracą dla niepracowników.
- Nieobsłużone: kilka tytułów ubezpieczenia naraz, premie kwartalne/roczne osobno, uzupełnianie niepełnych miesięcy składnikami stałymi, zgon dziecka po porodzie (min. 7 dni od zgonu), wyrównanie do 100% przy niewykorzystaniu rodzicielskiego w 1. roku.

Parametry (stawki, wymiary, 13,71%, 1000 zł, limity) są w `MATERNITY_PARAMETERS` — gotowe do podpięcia w panelu administracyjnym (TODO dla panelu: dodać je do `RULE_PARAMETERS`).
