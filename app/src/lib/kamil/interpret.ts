import { z } from "zod";
import { MONTHS_GEN, addDays, isValidIso } from "../rules/dates";
import { normalize } from "../ocr/birth-certificate";

/**
 * Facts found in one message from Kamil. The deterministic parser runs first; the model
 * (Bielik) may fill gaps, but code validates every date and decides what it means.
 */
export interface Interpretation {
  startDate: string | null;
  days: 7 | 14 | null;
  birthDate: string | null;
  reminderDate: string | null;
  /** Answer to the last yes/no question. */
  yesNo: "tak" | "nie" | null;
  priorPart: { start: string; end: string } | null;
  asksEligibility: boolean;
  wantsDraft: boolean;
  wantsSend: boolean;
  source: "rules" | "rules+model";
}

export const EMPTY: Interpretation = {
  startDate: null,
  days: null,
  birthDate: null,
  reminderDate: null,
  yesNo: null,
  priorPart: null,
  asksEligibility: false,
  wantsDraft: false,
  wantsSend: false,
  source: "rules",
};

const MONTH_STEMS = MONTHS_GEN.map((m) => normalize(m).slice(0, 4));

interface FoundDate {
  iso: string;
  index: number;
}

/** "8 grudnia", "8 grudnia 2026", "08.12", "08.12.2026", "8.12.2026 r." */
export function findDates(text: string, today: string, direction: "future" | "past"): FoundDate[] {
  const n = normalize(text);
  const found: FoundDate[] = [];
  const pick = (d: number, m: number, y: number | null, index: number) => {
    const year = y ?? Number(today.slice(0, 4));
    let iso = `${year}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (!isValidIso(iso)) return;
    if (y === null) {
      // No year: the nearest such day in the expected direction.
      if (direction === "future" && iso < today) iso = `${year + 1}${iso.slice(4)}`;
      if (direction === "past" && iso > today) iso = `${year - 1}${iso.slice(4)}`;
      if (!isValidIso(iso)) return;
    }
    found.push({ iso, index });
  };
  for (const m of n.matchAll(/\b(\d{1,2}) ([a-z]{4,})(?: (\d{4}))?/g)) {
    const month = MONTH_STEMS.indexOf(m[2].slice(0, 4)) + 1;
    if (month > 0) pick(Number(m[1]), month, m[3] ? Number(m[3]) : null, m.index ?? 0);
  }
  for (const m of text.matchAll(/\b(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?\b/g)) {
    pick(Number(m[1]), Number(m[2]), m[3] ? Number(m[3]) : null, m.index ?? 0);
  }
  return found.sort((a, b) => a.index - b.index);
}

/** A question about the current form must never be interpreted as a new date or declaration. */
export function asksAboutSources(text: string): boolean {
  const q = normalize(text);
  if (/\bskad\b/.test(q) && !/\bskad (pobrac|sciagnac|wziac) (druk|formularz|wniosek)\b/.test(q)) {
    return /\b(dane|danych|informacj|wiesz|masz|pochodz|okres|termin|dat[ay]|pesel|nip|adres|nazwisk|imie|formularz|wniosek)/.test(q);
  }
  return /^(?:(?:podaj|pokaz|wskaz) (?:mi )?|jakie (?:(?:jest|sa) )?)(?:zrodlo|zrodla)\b|^z jakiego zrodla\b/.test(q);
}

/** Rule-based reading of one message. `asked` = what Zusik asked last. */
export function parseMessage(text: string, today: string, asked: string | null): Interpretation {
  const n = normalize(text);
  const out: Interpretation = { ...EMPTY };

  if (/\b(dwa|2|oba) tygodni|\b14 dni\b|caly okres|cale dwa/.test(n)) out.days = 14;
  else if (/\btydzien\b|\b7 dni\b|\bjeden tydz/.test(n)) out.days = 7;

  out.asksEligibility = /przysluguje|naleze? mi|czy dostane|wyplat|zasilek|czy moge/.test(n);
  out.wantsDraft = /przygotuj|wypelnij|zrob wniosek|generuj|stworz wniosek|szkic/.test(n);
  out.wantsSend = /\bwyslij|\bzloz (go|wniosek)/.test(n);

  const reminderAt = n.search(/przypom/);
  const birthAt = n.search(/urodzi|urodzen|urodzin/);
  const usedAt = n.search(/wykorzysta|bralem|wzialem|mialem juz/);

  if (reminderAt >= 0) {
    const date = findDates(text, today, "future")[0];
    if (date) out.reminderDate = date.iso;
  } else if (birthAt >= 0) {
    const date = findDates(text, today, "past")[0];
    if (date) out.birthDate = date.iso;
  } else if (usedAt >= 0) {
    const date = findDates(text, today, "past")[0];
    if (date) out.priorPart = { start: date.iso, end: addDays(date.iso, (out.days ?? 7) - 1) };
    out.days = null;
  } else if (asked === "child_birth_date" && !/\bod\b/.test(n)) {
    // Answer to "Kiedy urodził się syn?" is a past date, not a start.
    const past = findDates(text, today, "past")[0];
    if (past) out.birthDate = past.iso;
  } else {
    const date = findDates(text, today, "future")[0];
    if (date) out.startDate = date.iso;
  }

  const first = n.split(" ")[0];
  if (/^(nie|nigdy|zadnego|brak)$/.test(first) || /\bnie (pobieral|bralem|korzystal)/.test(n)) out.yesNo = "nie";
  else if (/^(tak|owszem|pobieralem)$/.test(first)) out.yesNo = "tak";
  return out;
}

/* ---------- optional model step (Bielik via Sherlock) ---------- */

export const modelFactsSchema = z.object({
  start_date: z.string().nullable().optional(),
  days: z.union([z.literal(7), z.literal(14)]).nullable().optional(),
  birth_date: z.string().nullable().optional(),
  reminder_date: z.string().nullable().optional(),
  yes_no: z.enum(["tak", "nie"]).nullable().optional(),
});
export type ModelFacts = z.infer<typeof modelFactsSchema>;

export const MODEL_FACTS_INSTRUCTION =
  "Wyciągnij fakty z wiadomości ojca prowadzącego działalność, który pyta o zasiłek za okres ojcowski. " +
  "Zwróć wyłącznie JSON z polami: start_date (YYYY-MM-DD, początek okresu albo null), days (7, 14 albo null), " +
  'birth_date (data urodzenia syna albo null), reminder_date (YYYY-MM-DD albo null), yes_no ("tak", "nie" albo null). ' +
  "Nie zgaduj: gdy czegoś nie ma w wiadomości, wpisz null.";

/** Bielik may wrap JSON in prose; take the first object and validate it. */
export function parseModelFacts(raw: string): ModelFacts | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try {
    const parsed = modelFactsSchema.safeParse(JSON.parse(raw.slice(start, end + 1)));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

/**
 * Model facts fill only what the rules did not find, and only dates that pass the calendar
 * check and point in the right direction (start/reminder ahead, birth behind).
 */
export function mergeModelFacts(rules: Interpretation, model: ModelFacts | null, today: string): Interpretation {
  if (!model) return rules;
  const date = (v: string | null | undefined) => (v && isValidIso(v) ? v : null);
  const merged = { ...rules };
  let used = false;
  const start = date(model.start_date);
  if (!merged.startDate && !merged.reminderDate && !merged.birthDate && start && start >= today) {
    merged.startDate = start;
    used = true;
  }
  if (!merged.days && model.days) {
    merged.days = model.days;
    used = true;
  }
  const birth = date(model.birth_date);
  if (!merged.birthDate && birth && birth <= today) {
    merged.birthDate = birth;
    used = true;
  }
  const reminder = date(model.reminder_date);
  if (!merged.reminderDate && reminder && reminder >= today) {
    merged.reminderDate = reminder;
    used = true;
  }
  if (!merged.yesNo && model.yes_no) {
    merged.yesNo = model.yes_no;
    used = true;
  }
  return used ? { ...merged, source: "rules+model" } : merged;
}
