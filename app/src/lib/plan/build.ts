/**
 * Plan z odpowiedzi onboardingu. Czysta funkcja: ten sam katalog przystanków co plany demo,
 * terminy przesunięte do daty rodzica, stan „świeży” — nic nie jest za rodzicem poza sprawami,
 * które dzieją się same. TODO(reguły): terminy z `lib/rules`, gdy obejmą cały katalog.
 */
import { addDays, daysBetween, formatLong, DEMO_TODAY } from "@/lib/demo/dates";
import { CATALOG } from "@/lib/demo/fixtures";
import { S } from "@/lib/demo/stop-details";
import type { Plan, StageId, Stop } from "@/lib/demo/types";

export type BuildSituation = "planuje" | "ciaza" | "urodzone" | "adopcja" | "piecza";
export type Employment = "etat" | "dzialalnosc" | "inne" | "nie-pracuje";

export type BuildAnswers = {
  situation: BuildSituation;
  /** Rola: „drugi-rodzic”, „drugi-adopcyjny”, „drugi-opiekun” = nie osoba, która rodzi. */
  role?: string;
  /** Data urodzenia, przyjęcia albo planowany termin porodu (ISO). */
  date?: string;
  childCount?: "1" | "2" | "3";
  /** Imiona dzieci (urodzone, adopcja, piecza) — jedno na dziecko, puste = „Dziecko 1”. */
  names?: string[];
  /** Nazwa planu przy ciąży i planowaniu. Zgodność wstecz: dawne pole `name`. */
  name?: string;
  employment?: Employment;
  jobChange?: "tak" | "nie" | "nie-wiem" | "pominieto";
};

const MONTHS_GEN = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];
const MONTHS_NOM = ["styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec", "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"];

/** Sprawy tylko dla osoby, która rodzi (dla drugiego rodzica ich nie pokazujemy). */
const BIRTHING_ONLY = [
  "badania-prenatalne",
  "chorobowy-ciaza",
  "zasilek-likwidacja",
  "swiadczenie-rehabilitacyjne",
  "macierzynski-przed",
  "zasilek-macierzynski",
  "urlop-macierzynski",
  "z3",
  "praca",
];
/** Sprawy związane z porodem — nie dotyczą adopcji ani pieczy zastępczej. */
const BIRTH_ONLY = [
  "badania-prenatalne",
  "chorobowy-ciaza",
  "zasilek-likwidacja",
  "swiadczenie-rehabilitacyjne",
  "macierzynski-przed",
  "przesiewowe",
  "urlop-macierzynski",
  "z3",
  "zglos-urodzenie",
  "odpis",
  "praca",
];
const EMPLOYEE_ONLY = ["urlop-macierzynski", "macierzynski-przed", "rodzicielski", "rodzicielski-praca", "zasilek-likwidacja"];

const SECOND = new Set(["drugi-rodzic", "drugi-adopcyjny", "drugi-opiekun"]);

export function isSecondParent(role?: string): boolean {
  return Boolean(role && SECOND.has(role));
}

/** Odmiana imienia na potrzeby katalogu („Dla Oli”, „Zgłoś Olę”). Ostrożnie: tylko proste końcówki. */
export function declineName(name: string): { nom: string; gen: string; acc: string } {
  const n = name.trim();
  const lower = n.toLowerCase();
  if (/a$/.test(lower)) {
    const stem = n.slice(0, -1);
    let gen = `${stem}y`;
    if (/ia$/.test(lower)) gen = `${stem}i`;
    else if (/ja$/.test(lower)) gen = `${n.slice(0, -2)}i`;
    else if (/[lkg]a$/.test(lower)) gen = `${stem}i`;
    return { nom: n, gen, acc: `${stem}ę` };
  }
  // Imiona męskie (biernik = dopełniacz): Antek → Antka, Paweł → Pawła, Jaś → Jasia, Jan → Jana.
  const soft: Record<string, string> = { ś: "sia", ć: "cia", ń: "nia", ź: "zia" };
  let gen: string | undefined;
  if (/ek$/.test(lower)) gen = `${n.slice(0, -2)}ka`;
  else if (/eł$/.test(lower)) gen = `${n.slice(0, -2)}ła`;
  else if (soft[lower.slice(-1)]) gen = `${n.slice(0, -1)}${soft[lower.slice(-1)]}`;
  else if (/[bcdfghjklłmnprstwzż]$/.test(lower)) gen = `${n}a`;
  if (gen) return { nom: n, gen, acc: gen };
  return { nom: n, gen: n, acc: n };
}

