"use client";

import { useState } from "react";
import { ZusikEntrance, type ZusikEntranceObject } from "@/components/mascot/ZusikEntrance";

/** The three rows of the landing section "Poznaj Zusika": Zusik stands on the side it flows in from. */
const ROWS: { from: "left" | "right"; object: ZusikEntranceObject; title: string; body: string }[] = [
  {
    from: "right",
    object: "folder",
    title: "Zbiera dokumenty",
    body: "Zusik wpływa z prawej krawędzi i od razu zamienia się w teczkę.",
  },
  {
    from: "left",
    object: "pencil",
    title: "Wypełnia wniosek",
    body: "Z lewej krawędzi, prosto w ołówek, który pisze w stronę tekstu.",
  },
  {
    from: "right",
    object: "calculator",
    title: "Liczy zasiłek",
    body: "Z prawej krawędzi, prosto w kalkulator.",
  },
];

/** Demo of ZusikEntrance: three rows as on the landing page and a button that plays the entrance again. */
export function EntranceDemo() {
  const [play, setPlay] = useState(true);

  function replay() {
    // true → false resets at once; the next frame starts again
    setPlay(false);
    requestAnimationFrame(() => setPlay(true));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button type="button" onClick={replay} className="rounded-full bg-babelek-rim px-5 py-2 text-white">
          Odtwórz
        </button>
        <button
          type="button"
          onClick={() => setPlay(false)}
          className="rounded-full border border-slate-300 px-5 py-2"
        >
          Reset
        </button>
        <span className="text-sm text-slate-600">play = {String(play)}</span>
      </div>

      {ROWS.map((row) => (
        <section
          key={row.object}
          className={`flex flex-col items-center gap-8 border-t border-slate-200 py-10 lg:flex-row ${
            row.from === "left" ? "lg:flex-row-reverse" : ""
          }`}
        >
          <div className="max-w-md flex-1">
            <h2 className="text-2xl font-semibold">{row.title}</h2>
            <p className="mt-2 text-slate-600">{row.body}</p>
          </div>
          <div className="flex flex-1 justify-center">
            <ZusikEntrance from={row.from} object={row.object} play={play} />
          </div>
        </section>
      ))}
    </div>
  );
}
