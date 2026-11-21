import type { Answer, SicknessView } from "@/lib/sickness/types";

export const coverageAnswers = [
  { value: "no", text: "Nie, nie miałam żadnego innego ubezpieczenia chorobowego" },
  { value: "yes", text: "Tak, miałam też inny tytuł" },
  { value: "unknown", text: "Nie wiem" },
] as const;

type Input = { type: "start" } | { type: "close"; version: number }
  | { type: "confirm"; version: number; answer: Answer } | { type: "sources" } | { type: "help" };
export function sicknessInput(raw: string, view: SicknessView | null, editing: boolean): Input {
  const text = raw.toLocaleLowerCase("pl").trim().replace(/[.!?]+$/, "").trim();
  if (!view) return /chorobow|zwolnieni|zasiłek|^zacznij$|^rozpocznij/u.test(text) ? { type: "start" } : { type: "help" };
  if (/^(?:pokaż (?:mi )?(?:dokumenty|źródła)|skąd (?:to )?wiesz|na jakiej podstawie.*)$/u.test(text)) return { type: "sources" };
  if (!view.closed && view.assessment.status === "not_entitled_for_period" && /^(?:zakończ|zamknij)(?: ocenę| sprawę)?$/u.test(text)) {
    return { type: "close", version: view.version };
  }
  if ((editing || view.assessment.asksOtherCoverage) && !raw.trimEnd().endsWith("?")) {
    const short: Record<string, Answer> = { tak: "yes", nie: "no", "nie wiem": "unknown" };
    const answer = coverageAnswers.find(a => a.text.toLocaleLowerCase("pl") === text)?.value ??
      (Object.hasOwn(short, text) ? short[text] : undefined);
    if (answer) return { type: "confirm", answer, version: view.version };
  }
  return { type: "help" };
}
