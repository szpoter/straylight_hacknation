import { CITATIONS, ZAM_FORM } from "../kamil/sources";
import { citationUrl, type Corpus } from "../rag/corpus";
import { loadCorpus } from "../rag/corpus-fs";
import { formatShort } from "../rules/dates";
import { ARREARS_RULES_VERSION, MINIMUM_WAGE } from "../rules/arrears";
import { ALWAYS, DEFAULTS, RULE_PARAMETERS, formatValue, parameterOn, type RuleParameterId } from "../rules/parameters";
import { MAX_PARTS, PATERNITY_RULES_VERSION, TOTAL_DAYS } from "../rules/paternity";
import { PAYER_RULES_VERSION } from "../rules/payer";
import { RATES_RULES_VERSION } from "../rules/rates";
import { LAW_IDS, assessedOn } from "../rules/sickness";
import { CHANGE_SPECS, catalogIdFor } from "./parameter-changes";
import { EMPTY_STATE, draftFor, labelOf, scheduleOf, type RuleVersionsState } from "./rule-versions";
import type { HistoryEntry, KnowledgePackage, KnowledgeSource, Parameter, ParameterGroup, ParameterVersion } from "./types";

/**
 * Read-only view of what the parent application applies today, for the admin panel.
 * Values are imported from the rule modules and the knowledge corpus, never copied, so the panel
 * cannot drift from the app. Registered parameters (lib/admin/parameter-changes.ts) can be changed from
 * the panel with a date; their published versions come from this demo session.
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

/**
 * Value, planned change, draft and version history of a parameter: the code DEFAULTS plus the
 * versions published in this demo session (a published value wins over a default with the same day).
 */
