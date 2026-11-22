import { CITATIONS, ZAM_FORM } from "../kamil/sources";
import { citationUrl, type Corpus } from "../rag/corpus";
import { loadCorpus } from "../rag/corpus-fs";
import { formatShort } from "../rules/dates";
import { ARREARS_RULES_VERSION, MINIMUM_WAGE } from "../rules/arrears";
import { RULE_PARAMETERS, valueOn, valueWithDefaults, type RuleSchedule } from "../rules/parameters";
import { MAX_PARTS, PATERNITY_RULES_VERSION, TOTAL_DAYS } from "../rules/paternity";
import { DEFAULT_INSURED_THRESHOLD, PAYER_RULES_VERSION } from "../rules/payer";
import { LAW_IDS, assessedOn } from "../rules/sickness";
import { EMPTY_STATE, draftFor, labelOf, scheduleOf, type RuleVersionsState } from "./rule-versions";
import type { HistoryEntry, KnowledgePackage, KnowledgeSource, Parameter, ParameterGroup, ParameterVersion } from "./types";

/**
 * Read-only view of what the parent application applies today, for the admin panel.
 * Values are imported from the rule modules and the knowledge corpus, never copied, so the panel
 * cannot drift from the app. Changing them still needs a code change (see ARCHITECTURE.md).
 *
 * Only public material: legal acts, ZUS pages and the official ZAM form. ZUS competition case files
 * are never read here (task description, p. 11–12).
 */

export const KNOWLEDGE_PACKAGES = ["marta", "publiczne", "oferta"] as const;

function tryCorpus(name: string): Corpus | null {
  try {
    return loadCorpus(name);
  } catch {
    return null;
  }
}

/* ---------- parameters ---------- */

const days = (n: number) => `${n} dni`;

/** The paternity total with its published versions; the only parameter changeable from the panel so far. */
function paternityTotal(state: RuleVersionsState, today: string): Pick<Parameter, "value" | "from" | "planned" | "draft" | "history"> {
  const schedule = scheduleOf(state);
  const current = valueOn(schedule, "paternity.totalDays", today, TOTAL_DAYS);
  const published = state.versions
    .filter((v) => v.parameter === "paternity.totalDays" && v.status === "published")
    .sort((a, b) => b.validFrom.localeCompare(a.validFrom));
  const next = [...published].reverse().find((v) => v.validFrom > today);
  const draft = draftFor(state, "paternity.totalDays");
  return {
    value: days(current.value),
    from: current.validFrom ?? "—",
    planned: next ? { value: days(next.value), from: next.validFrom } : undefined,
    draft: draft ? { value: days(draft.value), from: draft.validFrom } : undefined,
    history: [
      ...published.map((v) => ({
        value: days(v.value),
        from: v.validFrom,
        state: labelOf(v, state, today) as ParameterVersion["state"],
      })),
      { value: days(TOTAL_DAYS), from: "—", state: current.validFrom ? "Historyczna" : "Obowiązuje" },
    ],
  };
}

function paternityParameters(state: RuleVersionsState, today: string): Parameter[] {
  const period = CITATIONS["zam-info-okres"];
  const parts = CITATIONS["zus-ojcowski-niepracownik"];
  const common = {
    group: "Wymiary" as ParameterGroup,
    from: "—",
    state: "Obowiązuje" as const,
    usedIn: "Sprawa Kamila: ocena prawa, okres i wniosek ZAM",
    scope: "Ubezpieczeni niebędący pracownikami (dobrowolne ubezpieczenie chorobowe)",
    origin: "app" as const,
    appSource: `lib/rules/paternity.ts · ${PATERNITY_RULES_VERSION}`,
  };
  return [
    {
      ...common,
      id: "app-paternity-total",
      name: RULE_PARAMETERS["paternity.totalDays"].label,
      ...paternityTotal(state, today),
      editable: true,
      source: period.title,
      sourceUrl: period.url,
      quote: period.quote,
      details: [
        { label: "Wartość w kodzie", value: days(TOTAL_DAYS) },
        { label: "O wartości decyduje", value: RULE_PARAMETERS["paternity.totalDays"].event },
        { label: "Fragment pobrano", value: formatShort(period.fetchedAt) },
      ],
    },
    {
      ...common,
      id: "app-paternity-parts",
      name: "Zasiłek za okres urlopu ojcowskiego: maksymalna liczba części",
      value: String(MAX_PARTS),
      source: parts.title,
      sourceUrl: parts.url,
      quote: parts.quote,
      details: [{ label: "Fragment pobrano", value: formatShort(parts.fetchedAt) }],
      history: [{ value: String(MAX_PARTS), from: "—", state: "Obowiązuje" }],
    },
  ];
}

