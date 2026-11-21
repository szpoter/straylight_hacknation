import { describe, expect, it } from "vitest";
import { caseSearchFields, normalize, scoreMatch, searchItems } from "@/features/admin/search";
import { TEST_CASES } from "@/features/admin/mock-data";

const ids = (query: string) => searchItems(TEST_CASES, query, caseSearchFields).map((c) => c.id);

describe("normalize", () => {
  it("strips Polish diacritics, including ł, and punctuation", () => {
    expect(normalize("Łączenie, ZĄŻÓŁĆ-ęśń")).toBe("laczenie zazolc esn");
  });
});

describe("admin case search", () => {
  it("ignores diacritics in both directions", () => {
    expect(ids("bliznieta")).toEqual(["S-02"]);
    expect(ids("bliźnięta")).toEqual(["S-02"]);
    expect(ids("LACZENIE")).toEqual(["S-05"]);
    expect(ids("wczesniak")).toEqual(["S-03"]);
  });

  it("requires every word to match", () => {
    // S-08 matches through its expected result ("Pula rodzicielskiego"), so it ranks below the title match.
    expect(ids("rodzicielski jedno")).toEqual(["S-01", "S-08"]);
    expect(ids("rodzicielski blizneta")).toEqual([]);
  });

  it("finds IDs typed with or without the hyphen", () => {
    expect(ids("S-04")[0]).toBe("S-04");
    expect(ids("s04")[0]).toBe("S-04");
    expect(ids("s 04")[0]).toBe("S-04");
  });

  it("searches case data and matches word prefixes", () => {
    expect(ids("dobrowolne")).toEqual(["S-04"]);
    expect(ids("adop")).toEqual(["S-06"]);
  });

  it("ranks title matches above matches deeper in the data", () => {
    const result = ids("rodzicielski");
    expect(result[0]).toBe("S-01");
    expect(result).toContain("S-05");
  });

  it("does not let a single letter match the middle of words", () => {
    expect(scoreMatch([{ text: "Bliźnięta", weight: 1 }], "z")).toBeNull();
  });

  it("returns everything for an empty or punctuation-only query", () => {
    expect(ids("")).toHaveLength(TEST_CASES.length);
    expect(ids("  -- ")).toHaveLength(TEST_CASES.length);
  });
});
