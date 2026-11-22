import type { Metadata } from "next";
import Link from "next/link";
import { backHref, readFlow, type SearchParams } from "@/features/auth/flow";
import { GovShell } from "@/features/auth/gov/gov-shell";
import { MObywatelCode } from "@/features/auth/gov/mobywatel-code";
import { ArrowBackIcon } from "@/features/auth/service-icons";
import styles from "@/features/auth/gov/gov.module.css";

export const metadata: Metadata = {
  title: "Aplikacja mObywatel · Przewodnik Rodzica (demo)",
};

// Kod QR, licznik i pięć kroków jak w login.gov.pl. Skanowanie symuluje kliknięcie w kod albo Spacja.
export default async function MObywatelPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const flow = readFlow(await searchParams);

  return (
    <GovShell
      demoNote={
        <>
          Wersja demonstracyjna · <strong>kliknij kod QR</strong> albo naciśnij Spację, żeby zasymulować skanowanie
        </>
      }
    >
      <Link href={backHref("mObywatel", flow)} className={styles.back}>
        <ArrowBackIcon className={styles.backIcon} />
        Wróć
      </Link>
      <h1 className={styles.title}>Aplikacja mObywatel</h1>
      <p className={styles.lead}>Aby potwierdzić swoją tożsamość, zeskanuj kod QR za pomocą aplikacji mObywatel:</p>
      <MObywatelCode flow={flow} />
    </GovShell>
  );
}
