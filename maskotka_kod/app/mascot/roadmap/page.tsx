import type { Metadata } from "next";
import Link from "next/link";
import { RoadmapDemo } from "./RoadmapDemo";

export const metadata: Metadata = { title: "Bąbelek: roadmapa" };

export default function RoadmapDemoPage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 text-slate-900">
      <div className="mx-auto flex max-w-4xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <Link href="/mascot" className="text-sm text-slate-600 underline">
            ← Podgląd maskotki
          </Link>
          <h1 className="text-2xl font-semibold">Roadmapa</h1>
          <p className="text-slate-600">
            Bąbelek stoi przy bieżącym kroku. Kliknij inny krok albo „Dalej”: zamienia się w kroplę, płynie i ląduje.
          </p>
        </header>
        <RoadmapDemo />
      </div>
    </main>
  );
}
