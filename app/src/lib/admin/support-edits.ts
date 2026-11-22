import { SITUATION_LABEL, type SupportOrganization, type SupportSituation } from "../support/organizations";

/**
 * Changes to the support organisations made in one demo session (ZUS task p. 14: "pozyskania
 * informacji o podmiotach udzielających wsparcia"; SPEC-PANEL §5). Pure: shared by the server
 * actions, the panel view and tests. The list in lib/support/organizations.ts stays the starting
 * point; a production deployment would keep the same entries in the database.
 */

export interface SupportEntry {
  organization: SupportOrganization;
  /** Not in the code list: added in this session. */
  added: boolean;
  withdrawn: boolean;
  author: string;
  at: string;
}

export interface SupportEditsState {
  revision: number;
  entries: SupportEntry[];
}

export const EMPTY_SUPPORT_EDITS: SupportEditsState = { revision: 0, entries: [] };

export type SupportSessionState = "bez zmian" | "zmieniona" | "dodana";

export interface SupportRow extends SupportOrganization {
  session: SupportSessionState;
  withdrawn: boolean;
}

/** The code list with this session's changes; withdrawn organisations stay listed, marked. */
export function supportRows(base: readonly SupportOrganization[], state: SupportEditsState): SupportRow[] {
  const byId = new Map(state.entries.map((e) => [e.organization.id, e]));
  const rows: SupportRow[] = base.map((o) => {
    const entry = byId.get(o.id);
    return entry
      ? { ...entry.organization, id: o.id, session: "zmieniona", withdrawn: entry.withdrawn }
      : { ...o, session: "bez zmian", withdrawn: false };
  });
  for (const e of state.entries) {
    if (e.added) rows.push({ ...e.organization, session: "dodana", withdrawn: e.withdrawn });
  }
  return rows;
}

/** Organisations the parent views may show: the code list with this session's changes, without withdrawn ones. */
export function activeOrganizations(base: readonly SupportOrganization[], state: SupportEditsState): SupportOrganization[] {
  return supportRows(base, state)
    .filter((r) => !r.withdrawn)
    .map(organizationOf);
}

/** The organisation record of a panel row, without the session markers. */
function organizationOf(row: SupportRow): SupportOrganization {
  const o: Partial<SupportRow> = { ...row };
  delete o.session;
  delete o.withdrawn;
  return o as SupportOrganization;
}

/* ---------- validation ---------- */

const SITUATIONS = Object.keys(SITUATION_LABEL) as SupportSituation[];
const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Form values as typed in; empty optional fields become null. */
export interface OrganizationForm {
  id: string | null;
  name: string;
  legalForm: string;
  krs: string;
  helps: string;
  situations: string[];
  freeOfCharge: string;
  phone: string;
  email: string;
  url: string;
  area: string;
  verifiedAt: string;
}

const optional = (text: string) => (text.trim() ? text.trim() : null);

/** Problems with a form, in Polish; empty when the organisation can be saved. */
export function organizationProblems(form: OrganizationForm, today: string): string[] {
  const problems: string[] = [];
  if (form.name.trim().length < 3) problems.push("Podaj nazwę organizacji.");
  if (form.legalForm !== "fundacja" && form.legalForm !== "stowarzyszenie") {
    problems.push("Lista obejmuje wyłącznie fundacje i stowarzyszenia.");
  }
  if (!/^\d{10}$/.test(form.krs.replace(/\s/g, ""))) problems.push("Numer KRS ma 10 cyfr.");
  if (form.helps.trim().length < 10) problems.push("Opisz, komu organizacja pomaga, słowami z jej strony.");
  if (form.helps.length > 500 || form.freeOfCharge.length > 300 || form.area.length > 200) {
    problems.push("Opis jest za długi (do 500 znaków, bezpłatna pomoc i obszar do 300 i 200).");
  }
  if (!form.situations.length || form.situations.some((x) => !SITUATIONS.includes(x as SupportSituation))) {
    problems.push("Wybierz co najmniej jedną sytuację.");
  }
  let url: URL | null = null;
  try {
    url = new URL(form.url.trim());
  } catch {
    url = null;
  }
  if (!url || url.protocol !== "https:") problems.push("Podaj adres strony organizacji zaczynający się od https://.");
  if (optional(form.phone) && !/^\+?[\d ]{7,20}$/.test(form.phone.trim())) problems.push("Telefon może zawierać tylko cyfry i spacje.");
  if (optional(form.email) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) problems.push("Adres e-mail jest niepoprawny.");
  if (!ISO_DAY.test(form.verifiedAt) || form.verifiedAt > today) {
    problems.push("Data weryfikacji nie może być późniejsza niż dziś.");
  }
  return problems;
}

