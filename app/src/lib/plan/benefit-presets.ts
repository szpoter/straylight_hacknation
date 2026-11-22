/**
 * Przykładowe sprawy z zestawu ZUS do zadania (pkt f: „symulacja zasiłku przy uwzględnieniu
 * konkretnej sprawy z podanych w zestawach”). Tylko liczby potrzebne do wyliczenia i kwoty
 * z decyzji ZUS do porównania — bez danych osobowych. Testy: `tests/benefit-form.test.ts`.
 */
import type { ScenarioResult } from "@/lib/rules/maternity";
import { parentForm, type CalcForm } from "./benefit-form";

/**
 * Wartość do porównania z wynikiem kalkulatora. `zus` to liczba z akt: domyślnie kwota z decyzji
 * albo zrzutu ZUS. Gdy w aktach nie ma kwot, porównujemy okres w dniach (`unit: "dni"`) z wniosku,
 * zaświadczenia płatnika albo pisma ZUS — `source` mówi, skąd pochodzi liczba.
 */
export type PresetCheck = {
  label: string;
  zus: number;
  pick: (r: ScenarioResult) => number | undefined;
  unit?: "zl" | "dni";
  source?: "zus" | "dokumenty";
};

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
const days = (periodId: string) => (r: ScenarioResult) => r.periods.find((p) => p.id === periodId)?.days;
/** Kwoty miesięczne z zaświadczenia płatnika, w kolejności 12 miesięcy przed zdarzeniem. */
const months = (amounts: string[]) => amounts.map((amount) => ({ amount, underHalf: false }));

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
    description: "Przedsiębiorczyni, poród 20.09.2026, podstawa ustalona przy wcześniejszym zasiłku chorobowym (bez przerwy, więc ta sama podstawa).",
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
    description: "Pełny etat, przeciętne wynagrodzenie z zaświadczenia płatnika 3 707,67 zł. Podstawa podniesiona do płacy minimalnej (4 300 zł od lipca 2024) − 13,71%. Poród 15.10.2024.",
    form: { ...common, event: "birth", date: "2024-10-15", variant: "100-70", A: { ...parentForm("pracownik", "3707,67"), fullTime: true } },
    checks: [
      { label: "Stawka dzienna", zus: 123.68, pick: daily("mat-A") },
      { label: "Podstawa wymiaru", zus: 3710.47, pick: (r) => r.segments.find((s) => s.periodId === "mat-A")?.basis },
    ],
  },
  // Sprawy bez kwot w aktach: porównujemy okresy z wniosków, zaświadczeń płatnika i pism ZUS.
  {
    id: "blizniaki",
    title: "Bliźnięta, wcześniaki, „Za życiem”, urlop uzupełniający",
    description:
      "Pełny etat, stałe wynagrodzenie 8 317,20 zł (Z-3). Poród bliźniąt 20.07.2025 w 28. tygodniu ciąży, dzieci w szpitalu od porodu do 09.10.2025, zaświadczenie „Za życiem”. Wniosek o 81,5%: 31 tygodni urlopu macierzyńskiego, 8 tygodni uzupełniającego, 58 tygodni rodzicielskiego (67 tygodni minus 9 tygodni drugiego rodzica).",
    form: {
      ...common,
      event: "birth",
      date: "2025-07-20",
      children: 2,
      zaZyciem: true,
      hospital: true,
      hospitalDays: 82,
      variant: "815",
      parentalWeeksA: 58,
      A: { ...parentForm("pracownik", "8317,20"), fullTime: true },
    },
    checks: [
      { label: "Urlop macierzyński 20.07.2025–21.02.2026 (pismo ZUS)", zus: 217, unit: "dni", pick: days("mat-A") },
      { label: "Uzupełniający urlop 22.02–18.04.2026 (wniosek urlopowy)", zus: 56, unit: "dni", source: "dokumenty", pick: days("sup") },
      { label: "Urlop rodzicielski 19.04.2026–29.05.2027 (wniosek urlopowy)", zus: 406, unit: "dni", source: "dokumenty", pick: days("par-A") },
    ],
  },
  {
    id: "przysposobienie",
    title: "Przysposobienie dziecka, 81,5%",
    description:
      "Pełny etat, wynagrodzenie 8 532,44 zł, od lipca 2025 r. 8 959,06 zł, w listopadzie premia 760,63 zł (Z-3). Dziecko urodzone 20.04.2024, przyjęte na wychowanie 26.01.2026 po wniosku do sądu z 16.01.2026. Zasiłek od 27.01.2026 i tę datę wpisano w kalkulatorze. Wniosek o oba urlopy złożony przed przyjęciem dziecka, więc 81,5%.",
    form: {
      ...common,
      event: "adoption",
      date: "2026-01-27",
      childBirthDate: "2024-04-20",
      variant: "815",
      A: {
        ...parentForm("pracownik"),
        fullTime: true,
        mode: "months",
        months: months(["8532,44", "8532,44", "8532,44", "8532,44", "8532,44", "8532,44", "8959,06", "8959,06", "8959,06", "8959,06", "9719,69", "8959,06"]),
      },
    },
    checks: [
      { label: "Urlop na warunkach macierzyńskiego 27.01–15.06.2026 (wypłata ZUS)", zus: 140, unit: "dni", pick: days("mat-A") },
      { label: "Urlop rodzicielski 16.06.2026–25.01.2027 (wypłata ZUS)", zus: 224, unit: "dni", pick: days("par-A") },
    ],
  },
  {
    id: "zlecenie",
    title: "Umowa zlecenia, podstawa 200 zł: podwyższenie do 1 000 zł",
    description:
      "Zleceniobiorczyni z dobrowolnym ubezpieczeniem chorobowym, podstawa składek 200 zł miesięcznie (Z-3a). Poród 30.05.2025, wniosek ZAM o 81,5%. Zasiłek jest niższy od świadczenia rodzicielskiego, więc kalkulator dolicza podwyższenie do 1 000 zł miesięcznie.",
    form: {
      ...common,
      event: "birth",
      date: "2025-05-30",
      variant: "815",
      A: { ...parentForm("zleceniobiorca", "200"), fullTime: false },
    },
    checks: [
      { label: "Urlop macierzyński 30.05–16.10.2025 (wniosek ZAM)", zus: 140, unit: "dni", source: "dokumenty", pick: days("mat-A") },
      { label: "Urlop rodzicielski 17.10.2025–28.05.2026 (wniosek ZAM)", zus: 224, unit: "dni", source: "dokumenty", pick: days("par-A") },
    ],
  },
  {
    id: "martwe-urodzenie",
    title: "Urodzenie martwego dziecka: 8 tygodni",
    description:
      "Pełny etat od 2020 r., stałe wynagrodzenie 5 091,05 zł (Z-3). Urodzenie martwego dziecka 11.09.2026: urlop macierzyński w wymiarze 8 tygodni, bez urlopu rodzicielskiego.",
    form: {
      ...common,
      event: "birth",
      date: "2026-09-11",
      stillbirth: true,
      variant: "100-70",
      parentalWeeksA: 0,
      A: { ...parentForm("pracownik", "5091,05"), fullTime: true },
    },
    checks: [{ label: "Urlop macierzyński 11.09–05.11.2026 (wniosek i Z-3)", zus: 56, unit: "dni", source: "dokumenty", pick: days("mat-A") }],
  },
];
