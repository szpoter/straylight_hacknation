import { parsePage } from "./read";
import type { PageFact } from "./types";

/** The browser sends only confirmed case-relative identifiers. Names and uploaded documents stay local. */
export type ManualFields = {
  kind: string;
  subject: string;
  payer: string;
  title: string;
  from: string;
  to: string;
  onset: string;
  value: string;
};
export const blankFields: ManualFields = {
  kind: "",
  subject: "",
  payer: "",
  title: "",
  from: "",
  to: "",
  onset: "",
  value: "",
};
export const documentLabel: Record<string, string> = {
  certificate: "e-ZLA",
  employment: "ustalenie tytułu",
  history: "historia ubezpieczenia",
};
export const findingLabel: Record<string, string> = {
  incapacity: "niezdolność do pracy",
  excluded: "brak ubezpieczenia z tego tytułu",
  covered: "podlega ubezpieczeniu z tego tytułu",
  never: "nigdy wcześniej nie podlegała ubezpieczeniu chorobowemu",
  ended: "wcześniejsze ubezpieczenie ustało",
};
export function fieldsFrom(fact: PageFact): ManualFields {
  return {
    kind: fact.kind,
    subject: fact.subject,
    payer: fact.payer,
    title: fact.title,
    from: fact.period.from,
    to: fact.period.to,
    onset: fact.onset ?? "",
    value: fact.value,
  };
}
export function confirmManual(fields: ManualFields, page: number) {
  return parsePage(
    [
      "ZUSIK DEMO / 1",
      "Dokument: " + (documentLabel[fields.kind] ?? ""),
      "Osoba: " + fields.subject,
      "Płatnik: " + fields.payer,
      "Tytuł: " + fields.title,
      "Okres: " + fields.from + " / " + fields.to,
      ...(fields.kind === "certificate" && fields.onset ? ["Początek ciągłej niezdolności: " + fields.onset] : []),
      "Ustalenie: " + (findingLabel[fields.value] ?? ""),
    ].join("\n"),
    page,
  );
}
