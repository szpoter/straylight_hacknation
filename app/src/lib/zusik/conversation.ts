export const caseNames = ["marta", "kamil", "chorobowe", "ogolna"] as const;
export type CaseName = typeof caseNames[number];

export function conversationOwner(session: string, scenario: CaseName) {
  return scenario === "marta" ? session : session + ":" + scenario;
}

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
  const simple = text.toLocaleLowerCase("pl").normalize("NFD").replace(/\p{M}/gu, "").replace(/ł/g, "l")
    .replace(/[\p{P}\p{S}]/gu, " ").trim().replace(/\s+/g, " ");
  let reply: string | null = null;
  if (!simple && original !== text) reply = "Cześć! " + prompts[scenario];
  else if (/^(?:(?:wielkie|bardzo) )?(?:dzieki|dziekuje|dziekujemy)(?: bardzo| za pomoc)?$/.test(simple)) reply = "Proszę! Jeśli coś jeszcze wymaga wyjaśnienia, napisz.";
  else if (/^(?:(?:a |i )?(?:co (?:umiesz|potrafisz|robisz)|(?:w czym|jak) (?:mozesz |moglbys )?(?:mi )?pomoc|kim jestes|jak (?:to )?dziala)|pomoc|pomoz(?: mi)?|potrzebuje pomocy|mam (?:pytanie|problem|sprawe)|(?:jestes|slyszysz mnie)|co (?:tam|slychac)|od czego zaczac|o co chodzi(?: w tej sprawie)?)(?: zusiku?)?$/.test(simple)) reply = prompts[scenario];
  return { text: text || original, reply };
}
