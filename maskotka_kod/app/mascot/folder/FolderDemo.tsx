"use client";

import { useState } from "react";
import { Babelek } from "@/components/mascot/Babelek";
import type { ZusikState } from "@/components/mascot/types";

const BUTTON = "rounded-full border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100 aria-pressed:bg-slate-900 aria-pressed:text-white";

/**
 * Zusik w stanie "folder". „Odtwórz ponownie” montuje maskotkę od nowa, więc teczka formuje się
 * z bąbelka i jeszcze raz uchyla okładkę. Przełącznik pokazuje przepływ available ↔ folder.
 */
export function FolderDemo() {
  const [state, setState] = useState<ZusikState>("folder");
  const [mount, setMount] = useState(0);

  return (
    <div className="flex flex-col items-center gap-6">
      <Babelek key={mount} animated state={state} size={320} title="Zusik jako teczka" />
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          className={BUTTON}
          onClick={() => {
            setState("folder");
            setMount((count) => count + 1);
          }}
        >
          Odtwórz ponownie
        </button>
        <div role="group" aria-label="Stan Zusika" className="flex gap-2">
          {(["available", "folder"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={state === value}
              className={BUTTON}
              onClick={() => setState(value)}
            >
              {value}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
