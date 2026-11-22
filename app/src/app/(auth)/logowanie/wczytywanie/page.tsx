import type { Metadata } from "next";
import { AuthShell } from "@/features/auth/auth-shell";
import { readFlow, type SearchParams } from "@/features/auth/flow";
import { LoadingPanel } from "@/features/auth/loading-panel";

export const metadata: Metadata = {
  title: "Wczytujemy dane z ZUS · Przewodnik Rodzica (demo)",
};

// Ekran 5: wczytanie przykładowych danych z ZUS, z sukcesem albo symulowanym błędem.
export default async function LoadingPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const flow = readFlow(await searchParams);
  return (
    <AuthShell>
      <LoadingPanel flow={flow} />
    </AuthShell>
  );
}
