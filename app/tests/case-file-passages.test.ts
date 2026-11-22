import { describe, expect, it } from "vitest";
import { findCasePassages } from "../src/features/chat/find-case-passages";

describe("local case PDF questions", () => {
  it("returns sourced excerpts across the entire packet, including the last scanned page", () => {
    const pages = Array<string>(73).fill("Wniosek rodzica");
    const text = "Podstawa wymiaru wypłaty: 3200,50 zł brutto.";
    pages.push(text);
    expect(findCasePassages(pages, "Ile dostanę?")).toEqual([{ page: 74, excerpt: text, score: expect.any(Number) }]);
  });
  it("produces no evidence for an unrelated question or an unreadable page", () => {
    expect(findCasePassages(["", "Podstawa wynagrodzenia"], "adopcja bliźniąt")).toEqual([]);
  });
});
