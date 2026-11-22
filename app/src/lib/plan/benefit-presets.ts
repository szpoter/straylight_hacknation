/**
 * Przykładowe sprawy z zestawu ZUS do zadania (pkt f: „symulacja zasiłku przy uwzględnieniu
 * konkretnej sprawy z podanych w zestawach”). Tylko liczby potrzebne do wyliczenia i kwoty
 * z decyzji ZUS do porównania — bez danych osobowych. Testy: `tests/benefit-form.test.ts`.
 */
import type { ScenarioResult } from "@/lib/rules/maternity";
import { parentForm, type CalcForm } from "./benefit-form";

export type PresetCheck = { label: string; zus: number; pick: (r: ScenarioResult) => number | undefined };

export type BenefitPreset = {
  id: string;
  title: string;
  description: string;
  form: CalcForm;
  checks: PresetCheck[];
};

const common: Omit<CalcForm, "event" | "date" | "variant" | "A"> = {
  children: 1,
  zaZyciem: false,
  stillbirth: false,
  childBirthDate: "",
  schoolDeferred: false,
  hasB: false,
  B: parentForm("pracownik"),
  weeksBeforeBirth: 0,
  transferWeeks: 0,
  hospital: false,
  hospitalDays: 0,
  extremePreterm: false,
  supplementaryParent: "A",
  parentalWeeksA: 32,
  parentalWeeksB: 0,
  parentalOrder: "sequential",
  workA: 0,
  workB: 0,
  paternityDays: 0,
  paternityStart: "",
  pit2: false,
  pitExempt: false,
};

const segment = (periodId: string, month: string) => (r: ScenarioResult) => r.segments.find((s) => s.periodId === periodId && s.month === month)?.amount;
const daily = (periodId: string) => (r: ScenarioResult) => r.periods.find((p) => p.id === periodId)?.daily;

export const BENEFIT_PRESETS: BenefitPreset[] = [
  {
    id: "ol4",
    title: "Pracownica, 81,5% za cały okres",
    description: "Umowa o pracę krócej niż 12 miesięcy, poród 3.06.2026, wniosek o 81,5%, drugi rodzic nie korzysta z rodzicielskiego. Podstawa z decyzji ZUS.",
    form: { ...common, event: "birth", date: "2026-06-03", variant: "815", A: { ...parentForm("pracownik"), mode: "known", known: "5608,85" } },
    checks: [
      { label: "Stawka dzienna", zus: 152.37, pick: daily("mat-A") },
      { label: "Wypłata za czerwiec 2026 (28 dni)", zus: 4266.36, pick: segment("mat-A", "2026-06") },
      { label: "Wypłata za lipiec 2026 (31 dni)", zus: 4723.47, pick: segment("mat-A", "2026-07") },
      { label: "Rodzicielski, październik 2026 (11 dni)", zus: 1676.07, pick: segment("par-A", "2026-10") },
    ],
  },
  {
    id: "joanna1",
    title: "Działalność gospodarcza, 81,5%",
    description: "Przedsiębiorczyni, poród 20.09.2026, podstawa ustalona przy wcześniejszym zasiłku chorobowym (bez przerwy — ta sama podstawa).",
    form: { ...common, event: "birth", date: "2026-09-20", variant: "815", A: { ...parentForm("dzialalnosc"), fullTime: false, mode: "known", known: "4877,11" } },
    checks: [
      { label: "Stawka dzienna", zus: 132.49, pick: daily("mat-A") },
      { label: "Wypłata za wrzesień 2026 (11 dni)", zus: 1457.39, pick: segment("mat-A", "2026-09") },
      { label: "Wypłata za październik 2026 (31 dni)", zus: 4107.19, pick: segment("mat-A", "2026-10") },
    ],
  },
  {
    id: "pi2",
    title: "Pracownica z pensją poniżej minimalnej podstawy",
    description: "Pełny etat, przeciętne wynagrodzenie z zaświadczenia płatnika 3 707,67 zł — podstawa podniesiona do płacy minimalnej (4 300 zł od lipca 2024) − 13,71%. Poród 15.10.2024.",
    form: { ...common, event: "birth", date: "2024-10-15", variant: "100-70", A: { ...parentForm("pracownik", "3707,67"), fullTime: true } },
    checks: [
      { label: "Stawka dzienna", zus: 123.68, pick: daily("mat-A") },
      { label: "Podstawa wymiaru", zus: 3710.47, pick: (r) => r.segments.find((s) => s.periodId === "mat-A")?.basis },
    ],
  },
];
