import { createHmac, timingSafeEqual } from "node:crypto";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import { RULE_PARAMETERS, validateValue, valueOn, type RuleParameterId, type RuleSchedule } from "../rules/parameters";
import type { RuleState as StateLabel } from "./types";

/**
 * Versions of rule parameters changed in the admin panel (SPEC-PANEL §7, §8, §10).
 * Pure functions; the server stores the state per demo session (lib/admin/rule-store.ts).
 */

export interface RuleVersion {
  /** Random id, also the idempotency key of its publication. */
  id: string;
  parameter: RuleParameterId;
  value: number;
  /** Value in force the day before validFrom, for the history entry. */
  previousValue: number;
  validFrom: string;
  status: "draft" | "published" | "withdrawn";
  reason: string;
  source: string;
  author: string;
  createdAt: string;
  publishedAt: string | null;
  /** Summary of "Sprawdź zmianę" at publication, e.g. "5 / 5 zgodnych". */
  checks: string | null;
}

export interface RuleVersionsState {
  /** Bumped on every write; a publication must name the revision it was prepared on. */
  revision: number;
  versions: RuleVersion[];
}

export const EMPTY_STATE: RuleVersionsState = { revision: 0, versions: [] };

/** A cookie holds about 4 KB; older closed entries are dropped first. */
export const MAX_VERSIONS = 12;
const MAX_TEXT = 300;

/* ---------- reading ---------- */

export function scheduleOf(state: RuleVersionsState): RuleSchedule {
  const schedule: RuleSchedule = {};
  for (const v of state.versions) {
    if (v.status !== "published") continue;
    (schedule[v.parameter] ??= []).push({ value: v.value, validFrom: v.validFrom });
  }
  return schedule;
}

/** State label shown in the panel (SPEC §3: Szkic, Zaplanowana, Obowiązuje, Historyczna). */
export function labelOf(version: RuleVersion, state: RuleVersionsState, today: string): StateLabel {
  if (version.status === "draft") return "Szkic";
  if (version.status === "withdrawn") return "Wycofana";
  if (version.validFrom > today) return "Zaplanowana";
  const current = valueOn(scheduleOf(state), version.parameter, today, Number.NaN);
  return current.validFrom === version.validFrom ? "Obowiązuje" : "Historyczna";
}

export function draftFor(state: RuleVersionsState, parameter: RuleParameterId): RuleVersion | null {
  return state.versions.find((v) => v.parameter === parameter && v.status === "draft") ?? null;
}

/* ---------- writing ---------- */

export interface DraftInput {
  parameter: RuleParameterId;
  value: number;
  validFrom: string;
  reason: string;
  source: string;
}

export type Outcome =
  | { ok: true; state: RuleVersionsState; version: RuleVersion }
  | { ok: false; error: string; state: RuleVersionsState };

function clean(text: string): string {
  return text.trim().replace(/\s+/g, " ").slice(0, MAX_TEXT);
}

function trim(versions: RuleVersion[]): RuleVersion[] {
  const result = [...versions];
  while (result.length > MAX_VERSIONS) {
    const index = result.findIndex((v) => v.status === "withdrawn");
    result.splice(index >= 0 ? index : 0, 1);
  }
  return result;
}

/** Problems that block saving or publishing, in Polish. */
export function draftProblems(input: DraftInput, today: string): string[] {
  const problems = validateValue(input.parameter, input.value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.validFrom)) problems.push("Podaj datę, od której zmiana obowiązuje.");
  else if (input.validFrom <= today) problems.push("Zmiana może obowiązywać najwcześniej od jutra.");
  return problems;
}

/** One draft per parameter: saving again replaces it (SPEC §7, step 1). */
export function saveDraft(
  state: RuleVersionsState,
  input: DraftInput,
  meta: { id: string; now: string; author: string; fallback: number },
): Outcome {
  const problems = draftProblems(input, meta.now.slice(0, 10));
  if (problems.length) return { ok: false, error: problems.join(" "), state };
  const previous = valueOn(scheduleOf(state), input.parameter, addDay(input.validFrom, -1), meta.fallback).value;
  const existing = draftFor(state, input.parameter);
  const version: RuleVersion = {
    id: existing?.id ?? meta.id,
    parameter: input.parameter,
    value: input.value,
    previousValue: previous,
    validFrom: input.validFrom,
    status: "draft",
    reason: clean(input.reason),
    source: clean(input.source),
    author: meta.author,
    createdAt: meta.now,
    publishedAt: null,
    checks: null,
  };
  const versions = trim([...state.versions.filter((v) => v.id !== version.id), version]);
  return { ok: true, state: { revision: state.revision + 1, versions }, version };
}

