import type { Metadata } from "next";
import { readFlow, type SearchParams } from "@/features/auth/flow";
import { GovMethods } from "@/features/auth/gov/gov-methods";
import { GovShell } from "@/features/auth/gov/gov-shell";

export const metadata: Metadata = {
  title: "Zaloguj się do usługi ZUS · Przewodnik Rodzica (demo)",
};

// Wybór sposobu logowania jak w login.gov.pl. Aktywna tylko „Aplikacja mObywatel”.
export default async function LoginGovPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const flow = readFlow(await searchParams);
  return (
    <GovShell
      demoNote={
        <>
          Wersja demonstracyjna · <strong>działa tylko „Aplikacja mObywatel”</strong>
        </>
      }
    >
      <GovMethods flow={flow} />
    </GovShell>
  );
}
