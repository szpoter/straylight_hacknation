import type { Metadata } from "next";
import Link from "next/link";
import { OnceDemo } from "./OnceDemo";

export const metadata: Metadata = { title: "Zusik: praca jeden raz (once)" };

export default function OncePage() {
  return (
    <main className="min-h-screen bg-white px-4 py-10 text-slate-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-2">
          <Link href="/mascot" className="text-sm text-slate-600 underline">
            ← Podgląd maskotki
          </Link>
          <h1 className="text-2xl font-semibold">Praca jeden raz: prop once</h1>
          <p className="text-slate-600">
            Z <code>once</code> ołówek kreśli trzy szybkie kreski i staje, a kalkulator przelicza raz i zostawia
            wynik. Potem Zusik już tylko mruga. Obok to samo bez <code>once</code>: praca trwa, dopóki trwa stan.
          </p>
        </header>
        <OnceDemo />
      </div>
    </main>
  );
}
