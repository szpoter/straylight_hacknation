/**
 * Gotowe scenariusze do wyboru na początku onboardingu (/start). Ola to pełny przykład
 * z `fixtures.ts`. Pozostałe budujemy tym samym silnikiem co plan z pytań (`lib/plan/build.ts`)
 * ze stałą datą demo, więc wyglądają jak plan ułożony przez rodzica. Rodzice są ci sami co u Oli
 * (dane z logowania), różnią się dzieci. Wyłącznie dane fikcyjne.
 */
import { DEFAULT_PLAN_ID, getPlan } from "./fixtures";
import { buildPlans, type BuildAnswers } from "../plan/build";
import type { CaseState, Plan } from "./types";

export type Scenario = {
  id: string;
  title: string;
  /** Zdanie pod tytułem na karcie wyboru. */
  description: string;
  /** Plany scenariusza; rodzeństwo z jednego porodu ma plan dla każdego dziecka. */
  plans: Plan[];
};

/** Sprawa, którą rodzina ma już za sobą: stan albo „odhaczone” i wpis o wyniku. */
type Done = { state?: CaseState; checked?: boolean; result?: string; lastEvent?: string };

function withProgress(plans: Plan[], progress: Record<string, Done>): Plan[] {
  return plans.map((plan) => ({
    ...plan,
    stops: plan.stops.map((stop) => {
      const done = progress[stop.id];
      if (!done) return stop;
      if (done.checked !== undefined) return { ...stop, checked: done.checked };
      return {
        ...stop,
        state: done.state,
        due: undefined,
        condition: undefined,
        doc: stop.doc && { ...stop.doc, note: undefined, result: done.result, lastEvent: done.lastEvent },
      };
    }),
  }));
}

const BORN: BuildAnswers = { situation: "urodzone", role: "urodzilam", childCount: "1", employment: "etat", jobChange: "nie" };

/** Antek ma 4 miesiące: sprawy po porodzie są załatwione, otwarte zostają urlopy i becikowe. */
const ANTEK_PROGRESS: Record<string, Done> = {
  przesiewowe: { checked: true },
  "urlop-macierzynski": { checked: true },
  "zglos-urodzenie": { state: "zalatwione", result: "Akt urodzenia sporządzony", lastEvent: "Zgłoszono 4 sierpnia 2026" },
  odpis: { state: "zalatwione", result: "Odpis odebrany", lastEvent: "Odebrano 6 sierpnia 2026" },
  "ubezpieczenie-dziecka": { state: "zalatwione", result: "Antek jest ubezpieczony", lastEvent: "Zgłoszono 12 sierpnia 2026" },
  "zasilek-macierzynski": { state: "zalatwione", result: "Zasiłek wypłacany co miesiąc", lastEvent: "Pierwsza wypłata 10 września 2026" },
  "800plus": { state: "zalatwione", result: "Świadczenie przyznane", lastEvent: "Przyznano 2 września 2026" },
  poz: { state: "zalatwione", result: "Przychodnia wybrana", lastEvent: "Deklaracja złożona 20 sierpnia 2026" },
};

export const SCENARIOS: Scenario[] = [
  {
    id: DEFAULT_PLAN_ID,
    title: "Ola Lis",
    description: "Urodzona 10 listopada 2026. Pełny przykład z wnioskami w toku i dokumentami.",
    plans: [getPlan(DEFAULT_PLAN_ID)],
  },
  {
    id: "lena-kuba",
    title: "Lena i Kuba",
    description: "Bliźnięta urodzone 4 listopada 2026. Osobny plan dla każdego dziecka i dłuższe urlopy.",
    plans: buildPlans({ ...BORN, date: "2026-11-04", childCount: "2", names: ["Lena", "Kuba"] }, "lena-kuba"),
  },
  {
    id: "antek",
    title: "Antek",
    description: "Urodzony 20 lipca 2026, ma 4 miesiące. Pierwsze sprawy są załatwione, teraz urlop rodzicielski.",
    plans: withProgress(buildPlans({ ...BORN, date: "2026-07-20", names: ["Antek"] }, "antek"), ANTEK_PROGRESS),
  },
];

/** Plany gotowych scenariuszy z przypisaną rodziną. */
export const SCENARIO_PLANS: Plan[] = SCENARIOS.flatMap((s) => s.plans.map((p) => ({ ...p, scenario: s.id })));

/** Rodzina planu. Plany sprzed podziału na rodziny tworzą własną (rodzeństwo z porodu — wspólną). */
export function scenarioOf(plan: Pick<Plan, "id" | "scenario" | "family">): string {
  return plan.scenario ?? plan.family?.groupId ?? plan.id;
}

export function isPresetScenario(id: string): boolean {
  return SCENARIOS.some((s) => s.id === id);
}

/** Pierwszy plan rodziny wyznacza jej nazwę („Rodzina Leny i Kuby”), dodane dzieci go nie zmieniają. */
function isFounder(plan: Plan, scenario: string): boolean {
  return plan.id === scenario || plan.family?.groupId === scenario;
}

/**
 * Dzieci rodziny wybranego planu, w kolejności dodania: najpierw plany, od których rodzina się
 * zaczęła (scenariusz albo pierwszy plan z onboardingu), potem dzieci dodane później.
 */
export function familyOf(plans: Plan[], plan: Plan): Plan[] {
  const scenario = scenarioOf(plan);
  const members = plans.filter((p) => scenarioOf(p) === scenario);
  const founders = members.filter((p) => isFounder(p, scenario));
  // Id planów z onboardingu zawierają chwilę utworzenia („plan-1763…”), więc sortują się po kolei.
  const added = members.filter((p) => !isFounder(p, scenario)).sort((a, b) => a.id.localeCompare(b.id));
  return [...founders, ...added];
}
