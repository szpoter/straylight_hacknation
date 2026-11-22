import type { Metadata } from "next";
import { EzusMethods } from "@/features/auth/ezus/ezus-methods";
import { readFlow, type SearchParams } from "@/features/auth/flow";

export const metadata: Metadata = {
  title: "Załóż konto w eZUS · Przewodnik Rodzica (demo)",
};

// Rejestracja wygląda tak samo jak logowanie i kończy się w tym samym miejscu.
export default async function RegisterPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const flow = readFlow(await searchParams);
  return <EzusMethods flow={{ ...flow, origin: "rejestracja" }} title="Załóż konto w eZUS" />;
}
