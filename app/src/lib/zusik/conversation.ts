export const caseNames = ["marta", "kamil", "chorobowe", "ogolna"] as const;
export type CaseName = typeof caseNames[number];

export type FamilyChatScope = { planId: string; stopId?: string };

export function conversationOwner(session: string, scenario: CaseName, family?: FamilyChatScope) {
  if (scenario === "ogolna" && family) return [session, scenario, family.planId, family.stopId].filter(Boolean).join(":");
  return scenario === "marta" ? session : session + ":" + scenario;
}

export const chatStarters = [
  {
    label: "Sprawdź ubezpieczenie",
    prompt: "Jak sprawdzić, czy mam ubezpieczenie chorobowe na dzień, od którego ubiegam się o zasiłek?",
    reply: "Na jaki dzień chcesz sprawdzić ubezpieczenie i z jakiego tytułu, np. umowy o pracę, zlecenia lub działalności? Jeśli masz potwierdzenie z ZUS, dołącz PDF i zapytaj o okres ubezpieczenia widoczny w dokumencie.",
  },
  {
    label: "Oblicz wysokość zasiłku",
    prompt: "Jak obliczyć wysokość mojego zasiłku macierzyńskiego i jakie dane o wynagrodzeniu mam podać?",
    reply: "W kalkulatorze dla swojej sprawy wpisz datę porodu lub przyjęcia dziecka, okres urlopu i tytuł ubezpieczenia. Masz już ustaloną miesięczną podstawę zasiłku czy zestawienie wynagrodzeń lub podstaw składek? Formularz przyjmuje oba rodzaje danych i pokazuje rachunek.",
  },
  {
    label: "Sprawdź dokumenty i terminy",
    prompt: "Jakie dokumenty są potrzebne do zasiłku macierzyńskiego, gdzie je złożyć i w jakim terminie?",
    reply: "Którego urlopu dotyczy wniosek i kiedy ma się rozpocząć? Napisz też, czy składasz go jako pracownik, zleceniobiorca czy osoba prowadząca działalność. Te informacje pozwolą dobrać dokumenty, adresata i termin do Twojej sytuacji.",
  },
] as const;

const prompts: Record<CaseName, string> = {
  ogolna: "Opisz, co chcesz ustalić. Mogę sprawdzić w źródłach zasady świadczenia, termin lub potrzebne dokumenty.",
  marta: "Mogę porównać terminy urlopu, pomóc z wnioskiem albo sprawdzić pytanie o świadczenie. Co chcesz ustalić?",
  kamil: "Mogę pomóc z odpisem aktu urodzenia, okresem ojcowskiego i wnioskiem ZAM. Od czego zaczynamy?",
  chorobowe: "Mogę pomóc przejrzeć dokumenty ubezpieczenia albo wyjaśnić zasady zasiłku chorobowego. Co chcesz sprawdzić?",
};

// Strip only a salutation at a word boundary. Preserve the original wording of the actual question.
const salutation = /^(?:(?:hej(?:ka)?|siem(?:a(?:nko)?|ka)|cze[śs][ćc]|dzie[nń] dobry|dobry wiecz[oó]r|witaj|witam|halo|hello|hi)(?![\p{L}\p{N}])(?:[\s,!.:-]+(?:zusik(?:u)?|zus|asystencie)(?![\p{L}\p{N}]))?|zusik(?:u)?(?![\p{L}\p{N}]))[\s,.!?:;👋\p{Emoji_Modifier}\uFE0F]*/iu;
export function conversationInput(raw: string, scenario: CaseName) {
  const original = raw.trim();
  const text = original.replace(salutation, "").trim();
  const starter = scenario === "ogolna" && chatStarters.find(option => option.prompt === text);
  if (starter) return { text, reply: starter.reply };
  const simple = text.toLocaleLowerCase("pl").normalize("NFD").replace(/\p{M}/gu, "").replace(/ł/g, "l")
    .replace(/[\p{P}\p{S}]/gu, " ").trim().replace(/\s+/g, " ");
  let reply: string | null = null;
  if (!simple && original !== text) reply = "Cześć! " + prompts[scenario];
  else if (/^(?:(?:wielkie|bardzo) )?(?:dzieki|dziekuje|dziekujemy)(?: bardzo| za pomoc)?$/.test(simple)) reply = "Proszę! Jeśli coś jeszcze wymaga wyjaśnienia, napisz.";
  else if (/^(?:(?:a |i )?(?:co (?:umiesz|potrafisz|robisz)|(?:w czym|jak) (?:mozesz |moglbys )?(?:mi )?pomoc|kim jestes|jak (?:to )?dziala)|pomoc|pomoz(?: mi)?|potrzebuje pomocy|mam (?:pytanie|problem|sprawe)|(?:jestes|slyszysz mnie)|co (?:tam|slychac)|od czego zaczac|o co chodzi(?: w tej sprawie)?)(?: zusiku?)?$/.test(simple)) reply = prompts[scenario];
  return { text: text || original, reply };
}
