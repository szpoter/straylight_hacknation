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

it("requires an explicit single check in the insurance coverage group", () => {
  const read = (choices: string) => analyzeCasePage(id, 1, "Potwierdzenie ubezpieczenia\nStan na dzień: 25.06.2026\nUbezpieczenie chorobowe: " + choices, "pdf_text");
  expect(read("[ ] tak [X] nie").candidates[0]).toMatchObject({ field: "sicknessCoverage", value: { code: "excluded" }, asOf: "2026-06-25" });
  expect(read("☑ tak ☐ nie").candidates[0].value).toEqual({ kind: "code", code: "covered" });
  for (const choices of ["[ ] tak [ ] nie", "[x] tak [x] nie", ""]) {
    expect(read(choices)).toMatchObject({ candidates: [], reason: "ambiguous_field" });
  }
});

it("keeps a reference to Z-3 inside a decision continuation from opening a new document", () => {
  const prev = analyzeCasePage(id, 2, "Decyzja końcowa", "pdf_text");
  const continuation = analyzeCasePage(id, 3, "Na podstawie Z-3 sporządzono wyliczenie.\nMiesiąc | Brutto\n2026-02 | 99999,99", "pdf_text", prev);
  expect(continuation).toMatchObject({ role: "decision", status: "excluded", candidates: [] });
});

describe("extended v1 evidence", () => {
  function confirmed(text: string) {
    const page = analyzeCasePage(id, 1, text, "pdf_text");
    const source = { ...doc, pages: [page], metadata: { clientDocumentId: id, kind: page.kind, pages: 1, pageKinds: [page.kind] } };
    const entry = { id: "server-document", metadata: source.metadata };
    return page.candidates.map(candidate => confirmCaseCandidate(source, entry, candidate, scope));
  }
  it("sends dated, typed maternity fields with the certificate page", () => {
    const facts = confirmed(["Zaświadczenie o porodzie", "Data porodu: 01.02.2026", "Liczba dzieci z tego porodu: 1",
      "Liczba dni urlopu macierzyńskiego przed porodem: 0", "Przebieg urlopu macierzyńskiego: zgon jedynego dziecka z tego porodu",
      "Data zgonu dziecka: 16.02.2026"].join("\n"));
    expect(facts.map(f => [f.field, f.value])).toEqual([
      ["deliveryDate", { kind: "date", date: "2026-02-01" }], ["birthChildCount", { kind: "count", count: 1 }],
      ["prenatalLeaveDays", { kind: "count", count: 0 }], ["maternityCourse", { kind: "code", code: "single_child_death" }],
      ["childDeathDate", { kind: "date", date: "2026-02-16" }],
    ]);
    for (const fact of facts) expect(factInput.parse(fact)).toMatchObject({ asOf: "2026-02-01", source: { kind: "document", referenceId: "server-document", page: 1 } });
  });
  it("emits the full settlement date or explicit unpaid status at the certified date", () => {
    const header = "Rozliczenie konta płatnika\nStan na dzień: 01.05.2026\n";
    expect(confirmed(header + "Zadłużenie z tytułu składek: 100,10 zł\nStan spłaty zadłużenia: niespłacone").map(f => f.value)).toEqual([
      { kind: "money", grosze: 10010, currency: "PLN" }, { kind: "code", code: "unpaid" },
    ]);
    expect(confirmed(header + "Data pełnej spłaty zadłużenia: 28.04.2026")[0]).toMatchObject({
      field: "debtSettlement", asOf: "2026-05-01", value: { kind: "code", code: "2026-04-28" },
    });
    for (const row of ["Data pełnej spłaty zadłużenia: 02.05.2026", "Data częściowej spłaty: 28.04.2026", "Stan spłaty zadłużenia: brak danych"]) {
      expect(confirmed(header + row)).toEqual([]);
    }
    expect(confirmed("Rozliczenie konta płatnika\nStan spłaty zadłużenia: niespłacone")).toEqual([]);
  });
});

describe("written Polish requests", () => {
  const read = (text: string) => analyzeCasePage(id, 7, text, "ocr", undefined, 93);
  it("locates a parent's written leave request without inferring an application for payment", () => {
    const page = read("Wniosek\nZwracam się z uprzejmą prośbą o udzielenie mi\nurlopu ojcowskiego w okresie\nod 4 października 2026 r. do 17 października 2026 r.");
    expect(page.candidates).toEqual([]);
    expect(page.leaveRequests).toEqual([{ kind: "paternity", validFrom: "2026-10-04", validTo: "2026-10-17",
      locator: { clientDocumentId: id, page: 7, lineStart: 2, lineEnd: 4 } }]);
  });
  it("ties repeated letter headings to the date in the actual request", () => {
    const letter = read("Wniosek o udzielenie urlopu macierzyńskiego\nW związku z urodzeniem dziecka proszę o udzielenie mi urlopu macierzyńskiego,\npocząwszy od 1 lutego 2026 do 20 czerwca 2026");
    expect(letter.leaveRequests).toMatchObject([{ kind: "maternity", validFrom: "2026-02-01", validTo: "2026-06-20", locator: { lineStart: 1, lineEnd: 3 } }]);
    expect(letter.candidates).toEqual([]);
  });
  it("locates the explicit request for payment and its own range", () => {
    const page = read("Wnoszę o wypłatę zasiłku macierzyńskiego\nza okres od 2.3.2026 do 3.5.2026");
    expect(page.candidates).toMatchObject([{ field: "benefitRequest", validFrom: "2026-03-02", validTo: "2026-05-03",
      locator: { page: 7, lineStart: 1, lineEnd: 2 } }]);
  });
  it.each(["Wniosek o zasiłek macierzyński\nOkres zatrudnienia", "Wniosek o urlop rodzicielski\nWcześniej korzystałam",
    "Wniosek o zasiłek macierzyński\n☐ urlop ojcowski", "Proszę o zestawienie wypłat zasiłku macierzyńskiego",
    "Decyzja\nWnoszę o wypłatę zasiłku macierzyńskiego", "Wniosek o urlop macierzyński albo urlop rodzicielski"])(
    "skips instructions, other dates and ambiguous requests (%s)", heading => {
      const page = read(heading + "\nod 02.03.2026 do 03.05.2026");
      expect(page.candidates).toEqual([]);
      expect(page.leaveRequests ?? []).toEqual([]);
    });
  it("requires a selected maternity row in the ZAM period group", () => {
    const form = (mark: string) => read("Wnioskuję o zasiłek macierzyński za okres:\n" + mark + " urlopu macierzyńskiego\nod 2.3.2026 do 3.5.2026");
    expect(form("☒").candidates).toMatchObject([{ field: "benefitRequest", validFrom: "2026-03-02", validTo: "2026-05-03" }]);
    expect(form("☐").candidates).toEqual([]);
    expect(form("").candidates).toEqual([]);
  });
  it("reads numbered civil register sections and excludes parental dates", () => {
    const page = read("Odpis skrócony\naktu urodzenia\n1. Dane dziecka\nData urodzenia\n3 lutego 2026 r.\n2. Dane rodziców\nData urodzenia 12.02.1991");
    expect(page.candidates).toMatchObject([{ field: "birthDate", value: { date: "2026-02-03" }, locator: { page: 7, lineStart: 4, lineEnd: 5 } }]);
  });
});
