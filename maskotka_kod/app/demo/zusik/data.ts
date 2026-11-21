/**
 * Fictional data for the Zusik chat demo: Ola Lis (born 10 November 2026), her father Paweł Lis and
 * his employer Studio Lipa. Dates are ISO strings (YYYY-MM-DD). Nothing here is real personal data.
 */

export type FieldKey = "start" | "end";
export type DraftId = "ola-ojcowski" | "ola-rodzicielski";

export type DraftField = {
  value: string | null;
  /** Bumped on every write, so a retried save can tell whether the parent changed the field meanwhile. */
  version: number;
  /** Who wrote the current value. */
  source: "zusik" | "parent" | null;
};

export type Draft = {
  id: DraftId;
  title: string;
  recipient: string;
  applicant: string;
  child: string;
  kind: string;
  fields: Record<FieldKey, DraftField>;
  attachment: string | null;
  /** The month the date picker opens on (the plan places this leave in it). */
  pickerMonth: string;
};

export const FIELD_LABELS: Record<FieldKey, string> = { start: "Początek urlopu", end: "Koniec urlopu" };

export const CHILD_BIRTH = "2026-11-10";

const emptyField = (): DraftField => ({ value: null, version: 0, source: null });

export function initialDrafts(): Record<DraftId, Draft> {
  return {
    "ola-ojcowski": {
      id: "ola-ojcowski",
      title: "Wniosek o urlop ojcowski",
      recipient: "Studio Lipa",
      applicant: "Paweł Lis",
      child: "Ola Lis · ur. 10 listopada 2026",
      kind: "Urlop ojcowski · 2 tygodnie",
      fields: { start: emptyField(), end: emptyField() },
      attachment: null,
      pickerMonth: "2027-06",
    },
    "ola-rodzicielski": {
      id: "ola-rodzicielski",
      title: "Wniosek o urlop rodzicielski",
      recipient: "Studio Lipa",
      applicant: "Paweł Lis",
      child: "Ola Lis · ur. 10 listopada 2026",
      kind: "Urlop rodzicielski · 4 tygodnie",
      fields: { start: { value: "2027-01-11", version: 1, source: "parent" }, end: emptyField() },
      attachment: "Odpis aktu urodzenia.pdf",
      pickerMonth: "2027-02",
    },
  };
}

export const DRAFT_CASE: Record<DraftId, string> = {
  "ola-ojcowski": "Ola · Wniosek o urlop ojcowski",
  "ola-rodzicielski": "Ola · Wniosek o urlop rodzicielski",
};

export const STARTERS: Record<DraftId, string[]> = {
  "ola-ojcowski": ["Czego brakuje we wniosku?", "Jak poprawić datę?", "Do kogo mam go złożyć?"],
  "ola-rodzicielski": ["Czego brakuje we wniosku?", "Czym różnią się moje dwa warianty?", "Do kogo mam go złożyć?"],
};

/** RAG fragments the demo cites; `page` is the printed page, the link opens the page in the PDF file. */
export type Source = {
  id: string;
  title: string;
  publisher: string;
  year: string;
  page: string;
  quote: string;
  href: string;
};

export const SOURCES = {
  paternitySplit: {
    id: "paternitySplit",
    title: "Poradnik dla rodziców",
    publisher: "ZUS",
    year: "2026",
    page: "s. 33",
    quote: "Tata może go wykorzystać jednorazowo lub w dwóch 7-dniowych częściach.",
    href: "/demo/zusik/zrodla/poradnik#page=34",
  },
  paternityDeadline: {
    id: "paternityDeadline",
    title: "Kodeks pracy (wyciąg z przepisów), art. 182³ § 2",
    publisher: "Legalis",
    year: "materiały konkursu 2026",
    page: "s. 8",
    quote:
      "Urlop ojcowski jest udzielany na wniosek […] składany przez pracownika-ojca w terminie niekrótszym niż 7 dni przed rozpoczęciem korzystania z urlopu.",
    href: "/demo/zusik/zrodla/kodeks#page=8",
  },
} satisfies Record<string, Source>;

export type SourceId = keyof typeof SOURCES;

/** Calculator comparison from SPEC-PO-LOGOWANIU.md ("Przykład do makiety i odbioru") and TECH-SPEC-AGENT.md. */
export const COMPARISON = {
  assumptions:
    "Założenia: po 28 dni urlopu rodzicielskiego, stawki 140 zł i 105 zł brutto dziennie, bez pracy w trakcie urlopu.",
  columns: ["A · kolejno, bez przerwy", "B · razem od tego samego dnia"],
  rows: [
    { label: "Okres · Marta", values: ["11.01–07.02.2027", "11.01–07.02.2027"] },
    { label: "Okres · Paweł", values: ["08.02–07.03.2027", "11.01–07.02.2027"] },
    { label: "Dni z opieką nad Olą", values: ["56, w tym 0 razem", "28, wszystkie razem"] },
    { label: "Zasiłek Marty (28 × 140 zł)", values: ["3 920 zł", "3 920 zł"] },
    { label: "Zasiłek Pawła (28 × 105 zł)", values: ["2 940 zł", "2 940 zł"] },
    { label: "Łącznie brutto", values: ["6 860 zł", "6 860 zł"] },
  ],
  difference:
    "Przy wspólnym rozpoczęciu spędzicie razem 4 tygodnie. Łączna kwota zasiłku za wybrane okresy pozostaje taka sama.",
};

const MONTHS = [
  "stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
  "lipca", "sierpnia", "września", "października", "listopada", "grudnia",
];
export const MONTH_NAMES = [
  "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
  "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień",
];

/** "2027-06-18" → "18 czerwca 2027" (or "18 czerwca" without the year). */
export function formatDate(iso: string | null, withYear = true): string {
  if (!iso) return "brak daty";
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]}${withYear ? ` ${y}` : ""}`;
}

export function addDays(iso: string, days: number): string {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export const toIso = (year: number, month: number, day: number) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

/**
 * Finds a date in the parent's words: "17 czerwca 2027", "17.06.2027", "18 czerwca", "18.06".
 * The year is null when the parent did not give one.
 */
export function parseDate(text: string): { day: number; month: number; year: number | null } | null {
  const lower = text.toLowerCase();
  const named = lower.match(
    /(\d{1,2})\s+(stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia)(?:\s+(\d{4}))?/,
  );
  if (named) return { day: Number(named[1]), month: MONTHS.indexOf(named[2]) + 1, year: named[3] ? Number(named[3]) : null };
  const numeric = lower.match(/\b(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?\b/);
  if (numeric) return { day: Number(numeric[1]), month: Number(numeric[2]), year: numeric[3] ? Number(numeric[3]) : null };
  return null;
}