function renameChild(text: string, forms: { nom: string; gen: string; acc: string }): string {
  // \b nie zna polskich liter (np. „Olę”), więc granice słowa przez \p{L}.
  return text.replace(/(?<!\p{L})Oli(?!\p{L})/gu, forms.gen).replace(/(?<!\p{L})Olę(?!\p{L})/gu, forms.acc).replace(/(?<!\p{L})Ola(?!\p{L})/gu, forms.nom);
}

/** Przesuwa daty zapisane słownie („30 marca 2027”) o `shift` dni. */
export function shiftTextDates(text: string, shift: number): string {
  if (!shift) return text;
  const re = new RegExp(`(\\d{1,2}) (${MONTHS_GEN.join("|")}) (\\d{4})`, "g");
  return text.replace(re, (_, d: string, m: string, y: string) => {
    const iso = `${y}-${String(MONTHS_GEN.indexOf(m) + 1).padStart(2, "0")}-${String(Number(d)).padStart(2, "0")}`;
    return formatLong(addDays(iso, shift));
  });
}

function addMonths(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + months, d));
  return date.toISOString().slice(0, 10);
}

function stageFor(situation: BuildSituation, date: string | undefined, today: string): StageId {
  if (situation === "planuje") return "przed";
  if (situation === "ciaza") return "ciaza";
  if (!date) return "narodziny";
  return daysBetween(date, today) <= 56 ? "narodziny" : "po";
}

const STAGES: StageId[] = ["przed", "ciaza", "narodziny", "po"];

/**
 * Sprawy rodzica (urlopy, zasiłki, ciąża) — wspólne dla rodzeństwa z jednego porodu, więc
 * przy bliźniętach są tylko w planie pierwszego dziecka. Pozostałe sprawy dotyczą każdego dziecka.
 */
const PARENT_LEVEL = [
  "ubezpieczenie",
  "wysokosc",
  "badania-prenatalne",
  "ryzyka",
  "chorobowy-ciaza",
  "zasilek-likwidacja",
  "swiadczenie-rehabilitacyjne",
  "macierzynski-przed",
  "zaplanuj-urlopy",
  "z3",
  "zasilek-macierzynski",
  "urlop-macierzynski",
  "urlop-ojcowski",
  "rodzicielski",
  "rodzicielski-praca",
  "powrot",
  "praca",
];

/**
 * Wymiar urlopów według liczby dzieci z jednego porodu. Źródła (sprawdzone 21.11.2026):
 * gov.pl „Urlop macierzyński” — 20 / 31 / 33 / 35 / 37 tygodni (1 / 2 / 3 / 4 / 5+ dzieci);
 * gov.pl „Urlop rodzicielski” — 41 tygodni przy jednym dziecku, 43 przy porodzie mnogim.
 */
export function leaveWeeks(children: number): { maternity: number; parental: number } {
  const maternity = [20, 20, 31, 33, 35][children] ?? 37;
  return { maternity, parental: children > 1 ? 43 : 41 };
}

const CHILDREN_GEN = ["", "jednego dziecka", "dwojga dzieci", "trojga dzieci", "czworga dzieci"];

/** Świeży stan przystanku: bez postępu z przykładu Oli. Etap, który rodzic ma za sobą → „Za Tobą”. */
function fresh(stop: Stop, expected: boolean, past: boolean): Stop {
  const isInfo = stop.kind === "informacja" || stop.kind === "program-zdrowotny";
  // Notatka szkicu z przykładu („Brakuje numeru PESEL Oli”) nie dotyczy nowego planu — bez szkicu jej nie ma.
  // Przycisk sprawy wynika ze stanu (CaseCard → rowAction), więc etykieta `action` z przykładu nie przecieka.
  const note = stop.condition ?? (stop.doc?.hasDraft ? undefined : stop.doc?.note);
  const doc = stop.doc && { goal: stop.doc.goal, recipient: stop.doc.recipient, note, optional: stop.doc.optional };
  if (past) return { ...stop, state: "minelo", checked: undefined, due: undefined, doc, risk: undefined };
  if (isInfo) return { ...stop, state: undefined, checked: false, doc };
  if (stop.kind === "dzieje-sie-samo") return { ...stop, state: undefined, checked: undefined, doc };
  const state = stop.condition || (expected && stop.stage !== "ciaza" && stop.stage !== "przed") ? "warunek" : "aktualna";
  return { ...stop, checked: undefined, state, doc };
}

