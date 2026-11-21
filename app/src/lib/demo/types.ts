/**
 * Model danych widoków po zalogowaniu (SPEC-PO-LOGOWANIU.md). Na etapie UI zasilany danymi
 * fikcyjnymi z `fixtures.ts`. Backend podmieni źródło, zachowując te typy.
 */

export type StageId = "przed" | "ciaza" | "narodziny" | "po";

/** Typ przystanku (katalog przystanków). */
export type StopKind = "obowiazek" | "na-wniosek" | "informacja" | "program-zdrowotny" | "dzieje-sie-samo";

/** Jeden stan sprawy w danych („Jeden model statusów”). */
export type CaseState =
  | "warunek" // warunek nie zaszedł
  | "aktualna" // aktualna, nierozpoczęta
  | "szkic"
  | "wypelniony"
  | "zatwierdzony"
  | "wyslano" // wysłano, potwierdzono wpływ, w rozpatrywaniu
  | "wezwanie"
  | "odmowa-w-terminie"
  | "zalatwione"
  | "nie-korzystam";

export type DocGoal = "urlopy" | "swiadczenia" | "rejestracja" | "zdrowie";

export type ValueSource = "zus" | "rejestr" | "rodzic" | "demo" | "zalozenie";

export type HowTo = {
  co: string;
  doKogo: string;
  doKiedy: string;
  zalaczniki: string;
};

export type CaseEvent = {
  date: string; // ISO
  title: string;
  detail?: string;
  author?: string;
};

export type Stop = {
  id: string;
  stage: StageId;
  title: string;
  kind: StopKind;
  /** Stan urzędowy; przystanki informacyjne i zdrowotne go nie mają. */
  state?: CaseState;
  /** Prywatne „Odhaczone” dla „Informacja” i „Program zdrowotny”. */
  checked?: boolean;
  /** Sprawa równoległa w tym samym rzędzie ścieżki. */
  parallelWith?: string;
  /** Pod-etap, np. trymestr w „Ciąży”. */
  substage?: string;
  due?: string; // ISO
  /** Podstawa terminu, np. „21 dni od wystawienia karty urodzenia”. */
  dueBasis?: string;
  /** Warunek dla „Przed Tobą”, np. „Po nadaniu numeru PESEL”. */
  condition?: string;
  institution: string;
  forWhom: string;
  why: string;
  prepare?: string[];
  howTo?: HowTo;
  source: { label: string; url: string };
  action: { label: string; href?: string };
  /** „Nic nie musisz robić” — kto to zrobi. */
  whoDoesIt?: string;
  risk?: { title: string; detail: string; action: string };
  /** Wiersz w „Dokumentach i wnioskach”; brak = przystanek bez dokumentu. */
  doc?: {
    goal: DocGoal;
    recipient: string;
    note?: string;
    lastEvent?: string;
    optional?: boolean;
    hasDraft?: boolean;
    events?: CaseEvent[];
    summons?: { from: string; due: string; text: string; tasks: string[] };
    result?: string;
  };
};

export type PlanKind = "rejestr" | "planowane" | "test" | "przyklad";

export type Plan = {
  id: string;
  name: string;
  kind: PlanKind;
  /** Drugi wiersz w selektorze, np. „2 miesiące” albo „maj 2027”. */
  shortInfo: string;
  /** Data kluczowa pod nazwą w pasku, np. „Urodzona 10 listopada”. */
  keyDateLabel: string;
  stage: StageId;
  stages: Record<StageId, { label: string; variant?: string }>;
  stops: Stop[];
  calculator: CalculatorPlan;
};

export type Parent = {
  id: "ty" | "partner";
  label: string;
  /** Stawka dzienna brutto; brak = brak podstawy. */
  dailyRate?: number;
};

export type Segment = {
  id: string;
  parentId: Parent["id"];
  kind: "macierzynski" | "rodzicielski" | "ojcowski";
  start: string; // ISO
  days: number;
  note?: string;
  error?: string;
  draft?: boolean;
};

export type Variant = { id: "A" | "B"; label: string; segments: Segment[] };

export type CalculatorPlan = {
  scope: string;
  assumptions: string;
  parents: Parent[];
  /** Pula rodzicielskiego w tygodniach. */
  poolWeeks: number;
  reservedWeeksEach: number;
  usedWeeks: number;
  variants: Variant[];
  planned?: boolean;
};

export type ProfileRow = {
  label: string;
  value: string;
  source: ValueSource;
  editable: boolean;
  /** Zamknięta lista odpowiedzi — edycja przez listę rozwijaną zamiast pola tekstowego. */
  options?: string[];
};
