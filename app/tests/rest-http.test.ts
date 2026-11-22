import { describe, expect, it } from "vitest";
import { problem, readJson, requireOrigin } from "../src/lib/zusik/v1/http";

const url = "https://preview.test/api/v1/profiles";
function post(body: string, type = "application/json") {
  return new Request(url, { method: "POST", headers: { "Content-Type": type }, body });
}

describe("v1 HTTP boundary", () => {
  it("limits the stream even when Content-Length is absent", async () => {
    await expect(readJson(post("a".repeat(65_537)))).rejects.toMatchObject({ status: 413 });
    await expect(readJson(post("{"))).rejects.toMatchObject({ status: 400 });
    await expect(readJson(post("{}", "text/plain"))).rejects.toMatchObject({ status: 415 });
    expect(await readJson(post('{"mode":"family"}'))).toEqual({ mode: "family" });
  });
  it("checks the full origin and ignores untrusted forwarding headers", () => {
    for (const origin of ["http://preview.test", "https://other.test", "null"]) {
      expect(() => requireOrigin(new Request(url, { headers: { origin, "x-forwarded-host": "other.test" } }))).toThrow();
    }
    expect(() => requireOrigin(new Request(url, { headers: { origin: "https://preview.test" } }))).not.toThrow();
  });
  it("never returns private exception text", async () => {
    const response = problem(new Error("private-value"));
    expect(response.status).toBe(503);
    expect(response.headers.get("content-type")).toBe("application/problem+json");
    expect(await response.text()).not.toContain("private-value");
  });
});
