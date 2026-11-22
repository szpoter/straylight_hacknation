import Link from "next/link";
import type { ReactNode } from "react";
import { AUTH_PATHS, flowHref, type Flow } from "../flow";
import {
  BankIcon,
  ChevronRightIcon,
  EDowodIcon,
  EuStarsIcon,
  LockIcon,
  PhoneOutlineIcon,
  TrustedProfileIcon,
} from "../service-icons";
import styles from "./gov.module.css";

// „Zaloguj się do usługi ZUS” w login.gov.pl. Działa tylko „Aplikacja mObywatel”,
// pozostałe sposoby są widoczne, ale zablokowane w wersji demonstracyjnej.

type MethodProps = { icon: ReactNode; title: string; description: string };

const OTHER_METHODS: MethodProps[] = [
  {
    icon: <BankIcon className={styles.iconBank} />,
    title: "Bankowość elektroniczna",
    description: "Zaloguj się za pomocą swojego banku.",
  },
  {
    icon: <EDowodIcon className={styles.iconEdowod} />,
    title: "E-dowód",
    description: "Użyj dowodu osobistego z warstwą elektroniczną i smartfona lub czytnika NFC.",
  },
  {
    icon: <TrustedProfileIcon className={styles.iconTrusted} />,
    title: "Profil zaufany",
    description: "Użyj loginu i hasła lub bankowości elektronicznej.",
  },
  {
    icon: <EuStarsIcon className={styles.iconEu} />,
    title: "eID",
    description: "Choose your country to sign in with your eID.",
  },
];

export function GovMethods({ flow }: { flow: Flow }) {
  const next = { origin: flow.origin, entry: flow.entry };

  return (
    <>
      <h1 className={styles.title}>Zaloguj się do usługi ZUS</h1>

      <h2 className={styles.groupLabel} id="ostatnio">
        Ostatnio wybrany sposób logowania
      </h2>
      <ul className={styles.methods} aria-labelledby="ostatnio">
        <li>
          <Link className={styles.method} href={flowHref(AUTH_PATHS.mObywatel, next)}>
            <span className={styles.methodIcon}>
              <PhoneOutlineIcon className={styles.iconPhone} />
            </span>
            <span className={styles.methodText}>
              <span className={styles.methodTitle}>
                Aplikacja mObywatel <span className={styles.recommended}>Polecany</span>
              </span>
              <span className={styles.methodSub}>Skanuj kod QR za pomocą aplikacji mObywatel.</span>
            </span>
            <ChevronRightIcon className={styles.chevron} />
          </Link>
        </li>
      </ul>

      <h2 className={styles.groupLabel} id="pozostale">
        Pozostałe sposoby logowania
      </h2>
      <ul className={styles.methods} aria-labelledby="pozostale">
        {OTHER_METHODS.map((method) => (
          <li key={method.title}>
            <div className={styles.method} aria-disabled="true" title="Niedostępne w wersji demonstracyjnej">
              <span className={styles.methodIcon}>{method.icon}</span>
              <span className={styles.methodText}>
                <span className={styles.methodTitle}>{method.title}</span>
                <span className={styles.methodSub}>
                  {method.description}
                  <span className="visually-hidden"> Niedostępne w wersji demonstracyjnej.</span>
                </span>
              </span>
              <LockIcon className={styles.lock} />
            </div>
          </li>
        ))}
      </ul>

      {/* Wymóg ui/NIKODEM.md: wariant z błędem pobierania danych do pokazania w demo */}
      <Link className={styles.errorTest} href={flowHref(AUTH_PATHS.mObywatel, { ...next, simulateError: true })}>
        Przetestuj błąd pobierania danych
      </Link>
    </>
  );
}
