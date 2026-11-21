import type { Metadata } from "next";
import Link from "next/link";
import { HeroScrollDemo } from "./HeroScrollDemo";

export const metadata: Metadata = { title: "Bąbelek: hero ze scrollem" };

export default function HeroDemoPage() {
  return (
    <main className="bg-white text-slate-900">
      <HeroScrollDemo />
      <section className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-24">
        <h2 className="text-2xl font-semibold">Dalsza treść strony</h2>
        <p className="text-slate-600">
          Tu kończy się sekcja hero. Przewiń w górę, a Bąbelek popłynie z powrotem na lewą stronę.
        </p>
        <Link href="/mascot" className="text-sm text-slate-600 underline">
          ← Podgląd maskotki
        </Link>
      </section>
    </main>
  );
}
