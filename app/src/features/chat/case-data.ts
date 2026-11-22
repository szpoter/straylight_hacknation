import { OLA } from "@/lib/family/ola";
import { formatLong } from "@/lib/demo/dates";
import type { Choice } from "@/lib/zusik/constants";

export const DRAFT_ID = "marta-rodzicielski";
export const CASE_LABEL = "Ola · Wniosek o urlop rodzicielski";
export const DRAFT_TITLE = "Wniosek o urlop rodzicielski";
export const RECIPIENT = OLA.employer;

export type ProfileRow = { key: string; label: string; value: string; note?: string };

export const PROFILE_ROWS: ProfileRow[] = [
  { key: "applicant", label: "Wnioskodawczyni", value: OLA.mother },
  { key: "employer", label: "Pracodawca", value: OLA.employer },
  { key: "child", label: "Dziecko", value: OLA.child + " · ur. " + formatLong(OLA.birthDate) },
  { key: "kind", label: "Rodzaj urlopu", value: "Część urlopu rodzicielskiego · 28 dni" },
];

/** Rows that later steps fill in (calculator in step 3, draft records in step 4). */
export const PENDING_ROWS: ProfileRow[] = [
  { key: "period", label: "Okres urlopu", value: "11 stycznia – 7 lutego 2027" },
  { key: "partner", label: "Oświadczenie o Pawle", value: "Do potwierdzenia w rozmowie", note: "Zapis oświadczenia w kolejnym etapie" },
  { key: "attachment", label: "Załącznik", value: "Odpis aktu urodzenia Oli", note: "Dołączanie w kolejnym etapie" },
];

export const CHOICE_FIELD_LABEL = "Sposób korzystania z urlopu";

export const CHOICE_TEXT: Record<Choice, { short: string; long: string }> = {
  razem: { short: "Razem z Pawłem", long: "Razem z Pawłem, od tego samego dnia" },
  kolejno: { short: "Kolejno", long: "Kolejno: najpierw Ty, potem Paweł" },
};

export const EMPTY_CHOICE_TEXT = "Do ustalenia z Zusikiem";
