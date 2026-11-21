import type { Metadata } from "next";
import { ChangeView } from "@/features/admin/change-view";
import { SPEC_PARAMETERS } from "@/features/admin/mock-data";
import { appParameters } from "@/lib/admin/catalog";
import { requireAdmin } from "@/lib/admin/server";

export const metadata: Metadata = { title: "Przygotuj zmianę" };

export default async function Page({ searchParams }: { searchParams: Promise<{ parametr?: string | string[] }> }) {
  await requireAdmin();
  const { parametr } = await searchParams;
  const parameterId = Array.isArray(parametr) ? parametr[0] : parametr;
  // key resets the form state when switching parameters.
  return (
    <ChangeView
      key={parameterId ?? "default"}
      parameters={[...appParameters(), ...SPEC_PARAMETERS]}
      parameterId={parameterId}
    />
  );
}
