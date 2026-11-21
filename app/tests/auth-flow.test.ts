import { describe, expect, it } from "vitest";
import { AUTH_PATHS, backHref, flowHref, readFlow } from "@/features/auth/flow";

describe("demo login flow params", () => {
  it("defaults to login from the hero without a simulated error", () => {
    expect(readFlow({})).toEqual({ origin: "logowanie", entry: "hero", simulateError: false });
    expect(flowHref(AUTH_PATHS.loginGov, {})).toBe("/logowanie/login-gov");
  });

  it("round-trips non-default params through the URL", () => {
    const href = flowHref(AUTH_PATHS.mObywatel, { origin: "rejestracja", entry: "sytuacja", simulateError: true });
    expect(href).toBe("/logowanie/mobywatel?z=rejestracja&wejscie=sytuacja&blad=1");
    expect(readFlow(new URL(href, "http://x").searchParams)).toEqual({
      origin: "rejestracja",
      entry: "sytuacja",
      simulateError: true,
    });
  });

  it("ignores unknown values and takes the first of repeated params", () => {
    expect(readFlow({ z: "cokolwiek", blad: "tak", wejscie: ["sytuacja", "hero"] })).toEqual({
      origin: "logowanie",
      entry: "sytuacja",
      simulateError: false,
    });
  });

  it("goes back exactly one screen", () => {
    const fromRegister = readFlow({ z: "rejestracja", blad: "1" });
    expect(backHref("register", fromRegister)).toBe("/");
    expect(backHref("loginGov", fromRegister)).toBe("/rejestracja");
    expect(backHref("loginGov", readFlow({}))).toBe("/logowanie");
    // Powrót z kodu QR do wyboru metody nie przenosi symulowanego błędu.
    expect(backHref("mObywatel", fromRegister)).toBe("/logowanie/login-gov?z=rejestracja");
  });
});
