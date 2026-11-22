import { formatLong } from "@/lib/demo/dates";
import type { FormDef } from "@/lib/demo/forms";
import { buildApplicationPdf, type ApplicationFonts } from "@/lib/forms/application-pdf";
import { allFields, isVisible, validate, type Values } from "./flow";

export type PdfOptions = { recipient: string; date: string; correction?: boolean };

export async function renderFormPdf(def: FormDef, values: Values, opts: PdfOptions, fonts: ApplicationFonts): Promise<Uint8Array> {
  if (def.pdf === "none") throw new Error("Ten wniosek nie ma wersji PDF.");
  const incomplete = Object.keys(validate(def, values, opts.date)).length > 0;
  // Zapisany szkic może zawierać odpowiedzi na pola ukryte przez późniejszy wybór.
  const visible: Values = Object.fromEntries(
    allFields(def).filter(field => isVisible(field, values)).map(field => [field.id, values[field.id]?.trim() ?? ""]),
  );
  if (def.pdf === "official") {
    if (incomplete || !def.buildOfficial) throw new Error("Wypełnij dane urzędowego druku.");
    return def.buildOfficial(visible, opts.date, fonts);
  }
  if (!def.letter) throw new Error("Brakuje treści pisma.");
  const marks = [];
  if (incomplete) marks.push("SZKIC");
  if (opts.correction) marks.push("KOREKTA");
  return buildApplicationPdf({
    title: def.name,
    sender: visible.rodzic || "……………………",
    addressee: visible.pracodawca || visible.urzad || opts.recipient.replace(/^Do /, ""),
    date: [visible.miejscowosc, formatLong(opts.date)].filter(Boolean).join(", "),
    marks,
    paragraphs: def.letter(visible, opts.date),
  }, fonts);
}

export function pdfFilename(def: FormDef, correction = false): string {
  const slug = def.name
    .toLowerCase()
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");
  return `${slug}${correction ? "-korekta" : ""}.pdf`;
}
