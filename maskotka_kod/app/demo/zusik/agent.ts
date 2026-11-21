/**
 * Zusik's scripted replies for the demo (no language model is called). Every reply is planned from the
 * parent's words and the CURRENT state of the draft, so a manual change in the form is always taken
 * into account. Zusik asks for one missing piece of information at a time.
 */

import type { ZusikState } from "@/components/mascot/types";
import { CHILD_BIRTH, FIELD_LABELS, addDays, formatDate, parseDate, toIso, type Draft, type FieldKey, type SourceId } from "./data";

/** One piece of an answer, revealed in order while the answer streams. */
export type Segment =
  | { kind: "p"; text: string; cite?: SourceId }
  | { kind: "question"; text: string; datePicker?: FieldKey }
  /** The outcome of the field save of this message (annotation, error or the parent's own change). */
  | { kind: "save" }
  /** "⚑ Złóż wniosek do …", computed from the start date in the draft. */
  | { kind: "deadline" }
  /** Mini plan of the case: the parent's next steps, ticked from the draft's real state. */
  | { kind: "plan" }
  /** Calculator comparison: a skeleton first, then the table, in the same place. */
  | { kind: "table" };

export type SaveRecord = {
  field: FieldKey;
  from: string | null;
  to: string;
  status: "saving" | "saved" | "failed" | "retrying" | "manual";
  /** The field's version when the save failed; a retry only applies to that same version. */
  versionAtFail?: number;
};

export type UserMessage = { id: string; role: "user"; text: string; files: string[] };

export type AssistantMessage = {
  id: string;
  role: "assistant";
  /** What Zusik is doing; drives the mascot and the collapsed progress line. */
  activity: ZusikState;
  steps: string[];
  segments: Segment[];
  /** How many characters of the text segments are shown; every other segment counts as one. */
  revealed: number;
  status: "working" | "streaming" | "done" | "stopped" | "disconnected";
  tableReady?: boolean;
  save?: SaveRecord;
  suggestions: string[];
  /** The note under a stopped answer, e.g. "Zatrzymano odpowiedź · Sprawdzam zapis daty…". */
  stopNote?: string;
};

export type Message = UserMessage | AssistantMessage;

/** What Zusik is waiting for in this conversation. */
export type Pending = { field?: FieldKey; date?: string; askYear?: boolean } | null;

export type Plan =
  | {
      type: "answer";
      activity: "reading" | "searching" | "calculating" | "checking";
      steps: string[];
      segments: Segment[];
      suggestions: string[];
      pending: Pending;
    }
  | { type: "save"; field: FieldKey; value: string }
  | { type: "attach"; name: string };

export const segmentUnits = (segment: Segment) =>
  segment.kind === "p" || segment.kind === "question" ? segment.text.length : 1;

export const totalUnits = (segments: Segment[]) => segments.reduce((sum, s) => sum + segmentUnits(s), 0);

const LAST_PATERNITY_DAY = "2027-11-10"; // urlop ojcowski: do ukończenia przez dziecko 12 miesięcy

function mentionedField(lower: string): FieldKey | null {
  if (/początk|począt|zaczą|zaczy|od kiedy|od którego/.test(lower)) return "start";
  if (/koni|końc|zakończ|do kiedy|do którego/.test(lower)) return "end";
  return null;
}

/** The first thing still missing in the draft, as Zusik's next question. */
export function nextQuestion(draft: Draft): { segment: Segment; pending: Pending; suggestions: string[] } {
  if (!draft.fields.start.value)
    return {
      segment: { kind: "question", text: "Od którego dnia chcesz zacząć urlop?", datePicker: "start" },
      pending: { field: "start" },
      suggestions: ["Ile trwa urlop ojcowski?", "Czy mogę podzielić urlop ojcowski?"],
    };
  if (!draft.fields.end.value)
    return {
      segment: { kind: "question", text: "Do którego dnia chcesz wziąć urlop?", datePicker: "end" },
      pending: { field: "end" },
      suggestions: ["Jak wybrać datę końca?", "Czego jeszcze brakuje?"],
    };
  if (!draft.attachment)
    return {
      segment: { kind: "question", text: "Dołączysz odpis aktu urodzenia Oli? Użyj spinacza w polu wiadomości." },
      pending: null,
      suggestions: ["Skąd ten termin?", "Do kogo mam go złożyć?"],
    };
  return {
    segment: { kind: "question", text: "Wniosek jest kompletny. Sprawdzisz go przed zatwierdzeniem?" },
    pending: null,
    suggestions: ["Skąd ten termin?", "Do kogo mam go złożyć?"],
  };
}

const answer = (
  activity: "reading" | "searching" | "calculating" | "checking",
  steps: string[],
  segments: Segment[],
  suggestions: string[],
  pending: Pending = null,
): Plan => ({ type: "answer", activity, steps, segments, suggestions, pending });

