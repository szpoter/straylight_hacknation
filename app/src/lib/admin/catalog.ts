import { CITATIONS, ZAM_FORM } from "../kamil/sources";
import type { PaternityResult } from "../kamil/contract";
import { citationUrl, type Corpus } from "../rag/corpus";
import { loadCorpus } from "../rag/corpus-fs";
import { formatRange, formatShort } from "../rules/dates";
import { MAX_PARTS, PATERNITY_RULES_VERSION, TOTAL_DAYS, evaluatePaternity, type PaternityInput } from "../rules/paternity";
import { LAW_IDS, assessedOn } from "../rules/sickness";
import type { KnowledgePackage, KnowledgeSource, Parameter, ParameterGroup, TestCase } from "./types";

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

function paternityParameters(): Parameter[] {
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
      name: "Zasiłek za okres urlopu ojcowskiego: łączny wymiar",
      value: `${TOTAL_DAYS} dni`,
      source: period.title,
      sourceUrl: period.url,
      quote: period.quote,
      details: [{ label: "Fragment pobrano", value: formatShort(period.fetchedAt) }],
      history: [{ value: `${TOTAL_DAYS} dni`, from: "—", state: "Obowiązuje" }],
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

/** Parameters the application applies, read from its code. */
export function appParameters(): Parameter[] {
  return [...paternityParameters(), ...sicknessParameters(tryCorpus("publiczne")), ...formParameters()];
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

/* ---------- test cases computed by the rule ---------- */

/** Kamil's profile from TECH-SPEC-AGENT.md, scenario 2: fictional data, as in tests/kamil-rules.test.ts. */
const KAMIL: PaternityInput = {
  childBirthDate: "2026-05-20",
  insuranceConfirmed: true,
  noArrears: true,
  priorParts: [],
  request: { start: "2026-12-08", days: 7 },
  today: "2026-11-21",
};

const STATUS_LABEL: Record<PaternityResult["status"], string> = {
  eligible: "przysługuje",
  not_eligible: "nie przysługuje",
  needs_info: "wymaga uzupełnienia",
};

interface Expectation {
  status: PaternityResult["status"];
  period?: string;
  deadline?: string;
  part?: string;
}

interface Scenario {
  id: string;
  title: string;
  tag: string;
  input: PaternityInput;
  expect: Expectation;
}

/** Scenarios and expected results mirror the assertions in tests/kamil-rules.test.ts. */
const PATERNITY_SCENARIOS: Scenario[] = [
  {
    id: "K-01",
    title: "Pierwszy tydzień od 8 grudnia",
    tag: "Przykład demo",
    input: KAMIL,
    expect: { status: "eligible", period: "8–14 grudnia 2026 r.", deadline: "07.12.2026", part: "1" },
  },
  {
    id: "K-02",
    title: "Druga część po wcześniejszym tygodniu",
    tag: "Części urlopu",
    input: { ...KAMIL, priorParts: [{ start: "2026-07-01", end: "2026-07-07" }] },
    expect: { status: "eligible", period: "8–14 grudnia 2026 r.", part: "2" },
  },
  {
    id: "K-03",
    title: "Wniosek dokładnie na limicie 12 miesięcy",
    tag: "Limit",
    input: { ...KAMIL, request: { start: "2027-05-13", days: 7 } },
    expect: { status: "eligible", period: "13–19 maja 2027 r." },
  },
  {
    id: "K-04",
    title: "Wniosek po ukończeniu przez dziecko 12 miesięcy",
    tag: "Limit",
    input: { ...KAMIL, request: { start: "2027-05-14", days: 7 } },
    expect: { status: "needs_info" },
  },
  {
    id: "K-05",
    title: "Termin złożenia ZAM już minął",
    tag: "Termin",
    input: { ...KAMIL, today: "2026-12-08" },
    expect: { status: "needs_info" },
  },
  {
    id: "K-06",
    title: "Brak ubezpieczenia chorobowego",
    tag: "Odmowa",
    input: { ...KAMIL, insuranceConfirmed: false },
    expect: { status: "not_eligible" },
  },
  {
    id: "K-07",
    title: "Wykorzystane już 14 dni",
    tag: "Odmowa",
    input: { ...KAMIL, priorParts: [{ start: "2026-06-01", end: "2026-06-14" }] },
    expect: { status: "not_eligible" },
  },
  {
    id: "K-08",
    title: "Brak potwierdzenia ubezpieczenia",
    tag: "Brakujące dane",
    input: { ...KAMIL, insuranceConfirmed: null },
    expect: { status: "needs_info" },
  },
];

const PROFILE_FIELDS = new Set(["child_birth_date", "insurance_confirmed", "no_arrears"]);

const yesNo = (v: boolean | null) => (v === null ? "brak potwierdzenia" : v ? "tak" : "nie");

function inputRows(input: PaternityInput) {
  const parts = input.priorParts.map((p) => formatRange(p.start, p.end)).join(", ");
  const request = input.request?.start
    ? `od ${formatShort(input.request.start)}${input.request.days ? `, ${input.request.days} dni` : ""}`
    : "—";
  return [
    { label: "Data urodzenia dziecka", value: input.childBirthDate ? formatShort(input.childBirthDate) : "—" },
    { label: "Dobrowolne ubezpieczenie chorobowe", value: yesNo(input.insuranceConfirmed) },
    { label: "Składki bez zaległości", value: yesNo(input.noArrears) },
    { label: "Wcześniej wykorzystane części", value: parts || "brak" },
    { label: "Wniosek", value: request },
    { label: "Dzień oceny", value: formatShort(input.today) },
  ];
}

function resultValues(r: PaternityResult): Required<Omit<Expectation, "status">> & { status: string } {
  return {
    status: STATUS_LABEL[r.status],
    period: r.period ? formatRange(r.period.start, r.period.end) : "—",
    deadline: r.deadline ? formatShort(r.deadline) : "—",
    part: r.partNumber ? String(r.partNumber) : "—",
  };
}

const ROW_LABELS = { status: "Wynik", period: "Okres", deadline: "Termin ZAM", part: "Część urlopu" } as const;

export function paternityTestCases(): TestCase[] {
  return PATERNITY_SCENARIOS.map((s) => {
    const r = evaluatePaternity(s.input);
    const actual = resultValues(r);
    const expected = { ...s.expect, status: STATUS_LABEL[s.expect.status] };
    const keys = (Object.keys(ROW_LABELS) as (keyof typeof ROW_LABELS)[]).filter((k) => expected[k] !== undefined);
    const matches = keys.every((k) => expected[k] === actual[k]);
    const missingProfile = r.status === "needs_info" && PROFILE_FIELDS.has(r.missing[0] ?? "");
    return {
      id: s.id,
      title: s.title,
      tag: s.tag,
      status: missingProfile && matches ? "brak-danych" : matches ? "zgodna" : "niezgodna",
      inputs: inputRows(s.input),
      expected: keys.map((k) => ({ label: ROW_LABELS[k], value: expected[k] as string })),
      result: keys.map((k) => ({ label: ROW_LABELS[k], value: actual[k] })),
      missing: missingProfile ? (r.question ?? undefined) : undefined,
      reasons: r.reasons.map((reason) => reason.text),
      computedBy: `lib/rules/paternity.ts · ${r.rulesVersion}`,
    };
  });
}
