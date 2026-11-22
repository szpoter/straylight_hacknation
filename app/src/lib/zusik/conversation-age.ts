type ChildAge = {months:number; child:"daughter"|"son"|"child"};

// A chat note describes what the speaker said. Only a verified birth date can support an assessment.
export function conversationAge(text: string): ChildAge | "recall" | null {
  const q = text.trim().toLocaleLowerCase("pl").replace(/[?!.]+$/u, "");
  if (/^(?:jaki wiek(?: dziecka)? (?:podał[ae]m|wskazał[ae]m)|ile (?:lat|miesięcy) (?:podał[ae]m|wskazał[ae]m))(?: (?:po poprawce|po korekcie|ostatnio))?$/u.test(q)) return "recall";
  const match = /^(?:(?:poprawiam|sprostowanie|korekta|pomyłka|jednak)[,: ]+)?(?:(?:moja|mój|moje) )?(córka|syn|dziecko) ma (\d{1,3}) (miesiąc|miesiące|miesięcy|rok|lata|lat)$/u.exec(q);
  if (!match) return null;
  const months = Number(match[2]) * (match[3].startsWith("mies") ? 1 : 12);
  if (months > 216) return null;
  return {child:match[1] === "syn" ? "son" : match[1] === "córka" ? "daughter" : "child", months};
}

export function ageMessage(note?: ChildAge) {
  if (!note) return "Jaki wiek dziecka chcesz zanotować w tej rozmowie?";
  const child = {child:"dziecka", daughter:"córki", son:"syna"}[note.child];
  const age = new Intl.NumberFormat("pl", {style:"unit",unit:"month",unitDisplay:"long"}).format(note.months);
  return `W chwili ostatniej deklaracji podany wiek ${child} wynosił ${age}.`;
}
