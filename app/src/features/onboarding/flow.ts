/**
 * Sekwencja pytań onboardingu (SPEC-PO-LOGOWANIU, „Pierwsze wejście”; ui/MACIEJ.md, element 1).
 * Czysty TS: kolejność wynika wyłącznie z odpowiedzi, więc zmiana wcześniejszej odpowiedzi
 * pomija pytania, które straciły sens.
 */

export type Situation = "planuje" | "ciaza" | "urodzone" | "adopcja" | "piecza";

export type StepId =
  | "situation"
  | "role"
  | "dueDate"
  | "birthDate"
  | "careDate"
  | "childBirthDate"
  | "childCount"
  | "planName"
  | "jobChange"
  | "summary";

/** Data: ISO albo „later” („Uzupełnię później”). */
export type DateAnswer = string;

export type Answers = {
  situation?: Situation;
  role?: string;
  dueDate?: DateAnswer;
  birthDate?: DateAnswer;
  careDate?: DateAnswer;
  childBirthDate?: DateAnswer;
  childCount?: string;
  planName?: string;
  jobChange?: "tak" | "nie" | "nie-wiem" | "pominieto";
};

export type Choice = { value: string; label: string };

export const LATER = "later";

export const SITUATIONS: Array<{ value: Situation; label: string }> = [
  { value: "planuje", label: "Planuję rodzicielstwo" },
  { value: "ciaza", label: "Spodziewamy się dziecka" },
  { value: "urodzone", label: "Dziecko jest już z nami" },
  { value: "adopcja", label: "Adopcja" },
  { value: "piecza", label: "Rodzina zastępcza" },
];

export const ROLES: Record<Situation, Choice[]> = {
  planuje: [
    { value: "planuje-ciaze", label: "Planuję ciążę" },
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

export const CHILD_COUNTS: Choice[] = [
  { value: "1", label: "Jedno dziecko" },
  { value: "2", label: "Bliźnięta" },
  { value: "3", label: "Troje lub więcej" },
];

export const JOB_CHANGE: Choice[] = [
  { value: "tak", label: "Tak" },
  { value: "nie", label: "Nie" },
  { value: "nie-wiem", label: "Nie wiem" },
];

/** W demo profil zawiera tytuł ubezpieczenia, więc pytanie o zmianę pracy jest pokazywane. */
export function steps(answers: Answers, hasInsuranceTitle = true): StepId[] {
  const s = answers.situation;
  const list: StepId[] = ["situation", "role"];
  if (s === "ciaza") list.push("dueDate");
  if (s === "urodzone") list.push("birthDate");
  if (s === "adopcja" || s === "piecza") list.push("careDate", "childBirthDate");
  if (s === "ciaza" || s === "urodzone") list.push("childCount");
  list.push("planName");
  if (hasInsuranceTitle) list.push("jobChange");
  list.push("summary");
  return list;
}

/** Usuwa odpowiedzi, które po zmianie sytuacji przestały pasować (np. rola spoza nowej listy). */
export function sanitize(answers: Answers): Answers {
  const next = { ...answers };
  const s = next.situation;
  if (!s) return { situation: undefined };
  if (next.role && !ROLES[s].some((r) => r.value === next.role)) next.role = undefined;
  const active = new Set(steps(next));
  for (const key of ["dueDate", "birthDate", "careDate", "childBirthDate", "childCount"] as const) {
    if (!active.has(key)) delete next[key];
  }
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

export function progress(current: StepId, answers: Answers): number {
  const list = steps(answers);
  return (list.indexOf(current) + 1) / list.length;
}

export const OPTIONAL_STEPS: StepId[] = ["planName", "jobChange"];
export const DATE_STEPS: StepId[] = ["dueDate", "birthDate", "careDate", "childBirthDate"];

export function questionFor(step: StepId, answers: Answers): { question: string; why: string } {
  switch (step) {
    case "situation":
      return { question: "Dla kogo układamy plan?", why: "Od tego zależy, od którego etapu zaczniemy i jakie sprawy pokażemy." };
    case "role":
      return {
        question: "Z czyjej perspektywy chcesz zobaczyć plan?",
        why: "Sprawy osoby w ciąży i drugiego rodzica się różnią. Nie zgadujemy roli po imieniu.",
      };
    case "dueDate":
      return { question: "Na kiedy planowany jest poród?", why: "ZUS nie zna terminu porodu. Od niego liczymy terminy spraw." };
    case "birthDate":
      return { question: "Kiedy urodziło się dziecko?", why: "Od daty urodzenia liczymy np. 21 dni na zgłoszenie urodzenia." };
    case "careDate":
      return { question: "Kiedy dziecko trafiło pod Twoją opiekę?", why: "Od dnia przyjęcia liczymy terminy wniosków o urlop." };
    case "childBirthDate":
      return { question: "Kiedy urodziło się dziecko?", why: "Data urodzenia wyznacza limity wieku i etap planu." };
    case "childCount":
      return {
        question: answers.situation === "ciaza" ? "Ile dzieci się spodziewacie?" : "Ile dzieci urodziło się podczas porodu?",
        why: "Liczba dzieci z jednego porodu zmienia długość urlopów.",
      };
    case "planName":
      return { question: "Jak podpisać ten plan?", why: "Nazwa odróżnia plany w selektorze. Nie potrzebujemy imienia ani PESEL-u." };
    case "jobChange":
      return {
        question: "Czy przed porodem lub przyjęciem dziecka planujesz zmianę pracy albo koniec umowy?",
        why: "Brak ubezpieczenia w dniu porodu może odebrać prawo do zasiłku. Ostrzeżemy Cię przy właściwej sprawie.",
      };
    case "summary":
      return { question: "Gotowe. Sprawdź dane, z których ułożę plan.", why: "" };
  }
}

/** Plan otwierany po onboardingu (dane demo). */
export function targetPlanId(answers: Answers): string {
  if (answers.situation === "urodzone") return "ola";
  if (answers.situation === "ciaza") return "oczekiwane";
  return "przyklad";
}

export function warningCount(answers: Answers): number {
  return answers.jobChange === "tak" ? 1 : 0;
}

/** „Plan dla Oli gotowy” — dopełniacz dla imion żeńskich na -a, w innych przypadkach cudzysłów. */
export function planReadyText(name: string): string {
  const n = name.trim();
  const lower = n.toLowerCase();
  let gen: string | undefined;
  if (/ia$/.test(lower)) gen = `${n.slice(0, -1)}i`;
  else if (/ja$/.test(lower)) gen = `${n.slice(0, -2)}i`;
  else if (/[lkg]a$/.test(lower)) gen = `${n.slice(0, -1)}i`;
  else if (/a$/.test(lower)) gen = `${n.slice(0, -1)}y`;
  return gen ? `Plan dla ${gen} gotowy` : `Plan „${n}” gotowy`;
}
