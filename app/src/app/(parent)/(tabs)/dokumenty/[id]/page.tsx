import { CaseDetail } from "@/features/documents/CaseDetail";

export const metadata = { title: "Sprawa · Dokumenty i wnioski · Zusik" };

export default async function CasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CaseDetail id={id} />;
}
