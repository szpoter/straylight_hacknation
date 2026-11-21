import type { Metadata } from "next";
import Link from "next/link";
import { AuthScreen } from "@/features/auth/auth-shell";
import { AUTH_PATHS, backHref, flowHref, readFlow, type SearchParams } from "@/features/auth/flow";
import { BankIcon, GlobeIcon, IdCardIcon, PhoneIcon, ShieldIcon } from "@/features/auth/icons";
import { MethodLink, MethodList, MethodUnavailable } from "@/features/auth/methods";
import styles from "@/features/auth/auth.module.css";

export const metadata: Metadata = {
  title: "Zaloguj się do usługi ZUS · Przewodnik Rodzica (demo)",
};

// Ekran 3: wybór metody w login.gov.pl. Aktywna tylko „Aplikacja mObywatel” z oznaczeniem „Polecany”.
export default async function LoginGovPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const flow = readFlow(await searchParams);
  const next = { origin: flow.origin, entry: flow.entry };

  return (
    <AuthScreen
      service="login.gov.pl"
      title="Zaloguj się do usługi ZUS"
      lead="Wybierz sposób, w jaki chcesz to zrobić."
      back={{ href: backHref("loginGov", flow) }}
    >
      <MethodList>
        <MethodLink
          href={flowHref(AUTH_PATHS.mObywatel, next)}
          icon={<PhoneIcon />}
          title="Aplikacja mObywatel"
          description="Zeskanuj kod QR w aplikacji na telefonie"
          badge="Polecany"
        />
      </MethodList>

      <MethodList label="Inne metody">
        <MethodUnavailable icon={<BankIcon />} title="Bankowość elektroniczna" />
        <MethodUnavailable icon={<IdCardIcon />} title="E-dowód" />
        <MethodUnavailable icon={<ShieldIcon />} title="Profil zaufany" />
        <MethodUnavailable icon={<GlobeIcon />} title="eID" description="Login z innego kraju Unii Europejskiej" />
      </MethodList>

      <Link className={styles.quietLink} href={flowHref(AUTH_PATHS.mObywatel, { ...next, simulateError: true })}>
        Przetestuj błąd pobierania danych
      </Link>
    </AuthScreen>
  );
}
