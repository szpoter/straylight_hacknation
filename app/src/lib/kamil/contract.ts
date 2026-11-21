import { z } from "zod";

/**
 * Contract of Kamil's case (scenario 2 in TECH-SPEC-AGENT.md): a self-employed father asks for
 * maternity benefit for the paternity-leave period and prepares ZAM for ZUS.
 *
 * In: confirmed facts (value + origin). Out: KamilView (rule result, draft, deadline, reminder).
 * The browser never sends a thread id; the server binds the case to the signed session.
 */

export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD");

/** Every field the module accepts. Grouped by ZAM section. */
export const FIELD_KEYS = [
  // Wnioskodawca (Kamil)
  "father_pesel",
  "father_first_name",
  "father_last_name",
  "father_street",
  "father_house",
  "father_flat",
  "father_postcode",
  "father_city",
  // Płatnik składek (Kamil's own business)
  "payer_nip",
  "payer_regon",
  "payer_name",
  // Rachunek
  "bank_account",
  // Dziecko (from the birth-certificate document)
  "child_first_name",
  "child_last_name",
  "child_birth_date",
  "child_birth_place",
  "child_pesel",
  // Drugi rodzic
  "mother_first_name",
  "mother_last_name",
  "mother_pesel",
  // Fakty do reguły
  "insurance_confirmed",
  "no_arrears",
  "other_title_paternity",
] as const;
export type FieldKey = (typeof FIELD_KEYS)[number];
export const fieldKey = z.enum(FIELD_KEYS);

export const FIELD_LABELS: Record<FieldKey, string> = {
  father_pesel: "PESEL ojca",
  father_first_name: "Imię ojca",
  father_last_name: "Nazwisko ojca",
  father_street: "Ulica",
  father_house: "Numer domu",
  father_flat: "Numer lokalu",
  father_postcode: "Kod pocztowy",
  father_city: "Miejscowość",
  payer_nip: "NIP płatnika",
  payer_regon: "REGON płatnika",
  payer_name: "Nazwa płatnika",
  bank_account: "Rachunek bankowy",
  child_first_name: "Imię dziecka",
  child_last_name: "Nazwisko dziecka",
  child_birth_date: "Data urodzenia dziecka",
  child_birth_place: "Miejsce urodzenia dziecka",
  child_pesel: "PESEL dziecka",
  mother_first_name: "Imię matki",
  mother_last_name: "Nazwisko matki",
  mother_pesel: "PESEL matki",
  insurance_confirmed: "Dobrowolne ubezpieczenie chorobowe",
  no_arrears: "Brak zaległości w składkach",
  other_title_paternity: "Zasiłek za okres ojcowski z innego tytułu",
};

/** Normalised box on a page: fractions of width/height, origin top-left. */
export const box = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  w: z.number().min(0).max(1),
  h: z.number().min(0).max(1),
});
export type Box = z.infer<typeof box>;

/** Where a value came from. The document itself never leaves the browser; only this reference does. */
export const origin = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("document"),
    /** pdf_text: PDF text layer · ocr: Tesseract on a scan or a PDF without text */
    method: z.enum(["pdf_text", "ocr"]),
    fileName: z.string().max(200),
    page: z.number().int().min(1),
    box,
    /** Raw text read from the document, before normalisation. */
    read: z.string().max(200),
    confidence: z.number().min(0).max(100),
  }),
  z.object({ kind: z.literal("chat"), quote: z.string().max(600) }),
  z.object({ kind: z.literal("profile"), source: z.string().max(120) }),
  z.object({
    kind: z.literal("user_edit"),
    previous: z.string().max(200).nullable(),
    /** Page and place of the corrected document value, so the crop stays next to the correction. */
    page: z.number().int().min(1).optional(),
    box: box.optional(),
  }),
]);
export type Origin = z.infer<typeof origin>;

/** Candidate read from the document, waiting for Kamil's decision. */
export const candidate = z.object({
  key: fieldKey,
  value: z.string().max(200),
  origin,
  needsReview: z.boolean(),
  reason: z.string().max(200).nullable(),
});
export type Candidate = z.infer<typeof candidate>;

export interface Fact {
  key: FieldKey;
  value: string;
  origin: Origin;
  confirmedAt: string;
}

export interface Conflict {
  key: FieldKey;
  documentValue: string;
  chatValue: string;
  chatQuote: string;
}

/** Kamil may give the length before the date ("przez tydzień"), so both parts are optional. */
export interface LeaveRequest {
  start: string | null;
  days: 7 | 14 | null;
}

export interface Reminder {
  date: string;
  setAt: string;
}

export interface Submission {
  /** Demo only. Nothing is sent to ZUS. */
  simulated: true;
  at: string;
  draftVersion: number;
}

