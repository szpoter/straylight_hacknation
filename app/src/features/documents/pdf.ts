/**
 * Treść PDF wniosku z „Dokumentów”: te same sekcje i wartości, które rodzic widzi na ekranie
 * „Sprawdź odpowiedzi” (ukryte pola pomijamy, daty i rachunek w formie do czytania).
 * Samo składanie PDF jest w `lib/forms/application-pdf.ts`.
 */
import type { ApplicationDoc } from "@/lib/forms/application-pdf";
import { formatLong } from "@/lib/demo/dates";
import type { FormDef } from "@/lib/demo/forms";
import { displayValue, isVisible, validate, type Values } from "./flow";

export const PDF_NOTE = "Wygenerowano w wersji demonstracyjnej Zusika. Przed złożeniem sprawdź dane i podpisz wniosek.";

/** Adresat: pracodawca albo przychodnia z wniosku, inaczej odbiorca sprawy. */
function addressee(values: Values, recipient: string): string | undefined {
  const named = values.pracodawca?.trim() || values.przychodnia?.trim();
  if (named) return named;
  if (recipient === "Do pracodawcy") return "Pracodawca";
  return recipient.replace(/^Do /, "") || undefined;
}

export function applicationDoc(def: FormDef, values: Values, opts: { recipient: string; date: string; correction?: boolean }): ApplicationDoc {
  const marks: string[] = [];
  if (Object.keys(validate(def, values)).length > 0) marks.push("SZKIC");
  if (opts.correction) marks.push("KOREKTA");
  return {
    title: def.name,
    addressee: addressee(values, opts.recipient),
    date: formatLong(opts.date),
    marks,
    sections: def.sections.map((section) => ({
      title: section.title,
      rows: section.fields.filter((f) => isVisible(f, values)).map((f) => ({ label: f.label, value: displayValue(f, values[f.id]?.trim()) })),
    })),
    note: `${def.fidelity} ${PDF_NOTE}`,
  };
}

/** „Wniosek o urlop rodzicielski” → „wniosek-o-urlop-rodzicielski.pdf”. */
export function pdfFilename(def: FormDef, correction = false): string {
  const slug = def.name
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");
  return `${slug}${correction ? "-korekta" : ""}.pdf`;
}
