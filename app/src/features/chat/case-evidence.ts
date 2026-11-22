import { factInput, type CaseDocument, type DocInput, type FactInput } from "@/lib/zusik/memory/contract";

import { claimFields, documentDay, documentMoney } from "./case-claim-fields";
import type { PageLine } from "./case-page-layout";

export type DocumentKind = DocInput["kind"];
export type LocalLocator = { clientDocumentId: string; page: number; lineStart: number; lineEnd: number; column?: number };
type DateScope = Pick<FactInput, "validFrom" | "validTo" | "asOf">;
export type EvidenceCandidate = Pick<FactInput, "field" | "value"> & DateScope & { locator: LocalLocator };
export type PageRole = DocumentKind | "medical_leave" | "history";
type Column = "month" | "monthlyGrossPay" | "monthlyContributionBasis" | "monthlyEmployeeDeduction" | "monthlyPayAfterDeduction" | "other";
export type LocalCasePage = {
  page: number;
  text: string;
  method: "pdf_text" | "ocr" | "manual";
  kind: DocumentKind;
  role: PageRole;
  status: "read" | "manual" | "blank" | "excluded";
  reason?: "decision" | "unreadable" | "ambiguous_field" | "unknown_type";
  confidence?: number;
  lines?: PageLine[];
  table?: Column[];
  candidates: EvidenceCandidate[];
};
export type LocalCaseDocument = { caseId: string; mediaType?: "application/pdf" | "image/jpeg" | "image/png"; storageUnavailable?: boolean; metadata: DocInput; pages: LocalCasePage[] };

function foldLabel(text: string) {
  return text.normalize("NFD").replace(/\p{M}/gu, "").replace(/ł/gi, "l").toLowerCase().trim();
}

export function containsDecision(text: string) {
  return /\b(decyzj[ae]|przyznano|odmowiono|odmowa prawa|odmawia(?:m| sie)|przyznaje(?:my| sie)? zasilek|ustalona kwota zasilku|rozstrzygniecie)\b/u.test(foldLabel(text));
}

function classify(text: string): PageRole | undefined {
  if (containsDecision(text)) return "decision";
  if (/^(?:odpis (?:skrocony |zupelny )?aktu urodzenia|akt urodzenia|zaswiadczenie szpitalne|zaswiadczenie o porodzie|akt zgonu|karta urodzenia|postanowienie o (?:przysposobieniu|ustanowieniu pieczy))\b/mu.test(text)) return "certificate";
  if (/^(?:z[- ]?3[ab]?|zaswiadczenie platnika|zestawienie wynagrodzen|tabela wynagrodzen|lista plac)\b/mu.test(text)) return "payroll";
  if (/^(?:e[- ]?zla|zaswiadczenie lekarskie)\b/mu.test(text)) return "medical_leave";
  if (/^(?:(?:potwierdzenie|poswiadczenie|zaswiadczenie) (?:o )?(?:podlegani[au] |okresach )?ubezpiecz|zaswiadczenie o stanie (?:konta platnika|zadluzenia)|rozliczenie konta platnika)/mu.test(text)) return "insurance";
  if (/^(?:zam|wniosek o (?:wyplate |udzielenie )?(?:zasilek|zasilku|urlop|urlopu))\b/mu.test(text)) return "application";
  if (/^historia (?:wyplat|urlopow|zatrudnienia|zadluzenia)\b/mu.test(text)) return "history";
}

function columns(line: string) {
  return line.split(/\s*[|;\t]\s*| {2,}/u).map(cell => cell.trim());
}

function monthScope(value: string) {
  const normalized = value.replace(/^(\d{2})[./](\d{4})$/u, "$2-$1");
  const validFrom = documentDay(normalized + "-01");
  if (!validFrom) return;
  const end = new Date(validFrom + "T00:00:00Z");
  end.setUTCMonth(end.getUTCMonth() + 1, 0);
  return { validFrom, validTo: end.toISOString().slice(0, 10) };
}

