"use client";

import { useEffect, useState } from "react";
import { Babelek } from "@/components/mascot/Babelek";
import type { ZusikState } from "@/components/mascot/types";

const ROWS = [
  { state: "writing", label: "Ołówek (writing)" },
  { state: "calculating", label: "Kalkulator (calculating)" },
] as const satisfies readonly { state: ZusikState; label: string }[];

/** How long the state is left for "available" when entering it again through a state change. */
const AWAY_SECONDS = 1;

/** The pencil and the calculator with `once`, next to the same states looping, with ways to play the work again. */
export function OnceDemo() {
  // a new key mounts the `once` mascots again; `away` leaves the state for a moment and comes back
  const [mount, setMount] = useState(0);
  const [away, setAway] = useState(false);

  useEffect(() => {
    if (!away) return;
    const back = setTimeout(() => setAway(false), AWAY_SECONDS * 1000);
    return () => clearTimeout(back);
  }, [away]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setMount((n) => n + 1)}
          className="rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white"
        >
          Odtwórz ponownie
        </button>
        <button
          type="button"
          onClick={() => setAway(true)}
          disabled={away}
          className="rounded-full px-5 py-2 text-sm font-medium ring-1 ring-slate-300 disabled:opacity-50"
        >
          Wejdź w stan jeszcze raz (przez „available”)
        </button>
      </div>

      {ROWS.map(({ state, label }) => (
        <section key={state} className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">{label}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <figure className="flex flex-col items-center gap-2 rounded-lg bg-slate-50 p-4" data-demo={`${state}-once`}>
              <Babelek key={mount} animated once state={away ? "available" : state} size={256} title={`Zusik: ${label}, raz`} />
              <figcaption className="text-sm text-slate-600">once: praca raz, potem spokój</figcaption>
            </figure>
            <figure className="flex flex-col items-center gap-2 rounded-lg bg-slate-50 p-4" data-demo={`${state}-loop`}>
              <Babelek animated state={away ? "available" : state} size={256} title={`Zusik: ${label}, w pętli`} />
              <figcaption className="text-sm text-slate-600">bez once: praca w pętli (jak dotąd)</figcaption>
            </figure>
          </div>
        </section>
      ))}
    </div>
  );
}
