import { expect, it } from "vitest";
import { canonicalHash, etag, matchRevision, pagination } from "../src/lib/zusik/v1/guards";
const url = new URL("https://test.invalid/api/v1/profiles");
it("binds a cursor to owner, collection, filters and page size", () => {
  const first = pagination(url, "one", "synthetic", false);
  const cursor = first.result({ items: [], nextAfterId: "item-a" }).nextCursor!;
  const next = new URL(url);
  next.searchParams.set("cursor", cursor);
  expect(pagination(next, "one", "synthetic", false).page.afterId).toBe("item-a");
  expect(() => pagination(next, "two", "synthetic", false)).toThrow();
  next.searchParams.set("limit","5");
  expect(() => pagination(next, "one", "synthetic", false)).toThrow();
});
it("compares only the strong validator for the target resource", () => {
  for (const tag of ['W/"one.1"', '"two.1"', '"one.01"', '*']) {
    expect(() => matchRevision(new Request(url, { headers: { "If-Match": tag } }), "one")).toThrow();
  }
  expect(matchRevision(new Request(url, { headers: { "If-Match": etag("one", 2) } }), "one")).toBe(2);
});
it("canonicalizes nested object keys while preserving array order", () => {
  expect(canonicalHash({ nested: { a: 1, b: 2 } })).toBe(canonicalHash({ nested: { b: 2, a: 1 } }));
  expect(canonicalHash([1,2])).not.toBe(canonicalHash([2,1]));
});
