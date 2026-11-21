import { buildZamValues } from "../forms/zam-map";
import { formatLong, formatRange, weekday } from "../rules/dates";
import { evaluatePaternity } from "../rules/paternity";
import type { AskedKey, ChatTurn, Command, Fact, FieldKey, KamilCase, KamilView, Origin, PaternityResult } from "./contract";
import { FIELD_LABELS } from "./contract";
import { EMPTY, type Interpretation } from "./interpret";
import { KAMIL_PROFILE, KAMIL_PROFILE_SOURCE } from "./profile";
import { CITATIONS, ZAM_FORM } from "./sources";

/**
 * Pure state machine of Kamil's case. The service runs it inside a LangGraph node and stores
 * the result in the checkpoint; nothing here does I/O.
 */

export interface Clock {
  now: string;
  today: string;
  newId: () => string;
}

/** A chat command after interpretation (done outside, so the reducer stays pure). */
export type Prepared =
  | Exclude<Command, { type: "chat" }>
  | (Extract<Command, { type: "chat" }> & { interpretation: Interpretation });

const MAX_OPS = 200;
const MAX_CHAT = 80;

export function newCase(): KamilCase {
  return {
    version: 0,
    dataVersion: 0,
    asked: null,
    candidates: [],
    facts: {},
    priorParts: [],
    request: null,
    conflict: null,
    draft: null,
    reminder: null,
    submission: null,
    chat: [],
    ops: [],
  };
}

const DOCUMENT_KEYS: FieldKey[] = [
  "child_first_name",
  "child_last_name",
  "child_birth_date",
  "child_birth_place",
  "mother_first_name",
  "mother_last_name",
];

export function evaluate(kase: KamilCase, today: string): PaternityResult {
  const fact = (key: FieldKey) => kase.facts[key]?.value ?? null;
  const bool = (key: FieldKey) => (fact(key) === "tak" ? true : fact(key) === "nie" ? false : null);
  return evaluatePaternity({
    childBirthDate: fact("child_birth_date"),
    insuranceConfirmed: bool("insurance_confirmed"),
    noArrears: bool("no_arrears"),
    priorParts: kase.priorParts,
    request: kase.request,
    today,
  });
}

export function toView(kase: KamilCase, today: string): KamilView {
  const result = evaluate(kase, today);
  const zam = buildZamValues({ facts: kase.facts, result }, today);
  const citationIds = new Set(result.citationIds);
  for (const turn of kase.chat) for (const id of turn.citationIds ?? []) citationIds.add(id);
  return {
    version: kase.version,
    candidates: kase.candidates,
    facts: kase.facts,
    priorParts: kase.priorParts,
    request: kase.request,
    conflict: kase.conflict,
    result,
    draft: kase.draft ? { ...kase.draft, stale: kase.draft.reviewedDataVersion !== kase.dataVersion } : null,
    zamMissing: zam.missing,
    readyForDraft: zam.periodReady && zam.missing.length === 0,
    reminder: kase.reminder,
    submission: kase.submission,
    chat: kase.chat,
    citations: [...citationIds].map((id) => CITATIONS[id]).filter(Boolean),
    form: ZAM_FORM,
    today,
  };
}

/* ---------- helpers ---------- */

function setFact(kase: KamilCase, key: FieldKey, value: string, origin: Origin, clock: Clock): KamilCase {
  const previous = kase.facts[key];
  const sameOrigin = previous && JSON.stringify(previous.origin) === JSON.stringify(origin);
  if (previous && previous.value === value && sameOrigin) return kase;
  const fact: Fact = { key, value, origin, confirmedAt: clock.now };
  return {
    ...kase,
    facts: { ...kase.facts, [key]: fact },
    candidates: kase.candidates.filter((c) => c.key !== key),
    conflict: kase.conflict?.key === key ? null : kase.conflict,
    dataVersion: kase.dataVersion + 1,
  };
}

function documentValue(kase: KamilCase, key: FieldKey): { value: string; origin: Origin } | null {
  const fact = kase.facts[key];
  if (fact?.origin.kind === "document") return { value: fact.value, origin: fact.origin };
  const candidate = kase.candidates.find((c) => c.key === key);
  return candidate ? { value: candidate.value, origin: candidate.origin } : null;
}

function say(kase: KamilCase, text: string, clock: Clock, extra: Partial<ChatTurn> = {}): KamilCase {
  const turn: ChatTurn = { id: clock.newId(), role: "zusik", text, at: clock.now, author: "template", ...extra };
  return { ...kase, chat: [...kase.chat, turn].slice(-MAX_CHAT) };
}

