/**
 * Sekwencja pytań onboardingu (SPEC-PO-LOGOWANIU, „Pierwsze wejście”; ui/MACIEJ.md, element 1).
 * Czysty TS: kolejność i treść pytań wynikają wyłącznie z odpowiedzi, więc pytania pasują do
 * sytuacji rodzica (np. po porodzie nie pytamy „przed porodem”, przy bliźniętach pytamy o dwa imiona).
 * Na końcu plany budowane z odpowiedzi (`lib/plan/build.ts`).
 *
 * Wejście rodzica może wypaść na każdym etapie: dopiero planuje dziecko, jest w ciąży, dziecko
 * właśnie się urodziło (albo urodziło się dawno), przyjmuje dziecko w adopcji lub pieczy zastępczej.
 */
import { addDays, daysBetween, DEMO_TODAY } from "@/lib/demo/dates";
import type { BuildAnswers, Employment } from "@/lib/plan/build";
import { S } from "@/lib/demo/stop-details";
import { OLA } from "@/lib/family/ola";

export type Source = { label: string; url: string };

export type Situation = "planuje" | "ciaza" | "urodzone" | "adopcja" | "piecza";

export type StepId =
  | "situation"
  | "role"
  | "dueDate"
  | "birthDate"
  | "careDate"
  | "childCount"
  | "childBirthDate"
  | "names"
  | "planName"
  | "employment"
  | "jobChange"
  | "summary";

export type DateKey = "dueDate" | "birthDate" | "careDate" | "childBirthDate";

export type Answers = {
  situation?: Situation;
  role?: string;
  dueDate?: string;
  birthDate?: string;
  careDate?: string;
  childBirthDate?: string;
  /** Daty wybrane jako przybliżenie („mniej więcej maj 2027”). */
  estimated?: Partial<Record<DateKey, boolean>>;
  childCount?: "1" | "2" | "3";
  /** Imiona dzieci (urodzone, adopcja, piecza) — jedno pole na dziecko. */
  names?: string[];
  /** Nazwa planu przy ciąży (dzieci nie mają jeszcze imion). */
  planName?: string;
  employment?: Employment;
  /** Praca zaznaczona z danych ZUS (rodzic może ją zmienić). */
  employmentFromZus?: boolean;
  jobChange?: "tak" | "nie" | "nie-wiem" | "pominieto";
};

export type Choice = { value: string; label: string; hint?: string };

/** Dane z ZUS po zalogowaniu (symulacja eZUS): tytuł ubezpieczenia i płatnik. */
export const ZUS_EMPLOYMENT: { employment: Employment; label: string } = { employment: "etat", label: OLA.employer };

/** Najwięcej pól imion przy „troje lub więcej”. */
export const MAX_CHILDREN = 6;

export const SITUATIONS: Array<{ value: Situation; label: string; hint: string }> = [
  { value: "planuje", label: "Planujemy dziecko", hint: "Jeszcze nie ma ciąży — co warto sprawdzić wcześniej" },
  { value: "ciaza", label: "Spodziewamy się dziecka", hint: "Trwa ciąża — plan od dziś do pierwszych miesięcy" },
  { value: "urodzone", label: "Dziecko już się urodziło", hint: "Najpilniejsze sprawy po porodzie" },
  { value: "adopcja", label: "Adopcja", hint: "Urlopy i świadczenia przy przyjęciu dziecka" },
  { value: "piecza", label: "Rodzina zastępcza", hint: "Sprawy opiekuna zastępczego" },
];