const childNumber = (n: number, count: number) => (count > 1 ? `Dziecko ${n}` : "Dziecko");

/** Wspólne etykiety planu: krótka informacja w selektorze i data pod nazwą. */
function labels(situation: BuildSituation, keyDate: string | undefined, today: string, count: number) {
  const expected = situation === "ciaza" || situation === "planuje";
  const care = situation === "adopcja" || situation === "piecza";
  const [y, m] = (keyDate ?? today).split("-").map(Number);
  const many = count === 2 ? " · bliźnięta" : count >= 3 ? " · trojaczki lub więcej" : "";
  const shortInfo =
    situation === "planuje"
      ? "planowane"
      : expected
        ? `${MONTHS_NOM[m - 1]} ${y}${many}`
        : `${Math.max(0, daysBetween(keyDate ?? today, today))} dni`;
  const keyDateLabel = !keyDate
    ? "Plan bez daty"
    : expected
      ? `Termin ${formatLong(keyDate)}`
      : care
        ? `Pod opieką od ${formatLong(keyDate, false)}`
        : `ur. ${formatLong(keyDate, false)}`;
  return { shortInfo, keyDateLabel };
}

/** Jeden plan (pierwsze dziecko). Zostawione dla zgodności — onboarding używa `buildPlans`. */
export function buildPlan(answers: BuildAnswers, id: string, today: string = DEMO_TODAY): Plan {
  return buildPlans(answers, id, today)[0];
}

/** Starsze plany mają zapisany cały katalog. Uaktualniamy wyłącznie sprawy urlopowe. */
export function refreshSavedLeavePlan(plan: Plan): Plan {
  if (!Array.isArray(plan?.stops)) return plan;
  const plainId = (stop: Stop) => stop.id.replace(/^e-/, "");
  const parental = plan.stops.find(s => plainId(s) === "rodzicielski");
  const obsolete = plan.stops.some(s => (plainId(s) === "urlop-macierzynski" && s.kind !== "informacja")
    || (plainId(s) === "macierzynski-przed" && !s.doc))
    || (parental && !plan.stops.some(s => plainId(s) === "rodzicielski-praca"));
  if (!obsolete) return plan;
  const expected = plan.stops.some(s => s.id.startsWith("e-"));
  const answers: BuildAnswers = plan.origin ? plan.origin.answers as BuildAnswers : {
    situation: plan.situation ?? (expected ? "ciaza" : "urodzone"), date: plan.keyDate, name: plan.name,
  };
  let catalog: Plan | undefined;
  try {
    catalog = buildPlans(answers, plan.origin?.idBase ?? plan.id, plan.origin?.builtOn).find(p => p.id === plan.id);
  } catch {
    // Uszkodzony zapis nie powinien uniemożliwić otwarcia pozostałych planów.
    return plan;
  }
  if (!catalog) return plan;
  const updatedStops = new Map(catalog.stops.map(s => [s.id, s]));
  const work = catalog.stops.find(s => plainId(s) === "rodzicielski-praca");
  const addWork = work && !plan.stops.some(s => s.id === work.id);
  const leaveIds = ["macierzynski-przed", "urlop-macierzynski", "urlop-ojcowski", "rodzicielski", "rodzicielski-praca"];
  const stops = plan.stops.flatMap(old => {
    if (!leaveIds.includes(plainId(old))) return [old];
    const updated = updatedStops.get(old.id);
    if (!updated) return [];
    if (!updated.doc) return [{ ...updated, checked: old.checked ?? updated.checked }];
    const progressed = old.doc && old.state && !["warunek", "aktualna"].includes(old.state);
    const stop = { ...updated, sharedGroup: old.sharedGroup, ...(progressed && { state: old.state, doc: { ...updated.doc, ...old.doc } }) };
    return old === parental && addWork
      ? [stop, { ...work, sharedGroup: old.sharedGroup }] : [stop];
  });
  return { ...plan, stops };
}

