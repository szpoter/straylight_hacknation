import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/features/auth/auth-shell";
import { ZusAppCode } from "@/features/auth/ezus/zus-app-code";
import { backHref, readFlow, type SearchParams } from "@/features/auth/flow";
import { ArrowBackIcon } from "@/features/auth/service-icons";
import { SiteFooter } from "@/features/landing/site-footer";
import styles from "@/features/auth/ezus/ezus.module.css";

export const metadata: Metadata = {
  title: "Logowanie za pomocą aplikacji mobilnej ZUS · Przewodnik Rodzica (demo)",
};

// „Aplikacja mobilna ZUS” jak w eZUS. W demo nie prowadzi dalej, pasek podpowiada login.gov.pl.
export default async function ZusAppPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const flow = readFlow(await searchParams);

  return (
    <AuthShell
      className={`${styles.screen} ${styles.zusScreen}`}
      mainClassName={styles.zusMain}
      footer={<SiteFooter sectionBase="/" />}
      demoNote={
        <>
          Wersja demonstracyjna · <strong>ta metoda nie działa w demo</strong>, wróć i wybierz login.gov.pl
        </>
      }
    >
      <div className={styles.zusInner}>
        <Link href={backHref("zusApp", flow)} className={styles.back}>
          <ArrowBackIcon className={styles.backIcon} />
          Wróć
        </Link>
        <h1 className={styles.zusTitle}>Logowanie za pomocą aplikacji mobilnej ZUS</h1>
        <p className={styles.zusLead}>
          Masz wątpliwości lub pytania?{" "}
          <span className={styles.textLink} aria-disabled="true" title="Niedostępne w wersji demonstracyjnej">
            Przeczytaj instrukcję logowania
            <span className="visually-hidden"> (niedostępne w wersji demonstracyjnej)</span>
          </span>
        </p>
        <ZusAppCode />
      </div>
    </AuthShell>
  );
}
