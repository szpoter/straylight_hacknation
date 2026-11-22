import { describe, expect, it } from "vitest";
import { analyzeCasePage, confirmCaseCandidate, evidenceAvailability, type LocalCaseDocument } from "../src/features/chat/case-evidence";
import { docInput, factInput } from "../src/lib/zusik/memory/contract";

const id = "local-A";
const first = analyzeCasePage(id, 1, "Z-3\nMiesiąc należny | Miesiąc wypłaty | Wynagrodzenie brutto | Podstawa składki chorobowej\n2026-02 | 2026-03 | 6 500,00 zł | 0,00", "pdf_text");
const second = analyzeCasePage(id, 2, "Ciąg dalszy\n2026-03 | 2026-04 | 6 123,45 | 5 432,10", "ocr", first, 94);
const doc: LocalCaseDocument = { caseId: "case-A", metadata: { kind: "payroll", clientDocumentId: id, pages: 2 }, pages: [first, second] };
const registered = { id: "registered-A", metadata: doc.metadata };
const scope = { subjectId: "parent-A", titleRef: "title-A", payerRef: "payer-P" };

describe("review of local evidence", () => {
  it("retains the earned month, zero, column and continued headings", () => {
    expect(docInput.parse(doc.metadata)).toEqual(registered.metadata);
    expect(first.candidates.map(c => c.value)).toEqual([
      { kind: "money", currency: "PLN", grosze: 650000 }, { kind: "money", currency: "PLN", grosze: 0 },
    ]);
    expect(second.candidates[0]).toMatchObject({ validFrom: "2026-03-01", validTo: "2026-03-31",
      locator: { clientDocumentId: id, page: 2, lineStart: 2, lineEnd: 2, column: 3 } });
    const fact = confirmCaseCandidate(doc, registered, first.candidates[0], scope);
    expect(JSON.parse(JSON.stringify(fact))).toEqual({
      ...scope, validFrom: "2026-02-01", validTo: "2026-02-28", field: "monthlyGrossPay", value: { kind: "money", grosze: 650000, currency: "PLN" },
      source: { kind: "document", referenceId: "registered-A", page: 1 },
    });
    expect(factInput.parse(fact)).toEqual(fact);
    expect(() => confirmCaseCandidate(doc, registered, first.candidates[0], { subjectId: "A" })).toThrow("płatnika");
    expect(() => confirmCaseCandidate(doc, { ...registered, metadata: { ...doc.metadata, clientDocumentId: "another" } }, first.candidates[0], scope)).toThrow();
  });

  it("distinguishes absent information from a damaged value and low confidence OCR", () => {
    expect(evidenceAvailability([doc], "birthDate").status).toBe("missing");
    for (const text of ["2026-03 | 2026-04 | | -", "2026-03 | 2026-04 | 6O00,00 | -2,10", "2026-03 | 6000"]) {
      const damaged = analyzeCasePage(id, 2, text, "ocr", first, 89);
      expect(damaged.candidates).toEqual([]);
      expect(evidenceAvailability([{ ...doc, pages: [damaged] }], "monthlyGrossPay").status).toBe("needs_review");
    }
    expect(analyzeCasePage(id, 1, first.text, "ocr", undefined, 52)).toMatchObject({ status: "manual", candidates: [] });
  });

  it("keeps the decision and its continuation out of the confirmed inputs", () => {
    const decision = analyzeCasePage(id, 3, "Decyzja\n" + first.text, "pdf_text", second);
    const continuation = analyzeCasePage(id, 4, "Data urodzenia: 01.01.2000", "pdf_text", decision);
    for (const page of [decision, continuation]) expect(page).toMatchObject({ status: "excluded", candidates: [] });
    expect(analyzeCasePage(id, 5, "Akt urodzenia\nData urodzenia: 31.02.2024", "pdf_text", continuation))
      .toMatchObject({ role: "certificate", reason: "ambiguous_field", candidates: [] });
  });
});
