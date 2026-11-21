// Placeholder data for the admin panel layout. Values are illustrative only:
// the real catalogue comes from lib/rules once it exists (SPEC-PANEL-ADMINISTRACYJNY.md §3).

export type RuleState = "Szkic" | "Zaplanowana" | "Obowiązuje" | "Historyczna";

export const PARAMETER_GROUPS = [
  "Stawki",
  "Wymiary",
  "Uzupełniający",
  "Chorobowy",
  "Kto wypłaca",
  "Podstawa",
  "Terminy",
  "Formularze",
] as const;

export type ParameterGroup = (typeof PARAMETER_GROUPS)[number];

export interface ParameterVersion {
  value: string;
  from: string;
  state: RuleState;
}

export interface Parameter {
  id: string;
  group: ParameterGroup;
  name: string;
  value: string;
  from: string;
  state: RuleState;
  source: string;
  usedIn: string;
  planned?: { value: string; from: string };
  history: ParameterVersion[];
}

export const PARAMETERS: Parameter[] = [
  {
    id: "rate-parental",
    group: "Stawki",
    name: "Zasiłek za okres urlopu rodzicielskiego",
    value: "70%",
    from: "2023-04-26",
    state: "Obowiązuje",
    source: "ZUS s. 9",
    usedIn: "Kalkulator, plan",
    planned: { value: "75%", from: "2027-01-01" },
    history: [
      { value: "75%", from: "2027-01-01", state: "Zaplanowana" },
      { value: "70%", from: "2023-04-26", state: "Obowiązuje" },
      { value: "60%", from: "2016-01-01", state: "Historyczna" },
    ],
  },
  {
    id: "rate-maternity",
    group: "Stawki",
    name: "Zasiłek za okres urlopu macierzyńskiego",
    value: "100%",
    from: "2016-01-01",
    state: "Obowiązuje",
    source: "ZUS s. 9",
    usedIn: "Kalkulator, plan",
    history: [{ value: "100%", from: "2016-01-01", state: "Obowiązuje" }],
  },
  {
    id: "rate-averaged",
    group: "Stawki",
    name: "Stawka uśredniona przy wniosku do 21 dni",
    value: "81,5%",
    from: "2023-04-26",
    state: "Obowiązuje",
    source: "ZUS s. 9, Zał.",
    usedIn: "Kalkulator, wariant wypłaty",
    history: [{ value: "81,5%", from: "2023-04-26", state: "Obowiązuje" }],
  },
  {
    id: "rate-sick-pregnancy",
    group: "Stawki",
    name: "Zasiłek chorobowy w ciąży",
    value: "100%",
    from: "2016-01-01",
    state: "Obowiązuje",
    source: "ZUS s. 4",
    usedIn: "Świadczenia w ciąży",
    history: [{ value: "100%", from: "2016-01-01", state: "Obowiązuje" }],
  },
  {
    id: "limit-maternity",
    group: "Wymiary",
    name: "Urlop macierzyński, jedno dziecko",
    value: "20 tyg.",
    from: "2016-01-01",
    state: "Obowiązuje",
    source: "ZUS s. 5, Zał.",
    usedIn: "Kalkulator, mapa",
    history: [{ value: "20 tyg.", from: "2016-01-01", state: "Obowiązuje" }],
  },
  {
    id: "limit-parental",
    group: "Wymiary",
    name: "Pula urlopu rodzicielskiego",
    value: "41 tyg.",
    from: "2023-04-26",
    state: "Obowiązuje",
    source: "ZUS s. 7",
    usedIn: "Kalkulator, podział opieki",
    history: [{ value: "41 tyg.", from: "2023-04-26", state: "Obowiązuje" }],
  },
  {
    id: "limit-parental-draft",
    group: "Wymiary",
    name: "Część nieprzenoszalna na rodzica",
    value: "10 tyg.",
    from: "—",
    state: "Szkic",
    source: "Kp art. 182¹ᵃ",
    usedIn: "Kalkulator, podział opieki",
    history: [
      { value: "10 tyg.", from: "—", state: "Szkic" },
      { value: "9 tyg.", from: "2023-04-26", state: "Obowiązuje" },
    ],
  },
  {
    id: "supp-threshold",
    group: "Uzupełniający",
    name: "Próg tygodnia ciąży dla dłuższego wymiaru",
    value: "28. tydzień",
    from: "2025-03-19",
    state: "Obowiązuje",
    source: "Zał., Kp art. 180²",
    usedIn: "Kalkulator, mapa",
    history: [{ value: "28. tydzień", from: "2025-03-19", state: "Obowiązuje" }],
  },
  {
    id: "supp-weight",
    group: "Uzupełniający",
    name: "Próg masy urodzeniowej",
    value: "1000 g",
    from: "2025-03-19",
    state: "Obowiązuje",
    source: "Zał.",
    usedIn: "Kalkulator",
    history: [{ value: "1000 g", from: "2025-03-19", state: "Obowiązuje" }],
  },
  {
    id: "sick-waiting",
    group: "Chorobowy",
    name: "Okres wyczekiwania, ubezpieczenie obowiązkowe",
    value: "30 dni",
    from: "2016-01-01",
    state: "Obowiązuje",
    source: "ZUS s. 3",
    usedIn: "Świadczenia w ciąży",
    history: [{ value: "30 dni", from: "2016-01-01", state: "Obowiązuje" }],
  },
  {
    id: "sick-period",
    group: "Chorobowy",
    name: "Okres zasiłkowy",
    value: "270 dni",
    from: "2016-01-01",
    state: "Obowiązuje",
    source: "ZUS s. 4, Zał.",
    usedIn: "Świadczenia w ciąży",
    history: [{ value: "270 dni", from: "2016-01-01", state: "Obowiązuje" }],
  },
  {
    id: "payer-threshold",
    group: "Kto wypłaca",
    name: "Próg płatnika uprawnionego do wypłaty",
    value: "20 ubezp.",
    from: "2016-01-01",
    state: "Obowiązuje",
    source: "ZUS s. 1",
    usedIn: "Plan, kierowanie wniosku",
    history: [{ value: "20 ubezp.", from: "2016-01-01", state: "Obowiązuje" }],
  },
  {
    id: "base-contrib",
    group: "Podstawa",
    name: "Pomniejszenie o składki społeczne",
    value: "13,71%",
    from: "2016-01-01",
    state: "Obowiązuje",
    source: "Zał.",
    usedIn: "Kalkulator",
    history: [{ value: "13,71%", from: "2016-01-01", state: "Obowiązuje" }],
  },
  {
    id: "base-min-wage",
    group: "Podstawa",
    name: "Płaca minimalna",
    value: "4 806 zł",
    from: "2026-01-01",
    state: "Obowiązuje",
    source: "Zał.",
    usedIn: "Kalkulator",
    planned: { value: "5 020 zł", from: "2027-01-01" },
    history: [
      { value: "5 020 zł", from: "2027-01-01", state: "Zaplanowana" },
      { value: "4 806 zł", from: "2026-01-01", state: "Obowiązuje" },
      { value: "4 666 zł", from: "2025-01-01", state: "Historyczna" },
    ],
  },
  {
    id: "deadline-averaged",
    group: "Terminy",
    name: "Wniosek matki o stawkę uśrednioną",
    value: "21 dni",
    from: "2023-04-26",
    state: "Obowiązuje",
    source: "ZUS s. 9",
    usedIn: "Plan, przypomnienie",
    history: [{ value: "21 dni", from: "2023-04-26", state: "Obowiązuje" }],
  },
  {
    id: "deadline-paternity",
    group: "Terminy",
    name: "Wniosek o urlop ojcowski",
    value: "7 dni",
    from: "2016-01-01",
    state: "Obowiązuje",
    source: "Kp art. 182³",
    usedIn: "Plan, przypomnienie",
    history: [{ value: "7 dni", from: "2016-01-01", state: "Obowiązuje" }],
  },
  {
    id: "form-zam",
    group: "Formularze",
    name: "ZAM obejmuje dawne ZUR i ZAO",
    value: "obowiązuje",
    from: "2026-10-24",
    state: "Obowiązuje",
    source: "ZUS s. 12",
    usedIn: "Dokumenty i wnioski",
    history: [{ value: "obowiązuje", from: "2026-10-24", state: "Obowiązuje" }],
  },
  {
    id: "form-z3b",
    group: "Formularze",
    name: "Z-3b",
    value: "zlikwidowany",
    from: "2026-10-24",
    state: "Obowiązuje",
    source: "ZUS s. 12",
    usedIn: "Dokumenty i wnioski",
    history: [
      { value: "zlikwidowany", from: "2026-10-24", state: "Obowiązuje" },
      { value: "obowiązuje", from: "2016-01-01", state: "Historyczna" },
    ],
  },
];

