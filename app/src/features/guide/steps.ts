/**
 * Treść przewodnika „Jak to działa?” po kartach rodzica. Każdy krok wskazuje element przez
 * atrybut `data-tour` (bez `target` — karta na środku ekranu). Kroki, których elementu nie ma
 * albo nie widać (np. inny widok, telefon zamiast komputera), przewodnik pomija.
 *
 * Teksty opisują obsługę aplikacji, a nie przepisy. Fakty o świadczeniach podaje sama aplikacja
 * ze źródłami, więc tu ich nie powtarzamy.
 */
export type GuideStep = { target?: string; title: string; body: string };

const ZUSIK: GuideStep = {
  target: "zusik",
  title: "Zusik odpowie na pytania",
  body: "Kliknij Bąbelka, żeby zapytać o to, co widzisz na ekranie. Zusik wie, w której sprawie jesteś, i podaje źródło każdej odpowiedzi.",
};

const NAV: GuideStep = {
  target: "nav",
  title: "Cztery karty",
  body: "Mój plan, Kalkulator, Dokumenty i Profil. Liczba przy Dokumentach to sprawy, które czekają na Ciebie. Przycisk „Jak to działa?” u góry wyjaśnia każdą kartę.",
};

const PLAN: GuideStep[] = [
  {
    title: "Twój plan krok po kroku",
    body: "Zusik układa wszystkie sprawy związane z dzieckiem w jedną ścieżkę: od ciąży po pierwsze lata. Pokażemy, gdzie co jest i jak z tego korzystać.",
  },
  {
    target: "child",
    title: "Plan dla każdego dziecka",
    body: "Tu przełączasz dziecko. Ścieżka, dokumenty i kalkulator zmieniają się razem z wyborem.",
  },
  {
    target: "path",
    title: "Ścieżka, czyli oś czasu",
    body: "Każde pole to jedna sprawa: wniosek, wizyta albo decyzja. Bąbelek stoi tam, gdzie jesteś teraz. Kliknij pole, żeby zobaczyć, co trzeba zrobić i do kiedy.",
  },
  {
    target: "path-view",
    title: "Ścieżka albo lista",
    body: "Wolisz zwykłą listę? Przełącz widok. Sprawy są te same, pogrupowane według etapów.",
  },
  {
    target: "nearest",
    title: "Najbliższa sprawa",
    body: "Pod ścieżką zawsze widać jedną rzecz do zrobienia teraz, z terminem i przyciskiem, który prowadzi prosto do wniosku.",
  },
  {
    target: "plan-calculator",
    title: "Ile i na jak długo",
    body: "Krótki kalkulator pokazuje kwoty i okresy urlopu dla Twojego planu. Pełną wersję znajdziesz w karcie Kalkulator.",
  },
  {
    target: "support",
    title: "Gdy jest trudniej",
    body: "Strata, wcześniak, choroba dziecka: tu znajdziesz organizacje, które pomagają, i sprawy formalne, które mogą poczekać.",
  },
  NAV,
];