export const ROLES: Record<Situation, Choice[]> = {
  planuje: [
    { value: "planuje-ciaze", label: "To ja będę w ciąży" },
    { value: "drugi-rodzic", label: "Jestem drugim rodzicem" },
  ],
  ciaza: [
    { value: "w-ciazy", label: "Jestem w ciąży" },
    { value: "drugi-rodzic", label: "Jestem drugim rodzicem" },
  ],
  urodzone: [
    { value: "urodzilam", label: "Urodziłam dziecko" },
    { value: "drugi-rodzic", label: "Jestem drugim rodzicem" },
  ],
  adopcja: [
    { value: "adopcyjny", label: "Jestem rodzicem adopcyjnym" },
    { value: "drugi-adopcyjny", label: "Jestem drugim rodzicem adopcyjnym" },
  ],
  piecza: [
    { value: "zastepczy", label: "Jestem rodzicem zastępczym" },
    { value: "drugi-opiekun", label: "Jestem drugim opiekunem" },
  ],
};

export function childCountChoices(situation?: Situation): Choice[] {
  if (situation === "adopcja" || situation === "piecza")
    return [
      { value: "1", label: "Jedno dziecko" },
      { value: "2", label: "Dwoje dzieci", hint: "Na przykład rodzeństwo" },
      { value: "3", label: "Troje lub więcej" },
    ];
  return [
    { value: "1", label: "Jedno dziecko" },
    { value: "2", label: "Bliźnięta" },
    { value: "3", label: "Trojaczki lub więcej" },
  ];
}

export function employmentChoices(answers: Answers): Choice[] {
  return [
    {
      value: "etat",
      label: "Umowa o pracę",
      hint: answers.employmentFromZus && answers.employment === "etat" ? `Tak widzimy w ZUS · ${ZUS_EMPLOYMENT.label}` : "Etat u pracodawcy",
    },
    { value: "dzialalnosc", label: "Własna działalność", hint: "Firma, w której sam(a) płacisz składki" },
    { value: "inne", label: "Inna umowa", hint: "Zlecenie, dzieło, kontrakt" },
    { value: "nie-pracuje", label: "Teraz nie pracuję", hint: "Pokażę świadczenie rodzicielskie" },
  ];
}

export const JOB_CHANGE: Choice[] = [
  { value: "tak", label: "Tak" },
  { value: "nie", label: "Nie" },
  { value: "nie-wiem", label: "Jeszcze nie wiem" },
];

const isCare = (s?: Situation) => s === "adopcja" || s === "piecza";

/** Liczba dzieci jako liczba (przy „3” — tyle pól imion, ile rodzic dodał, min. 3). */
export function childTotal(answers: Answers): number {
  if (answers.childCount === "2") return 2;
  if (answers.childCount === "3") return Math.min(MAX_CHILDREN, Math.max(3, answers.names?.length ?? 3));
  return 1;
}

/**
 * Czy pytać o zmianę pracy: tylko gdy dziecko jest jeszcze przed nami (planowanie, ciąża,
 * przyjęcie w przyszłości) i rodzic pracuje. Po porodzie to pytanie nie ma sensu.
 */
export function asksJobChange(answers: Answers, today: string = DEMO_TODAY): boolean {
  if (!answers.employment || answers.employment === "nie-pracuje") return false;
  const s = answers.situation;
  if (s === "planuje" || s === "ciaza") return true;
  if (isCare(s) && answers.careDate) return daysBetween(today, answers.careDate) > 0;
  return false;
}

export function steps(answers: Answers, today: string = DEMO_TODAY): StepId[] {
  const s = answers.situation;
  const list: StepId[] = ["situation", "role"];
  if (s === "ciaza") list.push("dueDate", "childCount", "planName");
  if (s === "urodzone") list.push("birthDate", "childCount", "names");
  if (isCare(s)) list.push("careDate", "childCount", "childBirthDate", "names");
  list.push("employment");
  if (asksJobChange(answers, today)) list.push("jobChange");
  list.push("summary");
  return list;
}

