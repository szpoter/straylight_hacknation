import type { Metadata } from "next";
import Link from "next/link";
import { ZusikMockup } from "./ZusikMockup";

export const metadata: Metadata = { title: "Zusik: makieta stanów" };

export default function ZusikMockupPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <Link href="/mascot" className="text-sm text-slate-600 underline">
            ← Podgląd maskotki
          </Link>
          <h1 className="text-2xl font-semibold">Zusik w aplikacji: makieta stanów</h1>
          <p className="text-slate-600">
            Wybierz stan po lewej. Część z nich to krótkie scenariusze, np. „Pole widoczne” kończy się zapisem i
            potwierdzeniem.
          </p>
        </header>
        <ZusikMockup />
      </div>
    </main>
  );
}