/** Plans Zusik's reply to the parent's message. */
export function planReply(text: string, files: string[], draft: Draft, pending: Pending): Plan {
  const lower = text.toLowerCase().trim();
  if (files.length > 0 && !draft.attachment) return { type: "attach", name: files[0] };

  const date = parseDate(text);
  const field = mentionedField(lower);

  // the parent answers "which date?" with the field only
  if (!date && field && pending?.date) return { type: "save", field, value: pending.date };

  if (date) {
    const target = field ?? pending?.field ?? null;
    const year = date.year ?? (target && draft.fields[target].value ? Number(draft.fields[target].value!.slice(0, 4)) : null);
    if (!target) {
      const iso = year ? toIso(year, date.month, date.day) : undefined;
      return answer("checking", ["Sprawdzam datę…"], [
        { kind: "p", text: `Podano datę ${formatDate(iso ?? toIso(2027, date.month, date.day), Boolean(year))}.` },
        { kind: "question", text: "Którą datę mam zmienić: początek czy koniec urlopu?" },
      ], ["Początek urlopu", "Koniec urlopu"], { date: iso });
    }
    if (!year)
      return answer("checking", ["Sprawdzam datę…"], [
        { kind: "question", text: `Którego roku? Na przykład ${date.day} ${formatDate(toIso(2027, date.month, date.day)).split(" ")[1]} 2027.` },
      ], [formatDate(toIso(2027, date.month, date.day))], { field: target, askYear: true });
    const iso = toIso(year, date.month, date.day);
    if (iso <= CHILD_BIRTH || iso > LAST_PATERNITY_DAY)
      return answer("checking", ["Sprawdzam datę…"], [
        { kind: "p", text: `${formatDate(iso)} wypada poza okresem, w którym przysługuje urlop ojcowski: od narodzin Oli do 10 listopada 2027.` },
        { kind: "question", text: "Podasz inną datę?", datePicker: target },
      ], ["Ile trwa urlop ojcowski?", "Czego jeszcze brakuje?"], { field: target });
    if (target === "end" && draft.fields.start.value && iso < draft.fields.start.value)
      return answer("checking", ["Sprawdzam datę…"], [
        { kind: "p", text: `Koniec urlopu nie może wypaść przed początkiem (${formatDate(draft.fields.start.value)}).` },
        { kind: "question", text: "Do którego dnia chcesz wziąć urlop?", datePicker: "end" },
      ], ["Jak wybrać datę końca?", "Czego jeszcze brakuje?"], { field: "end" });
    return { type: "save", field: target, value: iso };
  }

  // the parent asks for the value that is in the draft now
  if (field && /jak(a|i|ą)|kiedy|aktualn|teraz|wpisan|\?/.test(lower) && !/jak (wybrać|poprawić|zmienić)/.test(lower)) {
    const current = draft.fields[field];
    const who = current.source === "parent" ? " Tę wartość wpisałeś sam." : "";
    return answer("reading", ["Sprawdzam Twój szkic"], [
      {
        kind: "p",
        text: current.value
          ? `W szkicu jest teraz: ${FIELD_LABELS[field]} — ${formatDate(current.value)}.${who}`
          : `Pole „${FIELD_LABELS[field]}” jest jeszcze puste.`,
      },
      ...(current.value ? [] : [nextQuestion(draft).segment]),
    ], ["Czego jeszcze brakuje?", "Skąd ten termin?"], current.value ? null : nextQuestion(draft).pending);
  }

  if (/podziel|części|dwa razy/.test(lower))
    return answer("searching", ["Szukam w materiałach ZUS", "Sprawdzam Twój szkic"], [
      { kind: "p", text: "Tak. Urlop ojcowski trwa 2 tygodnie i możesz wziąć go od razu albo w dwóch tygodniowych częściach.", cite: "paternitySplit" },
      { kind: "p", text: "Każdą część zgłaszasz pracodawcy osobnym wnioskiem, co najmniej 7 dni przed jej początkiem." },
      { kind: "deadline" },
      { kind: "plan" },
    ], ["Czym różnią się moje dwa warianty?", "Skąd ten termin?"]);

  if (/wariant|różni/.test(lower))
    return answer("calculating", ["Liczę w kalkulatorze", "Porównuję warianty"], [
      { kind: "p", text: "Porównałem oba warianty urlopu rodzicielskiego Marty i Pawła z kalkulatora." },
      { kind: "table" },
      { kind: "p", text: "Różnica dotyczy czasu: w wariancie A ktoś z Was jest z Olą dwa razy dłużej, w wariancie B jesteście razem." },
    ], ["Skąd ta kwota?", "Czego jeszcze brakuje?"]);

  if (/brakuje|czego jeszcze/.test(lower)) {
    const missing = [
      !draft.fields.start.value && "początku urlopu",
      !draft.fields.end.value && "końca urlopu",
      !draft.attachment && "odpisu aktu urodzenia Oli",
    ].filter(Boolean);
    const next = nextQuestion(draft);
    return answer("reading", ["Sprawdzam Twój szkic"], [
      { kind: "p", text: missing.length ? `Masz już dane pracodawcy i Oli. Brakuje ${missing.join(", ")}.` : "Wszystkie pola są uzupełnione." },
      { kind: "plan" },
      next.segment,
    ], next.suggestions, next.pending);
  }

  if (/termin|do kiedy złożyć|skąd/.test(lower)) {
    if (!draft.fields.start.value) {
      const next = nextQuestion(draft);
      return answer("reading", ["Sprawdzam Twój szkic"], [
        { kind: "p", text: "Termin złożenia liczymy od początku urlopu, a tej daty jeszcze nie ma w szkicu." },
        next.segment,
      ], next.suggestions, next.pending);
    }
    return answer("searching", ["Szukam w przepisach"], [
      { kind: "p", text: "Wniosek o urlop ojcowski składasz co najmniej 7 dni przed jego początkiem." },
      { kind: "deadline" },
    ], ["Czy mogę podzielić urlop ojcowski?", "Czego jeszcze brakuje?"]);
  }

  if (/do kogo|złożyć|gdzie/.test(lower))
    return answer("reading", ["Sprawdzam Twój szkic"], [
      { kind: "p", text: `Ten wniosek składasz u swojego pracodawcy, w ${draft.recipient}. Nie wysyłasz go do ZUS.` },
      ...(draft.fields.start.value ? [{ kind: "deadline" } as Segment] : [nextQuestion(draft).segment]),
    ], ["Czego jeszcze brakuje?", "Czy mogę podzielić urlop ojcowski?"], draft.fields.start.value ? null : nextQuestion(draft).pending);

  if (/jak (wybrać|ustalić).*kon|datę końca|koniec/.test(lower) && draft.fields.start.value) {
    const end = addDays(draft.fields.start.value, 13);
    return answer("checking", ["Liczę dni urlopu"], [
      { kind: "p", text: `Urlop ojcowski w jednej części trwa 14 dni. Przy początku ${formatDate(draft.fields.start.value)} ostatni dzień to ${formatDate(end)}.` },
      { kind: "question", text: "Mam wpisać tę datę jako koniec urlopu?", datePicker: "end" },
    ], [`Koniec urlopu: ${formatDate(end)}`, "Czy mogę podzielić urlop ojcowski?"], { field: "end", date: end });
  }

  if (/jak poprawić|zmienić dat|poprawić dat/.test(lower)) {
    const target: FieldKey = draft.fields.start.value ? "start" : "start";
    return answer("reading", ["Sprawdzam Twój szkic"], [
      { kind: "p", text: "Napisz nową datę, np. „Popraw początek urlopu na 18 czerwca”, albo wybierz „Zmień” przy polu w formularzu." },
      { kind: "question", text: "Którą datę chcesz ustawić?", datePicker: target },
    ], ["Czego jeszcze brakuje?", "Skąd ten termin?"], { field: target });
  }

  if (/ile trwa/.test(lower))
    return answer("searching", ["Szukam w materiałach ZUS"], [
      { kind: "p", text: "Urlop ojcowski trwa 2 tygodnie. Możesz go wykorzystać do ukończenia przez Olę 12 miesięcy.", cite: "paternitySplit" },
      nextQuestion(draft).segment,
    ], nextQuestion(draft).suggestions, nextQuestion(draft).pending);

  if (/tak|pomóż|zaczynamy/.test(lower)) {
    const next = nextQuestion(draft);
    return answer("reading", ["Czytam szkic wniosku"], [
      { kind: "p", text: "Masz już wpisane dane pracodawcy i Oli." },
      next.segment,
    ], next.suggestions, next.pending);
  }

  return answer("reading", ["Sprawdzam Twój szkic"], [
    { kind: "p", text: "Pomogę Ci z tym wnioskiem: daty urlopu, załącznik i termin złożenia." },
    nextQuestion(draft).segment,
  ], nextQuestion(draft).suggestions, nextQuestion(draft).pending);
}

/** The answer after a field save, built from the save's outcome and the draft after it. */
export function afterSave(draft: Draft, save: SaveRecord): { segments: Segment[]; suggestions: string[]; pending: Pending } {
  const label = FIELD_LABELS[save.field].toLowerCase();
  if (save.status !== "saved")
    return {
      segments: [{ kind: "save" }],
      suggestions: ["Czego jeszcze brakuje?", "Skąd ten termin?"],
      pending: { field: save.field },
    };
  const verb = save.from ? "Zmieniłem" : "Zapisałem";
  const next = nextQuestion(draft);
  return {
    segments: [{ kind: "p", text: `✓ ${verb} ${label} na ${formatDate(save.to)}.` }, { kind: "save" }, next.segment],
    suggestions: next.suggestions,
    pending: next.pending,
  };
}
