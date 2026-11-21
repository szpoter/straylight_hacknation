import type { Metadata } from "next";
import { EntranceDemo } from "./EntranceDemo";

export const metadata: Metadata = { title: "Zusik: wejście jako kropla" };

/** Demo page of ZusikEntrance. Horizontal overflow is clipped, as on the landing page, because the drop starts off screen. */
export default function EntrancePage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-white px-4 py-10 text-slate-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header>
          <h1 className="text-2xl font-semibold">Zusik: wejście jako kropla</h1>
          <p className="text-slate-600">
            Zusik wpływa od krawędzi ekranu jako kropla i w chwili zatrzymania od razu przepływa w przedmiot, bez
            pośredniej postaci bańki (components/mascot/ZusikEntrance.tsx).
          </p>
        </header>
        <EntranceDemo />
      </div>
    </main>
  );
}