/** Short names for the statute units the sickness rule relies on (lib/rules/sickness.ts, LAW_IDS). */
const SICKNESS_UNITS: Record<(typeof LAW_IDS)[number], { group: ParameterGroup; name: string; value: string }> = {
  "uz-art6-ust1": { group: "Chorobowy", name: "Prawo do zasiłku: niezdolność powstała w czasie ubezpieczenia", value: "warunek" },
  "uz-art7": { group: "Chorobowy", name: "Niezdolność powstała po ustaniu ubezpieczenia", value: "min. 30 dni, powstała do 14 dni" },
  "uz-art11-ust2-pkt1": { group: "Stawki", name: "Zasiłek chorobowy w okresie ciąży", value: "100%" },
  "uz-art13-ust1": { group: "Chorobowy", name: "Brak zasiłku za okres po ustaniu ubezpieczenia: wyłączenia", value: "warunek" },
};

function sicknessParameters(corpus: Corpus | null): Parameter[] {
  if (!corpus) return [];
  return LAW_IDS.flatMap((id) => {
    const fragment = corpus.fragments.get(id);
    const doc = fragment ? corpus.documents.get(fragment.documentId) : undefined;
    if (!fragment || !doc) return [];
    const unit = SICKNESS_UNITS[id];
    return [
      {
        id: `app-${id}`,
        group: unit.group,
        name: unit.name,
        value: unit.value,
        from: doc.validFrom ?? "—",
        state: "Obowiązuje" as const,
        source: `${doc.shortTitle}, ${fragment.locator}`,
        sourceUrl: citationUrl(corpus, fragment),
        quote: fragment.sourceText,
        usedIn: "Ocena zasiłku chorobowego na podstawie dokumentów sprawy",
        origin: "app" as const,
        appSource: `lib/rules/sickness.ts · ocena wg stanu na ${formatShort(assessedOn)}`,
        details: [
          { label: "Akt", value: doc.title },
          { label: "Tekst pobrano", value: formatShort(doc.retrievedAt) },
          { label: "Wersja tekstu", value: doc.versionNote },
        ],
        history: [{ value: unit.value, from: doc.validFrom ?? "—", state: "Obowiązuje" as const }],
      },
    ];
  });
}

function formParameters(): Parameter[] {
  return [
    {
      id: "app-form-zam",
      group: "Formularze",
      name: "ZAM: wzór wniosku do wydruku",
      value: `wersja z ${formatShort(ZAM_FORM.version)}`,
      from: ZAM_FORM.version,
      state: "Obowiązuje",
      source: "zus.pl, formularz ZAM „pobierz i drukuj”",
      sourceUrl: ZAM_FORM.sourceUrl,
      usedIn: "Wypełniony wniosek ZAM do pobrania w sprawie Kamila",
      origin: "app",
      appSource: "lib/kamil/sources.ts · ZAM_FORM",
      details: [
        { label: "Plik w aplikacji", value: ZAM_FORM.templatePath },
        { label: "SHA-256", value: ZAM_FORM.sha256 },
      ],
      history: [{ value: `wersja z ${formatShort(ZAM_FORM.version)}`, from: ZAM_FORM.version, state: "Obowiązuje" }],
    },
  ];
}