export type CaseStatus = "zgodna" | "niezgodna" | "brak-danych";

export interface TestCase {
  id: string;
  title: string;
  tag: string;
  status: CaseStatus;
  inputs: { label: string; value: string }[];
  expected: { label: string; value: string }[];
  result: { label: string; value: string }[];
  missing?: string;
}

export const TEST_CASES: TestCase[] = [
  {
    id: "S-01",
    title: "Rodzicielski, jedno dziecko",
    tag: "Przykład demo",
    status: "zgodna",
    inputs: [
      { label: "Podstawa dzienna", value: "200 zł" },
      { label: "Okres", value: "28 dni" },
      { label: "Ubezpieczenie", value: "obowiązkowe" },
    ],
    expected: [
      { label: "Stawka", value: "70%" },
      { label: "Kwota", value: "3 920 zł" },
    ],
    result: [
      { label: "Stawka", value: "70%" },
      { label: "Kwota", value: "3 920 zł" },
    ],
  },
  {
    id: "S-02",
    title: "Bliźnięta, wspólna pula",
    tag: "Wymiar",
    status: "zgodna",
    inputs: [
      { label: "Liczba dzieci", value: "2" },
      { label: "Urlop macierzyński", value: "31 tyg." },
    ],
    expected: [{ label: "Pula rodzicielskiego", value: "43 tyg." }],
    result: [{ label: "Pula rodzicielskiego", value: "43 tyg." }],
  },
  {
    id: "S-03",
    title: "Skrajny wcześniak",
    tag: "Uzupełniający",
    status: "niezgodna",
    inputs: [
      { label: "Tydzień ciąży", value: "26" },
      { label: "Pobyt w szpitalu", value: "9 tyg. 2 dni" },
    ],
    expected: [{ label: "Uzupełniający", value: "10 tyg." }],
    result: [{ label: "Uzupełniający", value: "9 tyg." }],
  },
  {
    id: "S-04",
    title: "Działalność, zadłużenie składkowe",
    tag: "Odmowa",
    status: "brak-danych",
    inputs: [
      { label: "Ubezpieczenie", value: "dobrowolne" },
      { label: "Zadłużenie", value: "—" },
    ],
    expected: [{ label: "Wynik", value: "brak prawa" }],
    result: [],
    missing: "Brakuje stanu zadłużenia składkowego na dzień powstania prawa.",
  },
  {
    id: "S-05",
    title: "Łączenie rodzicielskiego z pracą",
    tag: "Wymiar",
    status: "zgodna",
    inputs: [
      { label: "Wymiar pracy", value: "1/2 etatu" },
      { label: "Tygodnie łączenia", value: "16" },
    ],
    expected: [{ label: "Wydłużenie", value: "8 tyg." }],
    result: [{ label: "Wydłużenie", value: "8 tyg." }],
  },
  {
    id: "S-06",
    title: "Adopcja, dziecko 9 lat",
    tag: "Na warunkach macierzyńskiego",
    status: "zgodna",
    inputs: [
      { label: "Wiek dziecka", value: "9 lat" },
      { label: "Typ", value: "przysposobienie" },
    ],
    expected: [{ label: "Okres", value: "20 tyg." }],
    result: [{ label: "Okres", value: "20 tyg." }],
  },
  {
    id: "S-07",
    title: "Szósta część rodzicielskiego",
    tag: "Odmowa",
    status: "zgodna",
    inputs: [{ label: "Wykorzystane części", value: "5" }],
    expected: [{ label: "Wynik", value: "odmowa, limit 5 części" }],
    result: [{ label: "Wynik", value: "odmowa, limit 5 części" }],
  },
  {
    id: "S-08",
    title: "Za życiem, jedno dziecko",
    tag: "Wymiar",
    status: "brak-danych",
    inputs: [{ label: "Zaświadczenie", value: "—" }],
    expected: [{ label: "Pula rodzicielskiego", value: "65 tyg." }],
    result: [],
    missing: "Brakuje zaświadczenia „Za życiem”.",
  },
];