export function analyzeCasePage(clientDocumentId: string, page: number, text: string, method: LocalCasePage["method"], previous?: LocalCasePage, confidence?: number): LocalCasePage {
  const folded = foldLabel(text);
  const identified = classify(folded);
  const continued = /(?:ciag dalszy|kontynuacja|c\.d\.)/u.test(folded) ||
    (previous?.role === "payroll" && /^(?:\d{4}-\d{2}|\d{2}[./]\d{4})[ |;\t]/mu.test(folded));
  const role = identified ?? (previous?.role === "decision" || continued ? previous?.role : undefined) ?? "other";
  const kind = role === "medical_leave" ? "certificate" : role === "history" ? "other" : role;
  const result: LocalCasePage = { page, text, method, kind, role, status: "read", candidates: [], confidence };
  if (role === "decision") return { ...result, status: "excluded", reason: "decision" };
  if (!folded || (confidence !== undefined && confidence < 70)) return { ...result, status: "manual", reason: "unreadable" };
  if (role === "other") return { ...result, reason: "unknown_type" };

  const lines = text.split(/\r?\n/u).map(foldLabel);
  claimFields(result, clientDocumentId, lines);
  let table = continued && !identified ? previous?.table : undefined;
  for (const [index, label] of lines.entries()) {
    const locator = { clientDocumentId, page, lineStart: index + 1, lineEnd: index + 1 };
    if (kind === "certificate" && /^data urodzenia(?: dziecka)?\s*:/u.test(label)) {
      const date = documentDay(label.slice(label.indexOf(":") + 1).trim());
      if (date) result.candidates.push({ field: "birthDate", value: { kind: "date", date }, locator });
      else result.reason = "ambiguous_field";
    }
    if (kind !== "payroll") continue;
    const cells = columns(label);
    if (cells.includes("miesiac") || cells.includes("miesiac nalezny")) {
      table = cells.map(cell => /^miesiac(?: nalezny)?$/u.test(cell) ? "month" :
        /^(?:wynagrodzenie )?brutto(?: \(zl\)| pln)?$/u.test(cell) ? "monthlyGrossPay" :
        /^podstawa skladki chorobowej(?: \(zl\)| pln)?$/u.test(cell) ? "monthlyContributionBasis" :
        /^(?:skladki potracone|potracone skladki(?: pracownika)?|skladki pracownika)(?: \(zl\)| pln)?$/u.test(cell) ? "monthlyEmployeeDeduction" :
        /^(?:kwota|wynagrodzenie) po potraceniu(?: skladek)?(?: \(zl\)| pln)?$/u.test(cell) ? "monthlyPayAfterDeduction" : "other");
      if (table.filter(c => c === "month").length !== 1) table = undefined;
      continue;
    }
    if (!table || !/\d/u.test(label)) continue;
    const period = monthScope(cells[table.indexOf("month")] ?? "");
    if (!period || cells.length !== table.length) { result.reason = "ambiguous_field"; continue; }
    for (const [column, type] of table.entries()) {
      if (type === "month" || type === "other") continue;
      const value = documentMoney(cells[column]);
      if (value) result.candidates.push({ field: type, value, ...period, locator: { ...locator, column: column + 1 } });
      else result.reason = "ambiguous_field";
    }
  }
  if (table) result.table = table;
  return result;
}

export function evidenceAvailability(documents: readonly LocalCaseDocument[], field: FactInput["field"]) {
  const pages = documents.flatMap(doc => doc.pages);
  const candidates = pages.flatMap(page => page.candidates.filter(candidate => candidate.field === field));
  const needsReview = pages.filter(p => p.status === "manual" || p.reason === "ambiguous_field" || p.reason === "unknown_type");
  return { status: candidates.length ? "found" : needsReview.length ? "needs_review" : "missing", candidates, needsReview } as const;
}

// The user selects a local cell and binds it to the person and title in the active case.
export function confirmCaseCandidate(document: LocalCaseDocument, registered: CaseDocument, candidate: EvidenceCandidate,
  scope: { subjectId: string; payerRef?: string; titleRef?: string; asOf?: string }) {
  const { locator } = candidate;
  const page = document.pages[locator.page - 1];
  if (document.metadata.clientDocumentId !== registered.metadata.clientDocumentId || locator.clientDocumentId !== registered.metadata.clientDocumentId ||
      registered.metadata.pages !== document.pages.length || page?.status !== "read" ||
      (registered.metadata.pageKinds && registered.metadata.pageKinds[locator.page - 1] !== page.kind) ||
      !page.candidates.includes(candidate)) {
    throw new Error("Wybierz pole z zarejestrowanego dokumentu tej sprawy.");
  }
  const { field, value, validFrom, validTo } = candidate;
  if (value.kind === "money" && (!scope.titleRef || !scope.payerRef)) throw new Error("Wybierz tytuł i płatnika dla tego wynagrodzenia.");
  return factInput.parse({
    subjectId: scope.subjectId, payerRef: scope.payerRef, titleRef: scope.titleRef,
    field, value, validFrom, validTo, asOf: candidate.asOf ?? (validFrom ? undefined : scope.asOf) ?? (field === "birthDate" && value.kind === "date" ? value.date : undefined),
    source: { kind: "document", referenceId: registered.id, page: locator.page },
  });
}