const CALCULATOR: GuideStep[] = [
  {
    title: "Kalkulator zasiłku",
    body: "Policzysz, ile czasu i pieniędzy przysługuje Tobie i drugiemu rodzicowi. Wynik zmienia się od razu, gdy zmieniasz dane.",
  },
  {
    target: "calc-start",
    title: "Zacznij od gotowych danych",
    body: "„Mój plan” wczytuje daty z Twojego planu. Przykładowe sprawy ZUS pokazują, jak kalkulator radzi sobie z prawdziwymi przypadkami.",
  },
  {
    target: "calc-situation",
    title: "Twoja sytuacja",
    body: "Data porodu lub przyjęcia dziecka i to, kto z rodziców jest ubezpieczony. Od tego zależy długość urlopów. Jeśli czegoś brakuje, pole podpowie, co uzupełnić.",
  },
  {
    target: "calc-basis",
    title: "Podstawa zasiłku",
    body: "Wpisz zarobki z ostatnich 12 miesięcy. Kalkulator sam policzy podstawę, osobno dla każdego rodzica.",
  },
  {
    target: "calc-split",
    title: "Podział urlopu",
    body: "Zmieniaj tygodnie urlopu dla każdego z rodziców. Wynik i oś czasu przeliczają się od razu.",
  },
  {
    target: "calc-result",
    title: "Wynik",
    body: "Łączna kwota brutto i szacunek na rękę. Przyciskiem „Zapisz w planie” przeniesiesz wynik i terminy do swojego planu.",
  },
  {
    target: "calc-timeline",
    title: "Oś czasu jak w kalendarzu",
    body: "Kolejne okresy urlopu na jednym pasku: od kiedy do kiedy, kto jest na urlopie i ile dostaje.",
  },
  {
    target: "calc-deadlines",
    title: "Terminy wniosków",
    body: "Daty, do których trzeba złożyć wnioski, żeby nic nie przepadło. Po zapisaniu w planie pojawią się na ścieżce.",
  },
  {
    target: "calc-how",
    title: "Skąd ta kwota",
    body: "Rozwiń, żeby zobaczyć rachunek krok po kroku: podstawę, stawkę dzienną i wypłatę za każdy okres.",
  },
  ZUSIK,
];

const DOCUMENTS: GuideStep[] = [
  {
    title: "Dokumenty i wnioski",
    body: "Wszystkie wnioski z planu w jednym miejscu. Widzisz, co trzeba złożyć, co już wysłane i jak odpowiedział urząd.",
  },
  {
    target: "summons",
    title: "Pilne pismo",
    body: "Gdy urząd czegoś od Ciebie chce, wezwanie pojawia się na górze, z terminem odpowiedzi.",
  },
  {
    target: "doc-tabs",
    title: "Sprawy i pliki",
    body: "„Sprawy” to wnioski. „Pliki dziecka” to wszystkie wysłane dokumenty i decyzje. Filtry pod spodem zawężają listę według statusu.",
  },
  {
    target: "doc-cases",
    title: "Jedna sprawa, jeden wiersz",
    body: "Przy każdej sprawie jest status i następny krok. Kliknij, żeby wypełnić wniosek albo zobaczyć jego przebieg.",
  },
  ZUSIK,
];

const CASE: GuideStep[] = [
  {
    title: "Sprawa krok po kroku",
    body: "Na tej stronie wypełnisz wniosek, pobierzesz go jako PDF i śledzisz, co się z nim dzieje. Wysyłka do urzędu to na razie symulacja.",
  },
  {
    target: "case-now",
    title: "Czy mam teraz coś zrobić?",
    body: "Najważniejsza odpowiedź na górze: co zrobić teraz, do kiedy i jednym przyciskiem dalej.",
  },
  {
    target: "case-howto",
    title: "Jak złożyć",
    body: "Co złożyć, do kogo, do kiedy i jakie załączniki dołączyć. Wszystko w czterech wierszach.",
  },
  {
    target: "case-form",
    title: "Wypełnianie wniosku",
    body: "Część pól uzupełniamy z Twojego planu i profilu. Zapisujemy na bieżąco, więc możesz przerwać i wrócić. Nie wiesz, co wpisać? Zapytaj Zusika.",
  },
  {
    target: "case-pdf",
    title: "Wniosek jako PDF",
    body: "PDF powstaje w Twojej przeglądarce z wpisanych danych. Możesz go pobrać, wydrukować i złożyć osobiście. Niepełny wniosek ma znak „Szkic”.",
  },
  {
    target: "case-check",
    title: "Sprawdź przed wysłaniem",
    body: "Wszystkie odpowiedzi na jednej stronie. Kliknij „Zmień” przy polu, żeby je poprawić.",
  },
  {
    target: "case-send",
    title: "Wybierz, jak przekazać",
    body: "Przez PUE/eZUS, do pracodawcy, e-mailem jako PDF albo przez ePUAP, zależnie od wniosku. Przy każdej drodze widać, jakie potwierdzenie dostaniesz.",
  },
  {
    target: "case-timeline",
    title: "Przebieg sprawy",
    body: "Oś czasu od wysłania do decyzji: kiedy wniosek wpłynął, na jakim etapie jest i czego się spodziewać dalej.",
  },
  {
    target: "case-source",
    title: "Źródło",
    body: "Każda sprawa ma odnośnik do oficjalnej strony, z której pochodzą informacje.",
  },
  ZUSIK,
];

