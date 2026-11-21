import type { Metadata } from "next";
import { AuthScreen } from "@/features/auth/auth-shell";
import { backHref, readFlow, type SearchParams } from "@/features/auth/flow";
import { MObywatelPanel } from "@/features/auth/mobywatel-panel";

export const metadata: Metadata = {
  title: "Aplikacja mObywatel · Przewodnik Rodzica (demo)",
};

// Ekran 4: kod QR, pięć kroków, licznik i „Symuluj zeskanowanie kodu”.
export default async function MObywatelPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const flow = readFlow(await searchParams);

  return (
    <AuthScreen
      service="login.gov.pl"
      title="Aplikacja mObywatel"
      lead="Zeskanuj kod QR w aplikacji mObywatel, żeby zalogować się do usługi ZUS."
      back={{ href: backHref("mObywatel", flow) }}
      wide
    >
      <MObywatelPanel flow={flow} />
    </AuthScreen>
  );
}
