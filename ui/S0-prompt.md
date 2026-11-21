# S0 · Plansza kontrolek · runda 1

Zbuduj w Claude Design jedną responsywną, interaktywną planszę kontrolek „Przewodnika Rodzica” po zalogowaniu. Przygotuj dwa widoki tego samego zestawu, 375 i 1280 px. Ten zestaw ma być wspólny dla kolejnych scen. Referencjami są linki z części F. Gdy podgląd wymaga logowania lub JavaScriptu, zastosuj przypisany do niego opis Macieja. Nie potrzebujesz zrzutów.

## A. Cel

Rodzic najpierw widzi pytanie, rozpoznaje, czy zaznaczył odpowiedź, i wie, kiedy może wybrać „Dalej”. Kolejne grupy pokazują, skąd pochodzi wartość, na którym polu planu jest Ola i która sprawa wymaga działania. Nazwy grup i stanów umieść jako adnotacje planszy poza próbkami interfejsu.

## B. Telefon · 375 px

Jedna kolumna, marginesy 15 px. Od góry pokaż próbki w kolejności: pytanie i data, wiersze danych, nawigacja i ścieżka, karta puli, pilne wezwanie i karta sprawy. Karty odpowiedzi zajmują pełną szerokość. W próbce pytania „Dalej” trzyma się dołu jej widoku, także nad klawiaturą. W próbce daty pod akcją jest „Uzupełnię później”. W próbce planu selektor jest u góry, trzy podpisane karty nawigacji u dołu. Pomiędzy nimi jest miejsce na pionową ścieżkę. Przyklejony baner, dolny pasek i „↑ Teraz” należą do podglądu planu i nie zasłaniają sąsiednich próbek.

## C. Desktop · 1280 px

Zachowaj kolejność grup, wyśrodkuj treść w kontenerze 988 px. W próbce pytania użyj najbliższego kontenera do uzgodnionych około 640 px (583 px, do weryfikacji). Pokaż karty po 2–3 w rzędzie, a „Dalej” pod nimi po prawej. W próbce planu umieść selektor i trzy zakładki w górnym pasku, z licznikiem „Do załatwienia” przy dokumentach. Ścieżka biegnie poziomo, podpisy są przy węzłach. Tylko obszar ścieżki może przewijać się w poziomie. Na końcu pokaż sprawę w jednym wierszu. Na tablecie 768–1079 px obowiązuje górna nawigacja i kolumna pytania jak na desktopie. Sprawdź 375, 768, 1079 i 1280 px bez poziomego przewijania strony.

## D–E. Teksty, stany i zachowanie

