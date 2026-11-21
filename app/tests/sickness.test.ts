import { readFileSync } from "node:fs";
import { MemorySaver } from "@langchain/langgraph";
import { describe, expect, it, vi } from "vitest";
import { assessSicknessCase, LAW_IDS } from "@/lib/rules/sickness";
import { blankFields, confirmManual, fieldsFrom } from "@/lib/sickness/manual";
import { packetA, parsePage, splitPages } from "@/lib/sickness/read";
import { SicknessService } from "@/lib/sickness/service";
import type { Answer, PageFact } from "@/lib/sickness/types";
import { MemoryCaseStore } from "./helpers";

const law = LAW_IDS.map((id, i) => ({
  id,
  title: id,
  url: "https://eli.gov.pl/api/acts/DU/2026/854/text.pdf#page=" + [4, 4, 5, 6][i],
}));
const day = (pages: PageFact[], otherCoverage: Answer | null = "no") =>
  assessSicknessCase({ pages, otherCoverage }, law);
const [cert, job, history] = packetA;
const readPack = (id: string) =>
  splitPages(readFileSync("public/demo/sickness/pakiet-" + id + ".txt", "utf8")).map((s, i) =>
    parsePage(s, i + 1),
  );

describe("Sickness benefit evidence and decision for a period", () => {
  it("imports the downloadable pack irrespective of file name and confirms the full negative result", () => {
    expect(readPack("A")).toEqual(packetA);
    expect(day(readPack("A"))).toMatchObject({
      status: "not_entitled_for_period",
      period: { from: "2026-11-02", to: "2026-11-13" },
      evidenceIds: ["certificate-1", "employment-2", "history-3"],
      law,
      question: null,
    });
  });
  it("binds a newly confirmed claimant to the imported certificate and rejects an explicitly foreign manual page", () => {
    const pages = packetA.map((p) => ({ ...p, subject: "DEMO-F", payer: p.payer === "A" ? "F" : p.payer }));
    expect(day(pages).status).toBe("not_entitled_for_period");
    expect(day([pages[0], { ...pages[1], manual: true, subject: "DEMO-B" }, pages[2]]).status).toBe(
      "requires_review",
    );
  });
  it("recognises a missing finding when the second file omits the employment page", () => {
    expect(day(readPack("B"))).toMatchObject({
      status: "needs_fact",
      question: expect.stringContaining("ustalenie"),
    });
  });
  it.each([
    { scenario: "wrong employee", patch: { subject: "DEMO-B" } },
    { scenario: "wrong payer", patch: { payer: "B" } },
    { scenario: "business rather than employment", patch: { title: "działalność" } },
    { scenario: "only part of interval", patch: { period: { from: "2026-11-03", to: "2026-11-30" } } },
    { scenario: "confirmed employment cover", patch: { value: "covered" as const } },
  ])("requires review for $scenario", ({ patch }) => {
    expect(day([cert, { ...job, ...patch }, history]).status).toBe("requires_review");
  });
  it("distinguishes unknown, unsupplied and confirmed alternative coverage", () => {
    expect(day(packetA, null)).toMatchObject({ status: "needs_fact", asksOtherCoverage: true });
    expect(day(packetA, "unknown")).toMatchObject({ status: "requires_review", question: null });
    expect(day(packetA, "yes")).toMatchObject({
      status: "requires_review",
      question: expect.stringContaining("okres"),
    });
  });
  it("checks prior protection and continuous illness", () => {
    const prior = { ...history, value: "ended" as const, period: { from: "2026-10-01", to: "2026-11-03" } };
    expect(day([cert, job, prior]).summary).toContain("zaczęła się w okresie");
    expect(day([cert, job, { ...prior, period: { from: "2026-10-01", to: "2026-10-20" } }]).summary).toContain(
      "art. 7",
    );
    expect(day([{ ...cert, onset: null }, job, prior]).status).toBe("needs_fact");
  });
  it("does not infer full history from an employer or deny when there are conflicting pages", () => {
    expect(day([cert, job, { ...history, payer: "A" }]).status).toBe("requires_review");
    expect(day([...packetA, { ...cert, page: 4, onset: "2026-11-01" }]).status).toBe("requires_review");
    expect(day([job, history]).period).toEqual({ from: null, to: null });
    expect(day([{ ...cert, onset: "2026-11-01" }, { ...job, period: cert.period }, history]).status).toBe(
      "requires_review",
    );
  });
  it("rejects missing and unofficial law, and dates outside the verified window", () => {
    for (const sources of [law.slice(1), [...law.slice(1), { ...law[0], url: "https://invalid.test/" }]]) {
      expect(assessSicknessCase({ pages: packetA, otherCoverage: "no" }, sources).status).toBe("requires_review");
    }
    expect(assessSicknessCase({ pages: packetA, otherCoverage: "no" }, law, "2027-01-01").status).toBe(
      "requires_review",
    );
  });
  it("rejects ambiguous, malformed and real-world documents instead of treating them as demo evidence", () => {
    for (const text of [
      cert.text.replace("DEMO-A", "real claimant"),
      cert.text.replace("2026-11-02", "2026-02-31"),
      cert.text.replace("Kod: B", "Osoba: DEMO-A"),
      "orzeczenie odmowne",
      cert.text.replace("ZUSIK DEMO / 1", ""),
    ]) {
      expect(() => parsePage(text, 1)).toThrow();
    }
  });
});

