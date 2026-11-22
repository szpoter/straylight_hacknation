import type { Metadata } from "next";
import { EzusMethods } from "@/features/auth/ezus/ezus-methods";
import { readFlow, type SearchParams } from "@/features/auth/flow";

export const metadata: Metadata = {
  title: "Zaloguj się do eZUS · Przewodnik Rodzica (demo)",
};

// Ekran 1: dwie metody jak w eZUS. Dalej prowadzi tylko login.gov.pl.
export default async function LoginPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const flow = readFlow(await searchParams);
  return <EzusMethods flow={{ ...flow, origin: "logowanie" }} title="Zaloguj się do eZUS" />;
}