/** Parameters the application applies, read from its code, with versions published in this demo session. */
export function appParameters(state: RuleVersionsState = EMPTY_STATE, today = new Date().toISOString().slice(0, 10)): Parameter[] {
  const publiczne = tryCorpus("publiczne");
  return [
    ...paternityParameters(state, today),
    ...sicknessParameters(publiczne),
    ...payerAndArrearsParameters(publiczne, scheduleOf(state), today),
    ...formParameters(),
  ];
}

/** Statute unit from the corpus as source, link and verbatim text; empty when the corpus is missing. */
function statute(corpus: Corpus | null, id: string): Pick<Parameter, "source" | "sourceUrl" | "quote"> | null {
  const fragment = corpus?.fragments.get(id);
  const doc = fragment ? corpus?.documents.get(fragment.documentId) : undefined;
  if (!corpus || !fragment || !doc) return null;
  return { source: `${doc.shortTitle}, ${fragment.locator}`, sourceUrl: citationUrl(corpus, fragment), quote: fragment.sourceText };
}

/** Rules ready for the parent's plan (lib/rules/payer.ts, lib/rules/arrears.ts); screens come later. */
function payerAndArrearsParameters(corpus: Corpus | null, schedule: RuleSchedule, today: string): Parameter[] {
  const params: Parameter[] = [];
  const art61 = statute(corpus, "uz-61-1");
  if (art61) {
    const threshold = valueOn(schedule, "payer.insuredThreshold", today, DEFAULT_INSURED_THRESHOLD).value;
    params.push({
      id: "app-payer-threshold",
      group: "Kto wypłaca",
      name: "Płatnik wypłaca zasiłki sam, gdy zgłasza do ubezpieczenia chorobowego ponad",
      value: `${threshold} ubezp.`,
      from: "—",
      state: "Obowiązuje",
      ...art61,
      usedIn: "Reguła „kto wypłaca” dla planu rodzica: płatnik albo ZUS i zaświadczenie płatnika",
      scope: "Pracownicy. Prowadzącym działalność, duchownym i po ustaniu ubezpieczenia zawsze wypłaca ZUS",
      origin: "app",
      appSource: `lib/rules/payer.ts · ${PAYER_RULES_VERSION}`,
      details: [
        { label: "Liczbę ubezpieczonych ustala się", value: "na 30 listopada poprzedniego roku (art. 61 ust. 2)" },
        { label: "Zawsze ZUS", value: "działalność i współpraca, duchowni, po ustaniu ubezpieczenia, pracodawca zagraniczny" },
      ],
      history: [{ value: `${threshold} ubezp.`, from: "—", state: "Obowiązuje" }],
    });
  }

  const wage = valueWithDefaults(schedule, "wage.minimum", today, MINIMUM_WAGE);
  const nextWage = MINIMUM_WAGE.find((w) => w.validFrom > today);
  const zl = (v: number) => `${v.toLocaleString("pl-PL", { useGrouping: "always" })} zł`;
  params.push({
    id: "app-wage-minimum",
    group: "Podstawa",
    name: "Minimalne wynagrodzenie za pracę",
    value: zl(wage.value),
    from: wage.validFrom ?? "—",
    state: "Obowiązuje",
    source: "Rozporządzenie Rady Ministrów z 14.09.2026 (Dz.U. 2026 poz. 1213) dla 2027 r.",
    sourceUrl: "https://eli.gov.pl/eli/DU/2026/1213/ogl",
    planned: nextWage ? { value: zl(nextWage.value), from: nextWage.validFrom } : undefined,
    usedIn: "Próg zadłużenia składkowego (1%) w regule zadłużenia",
    origin: "app",
    appSource: `lib/rules/arrears.ts · MINIMUM_WAGE`,
    details: [{ label: "Wartości w kodzie", value: MINIMUM_WAGE.map((w) => `${w.validFrom.slice(0, 4)}: ${zl(w.value)}`).join(", ") }],
    history: [...MINIMUM_WAGE]
      .reverse()
      .map((w) => ({
        value: zl(w.value),
        from: w.validFrom,
        state: (w.validFrom > today ? "Zaplanowana" : w.validFrom === wage.validFrom ? "Obowiązuje" : "Historyczna") as ParameterVersion["state"],
      })),
  });

  const art2a = statute(corpus, "uz-2a-1");
  if (art2a) {
    const threshold = Math.round(wage.value) / 100;
    params.push({
      id: "app-arrears-threshold",
      group: "Podstawa",
      name: "Zadłużenie składkowe wstrzymujące świadczenie: powyżej 1% minimalnego wynagrodzenia",
      value: `${threshold.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} zł`,
      from: wage.validFrom ?? "—",
      state: "Obowiązuje",
      ...art2a,
      usedIn: "Reguła zadłużenia dla osób opłacających składki same (działalność): stan na dzień powstania prawa",
      scope: "Prowadzący działalność i osoby z nimi współpracujące, duchowni, marynarze (art. 2a ust. 1)",
      origin: "app",
      appSource: `lib/rules/arrears.ts · ${ARREARS_RULES_VERSION}`,
      details: [{ label: "Bez spłaty w 6 miesięcy", value: "prawo do świadczenia się przedawnia (art. 2a ust. 2)" }],
      history: [{ value: `${threshold.toLocaleString("pl-PL", { minimumFractionDigits: 2 })} zł`, from: wage.validFrom ?? "—", state: "Obowiązuje" }],
    });
  }
  return params;
}

