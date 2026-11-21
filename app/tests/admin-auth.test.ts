import { describe, expect, it } from "vitest";
import {
  checkCredentials,
  decodeAdminSession,
  encodeAdminSession,
  hashPassword,
  verifyPassword,
} from "@/lib/admin/auth";

const SECRET = "test-secret-not-real";
const NOW = 1_800_000_000;

describe("admin password hash", () => {
  const stored = hashPassword("Poprawne-hasło-1");

  it("accepts the right password and rejects others", () => {
    expect(stored.startsWith("scrypt:")).toBe(true);
    expect(stored).not.toContain("$");
    expect(verifyPassword("Poprawne-hasło-1", stored)).toBe(true);
    expect(verifyPassword("poprawne-hasło-1", stored)).toBe(false);
    expect(verifyPassword("", stored)).toBe(false);
  });

  it("uses a random salt and rejects malformed hashes", () => {
    expect(hashPassword("x")).not.toBe(hashPassword("x"));
    expect(verifyPassword("x", "plain-text")).toBe(false);
    expect(verifyPassword("x", "scrypt:1000:abc:def")).toBe(false);
  });
});

describe("admin credentials", () => {
  const expected = { login: "admin.zus", passwordHash: hashPassword("tajne") };

  it("needs both the login and the password", () => {
    expect(checkCredentials("admin.zus", "tajne", expected)).toBe(true);
    expect(checkCredentials("  admin.zus ", "tajne", expected)).toBe(true);
    expect(checkCredentials("admin", "tajne", expected)).toBe(false);
    expect(checkCredentials("admin.zus", "zle", expected)).toBe(false);
  });
});

describe("admin session token", () => {
  it("round-trips before expiry", () => {
    const token = encodeAdminSession("admin.zus", NOW + 60, SECRET);
    expect(decodeAdminSession(token, SECRET, NOW)).toBe("admin.zus");
  });

  it("rejects expired, tampered and foreign tokens", () => {
    const token = encodeAdminSession("admin.zus", NOW + 60, SECRET);
    expect(decodeAdminSession(token, SECRET, NOW + 60)).toBeNull();
    expect(decodeAdminSession(token, "other-secret", NOW)).toBeNull();
    const [login, , sig] = token.split(".");
    expect(decodeAdminSession(`${login}.${NOW + 9999}.${sig}`, SECRET, NOW)).toBeNull();
    const forged = encodeAdminSession("intruz", NOW + 60, SECRET).split(".");
    expect(decodeAdminSession(`${forged[0]}.${NOW + 60}.${sig}`, SECRET, NOW)).toBeNull();
    expect(decodeAdminSession(undefined, SECRET, NOW)).toBeNull();
    expect(decodeAdminSession("a.b", SECRET, NOW)).toBeNull();
  });
});
