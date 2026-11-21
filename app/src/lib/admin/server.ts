import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { requireEnv } from "@/lib/zusik/config";
import { ADMIN_COOKIE, ADMIN_SESSION_SECONDS, decodeAdminSession } from "./auth";

/**
 * Server-only wiring for the admin sign-in. Access to every panel page is checked here (SPEC §10).
 * ADMIN_LOGIN and ADMIN_PASSWORD_HASH are assigned by the operator; SESSION_SIGNING_SECRET is shared
 * with the Zusik session, with a separate signing prefix.
 */
export function adminConfig() {
  return {
    login: requireEnv("ADMIN_LOGIN"),
    passwordHash: requireEnv("ADMIN_PASSWORD_HASH"),
    secret: requireEnv("SESSION_SIGNING_SECRET"),
  };
}

/**
 * Demo only: when ADMIN_DEMO_PASSWORD is set, /admin pre-fills the sign-in form so the jury can enter with
 * one click. The password is still checked against ADMIN_PASSWORD_HASH. Unset it to turn the demo off.
 */
export function adminDemoPrefill(): { login: string; password: string } | null {
  const login = process.env.ADMIN_LOGIN?.trim();
  const password = process.env.ADMIN_DEMO_PASSWORD;
  return login && password ? { login, password } : null;
}

export const nowSeconds = () => Math.floor(Date.now() / 1000);

export function adminCookieOptions(maxAge = ADMIN_SESSION_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/admin",
    maxAge,
  };
}

/** The signed-in admin login, or null. Memoised per request. */
export const getAdmin = cache(async (): Promise<string | null> => {
  let secret: string;
  try {
    secret = requireEnv("SESSION_SIGNING_SECRET");
  } catch {
    return null;
  }
  const raw = (await cookies()).get(ADMIN_COOKIE)?.value;
  return decodeAdminSession(raw, secret, nowSeconds());
});

/** Call at the top of every panel page: without a valid session the visitor goes to the sign-in. */
export async function requireAdmin(): Promise<string> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin");
  return admin;
}