1. **Wybór i data.** Mały Zusik z oznaczeniem „AI”, dymek „Dla kogo układamy plan?”, „Dlaczego pytamy?”, pięć odpowiedzi: „Planuję rodzicielstwo”, „Spodziewamy się dziecka”, „Dziecko jest już z nami”, „Adopcja”, „Rodzina zastępcza”. Pokazuj wybór pojedynczy. Początkowo „Dalej” jest nieaktywne. Wybranie całej karty nadaje jej ptaszek, obrys i tło oraz uaktywnia „Dalej”. Pokaż też pytanie „Kiedy urodziło się dziecko?” i pola numeryczne z widocznymi etykietami „Dzień”, „Miesiąc”, „Rok”. Próbki daty: pusta, 10 / 11 / 2026 oraz 31 / 02 / 2026 z błędem tuż przy polu. Do czasu zatwierdzenia treści błędu pokaż tam „[DO USTALENIA: komunikat dla nieistniejącej daty]”. To adnotacja tekstowa, poza polem. Pokaż fokus również przy błędzie. Przy mobilnej karcie zachowaj pełną szerokość i cel dotykowy. Kompaktową wysokość dla pięciu opcji oznacz „do weryfikacji”.
2. **Wartość i źródło.** Wiersz w kolejności etykieta → wartość → źródło → dostępna akcja. Pokaż „Rejestr” przy dacie urodzenia Oli i „ZUS · symulacja” przy danych z ZUS. Obie wartości mają kłódkę i informację dla czytnika o źródle oraz braku edycji. Przy „Podane przez Ciebie” pokaż „Zmień”. „Założenie do symulacji” występuje tylko w próbce kalkulatora. Pokaż „AI” przy wypowiedzi Zusika i odczycie dokumentu, „Test” przy sprawie testowej, „Przykład” przy planie przykładowym.
3. **Nawigacja i ścieżka.** „Ola ▾” z drugim wierszem „Urodzona 10 listopada”. Nawigacja „Mój plan”, „Dokumenty i wnioski”, „Profil rodziny”. Na telefonie ikona i pełny podpis aktywnej oraz pozostałych pozycji. Baner „Etap 3 · Narodziny · 2 sprawy do zrobienia” z przyciskiem „Lista”. Węzły pokazują osobno sześć stanów: załatwiony (ptaszek), pionek Zusika, następny (wyróżnienie), przyszły (obrys, można otworzyć), odhaczona „Informacja” (wyciszony ptaszek) i ostrzeżenie (symbol i tekst). Dodaj parę równoległą z „i” pośrodku. Pionek czeka na obie sprawy. Przy pionku dymek „Następny krok: Zgłoś urodzenie Oli · do 1 grudnia”, a przy najbliższej sprawie „Urząd stanu cywilnego” i „do 1 grudnia 2026”. Pionek jest wejściem do czatu na „Moim planie”. „Lista” pokazuje te same przystanki, w tej samej kolejności. „↑ Teraz” pojawia się po zniknięciu pionka z widoku i przewija do niego.
4. **Statusy.** Odróżnij wygląd węzła od stanu sprawy. Na ścieżce używaj „Przed Tobą”, „Do zrobienia”, „W trakcie”, „Wysłane”, „Wymaga uwagi”, „Załatwione”. Ten sam szkic ma na ścieżce „W trakcie”, a w dokumentach grupę „Do załatwienia” i etykietę „Szkic”. Wezwanie ma na ścieżce „Wymaga uwagi”, a w dokumentach grupę „Do załatwienia” i etykietę „Do uzupełnienia po wezwaniu”. Nazwę, skrót statusu i znany termin można przeczytać bez klikania węzła.
5. **Karta puli.** Zbuduj jeden komponent z trzema alternatywnymi nagłówkami: „Zostało 12 tyg. do zaplanowania”, „Wszystkie tygodnie w planie”, „2 tyg. za dużo”. Rozwinięcie rozróżnia pulę każdej osoby i część wspólną. W stanie przekroczenia nagłówek kieruje do odcinka z błędem. Nie sumuj wariantów. Jeśli pokazujesz stawki demonstracyjne, pierwsza osoba ma 140 zł brutto dziennie, druga 105 zł brutto dziennie.
6. **Pilne wezwanie i sprawa.** Nad próbką listy pasek „Nowe pismo z ZUS · termin do 5 grudnia · Otwórz wezwanie”, z klikalnym „Otwórz wezwanie”. Poniżej osobna sprawa: „Urlop ojcowski” → „Szkic” → „Do pracodawcy” → „Brakuje daty rozpoczęcia” → „Dokończ z Zusikiem”. Na desktopie wiersz, na telefonie karta z identyczną treścią i kolejnością. Akcja wiersza jest drugorzędna.
7. **Próbki bazowe.** Użyj tych samych przycisków, linków, pól, kart, etykiet, paneli, zakładek i komunikatów we wszystkich grupach. Pozwól obejrzeć stan domyślny, najechanie, naciśnięcie i fokus przycisku, a przy wyborze także stan zaznaczony i nieaktywne „Dalej”. Pokazuj warianty jako stany tej samej kontrolki. Jedna główna akcja na sekcję, najwyżej jeden aktywny primary widoczny naraz.

## F. Referencje przypisane przez Macieja

Każdy adres dotyczy wyłącznie wskazanego elementu. Teksty, kolorystyka i postać pochodzą z Przewodnika.