/**
 * Plany z odpowiedzi onboardingu. Ciąża i planowanie → jeden plan (dzieci jeszcze nie mają imion).
 * Dziecko urodzone, adopcja, piecza → osobny plan dla każdego dziecka. Sprawy rodzica (urlopy,
 * zasiłek) są w każdym planie jako jedna wspólna sprawa (`sharedGroup`), więc ścieżki rodzeństwa
 * wyglądają tak samo, a odhaczenie w jednym planie widać we wszystkich.
 */
export function buildPlans(answers: BuildAnswers, idBase: string, today: string = DEMO_TODAY): Plan[] {
  const { situation } = answers;
  const expected = situation === "ciaza" || situation === "planuje";
  const count = answers.childCount === "2" ? 2 : answers.childCount === "3" ? Math.max(3, answers.names?.length ?? 3) : 1;
  if (expected) {
    const name =
      answers.name?.trim() ||
      (situation === "planuje" ? "Plan na rodzicielstwo" : count === 2 ? "Oczekiwane bliźnięta" : count > 2 ? "Oczekiwane dzieci" : "Oczekiwane dziecko");
    return [{ ...buildOne(answers, idBase, today, { name, named: Boolean(answers.name?.trim()), count, primary: true }), origin: { answers: answers as Record<string, unknown>, idBase, builtOn: today } }];
  }
  const raw = answers.names?.length ? answers.names : answers.name ? [answers.name] : [];
  const names = Array.from({ length: count }, (_, i) => raw[i]?.trim() || "");
  const display = names.map((n, i) => n || childNumber(i + 1, count));
  const ids = names.map((_, i) => (count > 1 ? `${idBase}-${i + 1}` : idBase));
  const origin = { answers: answers as Record<string, unknown>, idBase, builtOn: today };
  const plans = names
    .map((n, i) => buildOne(answers, ids[i], today, { name: display[i], named: Boolean(n), count, primary: i === 0, group: count > 1 ? idBase : undefined }))
    .map((p) => ({ ...p, origin }));
  if (count === 1) return plans;
  const label = count === 2 ? "bliźnięta" : "rodzeństwo z jednego porodu";
  return plans.map((p) => ({ ...p, family: { groupId: idBase, label, primaryPlanId: ids[0], primaryName: display[0], names: display } }));
}