/** Usuwa odpowiedzi, które po zmianie wcześniejszej odpowiedzi przestały pasować. */
export function sanitize(answers: Answers, today: string = DEMO_TODAY): Answers {
  const next = { ...answers };
  const s = next.situation;
  if (!s) return {};
  if (next.role && !ROLES[s].some((r) => r.value === next.role)) next.role = undefined;
  const active = new Set(steps(next, today));
  for (const key of ["dueDate", "birthDate", "careDate", "childBirthDate", "childCount", "jobChange", "planName"] as const) {
    if (!active.has(key)) delete next[key];
  }
  if (!active.has("names")) delete next.names;
  else if (next.names) next.names = next.names.slice(0, childTotal(next));
  if (next.estimated) next.estimated = Object.fromEntries(Object.entries(next.estimated).filter(([k]) => active.has(k as StepId)));
  return next;
}

export function nextStep(current: StepId, answers: Answers): StepId {
  const list = steps(answers);
  const i = list.indexOf(current);
  return list[Math.min(i + 1, list.length - 1)] ?? "summary";
}

export function prevStep(current: StepId, answers: Answers): StepId | "start" {
  const list = steps(answers);
  const i = list.indexOf(current);
  return i <= 0 ? "start" : list[i - 1];
}

/** Postęp bez ekranu końcowego: ostatnie pytanie = prawie pełny pasek. */
export function progress(current: StepId, answers: Answers): number {
  const list = steps(answers).filter((s) => s !== "summary");
  if (current === "summary") return 1;
  return (list.indexOf(current) + 1) / (list.length + 1);
}

export const OPTIONAL_STEPS: StepId[] = ["planName", "names", "jobChange"];
export const DATE_STEPS: StepId[] = ["dueDate", "birthDate", "careDate", "childBirthDate"];
export const CHOICE_STEPS: StepId[] = ["situation", "role", "childCount", "employment", "jobChange"];

/** Odpowiedź wymagana, zanim „Dalej” przejdzie dalej (karty bez auto-przejścia). */
export function hasAnswer(step: StepId, answers: Answers): boolean {
  switch (step) {
    case "situation":
      return Boolean(answers.situation);
    case "role":
      return Boolean(answers.role);
    case "childCount":
      return Boolean(answers.childCount);
    case "employment":
      return Boolean(answers.employment);
    case "jobChange":
      return Boolean(answers.jobChange && answers.jobChange !== "pominieto");
    default:
      return true;
  }
}

/**
 * Pytanie i „Dlaczego pytamy?”. Każde twierdzenie o przepisach w `why` ma źródło w `sources`
 * (sprawdzone 21.11.2026); zdania bez źródła mówią tylko o tym, co robi aplikacja.
 */