/** What Zusik should ask next, in scenario order. */
export function nextQuestion(kase: KamilCase, view: KamilView): { key: AskedKey; text: string } | null {
  const r = view.result;
  if (kase.conflict) return null;
  if (r.status === "needs_info" && r.question) {
    const key = r.missing[0] ?? "request_start";
    if (key === "child_birth_date") {
      return { key: "child_birth_date", text: "Dodaj odpis aktu urodzenia syna albo napisz, kiedy się urodził. Odczytam datę i dane." };
    }
    return { key, text: r.question };
  }
  if (r.status !== "eligible") return null;
  const missingDoc = view.zamMissing.filter((k) => DOCUMENT_KEYS.includes(k));
  if (missingDoc.length) {
    return {
      key: "document",
      text: `Do ZAM potrzebuję jeszcze: ${missingDoc.map((k) => FIELD_LABELS[k].toLowerCase()).join(", ")}. Dodaj odpis aktu urodzenia, odczytam te dane.`,
    };
  }
  if (!kase.facts.other_title_paternity) {
    return { key: "other_title_paternity", text: "Czy pobierałeś już z innego tytułu zasiłek za okres ojcowski na to dziecko?" };
  }
  return null;
}

function resultSentence(view: KamilView): string | null {
  const r = view.result;
  if (r.status !== "eligible" || !r.period || !r.deadline) return null;
  const part = r.partNumber === 1 ? "To pierwsza część" : "To druga, ostatnia część";
  const deadline = formatLong(r.deadline).replace(/ \d{4} r\.$/, "");
  return `Wpisuję ${formatRange(r.period.start, r.period.end)} ${part}. Złóż wniosek do ${deadline}, przed początkiem tego okresu.`;
}

export interface Reply {
  text: string;
  asked: AskedKey | null;
  citationIds: string[];
}

/** Template reply. The model may rephrase it; the numbers always come from here. */
export function composeReply(before: KamilView, after: KamilCase, view: KamilView, i: Interpretation, extra: string[]): Reply {
  const parts: string[] = [...extra];
  const r = view.result;
  if (after.conflict) {
    const c = after.conflict;
    parts.push(
      `W dokumencie ${FIELD_LABELS[c.key].toLowerCase()} to ${formatLong(c.documentValue)}, a w rozmowie podałeś ${formatLong(c.chatValue)} Której daty użyć?`,
    );
    return { text: parts.join(" "), asked: null, citationIds: [] };
  }
  if (r.status === "not_eligible") {
    const reason = r.reasons.find((x) => !x.ok);
    parts.push(`Nie mogę przygotować wniosku. ${reason?.text ?? ""}`.trim());
    return { text: parts.join(" "), asked: null, citationIds: reason?.citationId ? [reason.citationId] : [] };
  }
  const periodChanged =
    !!r.period && (before.result.period?.start !== r.period.start || before.result.period?.end !== r.period.end);
  if (i.asksEligibility && !r.period) {
    if (r.missing[0] === "insurance_confirmed") parts.push("Sprawdzę to. Najpierw jedno pytanie o ubezpieczenie.");
    else if (r.missing.some((k) => k !== "request_start" && k !== "request_days"))
      parts.push("Sprawdzę to. Potrzebuję jeszcze kilku danych.");
    else
      parts.push(
        "Tak. Przy potwierdzonych danych możesz otrzymać zasiłek za okres ojcowski: 2 tygodnie, do ukończenia przez syna 12 miesięcy. Wniosek złożysz w ZUS.",
      );
  }
  const citations: string[] = [];
  if (i.asksEligibility) citations.push("zam-info-okres");
  if (periodChanged) {
    parts.push(resultSentence(view) ?? "");
    citations.push("zus-termin-niepracownik", "zam-info-okres");
    if (after.draft) parts.push("Szkic ZAM ma nowe daty. Sprawdź podgląd przed pobraniem.");
  }
  const next = nextQuestion(after, view);
  if (next) parts.push(next.text);
  else if (r.status === "eligible" && view.readyForDraft && !after.draft) {
    parts.push(
      `Gotowe do sprawdzenia. ZAM, ${r.partNumber === 1 ? "pierwsza" : "druga"} część, ${r.period?.days === 7 ? "siedem" : "czternaście"} dni, odbiorca ZUS. Otwórz podgląd.`,
    );
  }
  if (parts.length === 0) parts.push("Zapisane.");
  return { text: parts.filter(Boolean).join(" "), asked: next?.key ?? null, citationIds: [...new Set(citations)] };
}

