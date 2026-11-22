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

async function decide(kinds: Parameters<typeof syntheticCasePdf>[0][]) {
  const documents = await readCaseDocuments(await Promise.all(kinds.map(file)), options);
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