/**
 * Publishes a draft from its date. Repeating the same publication changes nothing (idempotent);
 * a revision mismatch means someone changed the rules in the meantime (SPEC §10).
 */
export function publishDraft(
  state: RuleVersionsState,
  request: { draftId: string; expectedRevision: number; checks: string },
  now: string,
): Outcome {
  const version = state.versions.find((v) => v.id === request.draftId);
  if (version?.status === "published") return { ok: true, state, version };
  if (!version || version.status !== "draft") return { ok: false, error: "Nie ma takiego szkicu.", state };
  if (request.expectedRevision !== state.revision) {
    return { ok: false, error: "Reguły zmieniły się w międzyczasie. Sprawdź aktualną wersję i spróbuj ponownie.", state };
  }
  if (!version.source) return { ok: false, error: "Publikacja wymaga podstawy zmiany.", state };
  const today = now.slice(0, 10);
  if (version.validFrom <= today) return { ok: false, error: "Data obowiązywania musi być późniejsza niż dziś.", state };
  // A later publication for the same day replaces the earlier one.
  const versions = state.versions.map((v): RuleVersion => {
    if (v.id === version.id) return { ...v, status: "published", publishedAt: now, checks: request.checks };
    if (v.parameter === version.parameter && v.status === "published" && v.validFrom === version.validFrom) {
      return { ...v, status: "withdrawn" };
    }
    return v;
  });
  const published = versions.find((v) => v.id === version.id)!;
  return { ok: true, state: { revision: state.revision + 1, versions: trim(versions) }, version: published };
}

/** Only a scheduled change, before its date, can be withdrawn (SPEC §8). */
export function withdrawScheduled(state: RuleVersionsState, versionId: string, today: string): Outcome {
  const version = state.versions.find((v) => v.id === versionId);
  if (!version || version.status !== "published" || version.validFrom <= today) {
    return { ok: false, error: "Wycofać można tylko zmianę zaplanowaną na przyszłość.", state };
  }
  const withdrawn: RuleVersion = { ...version, status: "withdrawn" };
  return {
    ok: true,
    state: { revision: state.revision + 1, versions: state.versions.map((v) => (v.id === versionId ? withdrawn : v)) },
    version: withdrawn,
  };
}

export function discardDraft(state: RuleVersionsState, parameter: RuleParameterId): RuleVersionsState {
  const draft = draftFor(state, parameter);
  if (!draft) return state;
  return { revision: state.revision + 1, versions: state.versions.filter((v) => v.id !== draft.id) };
}

function addDay(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/* ---------- storage format: deflated JSON + HMAC ---------- */

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(`zusik-rules:${payload}`).digest("base64url");
}

export function encodeState(state: RuleVersionsState, secret: string): string {
  const payload = deflateRawSync(Buffer.from(JSON.stringify(state))).toString("base64url");
  return `${payload}.${sign(payload, secret)}`;
}

const PARAMETER_IDS = Object.keys(RULE_PARAMETERS);

/** Any tampered, foreign or malformed value yields the initial state. */
export function decodeState(raw: string | undefined, secret: string): RuleVersionsState {
  if (!raw) return EMPTY_STATE;
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return EMPTY_STATE;
  const payload = raw.slice(0, dot);
  const given = Buffer.from(raw.slice(dot + 1));
  const expected = Buffer.from(sign(payload, secret));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return EMPTY_STATE;
  try {
    const parsed = JSON.parse(inflateRawSync(Buffer.from(payload, "base64url")).toString()) as RuleVersionsState;
    if (!Number.isInteger(parsed.revision) || !Array.isArray(parsed.versions)) return EMPTY_STATE;
    const versions = parsed.versions.filter((v) => PARAMETER_IDS.includes(v.parameter));
    return { revision: parsed.revision, versions };
  } catch {
    return EMPTY_STATE;
  }
}
