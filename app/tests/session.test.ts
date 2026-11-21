import { describe, expect, it } from "vitest";
import { decodeSession, encodeSession, isSameOrigin, newSessionId } from "@/lib/zusik/session";

const SECRET = "test-secret-not-real";

describe("signed demo session", () => {
  it("round-trips a valid cookie", () => {
    const id = newSessionId();
    expect(decodeSession(encodeSession(id, SECRET), SECRET)).toBe(id);
  });

  it("rejects a tampered signature, a swapped id and a different secret", () => {
    const id = newSessionId();
    const cookie = encodeSession(id, SECRET);
    expect(decodeSession(cookie.slice(0, -2) + "xx", SECRET)).toBeNull();
    expect(decodeSession(`${newSessionId()}.${cookie.split(".")[1]}`, SECRET)).toBeNull();
    expect(decodeSession(cookie, "other-secret")).toBeNull();
    expect(decodeSession(undefined, SECRET)).toBeNull();
    expect(decodeSession("garbage", SECRET)).toBeNull();
  });

  it("accepts writes only from the same origin", () => {
    const h = (o: Record<string, string>) => new Headers(o);
    expect(isSameOrigin(h({ origin: "https://zusik.vercel.app", host: "zusik.vercel.app" }))).toBe(true);
    expect(isSameOrigin(h({ origin: "https://evil.example", host: "zusik.vercel.app" }))).toBe(false);
    expect(isSameOrigin(h({ host: "zusik.vercel.app" }))).toBe(false);
  });
});