export interface ChatTurn {
  id: string;
  role: "kamil" | "zusik";
  text: string;
  at: string;
  /** Answer turns carry the official fragments they rely on. */
  citationIds?: string[];
  /** Who wrote the answer text: the model, or the template when the model failed validation. */
  author?: "model" | "template";
}

/** A part of paternity leave used before this application. */
export interface PriorPart {
  start: string;
  end: string;
}

/** Persisted case. Lives in the LangGraph checkpoint of the session's thread. */
export interface KamilCase {
  /** Bumped by every applied command; the browser sends it back as expectedVersion. */
  version: number;
  /** Bumped only when facts, the request or earlier parts change. A draft older than this needs review. */
  dataVersion: number;
  /** What Zusik asked last, so a bare "tak"/"nie" can be attributed. */
  asked: AskedKey | null;
  candidates: Candidate[];
  facts: Partial<Record<FieldKey, Fact>>;
  priorParts: PriorPart[];
  request: LeaveRequest | null;
  conflict: Conflict | null;
  /** One draft per case. `reviewedDataVersion` = dataVersion when Kamil last approved the preview. */
  draft: { id: string; createdAt: string; version: number; reviewedDataVersion: number } | null;
  reminder: Reminder | null;
  submission: Submission | null;
  chat: ChatTurn[];
  /** Applied operation keys (idempotency), newest last, capped. */
  ops: string[];
}

/* ---------- rule result (computed by code, explained by the model) ---------- */

export type RuleStatus = "eligible" | "needs_info" | "not_eligible";
export type MissingKey = FieldKey | "request_start" | "request_days";
export type AskedKey = MissingKey | "document";

export interface RuleReason {
  ruleId: string;
  ok: boolean;
  text: string;
  citationId: string | null;
}

export interface PaternityResult {
  status: RuleStatus;
  /** Facts the rule still needs, in the order the chat asks for them. */
  missing: MissingKey[];
  question: string | null;
  period: { start: string; end: string; days: number } | null;
  partNumber: 1 | 2 | null;
  daysUsedBefore: number;
  daysLeftAfter: number | null;
  /** Last day the period may last: the day before the child turns 12 months. */
  lastAllowedDay: string | null;
  /** Last day to file ZAM: the day before the period starts. */
  deadline: string | null;
  deadlinePassed: boolean;
  reasons: RuleReason[];
  citationIds: string[];
  rulesVersion: string;
}

export interface Citation {
  id: string;
  title: string;
  url: string;
  quote: string;
  fetchedAt: string;
}

export interface FormInfo {
  symbol: "ZAM";
  /** Date of the form update published by ZUS. */
  version: string;
  sha256: string;
  sourceUrl: string;
  /** Same-origin copy the browser fills. */
  templatePath: string;
}

/** Everything the screen needs. Never contains the document image. */
export interface KamilView {
  version: number;
  candidates: Candidate[];
  facts: Partial<Record<FieldKey, Fact>>;
  priorParts: PriorPart[];
  request: LeaveRequest | null;
  conflict: Conflict | null;
  result: PaternityResult;
  draft: (NonNullable<KamilCase["draft"]> & { stale: boolean }) | null;
  /** Facts still needed for ZAM, in ZAM order. */
  zamMissing: FieldKey[];
  /** Eligible period + every ZAM fact confirmed. */
  readyForDraft: boolean;
  reminder: Reminder | null;
  submission: Submission | null;
  chat: ChatTurn[];
  citations: Citation[];
  form: FormInfo;
  today: string;
}

/* ---------- commands accepted by POST /api/kamil ---------- */

const opKey = z.string().min(8).max(64);

export const commandSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("load_profile"), opKey }),
  z.object({ type: z.literal("set_candidates"), opKey, candidates: z.array(candidate).max(30) }),
  z.object({ type: z.literal("confirm"), opKey, key: fieldKey, value: z.string().trim().min(1).max(200), origin }),
  z.object({ type: z.literal("chat"), opKey, text: z.string().trim().min(1).max(600) }),
  z.object({ type: z.literal("resolve_conflict"), opKey, key: fieldKey, pick: z.enum(["document", "chat"]) }),
  z.object({ type: z.literal("create_draft"), opKey }),
  z.object({ type: z.literal("set_reminder"), opKey, date: isoDate.nullable() }),
  z.object({ type: z.literal("simulate_submit"), opKey }),
  z.object({ type: z.literal("reset"), opKey }),
]);
export type Command = z.infer<typeof commandSchema>;

export const requestSchema = z.object({
  expectedVersion: z.number().int().min(0),
  command: commandSchema,
});
