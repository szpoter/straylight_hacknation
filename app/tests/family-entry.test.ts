import { describe, expect, it } from "vitest";
import { EzusMethods } from "@/features/auth/ezus/ezus-methods";
import { GovShell } from "@/features/auth/gov/gov-shell";
import { AuthShell } from "@/features/auth/auth-shell";
import register from "@/app/(auth)/rejestracja/page";
import loginGov from "@/app/(auth)/logowanie/login-gov/page";
import mObywatel from "@/app/(auth)/logowanie/mobywatel/page";
import loading from "@/app/(auth)/logowanie/wczytywanie/page";
import onboarding from "@/app/(parent)/start/page";
import sickness from "@/app/(parent)/app/chorobowe/page";
import kamil from "@/app/(parent)/app/kamil/page";
import kamilChat from "@/app/(parent)/zusik/kamil/page";
import sampleCase from "@/app/(parent)/(tabs)/profil/sprawa-testowa/page";
import connections from "@/app/demo/polaczenia/page";

describe("single family entry points", () => {
  it.each([
    ["registration", register, EzusMethods],
    ["login.gov.pl", loginGov, GovShell],
    ["mObywatel", mObywatel, GovShell],
    ["loading external data", loading, AuthShell],
  ] as const)("renders the %s screen", async (_, page, component) => {
    const screen = await page({ searchParams: Promise.resolve({}) });
    expect(screen.type).toBe(component);
  });

  it.each([
    ["onboarding", onboarding, "/plan"],
    ["sickness case", sickness, "/plan"],
    ["Kamil", kamil, "/plan"],
    ["Kamil chat", kamilChat, "/plan"],
    ["sample case", sampleCase, "/profil"],
    ["demo connections", connections, "/plan"],
  ] as const)("redirects %s to the family", (_, page, destination) => {
    expect(page).toThrow(expect.objectContaining({ digest: `NEXT_REDIRECT;replace;${destination};307;` }));
  });
});
