"use client";

import { useActionState, useState } from "react";
import s from "./login.module.css";

export interface LoginState {
  error?: string;
  login?: string;
}

export type SignInAction = (prev: LoginState | undefined, formData: FormData) => Promise<LoginState>;

interface LoginViewProps {
  signInAction: SignInAction;
  /** Demo credentials filled in on load, so signing in takes one click. */
  prefill?: { login: string; password: string } | null;
}

export function LoginView({ signInAction, prefill }: LoginViewProps) {
  const [state, formAction, pending] = useActionState<LoginState | undefined, FormData>(signInAction, undefined);
  const [showPassword, setShowPassword] = useState(false);
  const failed = Boolean(state?.error);

  return (
    <div className={s.page}>
      <main className={s.column}>
        <header className={s.header}>
          <h1 className={s.headline}>Panel Administratora</h1>
        </header>

        <div className={s.card}>
          <p className={s.eyebrow}>Logowanie administratora</p>
          <h2 className={s.title}>Zaloguj się</h2>
          <p className={s.intro}>Użyj loginu i hasła nadanych przez administratora systemu.</p>

          <form action={formAction} className={s.form} noValidate>
            <label className={s.field}>
              <span className={s.label}>Login</span>
              <input
                className={s.input}
                name="login"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                defaultValue={state?.login ?? prefill?.login ?? ""}
                aria-invalid={failed}
                aria-describedby={failed ? "login-error" : undefined}
                required
                autoFocus={!prefill}
              />
            </label>

            <div className={s.field}>
              <label className={s.label} htmlFor="admin-password">
                Hasło
              </label>
              <div className={s.inputWrap}>
                <input
                  id="admin-password"
                  className={`${s.input} ${s.inputWithToggle}`}
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  defaultValue={prefill?.password}
                  aria-invalid={failed}
                  aria-describedby={failed ? "login-error" : undefined}
                  required
                />
                <button
                  type="button"
                  className={s.toggle}
                  aria-pressed={showPassword}
                  aria-controls="admin-password"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? "Ukryj" : "Pokaż"}
                </button>
              </div>
            </div>

            {state?.error ? (
              <p id="login-error" className={s.error} role="alert">
                {state.error}
              </p>
            ) : null}

            <button type="submit" className={s.submit} disabled={pending} autoFocus={Boolean(prefill)}>
              {pending ? "Logowanie…" : "Zaloguj się"}
            </button>
          </form>

        </div>
      </main>
    </div>
  );
}