export function questionFor(step: StepId, answers: Answers): { question: string; why: string; sources?: Source[] } {
  const many = childTotal(answers) > 1;
  switch (step) {
    case "situation":
      return { question: "Na jakim etapie jesteś?", why: "Od tego zależy, od którego etapu zaczniemy i jakie sprawy pokażemy." };
    case "role":
      return {
        question: "Z czyjej perspektywy chcesz zobaczyć plan?",
        why: "Sprawy osoby w ciąży i drugiego rodzica się różnią — np. urlop macierzyński i urlop ojcowski. Nie zgadujemy roli po imieniu.",
        sources: [S.govMaternity, S.govPaternity],
      };
    case "dueDate":
      return {
        question: "Na kiedy jest termin porodu?",
        why: "Od terminu porodu liczymy terminy w planie, np. najwcześniejszy start urlopu macierzyńskiego — do 6 tygodni przed przewidywaną datą porodu.",
        sources: [S.govMaternity],
      };
    case "birthDate":
      return {
        question: many ? "Kiedy urodziły się dzieci?" : "Kiedy urodziło się dziecko?",
        why: "Od daty urodzenia liczymy terminy, np. 21 dni na zgłoszenie urodzenia i 3 miesiące na wniosek o 800+ z wypłatą od dnia urodzenia.",
        sources: [S.usc, S.zus800Term],
      };
    case "careDate":
      return { question: "Kiedy dziecko trafiło lub trafi pod Twoją opiekę?", why: "Od dnia przyjęcia liczymy terminy wniosków o urlop." };
    case "childBirthDate":
      return {
        question: many ? "Kiedy urodziło się najmłodsze dziecko?" : "Kiedy urodziło się dziecko?",
        why: "Data urodzenia dziecka trafia do wniosków o urlop i świadczenia.",
      };
    case "childCount":
      return {
        question:
          answers.situation === "ciaza" ? "Ile dzieci się spodziewacie?" : isCare(answers.situation) ? "Ile dzieci przyjmujesz?" : "Ile dzieci się urodziło?",
        why: "Przy kilkorgu dzieciach z jednego porodu urlop macierzyński trwa dłużej (31 tygodni przy bliźniętach), a 800+ przysługuje na każde dziecko.",
        sources: [S.govMaternity, S.zus800],
      };
    case "names":
      return {
        question: many ? "Jak mają na imię?" : "Jak ma na imię?",
        why: "Imię widzisz tylko Ty — podpisuje plan i sprawy. Każde dziecko dostaje osobny plan. Nie potrzebujemy PESEL-u.",
      };
    case "planName":
      return {
        question: "Jak podpisać ten plan?",
        why: "Podpis widzisz tylko Ty — odróżnia plany w selektorze. Imię dopiszesz po porodzie.",
      };
    case "employment":
      return {
        question: "Jak teraz pracujesz?",
        why: "Od rodzaju pracy zależy, które wnioski i świadczenia pokażemy w planie.",
      };
    case "jobChange":
      return {
        question:
          answers.situation === "planuje"
            ? "Czy w najbliższym roku planujesz zmianę pracy albo kończy Ci się umowa?"
            : answers.situation === "ciaza"
              ? "Czy do porodu zmieniasz pracę albo kończy Ci się umowa?"
              : "Czy do dnia przyjęcia dziecka zmieniasz pracę albo kończy Ci się umowa?",
        why: "Przy zasiłku macierzyńskim pokażemy wtedy, gdzie ZUS opisuje, komu przysługuje zasiłek.",
        sources: [S.zusKomu],
      };
    case "summary":
      return { question: "Twój plan jest gotowy", why: "" };
  }
}

/** Imiona wpisane przez rodzica (bez pustych). */
export function filledNames(answers: Answers): string[] {
  return (answers.names ?? []).map((n) => n.trim()).filter(Boolean);
}

