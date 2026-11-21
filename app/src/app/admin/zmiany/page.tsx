import type { Metadata } from "next";
import { ChangeView } from "@/features/admin/change-view";

export const metadata: Metadata = { title: "Przygotuj zmianę" };

export default async function Page({ searchParams }: { searchParams: Promise<{ parametr?: string | string[] }> }) {
  const { parametr } = await searchParams;
  const parameterId = Array.isArray(parametr) ? parametr[0] : parametr;
  // key resets the form state when switching parameters.
  return <ChangeView key={parameterId ?? "default"} parameterId={parameterId} />;
}