/* ---------- change history ---------- */

function warsawTime(iso: string): string {
  // "YYYY-MM-DD HH:MM" in Polish time; sv-SE formats dates as ISO.
  return new Date(iso).toLocaleString("sv-SE", { timeZone: "Europe/Warsaw" }).slice(0, 16);
}

/** Publications of this demo session, newest first (SPEC-PANEL §8). Drafts are not history yet. */
export function historyEntries(state: RuleVersionsState, today: string): HistoryEntry[] {
  return state.versions
    .filter((v) => v.status !== "draft" && v.publishedAt)
    .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
    .map((v) => ({
      id: v.id.slice(0, 6).toUpperCase(),
      versionId: v.id,
      parameterId: "app-paternity-total",
      scope: "Okresy zasiłku zaczynające się od daty obowiązywania",
      publishedAt: warsawTime(v.publishedAt!),
      parameter: RULE_PARAMETERS[v.parameter].label,
      group: "Wymiary",
      oldValue: days(v.previousValue),
      newValue: days(v.value),
      author: v.author,
      state: labelOf(v, state, today),
      from: v.validFrom,
      reason: v.reason || "—",
      source: v.source,
      tests: v.checks ?? "—",
    }));
}

/* ---------- knowledge sources ---------- */

export function knowledgeSources(): { packages: KnowledgePackage[]; sources: KnowledgeSource[] } {
  const packages: KnowledgePackage[] = [];
  const sources: KnowledgeSource[] = [];
  for (const name of KNOWLEDGE_PACKAGES) {
    const corpus = tryCorpus(name);
    if (!corpus) continue;
    const { manifest } = corpus;
    packages.push({
      version: manifest.corpusVersion,
      description: manifest.description,
      verifiedAt: manifest.verifiedAt,
      fragments: corpus.fragments.size,
      documents: manifest.documents.length,
    });
    for (const doc of manifest.documents) {
      sources.push({
        id: `${manifest.corpusVersion}:${doc.id}`,
        packageVersion: manifest.corpusVersion,
        title: doc.title,
        shortTitle: doc.shortTitle,
        issuer: doc.issuer,
        authority: doc.authority,
        url: doc.landingUrl,
        retrievedAt: doc.retrievedAt,
        validFrom: doc.validFrom,
        validTo: doc.validTo,
        versionNote: doc.versionNote,
      });
    }
  }
  return { packages, sources };
}

/* ---------- test cases: see scenarios.ts ---------- */

export { PATERNITY_SCENARIOS, paternityTestCases, scenarioOutcome, type Scenario } from "./scenarios";