export interface HistoryEntry {
  id: string;
  publishedAt: string;
  parameter: string;
  group: ParameterGroup;
  oldValue: string;
  newValue: string;
  author: string;
  state: RuleState;
  from: string;
  reason: string;
  source: string;
  tests: string;
}

export const HISTORY: HistoryEntry[] = [
  {
    id: "H-05",
    publishedAt: "2026-11-20 14:12",
    parameter: "Zasiłek za okres urlopu rodzicielskiego",
    group: "Stawki",
    oldValue: "70%",
    newValue: "75%",
    author: "Konto demo",
    state: "Zaplanowana",
    from: "2027-01-01",
    reason: "Symulacja zmiany stawki na potrzeby demonstracji.",
    source: "Założenie demo",
    tests: "12 / 12 zgodnych",
  },
  {
    id: "H-04",
    publishedAt: "2026-11-18 09:40",
    parameter: "Płaca minimalna",
    group: "Podstawa",
    oldValue: "4 806 zł",
    newValue: "5 020 zł",
    author: "Konto demo",
    state: "Zaplanowana",
    from: "2027-01-01",
    reason: "Coroczna aktualizacja kwoty.",
    source: "Rozporządzenie RM",
    tests: "8 / 8 zgodnych",
  },
  {
    id: "H-03",
    publishedAt: "2026-10-23 16:05",
    parameter: "ZAM obejmuje dawne ZUR i ZAO",
    group: "Formularze",
    oldValue: "osobne formularze",
    newValue: "jeden formularz ZAM",
    author: "Konto demo",
    state: "Obowiązuje",
    from: "2026-10-24",
    reason: "Połączenie formularzy przez ZUS.",
    source: "ZUS s. 12",
    tests: "6 / 6 zgodnych",
  },
  {
    id: "H-02",
    publishedAt: "2026-10-23 16:01",
    parameter: "Z-3b",
    group: "Formularze",
    oldValue: "obowiązuje",
    newValue: "zlikwidowany",
    author: "Konto demo",
    state: "Obowiązuje",
    from: "2026-10-24",
    reason: "Likwidacja formularza.",
    source: "ZUS s. 12",
    tests: "6 / 6 zgodnych",
  },
  {
    id: "H-01",
    publishedAt: "2025-12-30 11:20",
    parameter: "Płaca minimalna",
    group: "Podstawa",
    oldValue: "4 666 zł",
    newValue: "4 806 zł",
    author: "Konto demo",
    state: "Obowiązuje",
    from: "2026-01-01",
    reason: "Coroczna aktualizacja kwoty.",
    source: "Rozporządzenie RM",
    tests: "8 / 8 zgodnych",
  },
];

export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : iso;
}
