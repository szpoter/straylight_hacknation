// Values written down in SPEC-PANEL-ADMINISTRACYJNY.md §3 that the parent application does not compute yet,
// plus illustrative change history. Values the application already applies come from lib/admin/catalog.ts.

import type { HistoryEntry, Parameter } from "@/lib/admin/types";

export {
  PARAMETER_GROUPS,
  type CaseStatus,
  type HistoryEntry,
  type Parameter,
  type ParameterGroup,
  type ParameterVersion,
  type RuleState,
  type TestCase,
} from "@/lib/admin/types";

const SPEC_VALUES: Omit<Parameter, "origin">[] = [
  {
    id: "supp-threshold",
    lawId: "kp-1802-1",
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
    lawId: "kp-1802-1",
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
    lawId: "uz-4-1",
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
    lawId: "uz-8-1",
    group: "Chorobowy",
    name: "Okres zasiłkowy w ciąży",
    value: "270 dni",
    from: "2016-01-01",
    state: "Obowiązuje",
    source: "ZUS s. 4, Zał.",
    usedIn: "Świadczenia w ciąży",
    history: [{ value: "270 dni", from: "2016-01-01", state: "Obowiązuje" }],
  },
  {
    id: "deadline-paternity",
    lawId: "kp-1823-2",
    group: "Terminy",
    name: "Wniosek o urlop ojcowski",
    value: "7 dni",
    from: "2016-01-01",
    state: "Obowiązuje",
    source: "Kp art. 182³",
    usedIn: "Plan, przypomnienie",
    history: [{ value: "7 dni", from: "2016-01-01", state: "Obowiązuje" }],
  },
];

export const SPEC_PARAMETERS: Parameter[] = SPEC_VALUES.map((p) => ({ ...p, origin: "spec" }));

/** Illustrative entries shown after the publications of the session (SPEC §8). */
const SAMPLE_HISTORY: HistoryEntry[] = [
  {
    id: "H-05",
    parameterId: "app-rate-parental",
    scope: "Wszystkie sprawy tego świadczenia",
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
    tests: "6 / 6 zgodnych",
  },
  {
    id: "H-04",
    parameterId: "app-wage-minimum",
    scope: "Wszystkie sprawy tego świadczenia",
    publishedAt: "2026-11-18 09:40",
    parameter: "Płaca minimalna",
    group: "Podstawa",
    oldValue: "4 806 zł",
    newValue: "4 950 zł",
    author: "Konto demo",
    state: "Zaplanowana",
    from: "2027-01-01",
    reason: "Coroczna aktualizacja kwoty.",
    source: "Rozporządzenie RM z 14.09.2026, Dz.U. 2026 poz. 1213",
    tests: "5 / 5 zgodnych",
  },
  {
    id: "H-03",
    parameterId: "app-form-ZUR",
    scope: "Wszystkie sprawy tego świadczenia",
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
    tests: "3 / 3 zgodnych",
  },
  {
    id: "H-02",
    parameterId: "app-form-Z3b",
    scope: "Wszystkie sprawy tego świadczenia",
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
    tests: "3 / 3 zgodnych",
  },
  {
    id: "H-01",
    parameterId: "app-wage-minimum",
    scope: "Wszystkie sprawy tego świadczenia",
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
    tests: "5 / 5 zgodnych",
  },
];

export const HISTORY: HistoryEntry[] = SAMPLE_HISTORY.map((h) => ({ ...h, sample: true }));

export function formatDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : iso;
}

export function formatDateTime(value: string): string {
  const time = /\d{2}:\d{2}$/.exec(value)?.[0];
  return time ? `${formatDate(value)}, ${time}` : formatDate(value);
}
