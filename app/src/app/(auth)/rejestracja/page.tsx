import type { Metadata } from "next";
import Link from "next/link";
import { AuthScreen } from "@/features/auth/auth-shell";
import { AUTH_PATHS, backHref, flowHref, readFlow, type SearchParams } from "@/features/auth/flow";
import { BuildingIcon, ExternalIcon, InfoIcon, KeyIcon } from "@/features/auth/icons";
import { MethodLink, MethodList, MethodUnavailable } from "@/features/auth/methods";
import styles from "@/features/auth/auth.module.css";

export const metadata: Metadata = {
  title: "Załóż konto w eZUS · Przewodnik Rodzica (demo)",
};

const INFO = [
  {
    title: "Chcesz reprezentować firmę lub inną osobę?",
    text: "Najpierw załóż własne konto, a potem uzyskaj pełnomocnictwo albo profil płatnika.",
    href: "https://www.zus.pl/baza-wiedzy/o-portalu-pue-/pue-zus-obowiazek-zalozenia-profilu-dla-platnikow",
    link: "Profil płatnika w eZUS",
  },
  {
    title: "Jesteś asystentem medycznym w systemie RAM?",
    text: "Asystent wystawia e-ZLA w imieniu lekarza po wpisie do Rejestru Asystentów Medycznych.",
    href: "https://www.zus.pl/lekarze/zaswiadczenia-zus-zla/elektroniczne-zaswiadczenia-lekarskie-e-zla-dla-asystenta-medycznego",
    link: "e-ZLA dla asystenta medycznego",
  },
];

// Ekran 2: rejestracja. Kończy się tak samo jak logowanie, bez osobnego ekranu „konto założone”.
export default async function RegisterPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const flow = readFlow(await searchParams);

  return (
    <AuthScreen
      service="eZUS"
      title="Załóż konto w eZUS"
      lead="Wybierz, jak chcesz potwierdzić swoją tożsamość."
      back={{ href: backHref("register", flow), label: "Wróć do strony głównej" }}
    >
      <MethodList>
        <MethodLink
          href={flowHref(AUTH_PATHS.loginGov, { origin: "rejestracja", entry: flow.entry })}
          icon={<KeyIcon />}
          title="login.gov.pl"
          description="Potwierdzanie konta online za pomocą: profilu zaufanego, bankowości, aplikacji mObywatel, e-Dowodu lub eID"
          badge="Dostępne w demo"
        />
      </MethodList>

      <MethodList label="Inne metody">
        <MethodUnavailable
          icon={<BuildingIcon />}
          title="E-wizyta lub wizyta w placówce ZUS"
          description="Potwierdzanie konta eZUS podczas wideorozmowy z pracownikiem ZUS lub w placówce ZUS"
        />
      </MethodList>

      <ul className={styles.infoList}>
        {INFO.map((item) => (
          <li key={item.title} className={styles.info}>
            <InfoIcon className={styles.infoIcon} />
            <div>
              <p className={styles.infoTitle}>{item.title}</p>
              <p>
                {item.text}{" "}
                <a className={styles.textLink} href={item.href} target="_blank" rel="noopener noreferrer">
                  {item.link}
                  <ExternalIcon className={styles.externalIcon} />
                  <span className="visually-hidden"> (otwiera się w nowej karcie)</span>
                </a>
              </p>
            </div>
          </li>
        ))}
      </ul>

      <p className={styles.cardFooter}>
        Masz już konto?{" "}
        <Link className={styles.textLink} href={flowHref(AUTH_PATHS.login, { entry: flow.entry })}>
          Zaloguj się
        </Link>
      </p>
    </AuthScreen>
  );
}
