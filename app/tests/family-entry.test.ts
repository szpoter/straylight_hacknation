import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import login from "@/app/(auth)/logowanie/page";
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

vi.mock("next/navigation", async (importOriginal) => ({
  ...await importOriginal<typeof import("next/navigation")>(),
  useRouter: () => ({ replace: vi.fn() }),
}));
vi.mock("next/image", () => ({ default: () => null }));

describe("single family entry points", () => {
  it.each([
    ["login", login, "Importuj dane i otwórz plan"],
    ["registration", register, "/logowanie/login-gov?z=rejestracja"],
    ["login.gov.pl", loginGov, "/logowanie/mobywatel"],
    ["mObywatel", mObywatel, "Zasymuluj zeskanowanie kodu QR"],
    ["loading family data", loading, "Wczytujemy przykładowe dane z ZUS"],
  ] as const)("serves %s using simulated data", async (_, page, content) => {
    const html = renderToStaticMarkup(await page({ searchParams: Promise.resolve({}) }));
    expect(html).toContain(content);
    expect(html).toContain("Wersja demonstracyjna");
    expect(html).not.toMatch(/<input\b/);
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