- Pytanie, dymek i miejsce „Dalej” — [Duolingo, onboarding](https://screensdesign.com/explore/apps/duolingo/onboarding/). Ptaszek wyboru i nieaktywna akcja — [Finch](https://lazyweb.com/canvas/flows/finch/onboarding). Położenie linku pomocniczego pod akcją — [Wonder Weeks](https://screensdesign.com/showcase/the-wonder-weeks-baby-leaps).
- Trzy krótkie pola jednej daty — [Huckleberry](https://lazyweb.com/canvas/flows/huckleberry/onboarding). Etykiety części daty i błąd powiązany z grupą — [GOV.UK Date input](https://design-system.service.gov.uk/components/date-input/).
- Kolejność etykiety, wartości i „Zmień” — [GOV.UK Summary list](https://design-system.service.gov.uk/components/summary-list/). Plakietkę źródła i kłódkę zbuduj według części D–E pkt 2. Maciej nie wskazał dla nich osobnej referencji.
- Dwa wiersze selektora i chevron — [shadcn sidebar-07](https://ui.shadcn.com/view/new-york-v4/sidebar-07). Zakładka z licznikiem — [Primer UnderlineNav](https://primer.style/product/components/underline-nav/). Ikona, podpis i aktywna pozycja dolnego paska — [Material 3 Navigation bar](https://m3.material.io/components/navigation-bar/overview).
- Pionowa ścieżka, baner i powrót do bieżącego pola — [Duolingo](https://blog.duolingo.com/new-duolingo-home-screen-design/). Poziome łuki — [amCharts](https://www.amcharts.com/demos/horizontal-serpentine-timeline/). Podpisy obok przystanku — [shadcn.io Road Trip](https://www.shadcn.io/blocks/features-road-trip-milestone-path). Dwa kroki połączone słowem „i” — [GOV.UK Step by step](https://www.gov.uk/learn-to-drive-a-car). „↑ Teraz” wykonaj według opisu w pkt 3.
- Trzy stany tej samej karty puli — [NAV, przykład stanu z pozostałym czasem](https://navikt.github.io/foreldrepengesoknad/@navikt/fp-uttaksplan/iframe.html?id=kvoteoppsummering--begge-rett-mor-ledige-dager).
- Wiersz sprawy z tekstowym statusem — [GOV.UK Complete multiple tasks](https://design-system.service.gov.uk/patterns/complete-multiple-tasks/). Pilny komunikat nad listą — [GOV.UK Notification banner](https://design-system.service.gov.uk/components/notification-banner/).

## G. Wygląd i dostępność

Stosuj dołączony blok tokenów z design/tokeny.md §9. Z design/komponenty.md obowiązują „Przyciski”, „Link w tekście”, „Karta wyboru”, „Pole formularza”, „Komunikat statusu” i „Komponenty złożone”. Z design/layout.md obowiązują „Siatka i kontenery”, „Rytm pionowy” i „Zachowanie responsywne”. Widoki po zalogowaniu korzystają ze skali app, Nunito i zaokrągleń radius-lg. W akapitach użyj text-primary. Główna akcja ma ciemny napis na zielonym tle, twardą dolną krawędź i pełną etykietę ze specyfikacji. Wersaliki etykiety przycisku realizuj stylem. Przy naciśnięciu krawędź znika natychmiast, bez przesuwania sąsiednich kontrolek. Nową kontrolkę złożoną z tokenów oznacz w kodzie „nowy komponent: do weryfikacji”. Brakujący token zastąp najbliższym istniejącym i wypisz jego zastosowanie w uwagach.

Zastosuj design/zasady-agenta.md §3. Fokus zgodny z kolejnością czytania i widoczny również na błędzie. Karty wyboru tworzą grupę radio obsługiwaną strzałkami i spacją. Pola mają widoczne etykiety, a błąd aria-invalid i aria-describedby. Cele dotykowe mają co najmniej rozmiar kontrolki (50 px), tekst spełnia AA. Przy pionku, dymkach i próbce wyróżnienia zmienionego pola pokaż stan końcowy i zostaw odpowiednio TODO(motion) w kodzie. Obsłuż prefers-reduced-motion zgodnie z design/motion.md §4.

## H. Granice i wynik

Zakończ na planszy S0. Dzień demonstracji to 21 listopada 2026, Ola urodziła się 10 listopada 2026. Używaj wyłącznie fikcyjnych danych. Pomiń treści PDF-ów spraw ZUS, cudze logo i ilustracje, punkty, gwiazdki, serie, blokady przyszłych przystanków, gradienty, rozmyte cienie i transition na stanach. W oznaczonych lukach pokaż „[DO USTALENIA: …]” poza polem formularza. Oddaj klikalny podgląd lub eksport HTML oraz krótką listę miejsc do weryfikacji. Oddziel wyniki rzeczywiście wykonanych kontroli od tych, które czekają na odbiór.

## Tokeny do użycia w artefakcie
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
