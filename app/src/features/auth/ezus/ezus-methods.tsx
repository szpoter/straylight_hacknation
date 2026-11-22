import Link from "next/link";
import { SiteFooter } from "@/features/landing/site-footer";
import { AuthShell } from "../auth-shell";
import { AUTH_PATHS, flowHref, type Flow } from "../flow";
import { ChevronRightIcon, LoginGovIcon, PhoneOutlineIcon } from "../service-icons";
import styles from "./ezus.module.css";

// Ekran po „Zaloguj się” i „Zarejestruj się”: tylko dwie metody, jak na zrzucie z eZUS, i stopka.
// Obie ścieżki wyglądają tak samo, różni je tylko parametr z= w adresie (koniec jest wspólny).
export function EzusMethods({ flow, title }: { flow: Flow; title: string }) {
  const keep = { origin: flow.origin, entry: flow.entry };

  return (
    <AuthShell className={styles.screen} mainClassName={styles.methodsMain} footer={<SiteFooter sectionBase="/" />}>
      <h1 className="visually-hidden">{title}</h1>
      <ul className={styles.methods}>
        <li>
          <Link className={styles.method} href={flowHref(AUTH_PATHS.zusApp, keep)}>
            <span className={styles.methodIcon}>
              <PhoneOutlineIcon className={styles.phoneIcon} />
            </span>
            <span className={styles.methodText}>
              <span className={styles.methodTitle}>Aplikacja mobilna ZUS</span>
              <span className={styles.methodSub}>Skanuj kod QR za pomocą aplikacji mobilnej</span>
            </span>
            <ChevronRightIcon className={styles.chevron} />
          </Link>
        </li>
        <li>
          <Link className={styles.method} href={flowHref(AUTH_PATHS.loginGov, keep)}>
            <span className={styles.methodIcon}>
              <LoginGovIcon className={styles.loginGovIcon} />
            </span>
            <span className={styles.methodText}>
              <span className={styles.methodTitle}>login.gov.pl</span>
              <span className={styles.methodSub}>Profil zaufany, bankowość, mObywatel, e-Dowód lub eID</span>
            </span>
            <ChevronRightIcon className={styles.chevron} />
          </Link>
        </li>
      </ul>
    </AuthShell>
  );
}