function buildOne(
  answers: BuildAnswers,
  id: string,
  today: string,
  child: { name: string; named: boolean; count: number; primary: boolean; group?: string },
): Plan {
  const { situation } = answers;
  const expected = situation === "ciaza" || situation === "planuje";
  const care = situation === "adopcja" || situation === "piecza";
  const second = isSecondParent(answers.role);
  const keyDate = situation === "planuje" ? undefined : answers.date;
  const catalogKey = expected ? CATALOG.expectedKeyDate : CATALOG.bornKeyDate;
  const shift = keyDate ? daysBetween(catalogKey, keyDate) : 0;
  const forms = child.named ? declineName(child.name) : { nom: "dziecko", gen: "dziecka", acc: "dziecko" };
  const stage = stageFor(situation, keyDate, today);
  const stageIndex = STAGES.indexOf(stage);
  const baseId = (s: Stop) => s.id.replace(/^e-/, "");

  // Etapy wcześniejsze niż bieżący zostają na ścieżce jako „Za Tobą” (zwinięte), pionek stoi na bieżącym.
  let stops = (expected ? CATALOG.expected() : CATALOG.born()).map((s) => fresh(s, expected, STAGES.indexOf(s.stage) < Math.min(stageIndex, expected ? stageIndex : 2)));
  if (second) stops = stops.filter((s) => !BIRTHING_ONLY.includes(baseId(s)));
  if (care) stops = stops.filter((s) => !BIRTH_ONLY.includes(baseId(s)) && s.stage !== "ciaza");
  if (situation === "piecza") stops = stops.filter(s => baseId(s) !== "urlop-ojcowski");
  if (answers.employment && answers.employment !== "etat") {
    // Przy planie matki status zatrudnienia ojca pozostaje nieznany.
    stops = stops.filter(s => !EMPLOYEE_ONLY.includes(baseId(s)) && !(second && baseId(s) === "urlop-ojcowski"));
  }
  // Rodzeństwo: sprawy rodzica (urlopy, zasiłek) są w planie każdego dziecka, ale to jedna sprawa —
  // `sharedGroup` każe zapisywać zmianę we wszystkich planach grupy (PlanProvider).
  if (child.count > 1 && child.group) stops = stops.map((s) => (PARENT_LEVEL.includes(baseId(s)) ? { ...s, sharedGroup: child.group } : s));

  const weeks = leaveWeeks(child.count);
  const ids = new Set(stops.map((s) => s.id));
  stops = stops.map((s) => {
    const text = (t: string) => shiftTextDates(renameChild(t, forms), shift);
    let next: Stop = {
      ...s,
      title: renameChild(s.title, forms),
      forWhom: second && baseId(s) === "urlop-ojcowski" ? "Dla Ciebie" : renameChild(s.forWhom, forms),
      why: text(s.why),
      condition: s.condition && text(s.condition),
      dueBasis: s.dueBasis && text(s.dueBasis),
      prepare: s.prepare?.map((p) => renameChild(p, forms)),
      howTo: s.howTo && { co: text(s.howTo.co), doKogo: text(s.howTo.doKogo), doKiedy: text(s.howTo.doKiedy), zalaczniki: text(s.howTo.zalaczniki) },
      due: s.due && (situation === "planuje" ? undefined : addDays(s.due, shift)),
      parallelWith: s.parallelWith && ids.has(s.parallelWith) ? s.parallelWith : undefined,
      doc: s.doc && { ...s.doc, note: s.doc.note && text(s.doc.note) },
      // Ryzyko z przykładu (konkretna data umowy) nie dotyczy nowego rodzica.
      risk: undefined,
    };
    if (situation === "planuje" && next.state === "aktualna" && s.due) next = { ...next, state: "warunek", condition: "Po zajściu w ciążę" };
    if (baseId(s) === "macierzynski-przed" && situation === "planuje") next = { ...next, state: "warunek", condition: "Po ustaleniu przewidywanej daty porodu", dueBasis: undefined };
    if (baseId(s) === "urlop-ojcowski" && second) next = { ...next, institution: "Twój pracodawca", howTo: next.howTo && { ...next.howTo, doKogo: "Twój pracodawca" } };
    if (!expected && baseId(s) === "800plus" && keyDate) next = { ...next, due: addMonths(keyDate, 3), dueBasis: "3 miesiące od urodzenia — wtedy wypłata od dnia urodzenia" };
    if (child.count > 1 && ["zasilek-macierzynski", "urlop-macierzynski", "macierzynski-przed"].includes(baseId(s)) && next.state !== "minelo") {
      const who = CHILDREN_GEN[child.count] ?? "pięciorga i więcej dzieci";
      next = { ...next, notes: [{ text: `Przy urodzeniu ${who} przy jednym porodzie urlop macierzyński trwa ${weeks.maternity} tygodni.`, sources: [S.govMaternity, S.zielonaLinia] }] };
    }
    if (child.count > 1 && baseId(s) === "rodzicielski" && next.state !== "minelo") {
      next = { ...next, notes: [{ text: `Przy porodzie mnogim urlop rodzicielski trwa ${weeks.parental} tygodnie (przy jednym dziecku 41).`, sources: [S.govParental] }] };
    }
    return next;
  });

  // Ostrzeżenia z odpowiedzi.
  const riskTarget = stops.find((s) => ["zasilek-macierzynski", "urlop-ojcowski", "praca"].includes(baseId(s)) && s.kind !== "informacja" && s.state !== "minelo");
  if (answers.jobChange === "tak" && riskTarget) {
    stops = stops.map((s) =>
      s.id === riskTarget.id
        ? {
            ...s,
            // Bez twierdzeń, których nie potwierdziło źródło: tylko wskazanie, gdzie ZUS opisuje warunki.
            risk: {
              title: "Zmiana pracy lub koniec umowy",
              detail: "W odpowiedziach zaznaczono zmianę pracy albo koniec umowy. Zanim złożysz wniosek, sprawdź w ZUS, komu przysługuje zasiłek macierzyński.",
              action: "Sprawdź warunki w ZUS",
              sources: [S.zusKomu],
            },
          }
        : s,
    );
  }
  if (answers.employment === "nie-pracuje") {
    stops = stops.map((s) =>
      ["zasilek-macierzynski", "urlop-ojcowski"].includes(baseId(s)) && !s.risk && s.state !== "minelo"
        ? {
            ...s,
            risk: {
              title: "Świadczenie rodzicielskie",
              detail:
                "Jeśli nie dostaniesz zasiłku macierzyńskiego, możesz złożyć wniosek o świadczenie rodzicielskie: 1000 zł miesięcznie, niezależnie od dochodu. Wniosek rozpatruje urząd miasta lub gminy albo ośrodek pomocy społecznej. Termin: 3 miesiące od urodzenia lub przyjęcia dziecka.",
              action: "Sprawdź świadczenie rodzicielskie",
              sources: [S.govParentBenefit],
            },
          }
        : s,
    );
  }

  // Dobrowolne ubezpieczenie chorobowe (zadanie ZUS s. 10, pkt H.3): bez niego w dniu porodu
  // albo przyjęcia dziecka nie ma zasiłku macierzyńskiego. Teksty tylko z Poradnika ZUS i ustawy.
  const voluntaryRisk = employmentRisk(answers.employment);
  if (voluntaryRisk) {
    stops = stops.map((s) =>
      ["zasilek-macierzynski", "urlop-ojcowski"].includes(baseId(s)) && !s.risk && s.state !== "minelo" ? { ...s, risk: voluntaryRisk } : s,
    );
  }

  const { shortInfo, keyDateLabel } = labels(situation, keyDate, today, child.count);
  const calculator = expected ? CATALOG.expectedCalculator : CATALOG.bornCalculator;
  return {
    id,
    name: child.name,
    kind: "planowane",
    shortInfo,
    keyDateLabel,
    keyDate,
    situation,
    stage,
    stages: CATALOG.stages(),
    stops,
    calculator,
  };
}