/** "fundacja-x-y" from a name, unique against the ids already in use. */
function newId(name: string, taken: Set<string>): string {
  const base =
    name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/ł/g, "l")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "organizacja";
  let id = base;
  for (let i = 2; taken.has(id); i++) id = `${base}-${i}`;
  return id;
}

/* ---------- writing ---------- */

export type SupportOutcome = { ok: true; state: SupportEditsState; id: string } | { ok: false; error: string };

const conflict = { ok: false as const, error: "Ktoś w tej sesji zmienił listę w międzyczasie. Odśwież stronę." };

export function saveOrganization(
  base: readonly SupportOrganization[],
  state: SupportEditsState,
  form: OrganizationForm,
  meta: { expectedRevision: number; today: string; now: string; author: string },
): SupportOutcome {
  if (meta.expectedRevision !== state.revision) return conflict;
  const problems = organizationProblems(form, meta.today);
  if (problems.length) return { ok: false, error: problems.join(" ") };
  const rows = supportRows(base, state);
  const existing = form.id ? rows.find((r) => r.id === form.id) : undefined;
  if (form.id && !existing) return { ok: false, error: "Nie ma takiej organizacji." };
  const id = existing?.id ?? newId(form.name, new Set(rows.map((r) => r.id)));
  const organization: SupportOrganization = {
    id,
    name: form.name.trim(),
    legalForm: form.legalForm as SupportOrganization["legalForm"],
    krs: form.krs.replace(/\s/g, ""),
    helps: form.helps.trim(),
    situations: SITUATIONS.filter((x) => form.situations.includes(x)),
    freeOfCharge: optional(form.freeOfCharge),
    phone: optional(form.phone),
    email: optional(form.email),
    url: form.url.trim(),
    area: optional(form.area),
    verifiedAt: form.verifiedAt,
  };
  const entry: SupportEntry = {
    organization,
    added: existing ? existing.session === "dodana" : true,
    withdrawn: existing?.withdrawn ?? false,
    author: meta.author,
    at: meta.now,
  };
  return {
    ok: true,
    id,
    state: { revision: state.revision + 1, entries: [...state.entries.filter((e) => e.organization.id !== id), entry] },
  };
}

/** Withdraws an organisation from the parent views, or brings it back. */
export function setWithdrawn(
  base: readonly SupportOrganization[],
  state: SupportEditsState,
  id: string,
  withdrawn: boolean,
  meta: { expectedRevision: number; now: string; author: string },
): SupportOutcome {
  if (meta.expectedRevision !== state.revision) return conflict;
  const row = supportRows(base, state).find((r) => r.id === id);
  if (!row) return { ok: false, error: "Nie ma takiej organizacji." };
  const entry: SupportEntry = {
    organization: organizationOf(row),
    added: row.session === "dodana",
    withdrawn,
    author: meta.author,
    at: meta.now,
  };
  return {
    ok: true,
    id,
    state: { revision: state.revision + 1, entries: [...state.entries.filter((e) => e.organization.id !== id), entry] },
  };
}

/** Back to the code list for one organisation; an organisation added in this session is removed. */
export function revertOrganization(state: SupportEditsState, id: string, expectedRevision: number): SupportOutcome {
  if (expectedRevision !== state.revision) return conflict;
  return { ok: true, id, state: { revision: state.revision + 1, entries: state.entries.filter((e) => e.organization.id !== id) } };
}

/** Any malformed value yields the initial state; shape checks only, the signature is checked by the store. */
export function parseSupportEdits(value: unknown): SupportEditsState {
  const v = value as SupportEditsState | null;
  if (!v || !Number.isInteger(v.revision) || !Array.isArray(v.entries)) return EMPTY_SUPPORT_EDITS;
  const entries = v.entries.filter(
    (e) => e && typeof e.organization?.id === "string" && typeof e.organization?.name === "string" && Array.isArray(e.organization?.situations),
  );
  return { revision: v.revision, entries };
}