describe("Durable LangGraph sickness case", () => {
  const setup = () => {
    const store = new MemoryCaseStore();
    const saver = new MemorySaver();
    const search = vi.fn(async () => law);
    return {
      search,
      service: new SicknessService(store, saver, search),
      fresh: () => new SicknessService(store, saver, search),
    };
  };
  it("revokes a result across reload, isolates evidence, retries idempotently and rejects stale changes", async () => {
    const { service, fresh, search } = setup();
    const initial = (await service.change("alice", { type: "start" })).view!;
    const other = (await service.change("bob", { type: "start" })).view!;
    const locator = initial.evidence[1].url.split("/").at(-1)!;
    expect(await service.evidence("alice", locator)).toMatchObject({ kind: "employment", page: 2 });
    expect(await service.evidence("bob", locator)).toBeNull();
    expect(other.evidence[1].url).not.toBe(initial.evidence[1].url);
    const confirm = { type: "confirm" as const, version: 1, answer: "no" as const };
    const result = await service.change("alice", confirm);
    expect(result.view?.assessment.status).toBe("not_entitled_for_period");
    expect(await service.change("alice", confirm)).toEqual(result);
    expect((await service.change("alice", { ...confirm, answer: "yes" })).status).toBe(409);
    const closed = (await service.change("alice", { type: "close", version: 2 })).view!;
    expect(closed.closed).toBe(true);
    const changed = (await service.change("alice", { type: "evidence", version: 3, includeEmployment: false }))
      .view!;
    expect(changed).toMatchObject({ closed: false, version: 4, assessment: { status: "needs_fact" } });
    expect(await service.evidence("alice", locator)).toBeNull();
    search.mockClear();
    expect(await fresh().get("alice")).toEqual(changed);
    expect(await fresh().get("new")).toBeNull();
    expect(search).not.toHaveBeenCalled();
    expect((await service.change("alice", { type: "close", version: 4 })).status).toBe(422);
  });
  it("imports a new packet only after confirmation and reopens a prior denial on new insurance", async () => {
    const { service } = setup();
    await service.change("p", { type: "start" });
    await service.change("p", { type: "confirm", version: 1, answer: "no" });
    const revised = (await service.change("p", { type: "confirm", version: 2, answer: "yes" })).view!;
    expect(revised.assessment.status).toBe("requires_review");
    const partial = (
      await service.change("p", { type: "import", version: 3, pages: readPack("B").map((p) => p.text) })
    ).view!;
    expect(partial).toMatchObject({
      otherCoverage: null,
      includeEmployment: false,
      canRestoreEmployment: false,
      assessment: { status: "needs_fact" },
    });
  });
  it("accepts a confirmed finding on page four from a different document layout, retains the page and rejects an ambiguous reading", async () => {
    const { service } = setup();
    const session = "new-file";
    await service.change(session, { type: "start" });
    expect(() => confirmManual({ ...blankFields, kind: "employment" }, 4)).toThrow();
    const updated = confirmManual({ ...fieldsFrom(job), from: "2026-11-04" }, 4);
    const pages = [
      { page: 1, text: cert.text, manual: true },
      { page: 4, text: updated.text, manual: true },
      { page: 6, text: history.text, manual: true },
    ];
    const response = await service.change(session, { type: "import", version: 1, pages });
    expect(response.view?.assessment.status).toBe("requires_review");
    const link =
      response.view?.evidence
        .find((e) => e.id === "employment-4")
        ?.url.split("/")
        .at(-1) ?? "";
    expect(await service.evidence(session, link)).toMatchObject({
      manual: true,
      page: 4,
      period: { from: "2026-11-04", to: "2026-11-30" },
    });
    await expect(
      service.change(session, { type: "import", version: 2, pages: [pages[0], pages[0]] }),
    ).rejects.toThrow();
  });
  it("preserves the last committed assessment during a source outage", async () => {
    const { service, search } = setup();
    const first = await service.change("p", { type: "start" });
    search.mockRejectedValueOnce(new Error("unavailable"));
    await expect(service.change("p", { type: "confirm", version: 1, answer: "no" })).rejects.toThrow();
    expect(await service.get("p")).toEqual(first.view);
    expect((await service.change("p", { type: "confirm", version: 1, answer: "no" })).view?.version).toBe(2);
  });
});