const PROFILE: GuideStep[] = [
  {
    title: "Profil rodziny",
    body: "Tu są dane, z których Zusik wypełnia wnioski, i lista planów dla dzieci.",
  },
  {
    target: "profile-data",
    title: "Twoje dane",
    body: "Dane, z których korzysta plan. Przy każdym widać, skąd pochodzi. Te, które możesz zmienić, mają przycisk „Zmień”.",
  },
  {
    target: "profile-plans",
    title: "Dzieci i plany",
    body: "Każde dziecko i każda ciąża ma swój plan. Po zmianie daty terminy wszystkich spraw w planie przeliczą się same.",
  },
  {
    target: "profile-zus",
    title: "Konto w ZUS",
    body: "Podgląd danych z ZUS: ubezpieczenia, podstawa zasiłku, zwolnienia. Tylko do odczytu, w tej wersji to symulacja eZUS.",
  },
  {
    target: "profile-test",
    title: "Sprawa testowa",
    body: "Przejdź przez fikcyjny przykład albo pozwól Zusikowi odczytać Twój plik PDF, bez łączenia z Twoimi danymi.",
  },
  {
    target: "profile-reset",
    title: "Zacznij od nowa",
    body: "Postęp i wpisane wnioski są zapisane tylko w tej przeglądarce. Ten przycisk je usuwa i zaczyna wersję demo od nowa.",
  },
  ZUSIK,
];

const SUPPORT: GuideStep[] = [
  {
    title: "Wsparcie",
    body: "Organizacje, które pomagają rodzicom w trudnych sytuacjach. Nie musisz niczego załatwiać od razu: sprawy formalne mogą poczekać.",
  },
  {
    target: "support-situations",
    title: "Wybierz swoją sytuację",
    body: "Kliknij to, co Cię dotyczy, a strona przewinie się do właściwej części.",
  },
  {
    target: "support-first",
    title: "Kto może pomóc",
    body: "Przy każdej organizacji jest opis pomocy, dla kogo jest i czy jest bezpłatna. „Strona organizacji” otwiera się w nowej karcie.",
  },
  {
    target: "support-formal",
    title: "Sprawy formalne",
    body: "Krótka lista tego, co trzeba będzie załatwić, z odnośnikiem do źródła. Możesz wrócić do niej później.",
  },
  ZUSIK,
];

const TEST_CASE: GuideStep[] = [
  {
    title: "Sprawa testowa",
    body: "Bezpieczne miejsce do ćwiczeń. Wszystko dzieje się na fikcyjnych danych i nie zmienia Twojego planu.",
  },
  {
    target: "test-steps",
    title: "Trzy kroki",
    body: "Pasek pokazuje, gdzie jesteś. Do zakończonych kroków możesz wrócić kliknięciem.",
  },
  {
    target: "test-example",
    title: "Przykład Alicji T.",
    body: "Sprawdzisz pola wniosku wypełnione na fikcyjnych danych, a jedno uzupełnisz samodzielnie. Na końcu otworzysz gotowy plan przykładu.",
  },
  {
    target: "test-pdf",
    title: "Odczyt pliku PDF",
    body: "Wybierz rodzaj dokumentu, dodaj plik w czacie i zobacz, jakie dane Zusik z niego odczytał.",
  },
  ZUSIK,
];

/** Kroki dla bieżącej trasy; pusta lista = przewodnik niedostępny na tej stronie. */
export function stepsFor(pathname: string): GuideStep[] {
  if (pathname === "/plan") return PLAN;
  if (pathname === "/kalkulator") return CALCULATOR;
  if (pathname === "/dokumenty") return DOCUMENTS;
  if (pathname.startsWith("/dokumenty/")) return CASE;
  if (pathname === "/profil") return PROFILE;
  if (pathname === "/profil/sprawa-testowa") return TEST_CASE;
  if (pathname === "/wsparcie") return SUPPORT;
  return [];
}
