import { PDFDocument } from "pdf-lib";
import { expect, it, vi } from "vitest";
import { confirmCaseCandidate } from "../src/features/chat/case-evidence";
import { readCaseDocuments } from "../src/features/chat/read-case-pdf";
import { assessCase } from "../src/lib/rules/case-assessment";
import { docInput, type EvidenceFact } from "../src/lib/zusik/memory/contract";
import { syntheticCasePdf } from "./fixtures/case-import-pdf";

vi.mock("../src/features/kamil/read-document", () => ({
  pdfjs: () => import("pdfjs-dist/legacy/build/pdf.mjs"),
}));
const scope = { subjectId: "person-A", payerRef: "payer-P", titleRef: "title-A" };
const options = { caseId: "case-A", signal: new AbortController().signal, onProgress() {} };
const file = async (kind: Parameters<typeof syntheticCasePdf>[0]) => new File([await syntheticCasePdf(kind)], "zalacznik.pdf");

async function decide(inputs: (Parameters<typeof syntheticCasePdf>[0] | File)[]) {
  const files = await Promise.all(inputs.map(input => typeof input === "string" ? file(input) : input));
  const documents = await readCaseDocuments(files, options);
  const facts: EvidenceFact[] = [];
  const registered = documents.map((document, index) => {
    const server = { id: "registered-" + index, metadata: docInput.parse(document.metadata) };
    for (const page of document.pages) for (const candidate of page.candidates) {
      const fact = confirmCaseCandidate(document, server, candidate, scope);
      facts.push({ fact, factId: "fact-" + facts.length, version: 1, verification: "confirmed", recordedAt: "2026-07-09T00:00:00Z" });
    }
    return server;
  });
  expect(registered[0].metadata.pageKinds).toEqual(["application", "certificate", "insurance", "decision"]);
  expect(facts.some(e => e.fact.source.page === 4)).toBe(false);
  const revisions = { profileRevision: 2, caseRevision: 2 };
  return assessCase({ ...revisions, subjectId: scope.subjectId, asOf: "2026-07-09", benefit: "maternity" }, { ...revisions, facts, documents: registered })[0];
}

it("reads and confirms a refusal from a mixed packet regardless of its attached final decision", async () => {
  expect(await decide(["excluded"])).toMatchObject({ status: "ineligible", reasonCode: "excluded_no_other_title_or_exception", from: "2026-06-25", to: "2026-07-08" });
});
it("asks for payroll and calculates 2416.12 PLN from the second PDF with 12 located rows", async () => {
  expect(await decide(["covered"])).toMatchObject({ status: "eligible", amountStatus: "needs_information" });
  expect(await decide(["covered", "payroll"])).toMatchObject({ status: "eligible", grossAmountGrosze: 241612, payer: "employer",
    segments: [{ basisGrosze: 517740, days: 6 }, { dailyGrosze: 17258, days: 8 }] });
});

it("averages two pay levels from a separate payroll PDF before rounding the daily benefit", async () => {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([820, 680]);
  const lines = ["Z-3 - zaswiadczenie platnika", "Stan na dzien: 25.06.2026",
    "Warunki zatrudnienia: pelny etat, stale wynagrodzenie, pelne miesiace",
    "Miesiac nalezny | Wynagrodzenie brutto | Skladki potracone"];
  for (let i = 0; i < 12; i++) {
    const month = new Date(Date.UTC(2025, 5 + i, 1)).toISOString().slice(0, 7);
    lines.push(month + (i < 6 ? " | 6 000,00 | 822,60" : " | 6 600,00 | 904,86"));
  }
  lines.forEach((line, i) => page.drawText(line, { x: 30, y: 630 - i * 30, size: 14 }));
  const payroll = new File([Uint8Array.from(await pdf.save())], "zestawienie.pdf");
  // Six months at 5177.40 and six at 5695.14 give 5436.27. Rounded daily: 181.21.
  const decision = await decide(["covered", payroll]);
  expect(decision).toMatchObject({
    status: "eligible", amountStatus: "calculated", from: "2026-06-25", to: "2026-07-08", payer: "employer",
    grossAmountGrosze: 253694, segments: [
      { days: 6, basisGrosze: 543627, dailyGrosze: 18121, grossAmountGrosze: 108726 },
      { days: 8, basisGrosze: 543627, dailyGrosze: 18121, grossAmountGrosze: 144968 },
    ],
  });
  expect(decision.citations.filter(c => c.kind === "document").map(c => [c.ref, c.page]).sort()).toEqual([
    ["registered-0", 1], ["registered-0", 2], ["registered-0", 3], ["registered-1", 1],
  ]);
});