/**
 * Ostrzeżenie przy działalności albo innej umowie niż o pracę. Źródła: Poradnik ZUS 2026, s. 10
 * i 14 (dobrowolne ubezpieczenie chorobowe, bez zgłoszenia wstecz); ustawa zasiłkowa art. 29
 * (urodzenie albo przyjęcie dziecka w okresie ubezpieczenia) i art. 2a (zaległości w składkach).
 */
export function employmentRisk(employment: Employment | undefined): Stop["risk"] {
  if (employment === "dzialalnosc") {
    return {
      title: "Dobrowolne ubezpieczenie chorobowe i składki",
      detail:
        "Przy własnej firmie ubezpieczenie chorobowe jest dobrowolne. Zasiłek macierzyński przysługuje tylko wtedy, gdy podlegasz temu ubezpieczeniu w dniu porodu albo przyjęcia dziecka. Co do zasady nie można zgłosić się do niego wstecz. Jeśli w dniu powstania prawa do zasiłku zaległość w składkach przekracza 1% minimalnego wynagrodzenia, zasiłek nie przysługuje do spłaty całego długu, a bez spłaty w ciągu 6 miesięcy prawo się przedawnia.",
      action: "Sprawdź zasady w Poradniku ZUS",
      sources: [S.poradnikFirma, S.uzArt2a],
    };
  }
  if (employment === "inne") {
    return {
      title: "Inna umowa: sprawdź ubezpieczenie chorobowe",
      detail:
        "Przy umowie zlecenia ubezpieczenie chorobowe jest dobrowolne, na Twój wniosek. Co do zasady obejmuje Cię najwcześniej od dnia złożenia zgłoszenia w ZUS, nie wstecz. Zasiłek macierzyński przysługuje tylko wtedy, gdy podlegasz temu ubezpieczeniu w dniu porodu albo przyjęcia dziecka.",
      action: "Sprawdź zasady w Poradniku ZUS",
      sources: [S.poradnikZlecenie, S.uzArt29],
    };
  }
  return undefined;
}

/** Liczby na ekran „Twój plan jest gotowy”. */
export function planHighlights(plan: Plan, today: string = DEMO_TODAY) {
  const current = plan.stops.filter((s) => s.state !== "minelo");
  const official = current.filter((s) => s.kind !== "dzieje-sie-samo");
  const now = plan.stops.filter((s) => s.state === "aktualna" || ((s.kind === "informacja" || s.kind === "program-zdrowotny") && s.stage === plan.stage));
  const nearest = plan.stops
    .filter((s) => s.due && s.state === "aktualna" && daysBetween(today, s.due) >= -30)
    .sort((a, b) => (a.due ?? "").localeCompare(b.due ?? ""))[0];
  const stages = new Set(current.map((s) => s.stage)).size;
  const warnings = plan.stops.filter((s) => s.risk).length;
  return { total: official.length, now: now.length, nearest, stages, warnings };
}
