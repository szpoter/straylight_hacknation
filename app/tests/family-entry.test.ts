import { describe, expect, it, vi } from "vitest";
import { EzusMethods } from "@/features/auth/ezus/ezus-methods";
import { GovShell } from "@/features/auth/gov/gov-shell";
import { AuthShell } from "@/features/auth/auth-shell";
import register from "@/app/(auth)/rejestracja/page";
import loginGov from "@/app/(auth)/logowanie/login-gov/page";
import mObywatel from "@/app/(auth)/logowanie/mobywatel/page";
import loading from "@/app/(auth)/logowanie/wczytywanie/page";
import conversation from "@/app/(parent)/app/rozmowa/page";
import { ImportConversation } from "@/features/chat/import-conversation";
import { PlanConversation } from "@/features/chat/case-chat-window";
import { SicknessWorkspace } from "@/features/sickness/workspace";
import { KamilWorkspace } from "@/features/kamil/workspace";

describe("production entry points", () => {
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
    [undefined, ImportConversation],
    ["1", PlanConversation],
    ["kamil", KamilWorkspace],
    ["chorobowe", SicknessWorkspace],
  ] as const)("renders the production conversation for history %s", async (historia, component) => {
    vi.stubEnv("VERCEL_ENV", "production");
    try {
      const screen = await conversation({ searchParams: Promise.resolve({ historia }) });
      expect(screen.type).toBe(component);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