/* ---------- reducer ---------- */

export interface ApplyOutcome {
  kase: KamilCase;
  rejected?: "no_conflict" | "not_ready" | "reminder_out_of_range" | "draft_not_reviewed";
}

export function applyCommand(input: KamilCase, command: Prepared, clock: Clock): ApplyOutcome {
  if (input.ops.includes(command.opKey)) return { kase: input };
  const before = toView(input, clock.today);
  let kase: KamilCase = input;
  let rejected: ApplyOutcome["rejected"];

  switch (command.type) {
    case "reset":
      kase = { ...newCase(), version: input.version, ops: input.ops };
      break;

    case "load_profile": {
      for (const [key, value] of Object.entries(KAMIL_PROFILE) as [FieldKey, string][]) {
        if (!kase.facts[key]) kase = setFact(kase, key, value, { kind: "profile", source: KAMIL_PROFILE_SOURCE }, clock);
      }
      break;
    }

    case "set_candidates": {
      kase = { ...kase, candidates: command.candidates };
      // A value Kamil gave in the chat that the document contradicts → ask which one to use.
      for (const c of command.candidates) {
        const fact = kase.facts[c.key];
        if (fact?.origin.kind === "chat" && fact.value !== c.value && !c.needsReview) {
          kase = { ...kase, conflict: { key: c.key, documentValue: c.value, chatValue: fact.value, chatQuote: fact.origin.quote } };
          kase = say(kase, composeReply(before, kase, toView(kase, clock.today), EMPTY, []).text, clock);
        }
      }
      break;
    }

    case "confirm": {
      const candidate = kase.candidates.find((c) => c.key === command.key);
      let origin = command.origin;
      if (origin.kind === "document" && candidate && candidate.value !== command.value) {
        // Kamil corrected the value read from the document.
        origin = { kind: "user_edit", previous: candidate.value };
      }
      if (origin.kind === "user_edit") {
        const known = kase.facts[command.key];
        const source = candidate?.origin ?? known?.origin;
        const place =
          source?.kind === "document" || (source?.kind === "user_edit" && source.box)
            ? { page: source.page, box: source.box }
            : {};
        origin = { ...origin, previous: origin.previous ?? known?.value ?? candidate?.value ?? null, ...place };
      }
      kase = setFact(kase, command.key, command.value, origin, clock);
      break;
    }

    case "resolve_conflict": {
      const conflict = kase.conflict;
      if (!conflict || conflict.key !== command.key) {
        rejected = "no_conflict";
        break;
      }
      const doc = documentValue(kase, conflict.key);
      kase =
        command.pick === "document" && doc
          ? setFact(kase, conflict.key, doc.value, doc.origin, clock)
          : setFact(kase, conflict.key, conflict.chatValue, { kind: "chat", quote: conflict.chatQuote }, clock);
      kase = { ...kase, conflict: null };
      const chosen = command.pick === "document" ? (doc?.value ?? conflict.documentValue) : conflict.chatValue;
      const reply = composeReply(before, kase, toView(kase, clock.today), EMPTY, [
        `Zapisuję ${formatLong(chosen)} (${command.pick === "document" ? "z dokumentu" : "z rozmowy"}).`,
      ]);
      kase = say({ ...kase, asked: reply.asked }, reply.text, clock, { citationIds: reply.citationIds });
      break;
    }

    case "chat": {
      const i = command.interpretation;
      kase = {
        ...kase,
        chat: [...kase.chat, { id: clock.newId(), role: "kamil" as const, text: command.text, at: clock.now }].slice(-MAX_CHAT),
      };
      const extra: string[] = [];
      const quote = command.text.slice(0, 600);

      if (i.birthDate) {
        const doc = documentValue(kase, "child_birth_date");
        if (doc && doc.value !== i.birthDate) {
          kase = { ...kase, conflict: { key: "child_birth_date", documentValue: doc.value, chatValue: i.birthDate, chatQuote: quote } };
        } else if (!doc) {
          kase = setFact(kase, "child_birth_date", i.birthDate, { kind: "chat", quote }, clock);
        }
      }
      const prior = i.priorPart;
      if (prior && !kase.priorParts.some((p) => p.start === prior.start)) {
        kase = { ...kase, priorParts: [...kase.priorParts, prior], dataVersion: kase.dataVersion + 1 };
      }
      if (i.startDate || i.days) {
        const request = { start: i.startDate ?? kase.request?.start ?? null, days: i.days ?? kase.request?.days ?? null };
        kase = { ...kase, request, dataVersion: kase.dataVersion + 1 };
      }
      const yesNoKeys: FieldKey[] = ["other_title_paternity", "insurance_confirmed", "no_arrears"];
      if (i.yesNo && kase.asked && yesNoKeys.includes(kase.asked as FieldKey)) {
        const key = kase.asked as FieldKey;
        kase = setFact(kase, key, i.yesNo, { kind: "chat", quote }, clock);
        if (key === "other_title_paternity") {
          extra.push(
            i.yesNo === "nie"
              ? "Zapisuję w oświadczeniu: nie pobierałeś."
              : "Zapisuję: pobierałeś. W ZAM trzeba podać tytuł i okres pobierania.",
          );
        }
      }
      let view = toView(kase, clock.today);
      if (i.reminderDate) {
        const deadline = view.result.deadline;
        if (!deadline) extra.push("Przypomnienie ustawię, gdy będzie znany termin złożenia.");
        else if (i.reminderDate > deadline)
          extra.push(`${formatLong(i.reminderDate)} to już po terminie złożenia (${formatLong(deadline)}). Wybierz wcześniejszy dzień.`);
        else {
          kase = { ...kase, reminder: { date: i.reminderDate, setAt: clock.now } };
          extra.push(
            `Przypomnienie: ${weekday(i.reminderDate)}, ${formatLong(i.reminderDate)} Ostatni dzień na złożenie: ${weekday(deadline)}, ${formatLong(deadline)} Sam zapis szkicu nie oznacza, że wniosek dotarł do ZUS.`,
          );
        }
      }
      if (i.wantsDraft) {
        if (view.readyForDraft) kase = upsertDraft(kase, clock);
        else extra.push("Szkic przygotuję, gdy będą potwierdzone wszystkie dane.");
      }
      if (i.wantsSend) {
        extra.push("Wysyłkę uruchamia przycisk „Wyślij w symulacji” pod podglądem. To tylko symulacja, nic nie trafia do ZUS.");
      }
      view = toView(kase, clock.today);
      const reply = composeReply(before, kase, view, i, extra);
      kase = say({ ...kase, asked: reply.asked }, reply.text, clock, { citationIds: reply.citationIds });
      break;
    }

    case "create_draft": {
      if (!toView(kase, clock.today).readyForDraft) {
        rejected = "not_ready";
        break;
      }
      kase = upsertDraft(kase, clock);
      break;
    }

    case "set_reminder": {
      const deadline = toView(kase, clock.today).result.deadline;
      if (command.date === null) kase = { ...kase, reminder: null };
      else if (!deadline || command.date > deadline || command.date < clock.today) rejected = "reminder_out_of_range";
      else kase = { ...kase, reminder: { date: command.date, setAt: clock.now } };
      break;
    }

    case "simulate_submit": {
      const view = toView(kase, clock.today);
      if (!kase.draft || view.draft?.stale || view.result.status !== "eligible" || !view.result.deadline) {
        rejected = "draft_not_reviewed";
        break;
      }
      if (kase.submission?.draftVersion === kase.draft.version) break; // this draft is already "sent"
      kase = { ...kase, submission: { simulated: true, at: clock.now, draftVersion: kase.draft.version } };
      kase = say(
        kase,
        `Symulacja: ZAM oznaczony jako przekazany ${formatLong(clock.today)} Nic nie zostało wysłane do ZUS. W prawdziwej sprawie złóż go przez PUE/eZUS albo w placówce do ${formatLong(view.result.deadline)}`,
        clock,
      );
      break;
    }
  }

  if (rejected) return { kase: input, rejected };
  return { kase: { ...kase, version: input.version + 1, ops: [...input.ops, command.opKey].slice(-MAX_OPS) } };
}

/** One draft per case: a repeated request re-approves the same draft instead of creating another. */
function upsertDraft(kase: KamilCase, clock: Clock): KamilCase {
  if (!kase.draft) {
    return { ...kase, draft: { id: clock.newId(), createdAt: clock.now, version: 1, reviewedDataVersion: kase.dataVersion } };
  }
  if (kase.draft.reviewedDataVersion === kase.dataVersion) return kase;
  return { ...kase, draft: { ...kase.draft, version: kase.draft.version + 1, reviewedDataVersion: kase.dataVersion } };
}