function versioned(
  state: RuleVersionsState,
  id: RuleParameterId,
  today: string,
): Pick<Parameter, "value" | "from" | "planned" | "draft" | "history" | "editable"> {
  const fmt = (v: number) => formatValue(id, v);
  const day = (iso: string) => (iso === ALWAYS ? "—" : iso);
  const current = parameterOn(scheduleOf(state), id, today);
  const byDay = new Map<string, number>();
  for (const d of DEFAULTS[id]) byDay.set(d.validFrom, d.value);
  for (const v of state.versions) if (v.parameter === id && v.status === "published") byDay.set(v.validFrom, v.value);
  const entries = [...byDay.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  const next = [...entries].reverse().find(([from]) => from > today);
  const draft = draftFor(state, id);
  return {
    value: fmt(current.value),
    from: current.validFrom ? day(current.validFrom) : "—",
    planned: next ? { value: fmt(next[1]), from: next[0] } : undefined,
    draft: draft ? { value: fmt(draft.value), from: draft.validFrom } : undefined,
    editable: true,
    history: entries.map(([from, value]) => ({
      value: fmt(value),
      from: day(from),
      state: (from > today ? "Zaplanowana" : from === current.validFrom ? "Obowiązuje" : "Historyczna") as ParameterVersion["state"],
    })),
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
      ...versioned(state, "paternity.totalDays", today),
      source: period.title,
      sourceUrl: period.url,
      quote: period.quote,
      details: [
        { label: "Wartość w kodzie", value: formatValue("paternity.totalDays", TOTAL_DAYS) },
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

/** ZAM template used for the printable application, and the forms catalogue with dates (ZUS task p. 12). */
function formParameters(state: RuleVersionsState, today: string): Parameter[] {
  const template: Parameter = {
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
  };
  const catalogue = FORM_PARAMETERS.map(
    (id): Parameter => ({
      id: catalogIdFor(id),
      group: "Formularze",
      name: RULE_PARAMETERS[id].label,
      state: "Obowiązuje",
      ...versioned(state, id, today),
      source: "Treść zadania ZUS, s. 12 (wzory na zus.pl, zakładka Wzory formularzy, Zasiłki)",
      sourceUrl: "https://www.zus.pl/wzory-formularzy/zasilki",
      usedIn: "Katalog formularzy (lib/rules/parameters.ts). Ekrany dokumentów jeszcze z niego nie korzystają",
      scope: "Wnioski składane od daty obowiązywania",
      origin: "app",
      appSource: "lib/rules/parameters.ts · DEFAULTS",
    }),
  );
  return [template, ...catalogue];
}

const FORM_PARAMETERS = ["form.ZAM", "form.ZUR", "form.ZAO", "form.Z3", "form.Z3a", "form.Z3b", "form.ZAS12", "form.ZAS53"] as const;

/** Rates of the maternity benefit (ZUS task p. 9), computed by lib/rules/rates.ts. */
function rateParameters(corpus: Corpus | null, state: RuleVersionsState, today: string): Parameter[] {
  const kinds = [
    { id: "rate.maternity", unit: "uz-31-1", usedIn: "Kwota zasiłku za urlop macierzyński" },
    { id: "rate.parental", unit: "uz-31-1", usedIn: "Kwota zasiłku za urlop rodzicielski (przykład +280 zł)" },
    { id: "rate.averaged", unit: "uz-31-2", usedIn: "Kwota zasiłku przy wniosku matki do 21 dni po porodzie" },
  ] as const;
  const rates = kinds.map(
    ({ id, unit, usedIn }): Parameter => ({
      id: catalogIdFor(id),
      group: "Stawki",
      name: RULE_PARAMETERS[id].label,
      state: "Obowiązuje",
      ...versioned(state, id, today),
      source: "Treść zadania ZUS, s. 9",
      ...(statute(corpus, unit) ?? {}),
      usedIn: `${usedIn}. Reguła stawek gotowa dla kalkulatora rodzica`,
      scope: "Dni zasiłku od daty obowiązywania; okres przecinający datę jest liczony w dwóch częściach",
      origin: "app",
      appSource: `lib/rules/rates.ts · ${RATES_RULES_VERSION}`,
      details: [
        { label: "O wartości decyduje", value: RULE_PARAMETERS[id].event },
        { label: "Najniższa kwota", value: "zasiłek podwyższa się do kwoty świadczenia rodzicielskiego (art. 31 ust. 3a)" },
      ],
    }),
  );
  const minimumId = "benefit.parentalMinimum";
  const art31 = statute(corpus, "uz-31-2");
  const minimum: Parameter = {
    id: catalogIdFor(minimumId),
    group: "Stawki",
    name: RULE_PARAMETERS[minimumId].label,
    state: "Obowiązuje",
    ...versioned(state, minimumId, today),
    source: "Ustawa o świadczeniach rodzinnych (Dz.U. 2025 poz. 1208), art. 17c ust. 5",
    sourceUrl: "https://eli.gov.pl/eli/DU/2025/1208/ogl",
    quote: "Świadczenie rodzicielskie przysługuje w wysokości 1000,00 zł miesięcznie, z uwzględnieniem ust. 6.",
    usedIn: "Podwyższenie zasiłku macierzyńskiego do kwoty świadczenia rodzicielskiego. Reguła gotowa dla kalkulatora rodzica",
    scope: "Miesiące zasiłku od daty obowiązywania; za część miesiąca proporcjonalnie (1/30 za dzień)",
    origin: "app",
    appSource: `lib/rules/rates.ts · ${RATES_RULES_VERSION}`,
    details: [
      { label: "Podwyższenie", value: art31 ? `${art31.source} (ust. 3a i 3c)` : "art. 31 ust. 3a i 3c ustawy zasiłkowej" },
      { label: "Porównuje się", value: "zasiłek po potrąceniu zaliczki na podatek (poradnik ZUS, s. 20)" },
      { label: "O wartości decyduje", value: RULE_PARAMETERS[minimumId].event },
    ],
  };
  return [...rates, minimum];
}

/**
 * Leave lengths, the 81,5% request term and the contribution deduction of the parent calculator
 * (MATERNITY_PARAMETERS in lib/rules/maternity.ts), changeable in the panel. The calculator reads
 * them from the schedule once its owner connects lib/rules/maternity-schedule.ts.
 */
function calculatorParameters(corpus: Corpus | null, state: RuleVersionsState, today: string): Parameter[] {
  const kinds: { id: RuleParameterId; unit: string; source?: string }[] = [
    { id: "maternity.weeks1", unit: "kp-180-1" },
    { id: "maternity.weeks2", unit: "kp-180-1" },
    { id: "maternity.weeks3", unit: "kp-180-1" },
    { id: "maternity.weeks4", unit: "kp-180-1" },
    { id: "maternity.weeks5", unit: "kp-180-1" },
    { id: "parental.weeksOne", unit: "kp-1821a-1" },
    { id: "parental.weeksMany", unit: "kp-1821a-1" },
    { id: "parental.weeksOneZaZyciem", unit: "kp-1821a-1" },
    { id: "parental.weeksManyZaZyciem", unit: "kp-1821a-1" },
    { id: "parental.exclusiveWeeks", unit: "kp-1821a-2" },
    { id: "averaged.requestDays", unit: "uz-30a-1" },
    { id: "contributions.employeePct", unit: "uz-45-1", source: "Ustawa zasiłkowa, art. 45 ust. 1" },
  ];
  return kinds.map(({ id, unit, source }): Parameter => {
    const spec = CHANGE_SPECS.find((s) => s.parameter === id);
    return {
      id: catalogIdFor(id),
      group: (spec?.group ?? "Wymiary") as ParameterGroup,
      name: RULE_PARAMETERS[id].label,
      state: "Obowiązuje",
      ...versioned(state, id, today),
      source: source ?? "Kodeks pracy",
      ...(statute(corpus, unit) ?? {}),
      usedIn: "Kalkulator rodzica (lib/rules/maternity.ts · MATERNITY_PARAMETERS). Wartość z panelu zastosuje po podpięciu harmonogramu",
      scope: spec?.scope ?? "",
      origin: "app",
      appSource: "lib/rules/parameters.ts · DEFAULTS, w kształcie kalkulatora: lib/rules/maternity-schedule.ts",
      details: [
        { label: "O wartości decyduje", value: RULE_PARAMETERS[id].event },
        ...(id === "contributions.employeePct"
          ? [{ label: "Składki ubezpieczonego", value: "emerytalna 9,76%, rentowa 1,5%, chorobowa 2,45%" }]
          : []),
      ],
    };
  });
}

/** Parameters the application applies, read from its code, with versions published in this demo session. */
export function appParameters(state: RuleVersionsState = EMPTY_STATE, today = new Date().toISOString().slice(0, 10)): Parameter[] {
  const publiczne = tryCorpus("publiczne");
  return [
    ...rateParameters(publiczne, state, today),
    ...calculatorParameters(publiczne, state, today),
    ...paternityParameters(state, today),
    ...sicknessParameters(publiczne),
    ...payerAndArrearsParameters(publiczne, state, today),
    ...formParameters(state, today),
  ];
}

/** Statute unit from the corpus as source, link and verbatim text; empty when the corpus is missing. */
function statute(corpus: Corpus | null, id: string): Pick<Parameter, "source" | "sourceUrl" | "quote"> | null {
  const fragment = corpus?.fragments.get(id);
  const doc = fragment ? corpus?.documents.get(fragment.documentId) : undefined;
  if (!corpus || !fragment || !doc) return null;
  return { source: `${doc.shortTitle}, ${fragment.locator}`, sourceUrl: citationUrl(corpus, fragment), quote: fragment.sourceText };
}

/** Source, link and verbatim text from the corpus for values that name their statute unit (`lawId`). */
export function citeStatutes(params: Parameter[]): Parameter[] {
  const publiczne = tryCorpus("publiczne");
  return params.map((p) => (p.lawId ? { ...p, ...(statute(publiczne, p.lawId) ?? {}) } : p));
}

/** Rules ready for the parent's plan (lib/rules/payer.ts, lib/rules/arrears.ts); screens come later. */
function payerAndArrearsParameters(corpus: Corpus | null, state: RuleVersionsState, today: string): Parameter[] {
  const params: Parameter[] = [];
  const art61 = statute(corpus, "uz-61-1");
  if (art61) {
    params.push({
      id: "app-payer-threshold",
      group: "Kto wypłaca",
      name: "Płatnik wypłaca zasiłki sam, gdy zgłasza do ubezpieczenia chorobowego ponad",
      state: "Obowiązuje",
      ...versioned(state, "payer.insuredThreshold", today),
      ...art61,
      usedIn: "Reguła „kto wypłaca” dla planu rodzica: płatnik albo ZUS i zaświadczenie płatnika",
      scope: "Pracownicy. Prowadzącym działalność, duchownym i po ustaniu ubezpieczenia zawsze wypłaca ZUS",
      origin: "app",
      appSource: `lib/rules/payer.ts · ${PAYER_RULES_VERSION}`,
      details: [
        { label: "Liczbę ubezpieczonych ustala się", value: "na 30 listopada poprzedniego roku (art. 61 ust. 2)" },
        { label: "Zawsze ZUS", value: "działalność i współpraca, duchowni, po ustaniu ubezpieczenia, pracodawca zagraniczny" },
      ],
    });
  }

  const wage = parameterOn(scheduleOf(state), "wage.minimum", today);
  params.push({
    id: "app-wage-minimum",
    group: "Podstawa",
    name: "Minimalne wynagrodzenie za pracę",
    state: "Obowiązuje",
    ...versioned(state, "wage.minimum", today),
    source: "Rozporządzenie Rady Ministrów z 14.09.2026 (Dz.U. 2026 poz. 1213) dla 2027 r.",
    sourceUrl: "https://eli.gov.pl/eli/DU/2026/1213/ogl",
    usedIn: "Próg zadłużenia składkowego (1%) w regule zadłużenia",
    origin: "app",
    appSource: "lib/rules/parameters.ts · DEFAULTS",
    details: [
      {
        label: "Wartości w kodzie",
        value: MINIMUM_WAGE.map((w) => `${w.validFrom.slice(0, 4)}: ${formatValue("wage.minimum", w.value)}`).join(", "),
      },
    ],
  });

  const art2a = statute(corpus, "uz-2a-1");
  if (art2a) {
    const threshold = (Math.round(wage.value) / 100).toLocaleString("pl-PL", { minimumFractionDigits: 2 });
    params.push({
      id: "app-arrears-threshold",
      group: "Podstawa",
      name: "Zadłużenie składkowe wstrzymujące świadczenie: powyżej 1% minimalnego wynagrodzenia",
      value: `${threshold} zł`,
      from: wage.validFrom ?? "—",
      state: "Obowiązuje",
      ...art2a,
      usedIn: "Reguła zadłużenia dla osób opłacających składki same (działalność): stan na dzień powstania prawa",
      scope: "Prowadzący działalność i osoby z nimi współpracujące, duchowni, marynarze (art. 2a ust. 1)",
      origin: "app",
      appSource: `lib/rules/arrears.ts · ${ARREARS_RULES_VERSION}`,
      details: [
        { label: "Zmienia się razem z", value: "minimalnym wynagrodzeniem (grupa Podstawa)" },
        { label: "Bez spłaty w 6 miesięcy", value: "prawo do świadczenia się przedawnia (art. 2a ust. 2)" },
      ],
      history: [{ value: `${threshold} zł`, from: wage.validFrom ?? "—", state: "Obowiązuje" }],
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
    .map((v) => {
      const spec = CHANGE_SPECS.find((s) => s.parameter === v.parameter);
      return {
        id: v.id.slice(0, 6).toUpperCase(),
        versionId: v.id,
        parameterId: spec?.catalogId ?? "",
        scope: spec?.scope ?? "",
        publishedAt: warsawTime(v.publishedAt!),
        parameter: RULE_PARAMETERS[v.parameter].label,
        group: (spec?.group ?? "Wymiary") as ParameterGroup,
        oldValue: formatValue(v.parameter, v.previousValue),
        newValue: formatValue(v.parameter, v.value),
        author: v.author,
        state: labelOf(v, state, today),
        from: v.validFrom,
        reason: v.reason || "—",
        source: v.source,
        tests: v.checks ?? "—",
      };
    });
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

export { PATERNITY_SCENARIOS, allTestCases, paternityTestCases, rateTestCases, scenarioOutcome, type Scenario } from "./scenarios";
