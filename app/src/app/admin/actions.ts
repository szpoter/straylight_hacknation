"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE, ADMIN_SESSION_SECONDS, checkCredentials, encodeAdminSession } from "@/lib/admin/auth";
import { adminConfig, adminCookieOptions, nowSeconds } from "@/lib/admin/server";
import type { LoginState } from "@/features/admin/login-view";
import { ConfigError } from "@/lib/zusik/config";

const FAILURE_DELAY_MS = 600;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function signIn(_prev: LoginState | undefined, formData: FormData): Promise<LoginState> {
  const login = String(formData.get("login") ?? "").slice(0, 200);
  const password = String(formData.get("password") ?? "").slice(0, 500);

  if (!login.trim() || !password) {
    return { login, error: "Wpisz login i hasło." };
  }

  let config: ReturnType<typeof adminConfig>;
  try {
    config = adminConfig();
  } catch (error) {
    if (error instanceof ConfigError) {
      // Name only goes to the server log; visitors get a generic message.
      console.error(`[admin] sign-in unavailable, missing ${error.variable}`);
      return { login, error: "Logowanie jest chwilowo niedostępne. Skontaktuj się z administratorem systemu." };
    }
    throw error;
  }

  if (!checkCredentials(login, password, config)) {
    // Slows down guessing; a shared rate limit needs a store and comes with the backend.
    await sleep(FAILURE_DELAY_MS);
    return { login, error: "Nieprawidłowy login lub hasło." };
  }

  const token = encodeAdminSession(config.login, nowSeconds() + ADMIN_SESSION_SECONDS, config.secret);
  (await cookies()).set(ADMIN_COOKIE, token, adminCookieOptions());
  redirect("/admin/reguly");
}

export async function signOut(): Promise<void> {
  (await cookies()).set(ADMIN_COOKIE, "", adminCookieOptions(0));
  redirect("/admin");
}