/** „Ola”, „Ola i Ala”, „Ola, Ala i Jaś”. */
export function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} i ${names[names.length - 1]}`;
}

/**
 * Krótka reakcja nad pytaniem (bez maskotki) — nawiązuje do poprzedniej odpowiedzi, jak w aplikacjach
 * typu Duolingo. Spokojny, ciepły ton (DESIGN.md), bez wykrzyknika na każdym kroku.
 */
export function zusikLine(step: StepId, answers: Answers): string {
  const names = filledNames(answers);
  const many = childTotal(answers) > 1;
  switch (step) {
    case "situation":
      return "Kilka pytań i ułożę Ci plan spraw — od urzędu po urlop.";
    case "role":
      switch (answers.situation) {
        case "ciaza":
          return "Gratulacje! Przed Wami piękny czas. Papiery wezmę na siebie.";
        case "urodzone":
          return "Gratulacje! Pierwsze tygodnie są intensywne — pilnuję terminów za Ciebie.";
        case "planuje":
          return "Dobrze, że planujesz z wyprzedzeniem. Pokażę, co sprawdzić już teraz.";
        default:
          return "To wielka decyzja. Pomogę z formalnościami krok po kroku.";
      }
    case "dueDate":
      return "Od terminu porodu policzę wszystkie terminy. Wystarczy przybliżony.";
    case "birthDate":
      return "Od daty urodzenia policzę wszystkie terminy. Wystarczy przybliżona.";
    case "careDate":
      return "Od dnia przyjęcia policzę terminy urlopów. Może być w przyszłości.";
    case "childBirthDate":
      return "Jeszcze data urodzenia dziecka — od niej zależy długość urlopu.";
    case "childCount":
      return "Mam datę. Połowa za nami.";
    case "names":
      return many
        ? answers.situation === "urodzone"
          ? "Podwójna radość! Każde dziecko dostanie własny plan — z własnymi sprawami."
          : "Każde dziecko dostanie własny plan — z własnymi sprawami."
        : "Teraz coś miłego.";
    case "planName":
      return many ? "Bliźnięta — urlopy będą dłuższe, uwzględnię to." : "Teraz coś miłego.";
    case "employment":
      if (answers.employmentFromZus) return `W ZUS widzę umowę o pracę w ${ZUS_EMPLOYMENT.label}. Zaznaczyłem ją — zmień, jeśli to nieaktualne.`;
      if (names.length > 1) return `${joinNames(names)} — piękne imiona. Teraz praca, to ważne dla zasiłku.`;
      if (names.length === 1) return `${names[0]} — piękne imię. Teraz praca, to ważne dla zasiłku.`;
      return "Teraz praca — to ważne dla zasiłku.";
    case "jobChange":
      return "Ostatnie pytanie.";
    case "summary":
      if (names.length > 1) return `Plany dla ${joinNames(names.map(genitiveName))} gotowe.`;
      if (names.length === 1) return `Plan dla ${genitiveName(names[0])} gotowy.`;
      if (answers.planName?.trim()) return `Plan „${answers.planName.trim()}” gotowy.`;
      return many && answers.situation !== "ciaza" ? "Plany gotowe." : "Plan gotowy.";
  }
}

/** Dopełniacz imienia żeńskiego na -a („Oli”, „Mai”, „Anny”); inne imiona bez zmian w cudzysłowie. */
export function genitiveName(name: string): string {
  const n = name.trim();
  const lower = n.toLowerCase();
  if (/ia$/.test(lower)) return `${n.slice(0, -1)}i`;
  if (/ja$/.test(lower)) return `${n.slice(0, -2)}i`;
  if (/[lkg]a$/.test(lower)) return `${n.slice(0, -1)}i`;
  if (/a$/.test(lower)) return `${n.slice(0, -1)}y`;
  // Imiona męskie: najczęstsze wzory (Antek → Antka, Paweł → Pawła, Jaś → Jasia, Jan → Jana).
  if (/ek$/.test(lower)) return `${n.slice(0, -2)}ka`;
  if (/eł$/.test(lower)) return `${n.slice(0, -2)}ła`;
  const soft: Record<string, string> = { ś: "sia", ć: "cia", ń: "nia", ź: "zia" };
  if (soft[lower.slice(-1)]) return `${n.slice(0, -1)}${soft[lower.slice(-1)]}`;
  if (/[bcdfghjklłmnprstwzż]$/.test(lower)) return `${n}a`;
  return n;
}

/** „Plan dla Oli gotowy” — zgodność z poprzednim API. */
export function planReadyText(name: string): string {
  const n = name.trim();
  return /a$/i.test(n) ? `Plan dla ${genitiveName(n)} gotowy` : `Plan „${n}” gotowy`;
}

export function warningCount(answers: Answers): number {
  const employment = answers.employment;
  return (answers.jobChange === "tak" ? 1 : 0) + (employment === "nie-pracuje" || employment === "dzialalnosc" || employment === "inne" ? 1 : 0);
}

const MONTHS = ["styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec", "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"];

/** Przybliżone daty, gdy rodzic nie zna dokładnej. Termin porodu: 15. dzień miesiąca. */
export function estimateChoices(step: StepId, today: string = DEMO_TODAY): Choice[] {
  if (step === "dueDate") {
    const [y, m] = today.split("-").map(Number);
    return Array.from({ length: 9 }, (_, i) => {
      const mm = ((m - 1 + i + 1) % 12) + 1;
      const yy = y + Math.floor((m - 1 + i + 1) / 12);
      return { value: `${yy}-${String(mm).padStart(2, "0")}-15`, label: `${MONTHS[mm - 1]} ${yy}` };
    });
  }
  if (step === "careDate") {
    return [
      { value: addDays(today, -3), label: "W tym tygodniu" },
      { value: addDays(today, -14), label: "1–3 tygodnie temu" },
      { value: addDays(today, -45), label: "Ponad miesiąc temu" },
      { value: addDays(today, 30), label: "W najbliższym miesiącu" },
      { value: addDays(today, 75), label: "Za 2–3 miesiące" },
      { value: addDays(today, 150), label: "Później" },
    ];
  }
  if (step === "childBirthDate") {
    return [
      { value: addDays(today, -120), label: "Niemowlę (do roku)" },
      { value: addDays(today, -365 * 2), label: "1–3 lata" },
      { value: addDays(today, -365 * 5), label: "4–6 lat" },
      { value: addDays(today, -365 * 9), label: "7 lat lub więcej" },
    ];
  }
  return [
    { value: addDays(today, -3), label: "W tym tygodniu" },
    { value: addDays(today, -14), label: "1–3 tygodnie temu" },
    { value: addDays(today, -45), label: "1–2 miesiące temu" },
    { value: addDays(today, -120), label: "Ponad 2 miesiące temu" },
  ];
}

/**
 * Sprawdza datę w kontekście pytania: urodzenie nie w przyszłości, termin porodu nie w przeszłości
 * i nie dalej niż ~10 miesięcy. Zwraca komunikat błędu albo nic.
 */
export function validateDate(step: StepId, iso: string, today: string = DEMO_TODAY): string | undefined {
  const diff = daysBetween(today, iso);
  if (step === "dueDate") {
    if (diff < -14) return "Ten termin już minął. Jeśli dziecko się urodziło, wróć i wybierz „Dziecko już się urodziło”.";
    if (diff > 300) return "Termin porodu wypada najpóźniej ok. 10 miesięcy od dziś. Sprawdź rok.";
  }
  if (step === "birthDate" || step === "childBirthDate") {
    if (diff > 0) return "Ta data jest w przyszłości. Jeśli dziecko jeszcze się nie urodziło, wróć i wybierz „Spodziewamy się dziecka”.";
    if (step === "birthDate" && diff < -365 * 3) return "Plan obejmuje pierwsze lata dziecka. Sprawdź rok urodzenia.";
    if (diff < -365 * 18) return "Sprawdź rok urodzenia dziecka.";
  }
  if (step === "careDate" && Math.abs(diff) > 365 * 2) return "Sprawdź rok — plan obejmuje przyjęcie w ciągu ok. 2 lat.";
  return undefined;
}

/** Odpowiedzi → wejście budowania planów. Brak daty: przybliżenie (termin za ~5 mies., urodzenie tydzień temu). */
export function toBuildAnswers(answers: Answers, today: string = DEMO_TODAY): BuildAnswers & { dateEstimated: boolean } {
  const s = answers.situation ?? "urodzone";
  const key: DateKey = s === "ciaza" ? "dueDate" : s === "urodzone" ? "birthDate" : "careDate";
  const raw = s === "planuje" ? undefined : answers[key];
  const missing = s !== "planuje" && !raw;
  const date = s === "planuje" ? undefined : missing ? (s === "ciaza" ? addDays(today, 150) : addDays(today, -7)) : raw;
  return {
    situation: s,
    role: answers.role,
    date,
    childCount: answers.childCount,
    names: answers.names,
    name: answers.planName,
    employment: answers.employment,
    jobChange: answers.jobChange,
    dateEstimated: missing || Boolean(answers.estimated?.[key]),
  };
}
