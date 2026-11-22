/**
 * Kalkulator zasiłku macierzyńskiego: podstawa wymiaru, okresy urlopów obojga rodziców, stawki,
 * kwoty dzienne i wypłaty miesiąc po miesiącu. Treść zadania ZUS, s. 13, pkt b–f i j.
 *
 * Źródła reguł (materiały ZUS do zadania, sprawdzone 22.11.2026):
 * - ustawa zasiłkowa (UZ): art. 29a, 30a, 31 (stawki, podwyższenie, łączenie z pracą),
 *   art. 36–38, 45, 47, 48, 52 (podstawa), art. 3 pkt 3–4 (13,71%);
 * - Kodeks pracy (KP): art. 180, 180², 182¹a–182¹f, 182³, 183 (wymiary urlopów);
 * - załącznik ZUS „maksymalny czas trwania zasiłków, wysokość, podstawa wymiaru”;
 * - zus.pl „Wysokość zasiłku macierzyńskiego” (podwyższenie do 1000 zł, bez urlopu ojcowskiego).
 *
 * Zgodność z decyzjami ZUS z zestawów spraw (testy `tests/maternity.test.ts`): stawka dzienna
 * = podstawa × stawka ÷ 30, zaokrąglona do grosza; wypłata = stawka dzienna × dni kalendarzowe;
 * podstawa = średnia z miesięcy × (1 − 13,71%), bez miesięcy przepracowanych w mniej niż połowie.
 *
 * Miejsca, których materiały nie rozstrzygają, mają `assumption` w wyniku — UI pokazuje je jako
 * „do weryfikacji”. Kwoty są brutto; podatek to szacunek (osobno, `estimateNet`).
 */
import { addDays, addMonths, daysBetween, isValidIso } from "./dates";
import { parentalWorkPeriods, type ParentalWork } from "./parental-work";
import { paternityWindow } from "./paternity";
import { hospitalLeaveWeeks, type HospitalCertificate } from "./hospital-stays";
import { maternityParametersOn } from "./maternity-schedule";
import { rateOn, type RateKind } from "./rates";
import { MINIMUM_WAGE } from "./arrears";
import { valueWithDefaults, type RuleSchedule, type ScheduledValue } from "./parameters";

export const MATERNITY_RULES_VERSION = "maternity-2026-11-22.8";

// ---------- Parametry (do panelu administracyjnego) ----------

/** Wartości liczbowe z materiałów ZUS. Zmiana przepisów = zmiana tych liczb, nie kodu. */
export const MATERNITY_PARAMETERS = {
  /** Składki na ubezpieczenia społeczne finansowane przez ubezpieczonego (UZ art. 3 pkt 3–4). */
  deductionPct: 13.71,
  /** Stawki (UZ art. 31 ust. 1–3). */
  rateMaternity: 100,
  rateParental: 70,
  rateAveraged: 81.5,
  /** Wymiar urlopu macierzyńskiego i na warunkach macierzyńskiego wg liczby dzieci (KP art. 180 § 1, art. 183 § 1). */
  maternityWeeks: [20, 31, 33, 35, 37],
  /** Najkrótszy urlop na warunkach urlopu macierzyńskiego (KP art. 183 § 3; załącznik ZUS). */
  adoptionMinWeeks: 9,
  /** Urlop rodzicielski: 1 dziecko / więcej, oraz z zaświadczeniem „Za życiem” (KP art. 182¹a § 1–2). */
  parentalWeeks: { one: 41, many: 43, oneZaZyciem: 65, manyZaZyciem: 67 },
  /** Wyłączna, nieprzenoszalna część każdego z rodziców (KP art. 182¹a § 4). */
  exclusiveWeeks: 9,
  /** Limity urlopu rodzicielskiego łączonego z pracą (KP art. 182¹f § 1–1¹). */
  parentalWithWorkMaxWeeks: { one: 82, many: 86, oneZaZyciem: 130, manyZaZyciem: 134 },
  /** Urlop macierzyński po urodzeniu martwego dziecka: tygodnie po porodzie (KP art. 180¹ § 1). */
  stillbirthWeeksAfterBirth: 8,
  /** Najwyżej tyle tygodni macierzyńskiego przed porodem (KP art. 180 § 2). */
  maxWeeksBeforeBirth: 6,
  /** Matka wykorzystuje osobiście co najmniej tyle tygodni po porodzie (KP art. 180 § 4). */
  motherMinWeeksAfterBirth: 14,
  /** Urlop ojcowski (KP art. 182³ § 1): do 14 dni, do ukończenia przez dziecko 12 miesięcy. */
  paternityDays: 14,
  paternityMonths: 12,
  /** Wniosek o 81,5% najpóźniej tyle dni po porodzie / przyjęciu (UZ art. 30a ust. 1–2). */
  averagedRequestDays: 21,
  /** Kwota świadczenia rodzicielskiego — podwyższenie zasiłku (UZ art. 31 ust. 3a; zus.pl). */
  parentalAllowance: 1000,
  /** Maks. podstawa zasiłku niepracownika w 2026 r. (załącznik ZUS: 23 550 zł − 13,71%). */
  nonEmployeeBasisCap: 20321.3,
} as const;

/**
 * Płaca minimalna do minimalnej podstawy pracownika (UZ art. 45). 2024: decyzja ZUS z zestawu
 * spraw (4 242 zł, od lipca 4 300 zł); dalej harmonogram z `arrears.ts` (Julian).
 */
export const MINIMUM_WAGE_HISTORY: readonly ScheduledValue[] = [
  { value: 4242, validFrom: "2024-01-01" },
  { value: 4300, validFrom: "2024-07-01" },
  ...MINIMUM_WAGE,
];

// ---------- Źródła ----------

export type SourceId =
  | "uz31"
  | "uz30a"
  | "uz36"
  | "uz38"
  | "uz45"
  | "uz48"
  | "kp180"
  | "kp180-2"
  | "kp182-1a"
  | "kp182-1f"
  | "kp182-3"
  | "kp183"
  | "zusDocuments"
  | "zusAmount"
  | "zusBasisEmployee"
  | "zusBasisNonEmployee"
  | "govParental"
  | "zalacznik";

