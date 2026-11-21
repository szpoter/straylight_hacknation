// Shared shapes of the admin panel catalogue (SPEC-PANEL-ADMINISTRACYJNY.md §3, §5, §6, §8).

export type RuleState = "Szkic" | "Zaplanowana" | "Obowiązuje" | "Historyczna";

export const PARAMETER_GROUPS = [
  "Stawki",
  "Wymiary",
  "Uzupełniający",
  "Chorobowy",
  "Kto wypłaca",
  "Podstawa",
  "Terminy",
  "Formularze",
] as const;

export type ParameterGroup = (typeof PARAMETER_GROUPS)[number];

/**
 * Where a value comes from:
 * - "app": read from the parent application's code at request time, so the panel shows what the app applies;
 * - "spec": written down in the specification; the application does not compute it yet.
 */
export type ValueOrigin = "app" | "spec";

export interface ParameterVersion {
  value: string;
  from: string;
  state: RuleState;
}

export interface Parameter {
  id: string;
  group: ParameterGroup;
  name: string;
  value: string;
  from: string;
  state: RuleState;
  source: string;
  /** Link to the official text the value rests on. */
  sourceUrl?: string;
  /** Verbatim fragment of that text, when the corpus has it. */
  quote?: string;
  usedIn: string;
  /** Defaults to all cases of the benefit when omitted. */
  scope?: string;
  planned?: { value: string; from: string };
  history: ParameterVersion[];
  origin: ValueOrigin;
  /** For "app" values: the module and rule version they are read from. */
  appSource?: string;
  /** Extra label/value rows shown in the side panel. */
  details?: { label: string; value: string }[];
}

export type CaseStatus = "zgodna" | "niezgodna" | "brak-danych";

export interface TestCase {
  id: string;
  title: string;
  tag: string;
  status: CaseStatus;
  inputs: { label: string; value: string }[];
  expected: { label: string; value: string }[];
  result: { label: string; value: string }[];
  missing?: string;
  /** Reasons returned by the rule, in order. */
  reasons?: string[];
  /** Rule and version that produced the result. */
  computedBy?: string;
}

export interface HistoryEntry {
  id: string;
  parameterId: string;
  scope: string;
  publishedAt: string;
  parameter: string;
  group: ParameterGroup;
  oldValue: string;
  newValue: string;
  author: string;
  state: RuleState;
  from: string;
  reason: string;
  source: string;
  tests: string;
}

/** One official document the assistant answers from (SPEC §5, "Źródła wiedzy agenta"). */
export interface KnowledgeSource {
  id: string;
  packageVersion: string;
  title: string;
  shortTitle: string;
  issuer: string;
  authority: "statute" | "regulation" | "ministry_guidance" | "zus_guidance";
  url: string;
  retrievedAt: string;
  validFrom: string | null;
  validTo: string | null;
  versionNote: string;
}

export interface KnowledgePackage {
  version: string;
  description: string;
  verifiedAt: string;
  fragments: number;
  documents: number;
}
