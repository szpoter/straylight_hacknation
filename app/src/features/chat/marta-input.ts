import { OLA } from "@/lib/family/ola";
import { findDates } from "@/lib/kamil/interpret";
import { isValidIso } from "@/lib/rules/dates";
import type { Command, MartaView } from "@/lib/marta/types";

export const DEMO_INPUTS = {
  firstStart: "2027-01-11",
  days: 28,
  firstDaily: 140,
  secondDaily: 105,
  firstName: OLA.mother,
  secondName: OLA.father,
  childName: OLA.child,
};

type Intent = { action: Command } | { notice: string } | null;

/** Restrict changes to direct requests. Questions, negation and uncertain dates remain read-only. */
export function martaInput(text: string, view: MartaView | null, today: string): Intent {
  const value = text
    .trim()
    .toLocaleLowerCase("pl")
    .replace(/[.!]+$/, "");
  const variantMatch =
    /^(?:(?:wybieram|wybieramy|wybierz|zmień na|zmien na) (?:wariant )?)?(razem|wspólny start|wspolny start|kolejno|jeden po drugim)$/.exec(
      value,
    );
  if (variantMatch) {
    if (view?.submitted) return { notice: "Ten wniosek ma już wpis o przekazaniu w historii planu." };
    if (!view) return { notice: "Podaj najpierw datę początku urlopu, żebym mógł porównać warianty." };
    const variant = /kolejno|jeden po drugim/.test(variantMatch[1]) ? "sequential" : "together";
    if (view.selected === variant) return { notice: "Ten wariant jest już zapisany w szkicu." };
    return { action: { type: "choose", version: view.version, variant } };
  }

  const match =
    /^(?:(?:chcę zacząć|chcemy zacząć|zacznijmy|jednak|zmień początek na|zmien poczatek na)\s+)?(?:od\s+)?(\d{4}-\d{2}-\d{2}|\d{1,2}\.\d{1,2}(?:\.\d{4})?|\d{1,2}\s+[a-ząćęłńóśźż]+(?:\s+\d{4})?)(?:\s+r(?:oku)?)?$/u.exec(
      value,
    );
  if (!match) return null;
  const raw = match[1];
  const iso = isValidIso(raw) ? raw : findDates(raw, today, "future")[0]?.iso;
  if (!iso) return { notice: "Sprawdź datę początku urlopu. Możesz wpisać na przykład „Od 18 stycznia 2027”." };
  if (view?.submitted) return { notice: "Ten wniosek ma już wpis o przekazaniu w historii planu." };
  if (view?.inputs.firstStart === iso) return { notice: "Ta data początku jest już uwzględniona w porównaniu." };
  return {
    action: {
      type: "compare",
      version: view?.version ?? 0,
      ...DEMO_INPUTS,
      ...view?.inputs,
      firstStart: iso,
    },
  };
}
