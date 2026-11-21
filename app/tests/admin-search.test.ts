import { describe, expect, it } from "vitest";
import { caseSearchFields, normalize, scoreMatch, searchItems } from "@/features/admin/search";
import { paternityTestCases } from "@/lib/admin/catalog";

const CASES = paternityTestCases();
const ids = (query: string) => searchItems(CASES, query, caseSearchFields).map((c) => c.id);

describe("normalize", () => {
  it("strips Polish diacritics, including ł, and punctuation", () => {
    expect(normalize("Łączenie, ZĄŻÓŁĆ-ęśń")).toBe("laczenie zazolc esn");
  });
});

describe("admin case search", () => {
  it("ignores diacritics and case in both directions", () => {
    expect(ids("wczesniejszym")).toEqual(["K-02"]);
    expect(ids("wcześniejszym")).toEqual(["K-02"]);
    expect(ids("LIMICIE")).toEqual(["K-03"]);
  });

  it("requires every word to match", () => {
    expect(ids("wniosek limicie")).toEqual(["K-03"]);
    expect(ids("limicie odmowa")).toEqual([]);
  });

  it("finds IDs typed with or without the hyphen", () => {
    expect(ids("K-05")[0]).toBe("K-05");
    expect(ids("k05")[0]).toBe("K-05");
    expect(ids("k 05")[0]).toBe("K-05");
  });

  it("matches word prefixes and searches case data", () => {
    expect(ids("potwierdz")[0]).toBe("K-08");
    expect(ids("19 maja")).toContain("K-03");
  });

  it("ranks title and tag matches first", () => {
    expect(ids("limit").slice(0, 2).sort()).toEqual(["K-03", "K-04"]);
  });

  it("does not let a single letter match the middle of words", () => {
    expect(scoreMatch([{ text: "Bliźnięta", weight: 1 }], "z")).toBeNull();
  });

  it("returns everything for an empty or punctuation-only query", () => {
    expect(ids("")).toHaveLength(CASES.length);
    expect(ids("  -- ")).toHaveLength(CASES.length);
  });
});
