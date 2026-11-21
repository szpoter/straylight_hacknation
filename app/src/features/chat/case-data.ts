import type { Choice } from "@/lib/zusik/constants";

/**
 * Fictional demo profile from TECH-SPEC-AGENT.md ("Scenariusze demonstracji"): Marta and Paweł Lis,
 * daughter Ola born 4 May 2026, Marta's employer Studio Lipa. Only the leave arrangement ("razem" or
 * "kolejno") is stored on the server today; the other rows are read-only profile data.
 */

export const DRAFT_ID = "marta-rodzicielski";
export const CASE_LABEL = "Ola · Wniosek o urlop rodzicielski";
export const DRAFT_TITLE = "Wniosek o urlop rodzicielski";
export const RECIPIENT = "Studio Lipa";

export type ProfileRow = { key: string; label: string; value: string; note?: string };

export const PROFILE_ROWS: ProfileRow[] = [
  { key: "applicant", label: "Wnioskodawczyni", value: "Marta Lis" },
  { key: "employer", label: "Pracodawca", value: "Studio Lipa" },
  { key: "child", label: "Dziecko", value: "Ola Lis · ur. 4 maja 2026" },
  { key: "kind", label: "Rodzaj urlopu", value: "Część urlopu rodzicielskiego · 28 dni" },
];

/** Rows that later steps fill in (calculator in step 3, draft records in step 4). */
export const PENDING_ROWS: ProfileRow[] = [
  { key: "period", label: "Okres urlopu", value: "11 stycznia – 7 lutego 2027", note: "Z profilu demonstracyjnego" },
  { key: "partner", label: "Oświadczenie o Pawle", value: "Do potwierdzenia w rozmowie", note: "Zapis oświadczenia w kolejnym etapie" },
  { key: "attachment", label: "Załącznik", value: "Odpis aktu urodzenia Oli", note: "Dołączanie w kolejnym etapie" },
];

export const CHOICE_FIELD_LABEL = "Sposób korzystania z urlopu";

export const CHOICE_TEXT: Record<Choice, { short: string; long: string }> = {
  razem: { short: "Razem z Pawłem", long: "Razem z Pawłem, od tego samego dnia" },
  kolejno: { short: "Kolejno", long: "Kolejno: najpierw Ty, potem Paweł" },
};

export const EMPTY_CHOICE_TEXT = "Do ustalenia z Zusikiem";
