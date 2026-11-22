import { expect, it } from "vitest";
import { compareSources } from "../scripts/zusik-review-sources";

it("marks new, changed and unlisted publications and ignores a repeated snapshot", () => {
  const original = ["a", "b"].map(url => ({ url, title: url, hash: "first" }));
  const next = [{ ...original[0], hash: "second" }, { url: "c", title: "c", hash: "new" }];
  expect(compareSources(original, next).map(c => [c.url, c.kind])).toEqual([
    ["a", "changed"], ["b", "withdrawn"], ["c", "new"],
  ]);
  expect(compareSources(next, next)).toEqual([]);
});