export const SOURCES: Record<SourceId, { label: string; url?: string }> = {
  uz31: { label: "Ustawa zasiłkowa, art. 31 (stawki, podwyższenie, łączenie z pracą)", url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/wysokosc" },
  uz30a: { label: "Ustawa zasiłkowa, art. 30a (wniosek o 81,5% w ciągu 21 dni)", url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/wysokosc" },
  uz36: { label: "Ustawa zasiłkowa, art. 36 (12 miesięcy, 1/30 podstawy na dzień)", url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/podstawa-wymiaru/dla-pracownikow" },
  uz38: { label: "Ustawa zasiłkowa, art. 38 (miesiące przepracowane w mniej niż połowie)", url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/podstawa-wymiaru/dla-pracownikow" },
  uz45: { label: "Ustawa zasiłkowa, art. 45 (podstawa nie niższa niż płaca minimalna − 13,71%)", url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/podstawa-wymiaru/dla-pracownikow" },
  uz48: { label: "Ustawa zasiłkowa, art. 48 (przychód niepracownika z 12 miesięcy)", url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/podstawa-wymiaru/dla-ubezpieczonych-niebedacych-pracownikami" },
  kp180: { label: "Kodeks pracy, art. 180 (urlop macierzyński 20–37 tygodni)", url: "https://www.gov.pl/web/rodzina/urlop-macierzynski" },
  "kp180-2": { label: "Kodeks pracy, art. 180² (uzupełniający urlop macierzyński)", url: "https://www.gov.pl/web/rodzina/urlop-macierzynski" },
  "kp182-1a": { label: "Kodeks pracy, art. 182¹a (urlop rodzicielski 41/43/65/67 tygodni, 9 tygodni wyłącznie)", url: "https://www.gov.pl/web/rodzina/urlop-rodzicielski" },
  "kp182-1f": { label: "Kodeks pracy, art. 182¹e–182¹f (łączenie urlopu rodzicielskiego z pracą)", url: "https://www.gov.pl/web/rodzina/urlop-rodzicielski" },
  "kp182-3": { label: "Kodeks pracy, art. 182³ (urlop ojcowski 2 tygodnie)", url: "https://www.gov.pl/web/rodzina/urlop-ojcowski" },
  kp183: { label: "Kodeks pracy, art. 183 (adopcja, rodzina zastępcza)", url: "https://www.gov.pl/web/rodzina/urlop-macierzynski" },
  zusDocuments: { label: "ZUS · Dokumenty i terminy wniosków o zasiłek macierzyński", url: "https://www.zus.pl/pl/swiadczenia/zasilki/zasilek-macierzynski/niezbedne-dokumenty" },
  zusAmount: { label: "zus.pl · Wysokość zasiłku macierzyńskiego", url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/wysokosc" },
  zusBasisEmployee: { label: "zus.pl · Podstawa wymiaru dla pracowników", url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/podstawa-wymiaru/dla-pracownikow" },
  zusBasisNonEmployee: {
    label: "zus.pl · Podstawa wymiaru dla niepracowników",
    url: "https://www.zus.pl/swiadczenia/zasilki/zasilek-macierzynski/podstawa-wymiaru/dla-ubezpieczonych-niebedacych-pracownikami",
  },
  govParental: { label: "gov.pl · Urlop rodzicielski", url: "https://www.gov.pl/web/rodzina/urlop-rodzicielski" },
  zalacznik: { label: "Załącznik ZUS do zadania: czas trwania, wysokość, podstawa wymiaru" },
};

// ---------- Typy ----------

export type EventKind = "birth" | "adoption" | "foster";
export type PayVariant = "815" | "100-70";
export type ParentId = "A" | "B";
export type InsuranceTitle = "pracownik" | "zleceniobiorca" | "dzialalnosc";
export type LeaveKind = "macierzynski" | "na-warunkach" | "uzupelniajacy" | "rodzicielski" | "ojcowski";

export type BasisMonth = {
  /** Wynagrodzenie brutto (pracownik) albo podstawa składki chorobowej (niepracownik). */
  amount: number;
  /** Przepracowany/ubezpieczony mniej niż połowę miesiąca — wyłączany (UZ art. 38 ust. 2). */
  underHalf?: boolean;
  /** Inny procent składek niż 13,71% (np. po przekroczeniu rocznego limitu składek, z Z-3). */
  deductionPct?: number;
};

export type BasisInput =
  /** Podstawa z decyzji ZUS albo z zaświadczenia płatnika (Z-3) — bez przeliczania. */
  | { kind: "known"; amount: number }
  /** Przeciętne miesięczne wynagrodzenie brutto / podstawa składek z 12 miesięcy. */
  | { kind: "average"; amount: number }
  /** Miesiąc po miesiącu (do 12). */
  | { kind: "months"; months: BasisMonth[] };

export type ParentInput = {
  title: InsuranceTitle;
  basis: BasisInput;
  /** Pracownik na pełny etat: podstawa nie niższa niż płaca minimalna − 13,71% (UZ art. 45). */
  fullTime: boolean;
};

export type ScenarioInput = {
  event: EventKind;
  /** Data porodu (albo przewidywana) / przyjęcia dziecka na wychowanie. */
  date: string;
  /** Liczba dzieci z jednego porodu / przyjętych jednocześnie (5 = 5 i więcej). */
  children: number;
  zaZyciem: boolean;
  /** Adopcja / rodzina zastępcza: data urodzenia dziecka (limit wieku). */
  childBirthDate?: string;
  adoptionFinalOn?: string;
  placement?: { children: { birthDate: string; schoolDeferred?: boolean }[]; courtFiledOn?: string; leaveFrom?: string };
  professionalFoster?: boolean;
  /** Rodzina zastępcza: odroczony obowiązek szkolny (limit 10 lat zamiast 7). */
  schoolDeferred?: boolean;
  /** Urodzenie martwego dziecka (albo zgon przed 8. tygodniem życia): 8 tygodni po porodzie, 100% (KP art. 180¹). */
  stillbirth?: boolean;
  variant: PayVariant;
  parentA: ParentInput;
  /** null — drugi rodzic nie podlega ubezpieczeniu chorobowemu albo nie korzysta. */
  parentB: ParentInput | null;
  /** Tygodnie urlopu macierzyńskiego przed porodem (0–6). */
  weeksBeforeBirth: number;
  /** Exact dates from confirmed evidence; the form continues to accept whole weeks. */
  prenatalLeaveDays?: number;
  /** One date per deceased child; stillbirth is recorded on the delivery date. */
  childDeathDates?: string[];
  /** Tygodnie macierzyńskiego przejęte przez drugiego rodzica (po min. 14 tygodniach matki). */
  transferWeeks: number;
  maternityTakeover?: {
    from: string; to: string; motherLastPaidOn: string; recipientStoppedWorkForCare: boolean;
  } & ({reason:"resignation"} | {reason:"hospitalization"; hospitalFrom:string; hospitalTo:string}
    | {reason:"certified_inability"; certifiedFrom:string});
  /** Uzupełniający urlop macierzyński (wcześniak, hospitalizacja). */
  supplementaryWeeks: number;
  /** Dated, complete hospital evidence takes precedence over manually estimated weeks. */
  hospitalCertificate?: HospitalCertificate;
  supplementaryParent: ParentId;
  parentalWeeksA: number;
  parentalWeeksB: number;
  parentalOrder: "sequential" | "together";
  /** Ułamek etatu pracy w czasie urlopu rodzicielskiego (0 – bez pracy, najwyżej 0,5). */
  workA: number;
  workB: number;
  parentalWork?: Partial<Record<ParentId, ParentalWork>>;
  parentalStarts?: Partial<Record<ParentId, string>>;
  /** Earlier parental requests for this child group, with days charged to the unextended family pool. */
  priorParentalParts?: { parent: ParentId; from: string; to: string; daysUsed: number }[];
  /** Urlop ojcowski drugiego rodzica: 0, 7 albo 14 dni. */
  paternityDays: number;
  paternityStart?: string;
  schedule?: RuleSchedule;
};

export type BasisStep = { text: string; value?: number; source: SourceId; assumption?: boolean };

export type BasisResult = {
  basis: number;
  steps: BasisStep[];
  /** Pełny etat pracownika: minimalna podstawa obowiązuje na każdy dzień (zmienia się z płacą minimalną). */
  floorApplies: boolean;
  monthsUsed: number;
  monthsExcluded: number;
};

export type Segment = {
  periodId: string;
  parent: ParentId;
  kind: LeaveKind;
  /** YYYY-MM */
  month: string;
  from: string;
  to: string;
  days: number;
  ratePct: number;
  work: number;
  basis: number;
  daily: number;
  amount: number;
  /** Dopłata do kwoty świadczenia rodzicielskiego (UZ art. 31 ust. 3a). */
  topUp: number;
};

export type Period = {
  id: string;
  parent: ParentId;
  kind: LeaveKind;
  label: string;
  from: string;
  to: string;
  days: number;
  ratePct: number;
  work: number;
  /** Stawka dzienna w pierwszym miesiącu okresu (może wzrosnąć z płacą minimalną). */
  daily: number;
  amount: number;
  topUp: number;
  note?: string;
};

export type Deadline = { date: string; label: string; who: ParentId | "both"; source: SourceId };

export type Message = { text: string; source?: SourceId };

export type ScenarioResult = {
  ok: boolean;
  errors: Message[];
  warnings: Message[];
  assumptions: Message[];
  limits: {
    maternityWeeks: number;
    parentalPoolWeeks: number;
    exclusiveWeeks: number;
    maxParentalOneParent: number;
    parentalWithWorkMaxWeeks: number;
  };
  basis: { A: BasisResult; B: BasisResult | null };
  periods: Period[];
  segments: Segment[];
  totals: { A: number; B: number; all: number; topUp: number };
  parentalDays: { personDays: number; calendarDays: number };
  /** Pierwszy i ostatni dzień urlopów z zasiłkiem (bez urlopu ojcowskiego). */
  span: { from: string; to: string; days: number } | null;
  deadlines: Deadline[];
};

// ---------- Arytmetyka w groszach ----------

/** Zaokrąglenie do grosza „od połowy w górę” (dla kwot nieujemnych). */
export function round2(value: number): number {
  return Math.round(value * 100 + 1e-7) / 100;
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

export function minimumWageOn(date: string, schedule?: RuleSchedule): number {
  return valueWithDefaults(schedule, "wage.minimum", date, MINIMUM_WAGE_HISTORY).value;
}

/** Minimalna podstawa pracownika na pełny etat w danym dniu: płaca minimalna − 13,71% (UZ art. 45). */
export function minimumBasisOn(date: string, schedule?: RuleSchedule): number {
  const p = maternityParametersOn(schedule, date);
  const wage = minimumWageOn(date, schedule);
  return Number.isFinite(wage) ? round2((wage * (100 - p.deductionPct)) / 100) : 0;
}

// ---------- Podstawa wymiaru ----------

/** 12 miesięcy kalendarzowych przed miesiącem powstania prawa (UZ art. 36 ust. 1) — etykiety dla formularza. */
export function basisMonthLabels(eventDate: string): string[] {
  const first = `${eventDate.slice(0, 7)}-01`;
  return Array.from({ length: 12 }, (_, i) => addMonths(first, i - 12).slice(0, 7));
}

export function computeBasis(parent: ParentInput, eventDate: string, schedule?: RuleSchedule): BasisResult {
  const p = maternityParametersOn(schedule, eventDate);
  const employee = parent.title === "pracownik";
  const steps: BasisStep[] = [];
  const floorApplies = employee && parent.fullTime;
  let basis: number;
  let monthsUsed = 0;
  let monthsExcluded = 0;

  if (parent.basis.kind === "known") {
    basis = round2(parent.basis.amount);
    steps.push({ text: "Podstawa wymiaru z decyzji ZUS / zaświadczenia płatnika", value: basis, source: employee ? "zusBasisEmployee" : "zusBasisNonEmployee" });
  } else {
    const months: BasisMonth[] = parent.basis.kind === "average" ? [{ amount: parent.basis.amount }] : parent.basis.months.filter((m) => m.amount >= 0);
    const labels = basisMonthLabels(eventDate).slice(-months.length);
    const datedMonths = months.map((m, i) => ({
      ...m,
      deductionPct: m.deductionPct ?? (parent.basis.kind === "months"
        ? maternityParametersOn(schedule, labels[i] + "-01").deductionPct : p.deductionPct),
    }));
    const full = datedMonths.filter((m) => !m.underHalf);
    // Gdy w każdym miesiącu przepracowano mniej niż połowę — bierze się wszystkie (UZ art. 38 ust. 3).
    const used = full.length > 0 ? full : datedMonths;
    monthsUsed = used.length;
    monthsExcluded = months.length - used.length;
    if (used.length === 0) {
      basis = 0;
    } else {
      const net = used.map((m) => (m.amount * (100 - (m.deductionPct ?? p.deductionPct))) / 100);
      const gross = sum(used.map((m) => m.amount)) / used.length;
      basis = round2(sum(net) / used.length);
      if (parent.basis.kind === "months") {
        steps.push({
          text: `Średnia z ${used.length} ${used.length === 1 ? "miesiąca" : "miesięcy"}${monthsExcluded ? ` (pominięte: ${monthsExcluded} — mniej niż połowa miesiąca)` : ""}`,
          value: round2(gross),
          source: monthsExcluded ? "uz38" : employee ? "uz36" : "uz48",
        });
      } else {
        steps.push({ text: employee ? "Przeciętne miesięczne wynagrodzenie brutto" : "Przeciętna miesięczna podstawa składki chorobowej", value: round2(gross), source: employee ? "uz36" : "uz48" });
      }
      const custom = used.some((m) => m.deductionPct !== undefined && m.deductionPct !== p.deductionPct);
      steps.push({
        text: custom ? "Minus składki społeczne (procent z zaświadczenia płatnika)" : `Minus ${p.deductionPct.toString().replace(".", ",")}% składek społecznych`,
        value: basis,
        source: employee ? "zusBasisEmployee" : "zusBasisNonEmployee",
      });
    }
  }

  if (!employee && basis > p.nonEmployeeBasisCap && eventDate >= "2026-01-01" && eventDate < "2027-01-01") {
    basis = p.nonEmployeeBasisCap;
    steps.push({ text: "Ograniczenie do najwyższej podstawy niepracownika w 2026 r.", value: basis, source: "zalacznik" });
  }
  if (floorApplies) {
    const floor = minimumBasisOn(eventDate, schedule);
    if (basis < floor) {
      steps.push({ text: "Podniesione do minimalnej podstawy (płaca minimalna − 13,71%)", value: floor, source: "uz45" });
    }
  }
  return { basis, steps, floorApplies, monthsUsed, monthsExcluded };
}

/** Podstawa na dany dzień: przy pełnym etacie nie niższa niż minimalna w tym dniu (decyzja ZUS 2024: wzrost od lipca). */
export function basisOn(result: BasisResult, date: string, schedule?: RuleSchedule): number {
  return result.floorApplies ? Math.max(result.basis, minimumBasisOn(date, schedule)) : result.basis;
}

/** Stawka dzienna: podstawa × stawka × (1 − praca) ÷ 30, do grosza (UZ art. 36 ust. 3, art. 31 ust. 4a). */
export function dailyAmount(basis: number, ratePct: number, work = 0): number {
  return round2((basis * ratePct * (1 - work)) / 100 / 30);
}

// ---------- Wymiary ----------

const childIndex = (children: number) => Math.min(Math.max(Math.round(children), 1), 5) - 1;

export function limitsFor(input: Pick<ScenarioInput, "children" | "zaZyciem"> & { date?: string }, schedule?: RuleSchedule) {
  const p = input.date ? maternityParametersOn(schedule, input.date) : MATERNITY_PARAMETERS;
  const many = input.children > 1;
  const pool = input.zaZyciem ? (many ? p.parentalWeeks.manyZaZyciem : p.parentalWeeks.oneZaZyciem) : many ? p.parentalWeeks.many : p.parentalWeeks.one;
  const withWork = input.zaZyciem
    ? many
      ? p.parentalWithWorkMaxWeeks.manyZaZyciem
      : p.parentalWithWorkMaxWeeks.oneZaZyciem
    : many
      ? p.parentalWithWorkMaxWeeks.many
      : p.parentalWithWorkMaxWeeks.one;
  return {
    maternityWeeks: p.maternityWeeks[childIndex(input.children)],
    parentalPoolWeeks: pool,
    exclusiveWeeks: p.exclusiveWeeks,
    maxParentalOneParent: pool - p.exclusiveWeeks,
    parentalWithWorkMaxWeeks: withWork,
  };
}

/** KP art. 180 §1–2 and 180¹ §1–2, text in force 22.11.2026. Dates are inclusive. */
export function birthLeaveWindow(birth: string, children: number, prenatalDays: number, deathDates: readonly string[] = [], schedule?: RuleSchedule) {
  const p = maternityParametersOn(schedule, birth);
  if (!Number.isSafeInteger(children) || children < 1 || !Number.isInteger(prenatalDays) || prenatalDays < 0 || prenatalDays > 7 * p.maxWeeksBeforeBirth || deathDates.length > children) {
    throw new RangeError("invalid_birth_history");
  }
  const from = addDays(birth, -prenatalDays);
  const ordinaryEnd = (count: number) => addDays(from, p.maternityWeeks[childIndex(count)] * 7 - 1);
  const eightWeeksEnd = addDays(birth, 7 * p.stillbirthWeeksAfterBirth - 1);
  let to = ordinaryEnd(children);
  for (const [i, death] of [...deathDates].sort().entries()) {
    if (!isValidIso(death) || death < birth) throw new RangeError("invalid_child_death_date");
    if (death > to) continue;
    const remaining = children - i - 1;
    const remainingEnd = remaining ? ordinaryEnd(remaining) : eightWeeksEnd;
    // ZUS commentary §118 counts the seven days following the date of death.
    const minimumEnd = addDays(death, 7);
    to = remaining && death <= eightWeeksEnd ? remainingEnd : [remainingEnd, minimumEnd].sort()[1];
  }
  return { from, to, days: daysBetween(from, to) + 1 };
}

/**
 * Uzupełniający urlop macierzyński (KP art. 180² § 1–3): tydzień za każdy tydzień pobytu dziecka
 * w szpitalu, niepełny tydzień w górę, najwyżej 15 tygodni (przed 28. tyg. ciąży lub ≤ 1000 g)
 * albo 8 tygodni (pozostałe przypadki).
 */
export function supplementaryWeeksFor(hospitalDays: number, extremePreterm: boolean): number {
  if (!(hospitalDays > 0)) return 0;
  return Math.min(Math.ceil(hospitalDays / 7), extremePreterm ? 15 : 8);
}

// ---------- Scenariusz ----------

const LABEL: Record<LeaveKind, string> = {
  macierzynski: "Urlop macierzyński",
  "na-warunkach": "Urlop na warunkach urlopu macierzyńskiego",
  uzupelniajacy: "Uzupełniający urlop macierzyński",
  rodzicielski: "Urlop rodzicielski",
  ojcowski: "Urlop ojcowski",
};

/** Ostatni dzień miesiąca. */
function monthEnd(iso: string): string {
  return addDays(addMonths(`${iso.slice(0, 7)}-01`, 1), -1);
}

function daysInMonth(iso: string): number {
  return Number(monthEnd(iso).slice(8, 10));
}

/** Dzieli okres na kawałki w miesiącach kalendarzowych. */
function splitByMonth(from: string, to: string, changeDays: string[]): Array<{ from: string; to: string; days: number }> {
  const parts: Array<{ from: string; to: string; days: number }> = [];
  let cur = from;
  while (cur <= to) {
    const boundary = changeDays.find(day => day > cur);
    const end = [monthEnd(cur), to, boundary ? addDays(boundary, -1) : to].sort()[0];
    parts.push({ from: cur, to: end, days: daysBetween(cur, end) + 1 });
    cur = addDays(end, 1);
  }
  return parts;
}

type RawPeriod = { id: string; parent: ParentId; kind: LeaveKind; from: string; days: number; rate: RateKind; work: number; note?: string };

export function computeScenario(given: ScenarioInput): ScenarioResult {
  const p = maternityParametersOn(given.schedule, given.date);
  const stillbirth = Boolean(given.stillbirth) && given.event === "birth";
  // Martwe urodzenie: tylko urlop macierzyński matki, 100% (Poradnik ZUS 2026, s. 34), bez rodzicielskiego i ojcowskiego.
  const input: ScenarioInput = stillbirth
    ? { ...given, variant: "100-70", transferWeeks: 0, supplementaryWeeks: 0, parentalWeeksA: 0, parentalWeeksB: 0, workA: 0, workB: 0, paternityDays: 0 }
    : given;
  const errors: Message[] = [];
  const warnings: Message[] = [];
  const assumptions: Message[] = [];
  let supplementaryWeeks = input.supplementaryWeeks;
  if (input.hospitalCertificate && !stillbirth) {
    const certificate = input.hospitalCertificate;
    if (certificate.children.length !== input.children || (input.event === "birth"
      ? certificate.birth !== input.date || !!certificate.acceptedOn
      : certificate.birth !== input.childBirthDate || certificate.acceptedOn !== input.date)) {
      errors.push({ text: "Zaświadczenie szpitala nie odpowiada dzieciom i zdarzeniu z wniosku.", source: "kp180-2" });
    } else {
      try {
        supplementaryWeeks = hospitalLeaveWeeks(certificate).weeks;
      } catch (issue) {
        if (!(issue instanceof RangeError)) throw issue;
        errors.push({ text: "Sprawdź daty pobytów, masy i wiek ciążowy na zaświadczeniu szpitala.", source: "kp180-2" });
      }
    }
  }
  let placementStart = input.date;
  let placementEvent = input.date;
  let placementDays: number | undefined;
  let eligibleChildren = input.children;
  if (input.event !== "birth") {
    const placement = input.placement;
    const children = placement?.children ?? (input.childBirthDate ? [{birthDate:input.childBirthDate,schoolDeferred:input.schoolDeferred}] : []);
    if (placement && (children.length !== input.children || !children.length || (input.event === "adoption" && (!placement.courtFiledOn || !isValidIso(placement.courtFiledOn))))) {
      errors.push({ text: "Potwierdź datę wniosku do sądu i dane każdego dziecka przyjętego jednocześnie.", source: "kp183" });
    }
    if (input.event === "adoption" && placement?.courtFiledOn && isValidIso(placement.courtFiledOn)) placementEvent = [input.date, placement.courtFiledOn].sort()[1];
    placementStart = placement?.leaveFrom ?? placementEvent;
    if (!isValidIso(placementStart) || placementStart < placementEvent || (input.parentA.title === "pracownik" && placementStart > addDays(placementEvent, 21))) {
      errors.push({ text: "Sprawdź datę rozpoczęcia urlopu po przyjęciu dziecka i złożeniu wniosku.", source: "kp183" });
      placementStart = placementEvent;
    }
    if (children.length && children.every(c => isValidIso(c.birthDate) && c.birthDate <= input.date)) {
      const birthdays = children.map(c => addMonths(c.birthDate, 12 * (input.event === "adoption" ? 14 : c.schoolDeferred ? 10 : 7))).filter(d => d > placementEvent).sort();
      if (!placement && input.children > 1) {
        assumptions.push({ text: "Potwierdź wiek każdego dziecka przyjętego jednocześnie na wychowanie.", source: "kp183" });
      } else eligibleChildren = birthdays.length;
      if (birthdays.length === 0) errors.push({ text: "Dzieci przekroczyły granicę wieku uprawniającą do tego urlopu.", source: "kp183" });
      else {
        let days = 7 * p.maternityWeeks[childIndex(eligibleChildren)];
        for (const [i, birthday] of birthdays.entries()) {
          const elapsed = daysBetween(placementStart, birthday);
          if (elapsed >= days) break;
          const remaining = eligibleChildren - i - 1;
          const newLimit = remaining > 0 ? 7 * p.maternityWeeks[childIndex(remaining)] : 7 * p.adoptionMinWeeks;
          days = Math.max(elapsed, newLimit);
        }
        placementDays = days;
      }
    } else if (children.length) errors.push({ text: "Sprawdź daty urodzenia dzieci względem dnia przyjęcia.", source: "kp183" });
  }
  const limits = limitsFor({...input, children:eligibleChildren}, input.schedule);
  if (placementDays === 7 * p.adoptionMinWeeks) {
    limits.parentalPoolWeeks = input.zaZyciem ? 62 : 38;
    limits.maxParentalOneParent = limits.parentalPoolWeeks - limits.exclusiveWeeks;
    limits.parentalWithWorkMaxWeeks = 2 * limits.parentalPoolWeeks;
  }
  const birth = input.event === "birth";
  const hasB = input.parentB !== null;

  const basisStart = birth && input.prenatalLeaveDays !== undefined && Number.isInteger(input.prenatalLeaveDays) && input.prenatalLeaveDays >= 0 && input.prenatalLeaveDays <= 42
    ? addDays(input.date, -input.prenatalLeaveDays) : input.date;
  const basisA = computeBasis(input.parentA, birth ? basisStart : placementStart, input.schedule);
  const secondBasisStart = input.maternityTakeover?.from;
  if (secondBasisStart && input.paternityDays > 0 && (input.paternityStart ?? input.date) < secondBasisStart) {
    assumptions.push({text:"Sprawdź podstawę drugiego rodzica osobno dla wcześniejszego ojcowskiego i późniejszego przejęcia.",source:"uz36"});
  }
  const basisB = input.parentB ? computeBasis(input.parentB, secondBasisStart && isValidIso(secondBasisStart) ? secondBasisStart : input.date, input.schedule) : null;

  // --- Wymiar macierzyńskiego / na warunkach ---
  let maternityWeeks = placementDays !== undefined ? placementDays / 7 : limits.maternityWeeks;
  if (input.event === "foster" && input.professionalFoster) errors.push({ text: "Zawodowej rodzinie zastępczej nie przysługuje ten urlop z tytułu przyjęcia dziecka.", source: "kp183" });
  const weeksBefore = birth ? Math.min(Math.max(Math.round(input.weeksBeforeBirth), 0), p.maxWeeksBeforeBirth) : 0;
  if (stillbirth && !given.childDeathDates) {
    maternityWeeks = weeksBefore + p.stillbirthWeeksAfterBirth;
    assumptions.push({
      text: "Przy urodzeniu martwego dziecka zasiłek macierzyński przysługuje za 8 tygodni po porodzie (100%). Przy zgonie dziecka — nie krócej niż 7 dni od dnia zgonu; tego kalkulator nie liczy osobno.",
      source: "kp180",
    });
  }
  const transfer = hasB ? Math.max(Math.round(input.transferWeeks), 0) : 0;
  if (transfer > 0) {
    const motherAfter = maternityWeeks - transfer - weeksBefore;
    if (motherAfter < p.motherMinWeeksAfterBirth) {
      errors.push({
        text: `Matka musi wykorzystać co najmniej ${p.motherMinWeeksAfterBirth} tygodni urlopu macierzyńskiego po porodzie — drugi rodzic może przejąć najwyżej ${Math.max(maternityWeeks - weeksBefore - p.motherMinWeeksAfterBirth, 0)} tyg.`,
        source: "kp180",
      });
    }
  }

  // --- Rodzicielski: pula i 9 tygodni wyłącznie ---
  const weeksA = Math.max(Math.round(input.parentalWeeksA), 0);
  const weeksB = hasB ? Math.max(Math.round(input.parentalWeeksB), 0) : 0;
  const prior = new Map<string, NonNullable<ScenarioInput["priorParentalParts"]>[number]>();
  const used = { A: 0, B: 0 };
  for (const part of input.priorParentalParts ?? []) {
    const key = [part.parent, part.from, part.to].join("/");
    const duplicate = prior.get(key);
    if (duplicate?.daysUsed === part.daysUsed) continue;
    if (duplicate || !isValidIso(part.from) || !isValidIso(part.to) || part.from < input.date || part.to < part.from ||
        !Number.isSafeInteger(part.daysUsed) || part.daysUsed < 1 || part.daysUsed > daysBetween(part.from, part.to) + 1 ||
        [...prior.values()].some(p => p.parent === part.parent && p.from <= part.to && part.from <= p.to)) {
      errors.push({ text: "Potwierdź okres i liczbę wykorzystanych dni każdej wcześniejszej części rodzicielskiego.", source: "kp182-1a" });
      continue;
    }
    used[part.parent] += part.daysUsed;
    prior.set(key, part);
  }
  if (prior.size + Number(weeksA > 0) + Number(weeksB > 0) > 5) {
    errors.push({ text: "Rodzice mogą łącznie wykorzystać urlop rodzicielski w najwyżej pięciu częściach.", source: "kp182-1a" });
  }
  if (used.A + 7 * weeksA > 7 * limits.maxParentalOneParent) {
    errors.push({ text: `Jeden rodzic może wziąć najwyżej ${limits.maxParentalOneParent} tyg. — ${limits.exclusiveWeeks} tygodni należy wyłącznie do drugiego rodzica.`, source: "kp182-1a" });
  }
  if (used.B + 7 * weeksB > 7 * limits.maxParentalOneParent) {
    errors.push({ text: `Drugi rodzic może wziąć najwyżej ${limits.maxParentalOneParent} tyg. — ${limits.exclusiveWeeks} tygodni należy wyłącznie do Ciebie.`, source: "kp182-1a" });
  }
  if (used.A + used.B + 7 * (weeksA + weeksB) > 7 * limits.parentalPoolWeeks) {
    errors.push({ text: `Dostępna pula rodziny to ${limits.parentalPoolWeeks} tyg. Wcześniejsze części i ten wniosek łącznie przekraczają jej wymiar.`, source: "kp182-1a" });
  }
  const remainingExclusiveB = Math.max(0, limits.exclusiveWeeks - used.B / 7);
  if (!stillbirth && hasB && weeksB < remainingExclusiveB) {
    warnings.push({
      text: `Drugi rodzic nie wykorzysta ${remainingExclusiveB - weeksB} tyg. swojej wyłącznej części urlopu rodzicielskiego — tych tygodni nie można przenieść, przepadną.`,
      source: "kp182-1a",
    });
  }
  if (!stillbirth && !hasB) {
    warnings.push({ text: `Bez drugiego ubezpieczonego rodzica ${limits.exclusiveWeeks} tygodni jego wyłącznej części urlopu rodzicielskiego nie zostanie wykorzystanych.`, source: "kp182-1a" });
  }
  const workA = Math.min(Math.max(input.workA, 0), 0.5);
  const workB = Math.min(Math.max(input.workB, 0), 0.5);
  if (input.workA > 0.5 || input.workB > 0.5) {
    errors.push({ text: "W czasie urlopu rodzicielskiego można pracować najwyżej na pół etatu.", source: "kp182-1f" });
  }
  if ((workA > 0 && input.parentA.title !== "pracownik") || (workB > 0 && input.parentB?.title !== "pracownik")) {
    assumptions.push({ text: "Łączenie urlopu rodzicielskiego z pracą opisują przepisy dla pracowników; dla innych tytułów ubezpieczenia do weryfikacji.", source: "kp182-1f" });
  }
  if (supplementaryWeeks > 0 && input.supplementaryParent === "B" && !hasB) {
    errors.push({ text: "Uzupełniający urlop macierzyński wybrany dla drugiego rodzica, który nie jest ubezpieczony.", source: "kp180-2" });
  }
  if (input.paternityDays > 0 && !hasB) {
    errors.push({ text: "Zasiłek za urlop ojcowski przysługuje ojcu, który podlega ubezpieczeniu chorobowemu.", source: "kp182-3" });
  }

  const rateMat: RateKind = input.variant === "815" ? "averaged" : "maternity";
  const rateParental: RateKind = input.variant === "815" ? "averaged" : "parental";
  if (input.variant === "815" && transfer > 0) {
    assumptions.push({ text: "Przejętą część urlopu macierzyńskiego liczymy drugiemu rodzicowi po 81,5%, tak jak matce — materiały ZUS nie mówią tego wprost.", source: "uz31" });
  }
  if (input.variant === "815" && weeksB > remainingExclusiveB) {
    assumptions.push({ text: `Tygodnie drugiego rodzica ponad jego wyłączne ${limits.exclusiveWeeks} liczymy po 81,5% (pierwsze ${limits.exclusiveWeeks} zawsze po 70%).`, source: "uz31" });
  }

  // --- Oś czasu ---
  const raw: RawPeriod[] = [];
  const kindMat: LeaveKind = birth ? "macierzynski" : "na-warunkach";
  let exactWindow: ReturnType<typeof birthLeaveWindow> | undefined;
  if (birth && (input.prenatalLeaveDays !== undefined || input.childDeathDates !== undefined)) {
    try {
      exactWindow = birthLeaveWindow(input.date, input.children, input.prenatalLeaveDays ?? weeksBefore * 7, input.childDeathDates ?? (input.stillbirth ? [input.date] : []), input.schedule);
    } catch (issue) {
      if (!(issue instanceof RangeError)) throw issue;
      errors.push({text: "Potwierdź liczbę dzieci, dni urlopu przed porodem i daty zdarzeń.", source: "kp180"});
    }
  }
  const startA = exactWindow?.from ?? (birth ? addDays(input.date, -7 * weeksBefore) : placementStart);
  const matDaysA = (exactWindow?.days ?? placementDays ?? 7 * maternityWeeks) - 7 * transfer;
  if (exactWindow && transfer > 0 && matDaysA - daysBetween(startA, input.date) < p.motherMinWeeksAfterBirth * 7) {
    errors.push({text: "Sprawdź wymiar części matki po porodzie przed przekazaniem urlopu.", source: "kp180"});
  }
  raw.push({ id: "mat-A", parent: "A", kind: kindMat, from: startA, days: matDaysA, rate: rateMat, work: 0, note: weeksBefore ? `w tym ${weeksBefore} tyg. przed porodem` : undefined });
  let next = addDays(startA, matDaysA);
  if (transfer > 0) {
    raw.push({ id: "mat-B", parent: "B", kind: kindMat, from: next, days: 7 * transfer, rate: rateMat, work: 0, note: "przejęta część urlopu macierzyńskiego" });
    next = addDays(next, 7 * transfer);
  }
  if (input.maternityTakeover) {
    const take = input.maternityTakeover;
    const last = addDays(next, -1);
    const minimumDays = 7 * (take.reason === "resignation" ? p.motherMinWeeksAfterBirth : 8);
    const firstAllowed = addDays(birth ? input.date : placementStart, minimumDays);
    const rangeValid = isValidIso(take.from) && isValidIso(take.to) && firstAllowed <= take.from && take.from <= take.to && take.to <= last;
    const reasonValid = take.reason === "hospitalization"
      ? isValidIso(take.hospitalFrom) && isValidIso(take.hospitalTo) && take.hospitalFrom <= take.from && take.to <= take.hospitalTo
      : take.to === last && (take.reason === "resignation" || (isValidIso(take.certifiedFrom) && take.certifiedFrom < take.from));
    if (!hasB || transfer || stillbirth || !rangeValid || !reasonValid || !take.recipientStoppedWorkForCare || take.motherLastPaidOn !== addDays(take.from, -1)) {
      errors.push({text:"Potwierdź przyczynę przejęcia, ostatni dzień matki i okres osobistej opieki ubezpieczonego drugiego rodzica.",source:"kp180"});
    } else {
      raw[0].days = daysBetween(startA, take.from);
      raw.push({id:"mat-B",parent:"B",kind:kindMat,from:take.from,days:daysBetween(take.from,take.to)+1,rate:rateMat,work:0,note:"przejęta część urlopu macierzyńskiego"});
      if (take.to < last) raw.push({id:"mat-A-resumed",parent:"A",kind:kindMat,from:addDays(take.to,1),days:daysBetween(take.to,last),rate:rateMat,work:0});
      if (input.variant === "815") assumptions.push({text:"Potwierdź stawkę dla przejętej części macierzyńskiego.",source:"uz31"});
    }
  }
  if (supplementaryWeeks > 0) {
    if (input.hospitalCertificate && addDays(next, -1) < "2025-03-19") {
      errors.push({ text: "Urlop macierzyński zakończył się przed wejściem w życie przepisów o urlopie uzupełniającym.", source: "kp180-2" });
    }
    const weeks = Math.min(Math.round(supplementaryWeeks), 15);
    raw.push({ id: "sup", parent: input.supplementaryParent, kind: "uzupelniajacy", from: next, days: 7 * weeks, rate: "maternity", work: 0 });
    next = addDays(next, 7 * weeks);
  }
  const parentalStart = next;
  const capDays = limits.parentalWithWorkMaxWeeks * 7;
  const stretched = (weeks: number, work: number) => Math.min(Math.floor((7 * weeks) / (1 - work)), capDays);
  function addParental(parent: ParentId, start: string, weeks: number, work: number, rate: RateKind, id: string, note?: string) {
    if (weeks === 0) return 0;
    if (!isValidIso(start) || start < parentalStart || [...prior.values()].some(p => p.parent === parent && p.to >= start)) {
      errors.push({ text: "Potwierdź początek rodzicielskiego po zakończeniu poprzedzającego urlopu.", source: "kp182-1a" });
      return 0;
    }
    const record = input.parentalWork?.[parent];
    let pieces = [{ from: start, days: stretched(weeks, work), work }];
    if (record) {
      if ((parent === "A" ? input.parentA : input.parentB)?.title !== "pracownik") {
        errors.push({ text: "Do wydłużenia urlopu w związku z pracą wymagany jest tytuł pracowniczy.", source: "kp182-1f" });
        return 0;
      }
      try {
        pieces = parentalWorkPeriods(start, weeks * 7, capDays, record);
      } catch (issue) {
        if (!(issue instanceof RangeError)) throw issue;
        errors.push({ text: "Sprawdź ciągłość pracy, pracodawcę, etat do połowy oraz sposób wykorzystania wydłużenia.", source: "kp182-1f" });
        return 0;
      }
    }
    if (input.parentalStarts?.[parent]) {
      if (input.placement && !birth && placementDays !== 7 * p.adoptionMinWeeks && input.placement.children.length > 1) {
        assumptions.push({text: "Sprawdź wiek każdego dziecka w terminie późniejszej części rodzicielskiego.", source: "kp183"});
      }
      const childDate = birth ? input.date : input.placement?.children[0]?.birthDate ?? input.childBirthDate;
      const lastDay = childDate && (birth ? (Number(childDate.slice(0, 4)) + 6) + "-12-31"
        : addDays(addMonths(childDate, 12 * (input.event === "adoption" ? 14 : input.schoolDeferred ? 10 : 7)), -1));
      if ((birth || placementDays !== 7 * p.adoptionMinWeeks) && (!lastDay || pieces.some(piece => addDays(piece.from, piece.days - 1) > lastDay))) {
        errors.push({ text: "Sprawdź granicę wieku dziecka dla wnioskowanych dat rodzicielskiego.", source: birth ? "kp182-1a" : "kp183" });
        return 0;
      }
    }
    for (const [i, piece] of pieces.entries()) raw.push({ ...piece, id: i ? id + "-work-" + i : id, parent, kind: "rodzicielski", rate, note });
    return sum(pieces.map(piece => piece.days));
  }
  const fromA = input.parentalStarts?.A ?? parentalStart;
  const daysA = addParental("A", fromA, weeksA, workA, rateParental, "par-A");
  if (weeksB > 0) {
    const fromB = input.parentalStarts?.B ?? (input.parentalOrder === "together" || daysA === 0 ? parentalStart : addDays(fromA, daysA));
    if (input.parentalWork?.B && remainingExclusiveB > 0 && weeksB > remainingExclusiveB && input.variant === "815") {
      errors.push({ text: "Rozdziel pracę podczas części wyłącznej i dodatkowej drugiego rodzica.", source: "kp182-1f" });
    } else if (input.parentalWork?.B || !remainingExclusiveB) {
      addParental("B", fromB, weeksB, workB, remainingExclusiveB ? "parental" : rateParental, "par-B");
    } else {
      const exclusive = Math.min(weeksB, remainingExclusiveB);
      const exclusiveDays = addParental("B", fromB, exclusive, workB, "parental", "par-B", "wyłączna część drugiego rodzica");
      if (weeksB > exclusive && exclusiveDays > 0) {
        raw.push({ id: "par-B2", parent: "B", kind: "rodzicielski", from: addDays(fromB, exclusiveDays), days: stretched(weeksB, workB) - exclusiveDays, rate: rateParental, work: workB });
      }
    }
  }
  if (input.paternityDays > 0 && hasB) {
    const days = Math.min(Math.round(input.paternityDays), p.paternityDays);
    const start = input.paternityStart ?? input.date;
    const window = input.event === "adoption" && input.adoptionFinalOn && input.childBirthDate
      ? paternityWindow(input.childBirthDate, input.adoptionFinalOn) : paternityWindow(input.date);
    const deadline = window.to;
    if (addDays(start, days - 1) > deadline) {
      errors.push({ text: `Urlop ojcowski trzeba wykorzystać do ukończenia przez dziecko ${p.paternityMonths} miesięcy (do ${deadline}).`, source: "kp182-3" });
    }
    if (start < window.from) errors.push({ text: "Urlop ojcowski zaczyna się najwcześniej w dniu urodzenia lub prawomocności przysposobienia.", source: "kp182-3" });
    raw.push({ id: "pat", parent: "B", kind: "ojcowski", from: start, days, rate: "maternity", work: 0 });
  }
  if (!birth && input.paternityDays > 0 && !(input.event === "adoption" && input.adoptionFinalOn && input.childBirthDate)) {
    assumptions.push({ text: "Przy adopcji urlop ojcowski liczy się od uprawomocnienia postanowienia o przysposobieniu — przyjmujemy datę przyjęcia dziecka.", source: "kp182-3" });
  }

  if (birth && !stillbirth && input.childDeathDates?.length === input.children && input.children > 0) {
    const lastDeath = [...input.childDeathDates].sort().at(-1);
    if (lastDeath && raw.some(r => r.id !== "mat-A" && addDays(r.from, r.days - 1) >= lastDeath)) {
      errors.push({text: "Okres opieki przypada na datę zgonu lub po niej. Sprawdź należne dni dla tego rodzica.", source: "kp180"});
    }
  }

  // --- Kwoty ---
  const segments: Segment[] = [];
  const periods: Period[] = [];
  let topUpUsed = false;
  for (const r of raw.filter((x) => x.days > 0)) {
    const to = addDays(r.from, r.days - 1);
    const basis = r.parent === "A" ? basisA : basisB;
    if (!basis) continue;
    const changeDays = [
      ...(input.schedule?.[`rate.${r.rate}`] ?? []),
      ...(basis.floorApplies ? input.schedule?.["wage.minimum"] ?? [] : []),
    ].map(change => change.validFrom).filter(day => day > r.from && day <= to).sort();
    const segs: Segment[] = splitByMonth(r.from, to, changeDays).map((part) => {
      const ratePct = rateOn(r.rate, part.from, input.schedule) / 10;
      const allowance = maternityParametersOn(input.schedule, part.from.slice(0, 7) + "-01").parentalAllowance;
      const b = basisOn(basis, part.from, input.schedule);
      const daily = dailyAmount(b, ratePct, r.work);
      let amount = round2(daily * part.days);
      let topUp = 0;
      // Podwyższenie do świadczenia rodzicielskiego: nie dotyczy urlopu ojcowskiego (zus.pl); część miesiąca proporcjonalnie.
      if (r.kind !== "ojcowski" && (b * ratePct * (1 - r.work)) / 100 < allowance) {
        const floor = round2(round2(allowance / daysInMonth(part.from)) * part.days);
        if (floor > amount) {
          topUp = Math.ceil(round2(floor - amount) * 10 - 1e-7) / 10; // ZUS: dopłata zaokrąglana do 10 gr w górę
          amount = round2(amount + topUp);
          topUpUsed = true;
        }
      }
      return { periodId: r.id, parent: r.parent, kind: r.kind, month: part.from.slice(0, 7), from: part.from, to: part.to, days: part.days, ratePct, work: r.work, basis: b, daily, amount, topUp };
    });
    segments.push(...segs);
    periods.push({
      id: r.id,
      parent: r.parent,
      kind: r.kind,
      label: LABEL[r.kind],
      from: r.from,
      to,
      days: r.days,
      ratePct: segs[0].ratePct,
      work: r.work,
      daily: segs[0]?.daily ?? 0,
      amount: round2(sum(segs.map((s) => s.amount))),
      topUp: round2(sum(segs.map((s) => s.topUp))),
      note: r.note,
    });
  }
  if (topUpUsed) {
    assumptions.push({
      text: `Zasiłek niższy niż ${p.parentalAllowance} zł miesięcznie podwyższamy do tej kwoty. ZUS porównuje kwotę po zaliczce na podatek, ustawa — kwotę zasiłku; liczymy od kwoty brutto, do weryfikacji.`,
      source: "uz31",
    });
  }
  if (basisA.floorApplies || basisB?.floorApplies) {
    const wage = minimumWageOn(input.date, input.schedule);
    if (!Number.isFinite(wage)) assumptions.push({ text: "Brak płacy minimalnej dla tej daty — minimalnej podstawy nie sprawdzamy.", source: "uz45" });
  }

  const parental = periods.filter(per => per.kind === "rodzicielski").sort((a,b) => a.from.localeCompare(b.from));
  const parentalDays = { personDays: sum(parental.map(per => per.days)), calendarDays: 0 };
  let countedTo: string | undefined;
  for (const per of parental) {
    const firstNew = countedTo && countedTo >= per.from ? addDays(countedTo, 1) : per.from;
    if (firstNew > per.to) continue;
    parentalDays.calendarDays += daysBetween(firstNew, per.to) + 1;
    countedTo = per.to;
  }

  const leave = periods.filter((x) => x.kind !== "ojcowski");
  const span = leave.length
    ? (() => {
        const from = leave.reduce((a, b) => (b.from < a ? b.from : a), leave[0].from);
        const to = leave.reduce((a, b) => (b.to > a ? b.to : a), leave[0].to);
        return { from, to, days: daysBetween(from, to) + 1 };
      })()
    : null;

  // --- Terminy ---
  const deadlines: Deadline[] = [];
  if (input.variant === "815") {
    deadlines.push({
      date: addDays(birth ? input.date : placementEvent, p.averagedRequestDays),
      label: birth ? "Wniosek o zasiłek 81,5% za cały okres — do 21 dni po porodzie" : "Wniosek o zasiłek 81,5% — do 21 dni po przyjęciu dziecka",
      who: "A",
      source: "uz30a",
    });
  }
  if (!birth && input.placement && input.parentA.title === "pracownik") {
    deadlines.push({date: addDays(placementEvent, 7), label: "Wniosek do pracodawcy o urlop na warunkach urlopu macierzyńskiego", who: "A", source: "kp183"});
  }
  for (const per of periods.filter((x) => x.kind === "rodzicielski" && (x.id === "par-A" || x.id === "par-B"))) {
    const parent = per.parent === "A" ? input.parentA : input.parentB;
    if (parent?.title === "pracownik") {
      deadlines.push({ date: addDays(per.from, -21), label: "Wniosek o urlop rodzicielski do pracodawcy — co najmniej 21 dni przed", who: per.parent, source: "govParental" });
    } else {
      deadlines.push({ date: addDays(per.from, -1), label: "Wniosek do płatnika o zasiłek za okres rodzicielski przed jego rozpoczęciem", who: per.parent, source: "zusDocuments" });
    }
  }
  const pat = periods.find((x) => x.kind === "ojcowski");
  if (pat && input.parentB?.title === "pracownik") {
    deadlines.push({ date: addDays(pat.from, -7), label: "Wniosek o urlop ojcowski do pracodawcy — co najmniej 7 dni przed", who: "B", source: "kp182-3" });
  } else if (pat) {
    deadlines.push({ date: addDays(pat.from, -1), label: "Wniosek do płatnika o zasiłek za okres ojcowski przed jego rozpoczęciem", who: "B", source: "zusDocuments" });
  }
  const sup = periods.find((x) => x.kind === "uzupelniajacy");
  const matEnd = periods.filter((x) => x.kind === kindMat).reduce<string | null>((a, b) => (a && a > b.to ? a : b.to), null);
  if (sup && matEnd) {
    const employee = (sup.parent === "A" ? input.parentA : input.parentB)?.title === "pracownik";
    deadlines.push(employee
      ? { date: addDays(matEnd, -21), label: "Wniosek do pracodawcy o uzupełniający urlop macierzyński co najmniej 21 dni przed końcem macierzyńskiego", who: sup.parent, source: "kp180-2" }
      : { date: addDays(matEnd, -1), label: "Wniosek do płatnika o zasiłek za okres uzupełniający przed zakończeniem okresu macierzyńskiego", who: sup.parent, source: "zusDocuments" });
  }
  deadlines.sort((a, b) => a.date.localeCompare(b.date));

  const totalA = round2(sum(segments.filter((s) => s.parent === "A").map((s) => s.amount)));
  const totalB = round2(sum(segments.filter((s) => s.parent === "B").map((s) => s.amount)));
  return {
    ok: errors.length === 0,
    errors,
    warnings,
    assumptions,
    limits: { ...limits, maternityWeeks },
    basis: { A: basisA, B: basisB },
    periods,
    segments,
    parentalDays,
    totals: { A: totalA, B: totalB, all: round2(totalA + totalB), topUp: round2(sum(segments.map((s) => s.topUp))) },
    span,
    deadlines,
  };
}

/** Wypłaty brutto w miesiącach kalendarzowych dla każdego rodzica. */
export function monthlyPayments(result: ScenarioResult): Array<{ month: string; A: number; B: number }> {
  const map = new Map<string, { A: number; B: number }>();
  for (const s of result.segments) {
    const row = map.get(s.month) ?? { A: 0, B: 0 };
    row[s.parent] = round2(row[s.parent] + s.amount);
    map.set(s.month, row);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v }));
}

/**
 * Szacunek kwoty „na rękę”: zaliczka na PIT 12% zaokrąglona do pełnych złotych, minus 300 zł,
 * gdy złożono PIT-2 (zus.pl: odliczanie 1/12 kwoty zmniejszającej podatek). Ulgi zwalniające
 * (PIT-0) — zaliczka 0. Tylko orientacyjnie; składki zdrowotnej od zasiłku się nie pobiera.
 */
export function estimateNet(gross: number, opts: { pit2: boolean; exempt: boolean }): { advance: number; net: number } {
  if (opts.exempt || gross <= 0) return { advance: 0, net: gross };
  const advance = Math.max(0, Math.round(gross * 0.12 - (opts.pit2 ? 300 : 0)));
  return { advance, net: round2(gross - advance) };
}
