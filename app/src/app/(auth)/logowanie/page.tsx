import type { Metadata } from "next";
import Link from "next/link";
import { AuthScreen } from "@/features/auth/auth-shell";
import { AUTH_PATHS, backHref, flowHref, readFlow, type SearchParams } from "@/features/auth/flow";
import { KeyIcon, LockIcon, PhoneQrIcon } from "@/features/auth/icons";
import { MethodLink, MethodList, MethodUnavailable } from "@/features/auth/methods";
import styles from "@/features/auth/auth.module.css";

export const metadata: Metadata = {
  title: "Zaloguj się do eZUS · Przewodnik Rodzica (demo)",
};

// Ekran 1: „Zaloguj się do eZUS”. Aktywna tylko metoda login.gov.pl.
export default async function LoginPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const flow = readFlow(await searchParams);

  return (
    <AuthScreen
      service="eZUS"
      title="Zaloguj się do eZUS"
      lead="Wybierz metodę logowania do konta w eZUS."
      back={{ href: backHref("login", flow), label: "Wróć do strony głównej" }}
    >
      <MethodList>
        <MethodLink
          href={flowHref(AUTH_PATHS.loginGov, { origin: "logowanie", entry: flow.entry })}
          icon={<KeyIcon />}
          title="login.gov.pl"
          description="Profil zaufany, bankowość, mObywatel, e-Dowód lub eID"
          badge="Dostępne w demo"
        />
      </MethodList>

      <MethodList label="Inne metody">
        <MethodUnavailable
          icon={<PhoneQrIcon />}
          title="Aplikacja mobilna ZUS"
          description="Skanuj kod QR za pomocą aplikacji mobilnej"
        />
        <MethodUnavailable icon={<LockIcon />} title="Login i hasło">
          <span className={styles.fields}>
            <label className={styles.field}>
              Login
              <input className={styles.input} type="text" disabled placeholder="Login lub e-mail" />
            </label>
            <label className={styles.field}>
              Hasło
              <input className={styles.input} type="password" disabled placeholder="Hasło" />
            </label>
          </span>
        </MethodUnavailable>
      </MethodList>

      <p className={styles.cardFooter}>
        Nie masz konta w eZUS?{" "}
        <Link className={styles.textLink} href={flowHref(AUTH_PATHS.register, { entry: flow.entry })}>
          Zarejestruj się
        </Link>
      </p>
    </AuthScreen>
  );
}
